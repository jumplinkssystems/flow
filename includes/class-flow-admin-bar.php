<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Adds a "Review" shortcut to the WordPress admin bar when the current post
 * has an active review the viewer can access. Hooked at priority 90 so the
 * node renders after core's `Edit Page` (added at 80).
 */
class Admin_Bar {

	/** @var object|false|null Active review for this request; false once resolved to "none". */
	private $review_memo = null;

	public function boot(): void {
		add_action( 'admin_bar_menu', [ $this, 'add_review_node' ], 90 );
		// `admin_bar_menu` fires after wp_head, too late to enqueue anything.
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_icon_styles' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_icon_styles' ] );
	}

	public function add_review_node( \WP_Admin_Bar $admin_bar ): void {
		$review = $this->current_review();
		if ( ! $review ) {
			return;
		}

		$post_id = (int) $review->post_id;
		$rev_id  = (int) ( $review->revision_id ?? 0 );
		$preview = Review::get_effective_preview_revision_id( $post_id, $rev_id );
		$url     = Review::get_preview_url( (int) $review->id, $preview, $post_id );
		$status  = Review::display_status( $review );

		$admin_bar->add_node(
			[
				'id'    => 'flow-ew-review',
				'title' => $this->node_title( $status ),
				'href'  => $url,
				'meta'  => [
					'title' => __( 'Open the review page', 'jumplinks-editorial-workflow' ) . ' — ' . Review::status_label( $status ),
				],
			]
		);
	}

	/**
	 * The icon is the builder toggle's: head and limbs follow the bar's text
	 * colour, the torso carries the review status (see the builder stylesheets).
	 */
	public function enqueue_icon_styles(): void {
		if ( ! is_admin_bar_showing() ) {
			return;
		}
		$review = $this->current_review();
		if ( ! $review ) {
			return;
		}

		$css = '#wpadminbar #wp-admin-bar-flow-ew-review .flow-ew-adminbar-icon{display:inline-block;vertical-align:middle;width:16px;height:16px;margin:0 6px 0 0;line-height:0}'
			. '#wpadminbar #wp-admin-bar-flow-ew-review .flow-ew-jumplink-icon{display:block;width:16px;height:16px}';

		$color = Assets::status_color( Review::display_status( $review ) );
		if ( '' !== $color ) {
			$css .= sprintf(
				'#wpadminbar #wp-admin-bar-flow-ew-review .flow-ew-jumplink-icon__torso{color:%s}',
				$color
			);
		}

		wp_add_inline_style( 'admin-bar', $css );
	}

	private function node_title( string $status ): string {
		$label = esc_html__( 'Review', 'jumplinks-editorial-workflow' );
		$icon  = self::icon_svg();
		if ( '' === $icon ) {
			return $label;
		}
		return sprintf(
			'<span class="flow-ew-adminbar-icon" data-status="%1$s" aria-hidden="true">%2$s</span>%3$s',
			esc_attr( $status ),
			$icon,
			$label
		);
	}

	/** Same artwork the builder toggles render, so the two stay in sync. */
	private static function icon_svg(): string {
		static $svg = null;
		if ( null !== $svg ) {
			return $svg;
		}
		$path = FLOW_EW_PLUGIN_DIR . 'templates/builder/toggle-icon.php';
		if ( ! is_readable( $path ) ) {
			$svg = '';
			return $svg;
		}
		ob_start();
		require $path;
		$svg = (string) ob_get_clean();
		return $svg;
	}

	/**
	 * Active review for the post being viewed, when the viewer may open it.
	 * Memoised: both the enqueue and the node need it in the same request.
	 *
	 * @return object|null
	 */
	private function current_review() {
		if ( null !== $this->review_memo ) {
			return false === $this->review_memo ? null : $this->review_memo;
		}
		$this->review_memo = false;

		$post_id = $this->resolve_current_post_id();
		if ( $post_id <= 0 ) {
			return null;
		}

		$post_type = get_post_type( $post_id );
		if ( ! is_string( $post_type ) || '' === $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return null;
		}

		$review = DB::get_active_review( $post_id );
		if ( ! $review ) {
			return null;
		}

		$user_id = get_current_user_id();
		if ( $user_id <= 0 ) {
			return null;
		}
		if ( ! current_user_can( 'flow_manage_reviews' ) && ! Review::is_user_review_participant( $review, $user_id ) ) {
			return null;
		}

		$this->review_memo = $review;
		return $review;
	}

	private function resolve_current_post_id(): int {
		if ( is_admin() ) {
			$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
			if ( $screen && 'post' === $screen->base ) {
				$post = get_post();
				return $post instanceof \WP_Post ? (int) $post->ID : 0;
			}
			return 0;
		}

		if ( is_singular() ) {
			$queried = get_queried_object();
			return $queried instanceof \WP_Post ? (int) $queried->ID : 0;
		}

		return 0;
	}
}
