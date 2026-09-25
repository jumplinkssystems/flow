<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Exposes Flow's abilities through AI Engine's MCP server.
 *
 * AI Engine builds its tool list from its own filters rather than the
 * WordPress Abilities API, so an agent connected through it cannot see Flow
 * at all — and reaches for AI Engine's core-comment tools instead, which never
 * touch a review. Every ability passes through Abilities::register_ability(),
 * which hands it here as well.
 */
final class AI_Engine_Bridge {

	const CATEGORY = 'Jumplinks Flow';

	/** @var array<string,array<string,mixed>> Tool name => ability args. */
	private static $abilities = [];

	/** @var array<string,string> Ability name => tool name. */
	private static $names = [];

	public static function boot(): void {
		add_filter( 'mwai_mcp_tools', [ __CLASS__, 'add_tools' ] );
		add_filter( 'mwai_mcp_callback', [ __CLASS__, 'handle_call' ], 10, 3 );
	}

	/**
	 * @param array<string,mixed> $args
	 */
	public static function remember( string $ability, array $args ): void {
		$tool                     = self::tool_name( $ability );
		self::$abilities[ $tool ] = $args;
		self::$names[ $ability ]  = $tool;
	}

	/** MCP clients reject tool names containing a slash. */
	public static function tool_name( string $ability ): string {
		return str_replace( [ '/', '-' ], '_', $ability );
	}

	/**
	 * @param mixed $tools
	 * @return mixed
	 */
	public static function add_tools( $tools ) {
		if ( ! is_array( $tools ) ) {
			return $tools;
		}
		self::load_abilities();

		foreach ( self::$abilities as $tool => $args ) {
			$hints    = (array) ( $args['annotations'] ?? [] );
			$readonly = ! empty( $hints['readonly'] );
			$tools[]  = [
				'name'        => $tool,
				'description' => self::with_tool_names( (string) ( $args['description'] ?? $args['label'] ?? $tool ) ),
				'category'    => self::CATEGORY,
				'inputSchema' => (array) ( $args['input_schema'] ?? [ 'type' => 'object' ] ),
				'annotations' => [
					'readOnlyHint'    => $readonly,
					'destructiveHint' => ! empty( $hints['destructive'] ),
					'idempotentHint'  => ! empty( $hints['idempotent'] ),
					'openWorldHint'   => false,
				],
				'accessLevel' => $readonly ? 'read' : 'write',
			];
		}
		return $tools;
	}

	/**
	 * @param mixed $result Null until a module claims the call.
	 * @param mixed $tool
	 * @param mixed $args
	 * @return mixed
	 * @throws \Exception AI Engine reports it to the agent as a failed tool call.
	 */
	public static function handle_call( $result, $tool, $args ) {
		if ( null !== $result || ! is_string( $tool ) ) {
			return $result;
		}
		self::load_abilities();
		if ( ! isset( self::$abilities[ $tool ] ) ) {
			return $result;
		}

		$ability = self::$abilities[ $tool ];
		$input   = is_array( $args ) ? $args : [];

		$permission = $ability['permission_callback'] ?? 'is_user_logged_in';
		if ( ! is_callable( $permission ) || ! call_user_func( $permission, $input ) ) {
			throw new \Exception( esc_html__( 'You do not have permission to use this Flow tool.', 'jumplinks-editorial-workflow' ) );
		}

		$output = call_user_func( $ability['execute_callback'], $input );
		if ( is_wp_error( $output ) ) {
			throw new \Exception( esc_html( $output->get_error_message() ) );
		}
		return self::with_tool_names( $output );
	}

	/**
	 * Flow registers on `wp_abilities_api_init`, which fires only when
	 * something reads the registry — and AI Engine never does.
	 */
	private static function load_abilities(): void {
		if ( ! empty( self::$abilities ) || ! function_exists( 'wp_get_abilities' ) ) {
			return;
		}
		wp_get_abilities();
	}

	/**
	 * The instructions name tools like `flow/resolve-comment`, but over AI
	 * Engine they are `flow_resolve_comment`. An agent told to use a tool it
	 * cannot see falls back to one it can — here, a core comment tool that
	 * never reaches the review.
	 *
	 * @param mixed $value
	 * @return mixed
	 */
	private static function with_tool_names( $value ) {
		if ( is_string( $value ) ) {
			if ( empty( self::$names ) ) {
				return $value;
			}
			$names = array_keys( self::$names );
			usort(
				$names,
				static function ( string $a, string $b ): int {
					return strlen( $b ) - strlen( $a );
				}
			);
			// Whole names only: `flow/resolve-comment` must not rewrite the
			// start of `flow/resolve-comments`.
			$pattern = '~(?<![\w/-])(?:' . implode( '|', array_map( 'preg_quote', $names, array_fill( 0, count( $names ), '~' ) ) ) . ')(?![\w-])~';
			return (string) preg_replace_callback(
				$pattern,
				static function ( array $found ): string {
					return self::$names[ $found[0] ];
				},
				$value
			);
		}
		if ( is_array( $value ) ) {
			return array_map( [ __CLASS__, 'with_tool_names' ], $value );
		}
		return $value;
	}
}
