<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Same shape as WP_Upgrader::create_lock(): the INSERT IGNORE is atomic, so
 * concurrent first requests after an upgrade cannot both run dbDelta and the
 * activity backfill.
 */
final class Migration_Lock {

	/** Seconds after which a lock left behind by a request that died mid-migration is taken over. */
	const STALE_AFTER = 600;

	public static function acquire( string $name ): bool {
		global $wpdb;
		$option = self::option_name( $name );
		$now    = time();

		$inserted = $wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'no')", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter -- core options table.
				$option,
				(string) $now
			)
		);
		if ( $inserted ) {
			return true;
		}

		$held_since = (int) $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,PluginCheck.Security.DirectDB.UnescapedDBParameter -- core options table.
				$option
			)
		);
		if ( $held_since > 0 && ( $now - $held_since ) < self::STALE_AFTER ) {
			return false;
		}

		$wpdb->update( $wpdb->options, [ 'option_value' => (string) $now ], [ 'option_name' => $option ] ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		return true;
	}

	public static function release( string $name ): void {
		global $wpdb;
		$wpdb->delete( $wpdb->options, [ 'option_name' => self::option_name( $name ) ] ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
	}

	private static function option_name( string $name ): string {
		return 'flow_ew_migration_lock_' . $name;
	}
}
