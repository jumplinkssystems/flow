<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Minimal anti-spam guard for review comments posted with no WordPress
 * account: an IP rate limit and WordPress's own disallowed-words list.
 * Email-invite reviewers (Free) and anonymous public reviewers (Pro) both
 * post this way, so this runs for every build — a leaked invite link is a
 * Free-only concern that had no floor at all before this.
 *
 * `Pro\Comment_Spam_Guard` chains onto the same filter at a later priority
 * and adds Akismet on top, once a payload has already passed this guard.
 * Logged-in commenters bypass both guards entirely.
 */
class Comment_Spam_Guard {

	const RATE_LIMIT_WINDOW = 60;
	const RATE_LIMIT_MAX    = 10;

	public function boot(): void {
		add_filter( 'flow_ew_pre_create_comment_error', [ $this, 'check' ], 10, 2 );
	}

	/**
	 * @param string              $error   Default empty.
	 * @param array<string,mixed> $context Comment payload + request info.
	 */
	public function check( string $error, array $context ): string {
		if ( '' !== $error ) {
			return $error;
		}
		// Logged-in users go straight through. Anonymous-only gating.
		if ( (int) ( $context['user_id'] ?? 0 ) > 0 ) {
			return '';
		}

		$ip = $this->get_request_ip();

		if ( '' !== $ip && $this->is_rate_limited( $ip ) ) {
			return __(
				'Too many comments from this address — please wait a minute and try again.',
				'jumplinks-editorial-workflow'
			);
		}

		if ( $this->is_disallowed_content( $context ) ) {
			return __(
				'Your comment was flagged by the site\'s content rules.',
				'jumplinks-editorial-workflow'
			);
		}

		// Passed every Free check — count it against the rate limit. Pro's
		// Akismet check, if it runs next on the same payload, does not
		// bump this again; it only sees payloads that already passed here.
		if ( '' !== $ip ) {
			$this->bump_rate_limit( $ip );
		}
		return '';
	}

	private function get_request_ip(): string {
		if ( empty( $_SERVER['REMOTE_ADDR'] ) ) {
			return '';
		}
		return (string) sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
	}

	private function get_request_user_agent(): string {
		if ( empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
			return '';
		}
		return (string) sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) );
	}

	private function rate_limit_key( string $ip ): string {
		return 'flow_ew_anon_rate_' . md5( $ip );
	}

	private function is_rate_limited( string $ip ): bool {
		$hits   = (array) get_transient( $this->rate_limit_key( $ip ) );
		$cutoff = time() - self::RATE_LIMIT_WINDOW;
		$hits   = array_filter(
			$hits,
			static function ( $t ) use ( $cutoff ) {
				return (int) $t > $cutoff;
			}
		);
		return count( $hits ) >= self::RATE_LIMIT_MAX;
	}

	private function bump_rate_limit( string $ip ): void {
		$key    = $this->rate_limit_key( $ip );
		$hits   = (array) get_transient( $key );
		$cutoff = time() - self::RATE_LIMIT_WINDOW;
		$hits   = array_filter(
			$hits,
			static function ( $t ) use ( $cutoff ) {
				return (int) $t > $cutoff;
			}
		);
		$hits[] = time();
		// Store for double the window so race-window misses still get caught.
		set_transient( $key, array_values( $hits ), self::RATE_LIMIT_WINDOW * 2 );
	}

	/**
	 * Use core's disallowed-keys check (Settings → Discussion → "Disallowed
	 * Comment Keys"). Free, always-on, catches obvious garbage even on sites
	 * with no Akismet.
	 *
	 * @param array<string,mixed> $context
	 */
	private function is_disallowed_content( array $context ): bool {
		if ( ! function_exists( 'wp_check_comment_disallowed_list' ) ) {
			return false;
		}
		$content = wp_strip_all_tags( (string) ( $context['html'] ?? '' ) );
		$author  = (string) ( $context['author_name'] ?? '' );
		$email   = (string) ( $context['author_email'] ?? '' );
		return wp_check_comment_disallowed_list(
			$author,
			$email,
			'',
			$content,
			$this->get_request_ip(),
			$this->get_request_user_agent()
		);
	}
}
