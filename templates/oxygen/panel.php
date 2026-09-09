<?php
/**
 * Oxygen builder review drawer + toolbar toggle.
 *
 * @var \WP_Post $post
 * @var string   $status
 */

declare( strict_types=1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div id="flow-ew-oxygen-drawer" class="flow-ew-oxygen-drawer" style="display:none;">
	<div class="flow-ew-oxygen-drawer__header flow-ew-builder-drawer__header">
		<span class="flow-ew-oxygen-drawer__title"><?php esc_html_e( 'Review', 'jumplinks-editorial-workflow' ); ?></span>
		<span class="flow-ew-drawer-status" hidden></span>
		<button type="button" class="flow-ew-oxygen-drawer__close" aria-label="<?php esc_attr_e( 'Close', 'jumplinks-editorial-workflow' ); ?>">
			<span class="breakdance-icon" style="width:16px;height:16px;" aria-hidden="true">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
					<path d="M312.1 375c9.369 9.369 9.369 24.57 0 33.94s-24.57 9.369-33.94 0L160 289.9l-119 119c-9.369 9.369-24.57 9.369-33.94 0s-9.369-24.57 0-33.94L126.1 256 7.027 136.1c-9.369-9.369-9.369-24.57 0-33.94s24.57-9.369 33.94 0L160 222.1l119-119c9.369-9.369 24.57-9.369 33.94 0s9.369 24.57 0 33.94L193.9 256l118.2 119z"></path>
				</svg>
			</span>
		</button>
	</div>
	<div class="flow-ew-oxygen-drawer__body">
		<?php \Flow\EditorialWorkflow\ClassicEditor::render_review_ui( $post, 'oxygen' ); ?>
	</div>
</div>
<button type="button" id="flow-ew-oxygen-toggle"
	class="flow-ew-oxygen-toggle breakdance-toolbar-icon-button"
	aria-label="<?php esc_attr_e( 'Review', 'jumplinks-editorial-workflow' ); ?>"
	title="<?php esc_attr_e( 'Review', 'jumplinks-editorial-workflow' ); ?>"
	data-status="<?php echo esc_attr( $status ); ?>"
	hidden>
	<span class="flow-ew-oxygen-toggle__icon" aria-hidden="true">
		<?php require __DIR__ . '/../avada/toggle-icon.php'; ?>
	</span>
</button>
