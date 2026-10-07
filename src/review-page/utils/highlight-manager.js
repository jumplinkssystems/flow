import {
	deserializeRange,
	wrapRange,
	clearHighlight,
	resolveMediaNode,
	resolvePinNode,
} from './text-anchor';
import {
	PIN_CLASS,
	createPinElement,
	observePinAnchor,
	placePinOnAnchor,
	removePin,
} from './pin-marker';
import { closestFromEventTarget } from './dom-helpers';
import {
	getIframeDoc,
	injectHighlightStyles,
	resolveCommentContentRoot,
} from './iframe-bridge';
import {
	installCommentableChrome,
	removeCommentableNotice,
} from './commentable-chrome';
import {
	installLinkDragSelect,
	installPreviewLinkGuard,
} from './preview-link-guard';
import { COMMENTS_HIDDEN_CLASS } from './comment-visibility';
const HIGHLIGHT_CLASS = 'flow-inline-highlight';
const MEDIA_HIGHLIGHT_CLASS = 'flow-inline-highlight-media';
const ACTIVE_CLASS = 'flow-inline-highlight--active';
// While inline comments are hidden, the one picked in the sidebar stays visible.
const REVEALED_CLASS = 'flow-inline-highlight--revealed';
let revealedCommentId = 0;
let openThreadCommentId = 0;
const RESOLVED_CLASS = 'flow-inline-highlight--resolved';

let allComments = [];
let iframeCleanup = null;
let iframeLinkGuardCleanup = null;
let highlightManagerMode = 'review';

function hasRootInlineComments( comments ) {
	return ( comments || [] ).some( ( c ) => ! c.parentId && c.blockClientId );
}

function onHighlightClick( e ) {
	let mark = closestFromEventTarget(
		e.target,
		`.${ HIGHLIGHT_CLASS }, .${ MEDIA_HIGHLIGHT_CLASS }, .${ PIN_CLASS }[data-comment-id]`
	);

	if ( ! mark ) {
		const overlay = closestFromEventTarget(
			e.target,
			'.flow-embed-overlay'
		);
		const sibling =
			overlay?.flowMedia ||
			overlay?.parentElement?.querySelector?.( 'img, video, iframe' ) ||
			null;
		if ( sibling?.classList?.contains( MEDIA_HIGHLIGHT_CLASS ) ) {
			mark = sibling;
		}
	}

	if ( ! mark ) {
		return;
	}
	// Hidden comments stay inert until the sidebar opens one.
	if (
		mark.ownerDocument.documentElement.classList.contains(
			COMMENTS_HIDDEN_CLASS
		) &&
		! mark.classList.contains( REVEALED_CLASS )
	) {
		return;
	}

	let commentId = Number( mark.dataset.commentId );
	if ( ! commentId ) {
		const ids = ( mark.dataset.commentIds || '' )
			.split( ' ' )
			.map( Number )
			.filter( Boolean );
		commentId = ids[ ids.length - 1 ] || 0;
	}
	if ( ! commentId ) {
		return;
	}

	window.dispatchEvent(
		new CustomEvent( 'flow:inline-comment-focus', {
			detail: {
				commentId,
				isResolved: mark.classList.contains( RESOLVED_CLASS ),
			},
		} )
	);
}

function queryHighlights( selector ) {
	const results = [ ...document.querySelectorAll( selector ) ];
	const iframeDoc = getIframeDoc();
	if ( iframeDoc ) {
		results.push( ...iframeDoc.querySelectorAll( selector ) );
	}
	return results;
}

function hasCommentId( el, commentId ) {
	if ( Number( el.dataset.commentId ) === commentId ) {
		return true;
	}
	const ids = ( el.dataset.commentIds || '' )
		.split( ' ' )
		.map( Number )
		.filter( Boolean );
	return ids.includes( commentId );
}

function queryHighlightedByCommentId( commentId ) {
	const selector = `.${ HIGHLIGHT_CLASS }, .${ MEDIA_HIGHLIGHT_CLASS }, .${ PIN_CLASS }[data-comment-id]`;
	const all = queryHighlights( selector );
	return all.filter( ( el ) => hasCommentId( el, commentId ) );
}

function addCommentId( el, commentId ) {
	const ids = new Set(
		( el.dataset.commentIds || '' )
			.split( ' ' )
			.map( Number )
			.filter( Boolean )
	);
	ids.add( commentId );
	el.dataset.commentIds = Array.from( ids ).join( ' ' );
}

