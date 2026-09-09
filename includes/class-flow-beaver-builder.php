<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class BeaverBuilder {

	const BUILDER_ENQUEUE_HOOK = 'flow_ew_beaver_enqueue_assets';

	public function boot(): void {
		if ( ! defined( 'FL_BUILDER_VERSION' ) ) {
			return;
		}

		add_action( 'fl_builder_ui_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_action( 'wp_footer', [ $this, 'render_panel' ], 1 );
	}

	public function enqueue_assets(): void {
		$this->queue_assets( null );
	}

	private function queue_assets( ?int $post_id ): void {
		if ( ! $this->is_builder_active() ) {
			return;
		}

		$post_id = $post_id ?? $this->get_editor_post_id();
		if ( $post_id <= 0 ) {
			return;
		}

		$post_type = (string) get_post_type( $post_id );
		if ( '' === $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return;
		}

		Assets::enqueue_classic_editor_companion( $post_id );
		Assets::enqueue_builder_bundle( 'beaver' );
		wp_enqueue_style( 'dashicons' );
	}

	public function render_panel(): void {
		if ( ! $this->is_builder_active() || ! $this->should_render_panel() ) {
			return;
		}

		$post_id = $this->get_editor_post_id();
		if ( $post_id <= 0 ) {
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

		$this->queue_assets( $post_id );
		/**
		 * Fires after Flow's Beaver bundles are queued in the parent UI shell.
		 *
		 * @param int $post_id Builder post ID.
		 */
		do_action( self::BUILDER_ENQUEUE_HOOK, $post_id );

		$review            = DB::get_active_review( $post_id );
		$status            = $review ? (string) $review->status : '';
		$show_free_upsells = Settings::should_show_upgrade_hints()
			&& current_user_can( 'manage_options' )
			&& ( ! function_exists( 'flow_ew_pro_should_boot' ) || ! \flow_ew_pro_should_boot() );
		$upsell_href       = admin_url( Pro_Upsell_Menus::UPGRADE_REDIRECT );

		$template = (string) apply_filters(
			'flow_ew_beaver_panel_template',
			FLOW_EW_PLUGIN_DIR . 'templates/beaver/panel.php'
		);
		if ( is_readable( $template ) ) {
			include $template;
		}
	}

	private function should_render_panel(): bool {
		if ( ! class_exists( '\FLBuilderUIIFrame' ) || ! \FLBuilderUIIFrame::is_enabled() ) {
			return true;
		}

		return \FLBuilderUIIFrame::is_ui_request();
	}

	private function is_builder_active(): bool {
		return class_exists( '\FLBuilderModel' ) && \FLBuilderModel::is_builder_active();
	}

	private function get_editor_post_id(): int {
		if ( class_exists( '\FLBuilderModel' ) ) {
			$id = (int) \FLBuilderModel::get_post_id();
			if ( $id > 0 ) {
				return $id;
			}
		}

		$id = (int) get_queried_object_id();
		if ( $id > 0 ) {
			return $id;
		}

		$id = (int) get_the_ID();
		return $id > 0 ? $id : 0;
	}
}
