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
}
