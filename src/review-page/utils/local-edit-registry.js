/**
 * Comment ids this tab is busy with — an open edit box or reply box. A sync
 * that arrives while one is open must not pull the comment out from under the
 * person typing, so removals wait here until the id is released.
 */
const busy = new Set();
const pendingRemovals = new Set();

export function markCommentBusy( id ) {
	const key = Number( id );
	if ( key > 0 ) {
		busy.add( key );
	}
}

export function releaseCommentBusy( id ) {
	const key = Number( id );
	if ( ! busy.delete( key ) ) {
		return;
	}
	if ( pendingRemovals.delete( key ) ) {
		// The comment went away while it was being edited; now that the editor
		// is closed the next sync can drop it.
		window.dispatchEvent( new CustomEvent( 'flow:comment-sync-request' ) );
	}
}

export function isCommentBusy( id ) {
	return busy.has( Number( id ) );
}

export function deferRemoval( id ) {
	pendingRemovals.add( Number( id ) );
}

export function clearDeferredRemoval( id ) {
	pendingRemovals.delete( Number( id ) );
}
