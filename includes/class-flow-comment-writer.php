<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The one place a review comment is written.
 *
 * Extracted from the REST controller so the agent layer can post a comment
 * without re-implementing sanitising, the parent check, thread flattening and
 * the add-on filters — and so the two callers cannot drift.
 *
 * Identity is resolved by the caller: REST derives it from the session or the
 * invite cookie, the agent layer from the configured author. This class never
 * reads the current user.
 */
final class Comment_Writer {

	/** Sanitised output can outgrow the column; the row is TEXT. */
	const MAX_STORED_BYTES = 65535;

	/**
	 * @param object               $review  Review row the comment belongs to.
	 * @param array<string,mixed>  $args    html, author_id, author_name, author_email,
	 *                                      parent_id, anchor_text, block_client_id,
	 *                                      is_agent, request.
	 * @return int|\WP_Error New comment id.
	 */
	public static function create( object $review, array $args ) {
		$review_id = (int) $review->id;
		$request   = $args['request'] ?? null;
		$author_id = (int) ( $args['author_id'] ?? 0 );

		$html = Comment_Html::sanitize( (string) ( $args['html'] ?? '' ) );
		$html = (string) \apply_filters(
			'flow_ew_filter_comment_html',
			$html,
			[
				'review'  => $review,
				'request' => $request,
				'is_edit' => false,
			]
		);
		if ( strlen( $html ) > self::MAX_STORED_BYTES ) {
			return new \WP_Error(
				'rest_invalid_param',
				__( 'This comment is too long.', 'jumplinks-editorial-workflow' ),
				[ 'status' => 400 ]
			);
		}

		$parent    = null;
		$parent_id = (int) ( $args['parent_id'] ?? 0 );
		if ( $parent_id > 0 ) {
			$parent = DB::get_comment( $parent_id );
			if ( ! $parent || (int) $parent->review_id !== $review_id ) {
				return new \WP_Error(
					'flow_ew_invalid_parent',
					__( 'The parent comment does not belong to this review.', 'jumplinks-editorial-workflow' ),
					[ 'status' => 400 ]
				);
			}
		}

		$author_name  = (string) ( $args['author_name'] ?? '' );
		$author_email = (string) ( $args['author_email'] ?? '' );

		$reject = (string) \apply_filters(
			'flow_ew_pre_create_comment_error',
			'',
			[
				'review'       => $review,
				'user_id'      => $author_id,
				'html'         => $html,
				'author_name'  => $author_name,
				'author_email' => $author_email,
				'request'      => $request,
			]
		);
		if ( '' !== $reject ) {
			return new \WP_Error( 'flow_ew_comment_rejected', $reject, [ 'status' => 422 ] );
		}

		$insert_data = [
			'review_id'    => $review_id,
			'post_id'      => (int) $review->post_id,
			'comment_text' => $html,
			'author_id'    => $author_id,
		];

		if ( 0 === $author_id ) {
			$insert_data['author_name']  = $author_name;
			$insert_data['author_email'] = $author_email;
		}

		$anchor_text = (string) ( $args['anchor_text'] ?? '' );
		if ( '' !== $anchor_text ) {
			$insert_data['anchor_text'] = $anchor_text;
		}
		$block_client_id = (string) ( $args['block_client_id'] ?? '' );
		if ( '' !== $block_client_id ) {
			$insert_data['block_client_id'] = $block_client_id;
		}

		if ( ! empty( $args['is_agent'] ) ) {
			$insert_data['is_agent'] = 1;
		}

		// Replies to a reply re-parent onto the thread root: threads stay one deep.
		if ( $parent ) {
			$insert_data['parent_id'] = (int) $parent->parent_id > 0
				? (int) $parent->parent_id
				: $parent_id;
		}

		$comment_id = DB::insert_comment( $insert_data );
		if ( ! $comment_id ) {
			return new \WP_Error(
				'flow_ew_error',
				__( 'Failed to save comment.', 'jumplinks-editorial-workflow' ),
				[ 'status' => 500 ]
			);
		}

		\do_action( 'flow_ew_comment_created', $comment_id, $review_id, (int) $review->post_id, $author_id );

		return (int) $comment_id;
	}
}
