<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Rows for the Flow Dashboard's Sent and Received tabs. Every source (per-post
 * reviews here, site reviews in Pro through `flow_ew_dashboard_rows`) returns
 * the same shape, so the page filters, counts and paginates without knowing
 * where a row came from.
 *
 * Each row has:
 *
 *     key        string   Unique across sources, e.g. 'post:12', 'site:4'.
 *     type       string   self::TYPE_*.
 *     bucket     string   self::BUCKET_*.
 *     updated_at string   UTC MySQL timestamp, newest first.
 *     people     callable(): (int|string)[]  WP user ids and `email:<address>` keys.
 *     item       callable( callable $person_url ): ?array  Dashboard_List_Renderer::item() data.
 *     source     object|null  Raw row, for cache priming.
 *
 * `people` and `item` are lazy: they cost user and revision lookups, so the
 * page only runs them for the rows it filters by person or shows.
 */
final class Dashboard_Rows {

	const TAB_SENT     = 'sent';
	const TAB_RECEIVED = 'received';

	const TYPE_PAGE = 'page';
	const TYPE_SITE = 'site';
	const TYPE_OPEN = 'open';

	const BUCKET_IN_REVIEW = 'in_review';
	const BUCKET_RESOLVED  = 'resolved';

	const BATCH = 100;

	/** @var array<int,array<int,int>> review_id => [ author_id => comment count ]. */
	private static array $comment_counts = [];

	/** @var array<int,array<string,int>> review_id => [ email => comment count ]. */
	private static array $guest_comment_counts = [];

	/**
	 * Comment counts for the rows about to be shown, one query for the whole
	 * visible page. Site-review rows are skipped: their `source->id` is a
	 * site review id, not a `flow_reviews` id the comments table knows about.
	 *
	 * @param array<int,array<string,mixed>> $rows
	 */
	public static function prime_comment_counts( array $rows ): void {
		$ids = [];
		foreach ( $rows as $row ) {
			if ( ! in_array( $row['type'] ?? '', [ self::TYPE_PAGE, self::TYPE_OPEN ], true ) ) {
				continue;
			}
			$source = $row['source'] ?? null;
			if ( is_object( $source ) && isset( $source->id ) ) {
				$ids[] = (int) $source->id;
			}
		}
		self::$comment_counts       = [] === $ids ? [] : DB::get_comment_counts_by_author( $ids );
		self::$guest_comment_counts = [] === $ids ? [] : DB::get_guest_comment_counts_by_email( $ids );
	}

	/** @return array<int,int> author_id => comment count, for one review. */
	private static function comment_counts_for( int $review_id ): array {
		return self::$comment_counts[ $review_id ] ?? [];
	}

	/** @return array<string,int> email => comment count, for one review. */
	private static function guest_comment_counts_for( int $review_id ): array {
		return self::$guest_comment_counts[ $review_id ] ?? [];
	}

	/**
	 * @return array<int,array<string,mixed>> Newest first.
	 */
	public static function for_tab( string $tab, int $user_id ): array {
		if ( $user_id <= 0 ) {
			return [];
		}
		$tab  = self::TAB_SENT === $tab ? self::TAB_SENT : self::TAB_RECEIVED;
		$rows = self::TAB_SENT === $tab ? self::sent( $user_id ) : self::received( $user_id );
		/**
		 * Rows from other review sources for one dashboard tab. Each row must
		 * follow the shape documented on Dashboard_Rows.
		 *
		 * @param array<int,mixed> $rows    Rows; anything malformed is dropped.
		 * @param string           $tab     Dashboard_Rows::TAB_SENT or TAB_RECEIVED.
		 * @param int              $user_id
		 */
		$rows = (array) apply_filters( 'flow_ew_dashboard_rows', $rows, $tab, $user_id );
		$rows = array_values(
			array_filter(
				$rows,
				static function ( $row ): bool {
					return is_array( $row ) && isset( $row['key'], $row['type'], $row['bucket'], $row['item'] );
				}
			)
		);
		return self::sort_newest_first( $rows );
	}

