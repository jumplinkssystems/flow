/**
 * Asks before an action cancels the review. The classic/builder panel answers
 * with its inline confirmation; without one, the native dialog is the fallback.
 *
 * @param {Function} onConfirm
 */
export function confirmCancelReview( onConfirm ) {
	const detail = { onConfirm, handled: false };
	document.dispatchEvent(
		new CustomEvent( 'flow-ew:confirm-cancel-review', { detail } )
	);
	if (
		! detail.handled &&
		// eslint-disable-next-line no-alert
		window.confirm( window.flowEW?.i18n?.cancelReviewBody || '' )
	) {
		onConfirm();
	}
}
