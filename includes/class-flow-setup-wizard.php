<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * First-run setup: the React modal's enqueue and the REST endpoints it posts
 * to. What each use case writes lives in Setup_Presets; Settings owns the
 * options and their sanitisation.
 */
class Setup_Wizard {

	private Settings $settings;

	public function __construct( Settings $settings ) {
		$this->settings = $settings;
	}

	public function boot(): void {
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue' ] );
		add_action( 'rest_api_init', [ $this, 'register_rest_route' ] );
	}

	/**
	 * The activation transient keeps the modal opening on each landing screen
	 * until the admin finishes or dismisses it.
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
				// Freemius lands new installs here after activation.
				'toplevel_page_' . Dashboard_Page::PAGE_SLUG,
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

		$post_types = [];
		foreach ( Settings::get_post_types_eligible_for_flow() as $slug => $obj ) {
			$post_types[] = [
				'slug'  => (string) $slug,
				'label' => isset( $obj->labels->singular_name ) ? (string) $obj->labels->singular_name : (string) $slug,
			];
		}

		wp_localize_script(
			'flow-ew-setup-wizard',
			'flowEWSetup',
			[
				'restUrl'          => rest_url( 'flow/v1/setup' ),
				'skipUrl'          => rest_url( 'flow/v1/setup/skip' ),
				'usersUrl'         => rest_url( 'flow/v1/users/search' ),
				'nonce'            => wp_create_nonce( 'wp_rest' ),
				'autoOpen'         => $auto_open,
				'completed'        => $completed,
				'settingsUrl'      => admin_url( 'admin.php?page=' . Settings::PAGE_SLUG ),
				'docsUrl'          => Settings::DOCS_URL,
				'agentPrompt'      => Settings::agent_primer_prompt(),
				'reviewerRoleSlug' => Activator::REVIEWER_ROLE,
				'current'          => $this->current_answers(),
				'next'             => self::next_steps_data(),
				'choices'          => [
					'postTypes' => $post_types,
					'roles'     => Settings::get_reviewer_role_choices(),
				],
				'i18n'             => $this->strings(),
			]
		);
	}

	/**
	 * What the last screen needs to point people at their first review.
	 *
	 * @return array<string,mixed>
	 */
	private static function next_steps_data(): array {
		return [
			'newPostUrl'         => admin_url( 'post-new.php' ),
			'addUserUrl'         => current_user_can( 'create_users' ) ? admin_url( 'user-new.php' ) : '',
			'usersUrl'           => current_user_can( 'list_users' ) ? admin_url( 'users.php' ) : '',
			'clientVideoWebm'    => Assets::asset_url( 'assets/invite-client.webm' ),
			'editorialVideoWebm' => Assets::asset_url( 'assets/editorial-assign.webm' ),
		];
	}

	/**
	 * The site's settings in the wizard's answer shape, so a re-run starts from
	 * what is saved and the last screen can show what changes.
	 *
	 * @return array<string,mixed>
	 */
	private function current_answers(): array {
		$reviewer_id = Settings::get_auto_assign_reviewer_id();
		$reviewer    = $reviewer_id > 0 ? get_userdata( $reviewer_id ) : false;
		$agent_id    = Settings::get_agent_comment_author_id();
		$agent       = $agent_id > 0 ? get_userdata( $agent_id ) : false;

		return [
			'useCase'               => Settings::use_case(),
			'reviewMode'            => Settings::review_mode(),
			'postTypes'             => Settings::get_supported_post_types(),
			'reviewerRoles'         => Settings::get_reviewer_roles(),
			'allowExternal'         => ! Settings::are_external_reviewers_disabled(),
			'openReviews'           => ! Settings::are_open_reviews_disabled(),
			'selfReview'            => (bool) get_option( Settings::OPTION_SELF_REVIEW, false ),
			'showReviewedBy'        => Settings::should_show_reviewed_by(),
			'autoAssignReviewer'    => $reviewer ? [
				'id'   => $reviewer_id,
				'name' => (string) $reviewer->display_name,
			] : null,
			'autoAssignEmail'       => (string) get_option( Settings::OPTION_AUTO_ASSIGN_EMAIL, '' ),
			'agentComments'         => Settings::agent_comments_enabled(),
			'agentAuthor'           => $agent ? [
				'id'   => $agent_id,
				'name' => (string) $agent->display_name,
			] : null,
			'agentResolveNotes'     => (bool) get_option( Settings::OPTION_AGENT_RESOLVE_NOTES, true ),
			'agentFollowup'         => (bool) get_option( Settings::OPTION_AGENT_FOLLOWUP, true ),
			'agentMarker'           => (bool) get_option( Settings::OPTION_AGENT_COMMENT_MARKER, true ),
			'agentAskBeforeEditing' => (bool) get_option( Settings::OPTION_AGENT_ASK_BEFORE_EDIT, false ),
		];
	}

