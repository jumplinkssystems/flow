<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Quick creation of the account AI comments are posted as. It only lends a
 * name and avatar, so it is made a Subscriber with a password nobody knows.
 */
class Agent_User {

	public function boot(): void {
		add_action( 'rest_api_init', [ $this, 'register_rest_route' ] );
	}

	public static function can_create(): bool {
		return current_user_can( 'create_users' ) && current_user_can( 'manage_options' );
	}

	public function register_rest_route(): void {
		register_rest_route(
			'flow/v1',
			'/agent-user',
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'create' ],
				'permission_callback' => [ self::class, 'can_create' ],
				'args'                => [
					'username' => [
						'type'     => 'string',
						'required' => true,
					],
					'email'    => [
						'type'     => 'string',
						'required' => true,
					],
				],
			]
		);
	}

	/**
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function create( \WP_REST_Request $request ) {
		$username = sanitize_user( trim( (string) $request->get_param( 'username' ) ), true );
		$email    = sanitize_email( trim( (string) $request->get_param( 'email' ) ) );

		if ( '' === $username || ! validate_username( $username ) ) {
			return new \WP_Error( 'flow_ew_invalid_username', __( 'Enter a username using only letters, numbers, spaces and . - _ @', 'jumplinks-editorial-workflow' ), [ 'status' => 400 ] );
		}
		if ( username_exists( $username ) ) {
			return new \WP_Error( 'flow_ew_username_exists', __( 'That username is already taken.', 'jumplinks-editorial-workflow' ), [ 'status' => 400 ] );
		}
		if ( ! is_email( $email ) ) {
			return new \WP_Error( 'flow_ew_invalid_email', __( 'Enter a valid email address.', 'jumplinks-editorial-workflow' ), [ 'status' => 400 ] );
		}
		if ( email_exists( $email ) ) {
			return new \WP_Error( 'flow_ew_email_exists', __( 'That email address already belongs to a user.', 'jumplinks-editorial-workflow' ), [ 'status' => 400 ] );
		}

		$user_id = wp_insert_user(
			[
				'user_login'   => $username,
				'user_email'   => $email,
				'user_pass'    => wp_generate_password( 32, true, true ),
				'display_name' => $username,
				'role'         => 'subscriber',
			]
		);
		if ( is_wp_error( $user_id ) ) {
			return new \WP_Error( 'flow_ew_user_create_failed', $user_id->get_error_message(), [ 'status' => 400 ] );
		}

		return rest_ensure_response(
			[
				'id'         => (int) $user_id,
				'name'       => $username,
				'login'      => $username,
				'email'      => $email,
				'avatar_url' => (string) get_avatar_url( (int) $user_id, [ 'size' => 64 ] ),
			]
		);
	}
}
