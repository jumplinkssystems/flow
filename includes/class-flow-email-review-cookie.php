<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * HttpOnly session cookie for email-invite post reviewers.
 * Cookie value embeds (review_id, jti, ts, sig); verification checks the
 * invite row's cookie_jti + token_version.
 */
class Email_Review_Cookie {

	const COOKIE_NAME           = 'flow_email_review_session';
	const TOKEN_MAX_AGE         = 30 * DAY_IN_SECONDS;
	const SESSION_FRESHNESS_TTL = HOUR_IN_SECONDS;
	const SIGNATURE_PREFIX      = 'flow_email_invite_';

	public static function compute_signature(
		int $review_id,
		string $jti,
		int $token_version,
		int $ts
	): string {
		return wp_hash(
			self::SIGNATURE_PREFIX
				. $review_id . '_'
				. $jti . '_'
				. $token_version . '_'
				. $ts
		);
	}

	public static function sign( int $review_id, string $jti, int $token_version, int $ts ): string {
		$payload = $review_id . '|' . $jti . '|' . $ts;
		$sig     = self::compute_signature( $review_id, $jti, $token_version, $ts );
		return Signed_Cookie::base64url_encode( $payload . '|' . $sig );
	}

	/**
	 * @return array{review_id:int,jti:string,ts:int,row:object}|null
	 */
	public static function verify( string $cookie_value ): ?array {
		if ( '' === $cookie_value ) {
			return null;
		}
		$decoded = Signed_Cookie::base64url_decode( $cookie_value );
		if ( '' === $decoded ) {
			return null;
		}
		$parts = explode( '|', $decoded );
		if ( count( $parts ) !== 4 ) {
			return null;
		}
		[ $review_id_s, $jti, $ts_s, $sig ] = $parts;

		$review_id = (int) $review_id_s;
		$ts        = (int) $ts_s;

		if ( $review_id <= 0 || '' === $jti || $ts <= 0 ) {
			return null;
		}
		if ( ( time() - $ts ) > self::SESSION_FRESHNESS_TTL ) {
			return null;
		}

		$row = Email_Review_Invites_DB::get_by_jti( $jti );
		if ( ! $row || (int) $row->review_id !== $review_id ) {
			return null;
		}

		$expected = self::compute_signature(
			$review_id,
			$jti,
			(int) $row->token_version,
			$ts
		);
		if ( ! hash_equals( $expected, $sig ) ) {
			return null;
		}

		return [
			'review_id' => $review_id,
			'jti'       => $jti,
			'ts'        => $ts,
			'row'       => $row,
		];
	}

	/**
	 * @return array{review_id:int,jti:string,ts:int,row:object}|null
	 */
	public static function verify_from_request(): ?array {
		$raw = self::raw_from_request();
		if ( '' === $raw ) {
			return null;
		}
		return self::verify( $raw );
	}

	public static function raw_from_request(): string {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- signed token; verify() checks signature and freshness before any field is used.
		return isset( $_COOKIE[ self::COOKIE_NAME ] ) ? (string) wp_unslash( $_COOKIE[ self::COOKIE_NAME ] ) : '';
	}

	public static function verify_entry_token(
		string $token,
		int $review_id,
		string $jti,
		int $token_version,
		int $ts
	): bool {
		if ( '' === $token || $ts <= 0 ) {
			return false;
		}
		if ( ( time() - $ts ) > self::TOKEN_MAX_AGE ) {
			return false;
		}
		$expected = self::compute_signature( $review_id, $jti, $token_version, $ts );
		return hash_equals( $expected, $token );
	}

	public static function set( int $review_id, string $jti, int $token_version ): string {
		$ts    = time();
		$value = self::sign( $review_id, $jti, $token_version, $ts );
		return Signed_Cookie::write( self::COOKIE_NAME, $value, $ts + self::SESSION_FRESHNESS_TTL );
	}

	public static function refresh_session( int $review_id, string $jti, int $token_version ): string {
		return self::set( $review_id, $jti, $token_version );
	}

	public static function clear(): string {
		return Signed_Cookie::clear( self::COOKIE_NAME );
	}
}
