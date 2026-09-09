<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * "Dashboard" subpage under the Flow top-level menu. Personal at-a-glance view
 * for the current user, split into: - reviews they REQUESTED that are still in
 * flight (status in pending / in_review / changes_requested) - reviews they're
 * ASSIGNED to as a reviewer (primary reviewer_id OR Pro multi-reviewer roster
 * member — both come through the `participant_user_id` filter, then we strip
 * their own requester rows so an item that's both isn't shown twice) Reuses
 * the dashboard-widget CSS (`assets/css/dashboard-widget.css`) for the section
 * / list / item visuals, then layers a thin wrapper class
 * (`.flow-ew-dashboard-page`) for full-page adjustments.
 */
class Dashboard_Page {

	const PAGE_SLUG                  = 'flow-ew-dashboard';
	const PAGE_BATCH                 = 100;
	const NOTICE_DISMISS_META        = 'flow_ew_assigned_notice_dismissed_count';
	const NOTICE_DISMISS_AJAX_ACTION = 'flow_ew_dismiss_assigned_notice';

	/** @var string|null Hook suffix returned by add_submenu_page, used to gate asset enqueue. */
	private ?string $hook_suffix = null;

	public function boot(): void {
		add_action( 'admin_menu', [ $this, 'register_menu' ], 10 );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_action( 'admin_notices', [ $this, 'render_assigned_notice' ] );
		add_action( 'admin_head', [ $this, 'output_menu_icon_css' ] );
		add_action( 'wp_ajax_' . self::NOTICE_DISMISS_AJAX_ACTION, [ $this, 'ajax_dismiss_assigned_notice' ] );
	}

