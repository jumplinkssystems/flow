/**
 * Persistence for the "No Review Roles Assigned" editor notice.
 * Kept separate from publish-guard notices so dismissing roles guidance
 * does not hide mandatory-publish warnings.
 */
const DISMISS_KEY = 'flow_ew_dismiss_no_review_roles';

export function isNoReviewRolesNoticeDismissed() {
	try {
		return window.localStorage.getItem( DISMISS_KEY ) === '1';
	} catch ( _err ) {
		return false;
	}
}

export function dismissNoReviewRolesNotice() {
	try {
		window.localStorage.setItem( DISMISS_KEY, '1' );
	} catch ( _err ) {
		// ignore
	}
}

export const NO_REVIEW_ROLES_DISMISS_ATTR = 'data-flow-ew-dismiss';
export const NO_REVIEW_ROLES_DISMISS_VALUE = 'no-review-roles';
