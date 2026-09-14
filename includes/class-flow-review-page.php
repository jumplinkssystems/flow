<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ReviewPage {

	private int $preview_review_id = 0;

	private static function read_request_int( string $key, int $fallback = 0 ): int {
		$from_query = (int) get_query_var( $key, 0 );
		if ( $from_query > 0 ) {
			return $from_query;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- signed preview-token flow validates these params separately.
		if ( isset( $_GET[ $key ] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- signed preview-token flow validates these params separately.
			return absint( wp_unslash( $_GET[ $key ] ) );
		}
		return $fallback;
	}

	private static function read_request_text( string $key, string $fallback = '' ): string {
		$from_query = (string) get_query_var( $key, '' );
		if ( '' !== $from_query ) {
			return $from_query;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- signed preview-token flow validates these params separately.
		if ( isset( $_GET[ $key ] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- signed preview-token flow validates these params separately.
			return sanitize_text_field( wp_unslash( (string) $_GET[ $key ] ) );
		}
		return $fallback;
	}

	private static function is_breakdance_managed_post( int $post_id ): bool {
		if ( $post_id <= 0 ) {
			return false;
		}
		$data = get_post_meta( $post_id, '_breakdance_data', true );
		return is_string( $data ) && '' !== trim( $data );
	}

	public function boot(): void {
		add_filter( 'query_vars', [ $this, 'add_query_vars' ] );
		add_action( 'pre_get_posts', [ $this, 'prime_main_query_for_flow_preview' ], 1 );
		add_action( 'template_redirect', [ $this, 'handle_review_preview' ], 5 );
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_preview_assets' ] );
		add_filter( 'woocommerce_coming_soon_exclude', [ $this, 'exclude_woocommerce_coming_soon_for_flow_preview' ] );
	}

	/**
	 * @return object|null Review row when GET params are a valid preview for the logged-in user.
	 */
	private static function get_validated_flow_preview_from_request(): ?object {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- public preview URL query args, verified via signed token below.
		$review_id = isset( $_GET['flow_review_id'] ) ? absint( wp_unslash( $_GET['flow_review_id'] ) ) : 0;
		if ( ! $review_id ) {
			return null;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$token = isset( $_GET['flow_token'] ) ? sanitize_text_field( wp_unslash( (string) $_GET['flow_token'] ) ) : '';
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$token_ts = isset( $_GET['flow_token_ts'] ) ? absint( wp_unslash( $_GET['flow_token_ts'] ) ) : 0;

		if ( ! Review::verify_preview_token( $review_id, $token, $token_ts ) ) {
			return null;
		}

		$review = DB::get_review( $review_id );
		if ( ! $review ) {
			return null;
		}

		if ( ! is_user_logged_in() ) {
			$allow_anonymous = (bool) \apply_filters( 'flow_ew_allow_anonymous_review_access', false, $review );
			if ( ! $allow_anonymous ) {
				return null;
			}
		}

		if ( ! self::user_can_view_review_preview( $review, get_current_user_id() ) ) {
			return null;
		}

		return $review;
	}

	/**
	 * Lets reviewers see real product/content when WooCommerce “Coming soon” would otherwise replace the template.
	 *
	 * @param bool $excluded Prior exclusion state from other callbacks.
	 */
	public function exclude_woocommerce_coming_soon_for_flow_preview( bool $excluded ): bool {
		if ( $excluded ) {
			return true;
		}

		return null !== self::get_validated_flow_preview_from_request();
	}

	/**
	 * @param object $review Row from flow_reviews.
	 */
	private static function user_can_view_review_preview( object $review, int $user_id ): bool {
		$post      = get_post( (int) $review->post_id );
		$post_type = ( $post instanceof \WP_Post ) ? $post->post_type : '';

		if ( $user_id > 0 ) {
			if ( '' !== $post_type && ! Settings::is_post_type_supported( $post_type ) ) {
				if ( ! ( Settings::is_debug_mode() && user_can( $user_id, 'manage_options' ) ) ) {
					return false;
				}
			}
			if ( Review::can_user_access_as_participant_or_open( $review, $user_id ) ) {
				return true;
			}
			if ( $post instanceof \WP_Post && (int) $post->post_author === $user_id ) {
				return true;
			}
			if ( Settings::is_debug_mode() && user_can( $user_id, 'manage_options' ) ) {
				return true;
			}
		}

		return (bool) \apply_filters( 'flow_ew_user_can_view_review_preview', false, $review, $user_id );
	}

	public function prime_main_query_for_flow_preview( \WP_Query $query ): void {
		if ( is_admin() || ! $query->is_main_query() ) {
			return;
		}

		$review = self::get_validated_flow_preview_from_request();
		if ( ! $review ) {
			return;
		}

		$post_id   = (int) $review->post_id;
		$post_type = get_post_type( $post_id );

		if ( $post_id <= 0 ) {
			return;
		}

		$post_status = get_post_status( $post_id );
		if ( ! is_string( $post_status ) || '' === $post_status ) {
			return;
		}

		if ( 'page' === $post_type ) {
			$query->set( 'page_id', $post_id );
			$query->set( 'p', 0 );
			$query->set( 'post_type', 'page' );
		} else {
			$query->set( 'p', $post_id );
			$query->set( 'page_id', 0 );
			$query->set( 'post_type', $post_type ?: 'any' );
		}
		$query->set( 'post_status', $post_status );
	}

	public function add_query_vars( array $vars ): array {
		$vars[] = 'flow_token';
		$vars[] = 'flow_token_ts';
		$vars[] = 'flow_review_id';
		$vars[] = 'flow_revision_id';
		$vars[] = 'flow_embed';
		return $vars;
	}

	public function handle_review_preview(): void {
		$review_id = self::read_request_int( 'flow_review_id' );
		if ( ! $review_id ) {
			return;
		}

		$review = self::authorize_preview_request( $review_id );

		self::send_frame_ancestors_headers();
		// Per-review, per-session output: never store it in a page cache.
		Page_Cache::mark_response_uncacheable();
		remove_action( 'template_redirect', 'redirect_canonical' );

		global $wp_query;
		if ( $wp_query instanceof \WP_Query && $wp_query->is_404() ) {
			$wp_query->is_404      = false;
			$wp_query->is_singular = true;
			status_header( 200 );
		}

		$is_embed = (bool) get_query_var( 'flow_embed', false );
		// Breakdance wraps templates through a high-priority template_include filter.
		// Disable it only for the outer review shell (non-embed) so it cannot
		// strip Flow's shell assets; keep it enabled for embed URLs so Breakdance
		// content rendering still works inside the iframe.
		if ( ! $is_embed ) {
			remove_filter(
				'template_include',
				'Breakdance\\ActionsFilters\\template_include',
				1000000
			);
		}

		show_admin_bar( false );
		// Remove the admin-bar bump CSS too (it stays even after show_admin_bar(false)).
		remove_action( 'wp_head', '_admin_bar_bump_cb' );

		$snapshot = self::resolve_snapshot( $review );

		if ( $is_embed ) {
			if ( ! self::is_breakdance_managed_post( (int) $review->post_id ) ) {
				$this->setup_embed_mode( $snapshot, $review );
			}
		} else {
			add_filter(
				'body_class',
				static function ( array $classes ): array {
					$classes[] = 'flow-review-page';
					return $classes;
				}
			);
			add_filter(
				'template_include',
				static function (): string {
					return (string) apply_filters(
						'flow_ew_review_template',
						FLOW_EW_PLUGIN_DIR . 'templates/review-preview.php'
					);
				},
				PHP_INT_MAX
			);

			add_action( 'wp_enqueue_scripts', [ $this, 'dequeue_theme_assets_for_shell' ], PHP_INT_MAX );
		}

		$this->preview_review_id = $is_embed ? 0 : $review_id;
	}

	/**
	 * The review shell and its embed carry approve / comment actions behind
	 * a cookie session, so only this site may frame them. The shell's own
	 * iframe is same-origin and stays allowed.
	 */
	public static function send_frame_ancestors_headers(): void {
		if ( headers_sent() ) {
			return;
		}
		send_frame_options_header();
		header( "Content-Security-Policy: frame-ancestors 'self'" );
	}

	/**
	 * Validate the signed link, load the review, and enforce access. Dies or
	 * redirects to login on failure, so callers only ever see a viewable review.
	 */
	private static function authorize_preview_request( int $review_id ): object {
		$token    = self::read_request_text( 'flow_token' );
		$token_ts = self::read_request_int( 'flow_token_ts' );
		if ( ! Review::verify_preview_token( $review_id, $token, $token_ts ) ) {
			wp_die( esc_html__( 'Invalid or expired review link.', 'jumplinks-editorial-workflow' ), 403 );
		}

		$review = DB::get_review( $review_id );
		if ( ! $review ) {
			wp_die( esc_html__( 'Review not found.', 'jumplinks-editorial-workflow' ), 404 );
		}

		if ( ! is_user_logged_in() && ! (bool) \apply_filters( 'flow_ew_allow_anonymous_review_access', false, $review ) ) {
			wp_safe_redirect( wp_login_url( Review::get_preview_url( $review_id, 0, (int) $review->post_id ) ) );
			exit;
		}

		if ( ! self::user_can_view_review_preview( $review, get_current_user_id() ) ) {
			wp_die( esc_html__( 'You do not have permission to view this review.', 'jumplinks-editorial-workflow' ), 403 );
		}
		return $review;
	}

	/**
	 * The revision to render: the review's stored snapshot, unless the link
	 * points at another revision of the same post (`?flow_revision_id=N`, used
	 * by the bar's "View latest").
	 */
	private static function resolve_snapshot( object $review ): ?\WP_Post {
		$snapshot_id = (int) ( $review->revision_id ?? 0 );
		$snapshot    = $snapshot_id ? wp_get_post_revision( $snapshot_id ) : null;

		$override_rev_id = self::read_request_int( 'flow_revision_id' );
		if ( $override_rev_id && $override_rev_id !== $snapshot_id ) {
			$candidate = wp_get_post_revision( $override_rev_id );
			if ( $candidate && (int) $candidate->post_parent === (int) $review->post_id ) {
				return $candidate;
			}
		}
		return $snapshot instanceof \WP_Post ? $snapshot : null;
	}

	private function setup_embed_mode( ?\WP_Post $snapshot, object $review ): void {
		$post_type    = get_post_type( (int) $review->post_id );
		$simple_types = [ 'post', 'page' ];
		if ( ! in_array( $post_type, $simple_types, true ) ) {
			return;
		}

		$source = $snapshot ?? get_post( (int) $review->post_id );
		if ( ! $source instanceof \WP_Post ) {
			return;
		}

		$body_content   = $source->post_content;
		$body_title     = $source->post_title;
		$review_post_id = (int) $review->post_id;

		add_filter(
			'the_title',
			static function ( $title, $post_id = 0 ) use ( $body_title, $review_post_id ) {
				return (int) $post_id === $review_post_id ? (string) $body_title : $title;
			},
			1,
			2
		);

		add_filter(
			'the_content',
			static function ( $content ) use ( $body_content, $review_post_id ) {
				$current = (int) ( function_exists( 'get_the_ID' ) ? get_the_ID() : 0 );
				if ( ! $current ) {
					$global_post = $GLOBALS['post'] ?? null;
					if ( $global_post instanceof \WP_Post ) {
						$current = (int) $global_post->ID;
					}
				}
				return $current === $review_post_id ? wp_kses_post( (string) $body_content ) : $content;
			},
			1
		);
	}

	public function enqueue_preview_assets(): void {
		if ( ! $this->preview_review_id ) {
			return;
		}

		$asset_file = FLOW_EW_PLUGIN_DIR . 'build/review-page/index.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset      = require $asset_file;
		$js_suffix  = Assets::webpack_build_suffix( FLOW_EW_PLUGIN_DIR . 'build/review-page/index', 'js' );
		$css_suffix = Assets::webpack_build_suffix( FLOW_EW_PLUGIN_DIR . 'build/review-page/style-index', 'css' );

		Assets::shield_front_end_spa();
		Assets::ensure_react_jsx_runtime_registered();

		wp_enqueue_script(
			'flow-ew-review-page',
			FLOW_EW_PLUGIN_URL . 'build/review-page/index' . $js_suffix . '.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations(
			'flow-ew-review-page',
			'jumplinks-editorial-workflow',
			FLOW_EW_PLUGIN_DIR . 'languages'
		);

		wp_enqueue_style(
			'flow-ew-review-page',
			FLOW_EW_PLUGIN_URL . 'build/review-page/style-index' . $css_suffix . '.css',
			[ 'wp-components' ],
			Assets::style_version( FLOW_EW_PLUGIN_DIR . 'build/review-page/style-index' . $css_suffix . '.css', (string) $asset['version'] )
		);
		wp_add_inline_style( 'flow-ew-review-page', Assets::get_admin_theme_inline_css() );

		$review           = DB::get_review( $this->preview_review_id );
		$post_id          = $review ? (int) $review->post_id : 0;
		$flow_revision_id = self::read_request_int( 'flow_revision_id' );

		$base_embed_url = ( $review && $post_id > 0 )
			? Review::get_preview_url( $this->preview_review_id, $flow_revision_id, $post_id )
			: home_url( '/' );

		$iframe_url = add_query_arg( [ 'flow_embed' => '1' ], $base_embed_url );

		$localized_data = apply_filters(
			'flow_ew_review_page_data',
			array_merge(
				$this->get_review_page_data( $this->preview_review_id ),
				[ 'contentOnlyUrl' => $iframe_url ]
			),
			$review
		);

		wp_localize_script(
			'flow-ew-review-page',
			'flowReviewPage',
			$localized_data
		);

		$this->enqueue_link_blocking();
	}

	/**
	 * Strip theme / third-party front-end scripts and styles from the parent
	 * review-preview shell. Runs late on `wp_enqueue_scripts` so it sees
	 * everything the theme and other plugins queued. The iframe inside still loads
	 * the real singular template at full fidelity, so theme assets are only
	 * suppressed on the outer shell. Customisable via the
	 * `flow_ew_review_shell_keep_handles` filter — extensions can append their own
	 * handle prefixes when they need to render something on the shell.
	 */
	public function dequeue_theme_assets_for_shell(): void {
		$keep_prefixes = [ 'flow-', 'wp-', 'jquery', 'react', 'regenerator', 'lodash' ];

		/**
		 * Allowlist of script/style handle prefixes to keep on the review
		 * shell. A handle is kept if it equals or starts with any prefix
		 * in the list; anything else is dequeued.
		 *
		 * @param string[] $keep_prefixes
		 */
		$keep_prefixes = (array) \apply_filters( 'flow_ew_review_shell_keep_handles', $keep_prefixes );

		$is_kept = static function ( string $handle ) use ( $keep_prefixes ): bool {
			foreach ( $keep_prefixes as $prefix ) {
				$prefix = (string) $prefix;
				if ( '' === $prefix ) {
					continue;
				}
				// strpos check rather than str_starts_with — plugin still supports PHP 7.4.
				if ( $handle === $prefix || 0 === strpos( $handle, $prefix ) ) {
					return true;
				}
			}
			return false;
		};

		foreach ( [ wp_scripts(), wp_styles() ] as $registry ) {
			if ( empty( $registry->queue ) ) {
				continue;
			}
			foreach ( (array) $registry->queue as $handle ) {
				if ( ! $is_kept( (string) $handle ) ) {
					$registry->dequeue( $handle );
				}
			}
		}
	}

	/**
	 * Block navigation away from the review shell on real URLs only; see
	 * preview-link-guard.js for iframe parity.
	 */
	private function enqueue_link_blocking(): void {
		wp_add_inline_script(
			'flow-ew-review-page',
			'(function(){
				function flowEwShouldBlockNavAnchor(a) {
					if (!a || a.target === "_blank") return false;
					var href = (a.getAttribute("href") || "").trim();
					if (!href) return false;
					var h = href.toLowerCase();
					if (h === "#" || href.charAt(0) === "#") return false;
					if (h.indexOf("javascript:") === 0) return false;
					if (h.indexOf("mailto:") === 0 || h.indexOf("tel:") === 0 || h.indexOf("sms:") === 0) return false;
					if (h.indexOf("data:") === 0) return false;
					return true;
				}
				function flowEwIsInsideFlowChrome(e) {
					var chromeHostIds = {
						"flow-bar-host": true,
						"flow-sidebar-host": true,
						"flow-activity-sidebar-host": true,
						"flow-inline-popover-host": true
					};
					var path = e.composedPath ? e.composedPath() : [];
					for (var i = 0; i < path.length; i++) {
						var id = path[i] && path[i].id;
						if (id && chromeHostIds[id]) return true;
						var cl = path[i] && path[i].classList;
						if (cl && cl.contains("components-popover")) return true;
					}
					// Shadow DOM retargets `e.target` to the host on document
					// listeners — treat those clicks as in-chrome too.
					var targetId = e.target && e.target.id;
					if (targetId && chromeHostIds[targetId]) return true;
					return false;
				}
				function flowEwOnPointerNav(e) {
					if (e.ctrlKey || e.metaKey) return;
					if (flowEwIsInsideFlowChrome(e)) return;
					var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
					if (!flowEwShouldBlockNavAnchor(a)) return;
					e.preventDefault();
					if (e.type === "click") e.stopPropagation();
				}
				document.addEventListener("click", flowEwOnPointerNav, true);
				document.addEventListener("auxclick", function(e) {
					if (e.button !== 1) return;
					flowEwOnPointerNav(e);
				}, true);
			}());',
			'after'
		);
	}

	private function get_review_page_data( int $review_id ): array {
		$current_user_id = get_current_user_id();
		$current_user    = wp_get_current_user();

		$base = [
			'restUrl'            => rest_url( 'flow/v1' ),
			'nonce'              => wp_create_nonce( 'wp_rest' ),
			'debugMode'          => Settings::is_debug_mode(),
			'currentUserIsAdmin' => current_user_can( 'manage_options' ),
			'currentUserId'      => $current_user_id,
			// Seconds between comment sync polls; 0 turns polling off.
			'syncInterval'       => max( 0, (int) apply_filters( 'flow_ew_comment_sync_interval', 15 ) ),
		];

		$review = $review_id ? DB::get_review( $review_id ) : null;
		if ( ! $review ) {
			return self::error_payload( $base, __( 'Review not found.', 'jumplinks-editorial-workflow' ) );
		}
		if ( ! self::user_can_view_review_preview( $review, $current_user_id ) ) {
			return self::error_payload(
				$base,
				__( 'You do not have permission to view this review.', 'jumplinks-editorial-workflow' ),
				(int) $review->reviewer_id
			);
		}

		$post          = get_post( (int) $review->post_id );
		$is_author     = ( $post instanceof \WP_Post ) && ( (int) $post->post_author === $current_user_id );
		$revision_id   = (int) ( $review->revision_id ?? 0 );
		$snapshot      = self::snapshot_payload( $review, $revision_id );
		$comment_lists = Comment_Presenter::list_for_review( $review );
		$review_state  = self::review_state_payload( $review, self::viewing_revision_id( $review ) );

		// Surface the actors + timestamps the Activity sidebar needs to
		// build its v1 timeline (request, current decision, resubmits).
		$requester_user = get_userdata( (int) $review->requester_id );
		$reviewer_user  = get_userdata( (int) $review->reviewer_id );

		return array_merge(
			$base,
			[
				'reviewId'                => (int) $review->id,
				'postTitle'               => $snapshot['title'],
				'postTypeLabel'           => self::get_post_type_singular_label( (int) $review->post_id ),
				'postContent'             => '',
				'snapshotLabel'           => $snapshot['label'],
				'wpLogoUrl'               => self::get_wp_logo_url(),
				'postEditUrl'             => (string) ( get_edit_post_link( (int) $review->post_id, 'raw' ) ?: '' ),
				'postUrl'                 => (string) get_permalink( (int) $review->post_id ),
				'currentUserId'           => (int) $current_user->ID,
				'currentUserName'         => ( '' !== $current_user->display_name ) ? $current_user->display_name : $current_user->user_login,
				'currentUserIsPostAuthor' => $is_author,
				'comments'                => $comment_lists['comments'],
				'inlineComments'          => $comment_lists['inlineComments'],
				'commentsVersion'         => $comment_lists['commentsVersion'],
				'reviewerId'              => (int) $review->reviewer_id,
				'reviewerName'            => $reviewer_user ? $reviewer_user->display_name : '',
				'requesterId'             => (int) $review->requester_id,
				'requesterName'           => $requester_user ? $requester_user->display_name : '',
				'reviewCreatedAt'         => (string) ( $review->created_at ?? '' ),
			],
			$review_state
		);
	}

	/**
	 * Payload for a review page that cannot render: same keys the UI reads, empty.
	 *
	 * @param array<string,mixed> $base
	 * @return array<string,mixed>
	 */
	private static function error_payload( array $base, string $message, int $reviewer_id = 0 ): array {
		return array_merge(
			$base,
			[
				'reviewId'                => 0,
				'status'                  => '',
				'error'                   => $message,
				'postTitle'               => '',
				'postTypeLabel'           => '',
				'postContent'             => '',
				'snapshotLabel'           => '',
				'canAct'                  => false,
				'currentUserIsPostAuthor' => false,
				'currentUserCanResubmit'  => false,
				'reviewerId'              => $reviewer_id,
				'postEditUrl'             => '',
			]
		);
	}

	/**
	 * Content shown on the review page: the stored revision when there is one,
	 * otherwise the live post.
	 *
	 * The content itself is rendered once, by the iframe; `postContent` in the
	 * script data stays empty because the SPA never read it.
	 *
	 * @return array{title:string,label:string}
	 */
	private static function snapshot_payload( object $review, int $revision_id ): array {
		$revision = $revision_id ? wp_get_post_revision( $revision_id ) : null;
		if ( $revision ) {
			return [
				'title' => $revision->post_title,
				'label' => self::snapshot_label( $review, strtotime( $revision->post_modified_gmt . ' UTC' ) ),
			];
		}
		$post = get_post( (int) $review->post_id );
		$ts   = strtotime( (string) ( $review->updated_at ?? '' ) . ' UTC' );
		return [
			'title' => $post ? $post->post_title : '',
			'label' => $ts > 0 ? self::snapshot_label( $review, $ts ) : '',
		];
	}

	private static function snapshot_label( object $review, $timestamp ): string {
		$requester = get_userdata( (int) $review->requester_id );
		$date      = (string) wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), $timestamp ?: null );
		return sprintf(
			/* translators: 1: date/time 2: author name */
			__( 'Review submitted on %1$s by %2$s.', 'jumplinks-editorial-workflow' ),
			$date,
			$requester ? $requester->display_name : __( 'Unknown', 'jumplinks-editorial-workflow' )
		);
	}


	/**
	 * Whether the previewed revision is still the newest one.
	 *
	 * @return array{0:string|null,1:string} [status, latest revision URL when outdated]
	 */
	/**
	 * The fields that change as a review moves: status, what the viewer may do
	 * about it, and whether the previewed revision is still current. The
	 * bootstrap and the sync endpoint both build them here so they cannot drift.
	 *
	 * @return array<string,mixed>
	 */
	public static function review_state_payload( object $review, ?int $viewing_revision_id = null ): array {
		$current_user_id = get_current_user_id();
		$is_reviewer     = $current_user_id > 0
			&& (
				(int) $review->reviewer_id === $current_user_id
				|| (bool) \apply_filters( 'flow_ew_is_review_participant', false, $review, $current_user_id )
			);
		$post            = get_post( (int) $review->post_id );
		$is_author       = ( $post instanceof \WP_Post ) && ( (int) $post->post_author === $current_user_id );

		$revision_id                          = null !== $viewing_revision_id
			? $viewing_revision_id
			: (int) ( $review->revision_id ?? 0 );
		[ $revision_status, $latest_rev_url ] = self::revision_state( $review, $revision_id );

		return [
			'revisionId'             => $revision_id,
			'status'                 => (string) ( $review->status ?? '' ),
			'displayStatus'          => Review::display_status( $review ),
			'canAct'                 => $is_reviewer && Review::user_can_be_reviewer( $current_user_id ),
			'currentUserCanResubmit' => $is_author,
			'reviewUpdatedAt'        => (string) ( $review->updated_at ?? '' ),
			'reviewIteration'        => (int) ( $review->iteration ?? 1 ),
			'revisionStatus'         => $revision_status,
			'latestRevisionUrl'      => $latest_rev_url,
		];
	}

	/** The revision this request is actually showing: the URL wins over the stored one. */
	public static function viewing_revision_id( object $review ): int {
		$from_url = (int) get_query_var( 'flow_revision_id', 0 );
		return $from_url ?: (int) ( $review->revision_id ?? 0 );
	}

	private static function revision_state( object $review, int $effective_rev ): array {
		if ( $effective_rev ) {
			$revisions     = wp_get_post_revisions( (int) $review->post_id, [ 'numberposts' => 1 ] );
			$latest_rev_id = ! empty( $revisions ) ? (int) reset( $revisions )->ID : 0;
			if ( 0 === $latest_rev_id || $effective_rev === $latest_rev_id ) {
				return [ 'latest', '' ];
			}
			return [
				'outdated',
				add_query_arg( 'flow_revision_id', $latest_rev_id, Review::get_preview_url( (int) $review->id, 0, (int) $review->post_id ) ),
			];
		}
		if ( get_post( (int) $review->post_id ) instanceof \WP_Post ) {
			// No revision snapshot (e.g. product types without revisions) — preview shows current post.
			return [ 'latest', '' ];
		}
		return [ null, '' ];
	}

	private static function get_wp_logo_url(): string {
		if ( is_user_logged_in() ) {
			return admin_url( 'admin.php?page=' . Dashboard_Page::PAGE_SLUG );
		}
		return 'https://jumplinks.net';
	}

	private static function get_post_type_singular_label( int $post_id ): string {
		$slug = get_post_type( $post_id );
		if ( ! $slug ) {
			return __( 'Post', 'jumplinks-editorial-workflow' );
		}
		$obj = get_post_type_object( $slug );
		if ( $obj && isset( $obj->labels->singular_name ) && '' !== $obj->labels->singular_name ) {
			return $obj->labels->singular_name;
		}
		return __( 'Post', 'jumplinks-editorial-workflow' );
	}
}
