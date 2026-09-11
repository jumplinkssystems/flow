<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Server-side enforcement of mandatory-review mode. The block-editor Publish
 * button is greyed out by PublishGuard.js, but Quick Edit, Bulk Edit, REST
 * writes, and direct wp_update_post() calls bypass that UI. This class coerces
 * the post status back to a non-public value when a publish would otherwise
 * slip through without an approved review, and surfaces an error to the user
 * via: - Bulk Edit: transient → admin_notices on the next page render. - Quick
 * Edit: short-circuit the inline-save AJAX before the default handler runs,
 * returning a plain-text error that inline-edit-post.js renders into the row's
 * error span.
 */
class Publish_Guard {

	const TRANSIENT_PREFIX = 'flow_ew_blocked_publish_';
	const TRANSIENT_TTL    = 60;

	public function boot(): void {
		add_filter( 'wp_insert_post_data', [ $this, 'guard_publish' ], 20, 2 );
		add_action( 'admin_notices', [ $this, 'render_blocked_notice' ] );
		// Priority 1 so we run before the core wp_ajax_inline_save() at default 10.
		add_action( 'wp_ajax_inline-save', [ $this, 'inline_save_pre_check' ], 1 );
	}

	/**
	 * @param array<string,mixed> $data    Slashed post data being saved.
	 * @param array<string,mixed> $postarr Raw input array.
	 * @return array<string,mixed>
	 */
	public function guard_publish( array $data, array $postarr ): array {
		$new_status = isset( $data['post_status'] ) ? (string) $data['post_status'] : '';
		$post_type  = isset( $data['post_type'] ) ? (string) $data['post_type'] : '';
		$post_id    = isset( $postarr['ID'] ) ? (int) $postarr['ID'] : 0;

		if ( ! self::publish_should_be_blocked( $post_id, $post_type, $new_status ) ) {
			return $data;
		}

		// Coerce back to a safe non-public status. For existing posts, restore
		// what they had; for brand-new posts, fall back to draft.
		$fallback = 'draft';
		if ( $post_id > 0 ) {
			$existing = get_post_status( $post_id );
			if ( is_string( $existing ) && '' !== $existing && ! in_array( $existing, [ 'publish', 'future' ], true ) ) {
				$fallback = $existing;
			}
		}
		$data['post_status'] = $fallback;

		if ( $post_id > 0 ) {
			self::remember_blocked( $post_id );
		}

		return $data;
	}

