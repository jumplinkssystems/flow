<?php
/**
 * Review mode / empty-reviewer warnings for classic and builder panels.
 *
 * @var int                                  $current_post_id
 * @var bool                                 $can_assign
 * @var string                               $status
 * @var int                                  $reviewer_id
 * @var bool                                 $no_reviewers True when no WP review roles/users (ignores External Email).
 * @var array<int,array{id:int,name:string}> $reviewers
 */

declare( strict_types=1 );

use Flow\EditorialWorkflow\Publish_Guard;
use Flow\EditorialWorkflow\Settings;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! $can_assign ) {
	return;
}

// Post ID is passed explicitly from render_review_ui (global $post is wrong in Elementor).
$notice_post_id = isset( $current_post_id ) ? (int) $current_post_id : 0;
$mandatory      = Settings::is_mandatory();
$no_reviewers   = isset( $no_reviewers ) ? (bool) $no_reviewers : false;

$settings_url = admin_url( 'admin.php?page=' . Settings::PAGE_SLUG );
$users_url    = admin_url( 'users.php' );

$settings_hint = sprintf(
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

$dismiss_label = esc_attr__( 'Dismiss', 'jumplinks-editorial-workflow' );
$dismiss_btn   = sprintf(
	'<button type="button" class="flow-ew-review-notice__dismiss" aria-label="%s"><span aria-hidden="true">&times;</span></button>',
	$dismiss_label
);

if ( $no_reviewers && ! $mandatory ) {
	?>
	<div class="flow-ew-review-notice flow-ew-review-notice--in-review" role="status" data-flow-ew-dismiss="no-review-roles">
		<?php
		echo $dismiss_btn; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
		?>
		<p class="flow-ew-review-notice__title">
			<?php esc_html_e( 'No Review Roles Assigned', 'jumplinks-editorial-workflow' ); ?>
		</p>
		<p class="flow-ew-review-notice__desc">
			<?php
			echo $settings_hint; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped via wp_kses in sprintf.
			?>
		</p>
	</div>
	<?php
	return;
}

if ( ! Publish_Guard::is_editor_publish_blocked( $notice_post_id, $status, $reviewer_id ) ) {
	return;
}

if ( $no_reviewers ) {
	?>
	<div class="flow-ew-review-notice flow-ew-review-notice--in-review" role="status" data-flow-ew-publish-guard-only="1" data-flow-ew-dismiss="no-review-roles">
		<?php
		echo $dismiss_btn; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped above.
		?>
		<p class="flow-ew-review-notice__title">
			<?php esc_html_e( 'No Review Roles Assigned', 'jumplinks-editorial-workflow' ); ?>
		</p>
		<p class="flow-ew-review-notice__desc">
			<?php
			esc_html_e( 'Post can go live only after approval by a reviewer.', 'jumplinks-editorial-workflow' );
			echo ' ';
			echo $settings_hint; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped via wp_kses in sprintf.
			?>
		</p>
	</div>
	<?php
	return;
}
?>
<div class="flow-ew-review-notice flow-ew-review-notice--in-review" role="note" data-flow-ew-publish-guard-only="1">
	<p class="flow-ew-review-notice__title">
		<?php esc_html_e( 'Review Mode set to Mandatory', 'jumplinks-editorial-workflow' ); ?>
	</p>
	<p class="flow-ew-review-notice__desc">
		<?php esc_html_e( 'Post can go live only after approval by a reviewer.', 'jumplinks-editorial-workflow' ); ?>
	</p>
</div>
