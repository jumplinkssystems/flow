<?php
/**
 * Freemius SDK bootstrap. Loaded by both Free and Pro builds — same product,
 * same slug; `is_premium` is the only runtime difference. Stays in the global
 * namespace so `flow_fs()` is callable from where Freemius's AJAX handlers and
 * third-party global-scope code expect it.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Pro build identity. `FLOW_EW_PRO_DEV_OVERRIDE` (local/development env only):
 * `true` forces Pro, `false` forces Free. Undefined: require BOTH a Pro-stamped
 * `FLOW_EW_VERSION` (4-part, e.g. `1.4.0.1` — set by `scripts/make-pro-zip.py`)
 * AND the on-disk `includes/pro/` directory. The version is the authoritative
 * signal; the on-disk check guards against a Pro version header without the
 * matching Pro classes (e.g. a broken extraction). Stale `includes/pro/`
 * leftovers after a Pro→Free overwrite no longer flip detection to Pro.
 */
function flow_ew_get_pro_dev_override(): ?bool {
	if ( ! defined( 'FLOW_EW_PRO_DEV_OVERRIDE' ) ) {
		return null;
	}

	$raw = constant( 'FLOW_EW_PRO_DEV_OVERRIDE' );
	if ( is_bool( $raw ) ) {
		return $raw;
	}

	$filtered = filter_var( $raw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );

	return is_bool( $filtered ) ? $filtered : null;
}

function flow_ew_is_pro_build(): bool {
	$env_is_dev = in_array( wp_get_environment_type(), array( 'local', 'development' ), true );

	if ( $env_is_dev ) {
		$override = flow_ew_get_pro_dev_override();
		if ( null !== $override ) {
			return $override;
		}
	}

	$version_is_pro = defined( 'FLOW_EW_VERSION' )
		&& (bool) preg_match( '/^\d+\.\d+\.\d+\.\d+/', (string) FLOW_EW_VERSION );

	return $version_is_pro && is_dir( __DIR__ . '/pro' );
}

$flow_ew_runtime_autoload = __DIR__ . '/vendor/autoload.php';
if ( file_exists( $flow_ew_runtime_autoload ) ) {
	require_once $flow_ew_runtime_autoload;
}
unset( $flow_ew_runtime_autoload );

if ( flow_ew_is_pro_build() ) {
	if ( ! defined( 'FLOW_EW_PRO_VERSION' ) ) {
		define( 'FLOW_EW_PRO_VERSION', '1.4.0' );
	}
	if ( ! defined( 'FLOW_EW_PRO_DB_VERSION' ) ) {
		define( 'FLOW_EW_PRO_DB_VERSION', '7' );
	}
	if ( ! defined( 'FLOW_EW_PRO_PLUGIN_FILE' ) ) {
		define( 'FLOW_EW_PRO_PLUGIN_FILE', dirname( __DIR__ ) . '/jumplinks-editorial-workflow.php' );
	}
	if ( ! defined( 'FLOW_EW_PRO_PLUGIN_DIR' ) ) {
		define( 'FLOW_EW_PRO_PLUGIN_DIR', trailingslashit( dirname( __DIR__ ) ) );
	}
	if ( ! defined( 'FLOW_EW_PRO_PLUGIN_URL' ) ) {
		define( 'FLOW_EW_PRO_PLUGIN_URL', plugin_dir_url( FLOW_EW_PRO_PLUGIN_FILE ) );
	}
}

