<?php
/**
 * Builder review drawer + toolbar toggle. One template for every builder;
 * per-builder classes and attributes come from Builder_Integration::panel().
 *
 * @var \WP_Post            $post
 * @var string              $status
 * @var string              $builder
 * @var array<string,mixed> $panel
 * @var bool                $show_free_upsells
 * @var string              $upsell_href
 */

declare( strict_types=1 );

use Flow\EditorialWorkflow\Builder_Integration;
use Flow\EditorialWorkflow\ClassicEditor;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$flow_ew_drawer_attrs = $panel['drawer_attrs'];
if ( ! empty( $panel['upsells'] ) ) {
	$flow_ew_drawer_attrs += [
		'data-flow-ew-upsell-enabled'        => $show_free_upsells ? '1' : '0',
		'data-flow-ew-upsell-href'           => $upsell_href,
		'data-flow-ew-upsell-open-label'     => __( 'Unlock public reviews', 'jumplinks-editorial-workflow' ),
		'data-flow-ew-upsell-open-help'      => __( 'Invite anyone, even people without a WordPress account.', 'jumplinks-editorial-workflow' ),
		'data-flow-ew-upsell-reviewer-label' => __( 'Unlock multiple reviewers', 'jumplinks-editorial-workflow' ),
		'data-flow-ew-upsell-reviewer-help'  => __( 'Require approval from several reviewers before publishing.', 'jumplinks-editorial-workflow' ),
	];
}
?>
<div
	id="flow-ew-<?php echo esc_attr( $builder ); ?>-drawer"
	class="<?php echo esc_attr( $panel['drawer_class'] ); ?>"
	<?php echo Builder_Integration::attrs( $flow_ew_drawer_attrs ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in attrs(). ?>
>
	<?php if ( ! empty( $panel['arrow'] ) ) : ?>
		<div class="fl-builder--panel-arrow" aria-hidden="true">
			<svg width="20" height="10" viewBox="0 0 20 10" xmlns="http://www.w3.org/2000/svg">
				<polygon points="0,10 10,0 20,10"></polygon>
			</svg>
		</div>
	<?php endif; ?>
	<div class="<?php echo esc_attr( $panel['header_class'] ); ?>">
		<span class="<?php echo esc_attr( $panel['title_class'] ); ?>"><?php esc_html_e( 'Review', 'jumplinks-editorial-workflow' ); ?></span>
		<span class="flow-ew-drawer-status" hidden></span>
		<?php if ( '' !== $panel['close'] ) : ?>
			<button type="button" class="<?php echo esc_attr( $panel['close_class'] ); ?>" aria-label="<?php esc_attr_e( 'Close', 'jumplinks-editorial-workflow' ); ?>">
				<?php if ( 'breakdance' === $panel['close'] ) : ?>
					<span class="breakdance-icon" style="width:16px;height:16px;" aria-hidden="true">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
							<path d="M312.1 375c9.369 9.369 9.369 24.57 0 33.94s-24.57 9.369-33.94 0L160 289.9l-119 119c-9.369 9.369-24.57 9.369-33.94 0s-9.369-24.57 0-33.94L126.1 256 7.027 136.1c-9.369-9.369-9.369-24.57 0-33.94s24.57-9.369 33.94 0L160 222.1l119-119c9.369-9.369 24.57-9.369 33.94 0s9.369 24.57 0 33.94L193.9 256l118.2 119z"></path>
						</svg>
					</span>
				<?php elseif ( 'bricks' === $panel['close'] ) : ?>
					<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
						<path fill="currentColor" d="M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z"/>
					</svg>
				<?php else : ?>
					<span class="dashicons dashicons-no-alt" aria-hidden="true"></span>
				<?php endif; ?>
			</button>
		<?php endif; ?>
	</div>
	<div class="<?php echo esc_attr( $panel['body_class'] ); ?>">
		<?php ClassicEditor::render_review_ui( $post, $builder ); ?>
	</div>
</div>
<?php if ( '' !== $panel['toggle_tag'] ) : ?>
<<?php echo 'a' === $panel['toggle_tag'] ? 'a' : 'button type="button"'; ?>
	id="flow-ew-<?php echo esc_attr( $builder ); ?>-toggle"
	class="<?php echo esc_attr( $panel['toggle_class'] ); ?>"
	aria-label="<?php esc_attr_e( 'Review', 'jumplinks-editorial-workflow' ); ?>"
	title="<?php esc_attr_e( 'Review', 'jumplinks-editorial-workflow' ); ?>"
	data-status="<?php echo esc_attr( $status ); ?>"
	<?php echo Builder_Integration::attrs( $panel['toggle_attrs'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in attrs(). ?>
>
	<span class="<?php echo esc_attr( $panel['toggle_icon_class'] ); ?>" aria-hidden="true">
		<?php require __DIR__ . '/toggle-icon.php'; ?>
	</span>
</<?php echo 'a' === $panel['toggle_tag'] ? 'a' : 'button'; ?>>
<?php endif; ?>
