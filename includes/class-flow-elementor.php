<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Elementor {

	public function boot(): void {
		if ( ! defined( 'ELEMENTOR_VERSION' ) ) {
			return;
		}

		add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_action( 'elementor/editor/footer', [ $this, 'render_panel' ] );
	}

	public function enqueue_assets(): void {
		$post_id = $this->get_editor_post_id();
		if ( ! $post_id ) {
			return;
		}

		$post_type = (string) get_post_type( $post_id );
		if ( '' === $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return;
		}

		Assets::enqueue_classic_editor_companion( $post_id );
		Assets::enqueue_builder_bundle( 'elementor' );
	}

	public function render_panel(): void {
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
			'flow_ew_elementor_panel_template',
			FLOW_EW_PLUGIN_DIR . 'templates/elementor/panel.php'
		);
		if ( is_readable( $template ) ) {
			include $template;
		}
	}

	private function get_editor_post_id(): int {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Elementor editor; post ID only.
		if ( ! isset( $_GET['post'] ) ) {
			return 0;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return absint( wp_unslash( $_GET['post'] ) );
	}
}
