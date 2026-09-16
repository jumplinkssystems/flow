import { __ } from '@wordpress/i18n';

const NOTICE_CLASS = 'flow-review-info-notice';
const SEEN_KEY_PREFIX = 'flow_ew_hint_seen_';

const DISMISS_ICON_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">' +
	'<path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95 1.414-1.414 4.95 4.95z"/>' +
	'</svg>';

/**
 * Whose dismissal this is. A WordPress account is keyed by id; an email
 * invitee by their address, since they never have one. Dismissing must not
 * silence the hint for the next person to use the same browser.
 */
function seenKey() {
	const pageData = window.flowReviewPage || {};
	const userId = Number( pageData.currentUserId ) || 0;
	if ( userId > 0 ) {
		return SEEN_KEY_PREFIX + 'u' + userId;
	}
	const email = String( pageData.inviteEmail || '' )
		.trim()
		.toLowerCase();
	return SEEN_KEY_PREFIX + ( email ? 'e' + email : 'anon' );
}

function hasSeen() {
	try {
		return window.localStorage.getItem( seenKey() ) === '1';
	} catch ( e ) {
		return false;
	}
}

function markSeen() {
	try {
		window.localStorage.setItem( seenKey(), '1' );
	} catch ( e ) {
		// Storage blocked — the hint simply returns on the next visit.
	}
}

export function removeCommentableNotice() {
	window.document.querySelector( '.' + NOTICE_CLASS )?.remove();
}

/**
 * Silent, looping clip of the highlight-to-comment gesture. Returns null when
 * neither encode shipped, so the popup degrades to its text.
 *
 * @param {Document} doc
 */
function buildHintVideo( doc ) {
	const pageData = window.flowReviewPage || {};
	const sources = [
		[ pageData.hintVideoWebm, 'video/webm' ],
		[ pageData.hintVideoMp4, 'video/mp4' ],
	].filter( ( [ url ] ) => !! url );
	if ( ! sources.length ) {
		return null;
	}

	const video = doc.createElement( 'video' );
	video.className = 'flow-review-info-notice__video';
	video.autoplay = true;
	video.loop = true;
	video.muted = true;
	video.playsInline = true;
	video.setAttribute( 'playsinline', '' );
	video.setAttribute(
		'aria-label',
		__(
			'Highlighting text on a page and leaving a comment on it.',
			'jumplinks-editorial-workflow'
		)
	);
	sources.forEach( ( [ url, type ] ) => {
		const source = doc.createElement( 'source' );
		source.src = url;
		source.type = type;
		video.appendChild( source );
	} );
	return video;
}

export function installCommentableChrome( options = {} ) {
	const { withNotice = true } = options;
	if ( ! withNotice ) {
		removeCommentableNotice();
		return;
	}

	const doc = window.document;
	if ( ! doc?.body ) {
		return;
	}

	if ( hasSeen() ) {
		return;
	}
	if ( doc.querySelector( '.' + NOTICE_CLASS ) ) {
		return;
	}

	const title = __( 'Add inline comments', 'jumplinks-editorial-workflow' );

	const notice = doc.createElement( 'div' );
	notice.className = NOTICE_CLASS;
	notice.setAttribute( 'role', 'dialog' );
	notice.setAttribute( 'aria-label', title );

	const close = () => {
		markSeen();
		notice.remove();
	};

	const header = doc.createElement( 'div' );
	header.className = 'flow-review-info-notice__header';

	const heading = doc.createElement( 'p' );
	heading.className = 'flow-review-info-notice__title';
	heading.textContent = title;

	const dismiss = doc.createElement( 'button' );
	dismiss.type = 'button';
	dismiss.className = 'flow-review-info-notice__dismiss';
	dismiss.setAttribute(
		'aria-label',
		__( 'Dismiss', 'jumplinks-editorial-workflow' )
	);
	dismiss.innerHTML = DISMISS_ICON_SVG;
	dismiss.addEventListener( 'click', close );

	header.append( heading, dismiss );

	const body = doc.createElement( 'div' );
	body.className = 'flow-review-info-notice__body';

	const text = doc.createElement( 'p' );
	text.className = 'flow-review-info-notice__text';
	text.textContent = __(
		'Highlight text in the content preview, then choose "Add comment".',
		'jumplinks-editorial-workflow'
	);
	body.appendChild( text );

	const video = buildHintVideo( doc );
	if ( video ) {
		body.appendChild( video );
	}

	const actions = doc.createElement( 'div' );
	actions.className = 'flow-review-info-notice__actions';

	const confirm = doc.createElement( 'button' );
	confirm.type = 'button';
	confirm.className =
		'flow-review-info-notice__btn flow-review-info-notice__btn--primary';
	confirm.textContent = __(
		'Got it, let me start',
		'jumplinks-editorial-workflow'
	);
	confirm.addEventListener( 'click', close );
	actions.appendChild( confirm );
	body.appendChild( actions );

	notice.append( header, body );
	doc.body.appendChild( notice );
}
