<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Adds a "Review" shortcut to the WordPress admin bar when the current post
 * has an active review the viewer can access. Hooked at priority 90 so the
 * node renders after core's `Edit Page` (added at 80).
 */
class Admin_Bar {

	public function boot(): void {
		add_action( 'admin_bar_menu', [ $this, 'add_review_node' ], 90 );
	}

	public function add_review_node( \WP_Admin_Bar $admin_bar ): void {
		$post_id = $this->resolve_current_post_id();
		if ( $post_id <= 0 ) {
			return;
		}

		$post_type = get_post_type( $post_id );
		if ( ! is_string( $post_type ) || '' === $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return;
		}

		$review = DB::get_active_review( $post_id );
		if ( ! $review ) {
			return;
		}

		$user_id = get_current_user_id();
		if ( $user_id <= 0 ) {
			return;
		}
		if ( ! Review::is_user_review_participant( $review, $user_id ) && ! current_user_can( 'flow_manage_reviews' ) ) {
			return;
		}

		$rev_id  = (int) ( $review->revision_id ?? 0 );
		$preview = Review::get_effective_preview_revision_id( $post_id, $rev_id );
		$url     = Review::get_preview_url( (int) $review->id, $preview, $post_id );

		$admin_bar->add_node(
			[
				'id'    => 'flow-ew-review',
				'title' => __( 'Review', 'jumplinks-editorial-workflow' ),
				'href'  => $url,
				'meta'  => [
					'title' => __( 'Open the review page', 'jumplinks-editorial-workflow' ),
				],
			]
		);
	}

	private function resolve_current_post_id(): int {
		if ( is_admin() ) {
			$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
			if ( $screen && 'post' === $screen->base ) {
				$post = get_post();
				return $post instanceof \WP_Post ? (int) $post->ID : 0;
			}
			return 0;
		}

		if ( is_singular() ) {
			$queried = get_queried_object();
			return $queried instanceof \WP_Post ? (int) $queried->ID : 0;
		}

		return 0;
	}
}
