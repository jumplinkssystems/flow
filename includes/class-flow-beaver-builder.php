<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class BeaverBuilder extends Builder_Integration {

	/**
	 * Fires after Flow's Beaver bundles are queued in the parent UI shell.
	 *
	 * @param int $post_id Builder post ID.
	 */
	const BUILDER_ENQUEUE_HOOK = 'flow_ew_beaver_enqueue_assets';

	public function boot(): void {
		if ( ! defined( 'FL_BUILDER_VERSION' ) ) {
			return;
		}
		add_action( 'fl_builder_ui_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_action( 'wp_footer', [ $this, 'render_panel' ], 1 );
	}

	protected function slug(): string {
		return 'beaver';
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
		$panel['drawer_class'] = 'flow-ew-beaver-drawer flow-ew-beaver-review-panel';
		$panel['drawer_attrs'] = [ 'hidden' => true ];
		$panel['header_class'] = 'flow-ew-beaver-drawer__header fl-builder--panel-header';
		$panel['close_class']  = 'flow-ew-beaver-drawer__close fl-builder-button fl-builder-button-silent';
		$panel['body_class']   = 'flow-ew-beaver-drawer__body fl-builder--panel-content';
		$panel['arrow']        = true;
		$panel['toggle_class'] = 'flow-ew-beaver-toggle fl-builder-button fl-builder-button-silent';
		$panel['toggle_attrs'] = [
			'aria-expanded' => 'false',
			'hidden'        => true,
		];
		$panel['upsells']      = true;
		return $panel;
	}

	protected function is_builder_request(): bool {
		return class_exists( '\FLBuilderModel' ) && \FLBuilderModel::is_builder_active();
	}

	protected function should_render(): bool {
		if ( ! class_exists( '\FLBuilderUIIFrame' ) || ! \FLBuilderUIIFrame::is_enabled() ) {
			return true;
		}
		return \FLBuilderUIIFrame::is_ui_request();
	}

	protected function get_editor_post_id(): int {
		if ( class_exists( '\FLBuilderModel' ) ) {
			$id = (int) \FLBuilderModel::get_post_id();
			if ( $id > 0 ) {
				return $id;
			}
		}
		return self::queried_post_id();
	}
}