if ( ! function_exists( 'flow_fs' ) ) {
	function flow_fs() {
		global $flow_fs;

		if ( ! isset( $flow_fs ) ) {
			// Same slug for both builds — Pro overwrites Free in place
			// via WP's standard upgrader; no separate folder.
			$flow_fs = fs_dynamic_init(
				array(
					'id'                  => '29591',
					'slug'                => 'jumplinks-editorial-workflow',
					'premium_slug'        => 'jumplinks-editorial-workflow',
					'type'                => 'plugin',
					'public_key'          => 'pk_69180dcea4b3fb0f753ad9b267766',
					'is_premium'          => flow_ew_is_pro_build(),
					'premium_suffix'      => 'PRO',
					'has_premium_version' => true,
					'has_addons'          => false,
					'has_paid_plans'      => true,
					'is_org_compliant'    => true,
					'anonymous_mode'      => true,
					'menu'                => array(
						'slug'       => 'flow-ew-dashboard',
						'first-path' => 'admin.php?page=flow-ew-dashboard',
					),
				)
			);
		}

		return $flow_fs;
	}

	flow_fs();
	do_action( 'flow_fs_loaded' );

	// Nuke our custom sticky the instant Pro code activates (the SDK
	// already clears its own `plan_upgraded` etc. in this handler).
	flow_fs()->add_action(
		'after_premium_version_activation',
		static function (): void {
			$fs = flow_fs();
			try {
				$reflection = new \ReflectionClass( $fs );
				if ( ! $reflection->hasProperty( '_admin_notices' ) ) {
					return;
				}
				$prop = $reflection->getProperty( '_admin_notices' );
				$prop->setAccessible( true );
				$notices = $prop->getValue( $fs );
				if ( is_object( $notices ) && method_exists( $notices, 'remove_sticky' ) ) {
					$notices->remove_sticky( 'flow_ew_install_pro' );
				}
			} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- admin_init's removal is the fallback.
				unset( $e );
			}
		}
	);

	/**
	 * Replace Freemius's post-activation sticky with one whose button actually
	 * triggers an in-place upgrade. With `premium_slug == slug`, the SDK's
	 * `is_premium_version_installed()` returns true (it file_exists()s the Free
	 * folder), so its "Activate Pro features" button just re-activates the
	 * already-active Free plugin — a dead-end. Our replacement points at
	 * `update.php?action=upgrade-plugin`, which runs `Plugin_Upgrader::upgrade()`
	 * and swaps Free for Pro in place. Freemius's
	 * `pre_set_site_transient_update_plugins_filter` injects the Pro release under
	 * our basename; `wp_update_plugins()` runs inside `update.php` itself, so the
	 * transient is fresh by the time the upgrade kicks off.
	 */
	add_action(
		'admin_init',
		static function (): void {
			if ( ! function_exists( 'flow_fs' ) ) {
				return;
			}
			$fs = flow_fs();
			if ( ! is_object( $fs ) ) {
				return;
			}

			$is_pro = function_exists( 'flow_ew_is_pro_build' ) && \flow_ew_is_pro_build();

			// Reflection: FS_Admin_Notices is a private property with no
			// public accessor on the Freemius object.
			try {
				$reflection = new \ReflectionClass( $fs );
				if ( ! $reflection->hasProperty( '_admin_notices' ) ) {
					return;
				}
				$prop = $reflection->getProperty( '_admin_notices' );
				$prop->setAccessible( true );
				$notices = $prop->getValue( $fs );
				if ( ! is_object( $notices ) || ! method_exists( $notices, 'remove_sticky' ) ) {
					return;
				}
			} catch ( \Throwable $e ) {
				return;
			}

			if ( $is_pro ) {
				$notices->remove_sticky( 'flow_ew_install_pro' );
				return;
			}

			if ( ! $fs->is_paying() || ! current_user_can( 'update_plugins' ) ) {
				return;
			}
			if ( wp_doing_ajax() || wp_doing_cron() ) {
				return;
			}
			if ( ! defined( 'FLOW_EW_PLUGIN_FILE' ) ) {
				return;
			}

			$sdk_sticky_ids = array( 'plan_upgraded', 'license_activated', 'trial_started' );
			$saw_sdk_sticky = false;
			foreach ( $sdk_sticky_ids as $sdk_id ) {
				$existing = $notices->get_sticky( $sdk_id, null );
				if ( ! empty( $existing ) ) {
					$saw_sdk_sticky = true;
					$notices->remove_sticky( $sdk_id );
				}
			}

			$ours = $notices->get_sticky( 'flow_ew_install_pro', null );
			if ( ! empty( $ours ) && ! $saw_sdk_sticky ) {
				return;
			}

			$basename    = plugin_basename( FLOW_EW_PLUGIN_FILE );
			$upgrade_url = wp_nonce_url(
				add_query_arg(
					array(
						'action' => 'upgrade-plugin',
						'plugin' => $basename,
					),
					admin_url( 'update.php' )
				),
				'upgrade-plugin_' . $basename
			);

			$message = sprintf(
				/* translators: %1$s is the call-to-action paragraph, %2$s is the upgrade button HTML. */
				'%1$s %2$s',
				esc_html__( 'Your Pro license is active. Install the paid version of Flow in one click to unlock the Pro features.', 'jumplinks-editorial-workflow' ),
				sprintf(
					'<a href="%1$s" class="button button-primary" style="margin-left:10px;">%2$s</a>',
					esc_url( $upgrade_url ),
					esc_html__( 'Install Pro features', 'jumplinks-editorial-workflow' )
				)
			);

			$notices->add_sticky( $message, 'flow_ew_install_pro', 'Yee-haw!', 'success' );
		}
	);

	/**
	 * Uninstall handler. Replaces the legacy `uninstall.php` file — Freemius
	 * rejects plugin zips that ship one. Runs in WP's stripped uninstall context
	 * (plugin classes NOT autoloaded), so everything uses WP core APIs / `$wpdb`
	 * directly. Idempotent.
	 */
	if ( ! function_exists( 'flow_ew_after_uninstall' ) ) {
		function flow_ew_after_uninstall(): void {
			global $wpdb;

			$flow_ew_free_tables = array(
				$wpdb->prefix . 'flow_review_comments',
				$wpdb->prefix . 'flow_reviews',
			);
			foreach ( $flow_ew_free_tables as $flow_ew_table ) {
				$flow_ew_table = esc_sql( $flow_ew_table );
				// phpcs:disable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$wpdb->query( "DROP TABLE IF EXISTS `{$flow_ew_table}`" );
				// phpcs:enable
			}

			$flow_ew_free_options = array(
				'flow_ew_db_version',
				'flow_ew_debug_mode',
				'flow_ew_review_mandatory',
				'flow_ew_reviewer_roles',
				'flow_ew_supported_post_types',
				'flow_ew_setup_completed',
			);
			foreach ( $flow_ew_free_options as $flow_ew_option ) {
				delete_option( $flow_ew_option );
			}

			$flow_ew_caps  = array( 'flow_assign_reviewer', 'flow_review_posts', 'flow_manage_reviews' );
			$flow_ew_roles = array( 'author', 'editor', 'administrator' );
			foreach ( $flow_ew_roles as $flow_ew_role_name ) {
				$flow_ew_role_obj = get_role( $flow_ew_role_name );
				if ( ! $flow_ew_role_obj ) {
					continue;
				}
				foreach ( $flow_ew_caps as $flow_ew_cap ) {
					$flow_ew_role_obj->remove_cap( $flow_ew_cap );
				}
			}
			if ( get_role( 'flow_reviewer' ) ) {
				remove_role( 'flow_reviewer' );
			}

			// Pro-side teardown only runs in the Pro zip (which ships
			// `includes/pro/`). Free-only installs never wrote these.
			if ( ! is_dir( __DIR__ . '/pro' ) ) {
				return;
			}

			$flow_ew_pro_tables = array(
				$wpdb->prefix . 'flow_pro_activity',
				$wpdb->prefix . 'flow_pro_site_reviews',
				$wpdb->prefix . 'flow_pro_site_review_reviewers',
				$wpdb->prefix . 'flow_pro_site_review_comments',
				$wpdb->prefix . 'flow_review_reviewers',
			);
			foreach ( $flow_ew_pro_tables as $flow_ew_pro_table ) {
				$flow_ew_pro_table = esc_sql( $flow_ew_pro_table );
				// phpcs:disable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				$wpdb->query( "DROP TABLE IF EXISTS `{$flow_ew_pro_table}`" );
				// phpcs:enable
			}

			$flow_ew_pro_options = array(
				'flow_ew_pro_db_version',
				'flow_ew_pro_digest_enabled',
				'flow_ew_pro_digest_hour',
				'flow_ew_slack_bot_token',
				'flow_ew_slack_default_dm_optin',
				'flow_ew_slack_disabled',
				'flow_ew_slack_error_log',
			);
			foreach ( $flow_ew_pro_options as $flow_ew_pro_option ) {
				delete_option( $flow_ew_pro_option );
			}

			$flow_ew_pro_cron_hooks = array( 'flow_ew_pro_daily_digest' );
			foreach ( $flow_ew_pro_cron_hooks as $flow_ew_pro_cron ) {
				$timestamp = wp_next_scheduled( $flow_ew_pro_cron );
				while ( $timestamp ) {
					wp_unschedule_event( $timestamp, $flow_ew_pro_cron );
					$timestamp = wp_next_scheduled( $flow_ew_pro_cron );
				}
				wp_clear_scheduled_hook( $flow_ew_pro_cron );
			}

			$flow_ew_pro_user_meta = array( 'flow_ew_slack_member_id', 'flow_ew_slack_dm_optin' );
			foreach ( $flow_ew_pro_user_meta as $flow_ew_pro_meta_key ) {
				delete_metadata( 'user', 0, $flow_ew_pro_meta_key, '', true );
			}
		}
	}

	flow_fs()->add_action( 'after_uninstall', 'flow_ew_after_uninstall' );

	if ( ! flow_ew_is_pro_build() && function_exists( 'fs_override_i18n' ) ) {
		fs_override_i18n( array( 'pricing' => 'Upgrade' ), 'jumplinks-editorial-workflow' );
	}
}

