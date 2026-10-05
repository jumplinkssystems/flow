import { Button, Modal } from '@wordpress/components';
import { getConfig } from '../../shared/config';

const { i18n } = getConfig();

export default function CancelReviewModal( { onConfirm, onClose } ) {
	return (
		<Modal
			title={ i18n.cancelReviewTitle }
			onRequestClose={ onClose }
			className="flow-ew-confirm-modal"
		>
			<p>{ i18n.cancelReviewBody }</p>
			<div className="flow-ew-confirm-modal__actions">
				<Button variant="tertiary" onClick={ onClose }>
					{ i18n.keepReview }
				</Button>
				<Button
					variant="primary"
					isDestructive
					onClick={ () => {
						onClose();
						onConfirm();
					} }
				>
					{ i18n.cancelReview }
				</Button>
			</div>
		</Modal>
	);
}
