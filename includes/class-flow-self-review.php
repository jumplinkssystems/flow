<?php

declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Self review: a private review link on every supported page, for people who
 * review their own work (often with an AI agent) and may hand the page to a
 * client later. The row is created on first use so the link can be offered
 * everywhere without writing anything up front.
 */
final class Self_Review {

	const ACTION = 'flow_ew_start_self_review';

	/** Set only when the editor switches self review off for one post; absent means on. */
	const META_OFF = '_flow_ew_self_review_off';

	public function boot(): void {
		add_action( 'admin_post_' . self::ACTION, [ $this, 'handle_start' ] );
		add_action( 'rest_api_init', [ $this, 'register_rest_route' ] );
		if ( Settings::is_solo_mode() ) {
			add_filter( 'post_row_actions', [ $this, 'add_row_action' ], 10, 2 );
			add_filter( 'page_row_actions', [ $this, 'add_row_action' ], 10, 2 );
		}
	}

	/**
	 * Self review only: the content lists' "Review" link opens the self review.
	 * Other modes keep Admin_Columns' link to the client review.
	 *
	 * @param array<string,string> $actions
	 * @param mixed                $post
	 * @return array<string,string>
	 */
	public function add_row_action( array $actions, $post ): array {
		if ( ! $post instanceof \WP_Post || ! self::is_available_for( (int) $post->ID, get_current_user_id() ) ) {
			return $actions;
		}
		$actions['flow_ew_review'] = sprintf(
			'<a href="%s">%s</a>',
			esc_url( self::start_url( (int) $post->ID ) ),
			esc_html__( 'Review', 'jumplinks-editorial-workflow' )
		);
		return $actions;
	}

	public static function is_available_for( int $post_id, int $user_id ): bool {
		return self::is_offered_for( $post_id, $user_id )
			&& self::is_on_for_post( $post_id )
			&& 'auto-draft' !== get_post_status( $post_id );
	}

	public static function is_on_for_post( int $post_id ): bool {
		return ! get_post_meta( $post_id, self::META_OFF, true );
	}

	public function register_rest_route(): void {
		register_rest_route(
			'flow/v1',
			'/self-review/(?P<post_id>[\d]+)',
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'rest_toggle' ],
				'permission_callback' => static function ( \WP_REST_Request $request ): bool {
					return self::is_offered_for( (int) $request->get_param( 'post_id' ), get_current_user_id() );
				},
				'args'                => [
					'enabled' => [
						'type'     => 'boolean',
						'required' => true,
					],
				],
			]
		);
	}

	public function rest_toggle( \WP_REST_Request $request ) {
		$post_id = (int) $request->get_param( 'post_id' );
		if ( $request->get_param( 'enabled' ) ) {
			delete_post_meta( $post_id, self::META_OFF );
		} else {
			update_post_meta( $post_id, self::META_OFF, 1 );
		}
		return rest_ensure_response( [ 'enabled' => self::is_on_for_post( $post_id ) ] );
	}

	/** Ignores auto-draft: the editor hides the link until the first save, without a reload. */
	public static function is_offered_for( int $post_id, int $user_id ): bool {
		if ( $post_id <= 0 || $user_id <= 0 || ! Settings::is_self_review_enabled() ) {
			return false;
		}
		$post = get_post( $post_id );
		if ( ! $post instanceof \WP_Post ) {
			return false;
		}
		return Settings::is_post_type_supported( $post->post_type )
			&& user_can( $user_id, 'edit_post', $post_id );
	}

	/** Unescaped (wp_nonce_url() returns `&amp;`); callers escape for their context. */
	/** The self review's own link once it exists, else the link that creates it. */
	public static function link_for( int $post_id ): string {
		$review = DB::get_private_review( $post_id );
		if ( ! $review ) {
			return self::start_url( $post_id );
		}
		return Review::get_preview_url(
			(int) $review->id,
			Review::get_effective_preview_revision_id( $post_id, (int) ( $review->revision_id ?? 0 ) ),
			$post_id
		);
	}

	public static function start_url( int $post_id ): string {
		return add_query_arg(
			[
				'action'   => self::ACTION,
				'post_id'  => $post_id,
				'_wpnonce' => wp_create_nonce( self::ACTION . '_' . $post_id ),
			],
			admin_url( 'admin-post.php' )
		);
	}

	public function handle_start(): void {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- verified by check_admin_referer below.
		$post_id = isset( $_GET['post_id'] ) ? (int) $_GET['post_id'] : 0;
		check_admin_referer( self::ACTION . '_' . $post_id );
		$user_id = get_current_user_id();
		if ( ! self::is_available_for( $post_id, $user_id ) ) {
			wp_die( esc_html__( 'Self review is not enabled on this site.', 'jumplinks-editorial-workflow' ), '', [ 'response' => 403 ] );
		}
		$review_id = Review::start_self_review( $post_id, $user_id );
		$review    = DB::get_review( $review_id );
		$revision  = Review::get_effective_preview_revision_id( $post_id, (int) ( $review->revision_id ?? 0 ) );
		wp_safe_redirect( Review::get_preview_url( $review_id, $revision, $post_id ) );
		exit;
	}

	/**
	 * @return array<string,mixed>
	 */
	public static function payload_for_agent( object $review ): array {
		$post_id  = (int) $review->post_id;
		$comments = Ability_Context::list_comments_payload( $review, true );
		return [
			'id'                 => (int) $review->id,
			'review_url'         => Review::get_preview_url(
				(int) $review->id,
				Review::get_effective_preview_revision_id( $post_id, (int) ( $review->revision_id ?? 0 ) ),
				$post_id
			),
			'status'             => Review::STATUS_SELF_REVIEW,
			'unresolved_inline'  => count( $comments['unresolved_inline'] ),
			'unresolved_general' => count( $comments['unresolved_general'] ),
		];
	}
}