if ( ! function_exists( 'flow_ew_pro_should_boot' ) ) {
	function flow_ew_pro_should_boot(): bool {
		if ( ! flow_ew_is_pro_build() ) {
			return false;
		}

		$env_is_dev = in_array( wp_get_environment_type(), array( 'local', 'development' ), true );
		$override   = flow_ew_get_pro_dev_override();
		if ( $env_is_dev && true === $override ) {
			return true;
		}

		return function_exists( 'flow_fs' )
			&& is_object( flow_fs() )
			&& flow_fs()->can_use_premium_code();
	}
}

add_action(
	'init',
	static function (): void {
		if ( ! flow_ew_is_pro_build() ) {
			return;
		}
		// Pro's `.l10n.php` is a true superset (Free + Pro strings) — one
		// load covers PHP and, via the I18n bridge, JS too.
		load_plugin_textdomain( 'jumplinks-editorial-workflow', false, 'jumplinks-editorial-workflow/languages-pro' ); // phpcs:ignore PluginCheck.CodeAnalysis.DiscouragedFunctions.load_plugin_textdomainFound -- Pro translations ship in their own directory, never to wp.org.
	},
	1
);

// Pro entry boots on `plugins_loaded` priority 20 so Free's
// default-priority 10 listeners are registered first.
add_action(
	'plugins_loaded',
	static function (): void {
		if ( ! flow_ew_pro_should_boot() ) {
			return;
		}
		( new \Flow\EditorialWorkflow\Pro\ProPlugin() )->boot();
	},
	20
);

