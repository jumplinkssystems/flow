<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Avada {

	const BUILDER_ENQUEUE_HOOK = 'flow_ew_avada_enqueue_assets';

	public function boot(): void {
		add_action( 'wp_footer', [ $this, 'render_panel' ], 1 );
		add_action( 'wp_footer', [ $this, 'print_builder_assets' ], 999 );
	}

	public function enqueue_assets( ?int $post_id = null ): void {
		if ( ! self::is_builder_request() ) {
			return;
		}

		$post_id = $post_id ?? self::get_builder_post_id();
		if ( $post_id <= 0 ) {
			return;
		}

		$post_type = (string) get_post_type( $post_id );
		if ( '' === $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return;
		}

		Assets::enqueue_classic_editor_companion( $post_id );
		Assets::enqueue_builder_bundle( 'avada' );
		wp_enqueue_style( 'dashicons' );
	}

	public function render_panel(): void {
		if ( ! self::is_builder_request() ) {
			return;
		}

		$post_id = self::get_builder_post_id();
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

		$this->enqueue_assets( $post_id );
		/**
		 * Fires after Flow's Avada bundles are queued so Pro/upsell companions
		 * can attach without touching `wp_enqueue_scripts` (which would pollute
		 * the global queue and risk printing auth/heartbeat assets in the builder).
		 *
		 * @param int $post_id Builder post ID.
		 */
		do_action( self::BUILDER_ENQUEUE_HOOK, $post_id );

		$review            = DB::get_active_review( $post_id );
		$status            = $review ? (string) $review->status : '';
		$show_free_upsells = Settings::should_show_upgrade_hints()
			&& current_user_can( 'manage_options' )
			&& ( ! function_exists( 'flow_ew_pro_should_boot' ) || ! \flow_ew_pro_should_boot() );
		$upsell_href       = Pro_Upsell_Menus::upgrade_url();

		$template = (string) apply_filters(
			'flow_ew_avada_panel_template',
			FLOW_EW_PLUGIN_DIR . 'templates/avada/panel.php'
		);
		if ( is_readable( $template ) ) {
			include $template;
		}
	}

	public function print_builder_assets(): void {
		if ( ! self::is_builder_request() ) {
			return;
		}
		if ( ! wp_script_is( 'flow-ew-classic-editor', 'enqueued' ) ) {
			return;
		}

		$this->ensure_pro_classic_assets_for_builder();

		// Avada's builder chrome can skip normal footer queues. Print only Flow's
		// own handles — never the full global queue, which can pull in heartbeat /
		// auth-check scripts and log the user out of the builder.
		$assets = $this->collect_flow_builder_assets();
		if ( [] !== $assets['styles'] ) {
			wp_print_styles( $assets['styles'] );
		}
		if ( [] !== $assets['scripts'] ) {
			wp_print_scripts( $assets['scripts'] );
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

	public static function is_builder_request(): bool {
		if ( ! defined( 'FUSION_BUILDER_VERSION' ) || ! defined( 'AVADA_VERSION' ) ) {
			return false;
		}

		if ( ! function_exists( 'fusion_is_builder_frame' ) || ! fusion_is_builder_frame() ) {
			return false;
		}

		// Keep Flow off Avada's preview iframe; integration belongs to the
		// builder chrome where controls live.
		if ( function_exists( 'fusion_is_preview_frame' ) && fusion_is_preview_frame() ) {
			return false;
		}

		return true;
	}

	public static function get_builder_post_id(): int {
		if ( function_exists( 'fusion_library' ) ) {
			$library = fusion_library();
			if ( is_object( $library ) && method_exists( $library, 'get_page_id' ) ) {
				$post_id = (int) $library->get_page_id();
				if ( $post_id > 0 ) {
					return $post_id;
				}
			}
		}

		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Live builder read-only params.
		foreach ( [ 'post_id', 'post', 'p', 'id' ] as $param ) {
			if ( isset( $_GET[ $param ] ) ) {
				$post_id = absint( wp_unslash( $_GET[ $param ] ) );
				if ( $post_id > 0 ) {
					return $post_id;
				}
			}
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		$post_id = (int) get_queried_object_id();
		if ( $post_id > 0 ) {
			return $post_id;
		}

		$post_id = (int) get_the_ID();
		return $post_id > 0 ? $post_id : 0;
	}
}
