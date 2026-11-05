<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * "Dashboard" subpage under the Flow top-level menu. Two tabs: Waiting for
 * my feedback (reviews the user is a reviewer on, plus other people's open
 * reviews) and My sent reviews (reviews the user requested). A tab with no
 * rows is hidden, and the page opens on the one that has some. Each tab is
 * one list of page, open and (Pro) site reviews, filtered by status bucket,
 * type and person through GET parameters, 20 rows per page. Rows come from
 * Dashboard_Rows.
 */
class Dashboard_Page {

	const PAGE_SLUG                     = 'flow-ew-dashboard';
	const PER_PAGE                      = 20;
	const NOTICE_DISMISS_META           = 'flow_ew_assigned_notice_dismissed_count';
	const NOTICE_DISMISS_AJAX_ACTION    = 'flow_ew_dismiss_assigned_notice';
	const OPTION_INSTALLED_AT           = 'flow_ew_installed_at';
	const RATING_PROMPT_AFTER_DAYS      = 7;
	const RATING_PROMPT_AFTER_APPROVALS = 5;

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
		$label   = __( 'Dashboard', 'jumplinks-editorial-workflow' );
		if ( $pending > 0 ) {
			$label .= sprintf(
				' <span class="awaiting-mod count-%1$d"><span class="pending-count">%2$s</span></span>',
				(int) $pending,
				esc_html( number_format_i18n( $pending ) )
			);
		}