	/**
	 * Quick Edit pre-check. Runs before core's wp_ajax_inline_save() so we can
	 * return a plain-text error that inline-edit-post.js renders inline.
	 */
	public function inline_save_pre_check(): void {
		// Verify nonce; if invalid, let the core handler reject it cleanly.
		if ( ! check_ajax_referer( 'inlineeditnonce', '_inline_edit', false ) ) {
			return;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Missing -- nonce verified above.
		$post_id    = isset( $_POST['post_ID'] ) ? (int) $_POST['post_ID'] : 0;
		$new_status = isset( $_POST['_status'] ) ? sanitize_key( wp_unslash( $_POST['_status'] ) ) : '';
		$post_type  = isset( $_POST['post_type'] ) ? sanitize_key( wp_unslash( $_POST['post_type'] ) ) : '';
		// phpcs:enable WordPress.Security.NonceVerification.Missing

		if ( $post_id <= 0 || '' === $new_status || '' === $post_type ) {
			return;
		}

		if ( ! self::publish_should_be_blocked( $post_id, $post_type, $new_status ) ) {
			return;
		}

		// Plain text — inline-edit-post.js strips HTML tags from non-<tr>
		// responses and shows what's left in the row's error span.
		echo esc_html__(
			'This post needs an approved review before it can be published.',
			'jumplinks-editorial-workflow'
		);
		wp_die();
	}

	public function render_blocked_notice(): void {
		if ( ! is_user_logged_in() ) {
			return;
		}
		$key = self::TRANSIENT_PREFIX . get_current_user_id();
		$ids = get_transient( $key );
		if ( ! is_array( $ids ) || empty( $ids ) ) {
			return;
		}
		delete_transient( $key );

		$titles = [];
		foreach ( $ids as $id ) {
			$post = get_post( (int) $id );
			if ( ! $post instanceof \WP_Post ) {
				continue;
			}
			$titles[] = '' !== $post->post_title
				? $post->post_title
				: sprintf(
					/* translators: %d: post ID. */
					__( '#%d (untitled)', 'jumplinks-editorial-workflow' ),
					(int) $id
				);
		}
		if ( empty( $titles ) ) {
			return;
		}

		$message = sprintf(
			/* translators: %s: comma-separated list of post titles. */
			_n(
				'%s could not be published because it still needs an approved review.',
				'These posts could not be published because they still need an approved review: %s.',
				count( $titles ),
				'jumplinks-editorial-workflow'
			),
			esc_html( implode( ', ', $titles ) )
		);

		printf(
			'<div class="notice notice-error is-dismissible"><p>%s</p></div>',
			wp_kses_post( $message )
		);
	}

	/** Whether the editor publish guard should block / show mandatory notices. */
	public static function is_editor_publish_blocked( int $post_id, string $review_status, int $reviewer_id ): bool {
		if ( ! Settings::is_mandatory() ) {
			return false;
		}
		if ( $post_id > 0 && in_array( get_post_status( $post_id ), [ 'publish', 'future' ], true ) ) {
			return false;
		}
		if ( Review::STATUS_APPROVED !== $review_status ) {
			return true;
		}
		if ( $reviewer_id > 0 ) {
			return false;
		}
		// Email invite approvals leave reviewer_id at 0.
		$review = $post_id > 0 ? DB::get_active_review( $post_id ) : null;
		if ( $review && ! empty( Email_Review_Invites_DB::get_for_review( (int) $review->id ) ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Agent-facing publish gate for a post (whether a first-time publish would be blocked).
	 *
	 * @return array{review_mandatory:bool,can_publish:bool,block_reason:?string,status:?string}
	 */
	public static function describe_publish_gate( int $post_id ): array {
		$mandatory = Settings::is_mandatory();
		$review    = $post_id > 0 ? DB::get_active_review( $post_id ) : null;
		$status    = $review ? (string) $review->status : null;

		if ( ! $mandatory ) {
			return [
				'review_mandatory' => false,
				'can_publish'      => true,
				'block_reason'     => null,
				'status'           => $status,
			];
		}

		$post_status = $post_id > 0 ? get_post_status( $post_id ) : '';
		if ( in_array( $post_status, [ 'publish', 'future' ], true ) ) {
			return [
				'review_mandatory' => true,
				'can_publish'      => true,
				'block_reason'     => null,
				'status'           => $status,
			];
		}

		$post_type = $post_id > 0 ? (string) get_post_type( $post_id ) : '';
		if ( '' !== $post_type && ! Settings::is_post_type_supported( $post_type ) ) {
			return [
				'review_mandatory' => true,
				'can_publish'      => true,
				'block_reason'     => null,
				'status'           => $status,
			];
		}

		if ( ! $review ) {
			return [
				'review_mandatory' => true,
				'can_publish'      => false,
				'block_reason'     => 'no_review',
				'status'           => null,
			];
		}

		if ( Review::STATUS_APPROVED === $status ) {
			return [
				'review_mandatory' => true,
				'can_publish'      => true,
				'block_reason'     => null,
				'status'           => $status,
			];
		}

		$reason = 'not_approved';
		if ( Review::STATUS_IN_REVIEW === $status ) {
			$reason = 'in_review';
		} elseif ( Review::STATUS_CHANGES_REQUESTED === $status ) {
			$reason = 'changes_requested';
		}

		return [
			'review_mandatory' => true,
			'can_publish'      => false,
			'block_reason'     => $reason,
			'status'           => $status,
		];
	}

	/** Single source of truth for "is this state transition blocked?". */
	private static function publish_should_be_blocked( int $post_id, string $post_type, string $new_status ): bool {
		if ( ! Settings::is_mandatory() ) {
			return false;
		}
		if ( ! in_array( $new_status, [ 'publish', 'future' ], true ) ) {
			return false;
		}
		if ( '' === $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return false;
		}

		// Already-published posts can be re-saved freely; mirrors the editor UI,
		// which only blocks the initial transition into publish.
		if ( $post_id > 0 ) {
			$existing_status = get_post_status( $post_id );
			if ( in_array( $existing_status, [ 'publish', 'future' ], true ) ) {
				return false;
			}
		}

		$review = $post_id > 0 ? DB::get_active_review( $post_id ) : null;
		if ( $review && Review::STATUS_APPROVED === (string) $review->status ) {
			return false;
		}

		return true;
	}

	private static function remember_blocked( int $post_id ): void {
		if ( ! is_user_logged_in() ) {
			return;
		}
		$key = self::TRANSIENT_PREFIX . get_current_user_id();
		$ids = get_transient( $key );
		$ids = is_array( $ids ) ? $ids : [];
		if ( ! in_array( $post_id, $ids, true ) ) {
			$ids[] = $post_id;
		}
		set_transient( $key, $ids, self::TRANSIENT_TTL );
	}
}
