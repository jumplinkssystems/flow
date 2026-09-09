<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Settings {

	const OPTION_MANDATORY             = 'flow_ew_review_mandatory';
	const OPTION_SHOW_REVIEWED_BY      = 'flow_ew_show_reviewed_by';
	const OPTION_REVIEWER_ROLES        = 'flow_ew_reviewer_roles';
	const OPTION_AUTO_ASSIGN_REVIEWER  = 'flow_ew_auto_assign_reviewer_id';
	const OPTION_DEBUG_MODE            = 'flow_ew_debug_mode';
	const OPTION_DISABLE_OPEN_REVIEWS  = 'flow_ew_disable_open_reviews';
	const OPTION_DISABLE_NOTIFICATIONS = 'flow_ew_disable_notifications';
	const OPTION_SUPPORTED_POST_TYPES  = 'flow_ew_supported_post_types';
	const OPTION_SHOW_UPGRADE_HINTS    = 'flow_ew_show_upgrade_hints';
	const OPTION_SETUP_COMPLETED       = 'flow_ew_setup_completed';
	const OPTION_GROUP                 = 'flow_ew_settings';
	const PAGE_SLUG                    = 'jumplinks-editorial-workflow';
	const SETUP_PAGE_SLUG              = 'flow-ew-setup';

	/** @var string[] */
	private const DEFAULT_SUPPORTED_POST_TYPES = [ 'post', 'page' ];

	/**
	 * Default reviewer roles for new installs and the setup wizard.
	 *
	 * @return string[]
	 */
	public static function get_default_reviewer_roles(): array {
		return [ Activator::REVIEWER_ROLE, 'administrator' ];
	}

	/**
	 * Registered roles for the reviewer-roles picker, with Reviewer last.
	 *
	 * @return array<string,array<string,mixed>>
	 */
	public static function get_ordered_reviewer_roles(): array {
		$all_roles = wp_roles()->roles;
		$dedicated = Activator::REVIEWER_ROLE;
		$ordered   = [];

		foreach ( $all_roles as $slug => $data ) {
			if ( $dedicated === $slug ) {
				continue;
			}
			$ordered[ $slug ] = $data;
		}

		if ( isset( $all_roles[ $dedicated ] ) ) {
			$ordered[ $dedicated ] = $all_roles[ $dedicated ];
		}

		return $ordered;
	}

	/**
	 * @return array<string,int>
	 */
	public static function get_reviewer_role_user_counts(): array {
		static $counts = null;
		if ( null !== $counts ) {
			return $counts;
		}

		$counts = [];
		$users  = count_users();
		if ( ! empty( $users['avail_roles'] ) && is_array( $users['avail_roles'] ) ) {
			foreach ( $users['avail_roles'] as $role => $num ) {
				$counts[ (string) $role ] = (int) $num;
			}
		}

		return $counts;
	}

	public static function format_reviewer_role_label( string $label, int $user_count ): string {
		if ( $user_count <= 0 ) {
			return $label;
		}

		return sprintf( '%s (%d)', $label, $user_count );
	}

	/**
	 * Role rows for the setup wizard (slug, label with count, optional description).
	 *
	 * @return array<int,array{slug:string,label:string,description:string,userCount:int}>
	 */
	public static function get_reviewer_role_choices(): array {
		$descriptions = [
			Activator::REVIEWER_ROLE => __( 'Dedicated role created by the Flow plugin. Can access Review page, add comment and approve or request changes.', 'jumplinks-editorial-workflow' ),
		];
		$counts       = self::get_reviewer_role_user_counts();
		$choices      = [];

		foreach ( self::get_ordered_reviewer_roles() as $slug => $role_data ) {
			$name      = isset( $role_data['name'] ) ? translate_user_role( (string) $role_data['name'] ) : (string) $slug;
			$num       = $counts[ $slug ] ?? 0;
			$choices[] = [
				'slug'        => (string) $slug,
				'label'       => self::format_reviewer_role_label( $name, $num ),
				'description' => isset( $descriptions[ $slug ] ) ? (string) $descriptions[ $slug ] : '',
				'userCount'   => $num,
			];
		}

		return $choices;
	}

	public function boot(): void {
		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores -- $page_hook from add_submenu_page uses the menu slug.
		add_action( 'load-admin_page_' . self::SETUP_PAGE_SLUG, [ $this, 'prime_setup_admin_title' ], 0 );
		// Priority 11 — Dashboard_Page hooks at 10 to register the "Flow"
		add_action( 'admin_menu', [ $this, 'add_menu_page' ], 11 );
		add_action( 'admin_init', [ $this, 'handle_setup_skip' ], 1 );
		add_action( 'admin_init', [ $this, 'register_settings' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_settings_assets' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_setup_wizard' ] );
		add_action( 'admin_post_flow_ew_setup_save', [ $this, 'handle_setup_save' ] );
		add_action( 'rest_api_init', [ $this, 'register_setup_rest_route' ] );

		add_filter(
			'flow_ew_should_send_email_notification',
			static function ( $should ) {
				return self::are_notifications_disabled() ? false : $should;
			},
			1
		);

		// Sync reviewer caps when the option is updated.
		add_action(
			'update_option_' . self::OPTION_REVIEWER_ROLES,
			[ $this, 'sync_reviewer_role_caps' ],
			10,
			2
		);

		// Also sync when the option is first created.
		add_action(
			'add_option_' . self::OPTION_REVIEWER_ROLES,
			function ( $option_name, $value ) {
				$this->sync_reviewer_role_caps( [], $value );
			},
			10,
			2
		);

		add_filter(
			'plugin_action_links_jumplinks-editorial-workflow/jumplinks-editorial-workflow.php',
			[ $this, 'add_settings_link' ]
		);

		add_filter( 'plugin_row_meta', [ $this, 'add_plugin_row_meta' ], 10, 2 );
	}

	/**
	 * @param array<int,string> $plugin_meta
	 */
	public function add_plugin_row_meta( array $plugin_meta, string $plugin_file ): array {
		if ( 'jumplinks-editorial-workflow/jumplinks-editorial-workflow.php' !== $plugin_file ) {
			return $plugin_meta;
		}
		$plugin_meta[] = sprintf(
			'<a href="%s" target="_blank" rel="noopener">%s</a>',
			esc_url( 'https://wordpress.org/support/plugin/jumplinks-editorial-workflow/reviews/#new-post' ),
			esc_html__( '★ Rate this plugin', 'jumplinks-editorial-workflow' )
		);
		return $plugin_meta;
	}

	public function add_settings_link( array $links ): array {
		$url  = admin_url( 'admin.php?page=' . self::PAGE_SLUG );
		$link = sprintf(
			'<a href="%s">%s</a>',
			esc_url( $url ),
			esc_html__( 'Settings', 'jumplinks-editorial-workflow' )
		);
		array_unshift( $links, $link );
		return $links;
	}

	public static function is_mandatory(): bool {
		return (bool) get_option( self::OPTION_MANDATORY, false );
	}

	public static function should_show_reviewed_by(): bool {
		return (bool) get_option( self::OPTION_SHOW_REVIEWED_BY, false );
	}

	/**
	 * @return string[]
	 */
	public static function get_reviewer_roles(): array {
		$saved = get_option( self::OPTION_REVIEWER_ROLES, null );
		if ( null === $saved ) {
			return self::get_default_reviewer_roles();
		}
		return (array) $saved;
	}

	public static function get_auto_assign_reviewer_id(): int {
		return max( 0, (int) get_option( self::OPTION_AUTO_ASSIGN_REVIEWER, 0 ) );
	}

	public static function is_debug_mode(): bool {
		return (bool) get_option( self::OPTION_DEBUG_MODE, false );
	}

	public static function should_show_upgrade_hints(): bool {
		return (bool) get_option( self::OPTION_SHOW_UPGRADE_HINTS, true );
	}

	public static function are_open_reviews_disabled(): bool {
		return (bool) get_option( self::OPTION_DISABLE_OPEN_REVIEWS, false );
	}

	public static function are_notifications_disabled(): bool {
		return (bool) get_option( self::OPTION_DISABLE_NOTIFICATIONS, false );
	}

	/** @var array<string,\WP_Post_Type>|null */
	private static ?array $eligible_cache = null;

	/** @var string|null Hook suffix returned by `add_submenu_page` for the Settings screen. */
	private ?string $settings_hook_suffix = null;

	/**
	 * Post type slugs that may be offered in settings (front-facing content with a real preview).
	 * Only types that exist, use the block editor, and are in the REST API are shown.
	 *
	 * @return string[]
	 */
	public static function get_review_post_type_slug_candidates(): array {
		$candidates = [];
		foreach ( get_post_types( [ 'public' => true ], 'names' ) as $slug ) {
			if ( 'attachment' === $slug ) {
				continue;
			}
			$candidates[] = $slug;
		}

		return array_values(
			array_unique(
				array_map(
					'sanitize_key',
					(array) \apply_filters( 'flow_ew_review_post_type_slugs', $candidates )
				)
			)
		);
	}

	/**
	 * Post types eligible for the Flow settings UI (subset of candidates).
	 *
	 * @return array<string,\WP_Post_Type>
	 */
	public static function get_post_types_eligible_for_flow(): array {
		if ( null !== self::$eligible_cache ) {
			return self::$eligible_cache;
		}
		$out = [];
		foreach ( self::get_review_post_type_slug_candidates() as $slug ) {
			if ( ! post_type_exists( $slug ) ) {
				continue;
			}
			$obj = get_post_type_object( $slug );
			if ( ! $obj instanceof \WP_Post_Type || ! $obj->show_in_rest ) {
				continue;
			}
			if ( ! $obj->show_in_nav_menus ) {
				continue;
			}
			if ( ! post_type_supports( $slug, 'editor' ) ) {
				continue;
			}
			$out[ $slug ] = $obj;
		}
		self::$eligible_cache = $out;
		return $out;
	}

	/**
	 * Test seam — call when post-type registration mutates inside the same request
	 * (rare; mostly used in unit tests).
	 */
	public static function flush_eligible_cache(): void {
		self::$eligible_cache = null;
	}

	/**
	 * @return string[]
	 */
	public static function get_supported_post_types(): array {
		$saved = get_option( self::OPTION_SUPPORTED_POST_TYPES, null );
		if ( null === $saved ) {
			return self::DEFAULT_SUPPORTED_POST_TYPES;
		}
		$eligible = array_keys( self::get_post_types_eligible_for_flow() );
		return array_values( array_intersect( (array) $saved, $eligible ) );
	}

	public static function is_post_type_supported( string $post_type ): bool {
		return in_array( $post_type, self::get_supported_post_types(), true );
	}

	public function sync_reviewer_role_caps( $old_value, $new_value ): void {
		$selected = (array) $new_value;
		foreach ( array_keys( wp_roles()->roles ) as $slug ) {
			$role = get_role( $slug );
			if ( ! $role ) {
				continue;
			}
			if ( Activator::REVIEWER_ROLE === $slug ) {
				$role->add_cap( 'flow_review_posts', true );
				continue;
			}
			if ( in_array( $slug, $selected, true ) ) {
				$role->add_cap( 'flow_review_posts', true );
			} else {
				$role->remove_cap( 'flow_review_posts' );
			}
		}
	}

	public function prime_setup_admin_title(): void {
		global $title;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- admin $title for hidden admin.php submenu (see admin-header.php strip_tags).
		$title = __( 'Flow setup', 'jumplinks-editorial-workflow' );
	}

	public function add_menu_page(): void {
		$this->settings_hook_suffix = add_submenu_page(
			Dashboard_Page::PAGE_SLUG,
			__( 'Flow Settings', 'jumplinks-editorial-workflow' ),
			__( 'Settings', 'jumplinks-editorial-workflow' ),
			'manage_options',
			self::PAGE_SLUG,
			[ $this, 'render_page' ]
		) ?: null;

		// Setup wizard is hidden from the menu (parent slug `''`) — only
		// reachable by direct link from the activation banner.
		add_submenu_page(
			'',
			__( 'Flow setup', 'jumplinks-editorial-workflow' ),
			'',
			'manage_options',
			self::SETUP_PAGE_SLUG,
			[ $this, 'render_setup_page' ]
		);
	}

	/**
	 * The wizard is now a modal (no admin-page redirect). The activation transient
	 * still acts as a one-shot signal: the React modal opens automatically the
	 * next time the admin loads any page.
	 */
	private function should_show_wizard_now(): bool {
		if ( wp_doing_ajax() || ! is_user_logged_in() ) {
			return false;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}
		if ( self::is_setup_completed() ) {
			return false;
		}
		return (bool) get_transient( 'flow_ew_activation_redirect' );
	}

	/**
	 * Allow admins to preview the activation wizard without re-activating the plugin.
	 * Visit any screen that loads the wizard with ?flow_ew_open_setup=1 .
	 */
	private function should_force_setup_wizard_open(): bool {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display-only preview flag.
		if ( ! isset( $_GET['flow_ew_open_setup'] ) ) {
			return false;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display-only preview flag; value sanitized below.
		return '1' === sanitize_text_field( wp_unslash( (string) $_GET['flow_ew_open_setup'] ) );
	}

	public function handle_setup_skip(): void {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- verified below.
		if ( ! isset( $_GET['page'], $_GET['flow_ew_skip_setup'], $_GET['_wpnonce'] ) ) {
			return;
		}
		$page = sanitize_key( wp_unslash( $_GET['page'] ) );
		if ( self::SETUP_PAGE_SLUG !== $page ) {
			return;
		}
		$skip = sanitize_text_field( wp_unslash( $_GET['flow_ew_skip_setup'] ) );
		if ( '1' !== $skip ) {
			return;
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'flow_ew_skip_setup' ) ) {
			return;
		}
		update_option( self::OPTION_SETUP_COMPLETED, true );
		wp_safe_redirect( admin_url( 'admin.php?page=' . self::PAGE_SLUG ) );
		exit;
	}

	public function handle_setup_save(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'jumplinks-editorial-workflow' ) );
		}
		check_admin_referer( 'flow_ew_setup_save', 'flow_ew_setup_nonce' );

		$m_raw = isset( $_POST[ self::OPTION_MANDATORY ] )
			? sanitize_text_field( wp_unslash( $_POST[ self::OPTION_MANDATORY ] ) )
			: '0';
		update_option( self::OPTION_MANDATORY, '1' === $m_raw );

		$pt_in = [];
		if ( isset( $_POST[ self::OPTION_SUPPORTED_POST_TYPES ] ) && is_array( $_POST[ self::OPTION_SUPPORTED_POST_TYPES ] ) ) {
			$pt_in = array_map( 'sanitize_key', wp_unslash( $_POST[ self::OPTION_SUPPORTED_POST_TYPES ] ) );
		}
		update_option( self::OPTION_SUPPORTED_POST_TYPES, $this->sanitize_supported_post_types( $pt_in ) );

		$roles_in = [];
		if ( isset( $_POST[ self::OPTION_REVIEWER_ROLES ] ) && is_array( $_POST[ self::OPTION_REVIEWER_ROLES ] ) ) {
			$roles_in = array_map( 'sanitize_key', wp_unslash( $_POST[ self::OPTION_REVIEWER_ROLES ] ) );
		}
		update_option( self::OPTION_REVIEWER_ROLES, $this->sanitize_reviewer_roles( $roles_in ) );

		update_option( self::OPTION_SETUP_COMPLETED, true );
		wp_safe_redirect(
			admin_url(
				'admin.php?page=' . rawurlencode( self::PAGE_SLUG ) . '&flow_ew_setup_done=1'
			)
		);
		exit;
	}

	public function render_setup_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'jumplinks-editorial-workflow' ) );
		}
		$skip_url = wp_nonce_url(
			admin_url( 'admin.php?page=' . self::SETUP_PAGE_SLUG . '&flow_ew_skip_setup=1' ),
			'flow_ew_skip_setup'
		);
		?>
		<div class="wrap flow-ew-setup-wrap">
			<h1><?php esc_html_e( 'Welcome to Flow', 'jumplinks-editorial-workflow' ); ?></h1>
			<p class="flow-ew-setup-lead">
				<?php esc_html_e( 'Choose how reviews work on your site. You can change these anytime under Settings → Flow.', 'jumplinks-editorial-workflow' ); ?>
			</p>

			<div class="flow-ew-setup-card">
				<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
					<?php wp_nonce_field( 'flow_ew_setup_save', 'flow_ew_setup_nonce' ); ?>
					<input type="hidden" name="action" value="flow_ew_setup_save" />

					<h2 class="flow-ew-setup-step-title"><?php esc_html_e( 'Review mode', 'jumplinks-editorial-workflow' ); ?></h2>
					<p class="flow-ew-setup-step-desc">
						<?php esc_html_e( 'Decide whether publishing requires an approved review, or if reviews are optional helpers your team can use when they want.', 'jumplinks-editorial-workflow' ); ?>
					</p>
					<?php $this->render_mandatory_field(); ?>

					<h2 class="flow-ew-setup-step-title"><?php esc_html_e( 'Content types', 'jumplinks-editorial-workflow' ); ?></h2>
					<p class="flow-ew-setup-step-desc">
						<?php esc_html_e( 'Pick which post types use the workflow. Only types with the block editor and REST support are listed.', 'jumplinks-editorial-workflow' ); ?>
					</p>
					<?php $this->render_supported_post_types_field(); ?>

					<h2 class="flow-ew-setup-step-title"><?php esc_html_e( 'Reviewer roles', 'jumplinks-editorial-workflow' ); ?></h2>
					<p class="flow-ew-setup-step-desc">
						<?php esc_html_e( 'Pick roles that should be able to review content.', 'jumplinks-editorial-workflow' ); ?>
					</p>
					<?php $this->render_reviewer_roles_field(); ?>

					<p class="flow-ew-setup-actions">
						<?php
						submit_button(
							__( 'Save and continue', 'jumplinks-editorial-workflow' ),
							'primary large',
							'submit',
							false
						);
						?>
						<a class="button button-large" href="<?php echo esc_url( $skip_url ); ?>">
							<?php esc_html_e( 'Skip for now', 'jumplinks-editorial-workflow' ); ?>
						</a>
					</p>
				</form>
			</div>
		</div>
		<?php
	}

	/** Whether the first-run setup wizard was completed or skipped. */
	public static function is_setup_completed(): bool {
		return (bool) get_option( self::OPTION_SETUP_COMPLETED, false );
	}

	public function render_workflow_section_description(): void {
		?>
		<p>
			<?php esc_html_e( 'Use the options below to match how your team publishes. Debug mode remains available for administrators who need broader access while testing.', 'jumplinks-editorial-workflow' ); ?>
		</p>
		<?php
	}

	public function register_settings(): void {
		register_setting(
			self::OPTION_GROUP,
			self::OPTION_MANDATORY,
			[
				'type'              => 'boolean',
				'default'           => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
			]
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_SHOW_REVIEWED_BY,
			[
				'type'              => 'boolean',
				'default'           => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
			]
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_REVIEWER_ROLES,
			[
				'type'              => 'array',
				'default'           => self::get_default_reviewer_roles(),
				'sanitize_callback' => [ $this, 'sanitize_reviewer_roles' ],
			]
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_AUTO_ASSIGN_REVIEWER,
			[
				'type'              => 'integer',
				'default'           => 0,
				'sanitize_callback' => [ $this, 'sanitize_auto_assign_reviewer' ],
			]
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_DEBUG_MODE,
			[
				'type'              => 'boolean',
				'default'           => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
			]
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_DISABLE_OPEN_REVIEWS,
			[
				'type'              => 'boolean',
				'default'           => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
			]
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_DISABLE_NOTIFICATIONS,
			[
				'type'              => 'boolean',
				'default'           => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
			]
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_SUPPORTED_POST_TYPES,
			[
				'type'              => 'array',
				'default'           => self::DEFAULT_SUPPORTED_POST_TYPES,
				'sanitize_callback' => [ $this, 'sanitize_supported_post_types' ],
			]
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_SHOW_UPGRADE_HINTS,
			[
				'type'              => 'boolean',
				'default'           => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			]
		);

		add_settings_section(
			'flow_ew_general',
			__( 'Workflow', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_workflow_section_description' ],
			self::PAGE_SLUG
		);

		add_settings_field(
			self::OPTION_MANDATORY,
			__( 'Review Mode', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_mandatory_field' ],
			self::PAGE_SLUG,
			'flow_ew_general'
		);

		add_settings_field(
			self::OPTION_SHOW_REVIEWED_BY,
			__( 'Reviewed by', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_show_reviewed_by_field' ],
			self::PAGE_SLUG,
			'flow_ew_general'
		);

		add_settings_field(
			self::OPTION_SUPPORTED_POST_TYPES,
			__( 'Content types', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_supported_post_types_field' ],
			self::PAGE_SLUG,
			'flow_ew_general'
		);

		add_settings_field(
			self::OPTION_REVIEWER_ROLES,
			__( 'Review Roles', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_reviewer_roles_field' ],
			self::PAGE_SLUG,
			'flow_ew_general'
		);

		add_settings_field(
			self::OPTION_AUTO_ASSIGN_REVIEWER,
			__( 'Automatic reviewer', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_auto_assign_reviewer_field' ],
			self::PAGE_SLUG,
			'flow_ew_general'
		);

		add_settings_field(
			self::OPTION_DISABLE_OPEN_REVIEWS,
			__( 'Open Review', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_disable_open_reviews_field' ],
			self::PAGE_SLUG,
			'flow_ew_general'
		);

		add_settings_field(
			self::OPTION_DISABLE_NOTIFICATIONS,
			__( 'Notifications', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_disable_notifications_field' ],
			self::PAGE_SLUG,
			'flow_ew_general'
		);

		\do_action( 'flow_ew_register_settings', self::OPTION_GROUP, self::PAGE_SLUG );

		add_settings_field(
			self::OPTION_SHOW_UPGRADE_HINTS,
			__( 'Marketing', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_show_upgrade_hints_field' ],
			self::PAGE_SLUG,
			'flow_ew_general'
		);

		add_settings_field(
			self::OPTION_DEBUG_MODE,
			__( 'Debug Mode', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_debug_mode_field' ],
			self::PAGE_SLUG,
			'flow_ew_general'
		);
	}

	public function sanitize_reviewer_roles( $value ): array {
		if ( ! is_array( $value ) ) {
			return [];
		}
		$all_roles = array_keys( wp_roles()->roles );
		return array_values( array_intersect( $value, $all_roles ) );
	}

	public function sanitize_auto_assign_reviewer( $value ): int {
		$user_id = absint( $value );
		if ( 0 === $user_id ) {
			return 0;
		}
		return get_userdata( $user_id ) ? $user_id : 0;
	}

	/**
	 * @param mixed $value
	 * @return string[]
	 */
	public function sanitize_supported_post_types( $value ): array {
		if ( ! is_array( $value ) ) {
			return [];
		}
		$eligible = array_keys( self::get_post_types_eligible_for_flow() );
		return array_values( array_intersect( $value, $eligible ) );
	}

	public function render_mandatory_field(): void {
		$mandatory = self::is_mandatory();
		?>
		<fieldset>
			<label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:12px;cursor:pointer">
				<input
					type="radio"
					name="<?php echo esc_attr( self::OPTION_MANDATORY ); ?>"
					value="0"
					<?php checked( $mandatory, false ); ?>
					style="margin-top:3px;flex-shrink:0"
				/>
				<span>
					<strong><?php esc_html_e( 'Optional', 'jumplinks-editorial-workflow' ); ?></strong><br>
					<span class="description">
						<?php esc_html_e( 'Authors can publish posts freely without a review. The review workflow stays available so teams can still request approval when it helps. Best for mixed or low-friction workflows.', 'jumplinks-editorial-workflow' ); ?>
					</span>
				</span>
			</label>

			<label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer">
				<input
					type="radio"
					name="<?php echo esc_attr( self::OPTION_MANDATORY ); ?>"
					value="1"
					<?php checked( $mandatory, true ); ?>
					style="margin-top:3px;flex-shrink:0"
				/>
				<span>
					<strong><?php esc_html_e( 'Mandatory', 'jumplinks-editorial-workflow' ); ?></strong><br>
					<span class="description">
						<u><?php esc_html_e( 'Publishing is blocked until the post is approved by a reviewer.', 'jumplinks-editorial-workflow' ); ?></u>
						<?php esc_html_e( ' Authors must assign a reviewer before the post can go live. Best when every public change should pass review.', 'jumplinks-editorial-workflow' ); ?>
					</span>
				</span>
			</label>
		</fieldset>
		<?php
	}

	public function render_show_reviewed_by_field(): void {
		$checked = self::should_show_reviewed_by();
		?>
		<input type="hidden" name="<?php echo esc_attr( self::OPTION_SHOW_REVIEWED_BY ); ?>" value="0" />
		<label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer">
			<input
				type="checkbox"
				name="<?php echo esc_attr( self::OPTION_SHOW_REVIEWED_BY ); ?>"
				value="1"
				<?php checked( $checked, true ); ?>
				style="margin-top:3px;flex-shrink:0"
			/>
			<span>
				<strong><?php esc_html_e( 'Show reviewed-by credit', 'jumplinks-editorial-workflow' ); ?></strong><br>
				<span class="description">
					<?php esc_html_e( 'When a review is approved, show "Reviewed by" next to the author name on published content. External email reviewers are not listed.', 'jumplinks-editorial-workflow' ); ?>
				</span>
			</span>
		</label>
		<?php
	}

	public function render_supported_post_types_field(): void {
		$eligible = self::get_post_types_eligible_for_flow();
		$selected = self::get_supported_post_types();
		$opt_name = self::OPTION_SUPPORTED_POST_TYPES;
		$field_id = 'flow-ew-supported-post-types';
		if ( [] === $eligible ) {
			?>
			<p class="description"><?php esc_html_e( 'No reviewable content types are available.', 'jumplinks-editorial-workflow' ); ?></p>
			<?php
			return;
		}
		?>
		<fieldset id="<?php echo esc_attr( $field_id ); ?>">
			<p class="description" style="margin-top:0;margin-bottom:10px">
				<?php esc_html_e( 'Enable the review workflow for these content types. Custom post types should be supported but not guaranteed.', 'jumplinks-editorial-workflow' ); ?>
			</p>

			<a
				href="#"
				id="<?php echo esc_attr( $field_id ); ?>-select-all"
				style="font-size:12px;text-decoration:none;display:inline-block;margin-bottom:10px"
			><?php esc_html_e( 'Select all', 'jumplinks-editorial-workflow' ); ?></a>
			<div style="width:1px;height:1px;overflow:hidden;border-top:1px solid #ddd;margin-bottom:10px"></div>

			<?php foreach ( $eligible as $slug => $obj ) : ?>
				<label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer">
					<input
						type="checkbox"
						class="<?php echo esc_attr( $field_id ); ?>-pt"
						name="<?php echo esc_attr( $opt_name ); ?>[]"
						value="<?php echo esc_attr( $slug ); ?>"
						<?php checked( in_array( $slug, $selected, true ) ); ?>
					/>
					<?php echo esc_html( $obj->labels->singular_name ?? $slug ); ?>
					<span class="description">(<?php echo esc_html( $slug ); ?>)</span>
				</label>
			<?php endforeach; ?>
		</fieldset>
		<?php
		$this->add_settings_field_select_all_script( $field_id, $field_id . '-pt' );
	}

	public function render_reviewer_roles_field(): void {
		$selected_roles = self::get_reviewer_roles();
		$option_name    = self::OPTION_REVIEWER_ROLES;
		$field_id       = 'flow-ew-reviewer-roles';
		$ordered        = self::get_ordered_reviewer_roles();
		$counts         = self::get_reviewer_role_user_counts();
		$dedicated      = Activator::REVIEWER_ROLE;

		$role_descriptions = [
			$dedicated => __( 'Dedicated role created by the Flow plugin. Can access Review page, add comment and approve or request changes.', 'jumplinks-editorial-workflow' ),
		];
		?>
		<div
			id="<?php echo esc_attr( $field_id ); ?>"
			class="flow-ew-reviewer-roles-field"
			role="group"
			aria-labelledby="<?php echo esc_attr( $field_id ); ?>-legend"
		>
			<span id="<?php echo esc_attr( $field_id ); ?>-legend" class="screen-reader-text">
				<?php esc_html_e( 'Reviewer roles', 'jumplinks-editorial-workflow' ); ?>
			</span>
			<p class="flow-ew-reviewer-roles-intro">
				<?php esc_html_e( 'Users with the following roles can be assigned as reviewers. Selected roles receive the reviewer capability so they can open the review experience and approve or request changes.', 'jumplinks-editorial-workflow' ); ?>
			</p>

			<a
				href="#"
				id="<?php echo esc_attr( $field_id ); ?>-select-all"
				class="flow-ew-reviewer-roles-select-all"
			><?php esc_html_e( 'Select all', 'jumplinks-editorial-workflow' ); ?></a>

			<?php foreach ( $ordered as $slug => $role_data ) : ?>
				<?php
				$role_label = isset( $role_data['name'] )
					? translate_user_role( (string) $role_data['name'] )
					: (string) $slug;
				$user_count = $counts[ $slug ] ?? 0;
				?>
				<?php if ( $dedicated === $slug ) : ?>
					<div class="flow-ew-reviewer-roles-divider" aria-hidden="true"></div>
				<?php endif; ?>
				<label class="flow-ew-reviewer-role-item">
					<input
						type="checkbox"
						class="<?php echo esc_attr( $field_id ); ?>-role"
						name="<?php echo esc_attr( $option_name ); ?>[]"
						value="<?php echo esc_attr( $slug ); ?>"
						<?php checked( in_array( $slug, $selected_roles, true ) ); ?>
					/>
					<span class="flow-ew-reviewer-role-content">
						<span class="flow-ew-reviewer-role-name">
							<?php echo esc_html( self::format_reviewer_role_label( $role_label, $user_count ) ); ?>
						</span>
						<?php if ( ! empty( $role_descriptions[ $slug ] ) ) : ?>
							<span class="flow-ew-reviewer-role-desc"><?php echo esc_html( $role_descriptions[ $slug ] ); ?></span>
						<?php endif; ?>
					</span>
				</label>
			<?php endforeach; ?>
		</div>
		<?php
		$this->add_settings_field_select_all_script( $field_id, $field_id . '-role' );
	}

	public function render_auto_assign_reviewer_field(): void {
		$user_id = self::get_auto_assign_reviewer_id();
		$user    = $user_id > 0 ? get_userdata( $user_id ) : false;
		if ( ! $user ) {
			$user_id = 0;
		}
		?>
		<div id="flow-ew-auto-reviewer" class="flow-ew-user-combobox">
			<input
				type="hidden"
				id="flow-ew-auto-reviewer-id"
				name="<?php echo esc_attr( self::OPTION_AUTO_ASSIGN_REVIEWER ); ?>"
				value="<?php echo esc_attr( (string) $user_id ); ?>"
			/>
			<div class="flow-ew-user-combobox__field">
				<div class="flow-ew-user-combobox__control">
					<input
						type="search"
						id="flow-ew-auto-reviewer-search"
						class="regular-text"
						placeholder="<?php esc_attr_e( 'Search users…', 'jumplinks-editorial-workflow' ); ?>"
						autocomplete="off"
						role="combobox"
						aria-autocomplete="list"
						aria-expanded="false"
						aria-controls="flow-ew-auto-reviewer-results"
					/>
					<button
						type="button"
						class="button flow-ew-user-combobox__clear"
						<?php echo 0 === $user_id ? 'hidden' : ''; ?>
					><?php esc_html_e( 'Clear', 'jumplinks-editorial-workflow' ); ?></button>
				</div>
				<div
					id="flow-ew-auto-reviewer-selected"
					class="flow-ew-user-combobox__selected"
					<?php echo 0 === $user_id ? 'hidden' : ''; ?>
				>
					<?php if ( $user ) : ?>
						<?php echo get_avatar( $user_id, 32 ); ?>
						<span><?php echo esc_html( (string) $user->display_name ); ?></span>
					<?php endif; ?>
				</div>
				<div
					id="flow-ew-auto-reviewer-results"
					class="flow-ew-user-combobox__results"
					role="listbox"
					hidden
				></div>
			</div>
			<p class="description">
				<?php esc_html_e( 'Automatically assign this user to review new content. Any WordPress user can be selected, regardless of Review Roles, including yourself.', 'jumplinks-editorial-workflow' ); ?>
			</p>
		</div>
		<?php
		$this->add_auto_assign_reviewer_script();
	}

	public function render_show_upgrade_hints_field(): void {
		$checked = self::should_show_upgrade_hints();
		?>
		<label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer">
			<input
				type="checkbox"
				name="<?php echo esc_attr( self::OPTION_SHOW_UPGRADE_HINTS ); ?>"
				value="1"
				<?php checked( $checked, true ); ?>
				style="margin-top:3px;flex-shrink:0"
			/>
			<span>
				<strong><?php esc_html_e( 'Show marketing', 'jumplinks-editorial-workflow' ); ?></strong><br>
				<span class="description">
					<?php esc_html_e( 'Show Pro upgrade prompts across the admin menu, editors, and review page. Turn off to hide the [PRO] Site Review and Integrations menu items plus the "unlock" hints in editors and on the review page. The "Upgrade" entry and the early-bird discount bar (which reviewers can dismiss) stay visible.', 'jumplinks-editorial-workflow' ); ?>
				</span>
			</span>
		</label>
		<?php
	}

	public function render_debug_mode_field(): void {
		$checked = self::is_debug_mode();
		?>
		<label style="display:flex;align-items:center;gap:8px;cursor:pointer">
			<input
				type="checkbox"
				name="<?php echo esc_attr( self::OPTION_DEBUG_MODE ); ?>"
				value="1"
				<?php checked( $checked, true ); ?>
				style="margin-top:3px;flex-shrink:0"
			/>
			<span>
				<strong><?php esc_html_e( 'Debug mode', 'jumplinks-editorial-workflow' ); ?></strong><br>
				<span class="description">
					<?php esc_html_e( 'When enabled, administrators have full access to all review pages and actions.', 'jumplinks-editorial-workflow' ); ?>
				</span>
			</span>
		</label>
		<?php
	}

	public function render_disable_notifications_field(): void {
		$checked = self::are_notifications_disabled();
		?>
		<label style="display:flex;align-items:center;gap:8px;cursor:pointer">
			<input
				type="checkbox"
				name="<?php echo esc_attr( self::OPTION_DISABLE_NOTIFICATIONS ); ?>"
				value="1"
				<?php checked( $checked, true ); ?>
				style="margin-top:3px;flex-shrink:0"
			/>
			<span>
				<strong><?php esc_html_e( 'Disable all notifications.', 'jumplinks-editorial-workflow' ); ?></strong><br>
				<span class="description">
					<?php esc_html_e( 'When enabled, no review-related emails are sent at all (assignment, approval, changes requested, mentions). Use this for staging or quiet rollouts.', 'jumplinks-editorial-workflow' ); ?>
				</span>
			</span>
		</label>
		<?php
	}

	public function render_disable_open_reviews_field(): void {
		$checked = self::are_open_reviews_disabled();
		?>
		<label style="display:flex;align-items:center;gap:8px;cursor:pointer">
			<input
				type="checkbox"
				name="<?php echo esc_attr( self::OPTION_DISABLE_OPEN_REVIEWS ); ?>"
				value="1"
				<?php checked( $checked, true ); ?>
				style="margin-top:3px;flex-shrink:0"
			/>
			<span>
				<strong><?php esc_html_e( 'Disable open reviews.', 'jumplinks-editorial-workflow' ); ?></strong><br>
				<span class="description">
					<?php esc_html_e( 'Hide the Open Review toggle in the editor and lock review pages to assigned participants only. Existing open reviews stop accepting public-link visitors immediately.', 'jumplinks-editorial-workflow' ); ?>
				</span>
			</span>
		</label>
		<?php
		\do_action( 'flow_ew_after_open_review_field' );
	}

	public function enqueue_settings_assets( string $hook_suffix ): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$is_settings = null !== $this->settings_hook_suffix && $this->settings_hook_suffix === $hook_suffix;
		$is_setup    = 'admin_page_' . self::SETUP_PAGE_SLUG === $hook_suffix;
		if ( ! $is_settings && ! $is_setup ) {
			return;
		}

		$css_path = FLOW_EW_PLUGIN_DIR . 'assets/css/admin-settings.css';
		$ver      = file_exists( $css_path )
			? (string) filemtime( $css_path )
			: ( defined( 'FLOW_EW_VERSION' ) ? FLOW_EW_VERSION : '1.0.0' );

		wp_enqueue_style(
			'flow-ew-admin-settings',
			FLOW_EW_PLUGIN_URL . 'assets/css/admin-settings.css',
			[],
			$ver
		);
		wp_register_script( 'flow-ew-settings-fields', false, [ 'wp-api-fetch' ], $ver, true );
		wp_enqueue_script( 'flow-ew-settings-fields' );
	}

	/**
	 * Select-all / deselect-all toggles for checkbox fieldsets on the settings screens.
	 *
	 * @param string $field_id        Element id prefix (without "-select-all").
	 * @param string $checkbox_class  Full checkbox class (no leading dot).
	 */
	private function add_settings_field_select_all_script( string $field_id, string $checkbox_class ): void {
		$js = sprintf(
			'(function(){var link=document.getElementById(%1$s);var boxes=document.querySelectorAll(%2$s);var allLabel=%3$s;var noneLabel=%4$s;if(!link)return;function updateLink(){var allChecked=Array.prototype.every.call(boxes,function(c){return c.checked;});link.textContent=allChecked?noneLabel:allLabel;}link.addEventListener("click",function(e){e.preventDefault();var allChecked=Array.prototype.every.call(boxes,function(c){return c.checked;});boxes.forEach(function(cb){cb.checked=!allChecked;});updateLink();});boxes.forEach(function(cb){cb.addEventListener("change",updateLink);});updateLink();})();',
			wp_json_encode( $field_id . '-select-all' ),
			wp_json_encode( '.' . $checkbox_class ),
			wp_json_encode( __( 'Select all', 'jumplinks-editorial-workflow' ) ),
			wp_json_encode( __( 'Deselect all', 'jumplinks-editorial-workflow' ) )
		);
		wp_add_inline_script( 'flow-ew-settings-fields', $js, 'after' );
	}

	private function add_auto_assign_reviewer_script(): void {
		$js = <<<'JS'
(function(){
	var root=document.getElementById('flow-ew-auto-reviewer');
	if(!root||!window.wp||!window.wp.apiFetch)return;
	var hidden=root.querySelector('#flow-ew-auto-reviewer-id');
	var input=root.querySelector('#flow-ew-auto-reviewer-search');
	var results=root.querySelector('#flow-ew-auto-reviewer-results');
	var selected=root.querySelector('#flow-ew-auto-reviewer-selected');
	var clear=root.querySelector('.flow-ew-user-combobox__clear');
	var timer=0;
	var request=0;
	function close(){results.hidden=true;results.innerHTML='';input.setAttribute('aria-expanded','false');}
	function select(user){
		hidden.value=String(user.id);
		selected.innerHTML='';
		if(user.avatar_url){var img=document.createElement('img');img.src=user.avatar_url;img.alt='';img.width=32;img.height=32;selected.appendChild(img);}
		var name=document.createElement('span');name.textContent=user.name;selected.appendChild(name);
		selected.hidden=false;clear.hidden=false;input.value='';close();
	}
	function render(users){
		results.innerHTML='';
		users.forEach(function(user){
			var option=document.createElement('button');
			option.type='button';option.className='flow-ew-user-combobox__option';
			option.setAttribute('role','option');option.textContent=user.name;
			option.addEventListener('click',function(){select(user);});
			results.appendChild(option);
		});
		results.hidden=users.length===0;input.setAttribute('aria-expanded',users.length?'true':'false');
	}
	input.addEventListener('input',function(){
		window.clearTimeout(timer);
		var query=input.value.trim();
		if(query.length<2){close();return;}
		timer=window.setTimeout(function(){
			var current=++request;
			window.wp.apiFetch({path:'/flow/v1/users/search?q='+encodeURIComponent(query)})
				.then(function(users){if(current===request)render(Array.isArray(users)?users:[]);})
				.catch(function(){if(current===request)close();});
		},250);
	});
	input.addEventListener('keydown',function(event){
		var options=results.querySelectorAll('.flow-ew-user-combobox__option');
		if(event.key==='Escape'){close();return;}
		if(event.key==='ArrowDown'&&options.length){event.preventDefault();options[0].focus();}
	});
	results.addEventListener('keydown',function(event){
		var options=Array.prototype.slice.call(results.querySelectorAll('.flow-ew-user-combobox__option'));
		var index=options.indexOf(document.activeElement);
		if(event.key==='ArrowDown'&&index<options.length-1){event.preventDefault();options[index+1].focus();}
		if(event.key==='ArrowUp'){event.preventDefault();if(index>0){options[index-1].focus();}else{input.focus();}}
		if(event.key==='Escape'){close();input.focus();}
	});
	clear.addEventListener('click',function(){
		hidden.value='0';selected.hidden=true;selected.innerHTML='';clear.hidden=true;input.value='';close();input.focus();
	});
	document.addEventListener('click',function(event){if(!root.contains(event.target))close();});
})();
JS;
		wp_add_inline_script( 'flow-ew-settings-fields', $js, 'after' );
	}

	public function enqueue_setup_wizard( string $hook_suffix ): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// Only enqueue where opening a modal makes sense — top-level admin pages users
		// land on right after activation. Avoids loading on every wp-admin screen.
		$allowed_hooks = array_filter(
			[
				'index.php',
				'plugins.php',
				'options-general.php',
				$this->settings_hook_suffix,
			]
		);
		if ( ! in_array( $hook_suffix, $allowed_hooks, true ) ) {
			return;
		}

		$auto_open    = $this->should_force_setup_wizard_open() || $this->should_show_wizard_now();
		$completed    = self::is_setup_completed();
		$is_main_page = ( null !== $this->settings_hook_suffix && $this->settings_hook_suffix === $hook_suffix );

		if ( ! $auto_open && $completed && ! $is_main_page ) {
			return;
		}

		$asset_file = FLOW_EW_PLUGIN_DIR . 'build/setup-wizard/index.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset      = require $asset_file;
		$js_suffix  = Assets::webpack_build_suffix( FLOW_EW_PLUGIN_DIR . 'build/setup-wizard/index', 'js' );
		$css_suffix = Assets::webpack_build_suffix( FLOW_EW_PLUGIN_DIR . 'build/setup-wizard/style-index', 'css' );

		Assets::ensure_react_jsx_runtime_registered();

		wp_enqueue_script(
			'flow-ew-setup-wizard',
			FLOW_EW_PLUGIN_URL . 'build/setup-wizard/index' . $js_suffix . '.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_enqueue_style(
			'flow-ew-setup-wizard',
			FLOW_EW_PLUGIN_URL . 'build/setup-wizard/style-index' . $css_suffix . '.css',
			[ 'wp-components' ],
			$asset['version']
		);

		if ( $auto_open && $this->should_show_wizard_now() ) {
			delete_transient( 'flow_ew_activation_redirect' );
		}

		$post_types = [];
		foreach ( self::get_post_types_eligible_for_flow() as $slug => $obj ) {
			$post_types[] = [
				'slug'  => (string) $slug,
				'label' => isset( $obj->labels->singular_name ) ? (string) $obj->labels->singular_name : (string) $slug,
			];
		}

		$roles = self::get_reviewer_role_choices();

		wp_localize_script(
			'flow-ew-setup-wizard',
			'flowEWSetup',
			[
				'restUrl'          => rest_url( 'flow/v1/setup' ),
				'nonce'            => wp_create_nonce( 'wp_rest' ),
				'autoOpen'         => $auto_open,
				'completed'        => $completed,
				'settingsUrl'      => admin_url( 'admin.php?page=' . self::PAGE_SLUG ),
				'reviewerRoleSlug' => Activator::REVIEWER_ROLE,
				'current'          => [
					'mandatory'     => self::is_mandatory(),
					'postTypes'     => self::get_supported_post_types(),
					'reviewerRoles' => self::get_reviewer_roles(),
				],
				'choices'          => [
					'postTypes' => $post_types,
					'roles'     => $roles,
				],
				'i18n'             => [
					'title'                    => __( 'Welcome to Flow', 'jumplinks-editorial-workflow' ),
					'lead'                     => __( 'A 30-second setup so reviews fit how your team publishes.', 'jumplinks-editorial-workflow' ),
					'step'                     => __( 'Step', 'jumplinks-editorial-workflow' ),
					'of'                       => __( 'of', 'jumplinks-editorial-workflow' ),
					'next'                     => __( 'Next', 'jumplinks-editorial-workflow' ),
					'back'                     => __( 'Back', 'jumplinks-editorial-workflow' ),
					'finish'                   => __( 'Finish', 'jumplinks-editorial-workflow' ),
					'skip'                     => __( 'Skip for now', 'jumplinks-editorial-workflow' ),
					'saving'                   => __( 'Saving…', 'jumplinks-editorial-workflow' ),
					'saved'                    => __( 'Setup saved. Your workflow preferences are active.', 'jumplinks-editorial-workflow' ),
					'launchAgain'              => __( 'Run setup again', 'jumplinks-editorial-workflow' ),
					'modeTitle'                => __( 'Review mode', 'jumplinks-editorial-workflow' ),
					'modeDesc'                 => __( 'Decide whether publishing requires an approved review, or if reviews are optional helpers your team can use when they want.', 'jumplinks-editorial-workflow' ),
					'modeMandatory'            => __( 'Mandatory', 'jumplinks-editorial-workflow' ),
					'modeMandatoryDescBlocked' => __( 'Publishing is blocked until the post is approved by a reviewer.', 'jumplinks-editorial-workflow' ),
					'modeMandatoryDescRest'    => __( 'Authors must assign a reviewer before the post can go live.', 'jumplinks-editorial-workflow' ),
					'modeOptional'             => __( 'Optional', 'jumplinks-editorial-workflow' ),
					'modeOptionalDesc'         => __( 'Authors can publish posts freely without a review. The review workflow stays available so teams can still request approval when it helps.', 'jumplinks-editorial-workflow' ),
					'typesTitle'               => __( 'Content types', 'jumplinks-editorial-workflow' ),
					'typesDesc'                => __( 'Pick which post types use the workflow. Only types with the block editor and REST support are listed.', 'jumplinks-editorial-workflow' ),
					'typesEmpty'               => __( 'No reviewable content types are available.', 'jumplinks-editorial-workflow' ),
					'rolesTitle'               => __( 'Reviewer roles', 'jumplinks-editorial-workflow' ),
					'rolesDesc'                => __( 'Users with these roles can be assigned as reviewers and approve or request changes.', 'jumplinks-editorial-workflow' ),
					'errorGeneric'             => __( 'Could not save. Please try again.', 'jumplinks-editorial-workflow' ),
					'selectAll'                => __( 'Select all', 'jumplinks-editorial-workflow' ),
					'deselectAll'              => __( 'Deselect all', 'jumplinks-editorial-workflow' ),
				],
			]
		);
	}

	public function register_setup_rest_route(): void {
		register_rest_route(
			'flow/v1',
			'/setup',
			[
				[
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'rest_save_setup' ],
					'permission_callback' => static function () {
						return current_user_can( 'manage_options' );
					},
					'args'                => [
						'mandatory'      => [
							'type'              => 'boolean',
							'sanitize_callback' => 'rest_sanitize_boolean',
						],
						'post_types'     => [
							'type'              => 'array',
							'items'             => [ 'type' => 'string' ],
							'sanitize_callback' => static function ( $value ) {
								return is_array( $value ) ? array_map( 'sanitize_key', $value ) : [];
							},
						],
						'reviewer_roles' => [
							'type'              => 'array',
							'items'             => [ 'type' => 'string' ],
							'sanitize_callback' => static function ( $value ) {
								return is_array( $value ) ? array_map( 'sanitize_key', $value ) : [];
							},
						],
					],
				],
			]
		);
	}

	/**
	 * @param \WP_REST_Request $request
	 */
	public function rest_save_setup( $request ) {
		$mandatory     = (bool) $request->get_param( 'mandatory' );
		$post_types_in = (array) $request->get_param( 'post_types' );
		$roles_in      = (array) $request->get_param( 'reviewer_roles' );

		update_option( self::OPTION_MANDATORY, $mandatory );
		update_option( self::OPTION_SUPPORTED_POST_TYPES, $this->sanitize_supported_post_types( $post_types_in ) );
		update_option( self::OPTION_REVIEWER_ROLES, $this->sanitize_reviewer_roles( $roles_in ) );
		update_option( self::OPTION_SETUP_COMPLETED, true );

		return rest_ensure_response(
			[
				'ok'        => true,
				'mandatory' => self::is_mandatory(),
				'postTypes' => self::get_supported_post_types(),
				'roles'     => self::get_reviewer_roles(),
			]
		);
	}

	public function render_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Flow Settings', 'jumplinks-editorial-workflow' ); ?></h1>

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
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display-only query flag after redirect.
			if ( isset( $_GET['flow_ew_setup_done'] ) && '1' === sanitize_text_field( wp_unslash( $_GET['flow_ew_setup_done'] ) ) ) {
				if ( function_exists( 'wp_admin_notice' ) ) {
					wp_admin_notice(
						__( 'Setup saved. Your workflow preferences are active.', 'jumplinks-editorial-workflow' ),
						[
							'type'               => 'success',
							'dismissible'        => true,
							'additional_classes' => [ 'flow-ew-setup-saved-notice' ],
						]
					);
				} else {
					echo '<div class="notice notice-success is-dismissible"><p>';
					esc_html_e( 'Setup saved. Your workflow preferences are active.', 'jumplinks-editorial-workflow' );
					echo '</p></div>';
				}
			}
			?>

			<form method="post" action="options.php">
				<?php
				settings_fields( self::OPTION_GROUP );
				do_settings_sections( self::PAGE_SLUG );
				submit_button();
				?>
			</form>
			<?php \do_action( 'flow_ew_after_settings_page', self::PAGE_SLUG ); ?>
		</div>
		<?php
	}
}
