<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Elementor extends Builder_Integration {

	public function boot(): void {
		if ( ! defined( 'ELEMENTOR_VERSION' ) ) {
			return;
		}
		add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_action( 'elementor/editor/footer', [ $this, 'render_panel' ] );
	}

	protected function slug(): string {
		return 'elementor';
	}

	protected function panel(): array {
		$panel                 = parent::panel();
		$panel['toggle_class'] = 'flow-ew-elementor-toggle flow-ew-elementor-toggle--fallback';
		$panel['toggle_attrs'] = [];
		return $panel;
	}

	/** Both hooks only fire inside the Elementor editor. */
	protected function is_builder_request(): bool {
		return true;
	}

	protected function get_editor_post_id(): int {
		return self::post_id_from_query( [ 'post' ] );
	}
}
