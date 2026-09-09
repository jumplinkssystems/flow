<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Plugin {

	public function boot(): void {
		if ( get_option( 'flow_ew_db_version' ) !== FLOW_EW_DB_VERSION ) {
			Activator::create_tables();
			Activator::create_reviewer_role();
			$this->migrate_reviewer_roles_option();
			update_option( 'flow_ew_db_version', FLOW_EW_DB_VERSION );
		}

		I18n::boot();

		( new Settings() )->boot();

		add_action( 'rest_api_init', [ $this, 'register_rest_routes' ] );
		add_action( 'enqueue_block_editor_assets', [ $this, 'enqueue_editor_assets' ] );

		add_action( 'flow_ew_review_sent', [ Notification::class, 'on_review_sent' ], 10, 3 );
		add_action( 'flow_ew_review_resubmitted', [ Notification::class, 'on_review_resubmitted' ], 10, 3 );
		add_action( 'flow_ew_changes_requested', [ Notification::class, 'on_changes_requested' ], 10, 3 );
		add_action( 'flow_ew_review_approved', [ Notification::class, 'on_review_approved' ], 10, 3 );

		add_action(
			'before_delete_post',
			static function ( $post_id ): void {
				DB::delete_reviews_for_post( (int) $post_id );
			},
			10,
			1
		);

		( new Email_Review() )->boot();
		( new ReviewPage() )->boot();
		( new ClassicEditor() )->boot();
		( new Elementor() )->boot();
		( new Bricks() )->boot();
		( new Breakdance() )->boot();
		( new Oxygen() )->boot();
		( new Avada() )->boot();
		( new BeaverBuilder() )->boot();
		( new Divi() )->boot();
		( new Dashboard_Widget() )->boot();
		( new Dashboard_Page() )->boot();
		( new Publish_Guard() )->boot();
		( new Admin_Columns() )->boot();
		( new Admin_Bar() )->boot();
		( new Pro_Upsell_Menus() )->boot();

		add_action( 'init', [ $this, 'register_post_meta' ], 20 );
	}

	public function register_rest_routes(): void {
		( new REST_Reviews() )->register_routes();
	}

	/**
	 * @return array<string,mixed>
	 */
	public static function get_editor_localization_data( int $post_id ): array {
		$current_user_id = get_current_user_id();
		$review          = $post_id ? DB::get_active_review( $post_id ) : null;
		$preview_rev_id  = 0;
		if ( $review ) {
			$preview_rev_id = Review::get_effective_preview_revision_id(
				$post_id,
				(int) ( $review->revision_id ?? 0 )
			);
		}

		$active_review = $review ? [
			'id'                   => (int) $review->id,
			'status'               => $review->status,
			'display_status'       => Review::display_status( $review ),
			'iteration'            => (int) $review->iteration,
			'reviewer_id'          => (int) $review->reviewer_id,
			'requester_id'         => (int) $review->requester_id,
			'is_open'              => (bool) ( $review->is_open ?? false ),
			'is_public'            => (bool) ( $review->is_public ?? false ),
			'revision_id'          => ( 0 !== (int) ( $review->revision_id ?? 0 ) ) ? (int) ( $review->revision_id ?? 0 ) : null,
			'revision_preview_url' => Review::get_preview_url( (int) $review->id, $preview_rev_id, $post_id ),
		] : null;
		// Run the same response filter REST uses, so add-ons (Pro multi-reviewer)
		// can enrich the editor's activeReview the same way they enrich REST.
		if ( $active_review ) {
			$active_review = (array) \apply_filters( 'flow_ew_prepare_review_response', $active_review, $review );
		}

		$reviewer_roles = Settings::get_reviewer_roles();
		$no_reviewers   = false;
		if ( current_user_can( 'flow_assign_reviewer' ) ) {
			if ( empty( $reviewer_roles ) ) {
				$no_reviewers = true;
			} else {
				$eligible     = get_users(
					[
						'role__in' => $reviewer_roles,
						'exclude'  => [ $current_user_id ],
						'fields'   => 'ID',
						'number'   => 1,
					]
				);
				$no_reviewers = empty( $eligible );
			}
		}

		$settings_url = admin_url( 'admin.php?page=' . Settings::PAGE_SLUG );
		$users_url    = admin_url( 'users.php' );
		$roles_hint   = sprintf(
			wp_kses(
				/* translators: 1: settings admin URL, 2: users admin URL */
				__(
					'Please check the <a class="flow-ew-review-notice__link" href="%1$s" target="_blank" rel="noreferrer">settings</a> to see which user roles can review, and also if the role is applied the assigned <a class="flow-ew-review-notice__link" href="%2$s" target="_blank" rel="noreferrer">users</a>.',
					'jumplinks-editorial-workflow'
				),
				[
					'a' => [
						'href'   => [],
						'target' => [],
						'rel'    => [],
						'class'  => [],
					],
				]
			),
			esc_url( $settings_url ),
			esc_url( $users_url )
		);

		$data = [
			'restUrl'             => rest_url( 'flow/v1' ),
			'nonce'               => wp_create_nonce( 'wp_rest' ),
			'postId'              => $post_id,
			'postAuthorId'        => $post_id ? (int) get_post_field( 'post_author', $post_id ) : 0,
			'currentUserId'       => $current_user_id,
			'currentUserCan'      => [
				'assignReviewer' => current_user_can( 'flow_assign_reviewer' ),
				'reviewPosts'    => current_user_can( 'flow_review_posts' ),
				'manageReviews'  => current_user_can( 'flow_manage_reviews' ),
			],
			'activeReview'        => $active_review,
			'debugMode'           => Settings::is_debug_mode(),
			'reviewMandatory'     => Settings::is_mandatory(),
			'noReviewers'         => $no_reviewers,
			'reviewRolesHintHtml' => $roles_hint,
			'openReviewEnabled'   => Review::is_open_review_feature_available(),
			'settingsUrl'         => admin_url( 'admin.php?page=' . Settings::PAGE_SLUG ),
			'usersUrl'            => admin_url( 'users.php' ),
			'isPublished'         => $post_id ? in_array( get_post_status( $post_id ), [ 'publish', 'future' ], true ) : false,
			'reviewerMeta'        => $post_id ? (int) get_post_meta( $post_id, '_flow_reviewer_id', true ) : 0,
			'i18n'                => [
				'reviewPanelTitle'     => __( 'Review', 'jumplinks-editorial-workflow' ),
				'selectReviewer'       => __( 'Select Reviewer', 'jumplinks-editorial-workflow' ),
				'submitForReview'      => __( 'Submit for Review', 'jumplinks-editorial-workflow' ),
				'approve'              => __( 'Approve', 'jumplinks-editorial-workflow' ),
				'requestChanges'       => __( 'Request Changes', 'jumplinks-editorial-workflow' ),
				'resubmit'             => __( 'Resubmit for review', 'jumplinks-editorial-workflow' ),
				'statusPending'        => __( 'Pending Review', 'jumplinks-editorial-workflow' ),
				'statusInReview'       => __( 'In Review', 'jumplinks-editorial-workflow' ),
				'statusChangesReq'     => __( 'Changes Requested', 'jumplinks-editorial-workflow' ),
				'statusApproved'       => __( 'Approved', 'jumplinks-editorial-workflow' ),
				'statusOpenReview'     => __( 'Open Review', 'jumplinks-editorial-workflow' ),
				'noReviewers'          => __( 'No eligible reviewers found.', 'jumplinks-editorial-workflow' ),
				'publishDisabledHint'  => __( 'Post must be approved before publishing.', 'jumplinks-editorial-workflow' ),
				'publishGuardTooltip'  => __( 'Post can go live only after approval by a reviewer.', 'jumplinks-editorial-workflow' ),
				'reviewer'             => __( 'Reviewer', 'jumplinks-editorial-workflow' ),
				'loading'              => __( 'Loading…', 'jumplinks-editorial-workflow' ),
				'iteration'            => __( 'Round', 'jumplinks-editorial-workflow' ),
				'removeReviewer'       => __( 'Remove reviewer', 'jumplinks-editorial-workflow' ),
				'editReviewer'         => __( 'Edit', 'jumplinks-editorial-workflow' ),
				'cancelEdit'           => __( 'Cancel', 'jumplinks-editorial-workflow' ),
				'sendForReview'        => __( 'Send for review', 'jumplinks-editorial-workflow' ),
				'snapshotLink'         => __( 'Current Review', 'jumplinks-editorial-workflow' ),
				'goToReview'           => __( 'Go to review', 'jumplinks-editorial-workflow' ),
				'copyLink'             => __( 'Copy', 'jumplinks-editorial-workflow' ),
				'copied'               => __( 'Copied!', 'jumplinks-editorial-workflow' ),
				'openLabel'            => __( 'Open review', 'jumplinks-editorial-workflow' ),
				'openReviewDesc'       => __( 'All users with the link will be able to add comments.', 'jumplinks-editorial-workflow' ),
				'reviewerPlaceholder'  => __( 'assign a dedicated reviewer', 'jumplinks-editorial-workflow' ),
				'invalidEmail'         => __( 'Please enter a valid email address.', 'jumplinks-editorial-workflow' ),
				'emailPlaceholder'     => __( 'name@example.com', 'jumplinks-editorial-workflow' ),
				'externalEmail'        => __( 'External Email', 'jumplinks-editorial-workflow' ),
				/* translators: %s: email address */
				'inviteEmail'          => __( 'Invite %s', 'jumplinks-editorial-workflow' ),
				'reviewMandatoryTitle' => __( 'Review Mode set to Mandatory', 'jumplinks-editorial-workflow' ),
				'reviewMandatoryDesc'  => __( 'Post can go live only after approval by a reviewer.', 'jumplinks-editorial-workflow' ),
				'noReviewRolesTitle'   => __( 'No Review Roles Assigned', 'jumplinks-editorial-workflow' ),
			],
		];

		return (array) \apply_filters( 'flow_ew_editor_localization_data', $data, $post_id );
	}

	public function enqueue_editor_assets(): void {
		$screen    = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		$post_type = ( $screen && ! empty( $screen->post_type ) ) ? (string) $screen->post_type : '';
		$post_id   = (int) get_the_ID();
		if ( '' === $post_type && $post_id > 0 ) {
			$pt        = get_post_type( $post_id );
			$post_type = $pt ? (string) $pt : '';
		}
		if ( '' === $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return;
		}

		$asset_file = FLOW_EW_PLUGIN_DIR . 'build/sidebar/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset      = require $asset_file;
		$js_suffix  = Assets::webpack_build_suffix( FLOW_EW_PLUGIN_DIR . 'build/sidebar/index', 'js' );
		$css_suffix = Assets::webpack_build_suffix( FLOW_EW_PLUGIN_DIR . 'build/sidebar/index', 'css' );

		Assets::ensure_react_jsx_runtime_registered();

		wp_enqueue_script(
			'flow-ew-sidebar',
			FLOW_EW_PLUGIN_URL . 'build/sidebar/index' . $js_suffix . '.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations(
			'flow-ew-sidebar',
			'jumplinks-editorial-workflow',
			FLOW_EW_PLUGIN_DIR . 'languages'
		);

		wp_enqueue_style(
			'flow-ew-editor',
			FLOW_EW_PLUGIN_URL . 'build/sidebar/index' . $css_suffix . '.css',
			[ 'wp-components' ],
			$asset['version']
		);

		wp_localize_script(
			'flow-ew-sidebar',
			'flowEW',
			self::get_editor_localization_data( $post_id )
		);
	}

	/**
	 * Adds the dedicated Reviewer role to the saved reviewer-roles option on
	 * upgrade so existing installs see it as eligible without re-running setup.
	 * Skipped for fresh installs where the option hasn't been written yet — those
	 * pick it up via the default in Settings::get_reviewer_roles().
	 */
	private function migrate_reviewer_roles_option(): void {
		$saved = get_option( Settings::OPTION_REVIEWER_ROLES, null );
		if ( null === $saved ) {
			return;
		}
		$saved = (array) $saved;
		if ( in_array( Activator::REVIEWER_ROLE, $saved, true ) ) {
			return;
		}
		$saved[] = Activator::REVIEWER_ROLE;
		update_option( Settings::OPTION_REVIEWER_ROLES, array_values( $saved ) );
	}

	public function register_post_meta(): void {
		foreach ( Settings::get_supported_post_types() as $post_type ) {
			register_post_meta(
				$post_type,
				'_flow_reviewer_id',
				[
					'type'          => 'integer',
					'single'        => true,
					'show_in_rest'  => true,
					'auth_callback' => static function (): bool {
						return current_user_can( 'flow_assign_reviewer' );
					},
				]
			);

			register_post_meta(
				$post_type,
				'_flow_review_status',
				[
					'type'          => 'string',
					'single'        => true,
					'show_in_rest'  => true,
					'auth_callback' => static function (): bool {
						return current_user_can( 'flow_review_posts' );
					},
				]
			);
		}
	}
}
