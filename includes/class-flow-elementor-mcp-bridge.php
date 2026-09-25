<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Adds Flow's abilities to Elementor's MCP server.
 *
 * Elementor serves its own MCP endpoint listing only Elementor abilities, so an
 * agent editing a page through it cannot see the review that page is in. The
 * server exposes every ability name returned by this filter, and runs it
 * through the Abilities API exactly as registered.
 */
final class Elementor_Mcp_Bridge {

	public static function boot(): void {
		add_filter( 'elementor/mcp/server/tools', [ __CLASS__, 'add_tools' ] );
	}

	/**
	 * @param mixed $tools Ability names Elementor's server will expose.
	 * @return mixed
	 */
	public static function add_tools( $tools ) {
		if ( ! is_array( $tools ) || ! function_exists( 'wp_get_abilities' ) ) {
			return $tools;
		}
		foreach ( wp_get_abilities() as $ability ) {
			// By category, not by a "flow/" prefix another plugin could share.
			if ( Abilities::CATEGORY === $ability->get_category() ) {
				$tools[] = $ability->get_name();
			}
		}
		return $tools;
	}
}
