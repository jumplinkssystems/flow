<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * First-run setup: the hidden admin page, its skip/save handlers, the REST
 * endpoint the React modal posts to, and the modal's enqueue. Field markup
 * and sanitisation stay on Settings, which owns the options.
 */
class Setup_Wizard {

	const PAGE_SLUG = 'flow-ew-setup';

	private Settings $settings;

	public function __construct( Settings $settings ) {
		$this->settings = $settings;
	}

	public function boot(): void {
		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores -- $page_hook from add_submenu_page uses the menu slug.
		add_action( 'load-admin_page_' . self::PAGE_SLUG, [ $this, 'prime_admin_title' ], 0 );
		add_action( 'admin_menu', [ $this, 'add_menu_page' ], 11 );
		add_action( 'admin_init', [ $this, 'handle_skip' ], 1 );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue' ] );
		add_action( 'admin_post_flow_ew_setup_save', [ $this, 'handle_save' ] );
		add_action( 'rest_api_init', [ $this, 'register_rest_route' ] );
	}

	/** Hidden from the menu (parent slug ``); reached from the activation banner. */
	public function add_menu_page(): void {
		add_submenu_page(
			'',
			__( 'Flow setup', 'jumplinks-editorial-workflow' ),
			'',
			'manage_options',
			self::PAGE_SLUG,
			[ $this, 'render_page' ]
		);
	}

	public function prime_admin_title(): void {
		global $title;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- admin $title for hidden admin.php submenu (see admin-header.php strip_tags).
		$title = __( 'Flow setup', 'jumplinks-editorial-workflow' );
	}


	/**
	 * The wizard is now a modal (no admin-page redirect). The activation transient
	 * still acts as a one-shot signal: the React modal opens automatically the
	 * next time the admin loads any page.
	 */
	private function should_auto_open(): bool {
		if ( wp_doing_ajax() || ! is_user_logged_in() ) {
			return false;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}
		if ( Settings::is_setup_completed() ) {
			return false;
		}
		return (bool) get_transient( 'flow_ew_activation_redirect' );
	}


