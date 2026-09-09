<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Magic-link builder + entry handler for email-invite post reviews.
 * Entry query args ride on the existing preview URL; on success we set the
 * session cookie and redirect to a clean preview URL (standard flow_token args).
 */
class Email_Review_Link {

	const QUERY_JTI           = 'flow_invite_jti';
	const QUERY_TOKEN         = 'flow_invite_token';
	const QUERY_TS            = 'flow_invite_ts';
	const QUERY_TOKEN_VERSION = 'flow_invite_v';

	public function boot(): void {
		add_action( 'init', [ $this, 'maybe_handle_entry' ], 1 );
	}

	/**
	 * Build a preview URL that also carries the invite entry token.
	 */
	public static function build_for_invite( int $review_id, string $email ): string {
		$row = Email_Review_Invites_DB::get_for_email( $review_id, $email );
		if ( ! $row ) {
			return '';
		}
		$review = DB::get_review( $review_id );
		if ( ! $review ) {
			return '';
		}

		$post_id = (int) $review->post_id;
		$stored  = (int) ( $review->revision_id ?? 0 );
		$rev     = Review::get_effective_preview_revision_id( $post_id, $stored );
		$base    = Review::get_preview_url( $review_id, $rev, $post_id );

		$ts            = time();
		$jti           = (string) $row->cookie_jti;
		$token_version = (int) $row->token_version;
		$token         = Email_Review_Cookie::compute_signature(
			$review_id,
			$jti,
			$token_version,
			$ts
		);

		$link = add_query_arg(
			[
				self::QUERY_JTI           => $jti,
				self::QUERY_TOKEN         => $token,
				self::QUERY_TS            => $ts,
				self::QUERY_TOKEN_VERSION => $token_version,
			],
			$base
		);

		// This URL is inserted into a plain-text email. Ensure any entities
		// introduced by permalink filters do not become literal query-key
		// prefixes (for example, `amp;flow_token`) in the recipient's browser.
		return html_entity_decode( $link, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
	}

	public function maybe_handle_entry(): void {
		$review_id_raw = self::read_query_arg( 'flow_review_id' );
		$jti           = self::read_query_arg( self::QUERY_JTI );
		$token         = self::read_query_arg( self::QUERY_TOKEN );

		if ( null === $review_id_raw || null === $jti || null === $token ) {
			return;
		}

		$ts_raw        = self::read_query_arg( self::QUERY_TS );
		$claimed_v_raw = self::read_query_arg( self::QUERY_TOKEN_VERSION );
		$review_id     = absint( $review_id_raw );
		$ts            = null !== $ts_raw ? absint( $ts_raw ) : 0;
		$claimed_v     = null !== $claimed_v_raw ? absint( $claimed_v_raw ) : 0;

		if ( $review_id <= 0 || '' === $jti || '' === $token || $ts <= 0 ) {
			return;
		}

		$row = Email_Review_Invites_DB::get_by_jti( $jti );
		if ( ! $row || (int) $row->review_id !== $review_id ) {
			wp_die( esc_html__( 'This review link is invalid or has been revoked.', 'jumplinks-editorial-workflow' ), 403 );
		}

		if ( $claimed_v > 0 && $claimed_v !== (int) $row->token_version ) {
			wp_die( esc_html__( 'This review link has been revoked. Ask the requester to send a new one.', 'jumplinks-editorial-workflow' ), 403 );
		}

		$ok = Email_Review_Cookie::verify_entry_token(
			$token,
			$review_id,
			$jti,
			(int) $row->token_version,
			$ts
		);
		if ( ! $ok ) {
			wp_die( esc_html__( 'This review link is invalid or has expired.', 'jumplinks-editorial-workflow' ), 403 );
		}

		if ( Email_Review_Invites_DB::STATUS_PENDING === (string) $row->status ) {
			Email_Review_Invites_DB::set_status( (int) $row->id, Email_Review_Invites_DB::STATUS_IN_REVIEW, null );
		}

		Email_Review_Cookie::set( $review_id, $jti, (int) $row->token_version );

		$review = DB::get_review( $review_id );
		if ( ! $review ) {
			wp_die( esc_html__( 'Review not found.', 'jumplinks-editorial-workflow' ), 404 );
		}

		$post_id = (int) $review->post_id;
		$stored  = (int) ( $review->revision_id ?? 0 );
		$rev     = Review::get_effective_preview_revision_id( $post_id, $stored );
		$clean   = Review::get_preview_url( $review_id, $rev, $post_id );

		wp_safe_redirect( $clean );
		exit;
	}

	/**
	 * Read a magic-link query argument.
	 *
	 * Some HTML email formatters double-escape ampersands in plain-text URLs,
	 * causing PHP to receive keys such as `amp;flow_invite_token`. Accept that
	 * form so links already delivered by those formatters remain usable.
	 */
	private static function read_query_arg( string $key ): ?string {
		foreach ( [ $key, 'amp;' . $key ] as $candidate ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- signed magic-link arguments are verified below.
			if ( isset( $_GET[ $candidate ] ) && ! is_array( $_GET[ $candidate ] ) ) {
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- signed magic-link arguments are verified below.
				return sanitize_text_field( wp_unslash( (string) $_GET[ $candidate ] ) );
			}
		}

		return null;
	}
}
