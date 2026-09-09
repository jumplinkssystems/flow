<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Single-source-of-truth translation loader. One `.l10n.php` per locale powers
 * both PHP (via WP core) and JS — for the JS side we synthesise the Jed JSON
 * payload from the already-loaded entries on the fly and short-circuit WP's
 * file-based lookup via `pre_load_script_translations`, avoiding the need to
 * also ship per-handle JSON files.
 */
final class I18n {

	private const TEXTDOMAIN = 'jumplinks-editorial-workflow';

	/** @var array<string, string|false> Per-locale Jed JSON cache (request-scoped). */
	private static array $cache = array();

	public static function boot(): void {
		add_filter( 'pre_load_script_translations', [ self::class, 'filter_script_translations' ], 10, 4 );
		add_filter( 'locale', [ self::class, 'force_english_for_anonymous_review' ], 0 );
		add_filter( 'determine_locale', [ self::class, 'force_english_for_anonymous_review' ], 0 );
	}

	/**
	 * Anonymous review/site-review visitors don't have a known language
	 * preference, and the site's default locale is rarely what an external
	 * reviewer reads in. Force `en_US` for those requests so the chrome and
	 * inline comments are at least in the lingua franca rather than whatever
	 * the site happens to publish in.
	 *
	 * Logged-in users keep their per-account locale; admin requests are
	 * untouched.
	 */
	public static function force_english_for_anonymous_review( $locale ) {
		if ( is_admin() ) {
			return $locale;
		}
		if ( function_exists( 'is_user_logged_in' ) && is_user_logged_in() ) {
			return $locale;
		}
		// Free per-post review entry URL.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- presence-only check; the review handler verifies its own signed token.
		if ( isset( $_GET['flow_review_id'] ) || isset( $_GET['flow_token'] ) ) {
			return 'en_US';
		}
		// Pro site-review entry URL.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- presence-only check; the link handler verifies its own signed token.
		if ( isset( $_GET['flow_sr'] ) || isset( $_GET['flow_sr_token'] ) ) {
			return 'en_US';
		}
		// Active site-review session (cookie was set on entry, so subsequent
		// navigation within the chrome has no query string but does carry
		// `flow_sr_*` cookies).
		foreach ( array_keys( $_COOKIE ) as $name ) {
			if ( 0 === strncmp( (string) $name, 'flow_sr_', 8 ) ) {
				return 'en_US';
			}
		}
		return $locale;
	}

	/**
	 * @param string|false|null $translations
	 * @param string|false      $file
	 * @param string            $handle
	 * @param string            $domain
	 * @return string|false|null
	 */
	public static function filter_script_translations( $translations, $file, $handle, $domain ) {
		unset( $file, $handle );

		if ( self::TEXTDOMAIN !== $domain ) {
			return $translations;
		}
		// WP starts the filter at `null`. If an earlier filter already
		// returned a JED string (or `false` to explicitly opt out), defer.
		if ( null !== $translations ) {
			return $translations;
		}
		// WP 6.5+ only — older WP doesn't load `.l10n.php` at all.
		if ( ! class_exists( '\WP_Translation_Controller' ) ) {
			return $translations;
		}

		$locale = determine_locale();
		if ( array_key_exists( $locale, self::$cache ) ) {
			return self::$cache[ $locale ];
		}

		$entries = \WP_Translation_Controller::get_instance()->get_entries( self::TEXTDOMAIN );
		if ( empty( $entries ) ) {
			self::$cache[ $locale ] = false;
			return false;
		}

		$messages = array(
			'' => array(
				'domain' => 'messages',
				'lang'   => $locale,
			),
		);
		// Plural entries pack singular + plural separated by \0 (MO/PHP
		// storage format); split always yields the Jed shape.
		foreach ( $entries as $msgid => $msgstr ) {
			if ( '' === $msgid || '' === $msgstr ) {
				continue;
			}
			$messages[ $msgid ] = explode( "\0", $msgstr );
		}

		$jed = array(
			'translation-revision-date' => gmdate( 'c' ),
			'generator'                 => 'flow-ew/' . ( defined( 'FLOW_EW_VERSION' ) ? FLOW_EW_VERSION : '0' ),
			'domain'                    => 'messages',
			'locale_data'               => array( 'messages' => $messages ),
		);

		$json                   = wp_json_encode( $jed );
		self::$cache[ $locale ] = ( false !== $json ) ? $json : false;
		return self::$cache[ $locale ];
	}
}