	/**
	 * @return array<string,string>
	 */
	private function strings(): array {
		$labels = Setup_Presets::labels();
		return [
			'title'               => __( 'Welcome to Flow', 'jumplinks-editorial-workflow' ),
			'lead'                => __( 'A short setup so Flow fits how you work. You can change everything later under Flow → Settings.', 'jumplinks-editorial-workflow' ),
			'step'                => __( 'Step', 'jumplinks-editorial-workflow' ),
			'of'                  => __( 'of', 'jumplinks-editorial-workflow' ),
			'next'                => __( 'Next', 'jumplinks-editorial-workflow' ),
			'back'                => __( 'Back', 'jumplinks-editorial-workflow' ),
			'finish'              => __( 'Finish', 'jumplinks-editorial-workflow' ),
			'skip'                => __( 'Skip for now', 'jumplinks-editorial-workflow' ),
			'saving'              => __( 'Saving…', 'jumplinks-editorial-workflow' ),
			'saved'               => __( 'Setup saved. Your workflow preferences are active.', 'jumplinks-editorial-workflow' ),
			'errorGeneric'        => __( 'Could not save. Please try again.', 'jumplinks-editorial-workflow' ),
			'selectAll'           => __( 'Select all', 'jumplinks-editorial-workflow' ),
			'deselectAll'         => __( 'Deselect all', 'jumplinks-editorial-workflow' ),

			'useCaseTitle'        => __( 'What will you use Flow for?', 'jumplinks-editorial-workflow' ),
			'useCaseDesc'         => __( 'Pick the closest match. Flow sets itself up for it and only asks what is left.', 'jumplinks-editorial-workflow' ),
			'editorialLabel'      => $labels[ Setup_Presets::EDITORIAL ],
			'editorialDesc'       => __( 'Your team writes, an editor reviews each page on the live site, leaves comments and approves it before it goes out.', 'jumplinks-editorial-workflow' ),
			'clientLabel'         => $labels[ Setup_Presets::CLIENT ],
			'clientDesc'          => __( 'Send a client an email link. They comment on the live page and approve it, with no WordPress account.', 'jumplinks-editorial-workflow' ),
			'buildAiLabel'        => $labels[ Setup_Presets::BUILD_AI ],
			'buildAiDesc'         => __( 'You build the site with an AI agent. Every page gets a private review link where you leave comments for the agent to fix. No reviewers, no approval step.', 'jumplinks-editorial-workflow' ),
			'approveAiLabel'      => $labels[ Setup_Presets::APPROVE_AI ],
			'approveAiDesc'       => __( 'An AI agent writes drafts and a person reviews them. Nothing is published until a human approves it, including drafts that already exist.', 'jumplinks-editorial-workflow' ),

			'modeTitle'           => __( 'Review mode', 'jumplinks-editorial-workflow' ),
			'modeDesc'            => __( 'Decide whether publishing requires an approved review, or if reviews are optional helpers your team can use when they want.', 'jumplinks-editorial-workflow' ),
			'modeOptional'        => __( 'Optional', 'jumplinks-editorial-workflow' ),
			'modeOptionalDesc'    => __( 'Authors can publish posts freely without a review. The review workflow stays available so teams can still request approval when it helps.', 'jumplinks-editorial-workflow' ),
			'modeMandatory'       => __( 'Mandatory', 'jumplinks-editorial-workflow' ),
			'modeMandatoryDesc'   => __( 'Publishing is blocked until the post is approved by a reviewer.', 'jumplinks-editorial-workflow' ),

			'typesTitle'          => __( 'Content types', 'jumplinks-editorial-workflow' ),
			'typesDesc'           => __( 'Pick which post types use the workflow. Only types with the block editor and REST support are listed.', 'jumplinks-editorial-workflow' ),
			'typesEmpty'          => __( 'No reviewable content types are available.', 'jumplinks-editorial-workflow' ),

			'rolesTitle'          => __( 'Reviewer roles', 'jumplinks-editorial-workflow' ),
			'rolesDesc'           => __( 'Users with these roles can be assigned as reviewers and approve or request changes.', 'jumplinks-editorial-workflow' ),

			'extrasTitle'         => __( 'Extras', 'jumplinks-editorial-workflow' ),
			'extrasDesc'          => __( 'Optional touches. All of them can be changed later.', 'jumplinks-editorial-workflow' ),
			'reviewedByLabel'     => __( 'Show "Reviewed by" credit', 'jumplinks-editorial-workflow' ),
			'reviewedByDesc'      => __( 'Shows who approved a page next to the author name on the published content.', 'jumplinks-editorial-workflow' ),
			'externalLabel'       => __( 'Allow external reviewers', 'jumplinks-editorial-workflow' ),
			'externalDesc'        => __( 'Lets you type an email address in the reviewer field. That person gets a review link and needs no WordPress account.', 'jumplinks-editorial-workflow' ),
			'autoAssignLabel'     => __( 'Automatic reviewer', 'jumplinks-editorial-workflow' ),
			'autoAssignDesc'      => __( 'Every new post gets this reviewer assigned when it is first saved. Leave empty to assign reviewers yourself.', 'jumplinks-editorial-workflow' ),
			'autoAssignEmailDesc' => __( 'Every new post gets this reviewer assigned when it is first saved: a WordPress user, or an email address for an external reviewer. Leave empty to assign reviewers yourself.', 'jumplinks-editorial-workflow' ),
			'searchUsers'         => __( 'Search users…', 'jumplinks-editorial-workflow' ),
			'searchUsersOrEmail'  => __( 'Search user or type email address', 'jumplinks-editorial-workflow' ),
			/* translators: %s: email address */
			'inviteEmail'         => __( 'Invite %s', 'jumplinks-editorial-workflow' ),
			'clear'               => __( 'Clear', 'jumplinks-editorial-workflow' ),

			'agentAskTitle'       => __( 'AI agent', 'jumplinks-editorial-workflow' ),
			'agentAskDesc'        => __( 'Flow can hand review comments to an AI agent connected to this site over MCP (for example through Agent Connector, AI Engine, Elementor MCP or Novamira), which then edits the page and resolves them.', 'jumplinks-editorial-workflow' ),
			'agentAskLabel'       => __( 'I connect an AI agent to this site', 'jumplinks-editorial-workflow' ),
			'agentAskHelp'        => __( 'Turn this on to choose what the agent may write back. You can also do this later under Flow → Settings → AI agent.', 'jumplinks-editorial-workflow' ),

			'agentTitle'          => __( 'AI agent settings', 'jumplinks-editorial-workflow' ),
			'agentDesc'           => __( 'Connected AI agents read review feedback over MCP. These settings decide what they may write back, and how they should behave before they start editing.', 'jumplinks-editorial-workflow' ),
			'agentCommentsLabel'  => __( 'Let AI agents write comments', 'jumplinks-editorial-workflow' ),
			'agentCommentsDesc'   => __( 'Lets connected agents write comments back on a review. Choose below what they are allowed to write. Off until you also choose a user.', 'jumplinks-editorial-workflow' ),
			'agentAuthorLabel'    => __( 'Select AI user', 'jumplinks-editorial-workflow' ),
			'agentAuthorDesc'     => __( 'Agent comments are posted under this user\'s name and avatar. Leave empty to stop agents writing anything. Anyone who can comment on a review can cause a comment to appear as this user, so pick an account you are happy to lend.', 'jumplinks-editorial-workflow' ),
			'agentAuthorRequired' => __( 'Choose the user AI comments are posted as before turning them on.', 'jumplinks-editorial-workflow' ),
			'agentResolveLabel'   => __( 'Say what was changed when resolving', 'jumplinks-editorial-workflow' ),
			'agentResolveDesc'    => __( 'An agent must post a short note describing what it actually changed before a comment counts as resolved, so every resolved thread keeps its own record. With this off, agents resolve silently.', 'jumplinks-editorial-workflow' ),
			'agentFollowupLabel'  => __( 'Ask when feedback is unclear', 'jumplinks-editorial-workflow' ),
			'agentFollowupDesc'   => __( 'An agent may reply once inside a thread to ask what you meant instead of guessing, and leaves the comment unresolved until you answer.', 'jumplinks-editorial-workflow' ),
			'agentMarkerLabel'    => __( 'Mark comments as AI-written', 'jumplinks-editorial-workflow' ),
			'agentMarkerDesc'     => __( 'Adds a small AI label to those comments. The author stays the user above either way; turning this off only hides the label.', 'jumplinks-editorial-workflow' ),
			'agentAskEditLabel'   => __( 'Summarise the changes and wait for my go-ahead', 'jumplinks-editorial-workflow' ),
			'agentAskEditDesc'    => __( 'The agent works out everything it would change, describes it in your chat — which page, which wording, and anything it still needs from you — then waits for you to confirm before touching the site. This is an instruction Flow gives the agent, not something it can enforce: an agent that ignores it can still edit.', 'jumplinks-editorial-workflow' ),
			'experimental'        => __( 'Experimental', 'jumplinks-editorial-workflow' ),

			'doneTitle'           => __( 'You are all set. What to do next', 'jumplinks-editorial-workflow' ),
			'doneDocs'            => __( 'Read the documentation', 'jumplinks-editorial-workflow' ),
			'nextStart'           => __( 'Start your first review', 'jumplinks-editorial-workflow' ),
			'nextRolesNone'       => __( 'Nobody can review yet: no user has one of the reviewer roles you picked.', 'jumplinks-editorial-workflow' ),
			/* translators: 1: number of users who can review, 2: their roles, e.g. "Editor, Flow Reviewer" */
			'nextRolesSome'       => __( 'Users who can review: %1$d (%2$s).', 'jumplinks-editorial-workflow' ),
			'nextRolesHint'       => __( 'Give each reviewer one of these roles under Users.', 'jumplinks-editorial-workflow' ),
			'nextAddUser'         => __( 'Add a user', 'jumplinks-editorial-workflow' ),
			'nextManageUsers'     => __( 'Manage users', 'jumplinks-editorial-workflow' ),
			'nextEditorial1'      => __( 'Open a post and find the Review panel.', 'jumplinks-editorial-workflow' ),
			'nextEditorial2'      => __( 'Pick a reviewer, then click Send for review.', 'jumplinks-editorial-workflow' ),
			'nextEditorial3'      => __( 'They get an email with the link, comment on the page, and approve it or request changes.', 'jumplinks-editorial-workflow' ),
			'nextMandatory'       => __( 'Publishing stays locked until a reviewer approves.', 'jumplinks-editorial-workflow' ),
			'nextClient1'         => __( 'Open a page and find the Review panel.', 'jumplinks-editorial-workflow' ),
			'nextClient2'         => __( 'Type your client\'s email address in the Reviewer field and choose Invite.', 'jumplinks-editorial-workflow' ),
			'nextClient3'         => __( 'Click Send for review. Your client gets the link by email and needs no account.', 'jumplinks-editorial-workflow' ),
			'nextClientTip'       => __( 'Tip: invite your own email address first to see exactly what your client will see.', 'jumplinks-editorial-workflow' ),
			'nextClientVideo'     => __( 'Inviting a client by email from the Review panel', 'jumplinks-editorial-workflow' ),
			'nextEditorialVideo'  => __( 'Assigning a reviewer from the Review panel', 'jumplinks-editorial-workflow' ),
			'nextPastePrompt'     => __( 'Paste this prompt into your AI agent to start:', 'jumplinks-editorial-workflow' ),
			'nextAgentTitle'      => __( 'Work with your AI agent', 'jumplinks-editorial-workflow' ),
			'nextTryAsking'       => __( 'Then try asking:', 'jumplinks-editorial-workflow' ),
			'nextBuildAi1'        => __( 'Ask it to build or change a page. It works in your page builder and gives you a private review link.', 'jumplinks-editorial-workflow' ),
			'nextBuildAi2'        => __( 'Open the link and click anything on the page to leave a comment, the way you would brief a designer.', 'jumplinks-editorial-workflow' ),
			'nextBuildAi3'        => __( 'Tell it to fix your comments. It edits the page, resolves each comment it handled and tells you about anything unclear.', 'jumplinks-editorial-workflow' ),
			'nextBuildAi4'        => __( 'Repeat until the page is right, then publish. Nobody else sees your comments.', 'jumplinks-editorial-workflow' ),
			'nextBuildAiAsk1'     => __( 'Build a landing page for our summer offer and give me the review link.', 'jumplinks-editorial-workflow' ),
			'nextBuildAiAsk2'     => __( 'I left comments on the Home page. Fix them.', 'jumplinks-editorial-workflow' ),
			'nextApproveAi1'      => __( 'Ask it to write or update content and send it for review. It picks a reviewer from the roles you chose.', 'jumplinks-editorial-workflow' ),
			'nextApproveAi2'      => __( 'The reviewer gets an email, comments on the page, and approves it or requests changes.', 'jumplinks-editorial-workflow' ),
			'nextApproveAi3'      => __( 'Ask the agent to work through the feedback. It edits the content, resolves each comment it handled and resubmits.', 'jumplinks-editorial-workflow' ),
			'nextApproveAiAsk1'   => __( 'Write a post announcing our new opening hours and send it for review.', 'jumplinks-editorial-workflow' ),
			'nextApproveAiAsk2'   => __( 'The reviewer requested changes on the opening hours post. Apply them and resubmit.', 'jumplinks-editorial-workflow' ),
			'doneChanges'         => __( 'Finish saves these changes:', 'jumplinks-editorial-workflow' ),
			'doneNoChanges'       => __( 'Nothing changes: your settings already match this setup.', 'jumplinks-editorial-workflow' ),
			/* translators: %s: the previous value of a setting */
			'was'                 => __( '(was %s)', 'jumplinks-editorial-workflow' ),
			'on'                  => __( 'On', 'jumplinks-editorial-workflow' ),
			'off'                 => __( 'Off', 'jumplinks-editorial-workflow' ),
			'none'                => __( 'None', 'jumplinks-editorial-workflow' ),
			'copy'                => __( 'Copy', 'jumplinks-editorial-workflow' ),
			'copied'              => __( 'Copied!', 'jumplinks-editorial-workflow' ),
			'modeSolo'            => __( 'Self review only', 'jumplinks-editorial-workflow' ),
			'openReviewLabel'     => __( 'Open Review', 'jumplinks-editorial-workflow' ),
			'selfReviewLabel'     => __( 'Self review', 'jumplinks-editorial-workflow' ),
			'selfReviewDesc'      => __( 'Adds a "Self review" link to the admin bar and editor on every supported page. Comments you leave there are private: assigned reviewers and clients never see them, and connected AI agents can read and resolve them over MCP.', 'jumplinks-editorial-workflow' ),
		];
	}

