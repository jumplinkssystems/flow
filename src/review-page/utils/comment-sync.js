/**
 * Keeps an open review page current while someone else is commenting on it.
 *
 * Polls a version token; the server only serialises comments when something
 * actually moved. The lists are then broadcast as authoritative and each
 * consumer merges them, rather than replaying per-comment events — those carry
 * side effects (tab switching, counter increments) that must not fire for
 * someone else's work.
 */
import flowFetch, { pageData } from './api';
import {
	isCommentBusy,
	deferRemoval,
	clearDeferredRemoval,
} from './local-edit-registry';

const DEFAULT_INTERVAL_MS = 15000;
const MAX_BACKOFF_MS = 60000;
const STOP_STATUSES = [ 401, 403, 404 ];
const MIN_REFOCUS_GAP_MS = 2000;

let timer = null;
let controller = null;
let started = false;
let stopped = false;
let failures = 0;
let version = '';
let lastLocalWriteAt = 0;
let draftOpen = false;
let lastPollStartedAt = 0;
let adapter = null;

/**
 * Point the poller at another backend. Site Review reuses the merge, backoff
 * and visibility behaviour here against its own REST namespace, where comments
 * belong to a whole site rather than one post.
 *
 * @param {{fetchPayload: Function, handlePayload: Function}} next
 */
export function configureCommentSync( next ) {
	adapter = next;
}

/**
 * Called around every local write. A response that left the browser before the
 * write landed cannot contain it, and applying it would visibly drop the
 * comment the user just posted.
 */
export function noteLocalWrite() {
	lastLocalWriteAt = Date.now();
}

function intervalMs() {
	const seconds = Number( pageData.syncInterval );
	return Number.isFinite( seconds ) && seconds > 0
		? seconds * 1000
		: DEFAULT_INTERVAL_MS;
}

function sameComment( a, b ) {
	return (
		a.html === b.html &&
		a.isResolved === b.isResolved &&
		a.isAgent === b.isAgent &&
		a.parentId === b.parentId &&
		a.author === b.author &&
		a.anchorText === b.anchorText
	);
}

/**
 * Merge an incoming list into the one on screen, keeping object identity for
 * everything unchanged so React keys, thread building and memos stay stable.
 * Returns the previous array itself when nothing moved.
 */
export function mergeCommentLists( prev, next ) {
	const previous = Array.isArray( prev ) ? prev : [];
	const incoming = Array.isArray( next ) ? next : [];
	const byId = new Map( previous.map( ( c ) => [ Number( c.id ), c ] ) );
	const incomingIds = new Set( incoming.map( ( c ) => Number( c.id ) ) );

	let changed = false;
	const merged = incoming.map( ( c ) => {
		const existing = byId.get( Number( c.id ) );
		if ( existing && sameComment( existing, c ) ) {
			return existing;
		}
		if ( existing && isCommentBusy( c.id ) ) {
			// Being edited here; keep what the user sees until they close it.
			return existing;
		}
		changed = true;
		return c;
	} );

	previous.forEach( ( c ) => {
		const id = Number( c.id );
		if ( incomingIds.has( id ) ) {
			clearDeferredRemoval( id );
			return;
		}
		if ( isCommentBusy( id ) ) {
			deferRemoval( id );
			merged.push( c );
			return;
		}
		changed = true;
	} );

	if ( ! changed && merged.length === previous.length ) {
		return previous;
	}
	return merged;
}

function broadcast( payload ) {
	window.dispatchEvent(
		new CustomEvent( 'flow:general-comments-reset', {
			detail: { comments: payload.comments || [] },
		} )
	);
	window.dispatchEvent(
		new CustomEvent( 'flow:inline-comments-reset', {
			detail: { comments: payload.inlineComments || [] },
		} )
	);

	const review = payload.review;
	if ( review && 'revisionStatus' in review ) {
		// Never reload the content the reviewer is reading; the bar offers the
		// new version and they decide when to take it.
		window.dispatchEvent(
			new CustomEvent( 'flow:revision-changed', {
				detail: {
					revisionStatus: review.revisionStatus,
					latestRevisionUrl: review.latestRevisionUrl || '',
				},
			} )
		);
	}
	if ( review && review.status ) {
		// No `message` key: this must not raise the action snackbar, which is
		// reserved for something the viewer did themselves.
		window.dispatchEvent(
			new CustomEvent( 'flow:status-changed', {
				detail: { status: review.displayStatus || review.status },
			} )
		);
	}
}

