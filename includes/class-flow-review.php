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
	const STATUS_CANCELLED         = 'cancelled';

	const STATUS_OPEN_REVIEW = 'open_review';
	const STATUS_SELF_REVIEW = 'self_review';

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
			self::STATUS_CANCELLED         => __( 'Cancelled', 'jumplinks-editorial-workflow' ),
			self::STATUS_OPEN_REVIEW       => __( 'Open Review', 'jumplinks-editorial-workflow' ),
			self::STATUS_SELF_REVIEW       => __( 'Self review', 'jumplinks-editorial-workflow' ),
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
	 * Returns the status to display for a review row — virtual `open_review`
	 * when `is_open && reviewer_id === 0`, otherwise the underlying `status`.
	 *
	 * @param object $review Row from flow_reviews.
	 */
	public static function display_status( object $review ): string {
		if ( self::is_private( $review ) ) {
			return self::STATUS_SELF_REVIEW;
		}
		if ( self::is_cancelled( $review ) ) {
			return self::STATUS_CANCELLED;
		}
		if ( ! empty( $review->is_open ) && (int) ( $review->reviewer_id ?? 0 ) === 0 ) {
			return self::STATUS_OPEN_REVIEW;
		}
		return (string) ( $review->status ?? self::STATUS_PENDING );
	}

	/**
	 * Open Review lets a reviewer flip a review to public-ish access (any
	 * logged-in user can view + comment via the share link). Site admins can
	 * disable it via Flow → Settings; the filter still wins for code-level
	 * overrides.
	 */
	public static function is_open_review_feature_available(): bool {
		$enabled = ! Settings::are_open_reviews_disabled();
		return (bool) \apply_filters( 'flow_ew_open_review_feature_available', $enabled );
	}

	public static function request( int $post_id, int $reviewer_id, int $requester_id, bool $allow_self_assignment = false ): int {
		if ( Settings::is_solo_mode() ) {
			throw new \InvalidArgumentException( esc_html__( 'Reviewers are not available in Self review only mode.', 'jumplinks-editorial-workflow' ) );
		}
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
			if ( ! self::user_can_be_reviewer( $reviewer_id ) ) {
				throw new \InvalidArgumentException( esc_html__( 'The selected user is not in a review role. Check Flow → Settings → Review Roles.', 'jumplinks-editorial-workflow' ) );
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

	public static function is_private( object $review ): bool {
		return ! empty( $review->is_private );
	}

	public static function is_cancelled( object $review ): bool {
		return self::STATUS_CANCELLED === (string) ( $review->status ?? '' );
	}

	/**
	 * Cancelled reviews on a post for the editor's history list.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function cancelled_history( int $post_id, int $user_id = 0 ): array {
		$reviews = DB::get_cancelled_reviews( $post_id );
		if ( empty( $reviews ) ) {
			return [];
		}
		$active    = DB::get_active_review( $post_id );
		$snapshots = [];
		$user_ids  = [];
		foreach ( $reviews as $review ) {
			$snapshot                       = self::decode_cancel_snapshot( $review );
			$snapshots[ (int) $review->id ] = $snapshot;
			$user_ids[]                     = (int) ( $review->reviewer_id ?? 0 );
			foreach ( (array) ( $snapshot['roster'] ?? [] ) as $row ) {
				$user_ids[] = (int) ( $row['user_id'] ?? 0 );
			}
		}
		$user_ids = array_values( array_unique( array_filter( $user_ids ) ) );
		if ( ! empty( $user_ids ) && function_exists( 'cache_users' ) ) {
			cache_users( $user_ids );
		}

		$out = [];
		foreach ( $reviews as $review ) {
			$time  = strtotime( (string) ( $review->updated_at ?? '' ) . ' UTC' );
			$out[] = [
				'id'   => (int) $review->id,
				'url'  => self::get_preview_url(
					(int) $review->id,
					self::get_effective_preview_revision_id( $post_id, (int) ( $review->revision_id ?? 0 ) ),
					$post_id
				),
				'date' => $time ? wp_date( get_option( 'date_format' ) . ' H:i', $time ) : '',
			] + self::describe_history_item( $review, $snapshots[ (int) $review->id ], $user_id, $active );
		}
		return $out;
	}

	/**
	 * What Review history shows for one cancelled review: the status it was
	 * left in, who reviewed it, its comment count, and whether this user may
	 * restore it.
	 *
	 * @param array<string,mixed> $snapshot
	 * @return array<string,mixed>
	 */
	public static function describe_history_item( object $review, array $snapshot, int $user_id, ?object $active ): array {
		$count       = (int) ( $review->comment_count ?? 0 );
		$reviewer_id = (int) ( $snapshot['reviewer_id'] ?? $review->reviewer_id ?? 0 );
		if ( [] === $snapshot ) {
			$status = self::STATUS_CANCELLED;
		} elseif ( ! empty( $snapshot['is_open'] ) && 0 === $reviewer_id ) {
			$status = self::STATUS_OPEN_REVIEW;
		} else {
			$status = (string) ( $snapshot['status'] ?? self::STATUS_CANCELLED );
		}

		$names = [];
		$ids   = [ $reviewer_id ];
		foreach ( (array) ( $snapshot['roster'] ?? [] ) as $row ) {
			$ids[] = (int) ( $row['user_id'] ?? 0 );
		}
		foreach ( array_unique( array_filter( $ids ) ) as $id ) {
			$user = get_userdata( $id );
			if ( $user ) {
				$names[] = (string) $user->display_name;
			}
		}
		foreach ( (array) ( $snapshot['invites'] ?? [] ) as $invite ) {
			$name    = trim( (string) ( $invite['display_name'] ?? '' ) );
			$names[] = '' !== $name ? $name : (string) ( $invite['email'] ?? '' );
		}
		$names = array_values( array_unique( array_filter( $names ) ) );

		$comments = sprintf(
			/* translators: %d: number of comments on a cancelled review. */
			_n( '%d comment', '%d comments', $count, 'jumplinks-editorial-workflow' ),
			$count
		);
		$label = self::status_label( $status );

		$can_restore = self::can_user_restore( $review, $user_id, $active );

		return [
			'meta'         => $count > 0 ? $comments : '',
			'status'       => $status,
			'statusLabel'  => $label,
			'reviewers'    => $names,
			'commentCount' => $count,
			'canRestore'   => $can_restore,
			'tooltip'      => implode(
				' · ',
				array_filter(
					[
						$label,
						$names ? sprintf(
							/* translators: %s: comma-separated reviewer names. */
							__( 'Reviewers: %s', 'jumplinks-editorial-workflow' ),
							implode( ', ', $names )
						) : '',
						$comments,
					]
				)
			),
		];
	}

	/**
	 * Restoring also cancels the running review, so the user must be able to cancel that one too.
	 */
	public static function can_user_restore( object $review, int $user_id, ?object $active ): bool {
		return $user_id > 0
			&& ! Settings::is_solo_mode()
			&& ! self::is_private( $review )
			&& self::is_requester_or_manager( $review, $user_id )
			&& ( ! $active || self::is_requester_or_manager( $active, $user_id ) );
	}

	/**
	 * What a cancel took away (status, open flags, invites and, from Pro, the
	 * roster), saved on the row so a restore can put it back.
	 *
	 * @return array<string,mixed>
	 */
	public static function decode_cancel_snapshot( object $review ): array {
		$raw = (string) ( $review->cancelled_from ?? '' );
		if ( '' === $raw ) {
			return [];
		}
		$data = json_decode( $raw, true );
		return is_array( $data ) ? $data : [];
	}

	private static function assert_not_cancelled( object $review ): void {
		if ( self::is_cancelled( $review ) ) {
			throw new \RuntimeException( esc_html__( 'This review was cancelled.', 'jumplinks-editorial-workflow' ) );
		}
	}

	/**
	 * A self review is a private channel on the post: the workflow queries
	 * never return it, so a client review can be started on the same post
	 * without ever seeing these comments.
	 */
	public static function start_self_review( int $post_id, int $user_id ): int {
		if ( $user_id <= 0 || ! get_post( $post_id ) ) {
			throw new \InvalidArgumentException( esc_html__( 'Invalid post ID.', 'jumplinks-editorial-workflow' ) );
		}
		$post_type = get_post_type( $post_id );
		if ( ! $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			throw new \InvalidArgumentException( esc_html__( 'Reviews are not enabled for this content type.', 'jumplinks-editorial-workflow' ) );
		}
		$existing = DB::get_private_review( $post_id );
		if ( $existing ) {
			return (int) $existing->id;
		}

		$review_id = DB::insert_review(
			[
				'post_id'      => $post_id,
				'reviewer_id'  => $user_id,
				'requester_id' => $user_id,
				'status'       => self::STATUS_IN_REVIEW,
				'is_private'   => 1,
				'revision_id'  => self::latest_revision_id( $post_id ) ?: null,
			]
		);
		if ( ! $review_id ) {
			throw new \RuntimeException( esc_html__( 'Failed to create review record.', 'jumplinks-editorial-workflow' ) );
		}

		do_action( 'flow_ew_self_review_started', $review_id, $post_id, $user_id );
		return $review_id;
	}

	/** Re-baselines the snapshot so the page stops reporting the content as outdated. Notifies nobody. */
	public static function refresh_self_review_snapshot( object $review ): void {
		$update = [ 'iteration' => (int) $review->iteration + 1 ];
		$latest = self::latest_revision_id( (int) $review->post_id );
		if ( $latest ) {
			$update['revision_id'] = $latest;
		}
		DB::update_review( (int) $review->id, $update );
	}

	public static function can_user_access_private_review( object $review, int $user_id ): bool {
		if ( $user_id <= 0 ) {
			return false;
		}
		return (int) $review->requester_id === $user_id
			|| Settings::get_agent_comment_author_id() === $user_id
			|| user_can( $user_id, 'flow_manage_reviews' );
	}

	private static function latest_revision_id( int $post_id ): int {
		$revisions = wp_get_post_revisions(
			$post_id,
			[
				'posts_per_page' => 1,
				'fields'         => 'ids',
			]
		);
		return empty( $revisions ) ? 0 : (int) reset( $revisions );
	}

	public static function send_for_review( int $review_id, int $user_id ): void {
		$review = DB::get_review( $review_id );
		if ( ! $review ) {
			throw new \InvalidArgumentException( esc_html__( 'Review not found.', 'jumplinks-editorial-workflow' ) );
		}
		if ( self::is_private( $review ) ) {
			throw new \RuntimeException( esc_html__( 'This action is not available on a self review.', 'jumplinks-editorial-workflow' ) );
		}
		if ( ! self::is_requester_or_manager( $review, $user_id ) ) {
			throw new \RuntimeException( esc_html__( 'You are not authorized to send this review.', 'jumplinks-editorial-workflow' ) );
		}
		self::assert_not_cancelled( $review );
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

	/** The post's newest saved revision, ignoring autosaves; 0 when it has none. */
	public static function newest_saved_revision_id( int $post_id ): int {
		// IDs, not dates: builders can backdate a revision to the previous save.
		$revisions = wp_get_post_revisions(
			$post_id,
			[
				'numberposts' => 5,
				'orderby'     => 'ID',
				'order'       => 'DESC',
			]
		);
		foreach ( $revisions as $revision ) {
			if ( ! wp_is_post_autosave( $revision ) ) {
				return (int) $revision->ID;
			}
		}
		return 0;
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
		if ( self::is_private( $review ) ) {
			throw new \RuntimeException( esc_html__( 'This action is not available on a self review.', 'jumplinks-editorial-workflow' ) );
		}
		if ( ! self::is_requester_or_manager( $review, $user_id ) ) {
			throw new \RuntimeException( esc_html__( 'You are not authorized to cancel this review.', 'jumplinks-editorial-workflow' ) );
		}
		if ( self::is_cancelled( $review ) ) {
			return;
		}

		// Taken before the cancel listeners delete invites and the Pro roster.
		$snapshot = self::build_cancel_snapshot( $review, $user_id );
		DB::update_review(
			$review_id,
			[
				'status'         => self::STATUS_CANCELLED,
				'is_open'        => 0,
				'is_public'      => 0,
				'cancelled_from' => (string) wp_json_encode( $snapshot ),
			]
		);
		delete_post_meta( (int) $review->post_id, '_flow_reviewer_id' );
		delete_post_meta( (int) $review->post_id, '_flow_review_status' );

		do_action( 'flow_ew_review_cancelled', $review_id, (int) $review->post_id, $user_id );
	}

	/**
	 * @return array<string,mixed>
	 */
	private static function build_cancel_snapshot( object $review, int $user_id ): array {
		$invites = [];
		foreach ( Email_Review_Invites_DB::get_for_review( (int) $review->id ) as $row ) {
			$invites[] = [
				'email'         => (string) ( $row->email ?? '' ),
				'display_name'  => (string) ( $row->display_name ?? '' ),
				'status'        => (string) ( $row->status ?? Email_Review_Invites_DB::STATUS_PENDING ),
				'cookie_jti'    => (string) ( $row->cookie_jti ?? '' ),
				'token_version' => (int) ( $row->token_version ?? 1 ),
				'decided_at'    => $row->decided_at ?? null,
				'created_at'    => $row->created_at ?? null,
			];
		}
		$snapshot = [
			'v'            => 1,
			'status'       => (string) $review->status,
			'is_open'      => empty( $review->is_open ) ? 0 : 1,
			'is_public'    => empty( $review->is_public ) ? 0 : 1,
			'reviewer_id'  => (int) $review->reviewer_id,
			'cancelled_by' => $user_id,
			'cancelled_at' => current_time( 'mysql', true ),
			'invites'      => $invites,
		];
		/**
		 * Lets add-ons save what their cancel listeners are about to delete,
		 * so a restore can bring it back (Pro adds the reviewer roster).
		 *
		 * @param array<string,mixed> $snapshot
		 * @param object              $review
		 * @param int                 $user_id
		 */
		return (array) \apply_filters( 'flow_ew_review_cancel_snapshot', $snapshot, $review, $user_id );
	}

	/**
	 * Brings a cancelled review back as the current one, with the status,
	 * reviewers and invites it had. Whatever review is running is cancelled
	 * first and kept in the history.
	 */
	public static function restore( int $review_id, int $user_id ): void {
		if ( Settings::is_solo_mode() ) {
			throw new \InvalidArgumentException( esc_html__( 'Reviewers are not available in Self review only mode.', 'jumplinks-editorial-workflow' ) );
		}
		$review = DB::get_review( $review_id );
		if ( ! $review ) {
			throw new \InvalidArgumentException( esc_html__( 'Review not found.', 'jumplinks-editorial-workflow' ) );
		}
		if ( self::is_private( $review ) ) {
			throw new \RuntimeException( esc_html__( 'This action is not available on a self review.', 'jumplinks-editorial-workflow' ) );
		}
		if ( ! self::is_cancelled( $review ) ) {
			throw new \RuntimeException( esc_html__( 'Only a cancelled review can be restored.', 'jumplinks-editorial-workflow' ) );
		}
		if ( ! self::is_requester_or_manager( $review, $user_id ) ) {
			throw new \RuntimeException( esc_html__( 'You are not authorized to restore this review.', 'jumplinks-editorial-workflow' ) );
		}
		$post_id = (int) $review->post_id;

		// Its own permission check runs here, before the target is touched.
		$active = DB::get_active_review( $post_id );
		if ( $active && (int) $active->id !== $review_id ) {
			self::cancel( (int) $active->id, $user_id );
		}

		$snapshot                 = self::decode_cancel_snapshot( $review );
		$fields                   = self::restored_fields( $review, $snapshot );
		$fields['cancelled_from'] = null;
		DB::update_review( $review_id, $fields );

		$reviewer_id = (int) ( $fields['reviewer_id'] ?? $review->reviewer_id );
		if ( $reviewer_id > 0 ) {
			update_post_meta( $post_id, '_flow_reviewer_id', $reviewer_id );
		} else {
			delete_post_meta( $post_id, '_flow_reviewer_id' );
		}
		if ( self::STATUS_PENDING === $fields['status'] ) {
			delete_post_meta( $post_id, '_flow_review_status' );
		} else {
			update_post_meta( $post_id, '_flow_review_status', $fields['status'] );
		}

		Email_Review_Invites_DB::restore_rows( $review_id, (array) ( $snapshot['invites'] ?? [] ) );

		do_action( 'flow_ew_review_restored', $review_id, $post_id, $user_id, $snapshot );
	}

	/**
	 * Rows cancelled before snapshots existed come back as pending, open when
	 * nobody was assigned (otherwise nobody could reach them).
	 *
	 * @param array<string,mixed> $snapshot
	 * @return array<string,mixed>
	 */
	private static function restored_fields( object $review, array $snapshot ): array {
		$status = (string) ( $snapshot['status'] ?? '' );
		if ( ! in_array( $status, [ self::STATUS_PENDING, self::STATUS_IN_REVIEW, self::STATUS_CHANGES_REQUESTED, self::STATUS_APPROVED ], true ) ) {
			$status = self::STATUS_PENDING;
		}
		$fields      = [ 'status' => $status ];
		$reviewer_id = (int) $review->reviewer_id;
		if ( $reviewer_id > 0 && ! get_userdata( $reviewer_id ) ) {
			$reviewer_id           = 0;
			$fields['reviewer_id'] = 0;
		}
		$open                = [] === $snapshot ? 0 === $reviewer_id : ! empty( $snapshot['is_open'] );
		$fields['is_open']   = $open && self::is_open_review_feature_available() ? 1 : 0;
		$fields['is_public'] = empty( $snapshot['is_public'] ) ? 0 : 1;
		return $fields;
	}

	/**
	 * Unassigns the reviewer. An open review keeps running without one; any
	 * other review has nothing left and is cancelled.
	 */
	public static function remove_reviewer( int $review_id, int $user_id ): void {
		$review = DB::get_review( $review_id );
		if ( ! $review ) {
			throw new \InvalidArgumentException( esc_html__( 'Review not found.', 'jumplinks-editorial-workflow' ) );
		}
		if ( ! (bool) ( $review->is_open ?? false ) || ! self::is_open_review_feature_available() ) {
			self::cancel( $review_id, $user_id );
			return;
		}
		if ( ! self::is_requester_or_manager( $review, $user_id ) ) {
			throw new \RuntimeException( esc_html__( 'You are not authorized to modify this review.', 'jumplinks-editorial-workflow' ) );
		}
		self::assert_not_cancelled( $review );

		DB::update_review(
			$review_id,
			[
				'reviewer_id' => 0,
				'status'      => self::STATUS_PENDING,
			]
		);
		Email_Review_Invites_DB::delete_for_review( $review_id );
		delete_post_meta( (int) $review->post_id, '_flow_reviewer_id' );
		delete_post_meta( (int) $review->post_id, '_flow_review_status' );

		do_action( 'flow_ew_reviewer_removed', $review_id, (int) $review->post_id, $user_id );
	}

	public static function resubmit( int $review_id, int $user_id ): void {
		$review = DB::get_review( $review_id );
		if ( ! $review ) {
			throw new \InvalidArgumentException( esc_html__( 'Review not found.', 'jumplinks-editorial-workflow' ) );
		}
		if ( self::is_private( $review ) ) {
			if ( ! self::can_user_access_private_review( $review, $user_id ) ) {
				throw new \RuntimeException( esc_html__( 'You are not authorized to resubmit this review.', 'jumplinks-editorial-workflow' ) );
			}
			self::refresh_self_review_snapshot( $review );
			return;
		}
		if ( ! self::is_post_author( $review, $user_id ) ) {
			throw new \RuntimeException( esc_html__( 'You are not authorized to resubmit this review.', 'jumplinks-editorial-workflow' ) );
		}
		self::assert_not_cancelled( $review );

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
		if ( self::is_private( $review ) ) {
			return self::can_user_access_private_review( $review, $user_id );
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

	/**
	 * The author, the requester and managers always may; reviewers (including
	 * email invitees) only while Settings → Workflow → Resolve comments is on.
	 */
	public static function can_user_resolve_comments( object $review, int $user_id ): bool {
		if ( ! self::can_user_reopen_comments( $review, $user_id ) ) {
			return false;
		}
		if ( self::is_private( $review ) || ! Settings::reviewers_can_resolve() ) {
			return $user_id > 0 && (
				self::is_private( $review )
				|| self::is_requester_or_manager( $review, $user_id )
				|| self::is_post_author( $review, $user_id )
			);
		}
		return true;
	}

	/**
	 * Reopening is never restricted by the setting: any reviewer may bring a
	 * thread back when the fix is not right.
	 */
	public static function can_user_reopen_comments( object $review, int $user_id ): bool {
		if ( self::is_cancelled( $review ) ) {
			return false;
		}
		if ( self::is_private( $review ) ) {
			return $user_id > 0 && self::can_user_access_private_review( $review, $user_id );
		}
		if ( $user_id > 0 ) {
			return self::is_requester_or_manager( $review, $user_id )
				|| self::is_post_author( $review, $user_id )
				|| self::can_user_access_review( $review, $user_id );
		}
		return Email_Review::can_invite_take_action( $review );
	}

	public static function is_requester_or_manager( object $review, int $user_id ): bool {
		return $user_id > 0
			&& (
				(int) $review->requester_id === $user_id
				|| user_can( $user_id, 'flow_manage_reviews' )
			);
	}

	/**
	 * Approve / request changes / revoke are reserved for the assigned
	 * reviewer (primary column or Pro roster) and managers. The requester and
	 * the post author are participants for viewing, but must not be able to
	 * sign off on their own work.
	 */
	public static function can_user_take_reviewer_action( object $review, int $user_id ): bool {
		if ( self::is_private( $review ) ) {
			return false;
		}
		if ( $user_id > 0 ) {
			return user_can( $user_id, 'flow_manage_reviews' )
				|| self::is_assigned_reviewer( $review, $user_id );
		}
		// Email invite session (anonymous cookie) — full reviewer powers.
		return 0 === $user_id && Email_Review::can_invite_take_action( $review );
	}

	public static function is_assigned_reviewer( object $review, int $user_id ): bool {
		if ( $user_id <= 0 ) {
			return false;
		}
		if ( (int) $review->reviewer_id === $user_id ) {
			return true;
		}
		return (bool) \apply_filters( 'flow_ew_is_review_participant', false, $review, $user_id );
	}

	/**
	 * Users in a review role (the set the reviewer picker shows) may be
	 * assigned. Administrators and editors carry the cap by default; other
	 * roles get it through Flow → Settings → Review Roles.
	 *
	 * The auto-assign user is the documented exception: that field names one
	 * specific person and promises any user works there, review role or not.
	 */
	public static function user_can_be_reviewer( int $user_id ): bool {
		if ( $user_id <= 0 ) {
			return false;
		}
		if ( user_can( $user_id, 'flow_review_posts' ) ) {
			return true;
		}
		return Settings::get_auto_assign_reviewer_id() === $user_id;
	}

	public static function can_user_access_review( object $review, int $user_id ): bool {
		return self::can_user_access_as_participant_or_open( $review, $user_id )
			|| user_can( $user_id, 'flow_manage_reviews' );
	}

	/**
	 * Reading comments follows the review page's own view rule, which lets the
	 * post author in even when they are neither reviewer nor requester.
	 */
	public static function can_user_read_comments( object $review, int $user_id ): bool {
		return self::can_user_access_review( $review, $user_id ) || self::is_post_author( $review, $user_id );
	}

	public static function can_user_access_as_participant_or_open( object $review, int $user_id ): bool {
		$is_open = (bool) ( $review->is_open ?? false ) && self::is_open_review_feature_available() && ! self::is_private( $review ) && ! self::is_cancelled( $review );
		return self::is_user_review_participant( $review, $user_id ) || $is_open;
	}

	public static function review_has_supported_post_type( object $review ): bool {
		$post_type = get_post_type( (int) $review->post_id );
		return (bool) ( $post_type && Settings::is_post_type_supported( $post_type ) );
	}

	/**
	 * Warm the post and user object caches for a set of review rows before they
	 * are mapped to payloads, so `prepare_response_payload()` (and dashboard
	 * item rendering) resolve `get_post` / `get_userdata` / `get_avatar_url`
	 * from cache instead of one query per review. Pure cache priming — no
	 * behaviour change.
	 *
	 * @param object[] $reviews
	 */
	public static function prime_review_list_caches( array $reviews ): void {
		$post_ids = [];
		$user_ids = [];
		foreach ( $reviews as $review ) {
			if ( ! is_object( $review ) ) {
				continue;
			}
			$post_id = (int) ( $review->post_id ?? 0 );
			if ( $post_id > 0 ) {
				$post_ids[] = $post_id;
			}
			foreach ( [ 'reviewer_id', 'requester_id' ] as $key ) {
				$user_id = (int) ( $review->{$key} ?? 0 );
				if ( $user_id > 0 ) {
					$user_ids[] = $user_id;
				}
			}
		}
		if ( ! empty( $post_ids ) && function_exists( '_prime_post_caches' ) ) {
			_prime_post_caches( array_values( array_unique( $post_ids ) ), false, true );
		}
		if ( ! empty( $user_ids ) && function_exists( 'cache_users' ) ) {
			cache_users( array_values( array_unique( $user_ids ) ) );
		}
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
			'is_private'           => self::is_private( $review ),
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
		self::assert_not_cancelled( $review );
		return $review;
	}
}