	public function register_rest_route(): void {
		$bool   = [
			'type'              => 'boolean',
			'sanitize_callback' => 'rest_sanitize_boolean',
		];
		$slugs  = [
			'type'              => 'array',
			'items'             => [ 'type' => 'string' ],
			'sanitize_callback' => static function ( $value ) {
				return is_array( $value ) ? array_map( 'sanitize_key', $value ) : [];
			},
		];
		$int    = [
			'type'              => 'integer',
			'sanitize_callback' => 'absint',
		];
		$string = [
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		];

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
						'use_case'                => [
							'type'     => 'string',
							'enum'     => Setup_Presets::use_cases(),
							'required' => true,
						],
						'review_mode'             => $string,
						'post_types'              => $slugs,
						'reviewer_roles'          => $slugs,
						'allow_external'          => $bool,
						'self_review'             => $bool,
						'show_reviewed_by'        => $bool,
						'auto_assign_reviewer_id' => $int,
						'auto_assign_email'       => $string,
						'agent_enabled'           => $bool,
						'agent_comments'          => $bool,
						'agent_author_id'         => $int,
						'agent_resolve_notes'     => $bool,
						'agent_followup'          => $bool,
						'agent_marker'            => $bool,
						'agent_ask_before_edit'   => $bool,
					],
				],
			]
		);

		register_rest_route(
			'flow/v1',
			'/setup/skip',
			[
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'rest_skip' ],
				'permission_callback' => static function () {
					return current_user_can( 'manage_options' );
				},
			]
		);
	}

	/** Dismissing the modal ends auto-open; "Run setup again" in Settings reopens it. */
	public function rest_skip() {
		self::mark_completed();
		return rest_ensure_response( [ 'ok' => true ] );
	}

	private static function mark_completed(): void {
		update_option( Settings::OPTION_SETUP_COMPLETED, true );
		delete_transient( 'flow_ew_activation_redirect' );
	}

	/**
	 * @param \WP_REST_Request $request
	 */
	public function rest_save( $request ) {
		$options = Setup_Presets::resolve(
			(string) $request->get_param( 'use_case' ),
			(array) $request->get_params(),
			$this->settings
		);
		foreach ( $options as $name => $value ) {
			update_option( $name, $value );
		}
		self::mark_completed();

		return rest_ensure_response(
			[
				'ok'      => true,
				'options' => $options,
			]
		);
	}
}
