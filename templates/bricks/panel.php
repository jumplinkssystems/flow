<?php
/**
 * Bricks builder review drawer + toolbar toggle.
 *
 * @var \WP_Post $post
 * @var string   $status
 */

declare( strict_types=1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div id="flow-ew-bricks-drawer" class="flow-ew-bricks-drawer" style="display:none;">
	<div class="flow-ew-bricks-drawer__header flow-ew-builder-drawer__header">
		<span class="flow-ew-bricks-drawer__title"><?php esc_html_e( 'Review', 'jumplinks-editorial-workflow' ); ?></span>
		<span class="flow-ew-drawer-status" hidden></span>
		<button type="button" class="flow-ew-bricks-drawer__close" aria-label="<?php esc_attr_e( 'Close', 'jumplinks-editorial-workflow' ); ?>">
			<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
				<path fill="currentColor" d="M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z"/>
			</svg>
		</button>
	</div>
	<div class="flow-ew-bricks-drawer__body">
		<?php \Flow\EditorialWorkflow\ClassicEditor::render_review_ui( $post, 'bricks' ); ?>
	</div>
</div>
<button type="button" id="flow-ew-bricks-toggle" class="flow-ew-bricks-toggle"
	aria-label="<?php esc_attr_e( 'Review', 'jumplinks-editorial-workflow' ); ?>"
	title="<?php esc_attr_e( 'Review', 'jumplinks-editorial-workflow' ); ?>"
	data-status="<?php echo esc_attr( $status ); ?>"
	hidden>
	<span class="flow-ew-bricks-toggle__icon" aria-hidden="true">
		<?php require __DIR__ . '/../avada/toggle-icon.php'; ?>
	</span>
</button>