function removeCommentId( el, commentId ) {
	const ids = ( el.dataset.commentIds || '' )
		.split( ' ' )
		.map( Number )
		.filter( Boolean )
		.filter( ( id ) => id !== commentId );
	if ( ids.length ) {
		el.dataset.commentIds = ids.join( ' ' );
	} else {
		delete el.dataset.commentIds;
	}
}

function applyMediaHighlight( commentId, descriptor, optionalRoot ) {
	const media = resolveMediaNode( descriptor, optionalRoot );
	if ( ! media ) {
		return null;
	}
	media.classList.add( MEDIA_HIGHLIGHT_CLASS );
	addCommentId( media, commentId );
	return media;
}

function applyPinMarker( commentId, descriptor, optionalRoot ) {
	const anchor = resolvePinNode( descriptor, optionalRoot );
	if ( ! anchor ) {
		return null;
	}
	const doc = anchor.ownerDocument;
	const pin =
		doc.querySelector(
			`.${ PIN_CLASS }[data-comment-id="${ commentId }"]`
		) ||
		createPinElement( doc, {
			commentId,
			label: descriptor.text || '',
		} );
	pin.flowAnchor = anchor;
	pin.flowDescriptor = descriptor;
	const reposition = () =>
		placePinOnAnchor( pin, pin.flowAnchor, descriptor.x, descriptor.y );
	reposition();
	observePinAnchor( pin, anchor, reposition );
	return pin;
}

// Style-only writes, so this never retriggers the rewrap observer.
function repositionPins( doc ) {
	doc?.querySelectorAll( `.${ PIN_CLASS }[data-comment-id]` ).forEach(
		( pin ) => {
			if ( ! pin.flowAnchor?.isConnected ) {
				const anchor = resolvePinNode( pin.flowDescriptor );
				if ( ! anchor ) {
					removePin( pin );
					return;
				}
				pin.flowAnchor = anchor;
				observePinAnchor( pin, anchor, () =>
					placePinOnAnchor(
						pin,
						pin.flowAnchor,
						pin.flowDescriptor.x,
						pin.flowDescriptor.y
					)
				);
			}
			placePinOnAnchor(
				pin,
				pin.flowAnchor,
				pin.flowDescriptor.x,
				pin.flowDescriptor.y
			);
		}
	);
}

function findMark( commentId ) {
	const selector = `.${ HIGHLIGHT_CLASS }[data-comment-id="${ commentId }"], .${ MEDIA_HIGHLIGHT_CLASS }, .${ PIN_CLASS }[data-comment-id="${ commentId }"]`;
	const iframeDoc = getIframeDoc();
	if ( iframeDoc ) {
		const inIframe = [ ...iframeDoc.querySelectorAll( selector ) ].find(
			( el ) => hasCommentId( el, commentId )
		);
		if ( inIframe ) {
			return { mark: inIframe, inIframe: true };
		}
	}
	const inDoc = [ ...document.querySelectorAll( selector ) ].find( ( el ) =>
		hasCommentId( el, commentId )
	);
	if ( inDoc ) {
		return { mark: inDoc, inIframe: false };
	}
	return null;
}

function handleAdd( e ) {
	const { commentId, rangeDescriptor } = e.detail || {};
	if ( ! commentId || ! rangeDescriptor ) {
		return;
	}
	if ( [ 'image', 'video', 'embed' ].includes( rangeDescriptor?.type ) ) {
		applyMediaHighlight( commentId, rangeDescriptor );
		return;
	}
	if ( rangeDescriptor?.type === 'pin' ) {
		applyPinMarker( commentId, rangeDescriptor );
		return;
	}

	const range = deserializeRange( rangeDescriptor );
	if ( range ) {
		wrapRange( range, commentId );
	}
}

function handleResolve( e ) {
	const { commentId, resolved = true } = e.detail || {};
	if ( ! commentId ) {
		return;
	}

	// Reopening a thread sends the same event with `resolved: false`.
	queryHighlightedByCommentId( commentId ).forEach( ( mark ) =>
		mark.classList.toggle( RESOLVED_CLASS, !! resolved )
	);
}

