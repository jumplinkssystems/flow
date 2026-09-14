<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Breakdance and Oxygen 6 share one loader template (`BREAKDANCE_MODE` picks
 * the product) and enter the builder via `?{mode}=builder&id=`.
 */
abstract class Breakdance_Family extends Builder_Integration {

	/** Same loader hook both products fire. */
	const BUILDER_HOOK = 'unofficial_i_am_kevin_geary_master_of_all_things_css_and_html';

	public function boot(): void {
		add_action( self::BUILDER_HOOK, [ $this, 'render_panel' ], 1 );
		add_action( self::BUILDER_HOOK, [ $this, 'print_builder_assets' ], 999 );
	}

	protected function enqueue_in_render(): bool {
		return true;
	}

	protected function prints_footer_scripts(): bool {
		return true;
	}

	protected function panel(): array {
		$panel                  = parent::panel();
		$panel['close']         = 'breakdance';
		$panel['toggle_class'] .= ' breakdance-toolbar-icon-button';
		return $panel;
	}

	protected function is_builder_request(): bool {
		$mode = $this->slug();
		if ( ! defined( 'BREAKDANCE_MODE' ) || BREAKDANCE_MODE !== $mode ) {
			return false;
		}
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Builder-mode read-only query args.
		if ( ! isset( $_GET[ $mode ] ) ) {
			return false;
		}
		$value = sanitize_key( wp_unslash( $_GET[ $mode ] ) );
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		return 'builder' === $value;
	}

	protected function get_editor_post_id(): int {
		return self::post_id_from_query( [ 'id' ] );
	}
}
