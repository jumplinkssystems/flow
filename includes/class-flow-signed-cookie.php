<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Cookie I/O shared by the review-session cookies. Writes via setcookie(),
 * mirrors into `$_COOKIE` for the rest of the request, and returns the
 * canonical Set-Cookie header so REST handlers can re-attach it explicitly
 * (output buffering and page caches can strip the one setcookie() queued).
 */
final class Signed_Cookie {

	public static function write( string $name, string $value, int $expires_ts ): string {
		setcookie(
			$name,
			$value,
			[
				'expires'  => $expires_ts,
				'path'     => COOKIEPATH,
				'domain'   => COOKIE_DOMAIN ?: '',
				'secure'   => is_ssl(),
				'httponly' => true,
				'samesite' => 'Lax',
			]
		);
		$_COOKIE[ $name ] = $value;
		return self::header( $name, $value, $expires_ts );
	}

	public static function clear( string $name ): string {
		$expires_ts = time() - HOUR_IN_SECONDS;
		setcookie(
			$name,
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
		unset( $_COOKIE[ $name ] );
		return self::header( $name, '', $expires_ts );
	}

	/** Set-Cookie header value matching the attributes passed to setcookie(). */
	public static function header( string $name, string $value, int $expires_ts ): string {
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

	public static function base64url_encode( string $data ): string {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- URL-safe transport for a signed payload.
		return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
	}

	public static function base64url_decode( string $data ): string {
		$remainder = strlen( $data ) % 4;
		$padded    = 0 === $remainder ? $data : $data . str_repeat( '=', 4 - $remainder );
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- pairs with base64url_encode().
		$decoded = base64_decode( strtr( $padded, '-_', '+/' ), true );
		return is_string( $decoded ) ? $decoded : '';
	}
}
