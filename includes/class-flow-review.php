<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Review {

	const STATUS_PENDING           = 'pending';
	const STATUS_IN_REVIEW         = 'in_review';
	const STATUS_CHANGES_REQUESTED = 'changes_requested';
	const STATUS_APPROVED          = 'approved';

	const STATUS_OPEN_REVIEW = 'open_review';

	const TOKEN_MAX_AGE = 30 * DAY_IN_SECONDS;

	/**
	 * @return array<string,string> status slug => translated label
	 */
	public static function status_labels(): array {
		return [
			self::STATUS_PENDING           => __( 'Pending Review', 'jumplinks-editorial-workflow' ),
			self::STATUS_IN_REVIEW         => __( 'In Review', 'jumplinks-editorial-workflow' ),
			self::STATUS_CHANGES_REQUESTED => __( 'Changes Requested', 'jumplinks-editorial-workflow' ),
			self::STATUS_APPROVED          => __( 'Approved', 'jumplinks-editorial-workflow' ),
			self::STATUS_OPEN_REVIEW       => __( 'Open Review', 'jumplinks-editorial-workflow' ),
		];
	}

	/**
	 * Translated label for a review status slug.
	 */
	public static function status_label( string $status ): string {
		$labels = self::status_labels();
		return $labels[ $status ] ?? ucwords( str_replace( '_', ' ', $status ) );
	}

	/**
	 * Unified status badge palette (bg, text, border).
	 * Keep in sync with src/shared/status-themes.js and assets/css/status-themes.css.
	 *
	 * @return array<string,array{bg:string,text:string,border:string}>
	 */
	public static function status_themes(): array {
		return [
			self::STATUS_OPEN_REVIEW       => [
				'bg'     => '#dff4ff',
				'text'   => '#1579a5',
				'border' => '#b6e6ff',
			],
			self::STATUS_APPROVED          => [
				'bg'     => '#e7f5e4',
				'text'   => '#458037',
				'border' => '#cae8c4',
			],
			self::STATUS_IN_REVIEW         => [
				'bg'     => '#fcf0ce',
				'text'   => '#957500',
				'border' => '#f2dda4',
			],
			self::STATUS_CHANGES_REQUESTED => [
				'bg'     => '#ffebea',
				'text'   => '#c92122',
				'border' => '#ffd1d0',
			],
			self::STATUS_PENDING           => [
				'bg'     => '#e6f3f5',
				'text'   => '#5e777b',
				'border' => '#cde3e7',
			],
		];
	}

	/**
	 * Returns the status to display for a review row — virtual `open_review`
	 * when `is_open && reviewer_id === 0`, otherwise the underlying `status`.
	 *
	 * @param object $review Row from flow_reviews.
	 */
	public static function display_status( object $review ): string {
		if ( ! empty( $review->is_open ) && (int) ( $review->reviewer_id ?? 0 ) === 0 ) {
			return self::STATUS_OPEN_REVIEW;
		}
		return (string) ( $review->status ?? self::STATUS_PENDING );
	}

	/**
	 * Open Review lets a reviewer flip a review to public-ish access (any
	 * logged-in user can view + comment via the share link). Site admins can
	 * disable it via Settings → Flow; the filter still wins for code-level
	 * overrides.
	 */
	public static function is_open_review_feature_available(): bool {
		$enabled = ! Settings::are_open_reviews_disabled();
		return (bool) \apply_filters( 'flow_ew_open_review_feature_available', $enabled );
	}

	public static function request( int $post_id, int $reviewer_id, int $requester_id, bool $allow_self_assignment = false ): int {
		if ( ! get_post( $post_id ) ) {
			throw new \InvalidArgumentException( esc_html__( 'Invalid post ID.', 'jumplinks-editorial-workflow' ) );
		}
		$post_type = get_post_type( $post_id );
		if ( ! $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			throw new \InvalidArgumentException( esc_html__( 'Reviews are not enabled for this content type.', 'jumplinks-editorial-workflow' ) );
		}
		// `reviewer_id === 0` means "no reviewer assigned yet" — used when the
		// requester turns Open Review on before picking a reviewer.
		if ( $reviewer_id > 0 ) {
			if ( ! get_userdata( $reviewer_id ) ) {
				throw new \InvalidArgumentException( esc_html__( 'Invalid reviewer user ID.', 'jumplinks-editorial-workflow' ) );
			}
			if ( ! $allow_self_assignment && $reviewer_id === $requester_id ) {
				throw new \InvalidArgumentException( esc_html__( 'Reviewer cannot be the same as the requester.', 'jumplinks-editorial-workflow' ) );
			}
		}

		$existing = DB::get_active_review( $post_id );
		if ( $existing ) {
			// Identical WP reviewer re-assign is a no-op — do not kick an
			// in-flight review (e.g. in_review) back to pending. UI click-away
			// on the locked combobox used to re-POST and surface Send again.
			if ( $reviewer_id > 0 && (int) $existing->reviewer_id === $reviewer_id ) {
				return (int) $existing->id;
			}
			DB::update_review(
				(int) $existing->id,
				[
					'reviewer_id' => $reviewer_id,
					'status'      => self::STATUS_PENDING,
					'iteration'   => (int) $existing->iteration + 1,
				]
			);
			update_post_meta( $post_id, '_flow_reviewer_id', $reviewer_id );
			do_action( 'flow_ew_review_requested', (int) $existing->id, $post_id, $reviewer_id, $requester_id );
			return (int) $existing->id;
		}

		$review_id = DB::insert_review(
			[
				'post_id'      => $post_id,
				'reviewer_id'  => $reviewer_id,
				'requester_id' => $requester_id,
			]
		);

		if ( ! $review_id ) {
			throw new \RuntimeException( esc_html__( 'Failed to create review record.', 'jumplinks-editorial-workflow' ) );
		}

		update_post_meta( $post_id, '_flow_reviewer_id', $reviewer_id );
		do_action( 'flow_ew_review_requested', $review_id, $post_id, $reviewer_id, $requester_id );

		return $review_id;
	}

	public static function send_for_review( int $review_id, int $user_id ): void {
		$review = DB::get_review( $review_id );
		if ( ! $review ) {
			throw new \InvalidArgumentException( esc_html__( 'Review not found.', 'jumplinks-editorial-workflow' ) );
		}
		if ( ! self::is_requester_or_manager( $review, $user_id ) ) {
			throw new \RuntimeException( esc_html__( 'You are not authorized to send this review.', 'jumplinks-editorial-workflow' ) );
		}
		$has_wp_reviewer = (int) ( $review->reviewer_id ?? 0 ) > 0;
		$has_invite      = Email_Review_Invites_DB::count_for_review( $review_id ) > 0;
		$is_open         = ! empty( $review->is_open );
		if ( ! $has_wp_reviewer && ! $has_invite && ! $is_open ) {
			throw new \RuntimeException( esc_html__( 'Assign a reviewer or email invite before sending.', 'jumplinks-editorial-workflow' ) );
		}
		$error = (string) \apply_filters( 'flow_ew_send_for_review_error', '', $review, $user_id );
		if ( '' !== $error ) {
			throw new \RuntimeException( esc_html( $error ) );
		}
		$revision_id = 0;
		$revisions   = wp_get_post_revisions(
			(int) $review->post_id,
			[
				'posts_per_page' => 1,
				'fields'         => 'ids',
			]
		);
		if ( ! empty( $revisions ) ) {
			$revision_id = (int) reset( $revisions );
		}

		$update_data = [ 'status' => self::STATUS_IN_REVIEW ];
		if ( $revision_id ) {
			$update_data['revision_id'] = $revision_id;
		}
		DB::update_review( $review_id, $update_data );
		update_post_meta( (int) $review->post_id, '_flow_review_status', self::STATUS_IN_REVIEW );

		$post = get_post( (int) $review->post_id );
		if ( $post instanceof \WP_Post && 'publish' !== $post->post_status ) {
			wp_update_post(
				[
					'ID'          => $post->ID,
					'post_status' => 'pending',
				]
			);
		}

		do_action( 'flow_ew_review_sent', $review_id, (int) $review->post_id, $user_id );
	}

	/**
	 * Prefer the latest saved revision so editor preview links match recent edits;
	 * falls back to the review row snapshot when there are no revisions yet.
	 */
	public static function get_effective_preview_revision_id( int $post_id, int $stored_revision_id ): int {
		$revisions = wp_get_post_revisions(
			$post_id,
			[
				'numberposts' => 1,
				'orderby'     => 'date ID',
				'order'       => 'DESC',
			]
		);
		if ( ! empty( $revisions ) ) {
			$first = reset( $revisions );
			if ( $first instanceof \WP_Post ) {
				return (int) $first->ID;
			}
		}

		return $stored_revision_id > 0 ? $stored_revision_id : 0;
	}

	public static function get_preview_url( int $review_id, int $revision_id, int $post_id ): string {
		$ts    = time();
		$token = wp_hash( 'flow_preview_' . $review_id . '_' . $ts );

		$args = [
			'flow_review_id' => $review_id,
			'flow_token'     => $token,
			'flow_token_ts'  => $ts,
		];

		if ( $revision_id > 0 ) {
			$args['flow_revision_id'] = $revision_id;
		}

		$post_type = get_post_type( $post_id );
		if ( 'page' === $post_type ) {
			$args['page_id'] = $post_id;
		} else {
			$args['p'] = $post_id;
			if ( is_string( $post_type ) && '' !== $post_type && 'post' !== $post_type ) {
				$args['post_type'] = $post_type;
			}
		}

		$base_url = get_permalink( $post_id );
		if ( ! is_string( $base_url ) || '' === $base_url ) {
			$base_url = home_url( '/' );
		}

		return add_query_arg( $args, $base_url );
	}

	public static function verify_preview_token( int $review_id, string $token, int $ts ): bool {
		if ( $ts <= 0 ) {
			return false;
		}
		$expected = wp_hash( 'flow_preview_' . $review_id . '_' . $ts );
		if ( ! hash_equals( $expected, $token ) ) {
			return false;
		}
		return ( time() - $ts ) <= self::TOKEN_MAX_AGE;
	}

	public static function approve( int $review_id, int $user_id ): void {
		$review = self::get_and_authorize_reviewer( $review_id, $user_id );
		DB::update_review( $review_id, [ 'status' => self::STATUS_APPROVED ] );
		update_post_meta( (int) $review->post_id, '_flow_review_status', self::STATUS_APPROVED );
		do_action( 'flow_ew_review_approved', $review_id, (int) $review->post_id, $user_id );
	}

	public static function revoke_approval( int $review_id, int $user_id ): void {
		$review = self::get_and_authorize_reviewer( $review_id, $user_id );
		DB::update_review( $review_id, [ 'status' => self::STATUS_IN_REVIEW ] );
		update_post_meta( (int) $review->post_id, '_flow_review_status', self::STATUS_IN_REVIEW );
		do_action( 'flow_ew_approval_revoked', $review_id, (int) $review->post_id, $user_id );
	}

	public static function request_changes( int $review_id, int $user_id ): void {
		$review = self::get_and_authorize_reviewer( $review_id, $user_id );
		DB::update_review( $review_id, [ 'status' => self::STATUS_CHANGES_REQUESTED ] );
		update_post_meta( (int) $review->post_id, '_flow_review_status', self::STATUS_CHANGES_REQUESTED );
		do_action( 'flow_ew_changes_requested', $review_id, (int) $review->post_id, $user_id );
	}

	public static function cancel( int $review_id, int $user_id ): void {
		$review = DB::get_review( $review_id );
		if ( ! $review ) {
			throw new \InvalidArgumentException( esc_html__( 'Review not found.', 'jumplinks-editorial-workflow' ) );
		}
		if ( ! self::is_requester_or_manager( $review, $user_id ) ) {
			throw new \RuntimeException( esc_html__( 'You are not authorized to cancel this review.', 'jumplinks-editorial-workflow' ) );
		}

		if ( ! empty( $review->is_open ) ) {
			DB::update_review(
				$review_id,
				[
					'reviewer_id' => 0,
					'status'      => self::STATUS_PENDING,
				]
			);
			delete_post_meta( (int) $review->post_id, '_flow_reviewer_id' );
			update_post_meta( (int) $review->post_id, '_flow_review_status', self::STATUS_PENDING );
			// Same cleanup as full cancel — remove email invites so the UI is not
			// stuck in External Email mode after clearing the assignee.
			do_action( 'flow_ew_review_cancelled', $review_id, (int) $review->post_id, $user_id );
			return;
		}

		DB::delete_review( $review_id );
		delete_post_meta( (int) $review->post_id, '_flow_reviewer_id' );
		delete_post_meta( (int) $review->post_id, '_flow_review_status' );

		do_action( 'flow_ew_review_cancelled', $review_id, (int) $review->post_id, $user_id );
	}

	public static function resubmit( int $review_id, int $user_id ): void {
		$review = DB::get_review( $review_id );
		if ( ! $review ) {
			throw new \InvalidArgumentException( esc_html__( 'Review not found.', 'jumplinks-editorial-workflow' ) );
		}
		if ( ! self::is_post_author( $review, $user_id ) ) {
			throw new \RuntimeException( esc_html__( 'You are not authorized to resubmit this review.', 'jumplinks-editorial-workflow' ) );
		}

		$revision_id = 0;
		$revisions   = wp_get_post_revisions(
			(int) $review->post_id,
			[
				'posts_per_page' => 1,
				'fields'         => 'ids',
			]
		);
		if ( ! empty( $revisions ) ) {
			$revision_id = (int) reset( $revisions );
		}

		$update = [
			'status'    => self::STATUS_IN_REVIEW,
			'iteration' => (int) $review->iteration + 1,
		];
		if ( $revision_id ) {
			$update['revision_id'] = $revision_id;
		}
		DB::update_review( $review_id, $update );
		update_post_meta( (int) $review->post_id, '_flow_review_status', self::STATUS_IN_REVIEW );
		do_action( 'flow_ew_review_resubmitted', $review_id, (int) $review->post_id, $user_id );
	}

	/**
	 * Checks whether a user is a participant (reviewer, requester, or additional
	 * participant added by extensions such as Pro multi-reviewer).
	 */
	public static function is_user_review_participant( object $review, int $user_id ): bool {
		if ( $user_id <= 0 ) {
			return false;
		}
		if ( (int) $review->reviewer_id === $user_id ) {
			return true;
		}
		if ( (int) $review->requester_id === $user_id ) {
			return true;
		}
		return (bool) \apply_filters( 'flow_ew_is_review_participant', false, $review, $user_id );
	}

	public static function is_post_author( object $review, int $user_id ): bool {
		if ( $user_id <= 0 ) {
			return false;
		}
		$post = get_post( (int) $review->post_id );
		return $post instanceof \WP_Post && (int) $post->post_author === $user_id;
	}

	public static function is_requester_or_manager( object $review, int $user_id ): bool {
		return $user_id > 0
			&& (
				(int) $review->requester_id === $user_id
				|| user_can( $user_id, 'flow_manage_reviews' )
			);
	}

	public static function can_user_take_reviewer_action( object $review, int $user_id ): bool {
		if ( $user_id > 0
			&& (
				self::is_user_review_participant( $review, $user_id )
				|| user_can( $user_id, 'flow_manage_reviews' )
			)
		) {
			return true;
		}
		// Email invite session (anonymous cookie) — full reviewer powers.
		if ( 0 === $user_id && Email_Review::can_invite_take_action( $review ) ) {
			return true;
		}
		return false;
	}

	public static function can_user_access_review( object $review, int $user_id ): bool {
		return self::can_user_access_as_participant_or_open( $review, $user_id )
			|| user_can( $user_id, 'flow_manage_reviews' );
	}

	public static function can_user_access_as_participant_or_open( object $review, int $user_id ): bool {
		$is_open = (bool) ( $review->is_open ?? false ) && self::is_open_review_feature_available();
		return self::is_user_review_participant( $review, $user_id ) || $is_open;
	}

	public static function review_has_supported_post_type( object $review ): bool {
		$post_type = get_post_type( (int) $review->post_id );
		return (bool) ( $post_type && Settings::is_post_type_supported( $post_type ) );
	}

	/**
	 * @return array<string,mixed>
	 */
	public static function prepare_response_payload( object $review ): array {
		$reviewer  = get_userdata( (int) $review->reviewer_id );
		$requester = get_userdata( (int) $review->requester_id );
		$rev_id    = (int) ( $review->revision_id ?? 0 );
		$preview   = self::get_effective_preview_revision_id(
			(int) $review->post_id,
			$rev_id
		);

		$data = [
			'id'                   => (int) $review->id,
			'post_id'              => (int) $review->post_id,
			'status'               => $review->status,
			'display_status'       => self::display_status( $review ),
			'iteration'            => (int) $review->iteration,
			'reviewer_id'          => (int) $review->reviewer_id,
			'revision_id'          => $rev_id > 0 ? $rev_id : null,
			'revision_url'         => $preview > 0 ? admin_url( 'revision.php?revision=' . $preview ) : null,
			'revision_preview_url' => self::get_preview_url(
				(int) $review->id,
				$preview,
				(int) $review->post_id
			),
			'created_at'           => $review->created_at ?? null,
			'updated_at'           => $review->updated_at ?? null,
			'is_open'              => (bool) ( $review->is_open ?? false ),
			'is_public'            => (bool) ( $review->is_public ?? false ),
			'reviewer'             => $reviewer ? [
				'id'         => (int) $reviewer->ID,
				'name'       => $reviewer->display_name,
				'avatar_url' => get_avatar_url( (int) $reviewer->ID, [ 'size' => 32 ] ),
			] : null,
			'requester'            => $requester ? [
				'id'   => (int) $requester->ID,
				'name' => $requester->display_name,
			] : null,
			'invite_email'         => null,
			'email_invites'        => [],
		];

		return (array) \apply_filters( 'flow_ew_prepare_review_response', $data, $review );
	}

	private static function get_and_authorize_reviewer( int $review_id, int $user_id ) {
		$review = DB::get_review( $review_id );
		if ( ! $review ) {
			throw new \InvalidArgumentException( esc_html__( 'Review not found.', 'jumplinks-editorial-workflow' ) );
		}
		if ( ! self::can_user_take_reviewer_action( $review, $user_id ) ) {
			throw new \RuntimeException( esc_html__( 'You are not authorized to take action on this review.', 'jumplinks-editorial-workflow' ) );
		}
		return $review;
	}
}
