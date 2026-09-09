<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Free-build upsell shims for Pro-only features: placeholder menu entries,
 * editor upsell links, the review-page footer bar, and the plugin-row
 * "Activate License" / "Upgrade to Pro" links. Registers only when Pro isn't
 * booted — the real Pro pages take over when premium is active.
 */
class Pro_Upsell_Menus {

	const SITE_REVIEW_SLUG  = 'flow-ew-site-review-upsell';
	const INTEGRATIONS_SLUG = 'flow-ew-integrations-upsell';
	const UPGRADE_REDIRECT  = 'admin.php?page=flow-ew-dashboard-pricing';

	public function boot(): void {
		if ( function_exists( 'flow_ew_pro_should_boot' ) && \flow_ew_pro_should_boot() ) {
			return;
		}

		add_action( 'admin_menu', [ $this, 'register_menus' ], 11 );
		add_action( 'admin_menu', [ $this, 'inject_badge_css' ], 12 );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_checkout' ] );
		add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_open_review_upsell' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_open_review_upsell_for_classic' ] );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_review_page_upsell_bar' ], 30 );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_device_selector_upsell' ], 30 );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_comment_editor_upsell' ], 30 );
		// Elementor's own enqueue hook — `admin_enqueue_scripts` fires
		// too early (before the drawer mounts) on its editor screen.
		add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'enqueue_open_review_upsell_for_builder' ] );
		// Bricks renders its builder on the FRONTEND (not wp-admin),
		// gated by `bricks_is_builder_main()`.
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_open_review_upsell_for_bricks' ], 100 );
		add_action( Breakdance::BUILDER_HOOK, [ $this, 'enqueue_open_review_upsell_for_breakdance' ], 100 );
		// Beaver / Avada render Free upsells in their builder bundles
		// (syncFreeUpsells) using drawer data-* attributes — the classic upsell
		// scripts depend on wp-element and are unreliable in those UIs.

		$plugin_basename = defined( 'FLOW_EW_PLUGIN_FILE' )
			? plugin_basename( FLOW_EW_PLUGIN_FILE )
			: 'jumplinks-editorial-workflow/jumplinks-editorial-workflow.php';
		// Final row order is "Upgrade to Pro | Activate License | …WP
		// defaults…" — Activate at 19 so Upgrade at 20 prepends on top.
		add_filter( 'plugin_action_links_' . $plugin_basename, [ $this, 'add_activate_license_action_link' ], 19 );
		add_filter( 'plugin_action_links_' . $plugin_basename, [ $this, 'add_upgrade_action_link' ], 20 );
		add_filter( 'plugin_action_links_' . $plugin_basename, [ $this, 'remove_freemius_upgrade_link' ], 30 );

		// Freemius gates native license activation on `is_premium=true`; borrow
		// its AJAX handlers + dialog template to drive our plugin-row link.
		add_action( 'admin_init', [ $this, 'register_license_activation_ajax_handlers' ], 11 );
		add_action( 'admin_footer-plugins.php', [ $this, 'inject_license_activation_dialog' ] );
	}

	/**
	 * Register the AJAX handlers Freemius skips for Free + has-premium +
	 * no-license — without them our license-activation modal would 400.
	 */
	public function register_license_activation_ajax_handlers(): void {
		if ( ! function_exists( '\\flow_fs' ) ) {
			return;
		}
		$fs = \flow_fs();
		if ( ! is_object( $fs ) ) {
			return;
		}
		$fs->add_ajax_action( 'activate_license', [ $fs, '_activate_license_ajax_action' ] );
		$fs->add_ajax_action( 'resend_license_key', [ $fs, '_resend_license_key_ajax_action' ] );
	}

	public function inject_license_activation_dialog(): void {
		if ( ! function_exists( '\\flow_fs' ) ) {
			return;
		}
		$fs = \flow_fs();
		if ( ! is_object( $fs ) ) {
			return;
		}
		$fs->_add_license_activation_dialog_box();
	}

	/**
	 * The `activate-license {affix}` selector matches what
	 * `forms/license-activation.php` binds its click handler to.
	 *
	 * @param array<int|string,string> $links
	 * @return array<int|string,string>
	 */
	public function add_activate_license_action_link( array $links ): array {
		if ( ! function_exists( '\\flow_fs' ) ) {
			return $links;
		}
		$fs = \flow_fs();
		if ( ! is_object( $fs ) ) {
			return $links;
		}
		$affix = (string) $fs->get_unique_affix();
		$link  = sprintf(
			'<span class="activate-license %1$s"><a href="#">%2$s</a></span>',
			esc_attr( $affix ),
			esc_html__( 'Activate License', 'jumplinks-editorial-workflow' )
		);
		return array_merge( array( 'flow-ew-activate-license' => $link ), $links );
	}

	public function register_menus(): void {
		if ( ! Settings::should_show_upgrade_hints() ) {
			return;
		}
		// Admin-only cap — non-admins can't act on the upgrade anyway,
		// and the real Pro pages are admin-only too.
		add_submenu_page(
			Dashboard_Page::PAGE_SLUG,
			__( 'Flow Site Review', 'jumplinks-editorial-workflow' ),
			$this->labelled_menu_title( __( 'Site Review', 'jumplinks-editorial-workflow' ) ),
			'manage_options',
			self::SITE_REVIEW_SLUG,
			[ $this, 'redirect_to_upgrade' ]
		);

		add_submenu_page(
			Dashboard_Page::PAGE_SLUG,
			__( 'Flow Integrations', 'jumplinks-editorial-workflow' ),
			$this->labelled_menu_title( __( 'Integrations', 'jumplinks-editorial-workflow' ) ),
			'manage_options',
			self::INTEGRATIONS_SLUG,
			[ $this, 'redirect_to_upgrade' ]
		);
	}

	public function redirect_to_upgrade(): void {
		$target = admin_url( self::UPGRADE_REDIRECT );
		if ( ! headers_sent() ) {
			wp_safe_redirect( $target );
			exit;
		}
		printf( '<script>window.location.replace(%s);</script>', wp_json_encode( $target ) );
		exit;
	}

	/**
	 * @param array<int|string,string> $links
	 * @return array<int|string,string>
	 */
	public function remove_freemius_upgrade_link( array $links ): array {
		unset( $links['upgrade'] );
		return $links;
	}

	/**
	 * @param array<int|string,string> $links
	 * @return array<int|string,string>
	 */
	public function add_upgrade_action_link( array $links ): array {
		$href         = esc_url( admin_url( self::UPGRADE_REDIRECT ) );
		$label        = esc_html__( 'Upgrade to Pro', 'jumplinks-editorial-workflow' );
		$upgrade_link = sprintf( '<a href="%s" style="color:#018170;font-weight:600;">%s</a>', $href, $label );
		return array_merge( array( 'flow-ew-upgrade' => $upgrade_link ), $links );
	}

	private function labelled_menu_title( string $label ): string {
		return sprintf(
			'%s <span class="flow-ew-pro-badge">%s</span>',
			$label,
			esc_html__( 'PRO', 'jumplinks-editorial-workflow' )
		);
	}

	/**
	 * Load Freemius's hosted Checkout overlay + a shim that exposes
	 * `window.FlowEwUpgrade.open()` and intercepts `[data-fs-upgrade]` clicks.
	 */
	public function enqueue_checkout(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$plugin_id  = '29591';
		$public_key = 'pk_69180dcea4b3fb0f753ad9b267766';

		wp_enqueue_script(
			'flow-ew-fs-checkout',
			'https://checkout.freemius.com/checkout.js',
			array(),
			// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- CDN, no local version to pin.
			null,
			true
		);

		// Poll up to ~5s for `FS.Checkout` to appear, then configure +
		// bind. CDN failure falls back to the link's href.
		$inline = sprintf(
			"(function(){var ready=false,retries=0;function isReady(){return typeof FS!=='undefined'&&FS.Checkout&&typeof FS.Checkout.configure==='function';}function init(){if(ready)return;if(!isReady()){if(retries++>100)return;return setTimeout(init,50);}FS.Checkout.configure({plugin_id:%s,public_key:%s});ready=true;window.FlowEwUpgrade={open:function(opts){FS.Checkout.open(opts||{});}};document.addEventListener('click',function(e){var t=e.target.closest('[data-fs-upgrade]');if(t){e.preventDefault();FS.Checkout.open({});}},true);}init();})();",
			wp_json_encode( $plugin_id ),
			wp_json_encode( $public_key )
		);
		wp_add_inline_script( 'flow-ew-fs-checkout', $inline );
	}

	public function enqueue_open_review_upsell(): void {
		if ( ! Settings::should_show_upgrade_hints() ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$this->enqueue_open_review_upsell_asset();
	}

	public function enqueue_open_review_upsell_for_builder(): void {
		if ( ! Settings::should_show_upgrade_hints() ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$this->enqueue_open_review_upsell_asset();
	}

	public function enqueue_open_review_upsell_for_bricks(): void {
		if ( ! Settings::should_show_upgrade_hints() ) {
			return;
		}
		if ( ! function_exists( 'bricks_is_builder_main' ) || ! bricks_is_builder_main() ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$this->enqueue_open_review_upsell_asset();
	}

	public function enqueue_open_review_upsell_for_breakdance(): void {
		if ( ! Settings::should_show_upgrade_hints() ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		if ( ! defined( 'BREAKDANCE_MODE' ) ) {
			return;
		}
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Breakdance/Oxygen builder mode query args.
		if ( 'oxygen' === BREAKDANCE_MODE ) {
			$mode = isset( $_GET['oxygen'] ) ? sanitize_key( wp_unslash( $_GET['oxygen'] ) ) : '';
		} elseif ( 'breakdance' === BREAKDANCE_MODE ) {
			$mode = isset( $_GET['breakdance'] ) ? sanitize_key( wp_unslash( $_GET['breakdance'] ) ) : '';
		} else {
			// phpcs:enable WordPress.Security.NonceVerification.Recommended
			return;
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		if ( 'builder' !== $mode ) {
			return;
		}
		$this->enqueue_open_review_upsell_asset();
	}

	public function enqueue_open_review_upsell_for_beaver(): void {
		if ( ! Settings::should_show_upgrade_hints() ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$this->enqueue_open_review_upsell_asset();
	}

	/**
	 * Sticky upgrade bar at the bottom of the per-post review preview. Gated on
	 * Free's review-page bundle being in the queue — that's the only frontend
	 * signal we're on the review page (admin hook_suffix isn't available there).
	 * Admin / dismissal gating is client-side via localStorage.
	 */
	public function enqueue_review_page_upsell_bar(): void {
		if ( ! wp_script_is( 'flow-ew-review-page', 'enqueued' ) ) {
			return;
		}
		$path = FLOW_EW_PLUGIN_DIR . 'assets/js/flow-ew-upsell-review-bar.js';
		$base = defined( 'FLOW_EW_VERSION' ) ? FLOW_EW_VERSION : '1.0.0';
		$ver  = $base . '.' . ( @filemtime( $path ) ?: '0' ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

		wp_enqueue_script(
			'flow-ew-upsell-review-bar',
			FLOW_EW_PLUGIN_URL . 'assets/js/flow-ew-upsell-review-bar.js',
			array( 'flow-ew-review-page' ),
			$ver,
			true
		);
		wp_localize_script(
			'flow-ew-upsell-review-bar',
			'flowEwUpsellReviewBar',
			array(
				/* translators: %s is the coupon code shown as a styled pill inside the upsell bar. */
				'message'      => __( 'Early-bird offer: use code %s at checkout to get an amazing 40% off — first buyers only.', 'jumplinks-editorial-workflow' ),
				'coupon'       => 'EARLYBIRD',
				'ctaLabel'     => __( 'Upgrade now', 'jumplinks-editorial-workflow' ),
				'dismissLabel' => __( 'Dismiss this notice', 'jumplinks-editorial-workflow' ),
				'href'         => admin_url( self::UPGRADE_REDIRECT ),
			)
		);
	}

	public function enqueue_device_selector_upsell(): void {
		if ( ! Settings::should_show_upgrade_hints() ) {
			return;
		}
		if ( ! wp_script_is( 'flow-ew-review-page', 'enqueued' ) ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$path = FLOW_EW_PLUGIN_DIR . 'assets/js/flow-ew-upsell-device-selector.js';
		$base = defined( 'FLOW_EW_VERSION' ) ? FLOW_EW_VERSION : '1.0.0';
		$ver  = $base . '.' . ( @filemtime( $path ) ?: '0' ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

		wp_enqueue_script(
			'flow-ew-upsell-device-selector',
			FLOW_EW_PLUGIN_URL . 'assets/js/flow-ew-upsell-device-selector.js',
			array( 'flow-ew-review-page', 'wp-hooks', 'wp-element', 'wp-components' ),
			$ver,
			true
		);
		wp_localize_script(
			'flow-ew-upsell-device-selector',
			'flowEwUpsellDeviceSelector',
			array(
				'label'    => __( 'Unlock device selector', 'jumplinks-editorial-workflow' ),
				'helpText' => __( 'Preview the post at desktop, tablet, and mobile widths.', 'jumplinks-editorial-workflow' ),
				'href'     => admin_url( self::UPGRADE_REDIRECT ),
			)
		);
	}

	public function enqueue_comment_editor_upsell(): void {
		if ( ! Settings::should_show_upgrade_hints() ) {
			return;
		}
		if ( ! wp_script_is( 'flow-ew-review-page', 'enqueued' ) ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$path = FLOW_EW_PLUGIN_DIR . 'assets/js/flow-ew-upsell-comment-editor.js';
		$base = defined( 'FLOW_EW_VERSION' ) ? FLOW_EW_VERSION : '1.0.0';
		$ver  = $base . '.' . ( @filemtime( $path ) ?: '0' ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

		wp_enqueue_script(
			'flow-ew-upsell-comment-editor',
			FLOW_EW_PLUGIN_URL . 'assets/js/flow-ew-upsell-comment-editor.js',
			array( 'flow-ew-review-page', 'wp-hooks', 'wp-element' ),
			$ver,
			true
		);
		wp_localize_script(
			'flow-ew-upsell-comment-editor',
			'flowEwUpsellCommentEditor',
			array(
				'label'    => __( 'Unlock advanced editor', 'jumplinks-editorial-workflow' ),
				'helpText' => __( 'Rich text formatting and @mentions to ping teammates straight from a comment.', 'jumplinks-editorial-workflow' ),
				'href'     => admin_url( self::UPGRADE_REDIRECT ),
			)
		);
	}

	public function enqueue_open_review_upsell_for_classic( string $hook_suffix ): void {
		if ( ! Settings::should_show_upgrade_hints() ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		// post-edit / post-new only — Gutenberg sessions use
		// `enqueue_block_editor_assets` (idempotent via wp_enqueue).
		if ( ! in_array( $hook_suffix, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}
		$this->enqueue_open_review_upsell_asset();
	}

	private function enqueue_open_review_upsell_asset(): void {
		// filemtime suffix in the version busts the cache per edit.
		$base     = defined( 'FLOW_EW_VERSION' ) ? FLOW_EW_VERSION : '1.0.0';
		$open_js  = FLOW_EW_PLUGIN_DIR . 'assets/js/flow-ew-upsell-open-review.js';
		$rev_js   = FLOW_EW_PLUGIN_DIR . 'assets/js/flow-ew-upsell-reviewer.js';
		$open_ver = $base . '.' . ( @filemtime( $open_js ) ?: '0' ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		$rev_ver  = $base . '.' . ( @filemtime( $rev_js ) ?: '0' );  // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

		wp_enqueue_script(
			'flow-ew-upsell-open-review',
			FLOW_EW_PLUGIN_URL . 'assets/js/flow-ew-upsell-open-review.js',
			array( 'wp-hooks', 'wp-element', 'wp-i18n' ),
			$open_ver,
			true
		);
		wp_localize_script(
			'flow-ew-upsell-open-review',
			'flowEwUpsell',
			array(
				'label'    => __( 'Unlock public reviews', 'jumplinks-editorial-workflow' ),
				'helpText' => __( 'Invite anyone, even people without a WordPress account.', 'jumplinks-editorial-workflow' ),
				'href'     => admin_url( self::UPGRADE_REDIRECT ),
			)
		);

		wp_enqueue_script(
			'flow-ew-upsell-reviewer',
			FLOW_EW_PLUGIN_URL . 'assets/js/flow-ew-upsell-reviewer.js',
			array( 'wp-hooks', 'wp-element', 'wp-i18n' ),
			$rev_ver,
			true
		);
		wp_localize_script(
			'flow-ew-upsell-reviewer',
			'flowEwUpsellReviewer',
			array(
				'label'    => __( 'Unlock multiple reviewers', 'jumplinks-editorial-workflow' ),
				'helpText' => __( 'Require approval from several reviewers before publishing.', 'jumplinks-editorial-workflow' ),
				'href'     => admin_url( self::UPGRADE_REDIRECT ),
			)
		);
	}

	public function inject_badge_css(): void {
		add_action(
			'admin_head',
			static function (): void {
				echo '<style>'
					. '#adminmenu .flow-ew-pro-badge {'
					. 'display:inline-block;padding:1px 6px;margin-left:4px;'
					. 'font-size:9px;font-weight:600;letter-spacing:0.04em;'
					. 'line-height:1.4;border-radius:8px;'
					. 'background:#d0f9ec;color:#09121e;vertical-align:1px;'
					. '}'
					. '</style>';
			}
		);
	}
}
