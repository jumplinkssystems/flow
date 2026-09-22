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
	const OPTION_DISABLE_EXTERNAL      = 'flow_ew_disable_external_reviewers';
	const OPTION_DISABLE_NOTIFICATIONS = 'flow_ew_disable_notifications';
	const OPTION_SUPPORTED_POST_TYPES  = 'flow_ew_supported_post_types';
	const OPTION_SHOW_UPGRADE_HINTS    = 'flow_ew_show_upgrade_hints';
	const OPTION_SETUP_COMPLETED       = 'flow_ew_setup_completed';
	const OPTION_AGENT_COMMENTS        = 'flow_ew_agent_comments_enabled';
	const OPTION_AGENT_COMMENT_AUTHOR  = 'flow_ew_agent_comment_author_id';
	const OPTION_AGENT_COMMENT_MARKER  = 'flow_ew_agent_comment_marker';
	const OPTION_AGENT_RESOLVE_NOTES   = 'flow_ew_agent_resolve_notes';
	const OPTION_AGENT_FOLLOWUP        = 'flow_ew_agent_followup';
	const OPTION_AGENT_ASK_BEFORE_EDIT = 'flow_ew_agent_ask_before_edit';
	const OPTION_GROUP                 = 'flow_ew_settings';
	const PAGE_SLUG                    = 'jumplinks-editorial-workflow';

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
		// Priority 11 — Dashboard_Page hooks at 10 to register the "Flow"
		add_action( 'admin_menu', [ $this, 'add_menu_page' ], 11 );
		add_action( 'admin_init', [ $this, 'register_settings' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_settings_assets' ] );
		( new Setup_Wizard( $this ) )->boot();

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

	/**
	 * The user agent-written comments are posted as, or 0. Validated against a
	 * real account so deleting that user turns the feature off rather than
	 * failing every resolve.
	 */
	public static function get_agent_comment_author_id(): int {
		$user_id = max( 0, (int) get_option( self::OPTION_AGENT_COMMENT_AUTHOR, 0 ) );
		if ( $user_id <= 0 ) {
			return 0;
		}
		return get_userdata( $user_id ) ? $user_id : 0;
	}

	/** Needs both the switch and somebody to post as. */
	public static function agent_comments_enabled(): bool {
		return (bool) get_option( self::OPTION_AGENT_COMMENTS, false )
			&& self::get_agent_comment_author_id() > 0;
	}

	public static function should_mark_agent_comments(): bool {
		return self::agent_comments_enabled()
			&& (bool) get_option( self::OPTION_AGENT_COMMENT_MARKER, true );
	}

	/** Whether resolving must carry a note saying what the agent changed. */
	public static function agent_resolve_notes_enabled(): bool {
		return self::agent_comments_enabled()
			&& (bool) get_option( self::OPTION_AGENT_RESOLVE_NOTES, true );
	}

	/** Whether the agent may reply to ask what an unclear comment meant. */
	public static function agent_followup_comments_enabled(): bool {
		return self::agent_comments_enabled()
			&& (bool) get_option( self::OPTION_AGENT_FOLLOWUP, true );
	}

	/**
	 * Whether the agent must summarise its intended edits and wait for a
	 * go-ahead. Gated on the master switch like every other row in the tab: the
	 * row hides with it, and a hidden row must never stay quietly active.
	 */
	public static function agent_asks_before_editing(): bool {
		return self::agent_comments_enabled()
			&& (bool) get_option( self::OPTION_AGENT_ASK_BEFORE_EDIT, false );
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

	public static function are_external_reviewers_disabled(): bool {
		return (bool) get_option( self::OPTION_DISABLE_EXTERNAL, false );
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

	/**
	 * Persist the default values of the options read on hot paths, so those
	 * reads hit the autoloaded `alloptions` cache instead of a per-request
	 * `notoptions` database miss. Only creates missing rows (add_option is a
	 * no-op when the option already exists) and never overrides a saved value.
	 */
	public static function seed_default_options(): void {
		$defaults = [
			self::OPTION_MANDATORY             => false,
			self::OPTION_SHOW_REVIEWED_BY      => false,
			self::OPTION_DEBUG_MODE            => false,
			self::OPTION_DISABLE_OPEN_REVIEWS  => false,
			self::OPTION_DISABLE_EXTERNAL      => false,
			self::OPTION_DISABLE_NOTIFICATIONS => false,
			self::OPTION_SHOW_UPGRADE_HINTS    => true,
			self::OPTION_SUPPORTED_POST_TYPES  => self::DEFAULT_SUPPORTED_POST_TYPES,
		];
		foreach ( $defaults as $name => $value ) {
			add_option( $name, $value );
		}
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

	public function add_menu_page(): void {
		$this->settings_hook_suffix = add_submenu_page(
			Dashboard_Page::PAGE_SLUG,
			__( 'Flow Settings', 'jumplinks-editorial-workflow' ),
			__( 'Settings', 'jumplinks-editorial-workflow' ),
			'manage_options',
			self::PAGE_SLUG,
			[ $this, 'render_page' ]
		) ?: null;
	}

	public function settings_hook_suffix(): ?string {
		return $this->settings_hook_suffix;
	}

	/** Whether the first-run setup wizard was completed or skipped. */
	public static function is_setup_completed(): bool {
		return (bool) get_option( self::OPTION_SETUP_COMPLETED, false );
	}

	public function render_workflow_section_description(): void {
		?>
		<p>
			<?php esc_html_e( 'Use the options below to match how your team publishes.', 'jumplinks-editorial-workflow' ); ?>
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
			self::OPTION_DISABLE_EXTERNAL,
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

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_AGENT_COMMENTS,
			[
				'type'              => 'boolean',
				'default'           => false,
				'sanitize_callback' => [ $this, 'sanitize_agent_comments_enabled' ],
			]
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_AGENT_COMMENT_AUTHOR,
			[
				'type'              => 'integer',
				'default'           => 0,
				'sanitize_callback' => [ $this, 'sanitize_user_id_option' ],
			]
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_AGENT_COMMENT_MARKER,
			[
				'type'              => 'boolean',
				'default'           => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			]
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_AGENT_RESOLVE_NOTES,
			[
				'type'              => 'boolean',
				'default'           => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			]
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_AGENT_FOLLOWUP,
			[
				'type'              => 'boolean',
				'default'           => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
			]
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_AGENT_ASK_BEFORE_EDIT,
			[
				'type'              => 'boolean',
				'default'           => false,
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
			self::OPTION_DISABLE_EXTERNAL,
			__( 'External reviewers', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_disable_external_reviewers_field' ],
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
			self::OPTION_SHOW_REVIEWED_BY,
			__( 'Reviewed by', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_show_reviewed_by_field' ],
			self::PAGE_SLUG,
			'flow_ew_extras'
		);
		add_settings_field(
			self::OPTION_AUTO_ASSIGN_REVIEWER,
			__( 'Automatic reviewer', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_auto_assign_reviewer_field' ],
			self::PAGE_SLUG,
			'flow_ew_extras'
		);

		// Registered ahead of the Pro hook: Pro appends two untitled notification
		// rows during it, and they have to follow this label, not precede it.
		add_settings_field(
			self::OPTION_DISABLE_NOTIFICATIONS,
			__( 'Notifications', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_disable_notifications_field' ],
			self::PAGE_SLUG,
			'flow_ew_extras'
		);

		\do_action( 'flow_ew_register_settings', self::OPTION_GROUP, self::PAGE_SLUG );

		// Registered after the Pro sections so AI agent sits second from last,
		// immediately before Extras.
		add_settings_section(
			'flow_ew_ai_agent',
			__( 'AI agent', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_ai_agent_section_description' ],
			self::PAGE_SLUG
		);
		add_action( 'flow_ew_after_settings_section', [ $this, 'render_agent_primer' ] );

		add_settings_field(
			self::OPTION_AGENT_COMMENTS,
			__( 'Enable AI comments', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_agent_comments_field' ],
			self::PAGE_SLUG,
			'flow_ew_ai_agent'
		);

		// `class` lands on the <tr>, which is what the toggle script hides.
		add_settings_field(
			self::OPTION_AGENT_COMMENT_AUTHOR,
			__( 'Select AI user', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_agent_author_field' ],
			self::PAGE_SLUG,
			'flow_ew_ai_agent',
			[ 'class' => 'flow-ew-agent-dependent' ]
		);

		add_settings_field(
			self::OPTION_AGENT_RESOLVE_NOTES,
			__( 'Resolve comments', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_agent_resolve_notes_field' ],
			self::PAGE_SLUG,
			'flow_ew_ai_agent',
			[ 'class' => 'flow-ew-agent-dependent' ]
		);

		add_settings_field(
			self::OPTION_AGENT_FOLLOWUP,
			__( 'Follow-up comments', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_agent_followup_field' ],
			self::PAGE_SLUG,
			'flow_ew_ai_agent',
			[ 'class' => 'flow-ew-agent-dependent' ]
		);

		add_settings_field(
			self::OPTION_AGENT_COMMENT_MARKER,
			__( 'Mark as AI', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_agent_marker_field' ],
			self::PAGE_SLUG,
			'flow_ew_ai_agent',
			[ 'class' => 'flow-ew-agent-dependent' ]
		);

		// `do_settings_fields()` echoes the title unescaped, so the marker can
		// ride along with it rather than needing its own row.
		add_settings_field(
			self::OPTION_AGENT_ASK_BEFORE_EDIT,
			__( 'Ask before editing', 'jumplinks-editorial-workflow' )
				. ' <span class="flow-ew-experimental">'
				. esc_html__( 'Experimental', 'jumplinks-editorial-workflow' )
				. '</span>',
			[ $this, 'render_agent_ask_before_edit_field' ],
			self::PAGE_SLUG,
			'flow_ew_ai_agent',
			[ 'class' => 'flow-ew-agent-dependent' ]
		);

		add_settings_section(
			'flow_ew_extras',
			__( 'Extras', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_extras_section_description' ],
			self::PAGE_SLUG
		);

		add_settings_field(
			self::OPTION_SHOW_UPGRADE_HINTS,
			__( 'Marketing', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_show_upgrade_hints_field' ],
			self::PAGE_SLUG,
			'flow_ew_extras'
		);

		add_settings_field(
			self::OPTION_DEBUG_MODE,
			__( 'Debug Mode', 'jumplinks-editorial-workflow' ),
			[ $this, 'render_debug_mode_field' ],
			self::PAGE_SLUG,
			'flow_ew_extras'
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
	/**
	 * Refuses to store the switch as on unless the same submission also names
	 * a real user, so the site can never sit in a half-configured state. The
	 * browser blocks this first; this is the no-JavaScript backstop.
	 *
	 * @param mixed $value
	 */
	public function sanitize_agent_comments_enabled( $value ): bool {
		if ( ! rest_sanitize_boolean( $value ) ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- options.php verified the nonce first; absint() below both unslashes and sanitizes.
		$posted = absint( $_POST[ self::OPTION_AGENT_COMMENT_AUTHOR ] ?? 0 );

		if ( $posted > 0 && get_userdata( $posted ) ) {
			return true;
		}

		add_settings_error(
			self::OPTION_AGENT_COMMENTS,
			'flow_ew_agent_author_required',
			__( 'Choose the user AI comments are posted as before turning them on.', 'jumplinks-editorial-workflow' ),
			'error'
		);
		return false;
	}

	/** Shared by every option that stores a single user id. */
	public function sanitize_user_id_option( $value ): int {
		$user_id = absint( $value );
		if ( 0 === $user_id ) {
			return 0;
		}
		return get_userdata( $user_id ) ? $user_id : 0;
	}

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
			<label class="flow-ew-settings-radio">
				<input
					type="radio"
					name="<?php echo esc_attr( self::OPTION_MANDATORY ); ?>"
					value="0"
					<?php checked( $mandatory, false ); ?>
				/>
				<span>
					<strong><?php esc_html_e( 'Optional', 'jumplinks-editorial-workflow' ); ?></strong><br>
					<span class="description">
						<?php esc_html_e( 'Authors can publish posts freely without a review. The review workflow stays available so teams can still request approval when it helps. Best for mixed or low-friction workflows.', 'jumplinks-editorial-workflow' ); ?>
					</span>
				</span>
			</label>

			<label class="flow-ew-settings-radio">
				<input
					type="radio"
					name="<?php echo esc_attr( self::OPTION_MANDATORY ); ?>"
					value="1"
					<?php checked( $mandatory, true ); ?>
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
		$this->render_checkbox(
			self::OPTION_SHOW_REVIEWED_BY,
			self::should_show_reviewed_by(),
			__( 'Show reviewed-by credit', 'jumplinks-editorial-workflow' ),
			__( 'When a review is approved, show "Reviewed by" next to the author name on published content. External email reviewers are not listed.', 'jumplinks-editorial-workflow' ),
			true
		);
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
			<p class="description flow-ew-settings-intro">
				<?php esc_html_e( 'Enable the review workflow for these content types. Custom post types should be supported but not guaranteed.', 'jumplinks-editorial-workflow' ); ?>
			</p>

			<a
				href="#"
				id="<?php echo esc_attr( $field_id ); ?>-select-all"
				class="flow-ew-settings-select-all"
			><?php esc_html_e( 'Select all', 'jumplinks-editorial-workflow' ); ?></a>
			<div class="flow-ew-settings-divider"></div>

			<?php foreach ( $eligible as $slug => $obj ) : ?>
				<label class="flow-ew-settings-pt-item">
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
		$this->render_user_combobox(
			'flow-ew-auto-reviewer',
			self::OPTION_AUTO_ASSIGN_REVIEWER,
			self::get_auto_assign_reviewer_id(),
			__( 'Automatically assign this user to review new content. Any WordPress user can be selected, regardless of Review Roles, including yourself.', 'jumplinks-editorial-workflow' )
		);
	}

	public function render_extras_section_description(): void {
		?>
		<p>
			<?php esc_html_e( 'Optional touches: publication credit, a default reviewer, and developer options.', 'jumplinks-editorial-workflow' ); ?>
		</p>
		<?php
	}

	public function render_ai_agent_section_description(): void {
		?>
		<p>
			<?php esc_html_e( 'Connected AI agents read review feedback over MCP. These settings decide what they may write back, and how they should behave before they start editing.', 'jumplinks-editorial-workflow' ); ?>
		</p>
		<?php
	}

	/**
	 * Sits under the AI agent fields: the rules above only reach an agent when
	 * it calls `flow/get-instructions`, so the screen has to hand the user a
	 * prompt that makes it do that.
	 */
	public function render_agent_primer( string $section_id ): void {
		if ( 'flow_ew_ai_agent' !== $section_id ) {
			return;
		}
		?>
		<div class="flow-ew-agent-primer">
			<p class="description">
				<?php esc_html_e( 'After changing settings, we recommend the following prompt for your agent:', 'jumplinks-editorial-workflow' ); ?>
			</p>
			<?php
			$this->render_agent_prompt(
				__( 'Call the Flow get-instructions tool now, then follow those rules for the rest of this session. They reflect this site\'s current Flow settings.', 'jumplinks-editorial-workflow' )
			);
			?>
			<p class="description">
				<?php esc_html_e( 'Prompts for working through review feedback:', 'jumplinks-editorial-workflow' ); ?>
			</p>
			<?php
			$this->render_agent_prompt( __( 'Resolve all the Flow comments on post [id]', 'jumplinks-editorial-workflow' ) );
			$this->render_agent_prompt( __( 'Give me an overview of the feedback on [url]', 'jumplinks-editorial-workflow' ) );
			$this->render_agent_prompt( __( 'Send the page back to the reviewer', 'jumplinks-editorial-workflow' ) );
			?>
		</div>
		<?php
		$this->add_agent_primer_copy_script();
	}

	/** One copyable prompt, with the copy control inside the box. */
	private function render_agent_prompt( string $prompt ): void {
		$copy = __( 'Copy', 'jumplinks-editorial-workflow' );
		?>
		<div class="flow-ew-agent-primer__row">
			<div class="flow-ew-agent-primer__box">
				<code class="flow-ew-agent-primer__text"><?php echo esc_html( $prompt ); ?></code>
				<button
					type="button"
					class="button-link flow-ew-agent-primer__copy"
					data-copy="<?php echo esc_attr( $prompt ); ?>"
					data-copy-label="<?php echo esc_attr( $copy ); ?>"
					data-copied-label="<?php esc_attr_e( 'Copied!', 'jumplinks-editorial-workflow' ); ?>"
					title="<?php echo esc_attr( $copy ); ?>"
					aria-label="<?php echo esc_attr( $copy ); ?>"
				>
					<svg class="flow-ew-copy-icon flow-ew-copy-icon--copy" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M18 0H8C6.897 0 6 0.897 6 2V6H2C0.897 6 0 6.897 0 8V18C0 19.103 0.897 20 2 20H12C13.103 20 14 19.103 14 18V14H18C19.103 14 20 13.103 20 12V2C20 0.897 19.103 0 18 0ZM2 18V8H12L12.002 18H2ZM18 12H14V8C14 6.897 13.103 6 12 6H8V2H18V12Z" transform="translate(2 2)"/></svg>
					<svg class="flow-ew-copy-icon flow-ew-copy-icon--done" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>
					<span class="screen-reader-text"><?php echo esc_html( $copy ); ?></span>
				</button>
			</div>
		</div>
		<?php
	}

	/**
	 * Copies the suggested opening prompt. `navigator.clipboard` needs a secure
	 * context, which an admin served over plain HTTP is not, so the textarea
	 * fallback stays.
	 */
	private function add_agent_primer_copy_script(): void {
		$js = <<<'JS'
(function(){
	var buttons=document.querySelectorAll('.flow-ew-agent-primer__copy');
	if(!buttons.length)return;
	function fallback(text,done){
		var ta=document.createElement('textarea');
		ta.value=text;
		ta.setAttribute('readonly','');
		ta.style.position='absolute';
		ta.style.left='-9999px';
		document.body.appendChild(ta);
		ta.select();
		try{document.execCommand('copy');done();}catch(e){}
		document.body.removeChild(ta);
	}
	Array.prototype.forEach.call(buttons,function(btn){
		btn.addEventListener('click',function(){
			var text=btn.getAttribute('data-copy')||'';
			var copyLabel=btn.getAttribute('data-copy-label')||'';
			var copiedLabel=btn.getAttribute('data-copied-label')||copyLabel;
			var done=function(){
				btn.classList.add('is-copied');
				btn.setAttribute('title',copiedLabel);
				btn.setAttribute('aria-label',copiedLabel);
				window.setTimeout(function(){
					btn.classList.remove('is-copied');
					btn.setAttribute('title',copyLabel);
					btn.setAttribute('aria-label',copyLabel);
				},2000);
			};
			if(navigator.clipboard&&navigator.clipboard.writeText){
				navigator.clipboard.writeText(text).then(done).catch(function(){fallback(text,done);});
			}else{
				fallback(text,done);
			}
		});
	});
})();
JS;
		wp_add_inline_script( 'flow-ew-settings-fields', $js, 'after' );
	}

	public function render_agent_comments_field(): void {
		$this->render_checkbox(
			self::OPTION_AGENT_COMMENTS,
			(bool) get_option( self::OPTION_AGENT_COMMENTS, false ),
			__( 'Let AI agents write comments', 'jumplinks-editorial-workflow' ),
			__( 'Lets connected agents write comments back on a review. Choose below what they are allowed to write. Off until you also choose a user.', 'jumplinks-editorial-workflow' )
		);
		?>
		<script>
			( function () {
				// This script is inside the first field's cell, so the rows it
				// controls are not parsed yet — wait for the document.
				var start = function () {
					var toggle = document.querySelector( 'input[name="<?php echo esc_js( self::OPTION_AGENT_COMMENTS ); ?>"]' );
					var rows   = document.querySelectorAll( 'tr.flow-ew-agent-dependent' );
					if ( ! toggle || ! rows.length ) {
						return;
					}
					// Hidden, never disabled: a disabled input posts nothing
					// and options.php would write null over the saved value.
					var sync = function () {
						Array.prototype.forEach.call( rows, function ( row ) {
							row.hidden = ! toggle.checked;
						} );
					};
					toggle.addEventListener( 'change', sync );
					sync();

					// Block the save rather than let the server quietly refuse
					// the switch. A hidden input cannot use HTML validation.
					var form = toggle.form;
					var user = document.querySelector( 'input[name="<?php echo esc_js( self::OPTION_AGENT_COMMENT_AUTHOR ); ?>"]' );
					var note = document.querySelector( '[data-flow-ew-agent-author-error]' );
					if ( ! form || ! user || ! note ) {
						return;
					}
					form.addEventListener( 'submit', function ( event ) {
						var missing = toggle.checked && ! ( parseInt( user.value, 10 ) > 0 );
						note.hidden = ! missing;
						if ( ! missing ) {
							return;
						}
						event.preventDefault();
						var search = document.getElementById( 'flow-ew-agent-author-search' );
						if ( search ) {
							search.focus();
						}
						note.scrollIntoView( { block: 'center' } );
					} );
				};
				if ( 'loading' === document.readyState ) {
					document.addEventListener( 'DOMContentLoaded', start );
				} else {
					start();
				}
			} )();
		</script>
		<?php
	}

	public function render_agent_author_field(): void {
		?>
		<p class="flow-ew-agent-author-error" data-flow-ew-agent-author-error hidden>
			<?php esc_html_e( 'Choose the user AI comments are posted as before turning them on.', 'jumplinks-editorial-workflow' ); ?>
		</p>
		<?php
		$this->render_user_combobox(
			'flow-ew-agent-author',
			self::OPTION_AGENT_COMMENT_AUTHOR,
			self::get_agent_comment_author_id(),
			__( 'Agent comments are posted under this user\'s name and avatar. Leave empty to stop agents writing anything. Anyone who can comment on a review can cause a comment to appear as this user, so pick an account you are happy to lend.', 'jumplinks-editorial-workflow' )
		);
	}

	public function render_agent_resolve_notes_field(): void {
		$this->render_checkbox(
			self::OPTION_AGENT_RESOLVE_NOTES,
			(bool) get_option( self::OPTION_AGENT_RESOLVE_NOTES, true ),
			__( 'Say what was changed when resolving', 'jumplinks-editorial-workflow' ),
			__( 'An agent must post a short note describing what it actually changed before a comment counts as resolved, so every resolved thread keeps its own record. With this off, agents resolve silently.', 'jumplinks-editorial-workflow' )
		);
	}

	public function render_agent_followup_field(): void {
		$this->render_checkbox(
			self::OPTION_AGENT_FOLLOWUP,
			(bool) get_option( self::OPTION_AGENT_FOLLOWUP, true ),
			__( 'Ask when feedback is unclear', 'jumplinks-editorial-workflow' ),
			__( 'An agent may reply once inside a thread to ask what you meant instead of guessing, and leaves the comment unresolved until you answer.', 'jumplinks-editorial-workflow' )
		);
	}

	public function render_agent_ask_before_edit_field(): void {
		$this->render_checkbox(
			self::OPTION_AGENT_ASK_BEFORE_EDIT,
			(bool) get_option( self::OPTION_AGENT_ASK_BEFORE_EDIT, false ),
			__( 'Summarise the changes and wait for my go-ahead', 'jumplinks-editorial-workflow' ),
			__( 'The agent works out everything it would change, describes it in your chat — which page, which wording, and anything it still needs from you — then waits for you to confirm before touching the site. This is an instruction Flow gives the agent, not something it can enforce: an agent that ignores it can still edit.', 'jumplinks-editorial-workflow' )
		);
	}

	public function render_agent_marker_field(): void {
		$this->render_checkbox(
			self::OPTION_AGENT_COMMENT_MARKER,
			(bool) get_option( self::OPTION_AGENT_COMMENT_MARKER, true ),
			__( 'Mark comments as AI-written', 'jumplinks-editorial-workflow' ),
			__( 'Adds a small AI label to those comments. The author stays the user above either way; turning this off only hides the label.', 'jumplinks-editorial-workflow' )
		);
	}

	/**
	 * One user picker. `$base_id` scopes the ids; the script finds every
	 * instance by class, so more than one may appear on the page.
	 */
	private function render_user_combobox( string $base_id, string $option_name, int $user_id, string $description ): void {
		$user = $user_id > 0 ? get_userdata( $user_id ) : false;
		if ( ! $user ) {
			$user_id = 0;
		}
		?>
		<div id="<?php echo esc_attr( $base_id ); ?>" class="flow-ew-user-combobox">
			<input
				type="hidden"
				id="<?php echo esc_attr( $base_id . '-id' ); ?>"
				class="flow-ew-user-combobox__value"
				name="<?php echo esc_attr( $option_name ); ?>"
				value="<?php echo esc_attr( (string) $user_id ); ?>"
			/>
			<div class="flow-ew-user-combobox__field">
				<div class="flow-ew-user-combobox__control">
					<input
						type="search"
						id="<?php echo esc_attr( $base_id . '-search' ); ?>"
						class="regular-text flow-ew-user-combobox__search"
						placeholder="<?php esc_attr_e( 'Search users…', 'jumplinks-editorial-workflow' ); ?>"
						autocomplete="off"
						role="combobox"
						aria-autocomplete="list"
						aria-expanded="false"
						aria-controls="<?php echo esc_attr( $base_id . '-results' ); ?>"
					/>
					<button
						type="button"
						class="button flow-ew-user-combobox__clear"
						<?php echo 0 === $user_id ? 'hidden' : ''; ?>
					><?php esc_html_e( 'Clear', 'jumplinks-editorial-workflow' ); ?></button>
				</div>
				<div
					id="<?php echo esc_attr( $base_id . '-selected' ); ?>"
					class="flow-ew-user-combobox__selected"
					<?php echo 0 === $user_id ? 'hidden' : ''; ?>
				>
					<?php if ( $user ) : ?>
						<?php echo get_avatar( $user_id, 32 ); ?>
						<span><?php echo esc_html( (string) $user->display_name ); ?></span>
					<?php endif; ?>
				</div>
				<div
					id="<?php echo esc_attr( $base_id . '-results' ); ?>"
					class="flow-ew-user-combobox__results"
					role="listbox"
					hidden
				></div>
			</div>
			<p class="description"><?php echo esc_html( $description ); ?></p>
		</div>
		<?php
	}

	public function render_show_upgrade_hints_field(): void {
		$this->render_checkbox(
			self::OPTION_SHOW_UPGRADE_HINTS,
			self::should_show_upgrade_hints(),
			__( 'Show marketing', 'jumplinks-editorial-workflow' ),
			__( 'Show Pro upgrade prompts across the admin menu, editors, and review page. Turn off to hide the [PRO] Site Review and Integrations menu items plus the "unlock" hints in editors and on the review page. The "Upgrade" entry and the early-bird discount bar (which reviewers can dismiss) stay visible.', 'jumplinks-editorial-workflow' )
		);
	}

	public function render_debug_mode_field(): void {
		$this->render_checkbox(
			self::OPTION_DEBUG_MODE,
			self::is_debug_mode(),
			__( 'Debug mode', 'jumplinks-editorial-workflow' ),
			__( 'When enabled, administrators have full access to all review pages and actions.', 'jumplinks-editorial-workflow' )
		);
	}

	public function render_disable_notifications_field(): void {
		$this->render_checkbox(
			self::OPTION_DISABLE_NOTIFICATIONS,
			self::are_notifications_disabled(),
			__( 'Disable all notifications.', 'jumplinks-editorial-workflow' ),
			__( 'When enabled, no review-related emails are sent at all (assignment, approval, changes requested, mentions). Use this for staging or quiet rollouts.', 'jumplinks-editorial-workflow' )
		);
	}

	public function render_disable_external_reviewers_field(): void {
		$this->render_checkbox(
			self::OPTION_DISABLE_EXTERNAL,
			self::are_external_reviewers_disabled(),
			__( 'Disable external reviewers.', 'jumplinks-editorial-workflow' ),
			__( 'Hide the External Email option in the editor and reject email invites at the API. People already invited keep the access they have.', 'jumplinks-editorial-workflow' )
		);
	}

	public function render_disable_open_reviews_field(): void {
		$this->render_checkbox(
			self::OPTION_DISABLE_OPEN_REVIEWS,
			self::are_open_reviews_disabled(),
			__( 'Disable open reviews.', 'jumplinks-editorial-workflow' ),
			__( 'Hide the Open Review toggle in the editor and lock review pages to assigned participants only. Existing open reviews stop accepting public-link visitors immediately.', 'jumplinks-editorial-workflow' )
		);
		\do_action( 'flow_ew_after_open_review_field' );
	}

	/**
	 * A labelled checkbox with a bold title and description.
	 *
	 * @param bool $hidden_zero Also post `0` when unchecked, for options that
	 *                          must round-trip an explicit false.
	 */
	private function render_checkbox( string $option, bool $checked, string $label, string $description, bool $hidden_zero = false ): void {
		if ( $hidden_zero ) {
			printf( '<input type="hidden" name="%s" value="0" />', esc_attr( $option ) );
		}
		?>
		<label class="flow-ew-settings-check">
			<input type="checkbox" name="<?php echo esc_attr( $option ); ?>" value="1" <?php checked( $checked, true ); ?> />
			<span>
				<strong><?php echo esc_html( $label ); ?></strong><br>
				<span class="description"><?php echo esc_html( $description ); ?></span>
			</span>
		</label>
		<?php
	}

	public function enqueue_settings_assets( string $hook_suffix ): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$is_settings = null !== $this->settings_hook_suffix && $this->settings_hook_suffix === $hook_suffix;
		$is_setup    = 'admin_page_' . Setup_Wizard::PAGE_SLUG === $hook_suffix;
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
		// Once for the page, not once per picker — two copies would double
		// every user search.
		$this->add_user_combobox_script();
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

	/**
	 * Drives every `.flow-ew-user-combobox` on the page. Scoped by class, not
	 * by id, so a second picker needs no extra script.
	 */
	private function add_user_combobox_script(): void {
		$js = <<<'JS'
(function(){
	if(!window.wp||!window.wp.apiFetch)return;
	var roots=document.querySelectorAll('.flow-ew-user-combobox');
	Array.prototype.forEach.call(roots,function(root){
		var hidden=root.querySelector('.flow-ew-user-combobox__value');
		var input=root.querySelector('.flow-ew-user-combobox__search');
		var results=root.querySelector('.flow-ew-user-combobox__results');
		var selected=root.querySelector('.flow-ew-user-combobox__selected');
		var clear=root.querySelector('.flow-ew-user-combobox__clear');
		if(!hidden||!input||!results||!selected||!clear)return;
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
				option.setAttribute('role','option');
				var name=document.createElement('span');
				name.className='flow-ew-user-combobox__option-name';
				name.textContent=user.name;
				option.appendChild(name);
				// Two people can share a display name; the address or username
				// is what tells them apart.
				var detail=user.email||user.login||'';
				if(detail&&detail!==user.name){
					var meta=document.createElement('span');
					meta.className='flow-ew-user-combobox__option-meta';
					meta.textContent=detail;
					option.appendChild(meta);
				}
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
	});
})();
JS;
		wp_add_inline_script( 'flow-ew-settings-fields', $js, 'after' );
	}

	/**
	 * Registered sections as tabs. Every section stays in the DOM and in the
	 * form — `options.php` writes null over any registered option missing from
	 * the post, so a tab that submitted only its own fields would wipe the
	 * others. Tabs are presentation only; without JavaScript all sections show.
	 */
	private function render_sections_in_tabs(): void {
		global $wp_settings_sections;

		$sections = $wp_settings_sections[ self::PAGE_SLUG ] ?? [];
		if ( count( $sections ) < 2 ) {
			do_settings_sections( self::PAGE_SLUG );
			return;
		}

		$ids    = array_keys( $sections );
		$active = (string) reset( $ids );

		// options.php sends the browser back to `_wp_http_referer`, and a URL
		// fragment never survives that round trip, so the tab travels as a query
		// arg and the active panel is picked here rather than after paint.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display-only, and validated against the registered section ids below.
		$requested = isset( $_GET['flow_tab'] ) ? sanitize_key( wp_unslash( $_GET['flow_tab'] ) ) : '';
		if ( '' !== $requested && isset( $sections[ $requested ] ) ) {
			$active = $requested;
		}
		?>
		<nav class="nav-tab-wrapper flow-ew-settings-tabs" role="tablist">
			<?php foreach ( $sections as $id => $section ) : ?>
				<button
					type="button"
					role="tab"
					class="nav-tab<?php echo $id === $active ? ' nav-tab-active' : ''; ?>"
					aria-selected="<?php echo $id === $active ? 'true' : 'false'; ?>"
					aria-controls="<?php echo esc_attr( 'flow-ew-tab-' . $id ); ?>"
					data-flow-ew-tab="<?php echo esc_attr( $id ); ?>"
				>
					<?php echo esc_html( (string) ( $section['title'] ?? $id ) ); ?>
				</button>
			<?php endforeach; ?>
		</nav>

		<?php foreach ( $sections as $id => $section ) : ?>
			<div
				id="<?php echo esc_attr( 'flow-ew-tab-' . $id ); ?>"
				class="flow-ew-settings-tab-panel"
				data-flow-ew-tab-panel="<?php echo esc_attr( $id ); ?>"
				<?php echo $id === $active ? '' : 'hidden'; ?>
			>
				<?php
				if ( ! empty( $section['callback'] ) ) {
					call_user_func( $section['callback'], $section );
				}
				echo '<table class="form-table" role="presentation">';
				do_settings_fields( self::PAGE_SLUG, (string) $id );
				echo '</table>';
				/**
				 * Lets a section add something below its fields.
				 *
				 * @param string $id Section id.
				 */
				do_action( 'flow_ew_after_settings_section', (string) $id );
				?>
			</div>
		<?php endforeach; ?>
		<?php
		$this->print_tab_script();
	}

	/** Remembers the open tab in the URL so a save returns to it. */
	private function print_tab_script(): void {
		?>
		<script>
			( function () {
				var tabs = document.querySelectorAll( '[data-flow-ew-tab]' );
				var panels = document.querySelectorAll( '[data-flow-ew-tab-panel]' );
				if ( ! tabs.length ) {
					return;
				}
				function show( id ) {
					var matched = false;
					panels.forEach( function ( panel ) {
						var mine = panel.getAttribute( 'data-flow-ew-tab-panel' ) === id;
						panel.hidden = ! mine;
						matched = matched || mine;
					} );
					if ( ! matched ) {
						return false;
					}
					tabs.forEach( function ( tab ) {
						var mine = tab.getAttribute( 'data-flow-ew-tab' ) === id;
						tab.classList.toggle( 'nav-tab-active', mine );
						tab.setAttribute( 'aria-selected', mine ? 'true' : 'false' );
					} );
					rememberForSave( id );
					return true;
				}
				// Saving posts to options.php, which redirects to whatever
				// `_wp_http_referer` held. Fragments are never sent, so the tab
				// rides in the query string or the save lands back on the first.
				function rememberForSave( id ) {
					var field = document.querySelector( 'input[name="_wp_http_referer"]' );
					if ( ! field ) {
						return;
					}
					var parts = field.value.split( '#' )[ 0 ].split( '?' );
					var params = ( parts[ 1 ] || '' ).split( '&' ).filter( function ( p ) {
						return p && p.indexOf( 'flow_tab=' ) !== 0;
					} );
					params.push( 'flow_tab=' + encodeURIComponent( id ) );
					field.value = parts[ 0 ] + '?' + params.join( '&' );
				}
				tabs.forEach( function ( tab ) {
					tab.addEventListener( 'click', function () {
						var id = tab.getAttribute( 'data-flow-ew-tab' );
						if ( show( id ) ) {
							window.history.replaceState( null, '', '#' + id );
						}
					} );
				} );
				function fromHash() {
					if ( window.location.hash ) {
						show( window.location.hash.replace( /^#/, '' ) );
					}
				}
				// Also on hashchange, so browser back and forward move tabs.
				window.addEventListener( 'hashchange', fromHash );
				fromHash();
			}() );
		</script>
		<?php
	}

	public function render_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Flow Settings', 'jumplinks-editorial-workflow' ); ?></h1>

			<?php settings_errors( self::OPTION_AGENT_COMMENTS ); ?>

			<?php Dashboard_Page::render_rating_prompt(); ?>

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
				$this->render_sections_in_tabs();
				submit_button();
				?>
			</form>
			<?php \do_action( 'flow_ew_after_settings_page', self::PAGE_SLUG ); ?>
		</div>
		<?php
	}
}
