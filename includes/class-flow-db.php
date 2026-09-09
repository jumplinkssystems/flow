<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DB {

	public static function reviews_table(): string {
		global $wpdb;
		return $wpdb->prefix . 'flow_reviews';
	}

	public static function comments_table(): string {
		global $wpdb;
		return $wpdb->prefix . 'flow_review_comments';
	}

	public static function get_active_review( int $post_id ) {
		global $wpdb;
		$table = esc_sql( self::reviews_table() );
		return $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE post_id = %d ORDER BY updated_at DESC, id DESC LIMIT 1", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table from plugin prefix + literal name.
				$post_id
			)
		);
	}

	/**
	 * Posts whose most recent review is open (`is_open=1`) and has no
	 * reviewer assigned (`reviewer_id=0`). Drives the "Open Review" filter
	 * option in the post-list, which is a virtual status (no DB column).
	 *
	 * @return int[]
	 */
	public static function get_post_ids_with_open_review_no_reviewer(): array {
		global $wpdb;
		$table = esc_sql( self::reviews_table() );
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table literal.
		$sql  = "SELECT r1.post_id FROM {$table} r1
			WHERE r1.is_open = 1
			AND r1.reviewer_id = 0
			AND r1.id = (
				SELECT id FROM {$table} r2
				WHERE r2.post_id = r1.post_id
				ORDER BY r2.updated_at DESC, r2.id DESC
				LIMIT 1
			)";
		$rows = $wpdb->get_col( $sql ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.NotPrepared
		return array_map( 'intval', (array) $rows );
	}

	/**
	 * Returns post IDs whose most recent (active) review is in any of the
	 * given statuses. Drives the post-list "Review status" filter.
	 *
	 * @param string[] $statuses
	 * @return int[]
	 */
	public static function get_post_ids_by_active_status( array $statuses ): array {
		if ( empty( $statuses ) ) {
			return [];
		}
		global $wpdb;
		$table        = esc_sql( self::reviews_table() );
		$placeholders = implode( ',', array_fill( 0, count( $statuses ), '%s' ) );
		// Correlated subquery picks the most recent review per post; outer
		// WHERE filters that "active" review by status.
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table literal; placeholders are %s.
		$sql  = "SELECT r1.post_id FROM {$table} r1
			WHERE r1.status IN ({$placeholders})
			AND r1.id = (
				SELECT id FROM {$table} r2
				WHERE r2.post_id = r1.post_id
				ORDER BY r2.updated_at DESC, r2.id DESC
				LIMIT 1
			)";
		$rows = $wpdb->get_col( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare( $sql, $statuses ) // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		);
		return array_map( 'intval', (array) $rows );
	}

	public static function get_review( int $id ) {
		global $wpdb;
		$table = esc_sql( self::reviews_table() );
		return $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE id = %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table from plugin prefix + literal name.
				$id
			)
		);
	}

	public static function get_review_by_revision_id( int $revision_id ) {
		global $wpdb;
		$table = esc_sql( self::reviews_table() );
		return $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE revision_id = %d ORDER BY id DESC LIMIT 1", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table from plugin prefix + literal name.
				$revision_id
			)
		);
	}

	public static function insert_review( array $data ) {
		global $wpdb;
		$now = current_time( 'mysql', true );
		$wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			self::reviews_table(),
			array_merge(
				[
					'status'     => Review::STATUS_PENDING,
					'iteration'  => 1,
					'created_at' => $now,
					'updated_at' => $now,
					'is_open'    => 0,
				],
				$data
			),
			[ '%s', '%d', '%s', '%s', '%d', '%d', '%d', '%d' ]
		);
		return ( 0 !== $wpdb->insert_id ) ? $wpdb->insert_id : false;
	}

	public static function delete_review( int $id ): bool {
		global $wpdb;
		$result = $wpdb->delete( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			self::reviews_table(),
			[ 'id' => $id ],
			[ '%d' ]
		);
		return false !== $result;
	}

	/**
	 * Cascade delete: every review row tied to the given post, plus all of
	 * its review-comment rows. Hooked from `before_delete_post` so orphan
	 * rows don't accumulate when posts are permanently deleted (the trash
	 * state still keeps reviews intact — only force-delete cleans up).
	 *
	 * @return int Number of review rows deleted.
	 */
	public static function delete_reviews_for_post( int $post_id ): int {
		if ( $post_id <= 0 ) {
			return 0;
		}
		global $wpdb;
		$reviews_table  = self::reviews_table();
		$comments_table = self::comments_table();

		// Comments first so we don't leave dangling rows pointing at deleted reviews.
		$wpdb->delete( $comments_table, [ 'post_id' => $post_id ], [ '%d' ] ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$count = (int) $wpdb->delete( $reviews_table, [ 'post_id' => $post_id ], [ '%d' ] ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		return $count;
	}

	public static function update_review( int $id, array $data ): bool {
		global $wpdb;
		$data['updated_at'] = current_time( 'mysql', true );
		$result             = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			self::reviews_table(),
			$data,
			[ 'id' => $id ]
		);
		return false !== $result;
	}

	public static function get_comments_for_post( int $post_id, ?int $review_id = null ): array {
		global $wpdb;
		$comments_table = esc_sql( self::comments_table() );
		if ( null !== $review_id ) {
			$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$wpdb->prepare(
					"SELECT * FROM {$comments_table} WHERE post_id = %d AND review_id = %d ORDER BY created_at ASC", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table from plugin prefix + literal name.
					$post_id,
					$review_id
				)
			);
			return ( false !== $rows ) ? $rows : [];
		}
		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT * FROM {$comments_table} WHERE post_id = %d ORDER BY created_at ASC", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table from plugin prefix + literal name.
				$post_id
			)
		);
		return ( false !== $rows ) ? $rows : [];
	}

	public static function get_comment( int $id ) {
		global $wpdb;
		$table = esc_sql( self::comments_table() );
		return $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE id = %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table from plugin prefix + literal name.
				$id
			)
		);
	}

	public static function insert_comment( array $data ) {
		global $wpdb;
		$now = current_time( 'mysql', true );
		$row = array_merge(
			[
				'is_resolved' => 0,
				'parent_id'   => null,
				'created_at'  => $now,
				'updated_at'  => $now,
			],
			$data
		);

		$format_map = [
			'id'              => '%d',
			'review_id'       => '%d',
			'post_id'         => '%d',
			'block_client_id' => '%s',
			'anchor_text'     => '%s',
			'comment_text'    => '%s',
			'author_id'       => '%d',
			'author_name'     => '%s',
			'author_email'    => '%s',
			'parent_id'       => '%d',
			'is_resolved'     => '%d',
			'created_at'      => '%s',
			'updated_at'      => '%s',
		];
		$format     = [];
		foreach ( array_keys( $row ) as $col ) {
			$format[] = $format_map[ $col ] ?? '%s';
		}

		$wpdb->insert( self::comments_table(), $row, $format ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		return ( 0 !== $wpdb->insert_id ) ? $wpdb->insert_id : false;
	}

	public static function update_comment( int $id, array $data ): bool {
		global $wpdb;
		$data['updated_at'] = current_time( 'mysql', true );
		$result             = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			self::comments_table(),
			$data,
			[ 'id' => $id ]
		);
		return false !== $result;
	}

	public static function delete_comment( int $id ): bool {
		global $wpdb;
		$result = $wpdb->delete( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			self::comments_table(),
			[ 'id' => $id ],
			[ '%d' ]
		);
		return false !== $result;
	}

	/**
	 * Paginated, filterable review query.
	 *
	 * @param array $args {
	 *     @type int       $reviewer_id         Filter by reviewer.
	 *     @type int       $requester_id        Filter by requester.
	 *     @type int       $participant_user_id Restrict to reviews where the given user is reviewer or requester. 0 disables the scope.
	 *     @type string    $status              Filter by status.
	 *     @type string    $post_type           Filter by post type (requires JOIN on posts table).
	 *     @type bool|null $is_open             Filter on the `is_open` flag (null = no filter).
	 *     @type bool      $unassigned          When true, restrict to reviews with no reviewer assigned.
	 *     @type int       $per_page            Results per page (default 20).
	 *     @type int       $page                Page number (1-indexed, default 1).
	 *     @type string    $orderby             Column to order by (default 'updated_at').
	 *     @type string    $order               ASC or DESC (default 'DESC').
	 * }
	 * @return array
	 */
	public static function get_reviews( array $args = [] ): array {
		global $wpdb;

		$defaults = [
			'reviewer_id'         => 0,
			'requester_id'        => 0,
			'participant_user_id' => 0,
			'status'              => '',
			'post_type'           => '',
			'per_page'            => 20,
			'page'                => 1,
			'orderby'             => 'updated_at',
			'order'               => 'DESC',
		];
		$args     = wp_parse_args( $args, $defaults );
		$table    = esc_sql( self::reviews_table() );

		$allowed_orderby = [
			'id'         => 'r.id',
			'created_at' => 'r.created_at',
			'updated_at' => 'r.updated_at',
			'status'     => 'r.status',
		];
		$orderby_key     = array_key_exists( (string) $args['orderby'], $allowed_orderby ) ? (string) $args['orderby'] : 'updated_at';
		$orderby_sql     = $allowed_orderby[ $orderby_key ];
		$order           = 'ASC' === strtoupper( (string) $args['order'] ) ? 'ASC' : 'DESC';
		$per_page        = max( 1, min( 100, (int) $args['per_page'] ) );
		$offset          = max( 0, ( (int) $args['page'] - 1 ) ) * $per_page;

		[ $where_clause, $join_clause ] = self::build_where_and_join( $args );

		$limit_clause = $wpdb->prepare( ' LIMIT %d OFFSET %d', $per_page, $offset );
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- $orderby_sql from allowlist; $limit_clause from prepare(); $where_clause from prepare() fragments; $join_clause is either '' or a fixed-shape literal whose only dynamic part is esc_sql($wpdb->posts).
		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			"SELECT r.* FROM {$table} r{$join_clause} WHERE {$where_clause} ORDER BY {$orderby_sql} {$order}{$limit_clause}"
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		return ( false !== $rows ) ? $rows : [];
	}

	/**
	 * Count reviews matching the same filters as get_reviews().
	 *
	 * @param array $args Same keys as get_reviews() (pagination keys are ignored).
	 */
	public static function count_reviews( array $args = [] ): int {
		global $wpdb;
		$table = esc_sql( self::reviews_table() );

		[ $where_clause, $join_clause ] = self::build_where_and_join( $args );

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter -- $where_clause from prepare() fragments; $table is esc_sql()'d; $join_clause is either '' or a fixed-shape literal whose only dynamic part is esc_sql($wpdb->posts).
		$count = (int) $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			"SELECT COUNT(*) FROM {$table} r{$join_clause} WHERE {$where_clause}"
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter

		return $count;
	}

	/**
	 * Build the shared WHERE clause + JOIN clause for review queries. All
	 * filter args are interpreted leniently: missing or empty values mean
	 * "don't filter on this column."
	 *
	 * @param array $args Raw args; same keys as get_reviews / count_reviews.
	 * @return array{0:string,1:string} [where_clause, join_clause].
	 */
	private static function build_where_and_join( array $args ): array {
		global $wpdb;
		$where = [ '1=1' ];

		$reviewer_id  = (int) ( $args['reviewer_id'] ?? 0 );
		$requester_id = (int) ( $args['requester_id'] ?? 0 );
		$participant  = (int) ( $args['participant_user_id'] ?? 0 );
		$status       = (string) ( $args['status'] ?? '' );
		$post_type    = (string) ( $args['post_type'] ?? '' );
		$is_open      = $args['is_open'] ?? null;
		$is_public    = $args['is_public'] ?? null;
		$unassigned   = ! empty( $args['unassigned'] );

		if ( $reviewer_id > 0 ) {
			$where[] = $wpdb->prepare( 'r.reviewer_id = %d', $reviewer_id );
		}
		if ( $requester_id > 0 ) {
			$where[] = $wpdb->prepare( 'r.requester_id = %d', $requester_id );
		}
		if ( $participant > 0 ) {
			$extra_ids = (array) \apply_filters( 'flow_ew_participant_review_ids', [], $participant );
			$extra_ids = array_values(
				array_unique(
					array_filter(
						array_map( 'intval', $extra_ids ),
						static function ( $id ) {
							return $id > 0;
						}
					)
				)
			);
			if ( ! empty( $extra_ids ) ) {
				$placeholders = implode( ',', array_fill( 0, count( $extra_ids ), '%d' ) );
				$where[]      = $wpdb->prepare( // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
					"(r.reviewer_id = %d OR r.requester_id = %d OR r.id IN ({$placeholders}))", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- placeholders generated above.
					array_merge( [ $participant, $participant ], $extra_ids )
				);
			} else {
				$where[] = $wpdb->prepare( '(r.reviewer_id = %d OR r.requester_id = %d)', $participant, $participant );
			}
		}
		if ( '' !== $status ) {
			$where[] = $wpdb->prepare( 'r.status = %s', $status );
		}
		if ( null !== $is_open ) {
			$where[] = $wpdb->prepare( 'r.is_open = %d', $is_open ? 1 : 0 );
		}
		if ( null !== $is_public ) {
			$where[] = $wpdb->prepare( 'r.is_public = %d', $is_public ? 1 : 0 );
		}
		if ( $unassigned ) {
			$where[] = 'r.reviewer_id = 0';
		}

		$join = '';
		if ( '' !== $post_type ) {
			$where[] = $wpdb->prepare( 'p.post_type = %s', $post_type );
			$join    = ' INNER JOIN ' . esc_sql( $wpdb->posts ) . ' p ON p.ID = r.post_id';
		}

		return [ implode( ' AND ', $where ), $join ];
	}

	/**
	 * Recent review activity ordered by updated_at.
	 *
	 * @param int $limit               Max rows to return.
	 * @param int $participant_user_id When > 0, restrict to reviews where the user is reviewer or requester.
	 * @return array
	 */
	public static function get_recent_activity( int $limit = 20, int $participant_user_id = 0 ): array {
		global $wpdb;
		$limit = max( 1, min( 100, $limit ) );
		$table = esc_sql( self::reviews_table() );

		if ( $participant_user_id > 0 ) {
			$extra_ids = (array) \apply_filters( 'flow_ew_participant_review_ids', [], $participant_user_id );
			$extra_ids = array_values(
				array_unique(
					array_filter(
						array_map( 'intval', $extra_ids ),
						static function ( $id ) {
							return $id > 0;
						}
					)
				)
			);
			if ( ! empty( $extra_ids ) ) {
				$placeholders = implode( ',', array_fill( 0, count( $extra_ids ), '%d' ) );
				$rows         = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
					$wpdb->prepare( // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQLPlaceholders.ReplacementsWrongNumber
						"SELECT * FROM {$table} WHERE reviewer_id = %d OR requester_id = %d OR id IN ({$placeholders}) ORDER BY updated_at DESC LIMIT %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table + placeholders generated locally.
						array_merge(
							[ $participant_user_id, $participant_user_id ],
							$extra_ids,
							[ $limit ]
						)
					)
				);
			} else {
				$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
					$wpdb->prepare(
						"SELECT * FROM {$table} WHERE reviewer_id = %d OR requester_id = %d ORDER BY updated_at DESC LIMIT %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
						$participant_user_id,
						$participant_user_id,
						$limit
					)
				);
			}
		} else {
			$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$wpdb->prepare(
					"SELECT * FROM {$table} ORDER BY updated_at DESC LIMIT %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table from plugin prefix + literal name.
					$limit
				)
			);
		}

		return ( false !== $rows ) ? $rows : [];
	}
}
