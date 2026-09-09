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
		add_action( 'wp_insert_post', [ $this, 'assign_to_new_content' ], 20, 3 );
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

		$post_type = isset( $post->post_type ) ? (string) $post->post_type : (string) get_post_type( $post_id );
		if ( '' === $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return;
		}

		$reviewer_id = Settings::get_auto_assign_reviewer_id();
		if ( $reviewer_id <= 0 || ! get_userdata( $reviewer_id ) || DB::get_active_review( $post_id ) ) {
			return;
		}

		$requester_id = get_current_user_id();
		if ( $requester_id <= 0 && isset( $post->post_author ) ) {
			$requester_id = (int) $post->post_author;
		}

		self::$assigning = true;
		try {
			Review::request( $post_id, $reviewer_id, $requester_id, true );
		} finally {
			self::$assigning = false;
		}
	}
}
