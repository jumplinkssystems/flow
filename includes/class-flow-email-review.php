<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Free email-invite reviews: assign, authorize, notify, and enrich payloads.
 * Pro multi-reviewer reuses the same invite table for additional emails.
 */
class Email_Review {

	/** Sentinel option value in reviewer lists (not a WP user id). */
	const SENTINEL_OPTION = 'email';

	public function boot(): void {
		( new Email_Review_Link() )->boot();

		add_filter( 'flow_ew_allow_anonymous_review_access', [ $this, 'allow_anonymous_access' ], 10, 2 );
		add_filter( 'flow_ew_user_can_view_review_preview', [ $this, 'allow_preview_when_invite' ], 10, 3 );
		add_filter( 'flow_ew_rest_anonymous_access', [ $this, 'allow_rest_anonymous' ], 10, 3 );
		add_filter( 'flow_ew_prepare_review_response', [ $this, 'expose_invite_on_response' ], 5, 2 );
		add_filter( 'flow_ew_review_page_data', [ $this, 'inject_review_page_data' ], 10, 2 );

		add_action( 'flow_ew_review_cancelled', [ $this, 'on_review_cancelled' ], 10, 3 );
		add_action( 'flow_ew_review_approved', [ $this, 'on_review_approved' ], 5, 3 );
		add_action( 'flow_ew_changes_requested', [ $this, 'on_review_changes_requested' ], 5, 3 );
		add_action( 'flow_ew_approval_revoked', [ $this, 'on_review_approval_revoked' ], 5, 3 );
		add_action( 'flow_ew_review_resubmitted', [ $this, 'on_review_resubmitted' ], 10, 3 );
		add_action( 'flow_ew_review_sent', [ $this, 'on_review_sent_bump_status' ], 5, 3 );

		add_action( 'rest_api_init', [ $this, 'register_routes' ] );
	}