	/** Reviews the user requested, their own open reviews included. */
	public static function sent( int $user_id ): array {
		$rows = [];
		foreach ( self::live( self::fetch_with_cancelled( [ 'requester_id' => $user_id ] ) ) as $review ) {
			$rows[] = self::row( $review, self::TAB_SENT );
		}
		return $rows;
	}

	/**
	 * Reviews the user is a reviewer on, plus other people's open reviews.
	 * A resolved open review only stays if the user took part in it, or
	 * Resolved would list every open review the site ever had.
	 */
	public static function received( int $user_id ): array {
		$reviews = [];
		foreach ( self::fetch_with_cancelled( [ 'participant_user_id' => $user_id ] ) as $review ) {
			if ( (int) ( $review->requester_id ?? 0 ) === $user_id ) {
				continue;
			}
			$reviews[ (int) $review->id ] = $review;
		}

		if ( Review::is_open_review_feature_available() ) {
			$resolved = [];
			foreach (
				self::fetch_with_cancelled(
					[
						'is_open'    => true,
						'unassigned' => true,
					]
				) as $review
			) {
				$id = (int) $review->id;
				if ( isset( $reviews[ $id ] ) || (int) ( $review->requester_id ?? 0 ) === $user_id ) {
					continue;
				}
				if ( self::BUCKET_RESOLVED === self::bucket_for( $review ) ) {
					$resolved[ $id ] = $review;
					continue;
				}
				$reviews[ $id ] = $review;
			}
			foreach ( DB::get_review_ids_commented_by( $user_id, array_keys( $resolved ) ) as $id ) {
				$reviews[ $id ] = $resolved[ $id ];
			}
		}

		$rows = [];
		foreach ( self::live( array_values( $reviews ) ) as $review ) {
			$rows[] = self::row( $review, self::TAB_RECEIVED );
		}
		return $rows;
	}

	/** Approved and cancelled rounds are done; everything else still needs someone. */
	public static function bucket_for( object $review ): string {
		return in_array( (string) ( $review->status ?? '' ), [ Review::STATUS_APPROVED, Review::STATUS_CANCELLED ], true )
			? self::BUCKET_RESOLVED
			: self::BUCKET_IN_REVIEW;
	}

	public static function type_for( object $review ): string {
		return ! empty( $review->is_open ) && 0 === (int) ( $review->reviewer_id ?? 0 )
			? self::TYPE_OPEN
			: self::TYPE_PAGE;
	}

	/** @return array<string,string> type => listing label */
	public static function type_labels(): array {
		return [
			self::TYPE_PAGE => __( 'Page review', 'jumplinks-editorial-workflow' ),
			self::TYPE_SITE => __( 'Site review', 'jumplinks-editorial-workflow' ),
			self::TYPE_OPEN => __( 'Open review', 'jumplinks-editorial-workflow' ),
		];
	}

	/** @return array<string,string> type => filter label */
	public static function type_filter_labels(): array {
		return [
			self::TYPE_PAGE => __( 'Page reviews', 'jumplinks-editorial-workflow' ),
			self::TYPE_SITE => __( 'Site reviews', 'jumplinks-editorial-workflow' ),
			self::TYPE_OPEN => __( 'Open reviews', 'jumplinks-editorial-workflow' ),
		];
	}

