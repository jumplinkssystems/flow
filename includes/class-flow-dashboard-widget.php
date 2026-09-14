<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Dashboard_Widget {

	const WIDGET_ID         = 'flow_ew_my_reviews';
	const MAX_ITEMS_PER_CAT = 10;
	const INITIAL_VISIBLE   = 5;

	public function boot(): void {
		add_action( 'wp_dashboard_setup', [ $this, 'register' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
	}

	public function register(): void {
		if ( ! is_user_logged_in() ) {
			return;
		}
		wp_add_dashboard_widget(
			self::WIDGET_ID,
			__( 'Flow Reviews', 'jumplinks-editorial-workflow' ),
			[ $this, 'render' ]
		);
	}

	public function enqueue_assets( string $hook_suffix ): void {
		if ( 'index.php' !== $hook_suffix ) {
			return;
		}
		if ( ! is_user_logged_in() ) {
			return;
		}
		$css_path = FLOW_EW_PLUGIN_DIR . 'assets/css/dashboard-widget.css';
		$ver      = file_exists( $css_path )
			? (string) filemtime( $css_path )
			: ( defined( 'FLOW_EW_VERSION' ) ? FLOW_EW_VERSION : '1.0.0' );
		wp_enqueue_style(
			'flow-ew-dashboard-widget',
			FLOW_EW_PLUGIN_URL . 'assets/css/dashboard-widget.css',
			[],
			$ver
		);
	}

	public function render(): void {
		$user_id = get_current_user_id();

		// "In Review" pools both pending and in_review — from the reviewer's
		// perspective they're equivalent: not yet acted on.
		$in_review = self::merge_and_cap(
			[
				self::fetch( $user_id, Review::STATUS_PENDING ),
				self::fetch( $user_id, Review::STATUS_IN_REVIEW ),
			],
			self::MAX_ITEMS_PER_CAT
		);

		$changes_requested = self::fetch( $user_id, Review::STATUS_CHANGES_REQUESTED );

		// Open Review is global — anyone with the link can view, so the
		// widget surfaces them to every logged-in user, not just participants.
		$open_reviews = Review::is_open_review_feature_available()
			? self::fetch_open_reviews()
			: [];

		$has_any = ! empty( $in_review ) || ! empty( $changes_requested ) || ! empty( $open_reviews );
		if ( ! $has_any ) {
			echo '<p class="flow-ew-dash-empty">';
			esc_html_e( 'No reviews assigned to you yet.', 'jumplinks-editorial-workflow' );
			echo '</p>';
			self::render_footer_link();
			return;
		}

		Review::prime_review_list_caches( array_merge( $in_review, $changes_requested, $open_reviews ) );

		self::render_section( 'in-review', __( 'In Review', 'jumplinks-editorial-workflow' ), $in_review );
		self::render_section( 'changes-requested', __( 'Changes Requested', 'jumplinks-editorial-workflow' ), $changes_requested );
		self::render_section( 'open-review', __( 'Open Review', 'jumplinks-editorial-workflow' ), $open_reviews );

		self::render_footer_link();

		// Vanilla JS toggle — keeps the widget self-contained, no extra enqueue.
		echo "<script>(function(){
			var sections=document.querySelectorAll('#" . esc_js( self::WIDGET_ID ) . " .flow-ew-dash-section');
			sections.forEach(function(section){
				var btn=section.querySelector('.flow-ew-dash-toggle');
				if(!btn)return;
				btn.addEventListener('click',function(e){
					e.preventDefault();
					var expanded=section.classList.toggle('is-expanded');
					btn.textContent=expanded?btn.dataset.lessLabel:btn.dataset.moreLabel;
				});
			});
		})();</script>";
	}

	/**
	 * Footer "View Flow Dashboard →" link. Always rendered (even on the empty
	 * state) so the widget is a reliable jump-off point to the full dashboard page
	 * even when the user currently has nothing assigned.
	 */
	private static function render_footer_link(): void {
		$url = admin_url( 'admin.php?page=' . Dashboard_Page::PAGE_SLUG );
		printf(
			'<p class="flow-ew-dash-footer"><a href="%s">%s <span aria-hidden="true">&rarr;</span></a></p>',
			esc_url( $url ),
			esc_html__( 'View Flow Dashboard', 'jumplinks-editorial-workflow' )
		);
	}

	/**
	 * Fetch reviews currently in the virtual "Open Review" state — open + no
	 * reviewer assigned — across all users. Not scoped to participation.
	 *
	 * @return array<int,object>
	 */
	private static function fetch_open_reviews(): array {
		$rows = DB::get_reviews(
			[
				'is_open'    => true,
				'unassigned' => true,
				'per_page'   => self::MAX_ITEMS_PER_CAT * 2,
				'orderby'    => 'updated_at',
				'order'      => 'DESC',
			]
		);
		return array_values( array_filter( $rows, [ self::class, 'is_visible_post_review' ] ) );
	}

	/**
	 * @return array<int,object>
	 */
	private static function fetch( int $user_id, string $status ): array {
		$rows = DB::get_reviews(
			[
				'participant_user_id' => $user_id,
				'status'              => $status,
				'per_page'            => self::MAX_ITEMS_PER_CAT * 2,
				'orderby'             => 'updated_at',
				'order'               => 'DESC',
			]
		);
		return array_values( array_filter( $rows, [ self::class, 'is_visible_post_review' ] ) );
	}

	/**
	 * Shared row filter — keeps reviews whose post exists AND isn't an unsaved
	 * auto-draft placeholder or a trashed post. Auto-drafts are empty WordPress
	 * shells created when the editor opens but never saved; they shouldn't surface
	 * to anyone.
	 */
	private static function is_visible_post_review( $review ): bool {
		$post = get_post( (int) ( $review->post_id ?? 0 ) );
		if ( ! $post instanceof \WP_Post ) {
			return false;
		}
		return ! in_array( $post->post_status, [ 'auto-draft', 'trash' ], true );
	}

	/**
	 * Merge multiple result sets, sort by updated_at desc, then cap.
	 *
	 * @param array<int,array<int,object>> $sets
	 * @return array<int,object>
	 */
	private static function merge_and_cap( array $sets, int $max ): array {
		$merged = [];
		foreach ( $sets as $set ) {
			foreach ( $set as $row ) {
				$merged[] = $row;
			}
		}
		usort(
			$merged,
			static function ( $a, $b ) {
				return strcmp( (string) ( $b->updated_at ?? '' ), (string) ( $a->updated_at ?? '' ) );
			}
		);
		return array_slice( $merged, 0, $max );
	}

	/**
	 * @param array<int,object> $reviews
	 */
	private static function render_section( string $slug, string $heading, array $reviews ): void {
		$reviews = array_slice( $reviews, 0, self::MAX_ITEMS_PER_CAT );

		$items = [];
		foreach ( $reviews as $index => $review ) {
			$item = self::item_data( $review );
			if ( null !== $item ) {
				$item['hidden'] = $index >= self::INITIAL_VISIBLE;
				$items[]        = $item;
			}
		}

		$after = '';
		if ( count( $items ) > self::INITIAL_VISIBLE ) {
			$more_label = sprintf(
				/* translators: %d: number of additional reviews. */
				__( 'View %d more', 'jumplinks-editorial-workflow' ),
				count( $items ) - self::INITIAL_VISIBLE
			);
			$after = sprintf(
				'<button type="button" class="flow-ew-dash-toggle" data-more-label="%s" data-less-label="%s">%s</button>',
				esc_attr( $more_label ),
				esc_attr( __( 'View less', 'jumplinks-editorial-workflow' ) ),
				esc_html( $more_label )
			);
		}

		Dashboard_List_Renderer::section(
			$slug,
			$heading,
			$items,
			[
				'heading_tag' => 'h3',
				'after_html'  => $after,
			]
		);
	}

	/**
	 * @return array<string,mixed>|null Null when the post is gone.
	 */
	private static function item_data( object $review ): ?array {
		$post = get_post( (int) $review->post_id );
		if ( ! $post instanceof \WP_Post ) {
			return null;
		}
		$rev_id   = Review::get_effective_preview_revision_id(
			(int) $review->post_id,
			(int) ( $review->revision_id ?? 0 )
		);
		$meta     = [ esc_html( Dashboard_List_Renderer::post_type_label( $post ) ) ];
		$relative = Dashboard_List_Renderer::relative_time( $review->updated_at ?? null );
		if ( '' !== $relative ) {
			$meta[] = esc_html( $relative );
		}
		return [
			'title' => Dashboard_List_Renderer::post_title( $post ),
			'url'   => Review::get_preview_url( (int) $review->id, $rev_id, (int) $review->post_id ),
			'meta'  => $meta,
		];
	}
}