async function poll() {
	if ( stopped || document.visibilityState !== 'visible' ) {
		return;
	}

	const startedAt = Date.now();
	lastPollStartedAt = startedAt;
	controller =
		typeof AbortController !== 'undefined' ? new AbortController() : null;

	try {
		const params = new URLSearchParams();
		if ( version ) {
			params.set( 'version', version );
		}
		if ( pageData.revisionId ) {
			params.set( 'revision', String( pageData.revisionId ) );
		}
		const query = params.toString() ? `?${ params.toString() }` : '';
		const options = controller ? { signal: controller.signal } : {};
		const payload = adapter
			? await adapter.fetchPayload( query, options )
			: await flowFetch(
					`reviews/${ pageData.reviewId }/comments/sync${ query }`,
					options
			  );
		failures = 0;

		if ( lastLocalWriteAt >= startedAt ) {
			// A local write started after this request left; its result is not
			// in this snapshot. Drop it and ask again.
			schedule( 0 );
			return;
		}
		if ( payload && payload.changed ) {
			if ( draftOpen ) {
				// An inline draft is holding a range into the content; wrapping
				// new highlights now could resolve its anchor to the wrong
				// place. Leave `version` alone so the next poll re-delivers.
				schedule();
				return;
			}
			version = payload.version || version;
			if ( adapter ) {
				adapter.handlePayload( payload );
			} else {
				broadcast( payload );
			}
		} else if ( payload && payload.version ) {
			version = payload.version;
		}
		schedule();
	} catch ( err ) {
		if ( err && err.name === 'AbortError' ) {
			return;
		}
		if ( err && STOP_STATUSES.includes( Number( err.data?.status ) ) ) {
			// Access was revoked or the invite session ended; retrying would
			// hammer an endpoint that will keep refusing.
			stop();
			return;
		}
		failures += 1;
		schedule(
			Math.min( intervalMs() * 2 ** ( failures - 1 ), MAX_BACKOFF_MS )
		);
	} finally {
		controller = null;
	}
}

function schedule( ms ) {
	window.clearTimeout( timer );
	if ( stopped ) {
		return;
	}
	timer = window.setTimeout( poll, ms === undefined ? intervalMs() : ms );
}

function stop() {
	stopped = true;
	window.clearTimeout( timer );
	timer = null;
	if ( controller ) {
		controller.abort();
	}
}

function onVisibilityChange() {
	if ( document.visibilityState === 'visible' ) {
		schedule( 0 );
		return;
	}
	window.clearTimeout( timer );
	if ( controller ) {
		controller.abort();
	}
}

/**
 * Coming back to the page should show what arrived while it was away, rather
 * than the rest of the interval. Switching browser tabs fires
 * `visibilitychange`, but switching windows or applications only fires
 * `focus` — the page stays "visible" the whole time — so both are wired up.
 */
function onFocus() {
	if ( stopped || document.visibilityState !== 'visible' ) {
		return;
	}
	// A poll that just went out already covers this; don't double up on
	// someone alt-tabbing back and forth.
	if ( Date.now() - lastPollStartedAt < MIN_REFOCUS_GAP_MS ) {
		return;
	}
	schedule( 0 );
}

export function startCommentSync() {
	if ( started || pageData.error ) {
		return;
	}
	// Site Review drives the poller through an adapter and has no review id.
	if ( ! adapter && ! pageData.reviewId ) {
		return;
	}
	if ( Number( pageData.syncInterval ) === 0 ) {
		return;
	}
	started = true;
	version = String( pageData.commentsVersion || '' );

	document.addEventListener( 'visibilitychange', onVisibilityChange );
	window.addEventListener( 'focus', onFocus );
	window.addEventListener( 'flow:inline-draft-state', ( e ) => {
		draftOpen = !! e.detail?.open;
		if ( ! draftOpen ) {
			schedule( 0 );
		}
	} );
	// A deferred removal became applicable, or a caller wants a fresh look.
	window.addEventListener( 'flow:comment-sync-request', () => schedule( 0 ) );

	schedule();
}