	/**
	 * Person filter ids for a row: WP user ids as decimal strings, plus
	 * `email:<address>` for guest reviewers who have no WP account.
	 *
	 * @return string[]
	 */
	public static function people( array $row ): array {
		$people = $row['people'] ?? [];
		if ( is_callable( $people ) ) {
			$people = $people();
		}
		$out = [];
		foreach ( (array) $people as $person ) {
			if ( is_int( $person ) || ( is_string( $person ) && ctype_digit( $person ) ) ) {
				$id = (int) $person;
				if ( $id > 0 ) {
					$out[] = (string) $id;
				}
				continue;
			}
			if ( is_string( $person ) && 0 === strpos( $person, 'email:' ) ) {
				$email = strtolower( trim( substr( $person, 6 ) ) );
				if ( '' !== $email ) {
					$out[] = 'email:' . $email;
				}
			}
		}
		return array_values( array_unique( $out ) );
	}

	/** Guest reviewers invited by email, as `email:<address>` person-filter keys. */
	private static function guest_identifiers_for( object $review ): array {
		$out = [];
		foreach ( Email_Review_Invites_DB::get_for_review( (int) $review->id ) as $invite ) {
			$email = Email_Review_Invites_DB::normalize_email( (string) ( $invite->email ?? '' ) );
			if ( '' !== $email ) {
				$out[] = 'email:' . $email;
			}
		}
		return $out;
	}

	/**
	 * Assigned reviewer ids, including Pro's extra roster.
	 *
	 * @return int[]
	 */
	public static function reviewer_ids_for( object $review ): array {
		$ids = [];
		if ( (int) ( $review->reviewer_id ?? 0 ) > 0 ) {
			$ids[] = (int) $review->reviewer_id;
		}
		return array_values(
			array_unique(
				array_filter(
					array_map( 'intval', (array) apply_filters( 'flow_ew_review_reviewer_ids', $ids, $review ) )
				)
			)
		);
	}

	/**
	 * `DB::get_reviews()` clamps `per_page` to 100, so walk pages until a
	 * batch comes back short.
	 *
	 * @param array<string,mixed> $args
	 * @return array<int,object>
	 */
	public static function fetch_all( array $args ): array {
		$out  = [];
		$page = 1;
		do {
			$batch = DB::get_reviews(
				array_merge(
					[
						'orderby' => 'updated_at',
						'order'   => 'DESC',
					],
					$args,
					[
						'per_page' => self::BATCH,
						'page'     => $page,
					]
				)
			);
			foreach ( $batch as $row ) {
				$out[] = $row;
			}
			++$page;
			$fetched = count( $batch );
		} while ( self::BATCH === $fetched );
		return $out;
	}

	/**
	 * An empty status filter means "anything but cancelled", so cancelled
	 * rounds need their own pass.
	 *
	 * @param array<string,mixed> $args
	 * @return array<int,object>
	 */
	private static function fetch_with_cancelled( array $args ): array {
		$by_id = [];
		foreach ( [ '', Review::STATUS_CANCELLED ] as $status ) {
			foreach ( self::fetch_all( array_merge( $args, [ 'status' => $status ] ) ) as $review ) {
				$by_id[ (int) $review->id ] = $review;
			}
		}
		return array_values( $by_id );
	}

	/**
	 * Drop reviews whose post is gone, an unsaved auto-draft, or trashed.
	 *
	 * @param array<int,object> $reviews
	 * @return array<int,object>
	 */
	private static function live( array $reviews ): array {
		$post_ids = array_values( array_unique( array_filter( array_map( static fn( $r ) => (int) $r->post_id, $reviews ) ) ) );
		if ( [] !== $post_ids && function_exists( '_prime_post_caches' ) ) {
			_prime_post_caches( $post_ids, false, false );
		}
		return array_values(
			array_filter(
				$reviews,
				static function ( $review ): bool {
					$post = get_post( (int) $review->post_id );
					return $post instanceof \WP_Post && ! in_array( $post->post_status, [ 'auto-draft', 'trash' ], true );
				}
			)
		);
	}

	/**
	 * @param array<int,array<string,mixed>> $rows
	 * @return array<int,array<string,mixed>>
	 */
	private static function sort_newest_first( array $rows ): array {
		usort(
			$rows,
			static function ( array $a, array $b ): int {
				return strcmp( (string) ( $b['updated_at'] ?? '' ), (string) ( $a['updated_at'] ?? '' ) );
			}
		);
		return $rows;
	}

