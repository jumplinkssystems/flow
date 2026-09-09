<?php
/**
 * Elementor builder review drawer + toolbar toggle.
 *
 * @var \WP_Post $post
 * @var string   $status
 */

declare( strict_types=1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div id="flow-ew-elementor-drawer" class="flow-ew-elementor-drawer" style="display:none;">
	<div class="flow-ew-elementor-drawer__header flow-ew-builder-drawer__header">
		<span class="flow-ew-elementor-drawer__title"><?php esc_html_e( 'Review', 'jumplinks-editorial-workflow' ); ?></span>
		<span class="flow-ew-drawer-status" hidden></span>
		<button type="button" class="flow-ew-elementor-drawer__close" aria-label="<?php esc_attr_e( 'Close', 'jumplinks-editorial-workflow' ); ?>">
			<span class="dashicons dashicons-no-alt"></span>
		</button>
	</div>
	<div class="flow-ew-elementor-drawer__body">
		<?php \Flow\EditorialWorkflow\ClassicEditor::render_review_ui( $post, 'elementor' ); ?>
	</div>
</div>
<button type="button" id="flow-ew-elementor-toggle" class="flow-ew-elementor-toggle flow-ew-elementor-toggle--fallback"
	aria-label="<?php esc_attr_e( 'Review', 'jumplinks-editorial-workflow' ); ?>"
	title="<?php esc_attr_e( 'Review', 'jumplinks-editorial-workflow' ); ?>"
	data-status="<?php echo esc_attr( $status ); ?>">
	<span class="flow-ew-elementor-toggle__icon" aria-hidden="true">
		<?php require __DIR__ . '/../avada/toggle-icon.php'; ?>
	</span>
</button>