function removeHighlightForComment( commentId ) {
	clearHighlight( commentId );
	queryHighlights(
		`.${ PIN_CLASS }[data-comment-id="${ commentId }"]`
	).forEach( removePin );
	queryHighlights( `.${ MEDIA_HIGHLIGHT_CLASS }` ).forEach( ( media ) => {
		if ( ! hasCommentId( media, commentId ) ) {
			return;
		}
		removeCommentId( media, commentId );
		if ( ! media.dataset.commentIds ) {
			media.classList.remove(
				MEDIA_HIGHLIGHT_CLASS,
				ACTIVE_CLASS,
				RESOLVED_CLASS
			);
		}
	} );
}

function handleRemove( e ) {
	const { commentId } = e.detail || {};
	if ( ! commentId ) {
		return;
	}
	removeHighlightForComment( commentId );
}

function applyRevealed() {
	queryHighlights( `.${ REVEALED_CLASS }` ).forEach( ( el ) => {
		if ( ! hasCommentId( el, revealedCommentId ) ) {
			el.classList.remove( REVEALED_CLASS );
		}
	} );
	if ( revealedCommentId ) {
		queryHighlightedByCommentId( revealedCommentId ).forEach( ( el ) =>
			el.classList.add( REVEALED_CLASS )
		);
	}
}

function setRevealed( commentId ) {
	revealedCommentId = Number( commentId ) || 0;
	applyRevealed();
}

function handleThreadState( e ) {
	const commentId = Number( e.detail?.commentId ) || 0;
	if ( e.detail?.open ) {
		openThreadCommentId = commentId;
		return;
	}
	if ( openThreadCommentId && openThreadCommentId === revealedCommentId ) {
		setRevealed( 0 );
	}
	openThreadCommentId = 0;
}

function handleScrollTo( e ) {
	const { commentId } = e.detail || {};
	if ( ! commentId ) {
		return;
	}
	setRevealed( commentId );

	queryHighlights( `.${ ACTIVE_CLASS }` ).forEach( ( el ) =>
		el.classList.remove( ACTIVE_CLASS )
	);

	const found = findMark( commentId );
	if ( ! found ) {
		return;
	}

	found.mark.classList.add( ACTIVE_CLASS );
	found.mark.scrollIntoView( { behavior: 'smooth', block: 'center' } );
	setTimeout( () => found.mark.classList.remove( ACTIVE_CLASS ), 2000 );
}

/**
 * Ids of every comment that already has a mark in the document — text marks
 * carry one id, media marks a space-separated list. One pass over the DOM per
 * rewrap replaces the two `querySelector` calls the old loop made per comment,
 * which mattered on long, heavily annotated pages whose theme JS mutates
 * the DOM continuously.
 */
function collectAnchoredCommentIds( contentRoot, doc ) {
	const ids = new Set();
	const scopes = [ contentRoot ];
	if ( doc.body && doc.body !== contentRoot ) {
		scopes.push( doc.body );
	}
	for ( const scope of scopes ) {
		scope
			.querySelectorAll(
				`.${ HIGHLIGHT_CLASS }[data-comment-id], .${ PIN_CLASS }[data-comment-id]`
			)
			.forEach( ( el ) => ids.add( String( el.dataset.commentId ) ) );
		scope
			.querySelectorAll( `.${ MEDIA_HIGHLIGHT_CLASS }[data-comment-ids]` )
			.forEach( ( el ) => {
				( el.dataset.commentIds || '' )
					.split( ' ' )
					.forEach( ( id ) => {
						if ( id ) {
							ids.add( id );
						}
					} );
			} );
	}
	return ids;
}

function wrapCommentsInRoot( contentRoot, comments ) {
	if ( ! contentRoot ) {
		return;
	}
	const doc = contentRoot.ownerDocument || document;
	const roots = ( comments || [] ).filter(
		( c ) => ! c.parentId && c.blockClientId
	);
	if ( ! roots.length ) {
		return;
	}
	const anchored = collectAnchoredCommentIds( contentRoot, doc );

	for ( const c of roots ) {
		if ( anchored.has( String( c.id ) ) ) {
			continue;
		}
		try {
			const descriptor = JSON.parse( c.blockClientId );
			// Pick the root the descriptor was serialized against. Title /
			// metadata comments live outside `.entry-content` and were
			// anchored to <body> at serialize time — they need the same root
			// at wrap time or path resolution silently fails.
			const effectiveRoot =
				descriptor?.rootType === 'body' && doc.body
					? doc.body
					: contentRoot;
			if ( [ 'image', 'video', 'embed' ].includes( descriptor?.type ) ) {
				const media = applyMediaHighlight(
					c.id,
					descriptor,
					effectiveRoot
				);
				if ( media && c.isResolved ) {
					media.classList.add( RESOLVED_CLASS );
				}
				continue;
			}
			if ( descriptor?.type === 'pin' ) {
				const pin = applyPinMarker( c.id, descriptor, effectiveRoot );
				if ( pin && c.isResolved ) {
					pin.classList.add( RESOLVED_CLASS );
				}
				continue;
			}
			const range = deserializeRange( descriptor, effectiveRoot );
			if ( range ) {
				const mark = wrapRange( range, c.id );
				if ( mark && c.isResolved ) {
					mark.classList.add( RESOLVED_CLASS );
				}
			}
		} catch {
			// descriptor parse failed
		}
	}
}

