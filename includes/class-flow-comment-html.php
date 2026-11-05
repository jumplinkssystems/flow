<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Comment bodies are `wp_kses_post` HTML minus anything that loads a remote
 * resource: an `<img src>` would leak every other participant's IP address
 * to whoever wrote the comment, and the comment editors never emit media.
 */
final class Comment_Html {

	const REMOTE_TAGS = [ 'img', 'picture', 'source', 'video', 'audio', 'track', 'object', 'embed', 'iframe' ];

	public static function sanitize( string $html ): string {
		return wp_kses( $html, self::allowed_tags() );
	}

	/** @return array<string,array<string,bool>> */
	public static function allowed_tags(): array {
		$allowed = (array) wp_kses_allowed_html( 'post' );
		foreach ( self::REMOTE_TAGS as $tag ) {
			unset( $allowed[ $tag ] );
		}
		return $allowed;
	}

	/**
	 * Opaque stand-in for an anonymous commenter's email in @mention markup, so
	 * the address never reaches other viewers. Stable per site and email.
	 */
	public static function mention_key( string $email ): string {
		return 'anon-' . substr( wp_hash( 'flow_mention_anon|' . strtolower( trim( $email ) ) ), 0, 20 );
	}

	public static function is_mention_key( string $value ): bool {
		return 1 === preg_match( '/^anon-[a-f0-9]{20}$/', $value );
	}

	/** Mentions stored before keys existed carry the raw email; swap it on the way out. */
	public static function mask_mention_emails( string $html ): string {
		if ( false === strpos( $html, 'data-mention-email' ) ) {
			return $html;
		}
		return (string) preg_replace_callback(
			'#data-mention-email=(["\'])([^"\']+)\1#i',
			static function ( array $m ): string {
				$value = html_entity_decode( $m[2], ENT_QUOTES );
				return self::is_mention_key( $value ) ? $m[0] : 'data-mention-email=' . $m[1] . self::mention_key( $value ) . $m[1];
			},
			$html
		);
	}
}
