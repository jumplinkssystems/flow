import { useEffect, useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import alertErrorIcon from '../icons/alert-error';
import alertWarningIcon from '../icons/alert-warning';

export default function ConfirmDialog( {
	title,
	message,
	confirmLabel = __( 'Delete', 'jumplinks-editorial-workflow' ),
	cancelLabel = __( 'Cancel', 'jumplinks-editorial-workflow' ),
	tone = 'error',
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
				className={ `flow-confirm-dialog__panel${
					tone === 'warning'
						? ' flow-confirm-dialog__panel--warning'
						: ''
				}` }
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
						{ tone === 'warning'
							? alertWarningIcon
							: alertErrorIcon }
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
					<Button className="flow-btn--cancel" onClick={ onCancel }>
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
