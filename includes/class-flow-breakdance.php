<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Breakdance {

	const BUILDER_HOOK = 'unofficial_i_am_kevin_geary_master_of_all_things_css_and_html';

	public function boot(): void {
		add_action( self::BUILDER_HOOK, [ $this, 'render_panel' ], 1 );
		add_action( self::BUILDER_HOOK, [ $this, 'print_builder_assets' ], 999 );
	}

	public function render_panel(): void {
		if ( ! $this->is_builder_request() ) {
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

		$this->enqueue_builder_assets( $post_id );

		$review = DB::get_active_review( $post_id );
		$status = $review ? (string) $review->status : '';

		$template = (string) apply_filters(
			'flow_ew_breakdance_panel_template',
			FLOW_EW_PLUGIN_DIR . 'templates/breakdance/panel.php'
		);
		if ( is_readable( $template ) ) {
			include $template;
		}
	}

	private function enqueue_builder_assets( int $post_id ): void {
		Assets::enqueue_classic_editor_companion( $post_id );
		Assets::enqueue_builder_bundle( 'breakdance' );
	}

	public function print_builder_assets(): void {
		if ( ! $this->is_builder_request() ) {
			return;
		}
		if ( ! wp_script_is( 'flow-ew-classic-editor', 'enqueued' ) ) {
			return;
		}

		$this->ensure_pro_classic_assets_for_builder();

		// Breakdance's loader template bypasses wp_head/wp_footer, so print Flow
		// handles (Free + Pro) explicitly — never the full global queue.
		$assets = $this->collect_flow_builder_assets();
		if ( [] !== $assets['styles'] ) {
			wp_print_styles( $assets['styles'] );
		}
		if ( [] !== $assets['scripts'] ) {
			wp_print_scripts( $assets['scripts'] );
		}
		wp_print_footer_scripts();
	}

	/**
	 * @return array{styles: string[], scripts: string[]}
	 */
	private function collect_flow_builder_assets(): array {
		global $wp_styles, $wp_scripts;

		$styles  = [];
		$scripts = [];

		if ( isset( $wp_styles->queue ) && is_array( $wp_styles->queue ) ) {
			foreach ( $wp_styles->queue as $handle ) {
				if ( is_string( $handle ) && 0 === strpos( $handle, 'flow-ew-' ) ) {
					$styles[] = $handle;
				}
			}
		}

		if ( wp_style_is( 'dashicons', 'enqueued' ) || wp_style_is( 'dashicons', 'registered' ) ) {
			$styles[] = 'dashicons';
		}

		if ( isset( $wp_scripts->queue ) && is_array( $wp_scripts->queue ) ) {
			foreach ( $wp_scripts->queue as $handle ) {
				if ( is_string( $handle ) && 0 === strpos( $handle, 'flow-ew-' ) ) {
					$scripts[] = $handle;
				}
			}
		}

		return [
			'styles'  => array_values( array_unique( $styles ) ),
			'scripts' => array_values( array_unique( $scripts ) ),
		];
	}

	private function ensure_pro_classic_assets_for_builder(): void {
		if (
			! function_exists( 'flow_ew_pro_should_boot' )
			|| ! \flow_ew_pro_should_boot()
		) {
			return;
		}
		if ( ! defined( 'FLOW_EW_PRO_PLUGIN_DIR' ) || ! defined( 'FLOW_EW_PRO_PLUGIN_URL' ) ) {
			return;
		}
		if ( wp_script_is( 'flow-ew-pro-classic-editor', 'enqueued' ) ) {
			return;
		}

		$asset_file = FLOW_EW_PRO_PLUGIN_DIR . 'build/pro/classic-editor-pro/index.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;
		$deps  = array_merge( (array) ( $asset['dependencies'] ?? [] ), [ 'flow-ew-classic-editor' ] );
		wp_enqueue_script(
			'flow-ew-pro-classic-editor',
			FLOW_EW_PRO_PLUGIN_URL . 'build/pro/classic-editor-pro/index.js',
			$deps,
			$asset['version'] ?? null,
			true
		);
		wp_set_script_translations(
			'flow-ew-pro-classic-editor',
			'jumplinks-editorial-workflow',
			FLOW_EW_PRO_PLUGIN_DIR . 'languages-pro'
		);

		$css_file = FLOW_EW_PRO_PLUGIN_DIR . 'build/pro/classic-editor-pro/index.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style(
				'flow-ew-pro-classic-editor',
				FLOW_EW_PRO_PLUGIN_URL . 'build/pro/classic-editor-pro/index.css',
				[],
				$asset['version'] ?? null
			);
		}
	}

	private function is_builder_request(): bool {
		if ( ! defined( 'BREAKDANCE_MODE' ) || 'breakdance' !== BREAKDANCE_MODE ) {
			return false;
		}
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Builder-mode read-only query args.
		if ( ! isset( $_GET['breakdance'] ) ) {
			return false;
		}
		$mode = sanitize_key( wp_unslash( $_GET['breakdance'] ) );
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		return 'builder' === $mode;
	}

	private function get_editor_post_id(): int {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Builder-mode read-only query args.
		if ( ! isset( $_GET['id'] ) ) {
			return 0;
		}
		$post_id = absint( wp_unslash( $_GET['id'] ) );
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		return $post_id;
	}
}
