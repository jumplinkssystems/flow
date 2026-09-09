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
		return self::base64url_encode( $payload . '|' . $sig );
	}

	/**
	 * @return array{review_id:int,jti:string,ts:int}|null
	 */
	public static function verify( string $cookie_value ): ?array {
		if ( '' === $cookie_value ) {
			return null;
		}
		$decoded = self::base64url_decode( $cookie_value );
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
		];
	}

	/**
	 * @return array{review_id:int,jti:string,ts:int}|null
	 */
	public static function verify_from_request(): ?array {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$raw = isset( $_COOKIE[ self::COOKIE_NAME ] ) ? (string) wp_unslash( $_COOKIE[ self::COOKIE_NAME ] ) : '';
		if ( '' === $raw ) {
			return null;
		}
		return self::verify( $raw );
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
		setcookie(
			self::COOKIE_NAME,
			$value,
			[
				'expires'  => $ts + self::SESSION_FRESHNESS_TTL,
				'path'     => COOKIEPATH,
				'domain'   => COOKIE_DOMAIN ?: '',
				'secure'   => is_ssl(),
				'httponly' => true,
				'samesite' => 'Lax',
			]
		);
		$_COOKIE[ self::COOKIE_NAME ] = $value;
		return self::build_set_cookie_header( self::COOKIE_NAME, $value, $ts + self::SESSION_FRESHNESS_TTL );
	}

	public static function refresh_session( int $review_id, string $jti, int $token_version ): string {
		return self::set( $review_id, $jti, $token_version );
	}

	public static function clear(): string {
		$expires_ts = time() - HOUR_IN_SECONDS;
		setcookie(
			self::COOKIE_NAME,
			'',
			[
				'expires'  => $expires_ts,
				'path'     => COOKIEPATH,
				'domain'   => COOKIE_DOMAIN ?: '',
				'secure'   => is_ssl(),
				'httponly' => true,
				'samesite' => 'Lax',
			]
		);
		unset( $_COOKIE[ self::COOKIE_NAME ] );
		return self::build_set_cookie_header( self::COOKIE_NAME, '', $expires_ts );
	}

	private static function build_set_cookie_header( string $name, string $value, int $expires_ts ): string {
		$parts = [
			rawurlencode( $name ) . '=' . rawurlencode( $value ),
			'expires=' . gmdate( 'D, d M Y H:i:s T', $expires_ts ),
			'Max-Age=' . max( 0, $expires_ts - time() ),
			'path=' . COOKIEPATH,
		];
		if ( COOKIE_DOMAIN ) {
			$parts[] = 'domain=' . COOKIE_DOMAIN;
		}
		if ( is_ssl() ) {
			$parts[] = 'secure';
		}
		$parts[] = 'HttpOnly';
		$parts[] = 'SameSite=Lax';
		return implode( '; ', $parts );
	}

	private static function base64url_encode( string $data ): string {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
	}

	private static function base64url_decode( string $data ): string {
		$padded = str_pad( strtr( $data, '-_', '+/' ), strlen( $data ) % 4 === 0 ? strlen( $data ) : strlen( $data ) + ( 4 - strlen( $data ) % 4 ), '=', STR_PAD_RIGHT );
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		$decoded = base64_decode( $padded, true );
		return is_string( $decoded ) ? $decoded : '';
	}
}
