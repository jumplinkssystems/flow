import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Decision buttons on the right of the bar: the author's Resubmit, or the
 * reviewer's Request Changes / Approve / Revoke. Pro passes `actionsSlot` to
 * replace the whole cluster (Site Review's Send feedback / Exit review).
 */
export default function ReviewActions( {
	actionsSlot,
	canAuthorResubmit,
	canActFinal,
	isApproved,
	myVote,
	isBusy,
	hasAuthorResubmitActivity,
	actionStatus,
	totalCommentCount,
	doAction,
} ) {
	return (
		<>
			{ actionStatus && (
				<div
					className="components-snackbar-list flow-bar__snackbar-list"
					aria-live="polite"
				>
					<div className="components-snackbar-list__notice-container">
						<div
							className="components-snackbar flow-bar__snackbar"
							role={
								actionStatus.type === 'error'
									? 'alert'
									: 'status'
							}
						>
							<div className="components-snackbar__content">
								{ actionStatus.message }
								{ actionStatus.linkUrl ? (
									<a
										href={ actionStatus.linkUrl }
										className="flow-bar__snackbar-link"
									>
										{ actionStatus.linkLabel }
									</a>
								) : null }
							</div>
						</div>
					</div>
				</div>
			) }
			{ actionsSlot ? (
				<div className="flow-bar__actions">{ actionsSlot }</div>
			) : null }
			{ ! actionsSlot && canAuthorResubmit ? (
				<div className="flow-bar__actions">
					<Button
						variant="primary"
						onClick={ () =>
							doAction(
								'resubmit',
								__(
									'✓ Resubmitted for review.',
									'jumplinks-editorial-workflow'
								),
								'in_review'
							)
						}
						disabled={ isBusy || ! hasAuthorResubmitActivity }
					>
						{ __(
							'Resubmit for review',
							'jumplinks-editorial-workflow'
						) }
					</Button>
				</div>
			) : null }

			{ ! actionsSlot && canActFinal ? (
				<div className="flow-bar__actions">
					{ ! isApproved ? (
						<Button
							className="flow-bar__btn--request-changes"
							onClick={ () =>
								doAction(
									'request-changes',
									__(
										'✓ Changes requested — author notified.',
										'jumplinks-editorial-workflow'
									),
									'changes_requested'
								)
							}
							disabled={
								isBusy ||
								totalCommentCount === 0 ||
								myVote === 'changes_requested'
							}
						>
							{ __(
								'Request Changes',
								'jumplinks-editorial-workflow'
							) }
						</Button>
					) : null }
					{ isApproved ? (
						<Button
							variant="secondary"
							onClick={ () =>
								doAction(
									'revoke-approval',
									__(
										'Approval revoked.',
										'jumplinks-editorial-workflow'
									),
									'in_review'
								)
							}
							disabled={ isBusy }
							className="flow-bar__btn--revoke"
						>
							{ __(
								'Revoke Approval',
								'jumplinks-editorial-workflow'
							) }
						</Button>
					) : (
						<Button
							variant="primary"
							onClick={ () =>
								doAction(
									'approve',
									__(
										'✓ Approval recorded.',
										'jumplinks-editorial-workflow'
									),
									'approved'
								)
							}
							disabled={ isBusy }
						>
							{ __( 'Approve', 'jumplinks-editorial-workflow' ) }
						</Button>
					) }
				</div>
			) : null }
		</>
	);
}
