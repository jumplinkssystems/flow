<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Divi extends Builder_Integration {

	/**
	 * Fires after Flow's Divi bundles are queued in the Visual Builder top window.
	 *
	 * @param int $post_id Builder post ID.
	 */
	const BUILDER_ENQUEUE_HOOK = 'flow_ew_divi_enqueue_assets';

	public function boot(): void {
		// Divi constants/classes load with the theme, after plugins_loaded. Register
		// hooks unconditionally and gate inside each callback.
		add_action( 'divi_visual_builder_assets_after_enqueue_top_window_scripts', [ $this, 'enqueue_assets' ], 10 );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ], 101 );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ], 101 );
		add_action( 'wp_footer', [ $this, 'render_panel' ], 1 );
		add_action( 'admin_footer', [ $this, 'render_panel' ], 1 );
		add_action( 'wp_footer', [ $this, 'print_builder_assets' ], 999 );
		add_action( 'admin_footer', [ $this, 'print_builder_assets' ], 999 );
	}

	protected function slug(): string {
		return 'divi';
	}

	protected function extra_styles(): array {
		return [ 'dashicons' ];
	}

	protected function enqueue_in_render(): bool {
		return true;
	}

	protected function after_enqueue( int $post_id ): void {
		do_action( self::BUILDER_ENQUEUE_HOOK, $post_id );
	}

	public function enqueue_assets(): void {
		if ( $this->bundle_is_queued() ) {
			return;
		}
		parent::enqueue_assets();
	}

	protected function before_print(): void {
		$this->enqueue_assets();
	}

	/** Divi may print from admin_footer, after the normal print pass. */
	protected function classic_is_queued(): bool {
		return wp_script_is( 'flow-ew-classic-editor', 'enqueued' )
			|| wp_script_is( 'flow-ew-classic-editor', 'done' );
	}

	protected function panel(): array {
		$panel                 = parent::panel();
		$panel['drawer_attrs'] = [ 'hidden' => true ];
		$panel['close']        = '';
		$panel['toggle_tag']   = '';
		$panel['upsells']      = true;
		return $panel;
	}

	protected function is_builder_request(): bool {
		$loaded = defined( 'ET_BUILDER_VERSION' )
			|| class_exists( '\ET\Builder\Framework\Utility\Conditions' )
			|| function_exists( 'et_core_is_fb_enabled' );
		if ( ! $loaded ) {
			return false;
		}

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

	protected function get_editor_post_id(): int {
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

		$post_id = self::post_id_from_query( [ 'post', 'page_id', 'p', 'post_id' ] );
		return $post_id > 0 ? $post_id : self::queried_post_id();
	}
}
