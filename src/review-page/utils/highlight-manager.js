import {
	deserializeRange,
	wrapRange,
	clearHighlight,
	resolveMediaNode,
} from './text-anchor';
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
import { installPreviewLinkGuard } from './preview-link-guard';
const HIGHLIGHT_CLASS = 'flow-inline-highlight';
const MEDIA_HIGHLIGHT_CLASS = 'flow-inline-highlight-media';
const ACTIVE_CLASS = 'flow-inline-highlight--active';
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
		`.${ HIGHLIGHT_CLASS }, .${ MEDIA_HIGHLIGHT_CLASS }`
	);

	if ( ! mark ) {
		const overlay = closestFromEventTarget(
			e.target,
			'.flow-embed-overlay'
		);
		const sibling =
			overlay?.flowMedia ||
			overlay?.parentElement?.querySelector?.(
				'img, video, iframe'
			) ||
			null;
		if ( sibling?.classList?.contains( MEDIA_HIGHLIGHT_CLASS ) ) {
			mark = sibling;
		}
	}

	if ( ! mark ) {
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
			detail: { commentId },
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
	const selector = `.${ HIGHLIGHT_CLASS }, .${ MEDIA_HIGHLIGHT_CLASS }`;
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

function findMark( commentId ) {
	const selector = `.${ HIGHLIGHT_CLASS }[data-comment-id="${ commentId }"], .${ MEDIA_HIGHLIGHT_CLASS }`;
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

	const range = deserializeRange( rangeDescriptor );
	if ( range ) {
		wrapRange( range, commentId );
	}
}

function handleResolve( e ) {
	const { commentId } = e.detail || {};
	if ( ! commentId ) {
		return;
	}

	queryHighlightedByCommentId( commentId ).forEach( ( mark ) =>
		mark.classList.add( RESOLVED_CLASS )
	);
}

function handleRemove( e ) {
	const { commentId } = e.detail || {};
	if ( ! commentId ) {
		return;
	}

	clearHighlight( commentId );
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

function handleScrollTo( e ) {
	const { commentId } = e.detail || {};
	if ( ! commentId ) {
		return;
	}

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

function wrapCommentsInRoot( contentRoot, comments ) {
	if ( ! contentRoot ) {
		return;
	}
	const doc = contentRoot.ownerDocument || document;
	const roots = ( comments || [] ).filter(
		( c ) => ! c.parentId && c.blockClientId
	);

	for ( const c of roots ) {
		if (
			contentRoot.querySelector(
				`.${ HIGHLIGHT_CLASS }[data-comment-id="${ c.id }"]`
			) ||
			( doc.body &&
				doc.body.querySelector(
					`.${ HIGHLIGHT_CLASS }[data-comment-id="${ c.id }"]`
				) )
		) {
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
 * @returns {() => void} Cleanup function that detaches everything attached here.
 */
function attachManagerToDoc( doc, options = {} ) {
	if ( ! doc ) return () => {};
	const { skipLinkGuard = false, withNotice = true } = options;

	injectHighlightStyles( doc );

	let linkGuardCleanup = null;
	if ( ! skipLinkGuard ) {
		linkGuardCleanup = installPreviewLinkGuard( doc );
	} else if ( doc.documentElement ) {
		doc.documentElement.classList.add( 'flow-clickable-links' );
	}

	const wrapRoot = resolveCommentContentRoot( doc ) || doc.body;
	const clickRoot = doc.body || doc.documentElement;
	if ( ! wrapRoot || ! clickRoot ) {
		return () => {
			if ( linkGuardCleanup ) linkGuardCleanup();
		};
	}

	wrapCommentsInRoot( wrapRoot, allComments );

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
		}, 150 );
	};
	const mo = new MutationObserver( scheduleRewrap );
	mo.observe( wrapRoot, { childList: true, subtree: true } );

	clickRoot.addEventListener( 'click', onHighlightClick );

	return () => {
		clearTimeout( rewrapTimer );
		mo.disconnect();
		clickRoot.removeEventListener( 'click', onHighlightClick );
		if ( linkGuardCleanup ) linkGuardCleanup();
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
	if ( comment ) {
		allComments = [ ...allComments, comment ];
	}
}

function handleCommentResolved( e ) {
	const { commentId } = e.detail || {};
	if ( commentId ) {
		allComments = allComments.map( ( c ) =>
			Number( c.id ) === Number( commentId )
				? { ...c, isResolved: true }
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
 * @param {object} [options]
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
	highlightManagerMode = options.mode === 'site-review' ? 'site-review' : 'review';

	window.addEventListener( 'flow:highlight-add', handleAdd );
	window.addEventListener( 'flow:highlight-resolve', handleResolve );
	window.addEventListener( 'flow:highlight-remove', handleRemove );
	window.addEventListener( 'flow:scroll-to-highlight', handleScrollTo );
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
	window.addEventListener( 'flow:inline-comments-reset', handleCommentsReset );
}

function handleCommentsReset( e ) {
	const next = e.detail?.comments;
	if ( ! Array.isArray( next ) ) return;
	allComments = [ ...next ];
	const doc = getIframeDoc();
	if ( ! doc ) return;
	const wrapRoot = resolveCommentContentRoot( doc ) || doc.body;
	if ( ! wrapRoot ) return;
	const existing = wrapRoot.querySelectorAll(
		`.${ HIGHLIGHT_CLASS }[data-comment-id], .${ MEDIA_HIGHLIGHT_CLASS }[data-comment-id]`
	);
	const liveIds = new Set( allComments.map( ( c ) => Number( c.id ) ) );
	existing.forEach( ( el ) => {
		const id = Number( el.getAttribute( 'data-comment-id' ) );
		if ( ! liveIds.has( id ) ) {
			clearHighlight( el );
		}
	} );
	wrapCommentsInRoot( wrapRoot, allComments );
}
