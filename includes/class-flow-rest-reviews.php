<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class REST_Reviews extends \WP_REST_Controller {

	protected $namespace = 'flow/v1';
	protected $rest_base = 'reviews';

	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				[
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'create_item' ],
					'permission_callback' => [ $this, 'create_item_permissions_check' ],
					'args'                => $this->get_create_item_schema(),
				],
			]
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<post_id>[\d]+)',
			[
				[
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_item' ],
					'permission_callback' => [ $this, 'get_item_permissions_check' ],
					'args'                => [
						'post_id' => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
						],
					],
				],
			]
		);

		foreach (
			[
				'approve'         => 'approve_item',
				'revoke-approval' => 'revoke_approval_item',
				'request-changes' => 'request_changes_item',
				'resubmit'        => 'resubmit_item',
				'cancel'          => 'cancel_item',
				'send'            => 'send_item',
				'open'            => 'open_item',
				'close'           => 'close_item',
			] as $action => $callback
		) {
			register_rest_route(
				$this->namespace,
				'/' . $this->rest_base . '/(?P<id>[\d]+)/' . $action,
				[
					[
						'methods'             => \WP_REST_Server::CREATABLE,
						'callback'            => [ $this, $callback ],
						'permission_callback' => [ $this, 'action_permissions_check' ],
						'args'                => [
							'id' => [
								'required'          => true,
								'type'              => 'integer',
								'sanitize_callback' => 'absint',
							],
						],
					],
				]
			);
		}

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/comments',
			[
				[
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'create_comment_item' ],
					'permission_callback' => [ $this, 'action_permissions_check' ],
					'args'                => [
						'id'            => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
						],
						'html'          => [
							'required' => true,
							'type'     => 'string',
						],
						'parentId'      => [
							'required'          => false,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
							'default'           => 0,
						],
						'anchorText'    => [
							'required' => false,
							'type'     => 'string',
							'default'  => '',
						],
						'blockClientId' => [
							'required' => false,
							'type'     => 'string',
							'default'  => '',
						],
						'authorName'    => [
							'required' => false,
							'type'     => 'string',
							'default'  => '',
						],
						'authorEmail'   => [
							'required' => false,
							'type'     => 'string',
							'default'  => '',
						],
					],
				],
			]
		);

		register_rest_route(
			$this->namespace,
			'/comments/(?P<comment_id>[\d]+)',
			[
				[
					'methods'             => 'PATCH',
					'callback'            => [ $this, 'update_comment_item' ],
					'permission_callback' => [ $this, 'comment_update_permissions_check' ],
					'args'                => [
						'comment_id' => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
						],
						'html'       => [
							'required' => false,
							'type'     => 'string',
						],
						'resolved'   => [
							'required' => false,
							'type'     => 'boolean',
						],
					],
				],
				[
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => [ $this, 'delete_comment_item' ],
					'permission_callback' => [ $this, 'comment_ownership_check' ],
					'args'                => [
						'comment_id' => [
							'required'          => true,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
						],
					],
				],
			]
		);

		register_rest_route(
			$this->namespace,
			'/reviewers',
			[
				[
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_reviewers' ],
					'permission_callback' => [ $this, 'get_reviewers_permissions_check' ],
					'args'                => [
						'post_id' => [
							'required'          => false,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
						],
					],
				],
			]
		);

		register_rest_route(
			$this->namespace,
			'/users/search',
			[
				[
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => [ $this, 'search_users' ],
					'permission_callback' => [ $this, 'search_users_permissions_check' ],
					'args'                => [
						'q' => [
							'required'          => true,
							'type'              => 'string',
							'minLength'         => 2,
							'sanitize_callback' => 'sanitize_text_field',
						],
					],
				],
			]
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			[
				[
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => [ $this, 'list_reviews' ],
					'permission_callback' => [ $this, 'list_reviews_permissions_check' ],
					'args'                => [
						'status'       => [
							'required'          => false,
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						],
						'reviewer_id'  => [
							'required'          => false,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
						],
						'requester_id' => [
							'required'          => false,
							'type'              => 'integer',
							'sanitize_callback' => 'absint',
						],
						'post_type'    => [
							'required'          => false,
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						],
						'assigned_to'  => [
							'required'          => false,
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						],
						'per_page'     => [
							'required'          => false,
							'type'              => 'integer',
							'default'           => 20,
							'sanitize_callback' => 'absint',
						],
						'page'         => [
							'required'          => false,
							'type'              => 'integer',
							'default'           => 1,
							'sanitize_callback' => 'absint',
						],
					],
				],
			]
		);

		register_rest_route(
			$this->namespace,
			'/activity',
			[
				[
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => [ $this, 'get_activity' ],
					'permission_callback' => [ $this, 'list_reviews_permissions_check' ],
					'args'                => [
						'per_page' => [
							'required'          => false,
							'type'              => 'integer',
							'default'           => 20,
							'sanitize_callback' => 'absint',
						],
					],
				],
			]
		);
	}

	/**
	 * @param object $review Row from flow_reviews.
	 */
	private function review_belongs_to_supported_post_type( object $review ): bool {
		return Review::review_has_supported_post_type( $review );
	}

	/**
	 * @param object $review Row from flow_reviews.
	 * @return true|\WP_Error
	 */
	private function assert_review_post_type_supported( object $review ) {
		if ( ! $this->review_belongs_to_supported_post_type( $review ) ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Review not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}

		return true;
	}

	public function create_item( $request ) {
		$post_id         = (int) $request->get_param( 'post_id' );
		$reviewer_id     = (int) $request->get_param( 'reviewer_id' );
		$current_user_id = get_current_user_id();

		try {
			$raw_invite = trim( (string) $request->get_param( 'invite_email' ) );
			if ( '' !== $raw_invite ) {
				$invite_email = sanitize_email( $raw_invite );
				if ( '' === $invite_email || ! is_email( $invite_email ) ) {
					return new \WP_Error(
						'flow_ew_invalid_email',
						__( 'Please enter a valid email address.', 'jumplinks-editorial-workflow' ),
						[ 'status' => 400 ]
					);
				}
				$review_id = Email_Review::assign_invite( $post_id, $invite_email, $current_user_id );
			} else {
				$review_id = Review::request( $post_id, $reviewer_id, $current_user_id );
				// Switching to a WP user clears any prior email invites (Free single-reviewer).
				if ( $reviewer_id > 0 ) {
					Email_Review_Invites_DB::delete_for_review( $review_id );
				}
			}
		} catch ( \InvalidArgumentException $e ) {
			return new \WP_Error( 'flow_ew_error', $e->getMessage(), [ 'status' => 400 ] );
		} catch ( \RuntimeException $e ) {
			return new \WP_Error( 'flow_ew_error', $e->getMessage(), [ 'status' => 500 ] );
		}

		$review = DB::get_review( $review_id );
		return rest_ensure_response( $this->prepare_review( $review ) );
	}

	public function get_item( $request ) {
		$post_id   = (int) $request->get_param( 'post_id' );
		$post_type = $post_id > 0 ? get_post_type( $post_id ) : '';
		if ( ! $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return rest_ensure_response( null );
		}
		$review = DB::get_active_review( $post_id );

		if ( ! $review ) {
			return rest_ensure_response( null );
		}

		return rest_ensure_response( $this->prepare_review( $review ) );
	}

	public function approve_item( \WP_REST_Request $request ) {
		return $this->dispatch_review_action( $request, [ Review::class, 'approve' ] );
	}

	public function revoke_approval_item( \WP_REST_Request $request ) {
		return $this->dispatch_review_action( $request, [ Review::class, 'revoke_approval' ] );
	}

	public function request_changes_item( \WP_REST_Request $request ) {
		return $this->dispatch_review_action( $request, [ Review::class, 'request_changes' ] );
	}

	public function resubmit_item( $request ) {
		return $this->dispatch_review_action( $request, [ Review::class, 'resubmit' ] );
	}

	public function cancel_item( $request ) {
		$result = $this->dispatch_review_action( $request, [ Review::class, 'cancel' ] );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$review = DB::get_review( (int) $request->get_param( 'id' ) );
		if ( ! $review ) {
			return new \WP_REST_Response( null, 204 );
		}
		return rest_ensure_response( $this->prepare_review( $review ) );
	}

	public function send_item( $request ) {
		$result = $this->dispatch_review_action( $request, [ Review::class, 'send_for_review' ] );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$review = DB::get_review( (int) $request->get_param( 'id' ) );
		if ( ! $review ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Review not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}
		return rest_ensure_response( $this->prepare_review( $review ) );
	}

	/**
	 * Run a `Review::*` state-transition method against the review id in the
	 * request and translate the canonical exception types into WP_Error
	 * responses with appropriate HTTP statuses. Returns the freshly-read
	 * review row so clients see the post-action state — which matters when
	 * add-ons (Pro multi-reviewer) override `status` after the action via
	 * a recompute hook.
	 *
	 * @param callable $method `Review::method_name` static callable accepting (review_id, user_id).
	 */
	private function dispatch_review_action( \WP_REST_Request $request, callable $method ) {
		$id = (int) $request->get_param( 'id' );
		try {
			$method( $id, get_current_user_id() );
		} catch ( \InvalidArgumentException $e ) {
			return new \WP_Error( 'flow_ew_not_found', $e->getMessage(), [ 'status' => 404 ] );
		} catch ( \RuntimeException $e ) {
			return new \WP_Error( 'flow_ew_forbidden', $e->getMessage(), [ 'status' => 403 ] );
		}
		$review = DB::get_review( $id );
		if ( ! $review ) {
			return new \WP_REST_Response( null, 204 );
		}
		return rest_ensure_response( $this->prepare_review( $review ) );
	}

	public function open_item( \WP_REST_Request $request ) {
		if ( ! Review::is_open_review_feature_available() ) {
			return new \WP_Error(
				'flow_ew_feature_unavailable',
				__( 'Open review is not available in this edition.', 'jumplinks-editorial-workflow' ),
				[ 'status' => 403 ]
			);
		}
		$id     = (int) $request->get_param( 'id' );
		$review = DB::get_review( $id );
		if ( ! $review ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Review not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}
		$type_ok = $this->assert_review_post_type_supported( $review );
		if ( is_wp_error( $type_ok ) ) {
			return $type_ok;
		}
		if ( ! Review::is_requester_or_manager( $review, get_current_user_id() ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'You are not authorized to modify this review.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
		}
		DB::update_review( $id, [ 'is_open' => 1 ] );
		$updated = DB::get_review( $id );
		if ( ! $updated ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Review not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}
		\do_action( 'flow_ew_review_opened', $id, (int) $updated->post_id, get_current_user_id() );
		return rest_ensure_response( $this->prepare_review( $updated ) );
	}

	public function close_item( \WP_REST_Request $request ) {
		if ( ! Review::is_open_review_feature_available() ) {
			return new \WP_Error(
				'flow_ew_feature_unavailable',
				__( 'Open review is not available in this edition.', 'jumplinks-editorial-workflow' ),
				[ 'status' => 403 ]
			);
		}
		$id     = (int) $request->get_param( 'id' );
		$review = DB::get_review( $id );
		if ( ! $review ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Review not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}
		$type_ok = $this->assert_review_post_type_supported( $review );
		if ( is_wp_error( $type_ok ) ) {
			return $type_ok;
		}
		if ( ! Review::is_requester_or_manager( $review, get_current_user_id() ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'You are not authorized to modify this review.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
		}
		DB::update_review( $id, [ 'is_open' => 0 ] );
		$updated = DB::get_review( $id );
		if ( ! $updated ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Review not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}
		\do_action( 'flow_ew_review_closed', $id, (int) $updated->post_id, get_current_user_id() );
		return rest_ensure_response( $this->prepare_review( $updated ) );
	}

	public function create_comment_item( \WP_REST_Request $request ) {
		$review_id = (int) $request->get_param( 'id' );
		$review    = DB::get_review( $review_id );
		if ( ! $review ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Review not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}
		$type_ok = $this->assert_review_post_type_supported( $review );
		if ( is_wp_error( $type_ok ) ) {
			return $type_ok;
		}

		$html      = wp_kses_post( (string) $request->get_param( 'html' ) );
		$user_id   = get_current_user_id();
		$parent_id = (int) $request->get_param( 'parentId' );

		$html            = (string) \apply_filters(
			'flow_ew_filter_comment_html',
			$html,
			[
				'review'  => $review,
				'request' => $request,
				'is_edit' => false,
			]
		);
		$anchor_text     = sanitize_text_field( (string) $request->get_param( 'anchorText' ) );
		$block_client_id = sanitize_text_field( (string) $request->get_param( 'blockClientId' ) );
		$author_name     = sanitize_text_field( (string) $request->get_param( 'authorName' ) );
		$author_email    = sanitize_email( (string) $request->get_param( 'authorEmail' ) );

		$invite = ( 0 === $user_id ) ? Email_Review::current_invite_for_review( $review_id ) : null;
		if ( $invite ) {
			// Force identity from the invite session — client cannot spoof another address.
			$author_email = Email_Review_Invites_DB::normalize_email( (string) $invite->email );
			if ( '' === $author_name ) {
				$author_name = trim( (string) ( $invite->display_name ?? '' ) );
			}
			if ( '' === $author_name ) {
				$author_name = $author_email;
			}
		}

		// Anonymous submitters must provide a display name; invitees may fall back to email.
		if ( 0 === $user_id && '' === $author_name && ! $invite ) {
			return new \WP_Error(
				'rest_invalid_param',
				__( 'A name is required to comment.', 'jumplinks-editorial-workflow' ),
				[ 'status' => 400 ]
			);
		}

		// Pre-flight filter for add-ons; non-empty return becomes a 4xx.
		$reject = (string) \apply_filters(
			'flow_ew_pre_create_comment_error',
			'',
			[
				'review'       => $review,
				'user_id'      => $user_id,
				'html'         => $html,
				'author_name'  => $author_name,
				'author_email' => $author_email,
				'request'      => $request,
			]
		);
		if ( '' !== $reject ) {
			return new \WP_Error(
				'flow_ew_comment_rejected',
				$reject,
				[ 'status' => 422 ]
			);
		}

		$insert_data = [
			'review_id'    => $review_id,
			'post_id'      => (int) $review->post_id,
			'comment_text' => $html,
			'author_id'    => $user_id,
		];

		if ( 0 === $user_id ) {
			$insert_data['author_name']  = $author_name;
			$insert_data['author_email'] = $author_email; // sanitize_email returns '' for invalid
		}

		if ( '' !== $anchor_text ) {
			$insert_data['anchor_text'] = $anchor_text;
		}
		if ( '' !== $block_client_id ) {
			$insert_data['block_client_id'] = $block_client_id;
		}

		if ( $parent_id > 0 ) {
			$parent = DB::get_comment( $parent_id );
			if ( $parent ) {
				$insert_data['parent_id'] = (int) $parent->parent_id > 0
					? (int) $parent->parent_id
					: $parent_id;
			}
		}

		$comment_id = DB::insert_comment( $insert_data );

		if ( ! $comment_id ) {
			return new \WP_Error( 'flow_ew_error', __( 'Failed to save comment.', 'jumplinks-editorial-workflow' ), [ 'status' => 500 ] );
		}

		\do_action( 'flow_ew_comment_created', $comment_id, $review_id, (int) $review->post_id, $user_id );

		$author          = $user_id > 0 ? get_userdata( $user_id ) : null;
		$display_name    = $author
			? $author->display_name
			: ( '' !== $author_name ? $author_name : __( 'Reviewer', 'jumplinks-editorial-workflow' ) );
		$avatar_identity = $user_id > 0 ? $user_id : ( '' !== $author_email ? $author_email : '' );
		$now             = time();

		return rest_ensure_response(
			[
				'id'            => $comment_id,
				'html'          => $html,
				'author'        => $display_name,
				'authorId'      => $user_id,
				'avatarUrl'     => '' !== $avatar_identity
					? (string) ( get_avatar_url( $avatar_identity, [ 'size' => 56 ] ) ?: '' )
					: '',
				'parentId'      => $insert_data['parent_id'] ?? 0,
				'isResolved'    => false,
				'anchorText'    => $anchor_text ?: null,
				'blockClientId' => $block_client_id ?: null,
				'date'          => (string) wp_date(
					get_option( 'date_format' ) . ' ' . get_option( 'time_format' ),
					$now
				),
			]
		);
	}

	public function update_comment_item( \WP_REST_Request $request ) {
		$comment_id = (int) $request->get_param( 'comment_id' );
		$html       = $request->has_param( 'html' )
			? wp_kses_post( (string) $request->get_param( 'html' ) )
			: null;
		$resolved   = $request->has_param( 'resolved' )
			? (bool) $request->get_param( 'resolved' )
			: null;

		$update_data = [];
		if ( null !== $html ) {
			$comment                     = DB::get_comment( $comment_id );
			$review_for                  = $comment ? DB::get_review( (int) $comment->review_id ) : null;
			$html                        = (string) \apply_filters(
				'flow_ew_filter_comment_html',
				$html,
				[
					'review'  => $review_for,
					'request' => $request,
					'is_edit' => true,
				]
			);
			$update_data['comment_text'] = $html;
		}
		if ( null !== $resolved ) {
			$update_data['is_resolved'] = $resolved ? 1 : 0;
		}

		if ( empty( $update_data ) ) {
			return new \WP_Error( 'flow_ew_error', __( 'No update fields provided.', 'jumplinks-editorial-workflow' ), [ 'status' => 400 ] );
		}

		if ( ! DB::update_comment( $comment_id, $update_data ) ) {
			return new \WP_Error( 'flow_ew_error', __( 'Failed to update comment.', 'jumplinks-editorial-workflow' ), [ 'status' => 500 ] );
		}

		if ( true === $resolved ) {
			$comment = DB::get_comment( $comment_id );
			if ( $comment ) {
				\do_action( 'flow_ew_comment_resolved', $comment_id, (int) $comment->review_id, (int) $comment->post_id, get_current_user_id() );
			}
		}

		return rest_ensure_response(
			[
				'id'         => $comment_id,
				'html'       => $html,
				'isResolved' => $resolved,
			]
		);
	}

	public function comment_update_permissions_check( \WP_REST_Request $request ) {
		$has_html     = $request->has_param( 'html' );
		$has_resolved = $request->has_param( 'resolved' );

		if ( ! $has_html && ! $has_resolved ) {
			return new \WP_Error(
				'rest_invalid_param',
				__( 'No update fields provided.', 'jumplinks-editorial-workflow' ),
				[ 'status' => 400 ]
			);
		}

		if ( $has_html ) {
			$owner_check = $this->comment_ownership_check( $request );
			if ( true !== $owner_check ) {
				return $owner_check;
			}
		}

		if ( $has_resolved ) {
			$participant_check = $this->comment_participant_check( $request );
			if ( true !== $participant_check ) {
				return $participant_check;
			}
		}

		return true;
	}

	public function delete_comment_item( \WP_REST_Request $request ) {
		$comment_id = (int) $request->get_param( 'comment_id' );
		$comment    = DB::get_comment( $comment_id );

		if ( ! DB::delete_comment( $comment_id ) ) {
			return new \WP_Error( 'flow_ew_error', __( 'Failed to delete comment.', 'jumplinks-editorial-workflow' ), [ 'status' => 500 ] );
		}

		\do_action( 'flow_ew_comment_deleted', $comment_id, get_current_user_id(), $comment );

		return rest_ensure_response( [ 'deleted' => true ] );
	}

	public function comment_ownership_check( \WP_REST_Request $request ) {
		if ( ! is_user_logged_in() ) {
			return new \WP_Error( 'rest_forbidden', __( 'You must be logged in.', 'jumplinks-editorial-workflow' ), [ 'status' => 401 ] );
		}
		$comment = DB::get_comment( (int) $request->get_param( 'comment_id' ) );
		if ( ! $comment ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Comment not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}
		$review = DB::get_review( (int) $comment->review_id );
		if ( ! $review ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Review not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}
		$type_ok = $this->assert_review_post_type_supported( $review );
		if ( is_wp_error( $type_ok ) ) {
			return $type_ok;
		}
		if ( get_current_user_id() !== (int) $comment->author_id && ! current_user_can( 'flow_manage_reviews' ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'You cannot edit this comment.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
		}
		return true;
	}

	public function comment_participant_check( \WP_REST_Request $request ) {
		$comment = DB::get_comment( (int) $request->get_param( 'comment_id' ) );
		if ( ! $comment ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Comment not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}

		$review = DB::get_review( (int) $comment->review_id );
		if ( ! $review ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Review not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}
		$type_ok = $this->assert_review_post_type_supported( $review );
		if ( is_wp_error( $type_ok ) ) {
			return $type_ok;
		}

		if ( ! is_user_logged_in() ) {
			return new \WP_Error( 'rest_forbidden', __( 'You must be logged in.', 'jumplinks-editorial-workflow' ), [ 'status' => 401 ] );
		}

		$user_id = get_current_user_id();
		if ( Review::can_user_access_review( $review, $user_id ) ) {
			return true;
		}

		return new \WP_Error( 'rest_forbidden', __( 'You are not a participant in this review.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
	}

	public function get_reviewers( \WP_REST_Request $request ) {
		$reviewer_roles = Settings::get_reviewer_roles();
		$data           = [
			[
				'id'         => Email_Review::SENTINEL_OPTION,
				'name'       => __( 'External Email', 'jumplinks-editorial-workflow' ),
				'avatar_url' => '',
				'is_email'   => true,
			],
		];

		if ( ! empty( $reviewer_roles ) ) {
			$users = get_users(
				[
					'role__in' => $reviewer_roles,
					'exclude'  => [ get_current_user_id() ],
					'fields'   => [ 'ID', 'display_name' ],
					'number'   => 200,
				]
			);

			foreach ( $users as $u ) {
				$data[] = [
					'id'         => (int) $u->ID,
					'name'       => $u->display_name,
					'avatar_url' => get_avatar_url( (int) $u->ID, [ 'size' => 32 ] ),
				];
			}
		}

		return rest_ensure_response( $data );
	}

	public function create_item_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new \WP_Error( 'rest_forbidden', __( 'You must be logged in.', 'jumplinks-editorial-workflow' ), [ 'status' => 401 ] );
		}
		if ( ! current_user_can( 'flow_assign_reviewer' ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'You do not have permission to assign reviewers.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
		}
		$post_id   = (int) $request->get_param( 'post_id' );
		$post_type = $post_id > 0 ? get_post_type( $post_id ) : '';
		if ( ! $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'Reviews are not enabled for this content type.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'You do not have permission to edit this post.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
		}
		return true;
	}

	public function get_item_permissions_check( $request ) {
		if ( ! is_user_logged_in() ) {
			return new \WP_Error( 'rest_forbidden', __( 'You must be logged in.', 'jumplinks-editorial-workflow' ), [ 'status' => 401 ] );
		}

		$post_id = (int) $request->get_param( 'post_id' );
		if ( $post_id <= 0 ) {
			return new \WP_Error(
				'rest_invalid_param',
				__( 'Invalid post ID.', 'jumplinks-editorial-workflow' ),
				[ 'status' => 400 ]
			);
		}

		$post_type = get_post_type( $post_id );
		if ( ! $post_type ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Post not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}
		if ( ! Settings::is_post_type_supported( $post_type ) ) {
			return new \WP_Error(
				'rest_forbidden',
				__( 'Reviews are not enabled for this content type.', 'jumplinks-editorial-workflow' ),
				[ 'status' => 403 ]
			);
		}

		$user_id = get_current_user_id();
		if ( current_user_can( 'flow_manage_reviews' ) ) {
			return true;
		}

		$review = DB::get_active_review( $post_id );
		if ( $review && Review::is_user_review_participant( $review, $user_id ) ) {
			return true;
		}

		if ( current_user_can( 'edit_post', $post_id ) ) {
			return true;
		}

		return new \WP_Error(
			'rest_forbidden',
			__( 'You do not have permission to view this review.', 'jumplinks-editorial-workflow' ),
			[ 'status' => 403 ]
		);
	}

	public function action_permissions_check( \WP_REST_Request $request ) {
		$review_id = (int) $request->get_param( 'id' );
		$review    = $review_id ? DB::get_review( $review_id ) : null;

		if ( ! $review ) {
			return new \WP_Error( 'flow_ew_not_found', __( 'Review not found.', 'jumplinks-editorial-workflow' ), [ 'status' => 404 ] );
		}
		$type_ok = $this->assert_review_post_type_supported( $review );
		if ( is_wp_error( $type_ok ) ) {
			return $type_ok;
		}

		if ( ! is_user_logged_in() ) {
			if ( (bool) \apply_filters( 'flow_ew_rest_anonymous_access', false, $review, $request ) ) {
				return true;
			}
			return new \WP_Error( 'rest_forbidden', __( 'You must be logged in.', 'jumplinks-editorial-workflow' ), [ 'status' => 401 ] );
		}

		$user_id = get_current_user_id();
		if ( Review::can_user_access_review( $review, $user_id ) ) {
			return true;
		}

		return new \WP_Error( 'rest_forbidden', __( 'You are not a participant in this review.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
	}

	public function get_reviewers_permissions_check( \WP_REST_Request $request ) {
		if ( ! is_user_logged_in() ) {
			return new \WP_Error( 'rest_forbidden', __( 'You must be logged in.', 'jumplinks-editorial-workflow' ), [ 'status' => 401 ] );
		}
		if ( ! current_user_can( 'flow_assign_reviewer' ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'You do not have permission to view reviewers.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
		}
		$post_id   = (int) $request->get_param( 'post_id' );
		$post_type = $post_id > 0 ? get_post_type( $post_id ) : '';
		if ( $post_id > 0 && ( ! $post_type || ! Settings::is_post_type_supported( $post_type ) ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'Reviews are not enabled for this content type.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
		}
		return true;
	}

	private function prepare_review( $review ): array {
		return Review::prepare_response_payload( $review );
	}

	private function get_create_item_schema(): array {
		return [
			'post_id'      => [
				'required'          => true,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'minimum'           => 1,
			],
			'reviewer_id'  => [
				'required'          => false,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
				'minimum'           => 0,
				'default'           => 0,
			],
			'invite_email' => [
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_email',
				'default'           => '',
			],
		];
	}

	public function search_users( \WP_REST_Request $request ): \WP_REST_Response {
		$q = trim( (string) $request->get_param( 'q' ) );

		if ( strlen( $q ) < 2 ) {
			return rest_ensure_response( [] );
		}

		$users = get_users(
			[
				'search'         => '*' . $q . '*',
				'search_columns' => [ 'user_login', 'display_name' ],
				'number'         => 20,
				'fields'         => [ 'ID', 'display_name' ],
			]
		);

		$data = array_map(
			static function ( $u ) {
				return [
					'id'         => (int) $u->ID,
					'name'       => $u->display_name,
					'avatar_url' => get_avatar_url( (int) $u->ID, [ 'size' => 32 ] ),
				];
			},
			$users
		);

		return rest_ensure_response( array_values( $data ) );
	}

	public function search_users_permissions_check( \WP_REST_Request $request ) {
		if ( ! is_user_logged_in() ) {
			return new \WP_Error( 'rest_forbidden', __( 'You must be logged in.', 'jumplinks-editorial-workflow' ), [ 'status' => 401 ] );
		}
		if ( ! current_user_can( 'flow_review_posts' ) && ! current_user_can( 'flow_assign_reviewer' ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'Insufficient permissions.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
		}
		return true;
	}

	public function list_reviews( \WP_REST_Request $request ): \WP_REST_Response {
		$current_user_id = get_current_user_id();
		$args            = [
			'status'       => (string) $request->get_param( 'status' ),
			'reviewer_id'  => (int) $request->get_param( 'reviewer_id' ),
			'requester_id' => (int) $request->get_param( 'requester_id' ),
			'post_type'    => (string) $request->get_param( 'post_type' ),
			'per_page'     => (int) $request->get_param( 'per_page' ),
			'page'         => (int) $request->get_param( 'page' ),
		];

		$assigned_to = (string) $request->get_param( 'assigned_to' );
		if ( 'me' === $assigned_to ) {
			$args['reviewer_id'] = $current_user_id;
		}

		if ( ! current_user_can( 'flow_manage_reviews' ) ) {
			$args['participant_user_id'] = $current_user_id;
		}

		$reviews = DB::get_reviews( $args );
		$total   = DB::count_reviews( $args );

		$per_page    = max( 1, min( 100, $args['per_page'] ?: 20 ) );
		$total_pages = (int) ceil( $total / $per_page );

		$data = array_map( [ $this, 'prepare_review' ], $reviews );

		$response = rest_ensure_response( $data );
		$response->header( 'X-WP-Total', (string) $total );
		$response->header( 'X-WP-TotalPages', (string) $total_pages );

		return $response;
	}

	public function list_reviews_permissions_check( \WP_REST_Request $request ) {
		if ( ! is_user_logged_in() ) {
			return new \WP_Error( 'rest_forbidden', __( 'You must be logged in.', 'jumplinks-editorial-workflow' ), [ 'status' => 401 ] );
		}
		if ( ! current_user_can( 'flow_review_posts' ) && ! current_user_can( 'flow_manage_reviews' ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'Insufficient permissions.', 'jumplinks-editorial-workflow' ), [ 'status' => 403 ] );
		}
		return true;
	}

	public function get_activity( \WP_REST_Request $request ): \WP_REST_Response {
		$per_page            = max( 1, min( 100, (int) $request->get_param( 'per_page' ) ) );
		$participant_user_id = current_user_can( 'flow_manage_reviews' ) ? 0 : get_current_user_id();
		$reviews             = DB::get_recent_activity( $per_page, $participant_user_id );
		$data                = array_map( [ $this, 'prepare_review' ], $reviews );

		return rest_ensure_response( $data );
	}
}
