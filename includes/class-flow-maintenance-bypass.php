<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Lets a valid review link through a builder's maintenance or coming-soon
 * screen, and nobody else.
 *
 * Registers on `init` priority 2. The magic-link entry handlers run at
 * priority 1 and end in a redirect, so from here on a surviving request
 * carries either its session cookie or its signed query args. That is still
 * earlier than every gate, the earliest being Bricks on `wp` 9 and Beaver
 * Builder on `template_redirect` 1.
 *
 * Getting past the screen is not authorization: the review page authorizes for
 * itself later, and turns away anyone whose link does not entitle them to the
 * content.
 */
class Maintenance_Bypass {

	public static function boot(): void {
		add_action( 'init', [ __CLASS__, 'maybe_register' ], 2 );
	}

	public static function maybe_register(): void {
		// Only front-end page rendering passes through these gates.
		if ( is_admin() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
			return;
		}
		if ( ! Review_Session::is_active() ) {
			return;
		}
		/**
		 * Filters whether a valid review link may pass a maintenance screen.
		 *
		 * @param bool $allow Whether to disarm the gates for this request.
		 */
		if ( ! (bool) apply_filters( 'flow_ew_bypass_maintenance', true ) ) {
			return;
		}

		// Builders that publish an exemption filter, evaluated per request.
		add_filter( 'bricks/maintenance/should_apply', '__return_false', 99 );
		add_filter( 'awb_maintenance_should_redirect', '__return_false', 99 );

		// Elementor decides whether to hook at `init` 0 and never re-reads the
		// mode afterwards, so suppressing its option here would be too late.
		// Its callback checks this filter at request time and returns as soon
		// as it is true.
		add_filter( 'elementor/maintenance_mode/is_login_page', '__return_true', 99 );

		// No exemption filter on these: suppress the option each one re-reads
		// while deciding. Every other hook stays in place, so Breakdance and
		// Oxygen still render real content inside the review iframe.
		add_filter( 'pre_option__fl_builder_maintenance_enabled', [ __CLASS__, 'disable_flag' ], 99 );
		add_filter( 'pre_option_breakdance_maintenance_mode_options', [ __CLASS__, 'disable_encoded_options' ], 99 );
		add_filter( 'pre_option_oxygen_maintenance_mode_options', [ __CLASS__, 'disable_encoded_options' ], 99 );

		// The review page and the site-review chrome each exempt themselves
		// from WooCommerce already, but neither does inside the review iframe.
		add_filter( 'woocommerce_coming_soon_exclude', '__return_true', 99 );

		// Bricks only gained its decision filter in 2.0. Older versions apply
		// the wall unconditionally on `wp` 9, so run just ahead of it.
		add_action( 'wp', [ __CLASS__, 'unhook_legacy_bricks' ], 8 );

		// This request now renders content a stranger must never receive from
		// a cache. The email-invite and site-review cookies are already on the
		// cache-bypass lists, but a Free preview link carries no cookie at all.
		Page_Cache::mark_response_uncacheable();
	}

	/**
	 * Bricks < 2.0 has no `bricks/maintenance/should_apply`, so the only lever
	 * is removing its callback — for this request alone, after the filter-based
	 * path has already been ruled out by the version check.
	 */
	public static function unhook_legacy_bricks(): void {
		if ( ! class_exists( '\Bricks\Maintenance' ) ) {
			return;
		}
		if ( defined( 'BRICKS_VERSION' ) && version_compare( (string) BRICKS_VERSION, '2.0', '>=' ) ) {
			return;
		}
		$get_mode     = [ '\Bricks\Maintenance', 'get_mode' ];
		$get_instance = [ '\Bricks\Maintenance', 'get_instance' ];
		if ( ! is_callable( $get_mode ) || ! call_user_func( $get_mode ) ) {
			return;
		}
		if ( ! is_callable( $get_instance ) ) {
			return;
		}
		remove_action( 'wp', [ call_user_func( $get_instance ), 'apply_maintenance_mode' ], 9 );
	}

	public static function disable_flag(): string {
		return '';
	}

	/**
	 * Breakdance and Oxygen JSON-decode this option and reject anything that is
	 * not a string, so the stand-in has to be an encoded empty set.
	 */
	public static function disable_encoded_options(): string {
		return (string) wp_json_encode( [] );
	}
}
