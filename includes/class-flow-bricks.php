<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Bricks extends Builder_Integration {

	public function boot(): void {
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ], 100 );
		add_action( 'wp_footer', [ $this, 'render_panel' ], 1 );
	}

	protected function slug(): string {
		return 'bricks';
	}

	protected function panel(): array {
		$panel          = parent::panel();
		$panel['close'] = 'bricks';
		return $panel;
	}

	protected function is_builder_request(): bool {
		return defined( 'BRICKS_VERSION' )
			&& function_exists( 'bricks_is_builder_main' )
			&& bricks_is_builder_main();
	}

	protected function get_editor_post_id(): int {
		return self::queried_post_id();
	}
}
