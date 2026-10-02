<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * What each setup-wizard use case writes. The wizard sends the answers; this
 * fills in what the use case decides on its own and sanitises the rest with
 * the same callbacks the settings page uses. Options a use case does not
 * cover are left out of the map, so re-running the wizard never resets them.
 */
final class Setup_Presets {

	const EDITORIAL  = 'editorial';
	const CLIENT     = 'client';
	const BUILD_AI   = 'build_ai';
	const APPROVE_AI = 'approve_ai';

	/** @return string[] */
	public static function use_cases(): array {
		return [ self::EDITORIAL, self::CLIENT, self::BUILD_AI, self::APPROVE_AI ];
	}

	/** @return array<string,string> use case => translated label */
	public static function labels(): array {
		return [
			self::EDITORIAL  => __( 'Editorial workflow', 'jumplinks-editorial-workflow' ),
			self::CLIENT     => __( 'Client feedback', 'jumplinks-editorial-workflow' ),
			self::BUILD_AI   => __( 'Build with AI', 'jumplinks-editorial-workflow' ),
			self::APPROVE_AI => __( 'Approve AI-written content', 'jumplinks-editorial-workflow' ),
		];
	}

	/** Use cases that always show the AI agent settings, without asking first. */
	public static function always_has_agent( string $use_case ): bool {
		return in_array( $use_case, [ self::BUILD_AI, self::APPROVE_AI ], true );
	}

	/**
	 * Option name => value to store, in write order (the AI user before the
	 * switch that needs it).
	 *
	 * @param array<string,mixed> $in Wizard answers.
	 * @return array<string,mixed>
	 */
	public static function resolve( string $use_case, array $in, Settings $settings ): array {
		if ( ! in_array( $use_case, self::use_cases(), true ) ) {
			$use_case = self::EDITORIAL;
		}
		$out = [];

		switch ( $use_case ) {
			case self::CLIENT:
				$mode = Settings::MODE_OPTIONAL;
				break;
			case self::BUILD_AI:
				$mode = Settings::MODE_SOLO;
				break;
			case self::APPROVE_AI:
				$mode = Settings::MODE_MANDATORY;
				break;
			default:
				$mode = Settings::MODE_MANDATORY === ( $in['review_mode'] ?? '' ) ? Settings::MODE_MANDATORY : Settings::MODE_OPTIONAL;
		}
		$out[ Settings::OPTION_REVIEW_MODE ] = $mode;

		if ( self::BUILD_AI === $use_case ) {
			$out[ Settings::OPTION_SUPPORTED_POST_TYPES ] = array_keys( Settings::get_post_types_eligible_for_flow() );
		} else {
			$types                                        = $settings->sanitize_supported_post_types( $in['post_types'] ?? [] );
			$out[ Settings::OPTION_SUPPORTED_POST_TYPES ] = [] !== $types ? $types : Settings::DEFAULT_SUPPORTED_POST_TYPES;
		}

		if ( self::BUILD_AI !== $use_case ) {
			$out[ Settings::OPTION_REVIEWER_ROLES ] = self::CLIENT === $use_case
				? []
				: $settings->sanitize_reviewer_roles( $in['reviewer_roles'] ?? [] );

			$out[ Settings::OPTION_DISABLE_EXTERNAL ] = self::CLIENT === $use_case
				? false
				: ! rest_sanitize_boolean( $in['allow_external'] ?? true );

			$out[ Settings::OPTION_DISABLE_OPEN_REVIEWS ] = self::EDITORIAL !== $use_case;
			if ( self::EDITORIAL === $use_case || self::CLIENT === $use_case ) {
				$out[ Settings::OPTION_SELF_REVIEW ] = false;
			}
			$out[ Settings::OPTION_SHOW_REVIEWED_BY ] = rest_sanitize_boolean( $in['show_reviewed_by'] ?? false );

			$reviewer_id                                  = $settings->sanitize_auto_assign_reviewer( $in['auto_assign_reviewer_id'] ?? 0 );
			$out[ Settings::OPTION_AUTO_ASSIGN_REVIEWER ] = $reviewer_id;
			$out[ Settings::OPTION_AUTO_ASSIGN_EMAIL ]    = $reviewer_id > 0 || $out[ Settings::OPTION_DISABLE_EXTERNAL ]
				? ''
				: Settings::sanitize_auto_assign_email( $in['auto_assign_email'] ?? '' );
		}

		if ( self::always_has_agent( $use_case ) || rest_sanitize_boolean( $in['agent_enabled'] ?? false ) ) {
			$author = $settings->sanitize_user_id_option( $in['agent_author_id'] ?? 0 );

			$out[ Settings::OPTION_AGENT_COMMENT_AUTHOR ]  = $author;
			$out[ Settings::OPTION_AGENT_COMMENTS ]        = $author > 0 && rest_sanitize_boolean( $in['agent_comments'] ?? false );
			$out[ Settings::OPTION_AGENT_RESOLVE_NOTES ]   = rest_sanitize_boolean( $in['agent_resolve_notes'] ?? true );
			$out[ Settings::OPTION_AGENT_FOLLOWUP ]        = rest_sanitize_boolean( $in['agent_followup'] ?? true );
			$out[ Settings::OPTION_AGENT_COMMENT_MARKER ]  = rest_sanitize_boolean( $in['agent_marker'] ?? true );
			$out[ Settings::OPTION_AGENT_ASK_BEFORE_EDIT ] = rest_sanitize_boolean( $in['agent_ask_before_edit'] ?? false );
		}

		$out[ Settings::OPTION_USE_CASE ] = $use_case;
		return $out;
	}
}