	/**
	 * Allow admins to preview the activation wizard without re-activating the plugin.
	 * Visit any screen that loads the wizard with ?flow_ew_open_setup=1 .
	 */
	private function is_forced_open(): bool {
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


	public function handle_skip(): void {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- verified below.
		if ( ! isset( $_GET['page'], $_GET['flow_ew_skip_setup'], $_GET['_wpnonce'] ) ) {
			return;
		}
		$page = sanitize_key( wp_unslash( $_GET['page'] ) );
		if ( self::PAGE_SLUG !== $page ) {
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
		update_option( Settings::OPTION_SETUP_COMPLETED, true );
		wp_safe_redirect( admin_url( 'admin.php?page=' . Settings::PAGE_SLUG ) );
		exit;
	}


	public function handle_save(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to do that.', 'jumplinks-editorial-workflow' ) );
		}
		check_admin_referer( 'flow_ew_setup_save', 'flow_ew_setup_nonce' );

		$m_raw = isset( $_POST[ Settings::OPTION_MANDATORY ] )
			? sanitize_text_field( wp_unslash( $_POST[ Settings::OPTION_MANDATORY ] ) )
			: '0';
		update_option( Settings::OPTION_MANDATORY, '1' === $m_raw );

		$pt_in = [];
		if ( isset( $_POST[ Settings::OPTION_SUPPORTED_POST_TYPES ] ) && is_array( $_POST[ Settings::OPTION_SUPPORTED_POST_TYPES ] ) ) {
			$pt_in = array_map( 'sanitize_key', wp_unslash( $_POST[ Settings::OPTION_SUPPORTED_POST_TYPES ] ) );
		}
		update_option( Settings::OPTION_SUPPORTED_POST_TYPES, $this->settings->sanitize_supported_post_types( $pt_in ) );

		$roles_in = [];
		if ( isset( $_POST[ Settings::OPTION_REVIEWER_ROLES ] ) && is_array( $_POST[ Settings::OPTION_REVIEWER_ROLES ] ) ) {
			$roles_in = array_map( 'sanitize_key', wp_unslash( $_POST[ Settings::OPTION_REVIEWER_ROLES ] ) );
		}
		update_option( Settings::OPTION_REVIEWER_ROLES, $this->settings->sanitize_reviewer_roles( $roles_in ) );

		update_option( Settings::OPTION_SETUP_COMPLETED, true );
		wp_safe_redirect(
			admin_url(
				'admin.php?page=' . rawurlencode( Settings::PAGE_SLUG ) . '&flow_ew_setup_done=1'
			)
		);
		exit;
	}


	public function render_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'jumplinks-editorial-workflow' ) );
		}
		$skip_url = wp_nonce_url(
			admin_url( 'admin.php?page=' . Settings::PAGE_SLUG . '&flow_ew_skip_setup=1' ),
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
					<?php $this->settings->render_mandatory_field(); ?>

					<h2 class="flow-ew-setup-step-title"><?php esc_html_e( 'Content types', 'jumplinks-editorial-workflow' ); ?></h2>
					<p class="flow-ew-setup-step-desc">
						<?php esc_html_e( 'Pick which post types use the workflow. Only types with the block editor and REST support are listed.', 'jumplinks-editorial-workflow' ); ?>
					</p>
					<?php $this->settings->render_supported_post_types_field(); ?>

					<h2 class="flow-ew-setup-step-title"><?php esc_html_e( 'Reviewer roles', 'jumplinks-editorial-workflow' ); ?></h2>
					<p class="flow-ew-setup-step-desc">
						<?php esc_html_e( 'Pick roles that should be able to review content.', 'jumplinks-editorial-workflow' ); ?>
					</p>
					<?php $this->settings->render_reviewer_roles_field(); ?>

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


	public function enqueue( string $hook_suffix ): void {
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
				$this->settings->settings_hook_suffix(),
			]
		);
		if ( ! in_array( $hook_suffix, $allowed_hooks, true ) ) {
			return;
		}

		$auto_open    = $this->is_forced_open() || $this->should_auto_open();
		$completed    = Settings::is_setup_completed();
		$is_main_page = ( null !== $this->settings->settings_hook_suffix() && $this->settings->settings_hook_suffix() === $hook_suffix );

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
			Assets::style_version( FLOW_EW_PLUGIN_DIR . 'build/setup-wizard/style-index' . $css_suffix . '.css', (string) $asset['version'] )
		);

		if ( $auto_open && $this->should_auto_open() ) {
			delete_transient( 'flow_ew_activation_redirect' );
		}

		$post_types = [];
		foreach ( Settings::get_post_types_eligible_for_flow() as $slug => $obj ) {
			$post_types[] = [
				'slug'  => (string) $slug,
				'label' => isset( $obj->labels->singular_name ) ? (string) $obj->labels->singular_name : (string) $slug,
			];
		}

		$roles = Settings::get_reviewer_role_choices();

		wp_localize_script(
			'flow-ew-setup-wizard',
			'flowEWSetup',
			[
				'restUrl'          => rest_url( 'flow/v1/setup' ),
				'nonce'            => wp_create_nonce( 'wp_rest' ),
				'autoOpen'         => $auto_open,
				'completed'        => $completed,
				'settingsUrl'      => admin_url( 'admin.php?page=' . Settings::PAGE_SLUG ),
				'reviewerRoleSlug' => Activator::REVIEWER_ROLE,
				'current'          => [
					'mandatory'     => Settings::is_mandatory(),
					'postTypes'     => Settings::get_supported_post_types(),
					'reviewerRoles' => Settings::get_reviewer_roles(),
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


	public function register_rest_route(): void {
		register_rest_route(
			'flow/v1',
			'/setup',
			[
				[
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => [ $this, 'rest_save' ],
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
	public function rest_save( $request ) {
		$mandatory     = (bool) $request->get_param( 'mandatory' );
		$post_types_in = (array) $request->get_param( 'post_types' );
		$roles_in      = (array) $request->get_param( 'reviewer_roles' );

		update_option( Settings::OPTION_MANDATORY, $mandatory );
		update_option( Settings::OPTION_SUPPORTED_POST_TYPES, $this->settings->sanitize_supported_post_types( $post_types_in ) );
		update_option( Settings::OPTION_REVIEWER_ROLES, $this->settings->sanitize_reviewer_roles( $roles_in ) );
		update_option( Settings::OPTION_SETUP_COMPLETED, true );

		return rest_ensure_response(
			[
				'ok'        => true,
				'mandatory' => Settings::is_mandatory(),
				'postTypes' => Settings::get_supported_post_types(),
				'roles'     => Settings::get_reviewer_roles(),
			]
		);
	}
}