	public function register_routes(): void {
		register_rest_route(
			'flow/v1',
			'/reviews/(?P<id>\d+)/invite-identity',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'save_invite_identity' ],
				'permission_callback' => [ $this, 'invite_identity_permissions' ],
				'args'                => [
					'id'   => [
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					],
					'name' => [
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
						'default'           => '',
					],
				],
			]
		);
	}

	/**
	 * Assign a single email invite on Free (replaces any prior invite + clears WP reviewer).
	 *
	 * @throws \InvalidArgumentException When email invalid.
	 * @throws \RuntimeException When persistence fails.
	 */
	public static function assign_invite( int $post_id, string $email, int $requester_id ): int {
		$email = Email_Review_Invites_DB::normalize_email( $email );
		if ( '' === $email || ! is_email( $email ) ) {
			throw new \InvalidArgumentException( esc_html__( 'Please enter a valid email address.', 'jumplinks-editorial-workflow' ) );
		}

		// Same invite already on the active review — no-op. Re-POSTing used to
		// call Review::request(..., 0) and reset status to pending.
		$existing = DB::get_active_review( $post_id );
		if ( $existing ) {
			$invites = Email_Review_Invites_DB::get_for_review( (int) $existing->id );
			foreach ( $invites as $invite ) {
				$current = Email_Review_Invites_DB::normalize_email( (string) ( $invite->email ?? '' ) );
				if ( $current === $email ) {
					return (int) $existing->id;
				}
			}
		}

		$review_id = Review::request( $post_id, 0, $requester_id );
		$row       = Email_Review_Invites_DB::replace_with_one( $review_id, $email );
		if ( ! $row ) {
			throw new \RuntimeException( esc_html__( 'Failed to save email invite.', 'jumplinks-editorial-workflow' ) );
		}

		delete_post_meta( $post_id, '_flow_reviewer_id' );
		do_action( 'flow_ew_email_invite_assigned', $review_id, $post_id, $email, $requester_id );

		return $review_id;
	}

	/**
	 * Current invite row for this request when the session cookie matches the review.
	 */
	public static function current_invite_for_review( int $review_id ): ?object {
		$session = Email_Review_Cookie::verify_from_request();
		if ( ! $session || (int) $session['review_id'] !== $review_id ) {
			return null;
		}
		$row = Email_Review_Invites_DB::get_by_jti( (string) $session['jti'] );
		if ( ! $row || (int) $row->review_id !== $review_id ) {
			return null;
		}
		// Slide the session freshness window while the invitee is active.
		Email_Review_Cookie::refresh_session(
			$review_id,
			(string) $row->cookie_jti,
			(int) $row->token_version
		);
		return $row;
	}

	public static function has_invite_session_for_review( int $review_id ): bool {
		return null !== self::current_invite_for_review( $review_id );
	}

	/**
	 * Whether the current request may take reviewer actions (approve / changes) via invite cookie.
	 */
	public static function can_invite_take_action( object $review ): bool {
		return null !== self::current_invite_for_review( (int) $review->id );
	}

	public function allow_anonymous_access( bool $allow, $review ): bool {
		if ( $allow || ! is_object( $review ) ) {
			return $allow;
		}
		return self::has_invite_session_for_review( (int) $review->id );
	}

	public function allow_preview_when_invite( bool $allowed, $review, int $user_id ): bool {
		unset( $user_id );
		if ( $allowed || ! is_object( $review ) ) {
			return $allowed;
		}
		return self::has_invite_session_for_review( (int) $review->id );
	}

	/**
	 * Allow anonymous REST for comment create + approve/request-changes/revoke when invite cookie is valid.
	 */
	public function allow_rest_anonymous( bool $allow, $review, \WP_REST_Request $request ): bool {
		if ( $allow || ! is_object( $review ) ) {
			return $allow;
		}
		if ( ! self::has_invite_session_for_review( (int) $review->id ) ) {
			return $allow;
		}

		$route  = (string) $request->get_route();
		$method = strtoupper( (string) $request->get_method() );

		if ( 'POST' === $method && preg_match( '#/reviews/\d+/comments$#', $route ) ) {
			return true;
		}
		if ( 'POST' === $method && preg_match( '#/reviews/\d+/(approve|request-changes|revoke-approval)$#', $route ) ) {
			return true;
		}
		if ( 'POST' === $method && preg_match( '#/reviews/\d+/invite-identity$#', $route ) ) {
			return true;
		}
		if ( 'GET' === $method && preg_match( '#/reviews/\d+/mentionable-users$#', $route ) ) {
			return true;
		}
		return $allow;
	}

	/**
	 * @param array<string,mixed> $data
	 * @return array<string,mixed>
	 */
	public function expose_invite_on_response( array $data, $review ): array {
		if ( ! is_object( $review ) ) {
			return $data;
		}
		$invites = Email_Review_Invites_DB::get_for_review( (int) $review->id );
		if ( empty( $invites ) ) {
			return $data;
		}

		$payloads = array_map(
			[ Email_Review_Invites_DB::class, 'to_reviewer_payload' ],
			$invites
		);

		// Free single invite surfaces as primary reviewer when no WP reviewer.
		$primary = $payloads[0];
		if ( empty( $data['reviewer'] ) || (int) ( $data['reviewer_id'] ?? 0 ) === 0 ) {
			$data['reviewer_id']  = 0;
			$data['invite_email'] = $primary['email'];
			$data['reviewer']     = [
				'id'         => $primary['id'],
				'name'       => $primary['name'],
				'email'      => $primary['email'],
				'is_email'   => true,
				'avatar_url' => $primary['avatar_url'],
			];
		}

		$data['email_invites'] = $payloads;

		// Merge into reviewers[] when Pro has not already set it (Free single path).
		if ( empty( $data['reviewers'] ) || ! is_array( $data['reviewers'] ) ) {
			$data['reviewers'] = $payloads;
		}

		return $data;
	}

	/**
	 * @param array<string,mixed> $data
	 * @return array<string,mixed>
	 */
	public function inject_review_page_data( array $data, $review ): array {
		if ( ! is_object( $review ) ) {
			return $data;
		}
		$invite = self::current_invite_for_review( (int) $review->id );
		if ( ! $invite ) {
			$data['isEmailInvitee']    = false;
			$data['inviteEmail']       = '';
			$data['inviteDisplayName'] = '';
			$data['inviteSyntheticId'] = 0;
			return $data;
		}

		$email             = Email_Review_Invites_DB::normalize_email( (string) $invite->email );
		$name              = trim( (string) ( $invite->display_name ?? '' ) );
		$payload           = Email_Review_Invites_DB::to_reviewer_payload( $invite );
		$payload['status'] = (string) ( $invite->status ?? Email_Review_Invites_DB::STATUS_IN_REVIEW );

		$data['isEmailInvitee']    = true;
		$data['inviteEmail']       = $email;
		$data['inviteDisplayName'] = $name;
		$data['inviteSyntheticId'] = Email_Review_Invites_DB::synthetic_id( $email );
		$data['canAct']            = true;
		$data['currentUserName']   = '' !== $name ? $name : $email;
		if ( empty( $data['reviewers'] ) || ! is_array( $data['reviewers'] ) ) {
			$data['reviewers'] = [ $payload ];
		}

		return $data;
	}

	public function on_review_cancelled( int $review_id, int $post_id, int $user_id ): void {
		unset( $post_id, $user_id );
		Email_Review_Invites_DB::delete_for_review( $review_id );
	}

	public function on_review_approved( int $review_id, int $post_id, int $user_id ): void {
		unset( $post_id );
		if ( $user_id > 0 ) {
			return;
		}
		$invite = self::current_invite_for_review( $review_id );
		if ( ! $invite ) {
			return;
		}
		Email_Review_Invites_DB::set_status(
			(int) $invite->id,
			Email_Review_Invites_DB::STATUS_APPROVED,
			current_time( 'mysql', true )
		);
	}

	public function on_review_changes_requested( int $review_id, int $post_id, int $user_id ): void {
		unset( $post_id );
		if ( $user_id > 0 ) {
			return;
		}
		$invite = self::current_invite_for_review( $review_id );
		if ( ! $invite ) {
			return;
		}
		Email_Review_Invites_DB::set_status(
			(int) $invite->id,
			Email_Review_Invites_DB::STATUS_CHANGES_REQUESTED,
			current_time( 'mysql', true )
		);
	}

	public function on_review_approval_revoked( int $review_id, int $post_id, int $user_id ): void {
		unset( $post_id );
		if ( $user_id > 0 ) {
			return;
		}
		$invite = self::current_invite_for_review( $review_id );
		if ( ! $invite ) {
			return;
		}
		Email_Review_Invites_DB::set_status( (int) $invite->id, Email_Review_Invites_DB::STATUS_IN_REVIEW, null );
	}

	public function on_review_resubmitted( int $review_id, int $post_id, int $user_id ): void {
		unset( $post_id, $user_id );
		Email_Review_Invites_DB::reset_changes_requested_to_pending( $review_id );
		Email_Review_Invites_DB::bump_pending_to_in_review( $review_id );
	}

	public function on_review_sent_bump_status( int $review_id, int $post_id, int $user_id ): void {
		unset( $post_id, $user_id );
		Email_Review_Invites_DB::bump_pending_to_in_review( $review_id );
	}

	public function invite_identity_permissions( \WP_REST_Request $request ) {
		$review_id = (int) $request->get_param( 'id' );
		$review    = $review_id ? DB::get_review( $review_id ) : null;
		if ( ! $review ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Review not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}
		if ( ! self::has_invite_session_for_review( $review_id ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'You must open your invite link to continue.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
		}
		return true;
	}

	public function save_invite_identity( \WP_REST_Request $request ) {
		$review_id = (int) $request->get_param( 'id' );
		$invite    = self::current_invite_for_review( $review_id );
		if ( ! $invite ) {
			return new \WP_Error( 'rest_forbidden', __( 'Invite session not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
		}
		$name = sanitize_text_field( (string) $request->get_param( 'name' ) );
		Email_Review_Invites_DB::update_display_name( (int) $invite->id, $name );
		$updated = Email_Review_Invites_DB::get( (int) $invite->id );
		return rest_ensure_response(
			[
				'email'        => (string) ( $updated->email ?? '' ),
				'display_name' => (string) ( $updated->display_name ?? '' ),
			]
		);
	}

	/**
	 * Send magic-link emails for all pending/in_review invites on a review.
	 */
	public static function send_invite_emails( int $review_id, int $post_id ): void {
		$post    = get_post( $post_id );
		$review  = DB::get_review( $review_id );
		$invites = Email_Review_Invites_DB::get_for_review( $review_id );
		if ( ! $post || ! $review || empty( $invites ) ) {
			return;
		}

		$requester = get_userdata( (int) $review->requester_id );
		$req_name  = $requester ? $requester->display_name : __( 'Someone', 'jumplinks-editorial-workflow' );
		$site      = wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );

		$context = [
			'review_id' => $review_id,
			'post_id'   => $post_id,
			'sender_id' => (int) $review->requester_id,
		];
		if ( ! (bool) \apply_filters( 'flow_ew_should_send_email_notification', true, 'review_sent', $context ) ) {
			return;
		}

		$subject = sprintf(
			/* translators: 1: site name, 2: content title */
			__( '[%1$s] Ready for your review: %2$s', 'jumplinks-editorial-workflow' ),
			$site,
			$post->post_title
		);

		foreach ( $invites as $row ) {
			$email = Email_Review_Invites_DB::normalize_email( (string) $row->email );
			if ( '' === $email ) {
				continue;
			}
			$link = Email_Review_Link::build_for_invite( $review_id, $email );
			if ( '' === $link ) {
				continue;
			}
			$name = trim( (string) ( $row->display_name ?? '' ) );
			// Prefer a real display name; never greet with the bare email address.
			if ( '' === $name || 0 === strcasecmp( $name, $email ) ) {
				$message = sprintf(
					/* translators: 1: requester display name, 2: post title, 3: review page URL, 4: site name */
					__(
						"Hi,\n\n%1\$s has sent \"%2\$s\" for your review.\n\nOpen the review page:\n%3\$s\n\n— %4\$s",
						'jumplinks-editorial-workflow'
					),
					$req_name,
					$post->post_title,
					$link,
					$site
				);
			} else {
				$message = sprintf(
					/* translators: 1: invitee display name, 2: requester display name, 3: post title, 4: review page URL, 5: site name */
					__(
						"Hi %1\$s,\n\n%2\$s has sent \"%3\$s\" for your review.\n\nOpen the review page:\n%4\$s\n\n— %5\$s",
						'jumplinks-editorial-workflow'
					),
					$name,
					$req_name,
					$post->post_title,
					$link,
					$site
				);
			}
			wp_mail( $email, $subject, $message );
		}
	}
}
