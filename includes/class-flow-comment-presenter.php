<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The one shape a review comment takes on the wire: the review page
 * bootstrap, the REST create response, and anything else that lists comments.
 */
final class Comment_Presenter {

	/**
	 * Split a mapped comment list the way the review page renders it: a
	 * comment is inline when it carries an anchor, and its replies follow it
	 * into the inline bucket.
	 *
	 * @param array<int,array<string,mixed>> $all
	 * @return array{0:array<int,array<string,mixed>>,1:array<int,array<string,mixed>>} [general, inline]
	 */
	public static function split( array $all ): array {
		$inline_parent_ids = [];
		$inline            = [];
		foreach ( $all as $c ) {
			if ( ! empty( $c['anchorText'] ) && 0 === $c['parentId'] ) {
				$inline_parent_ids[ $c['id'] ] = true;
				$inline[]                      = $c;
			}
		}
		$general = [];
		foreach ( $all as $c ) {
			if ( isset( $inline_parent_ids[ $c['id'] ] ) ) {
				continue;
			}
			if ( $c['parentId'] > 0 && isset( $inline_parent_ids[ $c['parentId'] ] ) ) {
				$inline[] = $c;
			} else {
				$general[] = $c;
			}
		}
		return [ $general, $inline ];
	}

	/**
	 * Change token for a review's comments and its own row. Clients send the
	 * last one back and get `changed: false` when nothing moved.
	 *
	 * Two edits inside one second collapse into one token — DATETIME has no
	 * finer resolution — so the later edit surfaces on the next change.
	 *
	 * @param array{total:int,max_id:int,max_updated:string} $comment_state
	 */
	public static function version( array $comment_state, object $review ): string {
		// The post's own stamp: saving a draft mints a revision without
		// touching the review row, and reviewers still need to hear about it.
		$post = get_post( (int) $review->post_id );
		return sprintf(
			'%d.%d.%d-%d.%d.%s-%d',
			(int) $comment_state['total'],
			(int) $comment_state['max_id'],
			// strtotime( ' UTC' ) is "now", which made a review with no
			// comments report a change on every poll.
			'' !== (string) $comment_state['max_updated'] ? (int) strtotime( (string) $comment_state['max_updated'] . ' UTC' ) : 0,
			(int) strtotime( (string) ( $review->updated_at ?? '' ) . ' UTC' ),
			(int) ( $review->iteration ?? 1 ),
			(string) ( $review->status ?? '' ),
			$post instanceof \WP_Post ? (int) strtotime( (string) $post->post_modified_gmt . ' UTC' ) : 0
		);
	}

	/**
	 * Everything the review page needs about a review's comments: both lists
	 * in render order plus the token that says whether they moved.
	 *
	 * @return array{comments:array<int,array<string,mixed>>,inlineComments:array<int,array<string,mixed>>,commentsVersion:string}
	 */
	public static function list_for_review( object $review ): array {
		$rows = DB::get_comments_for_post( (int) $review->post_id, (int) $review->id );

		// to_array() resolves a user and an avatar per comment.
		$author_ids = [];
		foreach ( $rows as $row ) {
			$author_id = (int) ( $row->author_id ?? 0 );
			if ( $author_id > 0 ) {
				$author_ids[ $author_id ] = true;
			}
		}
		if ( [] !== $author_ids && function_exists( 'cache_users' ) ) {
			cache_users( array_keys( $author_ids ) );
		}

		[ $general, $inline ] = self::split( array_map( [ self::class, 'to_array' ], $rows ) );

		return [
			'comments'        => $general,
			'inlineComments'  => $inline,
			'commentsVersion' => self::version( self::state_from_rows( $rows ), $review ),
		];
	}

	/**
	 * Same parts `DB::get_comments_state()` reads, derived from rows already
	 * in hand so a request that lists comments needs no second query.
	 *
	 * @param object[] $rows
	 * @return array{total:int,max_id:int,max_updated:string}
	 */
	public static function state_from_rows( array $rows ): array {
		$max_id      = 0;
		$max_updated = '';
		foreach ( $rows as $row ) {
			$max_id      = max( $max_id, (int) ( $row->id ?? 0 ) );
			$updated     = (string) ( $row->updated_at ?? '' );
			$max_updated = $updated > $max_updated ? $updated : $max_updated;
		}
		return [
			'total'       => count( $rows ),
			'max_id'      => $max_id,
			'max_updated' => $max_updated,
		];
	}

	/**
	 * @param object $c Row from the comments table.
	 * @return array<string,mixed>
	 */
	public static function to_array( object $c ): array {
		$author_id    = (int) $c->author_id;
		$stored_name  = (string) ( $c->author_name ?? '' );
		$stored_email = (string) ( $c->author_email ?? '' );
		// Anonymous comments (author_id=0) use the stored name + email-derived
		// avatar; logged-in commenters use their user record.
		if ( $author_id > 0 ) {
			$user            = get_userdata( $author_id );
			$display_name    = $user ? $user->display_name : __( 'Reviewer', 'jumplinks-editorial-workflow' );
			$avatar_identity = $author_id;
		} else {
			$display_name    = '' !== $stored_name ? $stored_name : __( 'Anonymous', 'jumplinks-editorial-workflow' );
			$avatar_identity = '' !== $stored_email ? $stored_email : '';
		}
		$ts          = strtotime( (string) $c->created_at . ' UTC' );
		$anchor_text = $c->anchor_text ?? null;

		return [
			'id'            => (int) $c->id,
			'html'          => $c->comment_text,
			'author'        => $display_name,
			'authorId'      => $author_id,
			'avatarUrl'     => '' !== $avatar_identity
				? (string) ( get_avatar_url( $avatar_identity, [ 'size' => 56 ] ) ?: '' )
				: '',
			'parentId'      => (int) ( $c->parent_id ?? 0 ),
			'isAgent'       => Settings::should_mark_agent_comments() && ! empty( $c->is_agent ),
			'isResolved'    => (bool) ( $c->is_resolved ?? false ),
			'anchorText'    => $anchor_text ?: null,
			'blockClientId' => ( $c->block_client_id ?? null ) ?: null,
			'date'          => (string) wp_date(
				get_option( 'date_format' ) . ' ' . get_option( 'time_format' ),
				$ts ?: time()
			),
		];
	}
}
