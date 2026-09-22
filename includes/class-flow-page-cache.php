<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Keeps page caches from handing a reviewer a stale or chrome-less copy of a
 * page. Two separate problems:
 *
 * - Storing: our own responses are per-session, so they must never be written
 *   to a cache. `mark_response_uncacheable()` covers that.
 * - Serving: a page cached before the reviewer arrived is returned by the cache
 *   layer before PHP runs, so no runtime signal of ours can stop it. The only
 *   lever is telling each cache plugin that our session cookies mean "bypass".
 *   Plugins that decide inside PHP take the filters registered here; WP Rocket
 *   and W3 Total Cache decide in a drop-in that loads before plugins, so their
 *   cookie lists are written into their saved config instead (see
 *   `maybe_persist_integrations()`).
 *
 * Every hook below is a no-op when its plugin is absent, so registering all of
 * them costs a handful of `add_filter()` calls per request.
 */
final class Page_Cache {

	const OPTION_INTEGRATIONS = 'flow_ew_cache_integrations';

	/** Bump when the persisted config shape changes. */
	const INTEGRATIONS_VERSION = 1;

	public static function boot(): void {
		self::register_exclusions();
		add_action( 'admin_init', [ __CLASS__, 'maybe_persist_integrations' ] );

		foreach ( self::purge_events() as $event ) {
			add_action( $event, [ __CLASS__, 'purge_review_post' ], 10, 2 );
		}
	}

	/**
	 * Cookies that mark a review session. Free contributes the email-invite
	 * cookie; Pro adds the site-review ones through the filter. Resolved lazily
	 * on every call so Pro booting after this class still counts.
	 *
	 * @return string[]
	 */
	public static function session_cookies(): array {
		$cookies = (array) apply_filters( 'flow_ew_session_cookies', [ Email_Review_Cookie::COOKIE_NAME ] );
		$cookies = array_filter(
			array_map( 'strval', $cookies ),
			static function ( string $name ): bool {
				return '' !== $name;
			}
		);
		return array_values( array_unique( $cookies ) );
	}

	/**
	 * Page caches active on this site, by display name. Best effort: a reverse
	 * proxy, a CDN or a host-level cache leaves no trace here, which is why the
	 * site review screen shows the cookie names whether or not this finds
	 * anything.
	 *
	 * @return string[]
	 */
	public static function detected_caches(): array {
		$by_constant = [
			'LiteSpeed Cache'  => [ 'LSCWP_V', 'LSCACHE_ADV_CACHE' ],
			'WP Rocket'        => [ 'WP_ROCKET_VERSION' ],
			'W3 Total Cache'   => [ 'W3TC' ],
			'WP Super Cache'   => [ 'WPCACHEHOME' ],
			'Cache Enabler'    => [ 'CACHE_ENABLER_VERSION' ],
			'WP Fastest Cache' => [ 'WPFC_MAIN_PATH' ],
			'NitroPack'        => [ 'NITROPACK_VERSION' ],
			'Hummingbird'      => [ 'WPHB_VERSION' ],
		];

		$found = [];
		foreach ( $by_constant as $label => $constants ) {
			foreach ( $constants as $constant ) {
				if ( defined( $constant ) ) {
					$found[] = $label;
					break;
				}
			}
		}
		if ( class_exists( '\SiteGround_Optimizer\Loader\Loader' ) ) {
			$found[] = 'SG Optimizer';
		}

		return array_values( array_unique( $found ) );
	}

	public static function has_session_cookie(): bool {
		foreach ( self::session_cookies() as $name ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- presence-only check, the value is never read here.
			if ( ! empty( $_COOKIE[ $name ] ) ) {
				return true;
			}
		}
		return false;
	}

	public static function register_exclusions(): void {
		// LiteSpeed Cache: skip caching, and vary any layer that still caches.
		add_filter( 'litespeed_no_cache_cookies', [ __CLASS__, 'add_session_cookies' ], 10, 1 );
		add_filter( 'litespeed_vary_cookies', [ __CLASS__, 'add_session_cookies' ], 10, 1 );

		// WP Rocket: reject list. Also persisted, see maybe_persist_integrations().
		add_filter( 'rocket_cache_reject_cookies', [ __CLASS__, 'add_session_cookies' ], 10, 1 );

		// WP Super Cache: cookies that vary / bust its cache.
		add_filter( 'wpsc_cookies', [ __CLASS__, 'add_session_cookies' ], 10, 1 );

		// Cache Enabler and SiteGround Optimizer: per-request bypass.
		add_filter( 'cache_enabler_bypass_cache', [ __CLASS__, 'bypass_for_session' ], 10, 1 );
		add_filter( 'sgo_bypass_cache', [ __CLASS__, 'bypass_for_session' ], 10, 1 );

		// W3 Total Cache: runtime storing bypass (serving is config-driven).
		add_filter( 'w3tc_can_cache', [ __CLASS__, 'deny_caching_for_session' ], 99, 1 );
	}

	/**
	 * @param mixed $cookies Cookie list owned by the cache plugin.
	 * @return string[]
	 */
	public static function add_session_cookies( $cookies ): array {
		$cookies = is_array( $cookies ) ? $cookies : [];
		return array_values( array_unique( array_merge( $cookies, self::session_cookies() ) ) );
	}

