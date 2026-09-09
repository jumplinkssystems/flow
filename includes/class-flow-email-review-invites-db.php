<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * CRUD for `{prefix}flow_review_invites` — email-gated post reviewers.
 * Free enforces at most one invite per review at the assign layer;
 * Pro may store many rows and roll them into multi-reviewer status.
 */
class Email_Review_Invites_DB {

	const STATUS_PENDING           = 'pending';
	const STATUS_IN_REVIEW         = 'in_review';
	const STATUS_APPROVED          = 'approved';
	const STATUS_CHANGES_REQUESTED = 'changes_requested';

	public static function table(): string {
		global $wpdb;
		return $wpdb->prefix . 'flow_review_invites';
	}

	public static function normalize_email( string $email ): string {
		return strtolower( trim( $email ) );
	}

	/**
	 * Stable negative synthetic id for UI / vote matching (never collides with WP user ids).
	 */
	public static function synthetic_id( string $email ): int {
		$email = self::normalize_email( $email );
		if ( '' === $email ) {
			return 0;
		}
		$crc = sprintf( '%u', crc32( $email ) );
		$id  = -1 * ( (int) $crc % 2000000000 );
		return 0 === $id ? -1 : $id;
	}

	public static function generate_jti(): string {
		try {
			return bin2hex( random_bytes( 16 ) );
		} catch ( \Exception $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			return wp_generate_password( 32, false, false );
		}
	}

