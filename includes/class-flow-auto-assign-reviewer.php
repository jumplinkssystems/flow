<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Assigns one configured reviewer when supported content is first created.
 */
class Auto_Assign_Reviewer {

	private static bool $assigning = false;

	public function boot(): void {
		// Direct creation of a real draft/pending post (e.g. via REST).
		add_action( 'wp_insert_post', [ $this, 'assign_to_new_content' ], 20, 3 );
		// The editor first inserts an `auto-draft`, then transitions it to
		// `draft` on the first save. Assign at that transition so opening
		// "Add New" (and abandoning it) never creates a review, a webhook
		// delivery, or orphan rows.
		add_action( 'transition_post_status', [ $this, 'assign_on_first_save' ], 20, 3 );
	}

	/**
	 * @param \WP_Post|object $post Newly inserted post object.
	 */
	public function assign_to_new_content( int $post_id, $post, bool $update ): void {
		if (
			$update
			|| self::$assigning
			|| wp_is_post_revision( $post_id )
			|| wp_is_post_autosave( $post_id )
		) {
			return;
		}

		// An `auto-draft` is the empty placeholder created by "Add New"; the
		// real review is created when it first transitions to a saved status.
		$post_status = isset( $post->post_status ) ? (string) $post->post_status : (string) get_post_status( $post_id );
		if ( 'auto-draft' === $post_status ) {
			return;
		}

		$this->maybe_assign( $post_id, $post );
	}

	/**
	 * @param \WP_Post|object $post Post transitioning status.
	 */
	public function assign_on_first_save( string $new_status, string $old_status, $post ): void {
		// Only the auto-draft → first-save transition. Later status changes
		// (draft → publish, etc.) never create the review.
		if ( 'auto-draft' !== $old_status || 'auto-draft' === $new_status ) {
			return;
		}
		if ( in_array( $new_status, [ 'trash', 'inherit' ], true ) ) {
			return;
		}
		$post_id = isset( $post->ID ) ? (int) $post->ID : 0;
		if ( $post_id <= 0 ) {
			return;
		}
		$this->maybe_assign( $post_id, $post );
	}

	/**
	 * Who auto-assign will attach on this post's first save, or 0 for nobody.
	 * Editors render it as a pending assignment; no row is written until then.
	 */
	public static function pending_reviewer_id( int $post_id ): int {
		if ( $post_id <= 0 || 'auto-draft' !== get_post_status( $post_id ) ) {
			return 0;
		}
		return self::eligible_reviewer_id( $post_id, get_post( $post_id ) );
	}

	/**
	 * @param \WP_Post|object|null $post
	 */
	private static function eligible_reviewer_id( int $post_id, $post ): int {
		$post_type = isset( $post->post_type ) ? (string) $post->post_type : (string) get_post_type( $post_id );
		if ( '' === $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return 0;
		}

		$reviewer_id = Settings::get_auto_assign_reviewer_id();
		if (
			$reviewer_id <= 0
			|| ! get_userdata( $reviewer_id )
			|| ! Review::user_can_be_reviewer( $reviewer_id )
			|| DB::get_active_review( $post_id )
		) {
			return 0;
		}

		return $reviewer_id;
	}

	/**
	 * @param \WP_Post|object $post
	 */
	private function maybe_assign( int $post_id, $post ): void {
		if ( self::$assigning ) {
			return;
		}

		$reviewer_id = self::eligible_reviewer_id( $post_id, $post );
		if ( $reviewer_id <= 0 ) {
			return;
		}

		$requester_id = get_current_user_id();
		if ( $requester_id <= 0 && isset( $post->post_author ) ) {
			$requester_id = (int) $post->post_author;
		}

		self::$assigning = true;
		try {
			Review::request( $post_id, $reviewer_id, $requester_id, true );
		} catch ( \Throwable $e ) {
			// A misconfigured reviewer must never fatal a post save.
			unset( $e );
		} finally {
			self::$assigning = false;
		}
	}
}
