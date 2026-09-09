import { __ } from '@wordpress/i18n';

const NOTICE_DISMISSED_KEY = 'flow_ew_dismiss_inline_area_hint';
const NOTICE_CLASS = 'flow-review-info-notice';

const INFO_ICON_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
	'<path d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12C20 16.411 16.411 20 12 20Z" fill="currentColor"/>' +
	'<path d="M11 11H13V17H11V11ZM11 7H13V9H11V7Z" fill="currentColor"/>' +
	'</svg>';

const DISMISS_ICON_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">' +
	'<path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95 1.414-1.414 4.95 4.95z"/>' +
	'</svg>';

export function removeCommentableNotice() {
	window.document.querySelector( '.' + NOTICE_CLASS )?.remove();
}

export function installCommentableChrome( options = {} ) {
	const { withNotice = true } = options;
	if ( ! withNotice ) {
		removeCommentableNotice();
		return;
	}

	const doc = window.document;
	if ( ! doc?.body ) return;

	if ( sessionStorage.getItem( NOTICE_DISMISSED_KEY ) === '1' ) return;
	if ( doc.querySelector( '.' + NOTICE_CLASS ) ) return;

	const notice = doc.createElement( 'div' );
	notice.className = NOTICE_CLASS + ' is-dismissible';
	notice.setAttribute( 'role', 'status' );

	const icon = doc.createElement( 'span' );
	icon.className = 'flow-review-info-notice__icon';
	icon.setAttribute( 'aria-hidden', 'true' );
	icon.innerHTML = INFO_ICON_SVG;

	const content = doc.createElement( 'div' );
	content.className = 'flow-review-info-notice__content';

	const title = doc.createElement( 'p' );
	title.className = 'flow-review-info-notice__title';
	title.textContent = __(
		'Add inline comments',
		'jumplinks-editorial-workflow'
	);

	const body = doc.createElement( 'p' );
	body.className = 'flow-review-info-notice__text';
	body.textContent = __(
		'Highlight text in the content preview, then choose "Add comment".',
		'jumplinks-editorial-workflow'
	);
	content.append( title, body );

	const dismiss = doc.createElement( 'button' );
	dismiss.type = 'button';
	dismiss.className = 'flow-review-info-notice__dismiss';
	dismiss.setAttribute(
		'aria-label',
		__( 'Dismiss', 'jumplinks-editorial-workflow' )
	);
	dismiss.innerHTML = DISMISS_ICON_SVG;
	dismiss.addEventListener( 'click', () => {
		sessionStorage.setItem( NOTICE_DISMISSED_KEY, '1' );
		notice.remove();
	} );

	notice.append( icon, content, dismiss );
	doc.body.appendChild( notice );
}
