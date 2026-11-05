import { pageData } from './api';
import { deserializeRange } from './text-anchor';
import { previewDevice } from '../../shared/device';

export function parseDescriptor( raw ) {
	try {
		return JSON.parse( raw || '' );
	} catch {
		return null;
	}
}

/**
 * A comment whose anchor no longer resolves, or only by searching the
 * element's text rather than its saved path and offsets: the content moved.
 */
export function isAnchorOutdated( comment, root ) {
	const descriptor = parseDescriptor( comment.blockClientId );
	if ( ! descriptor ) {
		return true;
	}
	try {
		const matchInfo = {};
		const range = deserializeRange( descriptor, root, matchInfo );
		return ! range || matchInfo.exact === false;
	} catch {
		return true;
	}
}

// The page as it was when the comment was raised, or '' when already there or unknown.
// Resolved, or still open but its text is gone from this version (outdated).
export function issueUrl( thread, isOutdated ) {
	const revisionId = Number( thread.revisionId || 0 );
	if (
		! pageData.canViewRevisions ||
		! ( thread.isResolved || isOutdated ) ||
		! revisionId ||
		revisionId === Number( pageData.revisionId || 0 )
	) {
		return '';
	}
	const url = new URL( window.location.href );
	url.searchParams.set( 'flow_revision_id', String( revisionId ) );
	url.searchParams.set( 'flow_focus_comment', String( thread.id ) );
	return url.toString();
}

/** Switch the preview to the pin's device, then reopen the pin once the page reloads. */
export function showPinOnDevice( commentId, device ) {
	const onReady = () => {
		window.removeEventListener( 'flow:iframe-ready', onReady );
		window.dispatchEvent(
			new CustomEvent( 'flow:focus-comment-when-ready', {
				detail: { commentId },
			} )
		);
	};
	window.addEventListener( 'flow:iframe-ready', onReady );
	previewDevice( device );
}
