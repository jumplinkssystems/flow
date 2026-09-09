<?php
/**
 * Classic / builder review panel UI.
 *
 * @var string               $root_class
 * @var bool                 $can_assign
 * @var bool                 $can_review
 * @var bool                 $is_reviewer
 * @var bool                 $is_post_author
 * @var string               $status
 * @var int                  $reviewer_id
 * @var string               $reviewer_name
 * @var string               $preview_url
 * @var string               $invite_email
 * @var array<int,array{id:int|string,name:string,is_email?:bool}> $reviewers
 */

declare( strict_types=1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$invite_email  = isset( $invite_email ) ? (string) $invite_email : '';
$selected_name = '';
$selected_val  = '';
if ( '' !== $invite_email ) {
	$selected_name = '' !== $reviewer_name ? $reviewer_name : $invite_email;
	$selected_val  = 'email';
} else {
	foreach ( $reviewers as $r ) {
		if ( (int) $r['id'] === (int) $reviewer_id && (int) $reviewer_id > 0 ) {
			$selected_name = $r['name'];
			$selected_val  = (string) $r['id'];
			break;
		}
	}
}

$flow_ew_btn_class       = 'button flow-ew-classic__btn';
$flow_ew_btn_primary_cls = 'button button-primary flow-ew-classic__btn';
if ( false !== strpos( $root_class, 'flow-ew-classic--beaver' ) ) {
	$flow_ew_btn_class       = 'fl-builder-button flow-ew-classic__btn';
	$flow_ew_btn_primary_cls = 'fl-builder-button fl-builder-button-primary flow-ew-classic__btn';
}
?>
<div id="flow-ew-classic" class="<?php echo esc_attr( $root_class ); ?>">

	<?php
	$review_notice_template = (string) apply_filters(
		'flow_ew_classic_review_notice_template',
		FLOW_EW_PLUGIN_DIR . 'templates/classic/review-notice.php'
	);
	if ( is_readable( $review_notice_template ) ) {
		include $review_notice_template;
	}
	?>

	<?php if ( $can_assign ) : ?>
		<div id="flow-ew-classic-open-slot"></div>
	<?php endif; ?>

	<?php if ( $can_assign && ! empty( $reviewers ) ) : ?>
		<div id="flow-ew-classic-reviewer-slot" class="flow-ew-multi-reviewer-slot" data-flow-multi-reviewer-slot></div>
		<div class="flow-ew-classic__field flow-ew-classic__field--combobox">
			<label for="flow-ew-reviewer-input" class="flow-ew-classic__label">
				<?php esc_html_e( 'Reviewer', 'jumplinks-editorial-workflow' ); ?>
			</label>
			<div class="flow-ew-reviewer-combobox" id="flow-ew-reviewer-combobox">
				<div class="flow-ew-reviewer-combobox__wrap">
					<input
						type="text"
						id="flow-ew-reviewer-input"
						class="flow-ew-reviewer-combobox__input"
						autocomplete="off"
						role="combobox"
						aria-autocomplete="list"
						aria-expanded="false"
						aria-controls="flow-ew-reviewer-listbox"
						placeholder="<?php echo esc_attr( __( 'assign a dedicated reviewer', 'jumplinks-editorial-workflow' ) ); ?>"
						value="<?php echo esc_attr( $selected_name ); ?>"
					/>
					<button
						type="button"
						class="flow-ew-reviewer-combobox__clear"
						aria-label="<?php esc_attr_e( 'Remove reviewer', 'jumplinks-editorial-workflow' ); ?>"
						<?php echo ( $reviewer_id > 0 || '' !== $invite_email ) ? '' : 'hidden'; ?>
					>
						<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
							<path fill="currentColor" d="M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z"/>
						</svg>
					</button>
					<ul id="flow-ew-reviewer-listbox" class="flow-ew-reviewer-combobox__list" role="listbox" hidden>
						<?php foreach ( $reviewers as $r ) : ?>
							<?php
							$is_email_opt = ! empty( $r['is_email'] ) || 'email' === (string) $r['id'];
							$opt_classes  = 'flow-ew-reviewer-combobox__option';
							if ( $is_email_opt ) {
								$opt_classes .= ' flow-ew-reviewer-combobox__option--email';
							}
							$is_selected = (string) $r['id'] === (string) $selected_val;
							?>
							<li
								class="<?php echo esc_attr( $opt_classes ); ?>"
								role="option"
								tabindex="-1"
								data-value="<?php echo esc_attr( (string) $r['id'] ); ?>"
								data-label="<?php echo esc_attr( $r['name'] ); ?>"
								data-is-email="<?php echo $is_email_opt ? '1' : '0'; ?>"
								<?php echo $is_selected ? ' aria-selected="true"' : ''; ?>
							>
								<?php if ( $is_email_opt ) : ?>
									<strong><?php echo esc_html( $r['name'] ); ?></strong>
								<?php else : ?>
									<?php echo esc_html( $r['name'] ); ?>
								<?php endif; ?>
							</li>
						<?php endforeach; ?>
					</ul>
				</div>
				<select
					id="flow-ew-reviewer-select"
					class="flow-ew-reviewer-combobox__native"
					tabindex="-1"
					data-invite-email="<?php echo esc_attr( $invite_email ); ?>"
				>
					<option value=""><?php esc_html_e( '— Select Reviewer —', 'jumplinks-editorial-workflow' ); ?></option>
					<?php foreach ( $reviewers as $r ) : ?>
						<option
							value="<?php echo esc_attr( (string) $r['id'] ); ?>"
							<?php selected( (string) $r['id'], (string) $selected_val ); ?>
							<?php echo ( ! empty( $r['is_email'] ) || 'email' === (string) $r['id'] ) ? ' data-is-email="1"' : ''; ?>
						>
							<?php echo esc_html( $r['name'] ); ?>
						</option>
					<?php endforeach; ?>
				</select>
			</div>
		</div>
	<?php elseif ( $reviewer_name ) : ?>
		<div class="flow-ew-classic__field">
			<span class="flow-ew-classic__label"><?php esc_html_e( 'Reviewer', 'jumplinks-editorial-workflow' ); ?></span>
			<span class="flow-ew-classic__value"><?php echo esc_html( $reviewer_name ); ?></span>
		</div>
	<?php endif; ?>

	<div class="flow-ew-classic__actions" id="flow-ew-classic-actions">
		<?php if ( \Flow\EditorialWorkflow\Review::STATUS_PENDING === $status && $can_assign ) : ?>
			<button type="button" class="<?php echo esc_attr( $flow_ew_btn_primary_cls ); ?>" data-action="send" <?php disabled( $reviewer_id <= 0 && '' === $invite_email ); ?>>
				<?php esc_html_e( 'Send for review', 'jumplinks-editorial-workflow' ); ?>
			</button>
		<?php endif; ?>

		<?php if ( \Flow\EditorialWorkflow\Review::STATUS_CHANGES_REQUESTED === $status && $is_post_author ) : ?>
			<button type="button" class="<?php echo esc_attr( $flow_ew_btn_primary_cls ); ?>" data-action="resubmit">
				<?php esc_html_e( 'Resubmit for review', 'jumplinks-editorial-workflow' ); ?>
			</button>
		<?php endif; ?>

		<?php if ( \Flow\EditorialWorkflow\Review::STATUS_IN_REVIEW === $status && $is_reviewer && $can_review ) : ?>
			<button type="button" class="<?php echo esc_attr( $flow_ew_btn_primary_cls . ' flow-ew-classic__btn--approve' ); ?>" data-action="approve">
				<?php esc_html_e( 'Approve', 'jumplinks-editorial-workflow' ); ?>
			</button>
			<button type="button" class="<?php echo esc_attr( $flow_ew_btn_class . ' flow-ew-classic__btn--changes' ); ?>" data-action="request-changes">
				<?php esc_html_e( 'Request Changes', 'jumplinks-editorial-workflow' ); ?>
			</button>
		<?php endif; ?>
	</div>

	<?php if ( '' !== $preview_url ) : ?>
		<div class="flow-ew-classic__share" id="flow-ew-share">
			<span class="flow-ew-classic__share-label"><?php esc_html_e( 'Current Review', 'jumplinks-editorial-workflow' ); ?></span>
			<span class="flow-ew-classic__share-row">
				<a href="<?php echo esc_url( $preview_url ); ?>" target="_blank" rel="noreferrer" class="flow-ew-classic__share-link" title="<?php echo esc_attr( $preview_url ); ?>">
					<span class="flow-ew-classic__share-link-text"><?php echo esc_html( $preview_url ); ?></span>
				</a>
				<button type="button" class="button flow-ew-classic__share-copy" data-url="<?php echo esc_attr( $preview_url ); ?>">
					<svg class="flow-ew-share-icon flow-ew-share-icon--copy" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M18 0H8C6.897 0 6 0.897 6 2V6H2C0.897 6 0 6.897 0 8V18C0 19.103 0.897 20 2 20H12C13.103 20 14 19.103 14 18V14H18C19.103 14 20 13.103 20 12V2C20 0.897 19.103 0 18 0ZM2 18V8H12L12.002 18H2ZM18 12H14V8C14 6.897 13.103 6 12 6H8V2H18V12Z" transform="translate(2 2)"/></svg>
				</button>
				<a
					href="<?php echo esc_url( $preview_url ); ?>"
					target="_blank"
					rel="noreferrer"
					class="flow-ew-classic__share-goto"
					aria-label="<?php esc_attr_e( 'Go to review', 'jumplinks-editorial-workflow' ); ?>"
				>
					<svg class="flow-ew-share-icon flow-ew-share-icon--external" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M9.71 9V0H0.71V2H6.3L0 8.29L1.42 9.71L7.71 3.41V9H9.71Z" transform="translate(7.145 7.145)"/></svg>
				</a>
			</span>
		</div>
	<?php endif; ?>

	<span class="spinner" id="flow-ew-classic-spinner"></span>
</div>