		add_menu_page(
			__( 'Flow', 'jumplinks-editorial-workflow' ),
			__( 'Flow', 'jumplinks-editorial-workflow' ),
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
			$label,
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
			[ Assets::status_tokens_handle() ],
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

		$js_path = FLOW_EW_PLUGIN_DIR . 'assets/js/dashboard-page.js';
		wp_enqueue_script(
			'flow-ew-dashboard-page',
			FLOW_EW_PLUGIN_URL . 'assets/js/dashboard-page.js',
			[],
			file_exists( $js_path ) ? (string) filemtime( $js_path ) : $fallback,
			true
		);
		wp_localize_script(
			'flow-ew-dashboard-page',
			'flowEwDashboard',
			[
				'restUrl' => esc_url_raw( rest_url( 'flow/v1/reviews/' ) ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
				'i18n'    => [
					'working'      => __( 'Working…', 'jumplinks-editorial-workflow' ),
					'genericError' => __( 'Something went wrong. Please try again.', 'jumplinks-editorial-workflow' ),
				],
			]
		);
	}

	public function render(): void {
		if ( ! is_user_logged_in() ) {
			return;
		}
		$user_id = get_current_user_id();
		?>
		<div class="wrap flow-ew-dashboard-page">
			<h1 class="wp-heading-inline"><?php esc_html_e( 'Flow Dashboard', 'jumplinks-editorial-workflow' ); ?></h1>
			<?php self::render_rating_prompt(); ?>
			<?php
			if ( Settings::is_solo_mode() ) {
				self::render_self_reviews( $user_id );
			} else {
				$tabs    = [
					Dashboard_Rows::TAB_RECEIVED => Dashboard_Rows::for_tab( Dashboard_Rows::TAB_RECEIVED, $user_id ),
					Dashboard_Rows::TAB_SENT     => Dashboard_Rows::for_tab( Dashboard_Rows::TAB_SENT, $user_id ),
				];
				$has_any = [] !== $tabs[ Dashboard_Rows::TAB_RECEIVED ] || [] !== $tabs[ Dashboard_Rows::TAB_SENT ];
				if ( ! $has_any && current_user_can( 'edit_posts' ) ) {
					self::render_first_review_steps();
				} elseif ( ! $has_any ) {
					printf(
						'<p class="flow-ew-dash-empty flow-ew-dashboard-page__empty">%s</p>',
						esc_html__( 'Nothing is waiting on you, and you haven’t sent anything for review yet.', 'jumplinks-editorial-workflow' )
					);
				} else {
					self::render_board( $tabs );
				}
			}

			/** Slot for add-ons to print extra sections after the review list. */
			do_action( 'flow_ew_dashboard_after_sections', $user_id );
			?>
		</div>
		<?php
	}

	/**
	 * Tabs, filters, the current page of rows and pagination.
	 *
	 * @param array<string,array<int,array<string,mixed>>> $tabs Rows keyed by tab.
	 */
	private static function render_board( array $tabs ): void {
		$present = [];
		foreach ( [ Dashboard_Rows::TAB_RECEIVED, Dashboard_Rows::TAB_SENT ] as $tab ) {
			if ( [] !== $tabs[ $tab ] ) {
				$present[] = $tab;
			}
		}
		// One list only: open that one and skip the tab bar. Both: prefer
		// feedback that is still waiting, unless the query picked a tab.
		$default = Dashboard_Rows::TAB_SENT;
		if ( 1 === count( $present ) ) {
			$default = $present[0];
		} elseif ( self::count_bucket( $tabs[ Dashboard_Rows::TAB_RECEIVED ], Dashboard_Rows::BUCKET_IN_REVIEW ) > 0 ) {
			$default = Dashboard_Rows::TAB_RECEIVED;
		}
		$view = self::current_view( $default );
		if ( ! in_array( $view['tab'], $present, true ) ) {
			$view['tab'] = $default;
		}
		$rows = $tabs[ $view['tab'] ];

		$types = array_values( array_unique( array_column( $rows, 'type' ) ) );
		$rows  = self::filter_rows( $rows, $view['types'], $view['person'] );

		$counts = [
			'all'                            => count( $rows ),
			Dashboard_Rows::BUCKET_IN_REVIEW => self::count_bucket( $rows, Dashboard_Rows::BUCKET_IN_REVIEW ),
			Dashboard_Rows::BUCKET_RESOLVED  => self::count_bucket( $rows, Dashboard_Rows::BUCKET_RESOLVED ),
		];
		if ( 'all' !== $view['status'] ) {
			$rows = array_values(
				array_filter(
					$rows,
					static function ( array $row ) use ( $view ): bool {
						return $row['bucket'] === $view['status'];
					}
				)
			);
		}

		$total                     = count( $rows );
		[ $slice, $paged, $pages ] = self::paginate( $rows, $view['paged'] );

		self::render_tabs( $tabs, $view );
		echo '<div class="flow-ew-dash-toolbar">';
		self::render_status_views( $counts, $view );
		self::render_type_filter( $types, $view );
		echo '</div>';
		self::render_person_chip( $view );

		if ( [] === $slice ) {
			self::render_empty( $view );
			return;
		}

		Review::prime_review_list_caches( array_values( array_filter( array_column( $slice, 'source' ), 'is_object' ) ) );
		Dashboard_Rows::prime_comment_counts( $slice );
		/**
		 * @param string|int $person
		 */
		$person_url = static function ( $person ) use ( $view ): string {
			return self::view_url(
				array_merge(
					$view,
					[
						'person' => $person,
						'paged'  => 1,
					]
				)
			);
		};
		$items      = [];
		foreach ( $slice as $row ) {
			$item = ( $row['item'] )( $person_url );
			if ( is_array( $item ) ) {
				$items[] = $item;
			}
		}
		echo '<div class="flow-ew-dashboard-page__section flow-ew-dash-board">';
		Dashboard_List_Renderer::list( $items );
		echo '</div>';
		self::render_pagination( 'bottom', $total, $pages, $paged, $view );
	}

	/**
	 * Tab, status bucket, type, person and page from the query string.
	 * Unknown values fall back to the defaults.
	 *
	 * @return array{tab:string,status:string,types:?string[],person:string,paged:int}
	 *   `types` null means every type (the default, all boxes checked).
	 *   `person` is a WP user id or `email:<address>`; '' means no filter.
	 */
	public static function normalize_view( array $query, string $default_tab ): array {
		$tab = sanitize_key( (string) ( $query['tab'] ?? '' ) );
		if ( ! in_array( $tab, [ Dashboard_Rows::TAB_RECEIVED, Dashboard_Rows::TAB_SENT ], true ) ) {
			$tab = $default_tab;
		}
		$status = sanitize_key( (string) ( $query['flow_status'] ?? '' ) );
		if ( ! in_array( $status, [ 'all', Dashboard_Rows::BUCKET_IN_REVIEW, Dashboard_Rows::BUCKET_RESOLVED ], true ) ) {
			$status = Dashboard_Rows::BUCKET_IN_REVIEW;
		}
		return [
			'tab'    => $tab,
			'status' => $status,
			'types'  => self::types_from_query( $query ),
			'person' => self::person_from_query( $query['flow_person'] ?? '' ),
			'paged'  => max( 1, (int) ( $query['paged'] ?? 1 ) ),
		];
	}

	/**
	 * Person-filter key: a WP user id as a decimal string, or `email:<address>`
	 * for a guest reviewer. Anything else is no filter.
	 *
	 * @param mixed $raw
	 */
	public static function person_from_query( $raw ): string {
		if ( is_int( $raw ) ) {
			return $raw > 0 ? (string) $raw : '';
		}
		$raw = trim( (string) $raw );
		if ( 0 === strpos( strtolower( $raw ), 'email:' ) ) {
			$email = sanitize_email( substr( $raw, 6 ) );
			return '' !== $email ? 'email:' . strtolower( $email ) : '';
		}
		$id = (int) $raw;
		return $id > 0 ? (string) $id : '';
	}

	/**
	 * Checked types. Null when the param is missing or lists every type,
	 * so the default page leaves every box checked. `none` is an explicit
	 * empty selection.
	 *
	 * @param array<string,mixed> $query
	 * @return string[]|null
	 */
	private static function types_from_query( array $query ): ?array {
		if ( ! array_key_exists( 'flow_type', $query ) ) {
			return null;
		}
		$raw = $query['flow_type'];
		if ( is_array( $raw ) ) {
			$parts = $raw;
		} else {
			// sanitize_key() would strip the commas that separate types.
			$raw = strtolower( (string) $raw );
			if ( 'none' === $raw ) {
				return [];
			}
			$parts = explode( ',', $raw );
		}
		$known = array_keys( Dashboard_Rows::type_labels() );
		$types = [];
		foreach ( $parts as $part ) {
			$part = sanitize_key( (string) $part );
			if ( in_array( $part, $known, true ) ) {
				$types[ $part ] = $part;
			}
		}
		if ( [] === $types || count( $types ) === count( $known ) ) {
			return null;
		}
		return array_values( $types );
	}

	/** @return array{tab:string,status:string,types:?string[],person:string,paged:int} */
	private static function current_view( string $default_tab ): array {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only view params.
		return self::normalize_view( wp_unslash( $_GET ), $default_tab );
	}

	/**
	 * Dashboard URL for a view. Defaults stay out of the query string.
	 *
	 * @param array{tab:string,status?:string,types?:string[]|null,person?:int|string,paged?:int} $view
	 */
	public static function view_url( array $view ): string {
		$args = [
			'page' => self::PAGE_SLUG,
			'tab'  => $view['tab'],
		];
		if ( ! empty( $view['status'] ) && Dashboard_Rows::BUCKET_IN_REVIEW !== $view['status'] ) {
			$args['flow_status'] = $view['status'];
		}
		if ( isset( $view['types'] ) && is_array( $view['types'] ) ) {
			$args['flow_type'] = [] === $view['types'] ? 'none' : implode( ',', $view['types'] );
		}
		$person = self::person_from_query( $view['person'] ?? '' );
		if ( '' !== $person ) {
			$args['flow_person'] = $person;
		}
		if ( ! empty( $view['paged'] ) && (int) $view['paged'] > 1 ) {
			$args['paged'] = (int) $view['paged'];
		}
		return add_query_arg( $args, admin_url( 'admin.php' ) );
	}

	/**
	 * @param array<int,array<string,mixed>> $rows
	 * @param string[]|null                  $types Null keeps every type.
	 * @param int|string                     $person
	 * @return array<int,array<string,mixed>>
	 */
	public static function filter_rows( array $rows, ?array $types, $person ): array {
		$person = self::person_from_query( $person );
		return array_values(
			array_filter(
				$rows,
				static function ( array $row ) use ( $types, $person ): bool {
					if ( null !== $types && ! in_array( $row['type'], $types, true ) ) {
						return false;
					}
					return '' === $person || in_array( $person, Dashboard_Rows::people( $row ), true );
				}
			)
		);
	}

	/**
	 * One page of rows. A page past the end shows the last one.
	 *
	 * @param array<int,array<string,mixed>> $rows
	 * @return array{0:array<int,array<string,mixed>>,1:int,2:int} Rows, current page, page count.
	 */
	public static function paginate( array $rows, int $paged ): array {
		$pages = max( 1, (int) ceil( count( $rows ) / self::PER_PAGE ) );
		$paged = min( max( 1, $paged ), $pages );
		return [ array_slice( $rows, ( $paged - 1 ) * self::PER_PAGE, self::PER_PAGE ), $paged, $pages ];
	}

	/** @param array<int,array<string,mixed>> $rows */
	public static function count_bucket( array $rows, string $bucket ): int {
		$count = 0;
		foreach ( $rows as $row ) {
			if ( ( $row['bucket'] ?? '' ) === $bucket ) {
				++$count;
			}
		}
		return $count;
	}

	/**
	 * @param array<string,array<int,array<string,mixed>>> $tabs
	 * @param array<string,mixed>                          $view
	 */
	private static function render_tabs( array $tabs, array $view ): void {
		$labels = [
			Dashboard_Rows::TAB_RECEIVED => __( 'Waiting for my feedback', 'jumplinks-editorial-workflow' ),
			Dashboard_Rows::TAB_SENT     => __( 'My sent reviews', 'jumplinks-editorial-workflow' ),
		];
		$labels = array_filter(
			$labels,
			static function ( string $tab ) use ( $tabs ): bool {
				return [] !== ( $tabs[ $tab ] ?? [] );
			},
			ARRAY_FILTER_USE_KEY
		);
		if ( count( $labels ) < 2 ) {
			return;
		}
		echo '<nav class="nav-tab-wrapper flow-ew-dash-tabs" aria-label="' . esc_attr__( 'Reviews', 'jumplinks-editorial-workflow' ) . '">';
		foreach ( $labels as $tab => $label ) {
			$active  = $tab === $view['tab'];
			$waiting = self::count_bucket( $tabs[ $tab ], Dashboard_Rows::BUCKET_IN_REVIEW );
			printf(
				'<a href="%1$s" class="nav-tab%2$s"%3$s>%4$s%5$s</a>',
				esc_url( self::view_url( [ 'tab' => $tab ] ) ),
				$active ? ' nav-tab-active' : '',
				$active ? ' aria-current="page"' : '',
				esc_html( $label ),
				$waiting > 0
					? ' <span class="flow-ew-dash-tabs__count">' . esc_html( number_format_i18n( $waiting ) ) . '</span>'
					: ''
			);
		}
		echo '</nav>';
	}

	/**
	 * @param array<string,int>   $counts
	 * @param array<string,mixed> $view
	 */
	private static function render_status_views( array $counts, array $view ): void {
		$labels = [
			'all'                            => __( 'All', 'jumplinks-editorial-workflow' ),
			Dashboard_Rows::BUCKET_IN_REVIEW => __( 'In review', 'jumplinks-editorial-workflow' ),
			Dashboard_Rows::BUCKET_RESOLVED  => __( 'Resolved', 'jumplinks-editorial-workflow' ),
		];
		$links  = [];
		foreach ( $labels as $status => $label ) {
			$current = $status === $view['status'];
			$links[] = sprintf(
				'<li class="%1$s"><a href="%2$s"%3$s>%4$s <span class="count">(%5$s)</span></a></li>',
				esc_attr( $status ),
				esc_url(
					self::view_url(
						array_merge(
							$view,
							[
								'status' => $status,
								'paged'  => 1,
							]
						)
					)
				),
				$current ? ' class="current" aria-current="page"' : '',
				esc_html( $label ),
				esc_html( number_format_i18n( (int) ( $counts[ $status ] ?? 0 ) ) )
			);
		}
		echo '<ul class="subsubsub flow-ew-dash-views">' . implode( ' | ', $links ) . '</ul>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
	}

	/**
	 * Checkboxes for the kinds of review in this tab. Every box starts
	 * checked; each link toggles one type. Hidden when the tab has only one.
	 *
	 * @param string[]            $types Types present in the tab.
	 * @param array<string,mixed> $view
	 */
	private static function render_type_filter( array $types, array $view ): void {
		$options = [];
		foreach ( Dashboard_Rows::type_filter_labels() as $type => $label ) {
			if ( in_array( $type, $types, true ) ) {
				$options[ $type ] = $label;
			}
		}
		if ( count( $options ) < 2 ) {
			return;
		}
		$checked = is_array( $view['types'] ?? null ) ? $view['types'] : array_keys( $options );
		echo '<div class="flow-ew-dash-types" role="group" aria-label="' . esc_attr__( 'Review type', 'jumplinks-editorial-workflow' ) . '">';
		foreach ( $options as $type => $label ) {
			$on = in_array( $type, $checked, true );
			printf(
				'<a href="%1$s" class="flow-ew-dash-types__option%2$s" aria-pressed="%3$s"><span class="flow-ew-dash-types__box" aria-hidden="true"></span>%4$s</a>',
				esc_url( self::type_toggle_url( $view, array_keys( $options ), $type ) ),
				$on ? ' is-checked' : '',
				$on ? 'true' : 'false',
				esc_html( $label )
			);
		}
		echo '</div>';
	}

	/**
	 * URL with one type flipped. Checking the last unchecked box drops the
	 * param, which is the all-checked default.
	 *
	 * @param array<string,mixed> $view
	 * @param string[]            $available
	 */
	private static function type_toggle_url( array $view, array $available, string $type ): string {
		$selected = is_array( $view['types'] ?? null ) ? $view['types'] : $available;
		if ( in_array( $type, $selected, true ) ) {
			$selected = array_values( array_diff( $selected, [ $type ] ) );
		} else {
			$selected[] = $type;
		}
		$selected = array_values( array_intersect( $available, $selected ) );
		$next     = count( $selected ) === count( $available ) ? null : $selected;
		return self::view_url(
			array_merge(
				$view,
				[
					'types' => $next,
					'paged' => 1,
				]
			)
		);
	}

	/** @param array<string,mixed> $view */
	private static function render_person_chip( array $view ): void {
		$person = self::person_from_query( $view['person'] ?? '' );
		$name   = self::person_label( $person );
		if ( '' === $name ) {
			return;
		}
		$template = Dashboard_Rows::TAB_SENT === $view['tab']
			/* translators: %s: reviewer display name. */
			? __( 'Reviewed by %s', 'jumplinks-editorial-workflow' )
			/* translators: %s: requester display name. */
			: __( 'Requested by %s', 'jumplinks-editorial-workflow' );
		printf(
			'<p class="flow-ew-dash-person"><span>%1$s</span><a class="flow-ew-dash-person__clear" href="%2$s" aria-label="%3$s"><span aria-hidden="true">&times;</span></a></p>',
			wp_kses( sprintf( esc_html( $template ), '<strong>' . esc_html( $name ) . '</strong>' ), [ 'strong' => [] ] ),
			esc_url(
				self::view_url(
					array_merge(
						$view,
						[
							'person' => '',
							'paged'  => 1,
						]
					)
				)
			),
			esc_attr__( 'Clear person filter', 'jumplinks-editorial-workflow' )
		);
	}

	/** Display name for a person-filter key. */
	private static function person_label( string $person ): string {
		if ( '' === $person ) {
			return '';
		}
		if ( 0 === strpos( $person, 'email:' ) ) {
			return substr( $person, 6 );
		}
		$user = get_userdata( (int) $person );
		return $user instanceof \WP_User ? $user->display_name : '';
	}

	/** @param array<string,mixed> $view */
	private static function render_empty( array $view ): void {
		if ( is_array( $view['types'] ?? null ) || '' !== self::person_from_query( $view['person'] ?? '' ) ) {
			printf(
				'<p class="flow-ew-dash-empty flow-ew-dashboard-page__empty">%1$s <a href="%2$s">%3$s</a></p>',
				esc_html__( 'No reviews match these filters.', 'jumplinks-editorial-workflow' ),
				esc_url(
					self::view_url(
						[
							'tab'    => $view['tab'],
							'status' => $view['status'],
						]
					)
				),
				esc_html__( 'Clear filters', 'jumplinks-editorial-workflow' )
			);
			return;
		}
		$received = Dashboard_Rows::TAB_RECEIVED === $view['tab'];
		switch ( $view['status'] ) {
			case Dashboard_Rows::BUCKET_IN_REVIEW:
				$message = $received
					? __( 'Nothing is waiting on you.', 'jumplinks-editorial-workflow' )
					: __( 'None of your requests are waiting on reviewers.', 'jumplinks-editorial-workflow' );
				break;
			case Dashboard_Rows::BUCKET_RESOLVED:
				$message = __( 'No resolved reviews yet.', 'jumplinks-editorial-workflow' );
				break;
			default:
				$message = $received
					? __( 'No one has asked you for a review yet.', 'jumplinks-editorial-workflow' )
					: __( 'You haven’t sent anything for review yet.', 'jumplinks-editorial-workflow' );
		}
		printf( '<p class="flow-ew-dash-empty flow-ew-dashboard-page__empty">%s</p>', esc_html( $message ) );
	}

	/**
	 * The same control as a posts list: item count, first / previous / next /
	 * last, and a current-page field on top. One page still shows the count.
	 *
	 * @param array<string,mixed> $view
	 */
	private static function render_pagination( string $which, int $total, int $pages, int $paged, array $view ): void {
		if ( $total <= 0 ) {
			return;
		}
		$top = 'top' === $which;
		echo $top ? '<form method="get" class="tablenav top">' : '<div class="tablenav bottom">';
		if ( $top ) {
			self::pagination_hidden_fields( $view );
		}

		$disable_first = 1 === $paged;
		$disable_last  = $pages === $paged;
		$links         = [
			self::pagination_step( $disable_first, 'first-page', '&laquo;', __( 'First page', 'jumplinks-editorial-workflow' ), self::view_url( array_merge( $view, [ 'paged' => 1 ] ) ) ),
			self::pagination_step( $disable_first, 'prev-page', '&lsaquo;', __( 'Previous page', 'jumplinks-editorial-workflow' ), self::view_url( array_merge( $view, [ 'paged' => max( 1, $paged - 1 ) ] ) ) ),
			self::pagination_current( $top, $paged, $pages ),
			self::pagination_step( $disable_last, 'next-page', '&rsaquo;', __( 'Next page', 'jumplinks-editorial-workflow' ), self::view_url( array_merge( $view, [ 'paged' => min( $pages, $paged + 1 ) ] ) ) ),
			self::pagination_step( $disable_last, 'last-page', '&raquo;', __( 'Last page', 'jumplinks-editorial-workflow' ), self::view_url( array_merge( $view, [ 'paged' => $pages ] ) ) ),
		];

		printf(
			'<div class="tablenav-pages%s"><span class="displaying-num">%s</span><span class="pagination-links">%s</span></div><br class="clear" />',
			$pages < 2 ? ' one-page' : '',
			esc_html(
				sprintf(
					/* translators: %s: number of items. */
					_n( '%s item', '%s items', $total, 'jumplinks-editorial-workflow' ),
					number_format_i18n( $total )
				)
			),
			implode( "\n", $links ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- each step is escaped in pagination_step() and pagination_current().
		);
		echo $top ? '</form>' : '</div>';
	}

	/** @param array<string,mixed> $view */
	private static function pagination_hidden_fields( array $view ): void {
		$fields = [
			'page' => self::PAGE_SLUG,
			'tab'  => (string) $view['tab'],
		];
		if ( ! empty( $view['status'] ) && Dashboard_Rows::BUCKET_IN_REVIEW !== $view['status'] ) {
			$fields['flow_status'] = (string) $view['status'];
		}
		if ( isset( $view['types'] ) && is_array( $view['types'] ) ) {
			$fields['flow_type'] = [] === $view['types'] ? 'none' : implode( ',', $view['types'] );
		}
		$person = self::person_from_query( $view['person'] ?? '' );
		if ( '' !== $person ) {
			$fields['flow_person'] = $person;
		}
		foreach ( $fields as $name => $value ) {
			printf( '<input type="hidden" name="%s" value="%s" />', esc_attr( $name ), esc_attr( $value ) );
		}
	}

	/** One arrow. A disabled one is a span, matching the posts list. */
	private static function pagination_step( bool $disabled, string $link_class, string $glyph, string $label, string $url ): string {
		if ( $disabled ) {
			return '<span class="tablenav-pages-navspan button disabled" aria-hidden="true">' . $glyph . '</span>';
		}
		return sprintf(
			'<a class="%1$s button" href="%2$s"><span class="screen-reader-text">%3$s</span><span aria-hidden="true">%4$s</span></a>',
			esc_attr( $link_class ),
			esc_url( $url ),
			esc_html( $label ),
			$glyph
		);
	}

	/** "1 of 3", with the current page editable at the top of the list. */
	private static function pagination_current( bool $top, int $paged, int $pages ): string {
		$total = '<span class="total-pages">' . esc_html( number_format_i18n( $pages ) ) . '</span>';
		if ( $top ) {
			$current = sprintf(
				'<label for="current-page-selector" class="screen-reader-text">%1$s</label><input class="current-page" id="current-page-selector" type="text" name="paged" value="%2$s" size="%3$d" aria-describedby="table-paging" /><span class="tablenav-paging-text">',
				esc_html__( 'Current Page', 'jumplinks-editorial-workflow' ),
				esc_attr( (string) $paged ),
				strlen( (string) $pages )
			);
			$before  = '<span class="paging-input">';
			$after   = '</span></span>';
		} else {
			$current = (string) $paged;
			$before  = '<span class="screen-reader-text">' . esc_html__( 'Current Page', 'jumplinks-editorial-workflow' ) . '</span><span id="table-paging" class="paging-input"><span class="tablenav-paging-text">';
			$after   = '</span></span>';
		}
		return $before . sprintf(
			/* translators: 1: current page, 2: total pages. */
			_x( '%1$s of %2$s', 'paging', 'jumplinks-editorial-workflow' ),
			$current,
			$total
		) . $after;
	}

	/**
	 * Self review only: the dashboard is the list of pages carrying private
	 * comments, the ones still waiting on a fix first.
	 */
	private static function render_self_reviews( int $user_id ): void {
		$accessible = [];
		foreach ( Dashboard_Rows::fetch_all( [ 'only_private' => true ] ) as $review ) {
			if ( ! Review::can_user_access_private_review( $review, $user_id ) ) {
				continue;
			}
			$accessible[] = $review;
		}
		$counts = DB::get_comment_counts_for_reviews(
			array_map(
				static function ( object $review ): int {
					return (int) $review->id;
				},
				$accessible
			)
		);
		$rows   = [];
		foreach ( $accessible as $review ) {
			$stats = $counts[ (int) $review->id ] ?? [
				'total'      => 0,
				'unresolved' => 0,
			];
			if ( 0 === (int) $stats['total'] ) {
				continue;
			}
			$rows[] = [ $review, (int) $stats['unresolved'] ];
		}
		usort(
			$rows,
			static function ( array $a, array $b ): int {
				return [ $b[1] > 0, (string) ( $b[0]->updated_at ?? '' ) ] <=> [ $a[1] > 0, (string) ( $a[0]->updated_at ?? '' ) ];
			}
		);

		if ( empty( $rows ) ) {
			self::render_first_self_review_steps();
			return;
		}

		$items = [];
		foreach ( $rows as [ $review, $open ] ) {
			$item = self::self_review_item( $review );
			if ( null === $item ) {
				continue;
			}
			$item['meta'][] = $open > 0
				? esc_html(
					sprintf(
						/* translators: %d: number of unresolved comments. */
						_n( '%d unresolved comment', '%d unresolved comments', $open, 'jumplinks-editorial-workflow' ),
						$open
					)
				)
				: esc_html__( 'All comments resolved', 'jumplinks-editorial-workflow' );
			$items[] = $item;
		}
		Dashboard_List_Renderer::section(
			'self-reviews',
			__( 'Pages with comments', 'jumplinks-editorial-workflow' ),
			$items,
			[
				'page'        => true,
				'description' => __( 'Your private self reviews. Open one to leave comments for yourself or your AI agent.', 'jumplinks-editorial-workflow' ),
			]
		);
	}

	private static function render_first_self_review_steps(): void {
		?>
		<div class="flow-ew-dashboard-page__section flow-ew-first-review">
			<h2 class="flow-ew-first-review__title"><?php esc_html_e( 'Review your first page', 'jumplinks-editorial-workflow' ); ?></h2>
			<ol class="flow-ew-first-review__steps">
				<li><?php esc_html_e( 'Open any page on your site while logged in.', 'jumplinks-editorial-workflow' ); ?></li>
				<li><?php esc_html_e( 'Click Review in the admin bar, or the go-to icon next to Self review in the editor.', 'jumplinks-editorial-workflow' ); ?></li>
				<li><?php esc_html_e( 'Select text or an image and leave a comment. Your AI agent can read and resolve it over MCP.', 'jumplinks-editorial-workflow' ); ?></li>
			</ol>
			<p class="flow-ew-first-review__docs">
				<a href="<?php echo esc_url( Settings::DOCS_URL ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Read the documentation', 'jumplinks-editorial-workflow' ); ?></a>
			</p>
		</div>
		<?php
	}

	private static function render_first_review_steps(): void {
		$post_type = null;
		foreach ( Settings::get_supported_post_types() as $slug ) {
			$obj = get_post_type_object( (string) $slug );
			if ( $obj && current_user_can( $obj->cap->edit_posts ) ) {
				$post_type = $obj;
				break;
			}
		}
		?>
		<div class="flow-ew-dashboard-page__section flow-ew-first-review">
			<h2 class="flow-ew-first-review__title"><?php esc_html_e( 'Send your first page for review', 'jumplinks-editorial-workflow' ); ?></h2>
			<ol class="flow-ew-first-review__steps">
				<li>
					<?php esc_html_e( 'Open a page or post in the editor.', 'jumplinks-editorial-workflow' ); ?>
					<?php if ( $post_type ) : ?>
						<a class="flow-ew-first-review__link" href="<?php echo esc_url( admin_url( 'edit.php?post_type=' . $post_type->name ) ); ?>"><?php echo esc_html( $post_type->labels->name ); ?></a>
					<?php endif; ?>
				</li>
				<li><?php esc_html_e( 'In the Review panel, assign a reviewer: a WordPress user or your client’s email address.', 'jumplinks-editorial-workflow' ); ?></li>
				<li><?php esc_html_e( 'Click Send for review. Flow creates the review link and emails it to them.', 'jumplinks-editorial-workflow' ); ?></li>
			</ol>
			<p class="flow-ew-first-review__docs">
				<a href="<?php echo esc_url( Settings::DOCS_URL ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Read the documentation', 'jumplinks-editorial-workflow' ); ?></a>
			</p>
		</div>
		<?php
	}

	/** Asking for a review before anyone has used the plugin just reads as noise. */
	public static function should_show_rating_prompt(): bool {
		$installed_at = (int) get_option( self::OPTION_INSTALLED_AT, 0 );
		if ( 0 === $installed_at ) {
			$installed_at = time();
			add_option( self::OPTION_INSTALLED_AT, $installed_at );
		}
		return self::rating_prompt_due(
			$installed_at,
			time(),
			DB::count_reviews( [ 'status' => Review::STATUS_APPROVED ] )
		);
	}

	public static function rating_prompt_due( int $installed_at, int $now, int $approved_reviews ): bool {
		return $now - $installed_at >= self::RATING_PROMPT_AFTER_DAYS * DAY_IN_SECONDS
			|| $approved_reviews >= self::RATING_PROMPT_AFTER_APPROVALS;
	}

	/** The "leave a review on WordPress.org" line shown atop Flow's admin pages. */
	public static function render_rating_prompt(): void {
		if ( ! self::should_show_rating_prompt() ) {
			return;
		}
		?>
		<p class="flow-ew-rating-prompt">
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
	}

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
	/** @var array<int,int> Request-scoped memo, keyed by user id. */
	private static array $assigned_count_cache = [];

	public static function count_assigned_to_me( int $user_id ): int {
		if ( $user_id <= 0 || Settings::is_solo_mode() ) {
			return 0;
		}
		// The admin menu badge and the admin-notice both call this on every
		// wp-admin page; compute the row set once per request.
		if ( isset( self::$assigned_count_cache[ $user_id ] ) ) {
			return self::$assigned_count_cache[ $user_id ];
		}
		$count = count(
			self::fetch_assigned_to_me(
				$user_id,
				[
					Review::STATUS_PENDING,
					Review::STATUS_IN_REVIEW,
					Review::STATUS_CHANGES_REQUESTED,
				]
			)
		);

		self::$assigned_count_cache[ $user_id ] = $count;
		return $count;
	}

	private static function fetch_assigned_to_me( int $user_id, array $statuses ): array {
		$out = [];
		foreach ( $statuses as $status ) {
			foreach (
				Dashboard_Rows::fetch_all(
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
	 * A self-review row: the page, its type, when it last changed.
	 *
	 * @return array<string,mixed>|null Null when the post is gone.
	 */
	private static function self_review_item( object $review ): ?array {
		$post = get_post( (int) $review->post_id );
		if ( ! $post instanceof \WP_Post ) {
			return null;
		}

		$rev_id = Review::get_effective_preview_revision_id(
			(int) $review->post_id,
			(int) ( $review->revision_id ?? 0 )
		);
		$status = (string) Review::display_status( $review );

		$meta     = [ esc_html( Dashboard_List_Renderer::post_type_label( $post ) ) ];
		$relative = Dashboard_List_Renderer::relative_time( $review->updated_at ?? null );
		if ( '' !== $relative ) {
			$meta[] = esc_html( $relative );
		}

		return [
			'title'        => Dashboard_List_Renderer::post_title( $post ),
			'url'          => Review::get_preview_url( (int) $review->id, $rev_id, (int) $review->post_id ),
			'meta'         => $meta,
			'edit_url'     => current_user_can( 'edit_post', (int) $review->post_id )
				? (string) get_edit_post_link( (int) $review->post_id, '' )
				: '',
			'status_key'   => $status,
			'status_label' => Review::status_label( $status ),
		];
	}

	/**
	 * Base64-encoded SVG for the admin menu icon. Rendered via `mask-image` +
	 * `background-color: currentColor` (see `output_menu_icon_css`), so the
	 * SVG only needs opaque paths — the fill colour itself is irrelevant
	 * because masks key off the alpha channel.
	 */
	private static function get_menu_icon_data_uri(): string {
		static $uri = null;
		if ( null !== $uri ) {
			return $uri;
		}
		$svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M15.56,7.62c.65-.11,1.07-.19,1.07-.19.19-.03.37-.14.49-.32l1.53-2.17c.25-.36.16-.86-.21-1.11-.13-.09-.28-.13-.43-.13-.25,0-.5.12-.66.35l-1.3,1.95-1.22.21c-.25.04-.32.37-.1.51.6.4.8.83.83.88Z"/><path d="M6.01,11.32c.24,0,.48-.11.66-.37l1.28-2.01c.26-.04.67-.11,1.16-.2l.07-.41c.04-.26.11-.51.2-.73.08-.2-.1-.41-.31-.38l-1.7.29c-.19.03-.37.14-.49.31,0,.01-1.54,2.22-1.55,2.23-.42.64.12,1.27.68,1.27Z"/><path d="M9.73,17.56l-2.21,1.63c-1.02-.82-3.25-2.6-3.25-2.6-.18-.13-.35-.19-.52-.19-.68,0-1.19.92-.52,1.49l3.75,3c.15.12.34.19.52.19.18,0,.35-.06.5-.17l3.24-2.47c.2-.15.12-.46-.13-.5-.04,0-.09-.01-.13-.02-.47-.08-.89-.2-1.25-.37Z"/><path d="M20.77,15.85s-3.8-2.94-3.8-2.94c-.13-.1-.3-.16-.46-.16s-.31.05-.45.15l-.88.65h0s-.14.85-.25,1.49c-.04.25.25.42.45.27l1.11-.85c.99.82,3.26,2.7,3.27,2.71.17.12.35.18.51.18.68,0,1.18-.93.5-1.49Z"/><path d="M15.1,9.4c.05-.31.06-.63-.01-.94-.03-.12-.07-.24-.12-.36-.06-.12-.13-.23-.22-.34-.34-.42-.94-.76-1.91-.93-.28-.05-.55-.07-.81-.07-1.06,0-1.9.44-2.11,1.69l-.25,1.51c.43-.3.97-.46,1.61-.49l.06-.36.04-.22c.01-.06.02-.12.04-.17.11-.33.37-.49.8-.49.12,0,.26.01.41.04.21.03.38.08.52.15.17.08.3.19.38.32.09.15.11.32.08.53l-.1.59-.06.38-.06.38h0s-.19,1.12-.19,1.12c-.03.19-.1.34-.21.44-.08.08-.2.14-.33.18-.1.02-.2.04-.32.04h0c-.14,0-.31-.02-.45-.05s-.31.07-.33.23l-.18,1.09c.17.04.74.12.74.12.13.01.26.02.38.02,0,0,.24,0,.38-.02,1.02-.11,1.51-.68,1.72-1.34h0c.04-.13.07-.27.09-.4l.1-.59h0s.1-.59.1-.59l.25-1.47Z"/><path d="M12.67,5.46l.41.07.41.07c.34.06.62.02.84-.12.21-.14.35-.36.4-.68l.08-.5.08-.5c.05-.31,0-.57-.16-.77-.16-.2-.41-.33-.75-.39l-.41-.07-.41-.07c-.72-.12-1.13.15-1.24.8l-.08.5-.08.5c-.11.65.19,1.04.91,1.16Z"/><path d="M13.28,14.48c-.18.04-.37.06-.56.07l-.07.39-.03.2c-.03.19-.1.33-.21.44,0,0,0,0,0,0,0,0,0,0,0,0-.04.04-.08.07-.13.1h0c-.13.07-.3.11-.51.11-.08,0-.16,0-.25-.02-.04,0-.09-.01-.13-.02-.13-.02-.25-.05-.36-.08-.5-.16-.69-.45-.62-.91l.41-2.48c.03-.19.1-.34.2-.44.08-.09.19-.15.33-.19.09-.02.19-.03.31-.03h.03c.14,0,.31.02.46.05s.3-.07.33-.23l.18-1.09c-.12-.03-.25-.06-.39-.08-.12-.02-.23-.04-.35-.05,0,0,0,0,0,0-.13-.01-.25-.02-.38-.02-.03,0-.05,0-.08,0-.1,0-.2,0-.3.01-.83.07-1.48.46-1.74,1.36h0c-.03.1-.05.2-.07.31l-.47,2.81c-.16.95.17,1.57.79,1.97.11.07.23.14.36.2.13.06.27.11.42.16.21.06.43.11.66.15.29.05.56.07.8.07.61,0,1.05-.14,1.38-.37.03-.02.06-.04.08-.06h0c.42-.34.62-.82.71-1.32l.25-1.48c-.3.22-.65.37-1.05.45h0Z"/></svg>';
		$uri = 'data:image/svg+xml;base64,' . base64_encode( $svg ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- encoding inline SVG for use in a data URI; no obfuscation intent.
		return $uri;
	}
}
