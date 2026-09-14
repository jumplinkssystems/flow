<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Avada extends Builder_Integration {

	/**
	 * Fires after Flow's Avada bundles are queued so Pro/upsell companions can
	 * attach without touching `wp_enqueue_scripts` (which would pollute the
	 * global queue and risk printing auth/heartbeat assets in the builder).
	 *
	 * @param int $post_id Builder post ID.
	 */
	const BUILDER_ENQUEUE_HOOK = 'flow_ew_avada_enqueue_assets';

	public function boot(): void {
		add_action( 'wp_footer', [ $this, 'render_panel' ], 1 );
		add_action( 'wp_footer', [ $this, 'print_builder_assets' ], 999 );
	}

	protected function slug(): string {
		return 'avada';
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

	protected function panel(): array {
		$panel                 = parent::panel();
		$panel['drawer_class'] = 'flow-ew-avada-drawer submenu-trigger-target';
		$panel['drawer_attrs'] = [ 'aria-expanded' => 'false' ];
		$panel['toggle_tag']   = 'a';
		$panel['toggle_class'] = 'flow-ew-avada-toggle has-tooltip trigger-submenu-toggling';
		$panel['toggle_attrs'] = [
			'href'   => '#',
			'hidden' => true,
		];
		$panel['upsells']      = true;
		return $panel;
	}

	protected function is_builder_request(): bool {
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

	protected function get_editor_post_id(): int {
		if ( function_exists( 'fusion_library' ) ) {
			$library = fusion_library();
			if ( is_object( $library ) && method_exists( $library, 'get_page_id' ) ) {
				$post_id = (int) $library->get_page_id();
				if ( $post_id > 0 ) {
					return $post_id;
				}
			}
		}
		$post_id = self::post_id_from_query( [ 'post_id', 'post', 'p', 'id' ] );
		return $post_id > 0 ? $post_id : self::queried_post_id();
	}
}