	/** @return array<string,mixed> */
	private static function row( object $review, string $tab ): array {
		$type = self::type_for( $review );
		return [
			'key'        => 'post:' . (int) $review->id,
			'type'       => $type,
			'bucket'     => self::bucket_for( $review ),
			'updated_at' => (string) ( $review->updated_at ?? '' ),
			'source'     => $review,
			'people'     => static function () use ( $review, $tab ): array {
				return self::TAB_SENT === $tab
					? array_merge( self::reviewer_ids_for( $review ), self::guest_identifiers_for( $review ) )
					: [ (int) ( $review->requester_id ?? 0 ) ];
			},
			'item'       => static function ( callable $person_url ) use ( $review, $tab, $type ): ?array {
				return self::item( $review, $tab, $type, $person_url );
			},
		];
	}

	/** @return array<string,mixed>|null Null when the post is gone. */
	private static function item( object $review, string $tab, string $type, callable $person_url ): ?array {
		$post = get_post( (int) $review->post_id );
		if ( ! $post instanceof \WP_Post ) {
			return null;
		}

		$meta      = [ esc_html( Dashboard_List_Renderer::post_type_label( $post ) ) ];
		$reviewers = [];
		if ( self::TAB_SENT === $tab ) {
			if ( self::TYPE_PAGE === $type ) {
				$counts = self::comment_counts_for( (int) $review->id );
				foreach ( self::reviewer_ids_for( $review ) as $user_id ) {
					$name = Dashboard_List_Renderer::person_link( $user_id, $person_url );
					if ( '' === $name ) {
						continue;
					}
					$reviewers[] = [
						'name'  => $name,
						'count' => $counts[ $user_id ] ?? 0,
					];
				}
			}
			$guest_counts = self::guest_comment_counts_for( (int) $review->id );
			foreach ( Email_Review_Invites_DB::get_for_review( (int) $review->id ) as $invite ) {
				$payload = Email_Review_Invites_DB::to_reviewer_payload( $invite );
				$name    = trim( (string) ( $payload['name'] ?? '' ) );
				if ( '' === $name ) {
					continue;
				}
				$email       = (string) ( $payload['email'] ?? '' );
				$reviewers[] = [
					'name'  => Dashboard_List_Renderer::person_filter_link(
						$name,
						'' !== $email ? 'email:' . $email : '',
						$person_url
					),
					'count' => $guest_counts[ $email ] ?? 0,
				];
			}
		} elseif ( self::TAB_RECEIVED === $tab ) {
			$requester = (int) ( $review->requester_id ?? 0 );
			$name      = Dashboard_List_Renderer::person_link( $requester > 0 ? $requester : (int) $post->post_author, $person_url );
			if ( '' !== $name ) {
				/* translators: %s: requester display name. */
				$meta[] = sprintf( esc_html__( 'by %s', 'jumplinks-editorial-workflow' ), $name );
			}
		}
		$relative = Dashboard_List_Renderer::relative_time( $review->updated_at ?? null );
		if ( '' !== $relative ) {
			$meta[] = esc_html( $relative );
		}

		// Once a round closes its real outcome reads better than "Open Review".
		$status = self::BUCKET_RESOLVED === self::bucket_for( $review )
			? (string) $review->status
			: Review::display_status( $review );

		$rev_id     = Review::get_effective_preview_revision_id( (int) $review->post_id, (int) ( $review->revision_id ?? 0 ) );
		$review_url = Review::get_preview_url( (int) $review->id, $rev_id, (int) $review->post_id );
		$labels     = self::type_labels();

		return [
			'title'        => Dashboard_List_Renderer::post_title( $post ),
			'url'          => $review_url,
			'links'        => self::links_for( $post, $review_url ),
			'meta'         => $meta,
			'reviewers'    => $reviewers,
			'status_key'   => $status,
			'status_label' => Review::status_label( $status ),
			'type_key'     => $type,
			'type_label'   => $labels[ $type ] ?? '',
			'review_id'    => (int) $review->id,
			'actions'      => self::actions_for( $review, $tab, $type ),
		];
	}

