<?php
/**
 * Plugin Name: Jumplinks Flow - Editorial Feedback, Review & Approval Workflow
 * Description: Client feedback and editorial workflow with inline comments and a familiar WordPress style review experience.
 * Version: 2.4.3
 * Author: Jumplinks Systems
 * Author URI: https://jumplinks.net
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: jumplinks-editorial-workflow
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'FLOW_EW_VERSION', '2.4.3' );
define( 'FLOW_EW_PLUGIN_FILE', __FILE__ );
define( 'FLOW_EW_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'FLOW_EW_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'FLOW_EW_DB_VERSION', '9' );

spl_autoload_register(
	function ( string $class_name ): void {
		$prefix = 'Flow\\EditorialWorkflow\\';
		if ( strncmp( $prefix, $class_name, strlen( $prefix ) ) !== 0 ) {
				return;
		}
		$relative = substr( $class_name, strlen( $prefix ) );

		$subdir     = '';
		$pro_prefix = 'Pro\\';
		if ( 0 === strncmp( $pro_prefix, $relative, strlen( $pro_prefix ) ) ) {
			$subdir   = 'pro/';
			$relative = substr( $relative, strlen( $pro_prefix ) );
		}

		$hyphenated = preg_replace( '/([a-z0-9])([A-Z])/', '$1-$2', str_replace( '_', '-', $relative ) );
		$hyphenated = strtolower( (string) $hyphenated );
		$hyphenated = preg_replace( '/-{2,}/', '-', (string) $hyphenated );
		$hyphenated = trim( $hyphenated, '-' );

		$file = FLOW_EW_PLUGIN_DIR . 'includes/' . $subdir . 'class-flow-' . $hyphenated . '.php';
		if ( file_exists( $file ) ) {
			require $file;
		}
	}
);

register_activation_hook( __FILE__, [ Activator::class, 'activate' ] );
register_deactivation_hook( __FILE__, [ Activator::class, 'deactivate' ] );

add_action(
	'plugins_loaded',
	function (): void {
		( new Plugin() )->boot();
	}
);

require_once __DIR__ . '/includes/freemius-bootstrap.php';
