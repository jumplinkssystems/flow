<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Shared CRUD for the plugin's own tables. Every table has an `id` primary key
 * and (unless TOUCHES_UPDATED_AT is false) an `updated_at` column stamped on
 * update. Subclasses add their bespoke queries on top.
 */
abstract class Table_Gateway {

	/** Columns bound with %d in update(); everything else is %s. */
	const INT_COLUMNS = [];

	const TOUCHES_UPDATED_AT = true;

	/** Table name without the `$wpdb->prefix`. */
	abstract protected static function table_suffix(): string;

	public static function table(): string {
		global $wpdb;
		return $wpdb->prefix . static::table_suffix();
	}

	public static function get( int $id ): ?object {
		global $wpdb;
		if ( $id <= 0 ) {
			return null;
		}
		$table = static::table();
		$row   = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE id = %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter -- $table is `$wpdb->prefix . literal`, safe.
				$id
			)
		);
		return $row ?: null;
	}

	/**
	 * @param array<string,mixed> $fields
	 */
	public static function update( int $id, array $fields ): bool {
		global $wpdb;
		if ( $id <= 0 || empty( $fields ) ) {
			return false;
		}
		$fields = static::prepare_update( $fields );
		if ( static::TOUCHES_UPDATED_AT ) {
			$fields['updated_at'] = current_time( 'mysql', true );
		}
		$formats = [];
		foreach ( array_keys( $fields ) as $key ) {
			$formats[] = in_array( $key, static::INT_COLUMNS, true ) ? '%d' : '%s';
		}
		$result = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			static::table(),
			$fields,
			[ 'id' => $id ],
			$formats,
			[ '%d' ]
		);
		static::after_write();
		return false !== $result;
	}

	public static function delete( int $id ): bool {
		global $wpdb;
		if ( $id <= 0 ) {
			return false;
		}
		$result = $wpdb->delete( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			static::table(),
			[ 'id' => $id ],
			[ '%d' ]
		);
		static::after_write();
		return false !== $result;
	}

	/** Delete every row whose integer `$column` equals `$value`. */
	protected static function delete_by( string $column, int $value ): void {
		global $wpdb;
		if ( $value <= 0 ) {
			return;
		}
		$wpdb->delete( static::table(), [ $column => $value ], [ '%d' ] ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		static::after_write();
	}

	/**
	 * Hook for subclasses that normalise fields before an update.
	 *
	 * @param array<string,mixed> $fields
	 * @return array<string,mixed>
	 */
	protected static function prepare_update( array $fields ): array {
		return $fields;
	}

	/** Hook for subclasses that keep a request-scoped cache. */
	protected static function after_write(): void {}
}