	/**
	 * Open review, Edit and View. Edit and View drop out when there is
	 * nothing to link to.
	 *
	 * @return array<int,array{label:string,url:string}>
	 */
	private static function links_for( \WP_Post $post, string $review_url ): array {
		$links = [
			[
				'label' => __( 'Open review', 'jumplinks-editorial-workflow' ),
				'url'   => $review_url,
			],
		];
		if ( current_user_can( 'edit_post', $post->ID ) ) {
			$edit = (string) get_edit_post_link( $post->ID, '' );
			if ( '' !== $edit ) {
				$links[] = [
					'label' => __( 'Edit', 'jumplinks-editorial-workflow' ),
					'url'   => $edit,
				];
			}
		}
		$view = self::post_view_url( $post );
		if ( '' !== $view ) {
			$links[] = [
				'label' => __( 'View', 'jumplinks-editorial-workflow' ),
				'url'   => $view,
			];
		}
		return $links;
	}

	/** Front-end permalink, or the preview link while the post is unpublished. */
	private static function post_view_url( \WP_Post $post ): string {
		if ( in_array( $post->post_status, [ 'publish', 'private' ], true ) ) {
			$url = get_permalink( $post );
			return is_string( $url ) ? $url : '';
		}
		$url = get_preview_post_link( $post );
		return is_string( $url ) ? $url : '';
	}

	/**
	 * Quick actions for one row: the requester may cancel; an assigned
	 * reviewer may approve or request changes. Nothing once the round is
	 * resolved, and nothing on an unassigned open review — same as the
	 * review page, which only turns on Approve/Request Changes once someone
	 * is actually reviewing it.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	private static function actions_for( object $review, string $tab, string $type ): array {
		if ( self::BUCKET_IN_REVIEW !== self::bucket_for( $review ) ) {
			return [];
		}
		$user_id = get_current_user_id();

		if ( self::TAB_SENT === $tab ) {
			if ( ! Review::is_requester_or_manager( $review, $user_id ) ) {
				return [];
			}
			return [
				[
					'action'  => 'cancel',
					'label'   => __( 'Cancel', 'jumplinks-editorial-workflow' ),
					'confirm' => __( 'Cancel this review? The review becomes read-only.', 'jumplinks-editorial-workflow' ),
				],
			];
		}

		if ( self::TYPE_PAGE !== $type || ! Review::is_assigned_reviewer( $review, $user_id ) ) {
			return [];
		}
		$vote          = self::my_vote( $review, $user_id );
		$has_commented = ( self::comment_counts_for( (int) $review->id )[ $user_id ] ?? 0 ) > 0;
		$requested     = Review::STATUS_CHANGES_REQUESTED === $vote;
		$actions       = [
			[
				'action' => 'approve',
				'label'  => __( 'Approve', 'jumplinks-editorial-workflow' ),
			],
		];
		if ( $has_commented && ! $requested ) {
			$actions[] = [
				'action' => 'request-changes',
				'label'  => __( 'Request changes', 'jumplinks-editorial-workflow' ),
			];
		}
		return $actions;
	}

	/**
	 * This reviewer's own vote. Pro replaces it with the roster row, because
	 * the review status is the rollup and not any one person's decision.
	 */
	private static function my_vote( object $review, int $user_id ): string {
		$vote = ( (int) ( $review->reviewer_id ?? 0 ) === $user_id ) ? (string) ( $review->status ?? '' ) : '';
		return (string) apply_filters( 'flow_ew_dashboard_reviewer_vote', $vote, $review, $user_id );
	}
}
