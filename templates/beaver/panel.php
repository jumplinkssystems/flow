<?php
/**
 * Beaver Builder review drawer + toolbar toggle.
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
<div id="flow-ew-beaver-drawer"
	class="flow-ew-beaver-drawer flow-ew-beaver-review-panel"
	hidden
	data-flow-ew-upsell-enabled="<?php echo $show_free_upsells ? '1' : '0'; ?>"
	data-flow-ew-upsell-href="<?php echo esc_attr( $upsell_href ); ?>"
	data-flow-ew-upsell-open-label="<?php esc_attr_e( 'Unlock public reviews', 'jumplinks-editorial-workflow' ); ?>"
	data-flow-ew-upsell-open-help="<?php esc_attr_e( 'Invite anyone, even people without a WordPress account.', 'jumplinks-editorial-workflow' ); ?>"
	data-flow-ew-upsell-reviewer-label="<?php esc_attr_e( 'Unlock multiple reviewers', 'jumplinks-editorial-workflow' ); ?>"
	data-flow-ew-upsell-reviewer-help="<?php esc_attr_e( 'Require approval from several reviewers before publishing.', 'jumplinks-editorial-workflow' ); ?>">
	<div class="fl-builder--panel-arrow" aria-hidden="true">
		<svg width="20" height="10" viewBox="0 0 20 10" xmlns="http://www.w3.org/2000/svg">
			<polygon points="0,10 10,0 20,10"></polygon>
		</svg>
	</div>
	<div class="flow-ew-beaver-drawer__header fl-builder--panel-header">
		<span class="flow-ew-beaver-drawer__title"><?php esc_html_e( 'Review', 'jumplinks-editorial-workflow' ); ?></span>
		<span class="flow-ew-drawer-status" hidden></span>
		<button type="button" class="flow-ew-beaver-drawer__close fl-builder-button fl-builder-button-silent" aria-label="<?php esc_attr_e( 'Close', 'jumplinks-editorial-workflow' ); ?>">
			<span class="dashicons dashicons-no-alt" aria-hidden="true"></span>
		</button>
	</div>
	<div class="flow-ew-beaver-drawer__body fl-builder--panel-content">
		<?php \Flow\EditorialWorkflow\ClassicEditor::render_review_ui( $post, 'beaver' ); ?>
	</div>
</div>
<button type="button" id="flow-ew-beaver-toggle"
	class="flow-ew-beaver-toggle fl-builder-button fl-builder-button-silent"
	aria-label="<?php esc_attr_e( 'Review', 'jumplinks-editorial-workflow' ); ?>"
	title="<?php esc_attr_e( 'Review', 'jumplinks-editorial-workflow' ); ?>"
	data-status="<?php echo esc_attr( $status ); ?>"
	aria-expanded="false"
	hidden>
	<span class="flow-ew-beaver-toggle__icon" aria-hidden="true">
		<?php require __DIR__ . '/../avada/toggle-icon.php'; ?>
	</span>
</button>
