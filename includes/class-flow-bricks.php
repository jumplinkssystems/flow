<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Bricks {

	public function boot(): void {
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ], 100 );
		add_action( 'wp_footer', [ $this, 'render_panel' ], 1 );
	}

	public function enqueue_assets(): void {
		if ( ! defined( 'BRICKS_VERSION' ) ) {
			return;
		}
		if ( ! function_exists( 'bricks_is_builder_main' ) || ! bricks_is_builder_main() ) {
			return;
		}

		$post_id = $this->get_editor_post_id();
		if ( ! $post_id ) {
			return;
		}

		$post_type = (string) get_post_type( $post_id );
		if ( '' === $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return;
		}

		Assets::enqueue_classic_editor_companion( $post_id );
		Assets::enqueue_builder_bundle( 'bricks' );
	}

	public function render_panel(): void {
		if ( ! defined( 'BRICKS_VERSION' ) ) {
			return;
		}
		if ( ! function_exists( 'bricks_is_builder_main' ) || ! bricks_is_builder_main() ) {
			return;
		}

		$post_id = $this->get_editor_post_id();
		if ( ! $post_id ) {
			return;
		}

		$post_type = (string) get_post_type( $post_id );
		if ( '' === $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return;
		}

		$post = get_post( $post_id );
		if ( ! $post instanceof \WP_Post ) {
			return;
		}

		$review = DB::get_active_review( $post_id );
		$status = $review ? (string) $review->status : '';

		$template = (string) apply_filters(
			'flow_ew_bricks_panel_template',
			FLOW_EW_PLUGIN_DIR . 'templates/bricks/panel.php'
		);
		if ( is_readable( $template ) ) {
			include $template;
		}
	}

	private function get_editor_post_id(): int {
		$id = (int) get_queried_object_id();
		if ( $id > 0 ) {
			return $id;
		}
		$id = (int) get_the_ID();
		return $id > 0 ? $id : 0;
	}
}