/**
 * Attach the highlight manager to a target document — handles style
 * injection, root resolution, initial wrap of existing comments, click
 * delegation, and re-wrap on DOM mutations. Shared between the per-post
 * iframe path (`handleIframeReady`) and the site-review live-document
 * path (`attachManagerToLiveDocument`).
 *
 * @param {Document} doc
 * @param {{ skipLinkGuard?: boolean, withNotice?: boolean }} [options]
 * @return {() => void} Cleanup function that detaches everything attached here.
 */
function attachManagerToDoc( doc, options = {} ) {
	if ( ! doc ) {
		return () => {};
	}
	const { skipLinkGuard = false, withNotice = true } = options;

	injectHighlightStyles( doc );

	let linkGuardCleanup = null;
	if ( ! skipLinkGuard ) {
		linkGuardCleanup = installPreviewLinkGuard( doc );
	} else if ( doc.documentElement ) {
		doc.documentElement.classList.add( 'flow-clickable-links' );
		linkGuardCleanup = installLinkDragSelect( doc );
	}

	const wrapRoot = resolveCommentContentRoot( doc ) || doc.body;
	const clickRoot = doc.body || doc.documentElement;
	if ( ! wrapRoot || ! clickRoot ) {
		return () => {
			if ( linkGuardCleanup ) {
				linkGuardCleanup();
			}
		};
	}

	wrapCommentsInRoot( wrapRoot, allComments );
	repositionPins( doc );
	applyRevealed();

	if ( withNotice ) {
		installCommentableChrome( {
			withNotice: ! hasRootInlineComments( allComments ),
		} );
	}

	let rewrapTimer = null;
	const scheduleRewrap = () => {
		clearTimeout( rewrapTimer );
		rewrapTimer = window.setTimeout( () => {
			wrapCommentsInRoot( wrapRoot, allComments );
			repositionPins( doc );
			applyRevealed();
		}, 150 );
	};
	const mo = new MutationObserver( scheduleRewrap );
	mo.observe( wrapRoot, { childList: true, subtree: true } );

	clickRoot.addEventListener( 'click', onHighlightClick );
	const onPagePointerDown = ( e ) => {
		if (
			revealedCommentId &&
			! closestFromEventTarget( e.target, `.${ REVEALED_CLASS }` )
		) {
			setRevealed( 0 );
		}
	};
	doc.addEventListener( 'pointerdown', onPagePointerDown, true );

	const view = doc.defaultView;
	let resizeFrame = 0;
	const onResize = () => {
		if ( resizeFrame ) {
			return;
		}
		resizeFrame = view.requestAnimationFrame( () => {
			resizeFrame = 0;
			repositionPins( doc );
		} );
	};
	view?.addEventListener( 'resize', onResize );

	return () => {
		clearTimeout( rewrapTimer );
		mo.disconnect();
		clickRoot.removeEventListener( 'click', onHighlightClick );
		doc.removeEventListener( 'pointerdown', onPagePointerDown, true );
		view?.removeEventListener( 'resize', onResize );
		if ( linkGuardCleanup ) {
			linkGuardCleanup();
		}
	};
}

function handleIframeReady( e ) {
	const iframe = e.detail?.iframe;
	if ( ! iframe?.contentDocument ) {
		return;
	}

	if ( iframeLinkGuardCleanup ) {
		iframeLinkGuardCleanup();
		iframeLinkGuardCleanup = null;
	}

	if ( iframeCleanup ) {
		iframeCleanup();
		iframeCleanup = null;
	}

	removeCommentableNotice();

	iframeCleanup = attachManagerToDoc( iframe.contentDocument, {
		skipLinkGuard: highlightManagerMode === 'site-review',
		withNotice: highlightManagerMode !== 'site-review',
	} );
}

