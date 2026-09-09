<?php
/**
 * Divi Visual Builder review drawer (top window toolbar).
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
<div id="flow-ew-divi-drawer"
	class="flow-ew-divi-drawer"
	hidden
	data-flow-ew-upsell-enabled="<?php echo $show_free_upsells ? '1' : '0'; ?>"
	data-flow-ew-upsell-href="<?php echo esc_attr( $upsell_href ); ?>"
	data-flow-ew-upsell-open-label="<?php esc_attr_e( 'Unlock public reviews', 'jumplinks-editorial-workflow' ); ?>"
	data-flow-ew-upsell-open-help="<?php esc_attr_e( 'Invite anyone, even people without a WordPress account.', 'jumplinks-editorial-workflow' ); ?>"
	data-flow-ew-upsell-reviewer-label="<?php esc_attr_e( 'Unlock multiple reviewers', 'jumplinks-editorial-workflow' ); ?>"
	data-flow-ew-upsell-reviewer-help="<?php esc_attr_e( 'Require approval from several reviewers before publishing.', 'jumplinks-editorial-workflow' ); ?>">
	<div class="flow-ew-divi-drawer__header flow-ew-builder-drawer__header">
		<span class="flow-ew-divi-drawer__title"><?php esc_html_e( 'Review', 'jumplinks-editorial-workflow' ); ?></span>
		<span class="flow-ew-drawer-status" hidden></span>
	</div>
	<div class="flow-ew-divi-drawer__body">
		<?php \Flow\EditorialWorkflow\ClassicEditor::render_review_ui( $post, 'divi' ); ?>
	</div>
</div>
