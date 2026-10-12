import { Button, Modal } from '@wordpress/components';
import { getConfig } from '../../shared/config';

const { i18n } = getConfig();

/**
 * Confirm dialog for cancelling a review. The labels can be swapped so the
 * same dialog confirms restoring one from Review history.
 *
 * @param {Object}   props
 * @param {Function} props.onConfirm
 * @param {Function} props.onClose
 * @param {string}   [props.title]
 * @param {string}   [props.body]
 * @param {string}   [props.confirmLabel]
 * @param {string}   [props.cancelLabel]
 * @param {boolean}  [props.isDestructive]
 */
export default function CancelReviewModal( {
	onConfirm,
	onClose,
	title = i18n.cancelReviewTitle,
	body = i18n.cancelReviewBody,
	confirmLabel = i18n.cancelReview,
	cancelLabel = i18n.keepReview,
	isDestructive = true,
} ) {
	return (
		<Modal
			title={ title }
			onRequestClose={ onClose }
			className="flow-ew-confirm-modal"
		>
			<p>{ body }</p>
			<div className="flow-ew-confirm-modal__actions">
				<Button variant="tertiary" onClick={ onClose }>
					{ cancelLabel }
				</Button>
				<Button
					variant="primary"
					isDestructive={ isDestructive }
					onClick={ () => {
						onClose();
						onConfirm();
					} }
				>
					{ confirmLabel }
				</Button>
			</div>
		</Modal>
	);
}