function handleIframeRemoved() {
	if ( iframeCleanup ) {
		iframeCleanup();
		iframeCleanup = null;
	}
}

function handleCommentAdded( e ) {
	const { comment } = e.detail || {};
	if ( ! comment ) {
		return;
	}
	const id = Number( comment.id );
	if ( allComments.some( ( c ) => Number( c.id ) === id ) ) {
		return;
	}
	allComments = [ ...allComments, comment ];
}

function handleCommentResolved( e ) {
	// Reopening a thread sends the same event with `resolved: false`.
	const { commentId, resolved = true } = e.detail || {};
	if ( commentId ) {
		allComments = allComments.map( ( c ) =>
			Number( c.id ) === Number( commentId )
				? { ...c, isResolved: resolved }
				: c
		);
	}
}

function handleCommentUpdated( e ) {
	const { id, html } = e.detail || {};
	if ( ! id ) {
		return;
	}
	const nid = Number( id );
	allComments = allComments.map( ( c ) =>
		Number( c.id ) === nid ? { ...c, html } : c
	);
}

function handleCommentDeleted( e ) {
	const { id } = e.detail || {};
	if ( ! id ) {
		return;
	}
	const nid = Number( id );
	allComments = allComments.filter( ( c ) => Number( c.id ) !== nid );
}

/**
 * @param {Array} inlineComments
 * @param {Object} [options]
 * @param {'review'|'site-review'} [options.mode]
 *   `'review'` (default): per-post chrome — `preview-link-guard` is
 *   installed inside the iframe so reviewers can't navigate away from
 *   the previewed post.
 *   `'site-review'`: skip the link guard so the reviewer can browse the
 *   site inside the iframe via the theme's regular menus. The iframe
 *   keeps firing `flow:iframe-ready` on every navigation, so the manager
 *   re-binds each new page.
 */
export function initHighlights( inlineComments, options = {} ) {
	allComments = [ ...( inlineComments || [] ) ];
	highlightManagerMode =
		options.mode === 'site-review' ? 'site-review' : 'review';

	window.addEventListener( 'flow:highlight-add', handleAdd );
	window.addEventListener( 'flow:highlight-resolve', handleResolve );
	window.addEventListener( 'flow:highlight-remove', handleRemove );
	window.addEventListener( 'flow:scroll-to-highlight', handleScrollTo );
	window.addEventListener( 'flow:inline-thread-state', handleThreadState );
	window.addEventListener( 'flow:iframe-ready', handleIframeReady );
	window.addEventListener( 'flow:iframe-removed', handleIframeRemoved );
	window.addEventListener( 'flow:inline-comment-added', handleCommentAdded );
	window.addEventListener(
		'flow:inline-comment-resolved',
		handleCommentResolved
	);
	window.addEventListener(
		'flow:inline-comment-updated',
		handleCommentUpdated
	);
	window.addEventListener(
		'flow:inline-comment-deleted',
		handleCommentDeleted
	);
	window.addEventListener(
		'flow:inline-comments-reset',
		handleCommentsReset
	);
}

function handleCommentsReset( e ) {
	const next = e.detail?.comments;
	if ( ! Array.isArray( next ) ) {
		return;
	}
	allComments = [ ...next ];
	const doc = getIframeDoc();
	if ( ! doc ) {
		return;
	}
	const wrapRoot = resolveCommentContentRoot( doc ) || doc.body;
	if ( ! wrapRoot ) {
		return;
	}
	const liveIds = new Set( allComments.map( ( c ) => String( c.id ) ) );
	// collectAnchoredCommentIds understands both the text marks and the
	// space-separated media list, which a raw `data-comment-id` query misses.
	collectAnchoredCommentIds( wrapRoot, doc ).forEach( ( id ) => {
		if ( ! liveIds.has( id ) ) {
			removeHighlightForComment( id );
		}
	} );
	wrapCommentsInRoot( wrapRoot, allComments );
	repositionPins( doc );
	applyRevealed();

	// wrapCommentsInRoot skips ids that are already anchored, so a comment
	// someone else resolved would otherwise keep its unresolved styling.
	allComments.forEach( ( c ) => {
		if ( c.parentId ) {
			return;
		}
		queryHighlightedByCommentId( c.id ).forEach( ( mark ) =>
			mark.classList.toggle( RESOLVED_CLASS, !! c.isResolved )
		);
	} );
}
