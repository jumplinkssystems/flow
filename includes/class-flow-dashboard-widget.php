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

		if ( empty( $reviews ) ) {
			return;
		}
		$total        = count( $reviews );
		$has_overflow = $total > self::INITIAL_VISIBLE;

		printf(
			'<div class="flow-ew-dash-section flow-ew-dash-section--%s">',
			esc_attr( $slug )
		);
		printf(
			'<h3 class="flow-ew-dash-section__title">%s<span class="flow-ew-dash-section__count">%d</span></h3>',
			esc_html( $heading ),
			(int) $total
		);
		echo '<ul class="flow-ew-dash-list">';
		$index = 0;
		foreach ( $reviews as $review ) {
			$hidden = $index >= self::INITIAL_VISIBLE;
			self::render_item( $review, $hidden );
			++$index;
		}
		echo '</ul>';

		if ( $has_overflow ) {
			$more_label = sprintf(
				/* translators: %d: number of additional reviews. */
				__( 'View %d more', 'jumplinks-editorial-workflow' ),
				$total - self::INITIAL_VISIBLE
			);
			$less_label = __( 'View less', 'jumplinks-editorial-workflow' );
			printf(
				'<button type="button" class="flow-ew-dash-toggle" data-more-label="%s" data-less-label="%s">%s</button>',
				esc_attr( $more_label ),
				esc_attr( $less_label ),
				esc_html( $more_label )
			);
		}

		echo '</div>';
	}

	private static function render_item( object $review, bool $hidden ): void {
		$post = get_post( (int) $review->post_id );
		if ( ! $post instanceof \WP_Post ) {
			return;
		}

		$rev_id = Review::get_effective_preview_revision_id(
			(int) $review->post_id,
			(int) ( $review->revision_id ?? 0 )
		);
		$url    = Review::get_preview_url( (int) $review->id, $rev_id, (int) $review->post_id );

		$updated_ts = strtotime( (string) ( $review->updated_at ?? '' ) . ' UTC' );
		$relative   = $updated_ts
			/* translators: %s: human-readable time difference, e.g. "2 hours". */
			? sprintf( __( '%s ago', 'jumplinks-editorial-workflow' ), human_time_diff( $updated_ts, time() ) )
			: '';

		$post_type_obj   = get_post_type_object( $post->post_type );
		$post_type_label = ( $post_type_obj && isset( $post_type_obj->labels->singular_name ) )
			? $post_type_obj->labels->singular_name
			: $post->post_type;

		$item_class = 'flow-ew-dash-item' . ( $hidden ? ' flow-ew-dash-item--hidden' : '' );

		printf( '<li class="%s">', esc_attr( $item_class ) );
		echo '<div class="flow-ew-dash-item__main">';
		printf(
			'<a class="flow-ew-dash-item__title" href="%s">%s</a>',
			esc_url( $url ),
			esc_html( '' !== $post->post_title ? $post->post_title : __( '(no title)', 'jumplinks-editorial-workflow' ) )
		);
		echo '<span class="flow-ew-dash-item__meta">';
		echo esc_html( $post_type_label );
		if ( '' !== $relative ) {
			echo ' &middot; ' . esc_html( $relative );
		}
		echo '</span>';
		echo '</div>';
		echo '</li>';
	}
}