	/**
	 * @param mixed $bypass
	 * @return bool
	 */
	public static function bypass_for_session( $bypass ): bool {
		return self::has_session_cookie() ? true : (bool) $bypass;
	}

	/**
	 * @param mixed $can_cache
	 * @return bool
	 */
	public static function deny_caching_for_session( $can_cache ): bool {
		return self::has_session_cookie() ? false : (bool) $can_cache;
	}

	/**
	 * Tell WordPress, proxies and page caches that this response belongs to one
	 * session. Safe to call repeatedly; every signal is a no-op when its target
	 * is absent.
	 */
	public static function mark_response_uncacheable(): void {
		nocache_headers();

		// Honoured by WP Rocket, WP Super Cache, W3TC, LiteSpeed, SG Optimizer.
		if ( ! defined( 'DONOTCACHEPAGE' ) ) {
			define( 'DONOTCACHEPAGE', true );
		}

		do_action( 'litespeed_control_set_nocache', 'flow review session-bound response' );

		if ( ! headers_sent() ) {
			// LiteSpeed Web Server caches below PHP and never loads the plugin;
			// this header is its direct opt-out. Unknown header elsewhere.
			header( 'X-LiteSpeed-Cache-Control: no-cache', true );
			header( 'Cache-Control: private, no-store, no-cache, must-revalidate, max-age=0', true );
		}
	}

	/**
	 * WP Rocket and W3 Total Cache answer from a drop-in that runs before
	 * plugins load, so `rocket_cache_reject_cookies` and W3TC's reject list are
	 * only consulted through their saved config. Write ours in once per cookie
	 * set, from an admin request, never on the front end.
	 */
	public static function maybe_persist_integrations(): void {
		$cookies = self::session_cookies();
		if ( [] === $cookies ) {
			return;
		}
		$stamp = self::INTEGRATIONS_VERSION . ':' . md5( implode( ',', $cookies ) );
		if ( (string) get_option( self::OPTION_INTEGRATIONS, '' ) === $stamp ) {
			return;
		}

		self::persist_w3tc_cookies( $cookies );
		self::regenerate_rocket_config();

		update_option( self::OPTION_INTEGRATIONS, $stamp, false );
	}

	/**
	 * W3TC exposes no serve-time filter — `pgcache.reject.cookie` in its saved
	 * config is the only lever. Guarded end to end: its internals and the
	 * filesystem vary by host, and failing here must never break wp-admin.
	 *
	 * @param string[] $cookies
	 */
	private static function persist_w3tc_cookies( array $cookies ): void {
		if ( ! class_exists( '\W3TC\Config' ) ) {
			return;
		}
		try {
			$config = new \W3TC\Config();
			$key    = 'pgcache.reject.cookie';
			$list   = (array) $config->get_array( $key );
			$added  = false;
			foreach ( $cookies as $cookie ) {
				if ( ! in_array( $cookie, $list, true ) ) {
					$list[] = $cookie;
					$added  = true;
				}
			}
			if ( $added ) {
				$config->set( $key, array_values( array_unique( $list ) ) );
				$config->save();
			}
		} catch ( \Throwable $e ) {
			unset( $e );
		}
	}

	/** Rocket bakes its reject list into a config file at generation time. */
	private static function regenerate_rocket_config(): void {
		if ( function_exists( 'rocket_generate_config_file' ) ) {
			rocket_generate_config_file();
		}
		if ( function_exists( 'flush_rocket_htaccess' ) ) {
			flush_rocket_htaccess();
		}
	}

	/** @return string[] */
	private static function purge_events(): array {
		return [
			'flow_ew_review_requested',
			'flow_ew_review_sent',
			'flow_ew_review_resubmitted',
			'flow_ew_review_approved',
			'flow_ew_changes_requested',
			'flow_ew_review_opened',
			'flow_ew_review_closed',
			'flow_ew_review_cancelled',
		];
	}

	/**
	 * Drop the cached copy of a post whose review state just changed, so a page
	 * cached while a review was open does not outlive it.
	 *
	 * @param int $review_id Unused; the events all pass it first.
	 * @param int $post_id   Post the review belongs to.
	 */
	public static function purge_review_post( $review_id = 0, $post_id = 0 ): void {
		unset( $review_id );
		$post_id = (int) $post_id;
		if ( $post_id <= 0 ) {
			return;
		}

		if ( function_exists( 'rocket_clean_post' ) ) {
			rocket_clean_post( $post_id );
		}
		if ( function_exists( 'w3tc_flush_post' ) ) {
			w3tc_flush_post( $post_id );
		}
		if ( function_exists( 'wpsc_delete_post_cache' ) ) {
			wpsc_delete_post_cache( $post_id );
		} elseif ( function_exists( 'wp_cache_post_change' ) ) {
			wp_cache_post_change( $post_id );
		}
		if ( is_callable( [ 'Cache_Enabler', 'clear_page_cache_by_post_id' ] ) ) {
			call_user_func( [ 'Cache_Enabler', 'clear_page_cache_by_post_id' ], $post_id );
		}
		if ( function_exists( 'sg_cachepress_purge_cache' ) ) {
			$url = get_permalink( $post_id );
			if ( is_string( $url ) && '' !== $url ) {
				sg_cachepress_purge_cache( $url );
			}
		}
		do_action( 'litespeed_purge_post', $post_id );
	}
}
