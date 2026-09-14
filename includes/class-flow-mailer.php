<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Every notification mail goes through here so a failing mail setup is not
 * silent: failures are kept in a small ring buffer and shown to managers on
 * Flow's own admin screens.
 */
final class Mailer {

	const OPTION_LOG  = 'flow_ew_mail_failures';
	const LIMIT       = 20;
	const NOTICE_DAYS = 7;

	private static bool $capturing = false;

	private static ?\WP_Error $last_error = null;

	public static function boot(): void {
		add_action( 'wp_mail_failed', [ __CLASS__, 'on_mail_failed' ] );
		add_action( 'admin_notices', [ __CLASS__, 'render_notice' ] );
	}

	/**
	 * Like send(), but run once the response is out (see Deferred). User-facing
	 * requests use this; cron paths keep send().
	 *
	 * @param string|string[] $headers
	 */
	public static function queue( string $to, string $subject, string $message, $headers = [] ): void {
		Deferred::run(
			static function () use ( $to, $subject, $message, $headers ): void {
				self::send( $to, $subject, $message, $headers );
			}
		);
	}

	/**
	 * @param string|string[] $headers
	 */
	public static function send( string $to, string $subject, string $message, $headers = [] ): bool {
		self::take_last_error();
		self::$capturing = true;
		$ok              = (bool) wp_mail( $to, $subject, $message, $headers );
		self::$capturing = false;

		if ( ! $ok ) {
			$error = self::take_last_error();
			self::record(
				$to,
				$subject,
				$error ? $error->get_error_message() : __( 'The mail function returned false.', 'jumplinks-editorial-workflow' )
			);
		}
		return $ok;
	}

	/**
	 * @param mixed $error
	 */
	public static function on_mail_failed( $error ): void {
		if ( self::$capturing && $error instanceof \WP_Error ) {
			self::$last_error = $error;
		}
	}

	/** Return and clear the error captured during the last send, if any. */
	private static function take_last_error(): ?\WP_Error {
		$error            = self::$last_error;
		self::$last_error = null;
		return $error;
	}

	/**
	 * @return array<int,array{ts:int,to:string,subject:string,message:string}>
	 */
	public static function failures(): array {
		$log = get_option( self::OPTION_LOG, [] );
		return is_array( $log ) ? $log : [];
	}

	public static function clear(): void {
		delete_option( self::OPTION_LOG );
	}

	private static function record( string $to, string $subject, string $message ): void {
		$log = self::failures();
		array_unshift(
			$log,
			[
				'ts'      => time(),
				'to'      => self::mask_recipient( $to ),
				'subject' => self::truncate( $subject, 120 ),
				'message' => self::truncate( $message, 300 ),
			]
		);
		update_option( self::OPTION_LOG, array_slice( $log, 0, self::LIMIT ), false );
	}

	/** `jane@example.com` → `j***@example.com`; the domain is what helps debugging. */
	public static function mask_recipient( string $email ): string {
		$at = strpos( $email, '@' );
		if ( false === $at || 0 === $at ) {
			return '***';
		}
		return substr( $email, 0, 1 ) . '***' . substr( $email, $at );
	}

	private static function truncate( string $text, int $max ): string {
		$text = trim( $text );
		if ( function_exists( 'mb_substr' ) ) {
			return mb_substr( $text, 0, $max );
		}
		return substr( $text, 0, $max );
	}

	/**
	 * Managers see recent failures on Flow's admin screens only, so a broken
	 * SMTP setup is noticed where the notifications are configured rather
	 * than being buried in a log nobody reads.
	 */
	public static function render_notice(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || false === strpos( (string) $screen->id, 'flow-' ) ) {
			return;
		}

		$cutoff = time() - self::NOTICE_DAYS * DAY_IN_SECONDS;
		$recent = array_values(
			array_filter(
				self::failures(),
				static function ( array $entry ) use ( $cutoff ): bool {
					return (int) $entry['ts'] >= $cutoff;
				}
			)
		);
		if ( empty( $recent ) ) {
			return;
		}

		$last = $recent[0];
		printf(
			'<div class="notice notice-warning"><p><strong>%1$s</strong> %2$s</p><p>%3$s</p></div>',
			esc_html(
				sprintf(
					/* translators: %d: number of failed notification emails in the last 7 days */
					_n(
						'%d Flow notification email could not be sent in the last 7 days.',
						'%d Flow notification emails could not be sent in the last 7 days.',
						count( $recent ),
						'jumplinks-editorial-workflow'
					),
					count( $recent )
				)
			),
			esc_html__( 'Reviewers and authors may be missing review requests and decisions. Check the site’s mail (SMTP) configuration.', 'jumplinks-editorial-workflow' ),
			esc_html(
				sprintf(
					/* translators: 1: masked recipient, 2: date, 3: error message */
					__( 'Most recent: to %1$s on %2$s — %3$s', 'jumplinks-editorial-workflow' ),
					(string) $last['to'],
					wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), (int) $last['ts'] ),
					(string) $last['message']
				)
			)
		);
	}
}
