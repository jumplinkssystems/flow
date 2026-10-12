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

/**
 * The "Review Mode set to Mandatory" notice is only a reminder, so it can be
 * dismissed too; publishing stays blocked either way.
 */
export const MANDATORY_DISMISS_VALUE = 'review-mandatory';
const MANDATORY_DISMISS_KEY = 'flow_ew_dismiss_review_mandatory';

const DISMISS_KEYS = {
	[ NO_REVIEW_ROLES_DISMISS_VALUE ]: DISMISS_KEY,
	[ MANDATORY_DISMISS_VALUE ]: MANDATORY_DISMISS_KEY,
};

export function isDismissibleNoticeValue( value ) {
	return Object.prototype.hasOwnProperty.call( DISMISS_KEYS, value || '' );
}

export function isNoticeDismissed( value ) {
	if ( ! isDismissibleNoticeValue( value ) ) {
		return false;
	}
	try {
		return window.localStorage.getItem( DISMISS_KEYS[ value ] ) === '1';
	} catch ( _err ) {
		return false;
	}
}

export function dismissNotice( value ) {
	if ( ! isDismissibleNoticeValue( value ) ) {
		return;
	}
	try {
		window.localStorage.setItem( DISMISS_KEYS[ value ], '1' );
	} catch ( _err ) {
		// ignore
	}
}
