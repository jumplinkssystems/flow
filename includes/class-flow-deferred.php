<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Runs notification fan-out (mail, Slack) after the response is sent. On
 * PHP-FPM the response is flushed to the client first, so a reviewer's click
 * never waits on SMTP or Slack; elsewhere the work moves to the end of the
 * request. Cron and CLI contexts run jobs inline.
 */
final class Deferred {

	/** @var callable[] */
	private static array $jobs = [];

	private static bool $hooked = false;

	private static bool $flushing = false;

	public static function run( callable $job ): void {
		if ( ! self::should_defer() ) {
			$job();
			return;
		}
		self::$jobs[] = $job;
		if ( ! self::$hooked ) {
			self::$hooked = true;
			// After core's output-buffer flush (1) and the webhook queue write (5).
			add_action( 'shutdown', [ __CLASS__, 'flush' ], 20 );
		}
	}

	public static function flush(): void {
		if ( self::$flushing || [] === self::$jobs ) {
			return;
		}
		self::$flushing = true;
		if ( function_exists( 'fastcgi_finish_request' ) && apply_filters( 'flow_ew_finish_request_before_deferred', true ) ) {
			fastcgi_finish_request();
		}
		while ( [] !== self::$jobs ) {
			$job = array_shift( self::$jobs );
			try {
				$job();
			} catch ( \Throwable $e ) {
				// One failed notification must not stop the rest; Mailer and Slack keep their own logs.
				unset( $e );
			}
		}
		self::$flushing = false;
	}

	public static function pending(): int {
		return count( self::$jobs );
	}

	private static function should_defer(): bool {
		if ( self::$flushing || ( defined( 'WP_CLI' ) && WP_CLI ) || ( function_exists( 'wp_doing_cron' ) && wp_doing_cron() ) ) {
			return false;
		}
		if ( function_exists( 'did_action' ) && did_action( 'shutdown' ) ) {
			return false;
		}
		return (bool) apply_filters( 'flow_ew_defer_notifications', true );
	}
}