	public static function get( int $id ): ?object {
		global $wpdb;
		if ( $id <= 0 ) {
			return null;
		}
		$table = self::table();
		$row   = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE id = %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter
				$id
			)
		);
		return $row ?: null;
	}

	public static function get_by_jti( string $jti ): ?object {
		global $wpdb;
		$jti = trim( $jti );
		if ( '' === $jti ) {
			return null;
		}
		$table = self::table();
		$row   = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE cookie_jti = %s LIMIT 1", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter
				$jti
			)
		);
		return $row ?: null;
	}

	public static function get_for_email( int $review_id, string $email ): ?object {
		global $wpdb;
		$email = self::normalize_email( $email );
		if ( $review_id <= 0 || '' === $email ) {
			return null;
		}
		$table = self::table();
		$row   = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE review_id = %d AND email = %s LIMIT 1", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter
				$review_id,
				$email
			)
		);
		return $row ?: null;
	}

	/**
	 * @return object[]
	 */
	public static function get_for_review( int $review_id ): array {
		global $wpdb;
		if ( $review_id <= 0 ) {
			return [];
		}
		$table = $wpdb->prefix . 'flow_review_invites';
		$rows  = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE review_id = %d ORDER BY id ASC", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter
				$review_id
			)
		);
		return is_array( $rows ) ? $rows : [];
	}

	public static function count_for_review( int $review_id ): int {
		global $wpdb;
		if ( $review_id <= 0 ) {
			return 0;
		}
		$table = self::table();
		$count = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$table} WHERE review_id = %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter
				$review_id
			)
		);
		return (int) $count;
	}

	/**
	 * Insert or return existing invite for (review, email). Does not reset session state.
	 */
	public static function upsert( int $review_id, string $email, string $display_name = '' ): ?object {
		global $wpdb;
		$email = self::normalize_email( $email );
		if ( $review_id <= 0 || '' === $email || ! is_email( $email ) ) {
			return null;
		}
		$existing = self::get_for_email( $review_id, $email );
		if ( $existing ) {
			return $existing;
		}

		$now = current_time( 'mysql', true );
		$ok  = $wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			self::table(),
			[
				'review_id'     => $review_id,
				'email'         => $email,
				'display_name'  => $display_name,
				'status'        => self::STATUS_PENDING,
				'cookie_jti'    => self::generate_jti(),
				'token_version' => 1,
				'created_at'    => $now,
				'updated_at'    => $now,
			],
			[ '%d', '%s', '%s', '%s', '%s', '%d', '%s', '%s' ]
		);
		if ( ! $ok ) {
			return null;
		}
		return self::get( (int) $wpdb->insert_id );
	}

	/**
	 * @param array<string,mixed> $data
	 */
	public static function update( int $id, array $data ): bool {
		global $wpdb;
		if ( $id <= 0 || empty( $data ) ) {
			return false;
		}
		$data['updated_at'] = current_time( 'mysql', true );
		$formats            = [];
		foreach ( $data as $key => $value ) {
			unset( $value );
			if ( in_array( $key, [ 'review_id', 'token_version' ], true ) ) {
				$formats[] = '%d';
			} else {
				$formats[] = '%s';
			}
		}
		$result = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			self::table(),
			$data,
			[ 'id' => $id ],
			$formats,
			[ '%d' ]
		);
		return false !== $result;
	}

	public static function update_display_name( int $invite_id, string $name ): void {
		if ( $invite_id <= 0 ) {
			return;
		}
		$name = trim( $name );
		if ( '' !== $name ) {
			$name = function_exists( 'mb_substr' ) ? mb_substr( $name, 0, 190 ) : substr( $name, 0, 190 );
		}
		self::update( $invite_id, [ 'display_name' => $name ] );
	}

	public static function set_status( int $invite_id, string $status, ?string $decided_at = null ): void {
		$data = [ 'status' => $status ];
		if ( null !== $decided_at ) {
			$data['decided_at'] = $decided_at;
		} elseif ( in_array( $status, [ self::STATUS_APPROVED, self::STATUS_CHANGES_REQUESTED ], true ) ) {
			$data['decided_at'] = current_time( 'mysql', true );
		}
		self::update( $invite_id, $data );
	}

	public static function delete_for_review( int $review_id ): void {
		global $wpdb;
		if ( $review_id <= 0 ) {
			return;
		}
		$wpdb->delete( self::table(), [ 'review_id' => $review_id ], [ '%d' ] ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
	}

	/**
	 * Keep only the given emails on the review (delete others). Upserts missing ones.
	 *
	 * @param string[] $emails
	 * @return object[]
	 */
	public static function sync_emails( int $review_id, array $emails ): array {
		$normalized = [];
		foreach ( $emails as $email ) {
			$email = self::normalize_email( (string) $email );
			if ( '' !== $email && is_email( $email ) ) {
				$normalized[ $email ] = true;
			}
		}
		$wanted = array_keys( $normalized );

		$existing = self::get_for_review( $review_id );
		foreach ( $existing as $row ) {
			$row_email = self::normalize_email( (string) ( $row->email ?? '' ) );
			if ( ! isset( $normalized[ $row_email ] ) ) {
				global $wpdb;
				$wpdb->delete( self::table(), [ 'id' => (int) $row->id ], [ '%d' ] ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			}
		}

		foreach ( $wanted as $email ) {
			self::upsert( $review_id, $email );
		}

		return self::get_for_review( $review_id );
	}

	/**
	 * Replace all invites with a single email (Free single-reviewer rule).
	 */
	public static function replace_with_one( int $review_id, string $email ): ?object {
		$email = self::normalize_email( $email );
		if ( $review_id <= 0 || '' === $email || ! is_email( $email ) ) {
			return null;
		}
		$existing = self::get_for_email( $review_id, $email );
		self::delete_for_review( $review_id );
		if ( $existing ) {
			// Re-insert preserving jti/token_version so an in-flight link still works.
			global $wpdb;
			$now = current_time( 'mysql', true );
			$ok  = $wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
				self::table(),
				[
					'review_id'     => $review_id,
					'email'         => $email,
					'display_name'  => (string) ( $existing->display_name ?? '' ),
					'status'        => self::STATUS_PENDING,
					'cookie_jti'    => (string) $existing->cookie_jti,
					'token_version' => (int) $existing->token_version,
					'created_at'    => $now,
					'updated_at'    => $now,
				],
				[ '%d', '%s', '%s', '%s', '%s', '%d', '%s', '%s' ]
			);
			return $ok ? self::get( (int) $wpdb->insert_id ) : null;
		}
		return self::upsert( $review_id, $email );
	}

	public static function bump_pending_to_in_review( int $review_id ): void {
		global $wpdb;
		if ( $review_id <= 0 ) {
			return;
		}
		$table = self::table();
		$now   = current_time( 'mysql', true );
		$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"UPDATE {$table} SET status = %s, updated_at = %s WHERE review_id = %d AND status = %s", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter
				self::STATUS_IN_REVIEW,
				$now,
				$review_id,
				self::STATUS_PENDING
			)
		);
	}

	public static function reset_changes_requested_to_pending( int $review_id ): void {
		global $wpdb;
		if ( $review_id <= 0 ) {
			return;
		}
		$table = self::table();
		$now   = current_time( 'mysql', true );
		$wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"UPDATE {$table} SET status = %s, decided_at = NULL, updated_at = %s WHERE review_id = %d AND status = %s", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter
				self::STATUS_PENDING,
				$now,
				$review_id,
				self::STATUS_CHANGES_REQUESTED
			)
		);
	}

	/**
	 * Payload shape for prepare_review_response / editor UI.
	 *
	 * @return array{id:int,name:string,email:string,status:string,is_email:bool,avatar_url:string}
	 */
	public static function to_reviewer_payload( object $row ): array {
		$email = self::normalize_email( (string) ( $row->email ?? '' ) );
		$name  = trim( (string) ( $row->display_name ?? '' ) );
		if ( '' === $name ) {
			$name = $email;
		}
		return [
			'id'         => self::synthetic_id( $email ),
			'name'       => $name,
			'email'      => $email,
			'status'     => (string) ( $row->status ?? self::STATUS_PENDING ),
			'is_email'   => true,
			'avatar_url' => (string) ( get_avatar_url( $email, [ 'size' => 32 ] ) ?: '' ),
		];
	}
}