	/**
	 * Renders the Flow top-level menu icon via `mask-image` + `background-color:
	 * currentColor`, so it inherits the WP menu text colour (dimmed when idle,
	 * full white / accent on hover / current) the same way dashicons do.
	 * Without this, the SVG data URI passed to `add_menu_page` would render as
	 * a background-image with whatever fill was baked in — static, not scheme-
	 * aware.
	 */
	public function output_menu_icon_css(): void {
		$uri = self::get_menu_icon_data_uri();
		?>
		<style id="flow-ew-menu-icon">
			#adminmenu .toplevel_page_<?php echo esc_attr( self::PAGE_SLUG ); ?> .wp-menu-image {
				background-image: none !important;
				background-color: currentColor;
				-webkit-mask-image: url('<?php echo esc_attr( $uri ); ?>');
				mask-image: url('<?php echo esc_attr( $uri ); ?>');
				-webkit-mask-repeat: no-repeat;
				mask-repeat: no-repeat;
				-webkit-mask-position: center center;
				mask-position: center center;
				-webkit-mask-size: 28px auto;
				mask-size: 28px auto;
			}
		</style>
		<?php
	}

	public function register_menu(): void {
		$pending = self::count_assigned_to_me( get_current_user_id() );
		$label   = __( 'Flow', 'jumplinks-editorial-workflow' );
		if ( $pending > 0 ) {
			$label .= sprintf(
				' <span class="awaiting-mod count-%1$d"><span class="pending-count">%2$s</span></span>',
				(int) $pending,
				esc_html( number_format_i18n( $pending ) )
			);
		}

		add_menu_page(
			__( 'Flow', 'jumplinks-editorial-workflow' ),
			$label,
			'read',
			self::PAGE_SLUG,
			[ $this, 'render' ],
			self::get_menu_icon_data_uri(),
			26
		);

		// Re-add the same slug as a child so WordPress renames the
		// auto-generated first submenu from "Flow" → "Dashboard".
		$this->hook_suffix = add_submenu_page(
			self::PAGE_SLUG,
			__( 'Flow Dashboard', 'jumplinks-editorial-workflow' ),
			__( 'Dashboard', 'jumplinks-editorial-workflow' ),
			'read',
			self::PAGE_SLUG,
			[ $this, 'render' ]
		) ?: null;
	}

	public function enqueue_assets( string $hook_suffix ): void {
		if ( null === $this->hook_suffix || $hook_suffix !== $this->hook_suffix ) {
			return;
		}
		$themes_path = FLOW_EW_PLUGIN_DIR . 'assets/css/status-themes.css';
		$page_path   = FLOW_EW_PLUGIN_DIR . 'assets/css/dashboard-page.css';
		$widget_path = FLOW_EW_PLUGIN_DIR . 'assets/css/dashboard-widget.css';
		$fallback    = defined( 'FLOW_EW_VERSION' ) ? FLOW_EW_VERSION : '1.0.0';
		$themes_ver  = file_exists( $themes_path ) ? (string) filemtime( $themes_path ) : $fallback;
		$page_ver    = file_exists( $page_path ) ? (string) filemtime( $page_path ) : $fallback;
		$widget_ver  = file_exists( $widget_path ) ? (string) filemtime( $widget_path ) : $fallback;

		wp_enqueue_style(
			'flow-ew-status-themes',
			FLOW_EW_PLUGIN_URL . 'assets/css/status-themes.css',
			[],
			$themes_ver
		);
		wp_enqueue_style(
			'flow-ew-dashboard-widget',
			FLOW_EW_PLUGIN_URL . 'assets/css/dashboard-widget.css',
			[],
			$widget_ver
		);
		wp_enqueue_style(
			'flow-ew-dashboard-page',
			FLOW_EW_PLUGIN_URL . 'assets/css/dashboard-page.css',
			[ 'flow-ew-dashboard-widget', 'flow-ew-status-themes' ],
			$page_ver
		);
	}

	public function render(): void {
		if ( ! is_user_logged_in() ) {
			return;
		}
		$user_id = get_current_user_id();

		$in_flight_statuses = [
			Review::STATUS_PENDING,
			Review::STATUS_IN_REVIEW,
			Review::STATUS_CHANGES_REQUESTED,
		];

		$my_request_statuses = array_merge(
			$in_flight_statuses,
			[ Review::STATUS_APPROVED ]
		);

		$assigned     = self::fetch_assigned_to_me( $user_id, $in_flight_statuses );
		$my_requests  = self::fetch_my_requests( $user_id, $my_request_statuses );
		$open_reviews = self::fetch_open_reviews( $user_id );
		$has_any      = ! empty( $assigned ) || ! empty( $my_requests ) || ! empty( $open_reviews );

		$has_any = (bool) apply_filters(
			'flow_ew_dashboard_has_any_reviews',
			$has_any,
			$user_id
		);

		?>
		<div class="wrap flow-ew-dashboard-page">
			<h1 class="wp-heading-inline"><?php esc_html_e( 'Flow Dashboard', 'jumplinks-editorial-workflow' ); ?></h1>

			<p class="flow-ew-rating-prompt" style="color:#646970;font-size:13px;margin:0 0 1em;">
				<?php
				/* translators: %s: link to the WordPress.org review form. */
				$prompt_template = __( 'Enjoying Flow? Please consider leaving a %s to help others discover it.', 'jumplinks-editorial-workflow' );
				$review_link     = sprintf(
					'<a href="%s" target="_blank" rel="noopener">%s</a>',
					esc_url( 'https://wordpress.org/support/plugin/jumplinks-editorial-workflow/reviews/#new-post' ),
					esc_html__( 'review on WordPress.org', 'jumplinks-editorial-workflow' )
				);
				echo wp_kses(
					sprintf( $prompt_template, $review_link ),
					[
						'a' => [
							'href'   => [],
							'target' => [],
							'rel'    => [],
						],
					]
				);
				?>
			</p>

			<?php
			if ( ! $has_any ) {
				printf(
					'<p class="flow-ew-dash-empty flow-ew-dashboard-page__empty">%s</p>',
					esc_html__( 'Nothing is waiting on you, and you haven’t sent anything for review yet.', 'jumplinks-editorial-workflow' )
				);
			} else {
				self::render_section(
					'assigned',
					__( 'Assigned to me', 'jumplinks-editorial-workflow' ),
					__( 'Content waiting for my feedback.', 'jumplinks-editorial-workflow' ),
					$assigned,
					false,
					'author'
				);
				/** This filter is documented below. */
				do_action( 'flow_ew_dashboard_after_section', 'assigned', $user_id );

				self::render_section(
					'my-requests',
					__( 'My review requests', 'jumplinks-editorial-workflow' ),
					__( 'Content waiting for review from colleagues.', 'jumplinks-editorial-workflow' ),
					$my_requests,
					true,
					'reviewers'
				);
				/** This filter is documented below. */
				do_action( 'flow_ew_dashboard_after_section', 'my-requests', $user_id );

				self::render_section(
					'open-reviews',
					__( 'Open reviews', 'jumplinks-editorial-workflow' ),
					__( 'Any user can add comments on this content.', 'jumplinks-editorial-workflow' ),
					$open_reviews,
					false,
					'author'
				);
				/**
				 * Per-section slot for add-ons to interleave their own sections at specific
				 * positions on the dashboard. `$section` is the slug of the section that just
				 * rendered (`assigned`, `my-requests`, `open-reviews`). Listeners should print
				 * HTML matching the existing `flow-ew-dash-section` / `flow-ew-dash-list`
				 * markup so the visual register stays uniform.
				 */
				do_action( 'flow_ew_dashboard_after_section', 'open-reviews', $user_id );
			}

			/**
			 * Catch-all slot for add-ons to inject extra sections at the very end of the
			 * dashboard, after every per-post section has rendered. Use
			 * `flow_ew_dashboard_after_section` instead if you need to slot a section
			 * between specific per-post sections.
			 */
			do_action( 'flow_ew_dashboard_after_sections', $user_id );
			?>
		</div>
		<?php
	}

	/**
	 * Reviews where the current user is the requester and the round is
	 * still in flight.
	 *
	 * Open reviews authored by the same user are stripped out — they have
	 * their own section, and the badge on each row reflects the virtual
	 * "Open Review" status, so showing them here too would duplicate the
	 * entry and confuse the column heading ("Content waiting for review
	 * from colleagues" doesn't apply to an open-link share).
	 *
	 * @param string[] $statuses
	 * @return array<int,object>
	 */
	private static function fetch_my_requests( int $user_id, array $statuses ): array {
		$out = [];
		foreach ( $statuses as $status ) {
			foreach (
				self::fetch_all_pages(
					[
						'requester_id' => $user_id,
						'status'       => $status,
					]
				) as $row
			) {
				if (
					! empty( $row->is_open )
					&& 0 === (int) ( $row->reviewer_id ?? 0 )
				) {
					continue;
				}
				if (
					Review::STATUS_APPROVED === (string) $row->status
					&& self::post_is_published( (int) $row->post_id )
				) {
					continue;
				}
				$out[ (int) $row->id ] = $row;
			}
		}
		return self::strip_orphans_and_sort( array_values( $out ) );
	}

	private static function post_is_published( int $post_id ): bool {
		$post = get_post( $post_id );
		return $post instanceof \WP_Post && 'publish' === $post->post_status;
	}

	/**
	 * Reviews where the current user is the reviewer (primary or via Pro's
	 * multi-reviewer roster — `participant_user_id` runs the same filter
	 * Pro hooks for participation lookups). Excludes the user's own
	 * requests so an item never appears twice across the two sections.
	 *
	 * @param string[] $statuses
	 * @return array<int,object>
	 */
	/**
	 * Site-wide admin notice surfacing pending reviews assigned to the viewer.
	 * Suppressed on the Flow Dashboard itself (the viewer is already there) and on
	 * Flow's own review-preview shell (a curated surface — a top-of-page banner
	 * would clash with its custom chrome). Dismissal stores the count at
	 * dismiss-time on the user, so it automatically reappears when a new review
	 * gets assigned.
	 */
	public function render_assigned_notice(): void {
		if ( ! is_user_logged_in() ) {
			return;
		}
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( $screen && in_array( $screen->id, [ 'toplevel_page_' . self::PAGE_SLUG ], true ) ) {
			return;
		}

		$user_id = get_current_user_id();
		$count   = self::count_assigned_to_me( $user_id );
		if ( $count <= 0 ) {
			return;
		}

		$dismissed_at = (int) get_user_meta( $user_id, self::NOTICE_DISMISS_META, true );
		if ( $count <= $dismissed_at ) {
			return;
		}

		$dashboard_url = admin_url( 'admin.php?page=' . self::PAGE_SLUG );
		$nonce         = wp_create_nonce( self::NOTICE_DISMISS_AJAX_ACTION );
		$message       = sprintf(
			/* translators: %d: number of reviews assigned to the current user. */
			_n(
				'You have %d review waiting for your feedback.',
				'You have %d reviews waiting for your feedback.',
				$count,
				'jumplinks-editorial-workflow'
			),
			(int) $count
		);
		?>
		<div
			class="notice notice-info is-dismissible flow-ew-assigned-notice"
			data-flow-ew-count="<?php echo esc_attr( (string) $count ); ?>"
			data-flow-ew-nonce="<?php echo esc_attr( $nonce ); ?>"
		>
			<p>
				<strong><?php esc_html_e( 'Flow', 'jumplinks-editorial-workflow' ); ?>:</strong>
				<?php echo esc_html( $message ); ?>
				<a href="<?php echo esc_url( $dashboard_url ); ?>">
					<?php esc_html_e( 'Open dashboard', 'jumplinks-editorial-workflow' ); ?>
				</a>
			</p>
		</div>
		<script>
		( function () {
			var notice = document.querySelector( '.flow-ew-assigned-notice' );
			if ( ! notice ) return;
			// WP injects the dismiss button after the notice is rendered; wait
			// one tick so the click handler binds to the real button.
			setTimeout( function () {
				var btn = notice.querySelector( '.notice-dismiss' );
				if ( ! btn ) return;
				btn.addEventListener( 'click', function () {
					var form = new FormData();
					form.append( 'action', <?php echo wp_json_encode( self::NOTICE_DISMISS_AJAX_ACTION ); ?> );
					form.append( '_ajax_nonce', notice.dataset.flowEwNonce || '' );
					form.append( 'count', notice.dataset.flowEwCount || '0' );
					fetch( <?php echo wp_json_encode( admin_url( 'admin-ajax.php' ) ); ?>, {
						method: 'POST',
						credentials: 'same-origin',
						body: form,
					} );
				} );
			}, 0 );
		} )();
		</script>
		<?php
	}

	public function ajax_dismiss_assigned_notice(): void {
		check_ajax_referer( self::NOTICE_DISMISS_AJAX_ACTION );
		$user_id = get_current_user_id();
		if ( $user_id <= 0 ) {
			wp_send_json_error( null, 403 );
		}
		$count = isset( $_POST['count'] ) ? max( 0, (int) $_POST['count'] ) : 0;
		update_user_meta( $user_id, self::NOTICE_DISMISS_META, $count );
		wp_send_json_success();
	}

	/**
	 * Number of in-flight reviews currently assigned to the user (primary reviewer
	 * or Pro multi-reviewer). Drives the admin-menu badge and is cheap enough to
	 * call on every admin page render — same query the dashboard already runs.
	 */
	public static function count_assigned_to_me( int $user_id ): int {
		if ( $user_id <= 0 ) {
			return 0;
		}
		return count(
			self::fetch_assigned_to_me(
				$user_id,
				[
					Review::STATUS_PENDING,
					Review::STATUS_IN_REVIEW,
					Review::STATUS_CHANGES_REQUESTED,
				]
			)
		);
	}

	private static function fetch_assigned_to_me( int $user_id, array $statuses ): array {
		$out = [];
		foreach ( $statuses as $status ) {
			foreach (
				self::fetch_all_pages(
					[
						'participant_user_id' => $user_id,
						'status'              => $status,
					]
				) as $row
			) {
				if ( (int) ( $row->requester_id ?? 0 ) === $user_id ) {
					continue;
				}
				$out[ (int) $row->id ] = $row;
			}
		}
		return self::strip_orphans_and_sort( array_values( $out ) );
	}

	/**
	 * Open Review is a Pro feature — when it's disabled the section never
	 * appears. The roster is global (not user-scoped): any logged-in user
	 * can see reviews that have been opened to "anyone with the link",
	 * including the requester who shared the link in the first place
	 * (their open reviews are now stripped from "My review requests" by
	 * `fetch_my_requests`, so this is the one and only surface for them).
	 *
	 * @return array<int,object>
	 */
	private static function fetch_open_reviews( int $user_id ): array {
		unset( $user_id );
		if ( ! Review::is_open_review_feature_available() ) {
			return [];
		}
		return self::strip_orphans_and_sort(
			self::fetch_all_pages(
				[
					'is_open'    => true,
					'unassigned' => true,
				]
			)
		);
	}

	/**
	 * `DB::get_reviews()` clamps `per_page` to 100 internally, so to support
	 * personal dashboards with more than 100 outstanding items we walk pages
	 * until a batch returns short.
	 *
	 * @param array<string,mixed> $args
	 * @return array<int,object>
	 */
	private static function fetch_all_pages( array $args ): array {
		$out         = [];
		$page        = 1;
		$batch_count = 0;
		do {
			$batch = DB::get_reviews(
				array_merge(
					[
						'orderby' => 'updated_at',
						'order'   => 'DESC',
					],
					$args,
					[
						'per_page' => self::PAGE_BATCH,
						'page'     => $page,
					]
				)
			);
			foreach ( $batch as $row ) {
				$out[] = $row;
			}
			$batch_count = count( $batch );
			++$page;
		} while ( self::PAGE_BATCH === $batch_count );
		return $out;
	}

	/**
	 * Drop reviews whose post is gone (orphans), still an unsaved auto-draft
	 * placeholder, or trashed — none of those are meaningful surface for
	 * the user. Then sort newest-first by `updated_at`.
	 *
	 * @param array<int,object> $rows
	 * @return array<int,object>
	 */
	private static function strip_orphans_and_sort( array $rows ): array {
		$rows = array_values(
			array_filter(
				$rows,
				static function ( $row ): bool {
					$post = get_post( (int) $row->post_id );
					if ( ! $post instanceof \WP_Post ) {
						return false;
					}
					return ! in_array( $post->post_status, [ 'auto-draft', 'trash' ], true );
				}
			)
		);
		usort(
			$rows,
			static function ( $a, $b ): int {
				return strcmp(
					(string) ( $b->updated_at ?? '' ),
					(string) ( $a->updated_at ?? '' )
				);
			}
		);
		return $rows;
	}

	/**
	 * Caller must filter out empty `$reviews` before calling — the section
	 * is unconditionally rendered with header + count.
	 *
	 * @param array<int,object> $reviews
	 * @param bool              $show_edit_link Whether each row should expose
	 *                                          an Edit link (only the "My
	 *                                          review requests" section does
	 *                                          — the viewer is the author).
	 */
	/**
	 * @param array<int,object> $reviews
	 * @param bool              $show_edit_link Whether each row exposes an Edit link.
	 * @param string            $extra_info     One of '' | 'author' | 'reviewers'. Appended to the meta line.
	 */
	private static function render_section( string $slug, string $heading, string $description, array $reviews, bool $show_edit_link = false, string $extra_info = '' ): void {
		if ( empty( $reviews ) ) {
			return;
		}
		printf(
			'<div class="flow-ew-dash-section flow-ew-dash-section--%s flow-ew-dashboard-page__section">',
			esc_attr( $slug )
		);
		printf(
			'<h2 class="flow-ew-dash-section__title">%s<span class="flow-ew-dash-section__count">%d</span></h2>',
			esc_html( $heading ),
			(int) count( $reviews )
		);
		printf(
			'<p class="flow-ew-dashboard-page__section-desc">%s</p>',
			esc_html( $description )
		);
		echo '<ul class="flow-ew-dash-list">';
		foreach ( $reviews as $review ) {
			self::render_item( $review, $show_edit_link, $extra_info );
		}
		echo '</ul>';
		echo '</div>';
	}

	private static function render_item( object $review, bool $show_edit_link = false, string $extra_info = '' ): void {
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

		$status_key   = (string) Review::display_status( $review );
		$status_label = Review::status_label( $status_key );

		// Edit link is opt-in per section (only "My review requests"
		$edit_url = ( $show_edit_link && current_user_can( 'edit_post', (int) $review->post_id ) )
			? get_edit_post_link( (int) $review->post_id, '' )
			: '';

		$extra_meta_html = self::compute_extra_meta_html( $extra_info, $review, $post );

		$meta_parts = [ esc_html( $post_type_label ) ];
		if ( '' !== $extra_meta_html ) {
			$meta_parts[] = $extra_meta_html;
		}
		if ( '' !== $relative ) {
			$meta_parts[] = esc_html( $relative );
		}

		echo '<li class="flow-ew-dash-item">';
		echo '<div class="flow-ew-dash-item__main">';
		printf(
			'<a class="flow-ew-dash-item__title" href="%s">%s</a>',
			esc_url( $url ),
			esc_html( '' !== $post->post_title ? $post->post_title : __( '(no title)', 'jumplinks-editorial-workflow' ) )
		);
		if ( $edit_url ) {
			printf(
				'<a class="flow-ew-dashboard-page__edit" href="%s">%s</a>',
				esc_url( $edit_url ),
				esc_html__( 'Edit', 'jumplinks-editorial-workflow' )
			);
		}
		echo '<span class="flow-ew-dash-item__meta">';
		// Parts are pre-escaped; the separator is a static HTML entity.
		echo implode( ' &middot; ', $meta_parts ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo '</span>';
		echo '</div>';
		printf(
			'<span class="flow-ew-dashboard-page__status flow-ew-dashboard-page__status--%s"><span class="flow-ew-status-pill__dot" aria-hidden="true"></span>%s</span>',
			esc_attr( $status_key ),
			esc_html( $status_label )
		);
		echo '</li>';
	}

	/**
	 * Build the extra-meta HTML fragment (already escaped). For 'author' returns
	 * "by Jane Doe"; for 'reviewers' returns "Reviewer: Jane" / "Reviewers: Jane,
	 * John, Mira". Caller embeds the return value directly inside the meta line,
	 * NOT through `esc_html`.
	 */
	private static function compute_extra_meta_html( string $kind, object $review, \WP_Post $post ): string {
		if ( 'author' === $kind ) {
			$author = get_userdata( (int) $post->post_author );
			if ( ! $author instanceof \WP_User ) {
				return '';
			}
			return sprintf(
				/* translators: %s: author display name. */
				esc_html__( 'by %s', 'jumplinks-editorial-workflow' ),
				esc_html( $author->display_name )
			);
		}
		if ( 'reviewers' === $kind ) {
			$ids = [];
			if ( (int) ( $review->reviewer_id ?? 0 ) > 0 ) {
				$ids[] = (int) $review->reviewer_id;
			}
			$ids   = array_values(
				array_unique(
					array_map( 'intval', (array) apply_filters( 'flow_ew_review_reviewer_ids', $ids, $review ) )
				)
			);
			$names = [];
			foreach ( $ids as $uid ) {
				$user = get_userdata( $uid );
				if ( $user instanceof \WP_User ) {
					$names[] = esc_html( $user->display_name );
				}
			}
			if ( empty( $names ) ) {
				return '';
			}
			$label = _n(
				'Reviewer:',
				'Reviewers:',
				count( $names ),
				'jumplinks-editorial-workflow'
			);
			return esc_html( $label ) . ' ' . implode( ', ', $names );
		}
		return '';
	}

	/**
	 * Base64-encoded SVG for the admin menu icon. Rendered via `mask-image` +
	 * `background-color: currentColor` (see `output_menu_icon_css`), so the
	 * SVG only needs opaque paths — the fill colour itself is irrelevant
	 * because masks key off the alpha channel.
	 */
	private static function get_menu_icon_data_uri(): string {
		$svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M15.56,7.62c.65-.11,1.07-.19,1.07-.19.19-.03.37-.14.49-.32l1.53-2.17c.25-.36.16-.86-.21-1.11-.13-.09-.28-.13-.43-.13-.25,0-.5.12-.66.35l-1.3,1.95-1.22.21c-.25.04-.32.37-.1.51.6.4.8.83.83.88Z"/><path d="M6.01,11.32c.24,0,.48-.11.66-.37l1.28-2.01c.26-.04.67-.11,1.16-.2l.07-.41c.04-.26.11-.51.2-.73.08-.2-.1-.41-.31-.38l-1.7.29c-.19.03-.37.14-.49.31,0,.01-1.54,2.22-1.55,2.23-.42.64.12,1.27.68,1.27Z"/><path d="M9.73,17.56l-2.21,1.63c-1.02-.82-3.25-2.6-3.25-2.6-.18-.13-.35-.19-.52-.19-.68,0-1.19.92-.52,1.49l3.75,3c.15.12.34.19.52.19.18,0,.35-.06.5-.17l3.24-2.47c.2-.15.12-.46-.13-.5-.04,0-.09-.01-.13-.02-.47-.08-.89-.2-1.25-.37Z"/><path d="M20.77,15.85s-3.8-2.94-3.8-2.94c-.13-.1-.3-.16-.46-.16s-.31.05-.45.15l-.88.65h0s-.14.85-.25,1.49c-.04.25.25.42.45.27l1.11-.85c.99.82,3.26,2.7,3.27,2.71.17.12.35.18.51.18.68,0,1.18-.93.5-1.49Z"/><path d="M15.1,9.4c.05-.31.06-.63-.01-.94-.03-.12-.07-.24-.12-.36-.06-.12-.13-.23-.22-.34-.34-.42-.94-.76-1.91-.93-.28-.05-.55-.07-.81-.07-1.06,0-1.9.44-2.11,1.69l-.25,1.51c.43-.3.97-.46,1.61-.49l.06-.36.04-.22c.01-.06.02-.12.04-.17.11-.33.37-.49.8-.49.12,0,.26.01.41.04.21.03.38.08.52.15.17.08.3.19.38.32.09.15.11.32.08.53l-.1.59-.06.38-.06.38h0s-.19,1.12-.19,1.12c-.03.19-.1.34-.21.44-.08.08-.2.14-.33.18-.1.02-.2.04-.32.04h0c-.14,0-.31-.02-.45-.05s-.31.07-.33.23l-.18,1.09c.17.04.74.12.74.12.13.01.26.02.38.02,0,0,.24,0,.38-.02,1.02-.11,1.51-.68,1.72-1.34h0c.04-.13.07-.27.09-.4l.1-.59h0s.1-.59.1-.59l.25-1.47Z"/><path d="M12.67,5.46l.41.07.41.07c.34.06.62.02.84-.12.21-.14.35-.36.4-.68l.08-.5.08-.5c.05-.31,0-.57-.16-.77-.16-.2-.41-.33-.75-.39l-.41-.07-.41-.07c-.72-.12-1.13.15-1.24.8l-.08.5-.08.5c-.11.65.19,1.04.91,1.16Z"/><path d="M13.28,14.48c-.18.04-.37.06-.56.07l-.07.39-.03.2c-.03.19-.1.33-.21.44,0,0,0,0,0,0,0,0,0,0,0,0-.04.04-.08.07-.13.1h0c-.13.07-.3.11-.51.11-.08,0-.16,0-.25-.02-.04,0-.09-.01-.13-.02-.13-.02-.25-.05-.36-.08-.5-.16-.69-.45-.62-.91l.41-2.48c.03-.19.1-.34.2-.44.08-.09.19-.15.33-.19.09-.02.19-.03.31-.03h.03c.14,0,.31.02.46.05s.3-.07.33-.23l.18-1.09c-.12-.03-.25-.06-.39-.08-.12-.02-.23-.04-.35-.05,0,0,0,0,0,0-.13-.01-.25-.02-.38-.02-.03,0-.05,0-.08,0-.1,0-.2,0-.3.01-.83.07-1.48.46-1.74,1.36h0c-.03.1-.05.2-.07.31l-.47,2.81c-.16.95.17,1.57.79,1.97.11.07.23.14.36.2.13.06.27.11.42.16.21.06.43.11.66.15.29.05.56.07.8.07.61,0,1.05-.14,1.38-.37.03-.02.06-.04.08-.06h0c.42-.34.62-.82.71-1.32l.25-1.48c-.3.22-.65.37-1.05.45h0Z"/></svg>';
		return 'data:image/svg+xml;base64,' . base64_encode( $svg ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- encoding inline SVG for use in a data URI; no obfuscation intent.
	}
}
