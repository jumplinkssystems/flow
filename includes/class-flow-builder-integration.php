<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Shared shape of a page-builder integration: resolve the post the builder is
 * editing, queue the classic companion plus the builder bundle, render the
 * drawer template, and (for builders whose loader bypasses wp_footer) print
 * Flow's own handles.
 */
abstract class Builder_Integration {

	abstract protected function slug(): string;

	abstract protected function is_builder_request(): bool;

	abstract protected function get_editor_post_id(): int;

	/** Extra registered style handles the drawer needs (e.g. dashicons). */
	protected function extra_styles(): array {
		return [];
	}

	/** Builders without a dedicated enqueue hook queue assets while rendering. */
	protected function enqueue_in_render(): bool {
		return false;
	}

	/** Extra render-time condition (e.g. Beaver's UI-frame check). */
	protected function should_render(): bool {
		return true;
	}

	protected function after_enqueue( int $post_id ): void {}

	protected function before_print(): void {}

	protected function prints_footer_scripts(): bool {
		return false;
	}

	protected function classic_is_queued(): bool {
		return wp_script_is( 'flow-ew-classic-editor', 'enqueued' );
	}

	protected function bundle_is_queued(): bool {
		$handle = 'flow-ew-' . $this->slug();
		return wp_script_is( $handle, 'enqueued' ) || wp_script_is( $handle, 'done' );
	}

	/**
	 * Drawer markup knobs consumed by templates/builder/panel.php.
	 *
	 * @return array<string,mixed>
	 */
	protected function panel(): array {
		$slug = $this->slug();
		return [
			'drawer_class'      => "flow-ew-{$slug}-drawer",
			'drawer_attrs'      => [ 'style' => 'display:none;' ],
			'header_class'      => "flow-ew-{$slug}-drawer__header flow-ew-builder-drawer__header",
			'title_class'       => "flow-ew-{$slug}-drawer__title",
			'close'             => 'dashicons',
			'close_class'       => "flow-ew-{$slug}-drawer__close",
			'body_class'        => "flow-ew-{$slug}-drawer__body",
			'arrow'             => false,
			'toggle_tag'        => 'button',
			'toggle_class'      => "flow-ew-{$slug}-toggle",
			'toggle_attrs'      => [ 'hidden' => true ],
			'toggle_icon_class' => "flow-ew-{$slug}-toggle__icon",
			'upsells'           => false,
		];
	}

	/**
	 * @param array<string,string|true> $attrs
	 */
	public static function attrs( array $attrs ): string {
		$out = '';
		foreach ( $attrs as $name => $value ) {
			$out .= true === $value
				? ' ' . esc_attr( (string) $name )
				: ' ' . esc_attr( (string) $name ) . '="' . esc_attr( (string) $value ) . '"';
		}
		return $out;
	}

	protected function resolve_post(): ?\WP_Post {
		if ( ! $this->is_builder_request() ) {
			return null;
		}
		$post_id = $this->get_editor_post_id();
		if ( $post_id <= 0 ) {
			return null;
		}
		$post_type = (string) get_post_type( $post_id );
		if ( '' === $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return null;
		}
		$post = get_post( $post_id );
		return $post instanceof \WP_Post ? $post : null;
	}

	protected function enqueue_for( int $post_id ): void {
		Assets::enqueue_classic_editor_companion( $post_id );
		Assets::enqueue_builder_bundle( $this->slug() );
		foreach ( $this->extra_styles() as $handle ) {
			wp_enqueue_style( $handle );
		}
		$this->after_enqueue( $post_id );
	}

	public function enqueue_assets(): void {
		$post = $this->resolve_post();
		if ( $post ) {
			$this->enqueue_for( $post->ID );
		}
	}

	public function render_panel(): void {
		if ( ! $this->should_render() ) {
			return;
		}
		$post = $this->resolve_post();
		if ( ! $post ) {
			return;
		}
		if ( $this->enqueue_in_render() && ! $this->bundle_is_queued() ) {
			$this->enqueue_for( $post->ID );
		}

		$builder           = $this->slug();
		$panel             = $this->panel();
		$review            = DB::get_active_review( $post->ID );
		$status            = $review ? (string) $review->status : '';
		$show_free_upsells = Settings::should_show_upgrade_hints()
			&& current_user_can( 'manage_options' )
			&& ( ! function_exists( 'flow_ew_pro_should_boot' ) || ! \flow_ew_pro_should_boot() );
		$upsell_href       = Pro_Upsell_Menus::upgrade_url();

		$template = (string) apply_filters(
			"flow_ew_{$builder}_panel_template",
			FLOW_EW_PLUGIN_DIR . 'templates/builder/panel.php'
		);
		if ( is_readable( $template ) ) {
			include $template;
		}
	}

	/**
	 * Loader templates that bypass wp_head/wp_footer get Flow's handles printed
	 * explicitly — never the full global queue, which can pull in heartbeat /
	 * auth-check scripts and log the user out of the builder.
	 */
	public function print_builder_assets(): void {
		if ( ! $this->is_builder_request() ) {
			return;
		}
		$this->before_print();
		if ( ! $this->classic_is_queued() ) {
			return;
		}

		$assets = self::collect_flow_assets();
		if ( [] !== $assets['styles'] ) {
			wp_print_styles( $assets['styles'] );
		}
		if ( [] !== $assets['scripts'] ) {
			wp_print_scripts( $assets['scripts'] );
		}
		if ( $this->prints_footer_scripts() ) {
			wp_print_footer_scripts();
		}
	}

	/**
	 * @return array{styles: string[], scripts: string[]}
	 */
	protected static function collect_flow_assets(): array {
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

	/**
	 * @param string[] $params Query args to try, in order.
	 */
	protected static function post_id_from_query( array $params ): int {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Builder-mode read-only query args.
		foreach ( $params as $param ) {
			if ( isset( $_GET[ $param ] ) ) {
				$post_id = absint( wp_unslash( $_GET[ $param ] ) );
				if ( $post_id > 0 ) {
					return $post_id;
				}
			}
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		return 0;
	}

	protected static function queried_post_id(): int {
		$id = (int) get_queried_object_id();
		if ( $id > 0 ) {
			return $id;
		}
		$id = (int) get_the_ID();
		return $id > 0 ? $id : 0;
	}
}