// Marketing-site-only Site Demo (same GitHub repo; excluded from wp.org / Freemius).
add_action(
	'plugins_loaded',
	static function (): void {
		if ( ! defined( 'FLOW_EW_ENABLE_SITE_DEMO' ) || true !== FLOW_EW_ENABLE_SITE_DEMO ) {
			return;
		}
		$bootstrap = FLOW_EW_PLUGIN_DIR . 'includes/site-demo/bootstrap.php';
		if ( ! is_readable( $bootstrap ) ) {
			return;
		}
		require_once $bootstrap;
	},
	25
);

add_filter(
	'fs_is_pricing_page_visible_jumplinks-editorial-workflow',
	static function ( $visible ) {
		return flow_ew_is_pro_build() ? (bool) $visible : true;
	}
);

// We only sell an annual plan — the Freemius pricing app still appends a
// "/mo equivalent" caption under each annual price by default, which reads
// like a second pricing tier and confuses visitors. Returning false hides
// that caption; only the annual price + cycle remain.
add_filter(
	'fs_pricing/show_annual_in_monthly_jumplinks-editorial-workflow',
	'__return_false'
);

// Single-plan layout: collapses the multi-card grid into a single,
// horizontally-oriented plan summary when only one paid plan exists.
add_filter(
	'fs_pricing/disable_single_package_jumplinks-editorial-workflow',
	'__return_true'
);

// Checkout (cart iframe) appearance overrides. `checkout/parameters` is the
// channel for these — the SDK allowlists the keys in
// FS_Checkout_Manager::$_allowed_custom_params before forwarding them on.
add_filter(
	'fs_checkout/parameters_jumplinks-editorial-workflow',
	static function ( array $params ): array {
		$params['show_refund_badge'] = true;
		return $params;
	}
);

add_filter(
	'fs_is_submenu_visible_jumplinks-editorial-workflow',
	static function ( $visible, $id ) {
		$is_pro = flow_ew_is_pro_build();

		if ( 'pricing' === $id ) {
			// Hide Upgrade in Pro — re-attach via Account if license drops.
			return $is_pro ? false : (bool) $visible;
		}

		return (bool) $visible;
	},
	10,
	2
);

add_action(
	'admin_menu',
	static function (): void {
		global $submenu;
		$parent_slug = 'flow-ew-dashboard';
		if ( ! isset( $submenu[ $parent_slug ] ) ) {
			return;
		}
		$relax = array(
			'flow-ew-dashboard-contact',
			'flow-ew-dashboard-pricing',
			'flow-ew-dashboard-support-forum',
			'flow-ew-dashboard-affiliation',
		);
		foreach ( $submenu[ $parent_slug ] as $i => $entry ) {
			$href = isset( $entry[2] ) ? (string) $entry[2] : '';
			if ( in_array( $href, $relax, true ) ) {
				// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- intentional; SDK exposes no capability filter.
				$submenu[ $parent_slug ][ $i ][1] = 'read';
			}
		}
	},
	PHP_INT_MAX
);

// Dev-override warning. Local/development envs only, admins only,
// Flow admin pages only.
add_action(
	'admin_notices',
	static function (): void {
		$env_is_dev = in_array( wp_get_environment_type(), array( 'local', 'development' ), true );
		if ( ! $env_is_dev ) {
			return;
		}
		$override = flow_ew_get_pro_dev_override();
		if ( null === $override ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || false === strpos( (string) $screen->id, 'flow-ew' ) ) {
			return;
		}
		$mode    = $override ? 'Pro' : 'Free';
		$message = sprintf(
			'<strong>Flow:</strong> Dev override is forcing %s-build behaviour on this site. Never set <code>FLOW_EW_PRO_DEV_OVERRIDE</code> in production.',
			esc_html( $mode )
		);
		echo '<div class="notice notice-warning"><p>' . wp_kses_post( $message ) . '</p></div>';
	}
);
