<?php
declare( strict_types=1 );

namespace Flow\EditorialWorkflow;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ClassicEditor {

	public function boot(): void {
		add_action( 'add_meta_boxes', [ $this, 'register_meta_box' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
	}

	public function register_meta_box(): void {
		if ( $this->is_block_editor() || $this->is_elementor_editor() || $this->is_beaver_builder_editor() || $this->is_divi_builder_editor() ) {
			return;
		}

		$title = $this->compose_meta_box_title();

		foreach ( Settings::get_supported_post_types() as $post_type ) {
			add_meta_box(
				'flow-ew-review',
				$title,
				[ $this, 'render_meta_box' ],
				$post_type,
				'side',
				'high'
			);
		}
	}

	/**
	 * Build the metabox title with the current review status appended, e.g.
	 * "Review — In Review". Falls back to the plain "Review" label for posts
	 * without an active review (or in raw pending state).
	 */
	private function compose_meta_box_title(): string {
		$base = __( 'Review', 'jumplinks-editorial-workflow' );
		global $post;
		if ( ! $post instanceof \WP_Post ) {
			return $base;
		}
		$review = DB::get_active_review( (int) $post->ID );
		if ( ! $review ) {
			return $base;
		}
		$display_status = Review::display_status( $review );
		if ( '' === $display_status ) {
			return $base;
		}
		$labels = Review::status_labels();
		$label  = $labels[ $display_status ] ?? '';
		if ( '' === $label ) {
			return $base;
		}
		return sprintf( '%s — %s', $base, $label );
	}

	public function render_meta_box( \WP_Post $post ): void {
		self::render_review_ui( $post );
	}

	public static function render_review_ui( \WP_Post $post, string $context = 'classic' ): void {
		$post_id         = $post->ID;
		$review          = DB::get_active_review( $post_id );
		$current_user_id = get_current_user_id();
		$can_assign      = current_user_can( 'flow_assign_reviewer' );
		$can_review      = current_user_can( 'flow_review_posts' );

		$status      = $review ? (string) $review->status : '';
		$reviewer_id = $review ? (int) $review->reviewer_id : 0;
		$is_reviewer = $review && $reviewer_id === $current_user_id;

		$invite_email = '';
		$invite_name  = '';
		if ( $review ) {
			$invites = Email_Review_Invites_DB::get_for_review( (int) $review->id );
			if ( ! empty( $invites ) ) {
				$invite_email = Email_Review_Invites_DB::normalize_email( (string) ( $invites[0]->email ?? '' ) );
				$invite_name  = trim( (string) ( $invites[0]->display_name ?? '' ) );
				if ( '' === $invite_name ) {
					$invite_name = $invite_email;
				}
			}
		}

		$reviewer_roles = Settings::get_reviewer_roles();
		$reviewers      = [];
		// True when no WP review roles/users — External Email does not clear this.
		$no_reviewers = false;
		if ( $can_assign ) {
			$reviewers[] = [
				'id'       => Email_Review::SENTINEL_OPTION,
				'name'     => __( 'External Email', 'jumplinks-editorial-workflow' ),
				'is_email' => true,
			];
			if ( empty( $reviewer_roles ) ) {
				$no_reviewers = true;
			} else {
				$users        = get_users(
					[
						'role__in' => $reviewer_roles,
						'exclude'  => [ $current_user_id ],
						'fields'   => [ 'ID', 'display_name' ],
						'number'   => 200,
					]
				);
				$no_reviewers = empty( $users );
				foreach ( $users as $u ) {
					$reviewers[] = [
						'id'   => (int) $u->ID,
						'name' => $u->display_name,
					];
				}
			}
		}

		$reviewer_name = '';
		if ( $reviewer_id ) {
			$reviewer_user = get_userdata( $reviewer_id );
			$reviewer_name = $reviewer_user ? $reviewer_user->display_name : '';
		} elseif ( '' !== $invite_email ) {
			$reviewer_name = $invite_name;
		}

		$root_class = 'flow-ew-classic';
		if ( 'elementor' === $context ) {
			$root_class .= ' flow-ew-classic--elementor flow-ew-classic--builder-dark';
		} elseif ( 'bricks' === $context ) {
			$root_class .= ' flow-ew-classic--bricks flow-ew-classic--builder-dark';
		} elseif ( 'breakdance' === $context ) {
			$root_class .= ' flow-ew-classic--breakdance flow-ew-classic--builder-dark';
		} elseif ( 'oxygen' === $context ) {
			$root_class .= ' flow-ew-classic--oxygen flow-ew-classic--builder-dark';
		} elseif ( 'avada' === $context ) {
			$root_class .= ' flow-ew-classic--avada flow-ew-classic--builder-dark';
		} elseif ( 'beaver' === $context ) {
			$root_class .= ' flow-ew-classic--beaver';
		} elseif ( 'divi' === $context ) {
			$root_class .= ' flow-ew-classic--divi flow-ew-classic--builder-dark';
		}

		$current_post_id = $post_id;

		$preview_url = '';
		if ( $review && ( Review::STATUS_PENDING !== $status || ! empty( $review->is_open ) ) ) {
			$revision_id    = (int) ( $review->revision_id ?? 0 );
			$preview_rev_id = Review::get_effective_preview_revision_id( $post_id, $revision_id );
			$preview_url    = Review::get_preview_url( (int) $review->id, $preview_rev_id, $post_id );
		}

		$is_post_author = (int) $post->post_author === $current_user_id;

		$template = (string) apply_filters(
			'flow_ew_classic_review_ui_template',
			FLOW_EW_PLUGIN_DIR . 'templates/classic/review-ui.php'
		);
		if ( is_readable( $template ) ) {
			include $template;
		}
	}

	/**
	 * @param string $hook_suffix
	 */
	public function enqueue_assets( $hook_suffix ): void {
		if ( ! in_array( $hook_suffix, [ 'post.php', 'post-new.php' ], true ) ) {
			return;
		}

		if ( $this->is_block_editor() || $this->is_elementor_editor() || $this->is_beaver_builder_editor() || $this->is_divi_builder_editor() ) {
			return;
		}

		$post_id   = (int) get_the_ID();
		$post_type = $post_id > 0 ? (string) get_post_type( $post_id ) : '';
		if ( '' === $post_type || ! Settings::is_post_type_supported( $post_type ) ) {
			return;
		}

		$asset_file = FLOW_EW_PLUGIN_DIR . 'build/classic-editor/index.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset      = require $asset_file;
		$js_suffix  = Assets::webpack_build_suffix( FLOW_EW_PLUGIN_DIR . 'build/classic-editor/index', 'js' );
		$css_suffix = Assets::webpack_build_suffix( FLOW_EW_PLUGIN_DIR . 'build/classic-editor/style-index', 'css' );

		Assets::ensure_react_jsx_runtime_registered();

		wp_enqueue_script(
			'flow-ew-classic-editor',
			FLOW_EW_PLUGIN_URL . 'build/classic-editor/index' . $js_suffix . '.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_enqueue_style(
			'flow-ew-classic-editor',
			FLOW_EW_PLUGIN_URL . 'build/classic-editor/style-index' . $css_suffix . '.css',
			[],
			$asset['version']
		);

		wp_localize_script(
			'flow-ew-classic-editor',
			'flowEW',
			Plugin::get_editor_localization_data( $post_id )
		);
	}

	private function is_block_editor(): bool {
		if ( ! function_exists( 'use_block_editor_for_post' ) ) {
			return false;
		}
		global $post;
		if ( $post instanceof \WP_Post ) {
			return (bool) use_block_editor_for_post( $post );
		}
		return false;
	}

	private function is_elementor_editor(): bool {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- editor screen detection only.
		if ( isset( $_GET['action'] ) && 'elementor' === $_GET['action'] ) {
			return true;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['page'] ) && 'elementor' === $_GET['page'] ) {
			return true;
		}
		return false;
	}

	private function is_beaver_builder_editor(): bool {
		if ( ! class_exists( '\FLBuilderModel' ) ) {
			return false;
		}
		return \FLBuilderModel::is_builder_active();
	}

	private function is_divi_builder_editor(): bool {
		if ( class_exists( '\ET\Builder\Framework\Utility\Conditions' ) ) {
			return \ET\Builder\Framework\Utility\Conditions::is_vb_top_window()
				|| \ET\Builder\Framework\Utility\Conditions::is_tb_admin_screen()
				|| \ET\Builder\Framework\Utility\Conditions::is_block_editor();
		}

		if ( ! function_exists( 'et_core_is_fb_enabled' ) || ! et_core_is_fb_enabled() ) {
			return false;
		}

		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Builder-mode read-only query args.
		return ! isset( $_GET['app_window'] ) || '1' !== $_GET['app_window'];
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
	}
}
