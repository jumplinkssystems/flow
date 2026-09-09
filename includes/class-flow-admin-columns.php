<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Adds a "Review" column to the post-listing table for each supported post
 * type, inserted right after the Author column. Each row shows the active
 * review's status as a coloured pill.
 */
class Admin_Columns {

	const COLUMN_ID    = 'flow_ew_review';
	const FILTER_PARAM = 'flow_review_status';

	public function boot(): void {
		add_action( 'admin_init', [ $this, 'register_hooks' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_action( 'restrict_manage_posts', [ $this, 'render_filter_dropdown' ] );
		add_action( 'pre_get_posts', [ $this, 'apply_filter_to_query' ] );
	}

	public function register_hooks(): void {
		foreach ( Settings::get_supported_post_types() as $post_type ) {
			add_filter( "manage_{$post_type}_posts_columns", [ $this, 'add_column' ] );
			add_action( "manage_{$post_type}_posts_custom_column", [ $this, 'render_column' ], 10, 2 );
		}
		// Pages use a separate filter from other post types.
		add_filter( 'post_row_actions', [ $this, 'add_review_row_action' ], 10, 2 );
		add_filter( 'page_row_actions', [ $this, 'add_review_row_action' ], 10, 2 );
	}

	/**
	 * @param array<string,string> $actions
	 * @return array<string,string>
	 */
	public function add_review_row_action( array $actions, $post ): array {
		if ( ! $post instanceof \WP_Post ) {
			return $actions;
		}
		if ( ! Settings::is_post_type_supported( $post->post_type ) ) {
			return $actions;
		}
		$review = DB::get_active_review( (int) $post->ID );
		if ( ! $review ) {
			return $actions;
		}
		if ( ! self::current_user_can_view_review( $review, $post ) ) {
			return $actions;
		}

		$rev_id = Review::get_effective_preview_revision_id(
			(int) $review->post_id,
			(int) ( $review->revision_id ?? 0 )
		);
		$url    = Review::get_preview_url( (int) $review->id, $rev_id, (int) $review->post_id );

		$actions['flow_ew_review'] = sprintf(
			'<a href="%s">%s</a>',
			esc_url( $url ),
			esc_html__( 'Review', 'jumplinks-editorial-workflow' )
		);

		return $actions;
	}

	/**
	 * Mirrors ReviewPage::user_can_view_review_preview() — kept local (and slim)
	 * so we don't have to expose that private method just for the row action.
	 */
	private static function current_user_can_view_review( object $review, \WP_Post $post ): bool {
		$user_id = get_current_user_id();
		if ( $user_id <= 0 ) {
			return false;
		}
		if ( Review::is_user_review_participant( $review, $user_id ) ) {
			return true;
		}
		if ( (int) $post->post_author === $user_id ) {
			return true;
		}
		if ( ! empty( $review->is_open ) && Review::is_open_review_feature_available() ) {
			return true;
		}
		if ( Settings::is_debug_mode() && user_can( $user_id, 'manage_options' ) ) {
			return true;
		}
		return false;
	}

	public function render_filter_dropdown( string $post_type ): void {
		if ( ! Settings::is_post_type_supported( $post_type ) ) {
			return;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- read-only filter param from a list-table GET.
		$current = isset( $_GET[ self::FILTER_PARAM ] )
			? sanitize_key( wp_unslash( $_GET[ self::FILTER_PARAM ] ) )
			: '';
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		$options = array_merge(
			[ '' => __( 'All review statuses', 'jumplinks-editorial-workflow' ) ],
			Review::status_labels()
		);

		echo '<label for="flow-ew-review-status-filter" class="screen-reader-text">';
		esc_html_e( 'Filter by review status', 'jumplinks-editorial-workflow' );
		echo '</label>';
		echo '<select name="' . esc_attr( self::FILTER_PARAM ) . '" id="flow-ew-review-status-filter">';
		foreach ( $options as $value => $label ) {
			printf(
				'<option value="%s"%s>%s</option>',
				esc_attr( (string) $value ),
				selected( $current, $value, false ),
				esc_html( $label )
			);
		}
		echo '</select>';
	}

	public function apply_filter_to_query( \WP_Query $query ): void {
		if ( ! is_admin() || ! $query->is_main_query() ) {
			return;
		}
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || 'edit' !== $screen->base || empty( $screen->post_type ) ) {
			return;
		}
		if ( ! Settings::is_post_type_supported( (string) $screen->post_type ) ) {
			return;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- read-only filter param from a list-table GET.
		$value = isset( $_GET[ self::FILTER_PARAM ] )
			? sanitize_key( wp_unslash( $_GET[ self::FILTER_PARAM ] ) )
			: '';
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		if ( '' === $value ) {
			return;
		}

		if ( ! array_key_exists( $value, Review::status_labels() ) ) {
			return;
		}

		$ids = ( Review::STATUS_OPEN_REVIEW === $value )
			? DB::get_post_ids_with_open_review_no_reviewer()
			: DB::get_post_ids_by_active_status( [ $value ] );

		// post__in with [0] forces zero results; matches WP convention for an
		// "no posts matched" filter outcome.
		if ( empty( $ids ) ) {
			$query->set( 'post__in', [ 0 ] );
			return;
		}

		$existing = (array) $query->get( 'post__in' );
		if ( ! empty( $existing ) ) {
			$ids = array_values( array_intersect( $ids, array_map( 'intval', $existing ) ) );
			if ( empty( $ids ) ) {
				$query->set( 'post__in', [ 0 ] );
				return;
			}
		}

		$query->set( 'post__in', $ids );
	}

	public function enqueue_assets( string $hook_suffix ): void {
		if ( 'edit.php' !== $hook_suffix ) {
			return;
		}
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || empty( $screen->post_type ) ) {
			return;
		}
		if ( ! Settings::is_post_type_supported( (string) $screen->post_type ) ) {
			return;
		}

		$css_path = FLOW_EW_PLUGIN_DIR . 'assets/css/admin-columns.css';
		$ver      = file_exists( $css_path )
			? (string) filemtime( $css_path )
			: ( defined( 'FLOW_EW_VERSION' ) ? FLOW_EW_VERSION : '1.0.0' );

		wp_enqueue_style(
			'flow-ew-admin-columns',
			FLOW_EW_PLUGIN_URL . 'assets/css/admin-columns.css',
			[],
			$ver
		);
	}

	/**
	 * @param array<string,string> $columns
	 * @return array<string,string>
	 */
	public function add_column( array $columns ): array {
		$label = __( 'Review', 'jumplinks-editorial-workflow' );

		if ( ! isset( $columns['author'] ) ) {
			$columns[ self::COLUMN_ID ] = $label;
			return $columns;
		}

		$reordered = [];
		foreach ( $columns as $key => $value ) {
			$reordered[ $key ] = $value;
			if ( 'author' === $key ) {
				$reordered[ self::COLUMN_ID ] = $label;
			}
		}
		return $reordered;
	}

	public function render_column( string $column, int $post_id ): void {
		if ( self::COLUMN_ID !== $column ) {
			return;
		}

		$review = DB::get_active_review( $post_id );
		if ( ! $review ) {
			echo '<span class="flow-ew-review-status flow-ew-review-status--none">&mdash;</span>';
			return;
		}

		$status = Review::display_status( $review );
		$slug   = sanitize_html_class( str_replace( '_', '-', $status ) );
		$labels = Review::status_labels();
		$label  = $labels[ $status ] ?? $status;

		printf(
			'<span class="flow-ew-review-status flow-ew-review-status--%s"><span class="flow-ew-status-pill__dot" aria-hidden="true"></span>%s</span>',
			esc_attr( $slug ),
			esc_html( $label )
		);
	}
}
