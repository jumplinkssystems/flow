<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Activator {

	const REVIEWER_ROLE = 'flow_reviewer';

	public static function activate(): void {
		self::create_tables();
		self::add_capabilities();
		self::create_reviewer_role();
		update_option( 'flow_ew_db_version', FLOW_EW_DB_VERSION );
		set_transient( 'flow_ew_activation_redirect', 1, 30 * MINUTE_IN_SECONDS );
	}

	public static function deactivate(): void {
	}

	public static function create_tables(): void {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();

		$reviews_table  = $wpdb->prefix . 'flow_reviews';
		$comments_table = $wpdb->prefix . 'flow_review_comments';
		$invites_table  = $wpdb->prefix . 'flow_review_invites';

		$sql = [];

		$sql[] = "CREATE TABLE {$reviews_table} (
			id             BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			post_id        BIGINT(20) UNSIGNED NOT NULL,
			reviewer_id    BIGINT(20) UNSIGNED NOT NULL,
			requester_id   BIGINT(20) UNSIGNED NOT NULL,
			status         VARCHAR(30) NOT NULL DEFAULT 'pending',
			iteration      SMALLINT(5) UNSIGNED NOT NULL DEFAULT 1,
			revision_id    BIGINT(20) UNSIGNED DEFAULT NULL,
			is_open        TINYINT(1) NOT NULL DEFAULT 0,
			is_public      TINYINT(1) NOT NULL DEFAULT 0,
			created_at     DATETIME NOT NULL,
			updated_at     DATETIME NOT NULL,
			PRIMARY KEY  (id),
			KEY post_id     (post_id),
			KEY reviewer_id (reviewer_id),
			KEY status      (status)
		) {$charset_collate};";

		$sql[] = "CREATE TABLE {$comments_table} (
			id              BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			review_id       BIGINT(20) UNSIGNED NOT NULL,
			post_id         BIGINT(20) UNSIGNED NOT NULL,
			block_client_id TEXT DEFAULT NULL,
			anchor_text     TEXT DEFAULT NULL,
			comment_text    TEXT NOT NULL,
			author_id       BIGINT(20) UNSIGNED NOT NULL DEFAULT 0,
			author_name     VARCHAR(190) DEFAULT NULL,
			author_email    VARCHAR(190) DEFAULT NULL,
			parent_id       BIGINT(20) UNSIGNED DEFAULT NULL,
			is_resolved     TINYINT(1) NOT NULL DEFAULT 0,
			created_at      DATETIME NOT NULL,
			updated_at      DATETIME NOT NULL,
			PRIMARY KEY  (id),
			KEY review_id   (review_id),
			KEY post_id     (post_id),
			KEY is_resolved (is_resolved)
		) {$charset_collate};";

		$sql[] = "CREATE TABLE {$invites_table} (
			id             BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
			review_id      BIGINT(20) UNSIGNED NOT NULL,
			email          VARCHAR(190) NOT NULL,
			display_name   VARCHAR(190) DEFAULT NULL,
			status         VARCHAR(30) NOT NULL DEFAULT 'pending',
			cookie_jti     VARCHAR(64) NOT NULL,
			token_version  INT(10) UNSIGNED NOT NULL DEFAULT 1,
			decided_at     DATETIME DEFAULT NULL,
			created_at     DATETIME NOT NULL,
			updated_at     DATETIME NOT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY review_email (review_id, email),
			KEY review_id  (review_id),
			KEY cookie_jti (cookie_jti)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		foreach ( $sql as $statement ) {
			dbDelta( $statement );
		}
	}

	public static function add_capabilities(): void {
		$author_and_above_caps = [
			'flow_assign_reviewer' => true,
		];
		$editor_and_above_caps = [
			'flow_review_posts'    => true,
			'flow_assign_reviewer' => true,
		];
		$admin_caps            = [
			'flow_assign_reviewer' => true,
			'flow_review_posts'    => true,
			'flow_manage_reviews'  => true,
		];

		foreach ( [ 'author', 'editor' ] as $role_name ) {
			$role = get_role( $role_name );
			if ( ! $role ) {
				continue;
			}
			$caps = 'author' === $role_name ? $author_and_above_caps : $editor_and_above_caps;
			foreach ( $caps as $cap => $grant ) {
				$role->add_cap( $cap, $grant );
			}
		}

		$admin = get_role( 'administrator' );
		if ( $admin ) {
			foreach ( $admin_caps as $cap => $grant ) {
				$admin->add_cap( $cap, $grant );
			}
		}
	}

	public static function remove_capabilities(): void {
		$caps  = [ 'flow_assign_reviewer', 'flow_review_posts', 'flow_manage_reviews' ];
		$roles = [ 'author', 'editor', 'administrator' ];
		foreach ( $roles as $role_name ) {
			$role = get_role( $role_name );
			if ( ! $role ) {
				continue;
			}
			foreach ( $caps as $cap ) {
				$role->remove_cap( $cap );
			}
		}
	}

	/**
	 * Adds (or refreshes) the dedicated "Reviewer" role. Idempotent: safe to call
	 * on every plugin boot. The role only carries the minimum caps needed to log
	 * in and act on review pages — `read` so WordPress lets the user authenticate,
	 * and `flow_review_posts` so the approve / request-changes controls are
	 * enabled on the review preview.
	 */
	public static function create_reviewer_role(): void {
		// Marks the role display name for translation tooling; WordPress
		// translates it at render time via translate_user_role().
		// phpcs:ignore WordPress.WP.I18n.TextDomainMismatch
		_x( 'Reviewer', 'User role', 'jumplinks-editorial-workflow' );

		$caps = [
			'read'                 => true,
			'flow_review_posts'    => true,
			'view_admin_dashboard' => true,
		];

		$role = get_role( self::REVIEWER_ROLE );
		if ( ! $role ) {
			add_role( self::REVIEWER_ROLE, 'Reviewer', $caps );
			return;
		}
		foreach ( $caps as $cap => $grant ) {
			$role->add_cap( $cap, $grant );
		}
	}

	public static function remove_reviewer_role(): void {
		if ( get_role( self::REVIEWER_ROLE ) ) {
			remove_role( self::REVIEWER_ROLE );
		}
	}
}
