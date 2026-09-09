import { useEffect, useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import alertErrorIcon from '../icons/alert-error';

export default function ConfirmDialog( {
	title,
	message,
	confirmLabel = __( 'Delete', 'jumplinks-editorial-workflow' ),
	cancelLabel = __( 'Cancel', 'jumplinks-editorial-workflow' ),
	onConfirm,
	onCancel,
} ) {
	const confirmRef = useRef( null );

	useEffect( () => {
		confirmRef.current?.focus();
	}, [] );

	useEffect( () => {
		const onKeyDown = ( event ) => {
			if ( event.key === 'Escape' ) {
				onCancel();
			}
		};
		window.addEventListener( 'keydown', onKeyDown );
		return () => window.removeEventListener( 'keydown', onKeyDown );
	}, [ onCancel ] );

	return (
		<div className="flow-confirm-dialog">
			<button
				type="button"
				className="flow-confirm-dialog__backdrop"
				aria-label={ cancelLabel }
				onClick={ onCancel }
			/>
			<div
				className="flow-confirm-dialog__panel"
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="flow-confirm-dialog-title"
				aria-describedby={
					message ? 'flow-confirm-dialog-message' : undefined
				}
			>
				<div className="flow-confirm-dialog__alert">
					<span
						className="flow-confirm-dialog__icon"
						aria-hidden="true"
					>
						{ alertErrorIcon }
					</span>
					<div className="flow-confirm-dialog__content">
						<p
							id="flow-confirm-dialog-title"
							className="flow-confirm-dialog__title"
						>
							{ title }
						</p>
						{ message ? (
							<p
								id="flow-confirm-dialog-message"
								className="flow-confirm-dialog__message"
							>
								{ message }
							</p>
						) : null }
					</div>
				</div>
				<div className="flow-confirm-dialog__actions">
					<Button
						className="flow-btn--cancel"
						onClick={ onCancel }
					>
						{ cancelLabel }
					</Button>
					<Button
						ref={ confirmRef }
						className="flow-confirm-dialog__confirm"
						onClick={ onConfirm }
					>
						{ confirmLabel }
					</Button>
				</div>
			</div>
		</div>
	);
}
