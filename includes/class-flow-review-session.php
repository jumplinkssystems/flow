<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Does this request carry a valid review link or session?
 *
 * Safe to call from `plugins_loaded` onward: every check below reads only
 * cookies, query args and its own database row, so none of them need
 * `$wp_query`, the current post or the current user.
 *
 * This answers "the link is valid and unexpired", not "the holder may view
 * this content". Callers that gate content still have to authorize; the
 * review page does that for itself at `template_redirect`.
 */
class Review_Session {

	public static function is_active(): bool {
		if ( self::pro_is_active() ) {
			if ( null !== Pro\Site_Review_Cookie::verify_from_request() ) {
				return true;
			}
			if ( null !== Pro\Site_Review_Cookie::verify_preview_from_request() ) {
				return true;
			}
		}

		if ( class_exists( Email_Review_Cookie::class )
			&& null !== Email_Review_Cookie::verify_from_request() ) {
			return true;
		}

		return self::has_valid_preview_link();
	}

	/**
	 * Pro files ship in every build and the autoloader maps them on demand, so
	 * `class_exists()` alone is also true where Pro is installed but not
	 * licensed or active. A stale session cookie must not open the gate there.
	 */
	private static function pro_is_active(): bool {
		if ( ! function_exists( 'flow_ew_pro_should_boot' ) || ! \flow_ew_pro_should_boot() ) {
			return false;
		}
		return class_exists( Pro\Site_Review_Cookie::class );
	}

	/**
	 * The Free preview URL re-presents its signed args on every request, and
	 * it is the only signal for an open-to-public review, which sets no cookie.
	 */
	private static function has_valid_preview_link(): bool {
		if ( ! class_exists( Review::class ) ) {
			return false;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- public preview URL args, verified by the signed token below.
		$review_id = isset( $_GET['flow_review_id'] ) ? (int) sanitize_text_field( wp_unslash( (string) $_GET['flow_review_id'] ) ) : 0;
		if ( $review_id <= 0 ) {
			return false;
		}

		$token    = isset( $_GET['flow_token'] ) ? sanitize_text_field( wp_unslash( (string) $_GET['flow_token'] ) ) : '';
		$token_ts = isset( $_GET['flow_token_ts'] ) ? (int) sanitize_text_field( wp_unslash( (string) $_GET['flow_token_ts'] ) ) : 0;
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		return Review::verify_preview_token( $review_id, $token, $token_ts );
	}
}
