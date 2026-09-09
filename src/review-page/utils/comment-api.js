/**
 * Default comment API for the single-post review flow. The popovers
 * (`InlineCommentPopover`, `InlineThreadPopover`) accept this object as the
 * `api` prop with this default so existing call sites keep working unchanged.
 * The site-review chrome (Pro) provides its own implementation that hits the
 * `flow-pro/v1/site-reviews/{id}/comments` namespace with site-review-shaped
 * payloads. Both share the same surface so the popovers stay generic. Surface:
 * postComment( { html, anchorText, blockClientId, parentId } ) → comment row
 * updateComment( id, data ) → comment row
 */
import flowFetch, { pageData } from './api';
import { ensureInviteCommentIdentity } from './invite-comment-identity';

function withInviteIdentity( payload ) {
	if ( ! pageData?.isEmailInvitee ) {
		return payload;
	}
	const email = String( pageData.inviteEmail || '' );
	const name =
		String( pageData.inviteDisplayName || '' ).trim() ||
		email;
	return {
		...payload,
		authorEmail: email,
		authorName: name,
	};
}

export const defaultCommentApi = {
	postComment: async ( payload ) => {
		await ensureInviteCommentIdentity();
		return flowFetch( `reviews/${ pageData.reviewId }/comments`, {
			method: 'POST',
			data: withInviteIdentity( payload ),
		} );
	},
	updateComment: ( id, data ) =>
		flowFetch( `comments/${ id }`, {
			method: 'PATCH',
			data,
		} ),
	deleteComment: ( id ) =>
		flowFetch( `comments/${ id }`, {
			method: 'DELETE',
		} ),
};
