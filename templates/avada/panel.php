<?php
/**
 * Avada builder review drawer + toolbar toggle.
 *
 * @var \WP_Post $post
 * @var string   $status
 * @var bool     $show_free_upsells
 * @var string   $upsell_href
 */

declare( strict_types=1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div
	id="flow-ew-avada-drawer"
	class="flow-ew-avada-drawer submenu-trigger-target"
	aria-expanded="false"
	data-flow-ew-upsell-enabled="<?php echo $show_free_upsells ? '1' : '0'; ?>"
	data-flow-ew-upsell-href="<?php echo esc_attr( $upsell_href ); ?>"
	data-flow-ew-upsell-open-label="<?php esc_attr_e( 'Unlock public reviews', 'jumplinks-editorial-workflow' ); ?>"
	data-flow-ew-upsell-open-help="<?php esc_attr_e( 'Invite anyone, even people without a WordPress account.', 'jumplinks-editorial-workflow' ); ?>"
	data-flow-ew-upsell-reviewer-label="<?php esc_attr_e( 'Unlock multiple reviewers', 'jumplinks-editorial-workflow' ); ?>"
	data-flow-ew-upsell-reviewer-help="<?php esc_attr_e( 'Require approval from several reviewers before publishing.', 'jumplinks-editorial-workflow' ); ?>"
>
	<div class="flow-ew-avada-drawer__header flow-ew-builder-drawer__header">
		<span class="flow-ew-avada-drawer__title"><?php esc_html_e( 'Review', 'jumplinks-editorial-workflow' ); ?></span>
		<span class="flow-ew-drawer-status" hidden></span>
		<button type="button" class="flow-ew-avada-drawer__close" aria-label="<?php esc_attr_e( 'Close', 'jumplinks-editorial-workflow' ); ?>">
			<span class="dashicons dashicons-no-alt"></span>
		</button>
	</div>
	<div class="flow-ew-avada-drawer__body">
		<?php \Flow\EditorialWorkflow\ClassicEditor::render_review_ui( $post, 'avada' ); ?>
	</div>
</div>
<a
	href="#"
	id="flow-ew-avada-toggle"
	class="flow-ew-avada-toggle has-tooltip trigger-submenu-toggling"
	aria-label="<?php esc_attr_e( 'Review', 'jumplinks-editorial-workflow' ); ?>"
	title="<?php esc_attr_e( 'Review', 'jumplinks-editorial-workflow' ); ?>"
	data-status="<?php echo esc_attr( $status ); ?>"
	hidden
>
	<span class="flow-ew-avada-toggle__icon" aria-hidden="true">
		<?php require __DIR__ . '/toggle-icon.php'; ?>
	</span>
</a>
