<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Ability_Context {

	/**
	 * @return array<string,mixed>
	 */
	public static function serialize_comment( object $comment ): array {
		$parent_id   = (int) ( $comment->parent_id ?? 0 );
		$html        = (string) ( $comment->comment_text ?? '' );
		$anchor      = trim( (string) ( $comment->anchor_text ?? '' ) );
		$raw_anchor  = (string) ( $comment->block_client_id ?? '' );
		$author_id   = (int) ( $comment->author_id ?? 0 );
		$author_name = trim( (string) ( $comment->author_name ?? '' ) );

		if ( $author_id > 0 ) {
			$user = get_userdata( $author_id );
			if ( $user ) {
				$author_name = (string) $user->display_name;
			}
		}
		if ( '' === $author_name ) {
			$author_name = __( 'Reviewer', 'jumplinks-editorial-workflow' );
		}

		$kind = 'general';
		if ( $parent_id > 0 ) {
			$kind = 'reply';
		} elseif ( '' !== $anchor ) {
			$kind = 'inline';
		}

		$location = self::location_from_descriptor( $raw_anchor );
		if ( '' !== $anchor && '' === $location['text'] ) {
			$location['text'] = $anchor;
		}

		return [
			'id'            => (int) $comment->id,
			'parent_id'     => $parent_id,
			'kind'          => $kind,
			'html'          => $html,
			'text'          => self::plain_text( $html ),
			'is_resolved'   => ! empty( $comment->is_resolved ),
			'author'        => $author_name,
			'author_id'     => $author_id,
			'date'          => (string) ( $comment->created_at ?? '' ),
			'selected_text' => $anchor,
			'location'      => $location,
		];
	}

	/**
	 * @return array{text:string,type:string,src:string,rootType:string}
	 */
	public static function location_from_descriptor( string $raw ): array {
		$empty = [
			'text'     => '',
			'type'     => '',
			'src'      => '',
			'rootType' => '',
		];
		if ( '' === $raw ) {
			return $empty;
		}
		$decoded = json_decode( $raw, true );
		if ( ! is_array( $decoded ) ) {
			return $empty;
		}

		return [
			'text'     => isset( $decoded['text'] ) ? (string) $decoded['text'] : '',
			'type'     => isset( $decoded['type'] ) ? (string) $decoded['type'] : '',
			'src'      => isset( $decoded['src'] ) ? (string) $decoded['src'] : '',
			'rootType' => isset( $decoded['rootType'] ) ? (string) $decoded['rootType'] : '',
		];
	}

	public static function next_action( ?object $review, bool $can_publish ): string {
		if ( ! $review ) {
			return 'assign_reviewer';
		}
		$status = (string) $review->status;
		if ( Review::STATUS_PENDING === $status ) {
			return 'send_for_review';
		}
		if ( Review::STATUS_CHANGES_REQUESTED === $status ) {
			return 'apply_comments_then_resubmit';
		}
		if ( Review::STATUS_APPROVED === $status ) {
			return $can_publish ? 'publish' : 'wait_for_human';
		}
		return 'wait_for_human';
	}

	/**
	 * @return array<string,mixed>
	 */
	public static function list_comments_payload( object $review, bool $unresolved_only ): array {
		$rows = DB::get_comments_for_post( (int) $review->post_id, (int) $review->id );
		$all  = array_map( [ self::class, 'serialize_comment' ], $rows );

		usort(
			$all,
			static function ( array $a, array $b ): int {
				$ar = ! empty( $a['is_resolved'] ) ? 1 : 0;
				$br = ! empty( $b['is_resolved'] ) ? 1 : 0;
				if ( $ar !== $br ) {
					return $ar <=> $br;
				}
				return ( (int) $a['id'] ) <=> ( (int) $b['id'] );
			}
		);

		$unresolved_inline  = [];
		$unresolved_general = [];
		foreach ( $all as $item ) {
			if ( ! empty( $item['is_resolved'] ) ) {
				continue;
			}
			if ( 'inline' === $item['kind'] ) {
				$unresolved_inline[] = $item;
			} elseif ( 'general' === $item['kind'] ) {
				$unresolved_general[] = $item;
			}
		}

		$comments = $unresolved_only
			? array_values(
				array_filter(
					$all,
					static function ( array $item ): bool {
						return empty( $item['is_resolved'] );
					}
				)
			)
			: $all;

		return [
			'review_id'          => (int) $review->id,
			'post_id'            => (int) $review->post_id,
			'comments'           => $comments,
			'unresolved_inline'  => $unresolved_inline,
			'unresolved_general' => $unresolved_general,
		];
	}

	/**
	 * @return array<string,mixed>|\WP_Error
	 */
	public static function get_review( int $post_id ) {
		$denied = self::deny_unless_can_view_post( $post_id );
		if ( $denied ) {
			return $denied;
		}

		$post_type = $post_id > 0 ? get_post_type( $post_id ) : '';
		if ( ! $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return new \WP_Error(
				'flow_ew_unsupported',
				__( 'Reviews are not enabled for this content type.', 'jumplinks-editorial-workflow' )
			);
		}

		$review = DB::get_active_review( $post_id );
		$gate   = Publish_Guard::describe_publish_gate( $post_id );
		$post   = get_post( $post_id );

		$payload = [
			'post_id'            => $post_id,
			'post_status'        => $post instanceof \WP_Post ? (string) $post->post_status : (string) get_post_status( $post_id ),
			'post_title'         => $post instanceof \WP_Post ? (string) $post->post_title : '',
			'review_mandatory'   => $gate['review_mandatory'],
			'can_publish'        => $gate['can_publish'],
			'block_reason'       => $gate['block_reason'],
			'status'             => $gate['status'],
			'next_action'        => self::next_action( $review, $gate['can_publish'] ),
			'review'             => null,
			'comments'           => [],
			'unresolved_inline'  => [],
			'unresolved_general' => [],
		];

		if ( $review ) {
			$payload['review']             = Review::prepare_response_payload( $review );
			$comments                      = self::list_comments_payload( $review, false );
			$payload['comments']           = $comments['comments'];
			$payload['unresolved_inline']  = $comments['unresolved_inline'];
			$payload['unresolved_general'] = $comments['unresolved_general'];
		}

		return $payload;
	}

	/**
	 * @return array<string,mixed>|\WP_Error
	 */
	public static function list_reviewers( string $query = '' ) {
		if ( ! current_user_can( 'flow_assign_reviewer' ) ) {
			return new \WP_Error(
				'flow_ew_forbidden',
				__( 'You do not have permission to view reviewers.', 'jumplinks-editorial-workflow' )
			);
		}

		$needle = strtolower( trim( $query ) );
		$roles  = Settings::get_reviewer_roles();
		$items  = [];

		if ( ! empty( $roles ) ) {
			$users = get_users(
				[
					'role__in' => $roles,
					'exclude'  => [ get_current_user_id() ],
					'fields'   => [ 'ID', 'display_name' ],
					'number'   => 200,
				]
			);
			foreach ( $users as $user ) {
				$name = (string) $user->display_name;
				if ( '' !== $needle && false === strpos( strtolower( $name ), $needle ) ) {
					continue;
				}
				$items[] = [
					'id'       => (int) $user->ID,
					'name'     => $name,
					'is_email' => false,
				];
			}
		}

		return [
			'reviewers' => $items,
		];
	}

	/**
	 * @return array<string,mixed>|\WP_Error
	 */
	public static function assign_reviewer( int $post_id, int $reviewer_id, string $invite_email = '' ) {
		if ( ! current_user_can( 'flow_assign_reviewer' ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return new \WP_Error(
				'flow_ew_forbidden',
				__( 'You do not have permission to assign reviewers.', 'jumplinks-editorial-workflow' )
			);
		}

		$user_id = get_current_user_id();
		try {
			$invite = trim( $invite_email );
			if ( '' !== $invite ) {
				$email = sanitize_email( $invite );
				if ( '' === $email || ! is_email( $email ) ) {
					return new \WP_Error(
						'flow_ew_invalid_email',
						__( 'Please enter a valid email address.', 'jumplinks-editorial-workflow' )
					);
				}
				$review_id = Email_Review::assign_invite( $post_id, $email, $user_id );
			} else {
				$review_id = Review::request( $post_id, $reviewer_id, $user_id );
				if ( $reviewer_id > 0 ) {
					Email_Review_Invites_DB::delete_for_review( $review_id );
				}
			}
		} catch ( \InvalidArgumentException $e ) {
			return new \WP_Error( 'flow_ew_error', $e->getMessage() );
		} catch ( \RuntimeException $e ) {
			return new \WP_Error( 'flow_ew_error', $e->getMessage() );
		}

		return self::get_review( $post_id );
	}

	/**
	 * @return array<string,mixed>|\WP_Error
	 */
	public static function send_for_review( int $review_id = 0, int $post_id = 0 ) {
		$review = self::resolve_review( $review_id, $post_id );
		if ( $review instanceof \WP_Error ) {
			return $review;
		}

		try {
			Review::send_for_review( (int) $review->id, get_current_user_id() );
		} catch ( \InvalidArgumentException $e ) {
			return new \WP_Error( 'flow_ew_error', $e->getMessage() );
		} catch ( \RuntimeException $e ) {
			return new \WP_Error( 'flow_ew_error', $e->getMessage() );
		}

		return self::get_review( (int) $review->post_id );
	}

	/**
	 * @return array<string,mixed>|\WP_Error
	 */
	public static function resubmit_review( int $review_id = 0, int $post_id = 0 ) {
		$review = self::resolve_review( $review_id, $post_id );
		if ( $review instanceof \WP_Error ) {
			return $review;
		}

		try {
			Review::resubmit( (int) $review->id, get_current_user_id() );
		} catch ( \InvalidArgumentException $e ) {
			return new \WP_Error( 'flow_ew_error', $e->getMessage() );
		} catch ( \RuntimeException $e ) {
			return new \WP_Error( 'flow_ew_error', $e->getMessage() );
		}

		return self::get_review( (int) $review->post_id );
	}

	/**
	 * @return array<string,mixed>|\WP_Error
	 */
	public static function list_comments( int $review_id = 0, int $post_id = 0, bool $unresolved_only = false ) {
		$review = self::resolve_review( $review_id, $post_id );
		if ( $review instanceof \WP_Error ) {
			return $review;
		}
		$denied = self::deny_unless_can_access_review( $review );
		if ( $denied ) {
			return $denied;
		}

		return self::list_comments_payload( $review, $unresolved_only );
	}

	/**
	 * @return array<string,mixed>|\WP_Error
	 */
	public static function resolve_comment( int $comment_id ) {
		$comment = DB::get_comment( $comment_id );
		if ( ! $comment ) {
			return new \WP_Error(
				'flow_ew_not_found',
				__( 'Comment not found.', 'jumplinks-editorial-workflow' )
			);
		}
		$review = DB::get_review( (int) $comment->review_id );
		if ( ! $review ) {
			return new \WP_Error(
				'flow_ew_not_found',
				__( 'Review not found.', 'jumplinks-editorial-workflow' )
			);
		}
		$denied = self::deny_unless_can_access_review( $review );
		if ( $denied ) {
			return $denied;
		}

		if ( ! DB::update_comment( $comment_id, [ 'is_resolved' => 1 ] ) ) {
			return new \WP_Error(
				'flow_ew_error',
				__( 'Failed to update comment.', 'jumplinks-editorial-workflow' )
			);
		}

		do_action( 'flow_ew_comment_resolved', $comment_id, (int) $comment->review_id, (int) $comment->post_id, get_current_user_id() );

		$updated = DB::get_comment( $comment_id );
		return [
			'comment' => self::serialize_comment( $updated ? $updated : $comment ),
		];
	}

	/**
	 * @return object|\WP_Error
	 */
	private static function resolve_review( int $review_id, int $post_id ) {
		$review = null;
		if ( $review_id > 0 ) {
			$review = DB::get_review( $review_id );
		} elseif ( $post_id > 0 ) {
			$review = DB::get_active_review( $post_id );
		}
		if ( ! $review ) {
			return new \WP_Error(
				'flow_ew_not_found',
				__( 'Review not found.', 'jumplinks-editorial-workflow' )
			);
		}
		return $review;
	}

	/**
	 * @return \WP_Error|null
	 */
	private static function deny_unless_can_view_post( int $post_id ) {
		if ( $post_id <= 0 ) {
			return new \WP_Error(
				'flow_ew_invalid',
				__( 'Invalid post ID.', 'jumplinks-editorial-workflow' )
			);
		}
		if ( ! is_user_logged_in() ) {
			return new \WP_Error(
				'flow_ew_forbidden',
				__( 'You must be logged in.', 'jumplinks-editorial-workflow' )
			);
		}
		if ( current_user_can( 'flow_manage_reviews' ) || current_user_can( 'edit_post', $post_id ) ) {
			return null;
		}
		$review = DB::get_active_review( $post_id );
		if ( $review && Review::can_user_access_review( $review, get_current_user_id() ) ) {
			return null;
		}
		return new \WP_Error(
			'flow_ew_forbidden',
			__( 'You do not have permission to view this review.', 'jumplinks-editorial-workflow' )
		);
	}

	/**
	 * @return \WP_Error|null
	 */
	private static function deny_unless_can_access_review( object $review ) {
		if ( ! is_user_logged_in() ) {
			return new \WP_Error(
				'flow_ew_forbidden',
				__( 'You must be logged in.', 'jumplinks-editorial-workflow' )
			);
		}
		if ( Review::can_user_access_review( $review, get_current_user_id() ) ) {
			return null;
		}
		if ( current_user_can( 'edit_post', (int) $review->post_id ) ) {
			return null;
		}
		return new \WP_Error(
			'flow_ew_forbidden',
			__( 'You are not a participant in this review.', 'jumplinks-editorial-workflow' )
		);
	}

	private static function plain_text( string $html ): string {
		return trim( wp_strip_all_tags( $html ) );
	}
}
