<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Divi {

	const BUILDER_ENQUEUE_HOOK = 'flow_ew_divi_enqueue_assets';

	public function boot(): void {
		// Divi constants/classes load with the theme, after plugins_loaded. Register
		// hooks unconditionally and gate inside each callback (same as Avada/Bricks).
		add_action( 'divi_visual_builder_assets_after_enqueue_top_window_scripts', [ $this, 'enqueue_assets' ], 10 );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ], 101 );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ], 101 );
		add_action( 'wp_footer', [ $this, 'render_panel' ], 1 );
		add_action( 'admin_footer', [ $this, 'render_panel' ], 1 );
		add_action( 'wp_footer', [ $this, 'print_builder_assets' ], 999 );
		add_action( 'admin_footer', [ $this, 'print_builder_assets' ], 999 );
	}

	public function enqueue_assets(): void {
		if ( ! $this->should_load() || ! $this->is_builder_request() ) {
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

		if ( wp_script_is( 'flow-ew-divi', 'enqueued' ) || wp_script_is( 'flow-ew-divi', 'done' ) ) {
			return;
		}

		Assets::enqueue_classic_editor_companion( $post_id );
		Assets::enqueue_builder_bundle( 'divi' );
		wp_enqueue_style( 'dashicons' );

		/**
		 * Fires after Flow's Divi bundles are queued in the Visual Builder top window.
		 *
		 * @param int $post_id Builder post ID.
		 */
		do_action( self::BUILDER_ENQUEUE_HOOK, $post_id );
	}

	public function render_panel(): void {
		if ( ! $this->should_load() || ! $this->is_builder_request() ) {
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

		$this->enqueue_assets();

		$review            = DB::get_active_review( $post_id );
		$status            = $review ? (string) $review->status : '';
		$show_free_upsells = Settings::should_show_upgrade_hints()
			&& current_user_can( 'manage_options' )
			&& ( ! function_exists( 'flow_ew_pro_should_boot' ) || ! \flow_ew_pro_should_boot() );
		$upsell_href       = Pro_Upsell_Menus::upgrade_url();

		$template = (string) apply_filters(
			'flow_ew_divi_panel_template',
			FLOW_EW_PLUGIN_DIR . 'templates/divi/panel.php'
		);
		if ( is_readable( $template ) ) {
			include $template;
		}
	}

	public function print_builder_assets(): void {
		if ( ! $this->should_load() || ! $this->is_builder_request() ) {
			return;
		}

		if ( ! wp_script_is( 'flow-ew-divi', 'enqueued' ) && ! wp_script_is( 'flow-ew-divi', 'done' ) ) {
			$this->enqueue_assets();
		}

		if ( ! wp_script_is( 'flow-ew-classic-editor', 'enqueued' ) && ! wp_script_is( 'flow-ew-classic-editor', 'done' ) ) {
			return;
		}

		$this->ensure_pro_classic_assets_for_builder();

		$assets = $this->collect_flow_builder_assets();
		if ( [] !== $assets['styles'] ) {
			wp_print_styles( $assets['styles'] );
		}
		if ( [] !== $assets['scripts'] ) {
			wp_print_scripts( $assets['scripts'] );
		}
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

	private function should_load(): bool {
		return defined( 'ET_BUILDER_VERSION' )
			|| class_exists( '\ET\Builder\Framework\Utility\Conditions' )
			|| function_exists( 'et_core_is_fb_enabled' );
	}

	private function is_builder_request(): bool {
		if ( class_exists( '\ET\Builder\Framework\Utility\Conditions' ) ) {
			// Match Divi PackageBuildManager's top-window asset scope (page bar lives here).
			return \ET\Builder\Framework\Utility\Conditions::is_vb_top_window()
				|| \ET\Builder\Framework\Utility\Conditions::is_tb_admin_screen()
				|| \ET\Builder\Framework\Utility\Conditions::is_block_editor();
		}

		if ( ! function_exists( 'et_core_is_fb_enabled' ) || ! et_core_is_fb_enabled() ) {
			return false;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Builder-mode read-only query args.
		return ! isset( $_GET['app_window'] ) || '1' !== $_GET['app_window'];
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
	}

	private function get_editor_post_id(): int {
		if ( function_exists( 'et_core_get_main_post_id' ) ) {
			$post_id = (int) et_core_get_main_post_id();
			if ( $post_id > 0 ) {
				return $post_id;
			}
		}

		global $post;

		if ( $post instanceof \WP_Post && $post->ID > 0 ) {
			return (int) $post->ID;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Builder post ID from query args.
		if ( isset( $_GET['post'] ) ) {
			$post_id = absint( wp_unslash( $_GET['post'] ) );
			if ( $post_id > 0 ) {
				return $post_id;
			}
		}
		if ( isset( $_GET['page_id'] ) ) {
			$page_id = absint( wp_unslash( $_GET['page_id'] ) );
			if ( $page_id > 0 ) {
				return $page_id;
			}
		}
		if ( isset( $_GET['p'] ) ) {
			$p = absint( wp_unslash( $_GET['p'] ) );
			if ( $p > 0 ) {
				return $p;
			}
		}
		if ( isset( $_GET['post_id'] ) ) {
			$post_id = absint( wp_unslash( $_GET['post_id'] ) );
			if ( $post_id > 0 ) {
				return $post_id;
			}
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		$id = (int) get_queried_object_id();
		if ( $id > 0 ) {
			return $id;
		}

		$id = (int) get_the_ID();
		return $id > 0 ? $id : 0;
	}
}
