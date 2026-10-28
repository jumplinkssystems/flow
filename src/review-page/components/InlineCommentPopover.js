import {
	useState,
	useEffect,
	useLayoutEffect,
	useCallback,
	useRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';
import commentReplyIcon from '../icons/comment-reply';
import {
	serializeRange,
	serializeMediaAnchor,
	serializePinAnchor,
	contentRanges,
	mediaForOverlaySelection,
} from '../utils/text-anchor';
import {
	createPinElement,
	placePinAtClientPoint,
	removePin,
} from '../utils/pin-marker';
import {
	getIframe,
	getIframeScale,
	resolveContentRootFor,
} from '../utils/iframe-bridge';
import {
	closestFromEventTarget,
	eventHitsShadowNode,
	eventInsidePortalUI,
} from '../utils/dom-helpers';
import { defaultCommentApi } from '../utils/comment-api';
import {
	revealOverlayOnFirstTap,
	hideTouchOverlays,
} from '../utils/init-embed-overlays';
import { isReviewReadOnly } from '../utils/api';
import {
	COMMENTS_HIDDEN_CLASS,
	RESOLVED_HIDDEN_CLASS,
} from '../utils/comment-visibility';
import CommentEditor from './CommentEditor';

// Matches $bar-height: the popover never slides under the review bar.
const BAR_HEIGHT = 64;

function mediaTypeLabel( tagName ) {
	if ( tagName === 'VIDEO' ) {
		return __( 'Video', 'jumplinks-editorial-workflow' );
	}
	if ( tagName === 'IFRAME' ) {
		return __( 'Embed', 'jumplinks-editorial-workflow' );
	}
	return __( 'Image', 'jumplinks-editorial-workflow' );
}

// A click on any of these does its own thing; it never drops a pin.
// Section backgrounds (`data-flow-background-media`) are pinned on, not commented as media.
const MEDIA =
	'img:not([data-flow-background-media]), video:not([data-flow-background-media])';
const PIN_EXCLUDED = `.flow-inline-highlight, .flow-inline-highlight-media, .flow-embed-overlay, .flow-embed-wrap, .flow-inline-pin, .flow-review-info-notice, ${ MEDIA }, iframe, input, textarea, select, [contenteditable]`;
// In a site review the reviewer browses the site, so its controls stay live.
const PIN_EXCLUDED_BROWSING =
	'a[href], button, [role="button"], summary, label';

const LINK_HOVER_DELAY_MS = 200;
const LINK_HOVER_LEAVE_MS = 500;
const LINK_HOVER_CLASS = 'flow-link-hover-selection';
const MEDIA_COMMENT_CLASS = 'is-comment-open';

// The overlay is a sibling of its media (or shares a wrap with it) and
// points back via flowMedia.
function overlayForMedia( media ) {
	const parent = media?.parentElement;
	if ( ! parent ) {
		return null;
	}
	for ( const el of parent.children ) {
		if (
			el.classList?.contains( 'flow-embed-overlay' ) &&
			el.flowMedia === media
		) {
			return el;
		}
	}
	return null;
}
const DRAFT_HIGHLIGHT_NAME = 'flow-comment-draft';

// Native ::selection disappears once the comment field takes focus. The
// Highlight registry paints the same blue without holding the selection,
// so the field can focus and the text still looks hovered.
function paintDraftHighlight( ranges ) {
	const list = ( Array.isArray( ranges ) ? ranges : [ ranges ] ).filter(
		Boolean
	);
	const view = list[ 0 ]?.startContainer?.ownerDocument?.defaultView || null;
	if (
		! list.length ||
		! view ||
		typeof view.Highlight !== 'function' ||
		! view.CSS?.highlights
	) {
		return false;
	}
	try {
		view.CSS.highlights.set(
			DRAFT_HIGHLIGHT_NAME,
			new view.Highlight( ...list )
		);
		return true;
	} catch {
		return false;
	}
}

function clearDraftHighlight( doc ) {
	try {
		doc?.defaultView?.CSS?.highlights?.delete( DRAFT_HIGHLIGHT_NAME );
	} catch {
		// The document is already gone.
	}
}
const COMMENTABLE_CONTROL =
	'a[href], button, [role="button"], [role="tab"], summary';
const LIVE_TOGGLE =
	'[data-toggle], [data-bs-toggle], [aria-controls], [aria-expanded], [role="button"], [role="tab"]';

// A pause offers a comment on the label. Buttons, tabs and accordions are
// included; a tap or click still activates them. Script links and controls
// with no text stay out — an image already has its own comment gesture.
function commentableControl( node ) {
	const control = node?.closest?.( COMMENTABLE_CONTROL );
	if ( ! control ) {
		return null;
	}
	if (
		control.closest(
			'.flow-inline-highlight, .flow-inline-highlight-media, .flow-review-info-notice, .flow-inline-pin, .flow-embed-overlay'
		) ||
		control.querySelector(
			'.flow-inline-highlight, .flow-inline-highlight-media'
		)
	) {
		return null;
	}
	if ( control.matches( 'a[href]' ) ) {
		const href = ( control.getAttribute( 'href' ) || '' ).trim();
		if ( href.toLowerCase().startsWith( 'javascript:' ) ) {
			return null;
		}
	}
	if ( ! ( control.innerText || '' ).trim() ) {
		return null;
	}
	const doc = control.ownerDocument;
	if ( ! doc || ! resolveContentRootFor( doc, control ) ) {
		return null;
	}
	return control;
}

const COMMENT_MARK = '.flow-inline-highlight, .flow-inline-highlight-media';

function commentIdFromMark( mark ) {
	const direct = Number( mark.dataset.commentId );
	if ( direct ) {
		return direct;
	}
	const ids = ( mark.dataset.commentIds || '' )
		.split( ' ' )
		.map( Number )
		.filter( Boolean );
	return ids[ ids.length - 1 ] || 0;
}

// Hidden and resolved-hidden marks stay quiet, same as a click on them.
function isDormantMark( mark ) {
	const root = mark.ownerDocument?.documentElement;
	if ( ! root ) {
		return true;
	}
	const revealed = mark.classList.contains(
		'flow-inline-highlight--revealed'
	);
	if ( root.classList.contains( COMMENTS_HIDDEN_CLASS ) && ! revealed ) {
		return true;
	}
	return (
		root.classList.contains( RESOLVED_HIDDEN_CLASS ) &&
		mark.classList.contains( 'flow-inline-highlight--resolved' ) &&
		! revealed
	);
}

// A link (or button, or tab) that already carries a comment. Hovering it
// opens that thread instead of offering a new one.
function commentOnControl( node ) {
	const control = node?.closest?.( COMMENTABLE_CONTROL );
	if ( ! control ) {
		return null;
	}
	let mark = node.closest?.( COMMENT_MARK ) || null;
	if ( mark && ! control.contains( mark ) && ! mark.contains( control ) ) {
		mark = null;
	}
	if ( ! mark ) {
		mark = control.querySelector( COMMENT_MARK );
	}
	if ( ! mark || isDormantMark( mark ) ) {
		return null;
	}
	const commentId = commentIdFromMark( mark );
	if ( ! commentId ) {
		return null;
	}
	return { control, mark, commentId };
}

// Tabs, accordions and buttons keep their own click. The comment offer is
// hover-only, so a tap still switches the tab.
function controlKeepsActivation( control ) {
	if ( ! control.matches( 'a[href]' ) ) {
		return true;
	}
	const href = ( control.getAttribute( 'href' ) || '' ).trim();
	if ( href === '' || href === '#' ) {
		return true;
	}
	return (
		control.matches( LIVE_TOGGLE ) ||
		!! control.closest( '[role="tab"], [role="tablist"]' )
	);
}

// A product card link, or a tab with an icon, wraps a photo and a label.
// The comment is about the words, so the selection stops at the text.
function linkTextRange( anchor ) {
	const doc = anchor.ownerDocument;
	const media = 'img, picture, video, svg, canvas, iframe';
	// The comment overlay on that photo carries its own hint text.
	const skipped = `${ media }, .flow-embed-overlay`;
	const texts = [];
	const walker = doc.createTreeWalker( anchor, NodeFilter.SHOW_TEXT );
	let node = walker.nextNode();
	while ( node ) {
		if ( node.data.trim() && ! node.parentElement?.closest( skipped ) ) {
			texts.push( node );
		}
		node = walker.nextNode();
	}
	if ( ! texts.length ) {
		return null;
	}
	const range = doc.createRange();
	const last = texts[ texts.length - 1 ];
	range.setStart( texts[ 0 ], 0 );
	range.setEnd( last, last.data.length );
	const picture = anchor.querySelector( media );
	if ( picture && range.intersectsNode( picture ) ) {
		const best = texts.reduce( ( longer, item ) =>
			item.data.trim().length > longer.data.trim().length ? item : longer
		);
		range.setStart( best, 0 );
		range.setEnd( best, best.data.length );
	}
	return range;
}

// Text under the pointer (where the cursor is the I-beam) belongs to
// highlighting; pins are for the spots around it.
function isOverSelectableText( doc, x, y ) {
	let node = null;
	let offset = 0;
	if ( typeof doc.caretPositionFromPoint === 'function' ) {
		const pos = doc.caretPositionFromPoint( x, y );
		node = pos?.offsetNode;
		offset = pos?.offset || 0;
	} else if ( typeof doc.caretRangeFromPoint === 'function' ) {
		const range = doc.caretRangeFromPoint( x, y );
		node = range?.startContainer;
		offset = range?.startOffset || 0;
	}
	if ( ! node || node.nodeType !== 3 || ! node.data.trim() ) {
		return false;
	}
	const view = doc.defaultView;
	if (
		node.parentElement &&
		view?.getComputedStyle( node.parentElement ).userSelect === 'none'
	) {
		return false;
	}
	const range = doc.createRange();
	for ( const i of [ offset - 1, offset ] ) {
		if ( i < 0 || i >= node.length ) {
			continue;
		}
		range.setStart( node, i );
		range.setEnd( node, i + 1 );
		for ( const rect of range.getClientRects() ) {
			if (
				x >= rect.left - 1 &&
				x <= rect.right + 1 &&
				y >= rect.top - 1 &&
				y <= rect.bottom + 1
			) {
				return true;
			}
		}
	}
	return false;
}

// A press and release on the same spot, left button, no modifier keys: a click,
// not the start of a text selection.
function isPlainClick( press, e ) {
	const view = e?.view;
	if ( ! press || ! view || press.view !== view || press.suppressPin ) {
		return false;
	}
	if ( ! ( e instanceof view.MouseEvent ) || e.button !== 0 ) {
		return false;
	}
	if ( e.ctrlKey || e.metaKey || e.shiftKey || e.altKey ) {
		return false;
	}
	return (
		Math.abs( e.clientX - press.x ) <= 4 &&
		Math.abs( e.clientY - press.y ) <= 4
	);
}

function rangeTouchesReviewInfoNotice( range, doc ) {
	const notice = doc.querySelector( '.flow-review-info-notice' );
	if ( ! notice ) {
		return false;
	}
	return (
		notice.contains( range.startContainer ) ||
		notice.contains( range.endContainer )
	);
}

/**
 * @param {Object} [props]
 * @param {{ postComment: Function, updateComment: Function }} [props.api]
 *   Backend adapter. Defaults to the single-post review namespace
 *   (`flow/v1/reviews/{id}/comments`). The site-review chrome (Pro) passes
 *   its own adapter that targets `flow-pro/v1/site-reviews/{id}/comments`.
 */
export default function InlineCommentPopover( {
	api = defaultCommentApi,
} = {} ) {
	const [ position, setPosition ] = useState( null );
	const [ editorOpen, setEditorOpen ] = useState( false );
	// The poller holds off while a draft is open: re-wrapping the content now
	// could make this draft's saved range resolve somewhere else.
	useEffect( () => {
		window.dispatchEvent(
			new CustomEvent( 'flow:inline-draft-state', {
				detail: { open: editorOpen },
			} )
		);
	}, [ editorOpen ] );
	const editorOpenRef = useRef( false );
	const rangeRef = useRef( null );
	const descriptorRef = useRef( null );
	const popoverRef = useRef( null );
	const [ shiftY, setShiftY ] = useState( 0 );
	// Phones: no room beside the selection, so sit under it (or above).
	const [ mobilePos, setMobilePos ] = useState( null );
	const [ popoverHeight, setPopoverHeight ] = useState( 0 );
	// Nudges the CSS caret off the button's own centre toward the real
	// anchor point once viewport clamping has moved the button away from
	// it — same idea as the thread popover's caret, applied to this one's
	// CSS-pseudo-element triangle via a custom property instead of a
	// dedicated DOM node. X for the below/above (mobile) layout, where the
	// button sits centred under/over the anchor; Y for the beside (desktop)
	// layout, where it sits level with the anchor's vertical centre.
	const [ caretOffsetX, setCaretOffsetX ] = useState( 0 );
	const [ caretOffsetY, setCaretOffsetY ] = useState( 0 );
	const iframeLocalRef = useRef( null );
	const pressRef = useRef( null );
	const pinOfferRef = useRef( null );
	const threadOpenRef = useRef( false );

	const draftHighlightDocRef = useRef( null );
	const mediaOverlayRef = useRef( null );
	const linkHoverRef = useRef( {
		timer: 0,
		leaveTimer: 0,
		token: 0,
		anchor: null,
		marked: null,
		openedThreadId: 0,
		threadPointer: false,
	} );
	const popoverPointerRef = useRef( false );
	const scheduleLinkLeaveRef = useRef( () => {} );
	const positionNearRectRef = useRef( null );
	const clearPinOfferRef = useRef( null );

	const clearPinOffer = useCallback( () => {
		removePin( pinOfferRef.current );
		pinOfferRef.current = null;
	}, [] );
	clearPinOfferRef.current = clearPinOffer;

	// Keeps the blue wash on a photo while its comment form is open.
	const holdMediaComment = useCallback( ( media ) => {
		const held = overlayForMedia( media );
		if ( mediaOverlayRef.current && mediaOverlayRef.current !== held ) {
			mediaOverlayRef.current.classList.remove( MEDIA_COMMENT_CLASS );
		}
		held?.classList.add( MEDIA_COMMENT_CLASS );
		mediaOverlayRef.current = held || null;
	}, [] );

	// Drops the stand-in hover paint and the link hover class. Used when the
	// comment form closes; while it is open the text stays highlighted.
	const releaseDraftHover = useCallback( () => {
		clearDraftHighlight( draftHighlightDocRef.current );
		draftHighlightDocRef.current = null;
		mediaOverlayRef.current?.classList.remove( MEDIA_COMMENT_CLASS );
		mediaOverlayRef.current = null;
		const marked = linkHoverRef.current.marked;
		if ( ! marked ) {
			return;
		}
		marked.classList.remove( LINK_HOVER_CLASS );
		linkHoverRef.current.marked = null;
		const selection = marked.ownerDocument.defaultView?.getSelection();
		if ( ! selection?.rangeCount ) {
			return;
		}
		const node = selection.getRangeAt( 0 ).commonAncestorContainer;
		if ( marked === node || marked.contains( node ) ) {
			selection.removeAllRanges();
		}
	}, [] );

	// A click that only closes an open thread must not also offer a pin.
	useEffect( () => {
		const onThreadState = ( e ) => {
			threadOpenRef.current = !! e.detail?.open;
		};
		window.addEventListener( 'flow:inline-thread-state', onThreadState );
		return () =>
			window.removeEventListener(
				'flow:inline-thread-state',
				onThreadState
			);
	}, [] );

	const getViewportBounds = useCallback( () => {
		const PAD = 12;
		let minLeft = PAD;
		let maxRight = window.innerWidth - PAD;

		if (
			document.body.classList.contains(
				'flow-review-page--activity-open'
			)
		) {
			const activityHost = document.getElementById(
				'flow-pro-activity-host'
			);
			const activityRight =
				activityHost?.getBoundingClientRect?.().right || 0;
			if ( activityRight > 0 ) {
				minLeft = Math.max( minLeft, activityRight + PAD );
			}
		}

		// Comments sidebar lives on the RIGHT — its left edge bounds the
		// popover from drifting underneath the sidebar.
		const isCommentsClosed = document.body.classList.contains(
			'flow-review-page--comments-closed'
		);
		if ( ! isCommentsClosed ) {
			const sidebarHost = document.getElementById( 'flow-sidebar-host' );
			const sidebarLeft = sidebarHost?.getBoundingClientRect?.().left;
			if ( typeof sidebarLeft === 'number' && sidebarLeft > 0 ) {
				maxRight = Math.min( maxRight, sidebarLeft - PAD );
			}
		}

		return { minLeft, maxRight };
	}, [] );

	const clampLeftToViewport = useCallback(
		( left, fallbackWidth ) => {
			const width = popoverRef.current?.offsetWidth || fallbackWidth;
			const { minLeft, maxRight } = getViewportBounds();
			const maxLeft = Math.max( minLeft, maxRight - width );
			return Math.max( minLeft, Math.min( left, maxLeft ) );
		},
		[ getViewportBounds ]
	);

	const clampTopToViewport = useCallback( ( top, fallbackHeight ) => {
		const height = popoverRef.current?.offsetHeight || fallbackHeight;
		const PAD = 8;
		const half = height / 2;
		const minTop = PAD + half;
		const maxTop = window.innerHeight - PAD - half;
		if ( maxTop < minTop ) {
			return Math.max( PAD + half, window.innerHeight / 2 );
		}
		return Math.max( minTop, Math.min( top, maxTop ) );
	}, [] );

	// Right of the anchor, or flipped to its left when the right side has no
	// room (a button in the far right corner); clamped only if neither fits.
	const placeBeside = useCallback(
		( anchorLeft, anchorRight, fallbackWidth ) => {
			const GAP = 12;
			const width = popoverRef.current?.offsetWidth || fallbackWidth;
			const { minLeft, maxRight } = getViewportBounds();
			const right = anchorRight + GAP;
			if ( right + width <= maxRight ) {
				return { left: right, flipped: false };
			}
			const left = anchorLeft - GAP - width;
			if ( left >= minLeft ) {
				return { left, flipped: true };
			}
			return {
				left: clampLeftToViewport( right, fallbackWidth ),
				flipped: false,
			};
		},
		[ getViewportBounds, clampLeftToViewport ]
	);

	const positionNearRect = useCallback(
		( rect, sourceWindow, openEditor = false ) => {
			const iframe = iframeLocalRef.current;
			const isInIframe = sourceWindow !== window && iframe;

			const reserveRight = openEditor ? 400 : 220;
			const reserveHeight = openEditor ? 320 : 60;

			let centerY;
			let anchorLeft;
			let anchorRight;
			let anchorTop;
			let anchorBottom;
			if ( isInIframe ) {
				const iframeRect = iframe.getBoundingClientRect();
				// rect lives in iframe-internal coords; the iframe is visually
				// transform-scaled so multiply before adding the parent offset.
				const s = getIframeScale();
				centerY =
					iframeRect.top + rect.top * s + ( rect.height * s ) / 2;
				anchorLeft = iframeRect.left + rect.left * s;
				anchorRight = iframeRect.left + rect.right * s;
				anchorTop = iframeRect.top + rect.top * s;
				anchorBottom = iframeRect.top + rect.bottom * s;
			} else {
				centerY = rect.top + rect.height / 2;
				anchorLeft = rect.left;
				anchorRight = rect.right;
				anchorTop = rect.top;
				anchorBottom = rect.bottom;
			}

			const { left, flipped } = placeBeside(
				anchorLeft,
				anchorRight,
				reserveRight
			);
			centerY = clampTopToViewport( centerY, reserveHeight );

			setPosition( {
				top: centerY,
				left,
				flipped,
				anchorLeft,
				anchorRight,
				anchorTop,
				anchorBottom,
			} );
			if ( openEditor ) {
				setEditorOpen( true );
				editorOpenRef.current = true;
			}
		},
		[ placeBeside, clampTopToViewport ]
	);
	positionNearRectRef.current = positionNearRect;

	const offerPinAt = useCallback(
		( e, sourceWindow ) => {
			if ( sourceWindow === window || isReviewReadOnly() ) {
				return;
			}
			const doc = sourceWindow.document;
			if ( closestFromEventTarget( e.target, PIN_EXCLUDED ) ) {
				return;
			}
			const browsing = doc.documentElement?.classList.contains(
				'flow-clickable-links'
			);
			if (
				browsing &&
				closestFromEventTarget( e.target, PIN_EXCLUDED_BROWSING )
			) {
				return;
			}
			if ( isOverSelectableText( doc, e.clientX, e.clientY ) ) {
				return;
			}
			const descriptor = serializePinAnchor( e.target, {
				clientX: e.clientX,
				clientY: e.clientY,
			} );
			if ( ! descriptor ) {
				return;
			}
			clearPinOffer();
			const offer = createPinElement( doc, {
				offer: true,
				label: descriptor.text,
			} );
			placePinAtClientPoint( offer, e.clientX, e.clientY );
			pinOfferRef.current = offer;
			rangeRef.current = null;
			descriptorRef.current = descriptor;
			positionNearRect( offer.getBoundingClientRect(), sourceWindow );
		},
		[ positionNearRect, clearPinOffer ]
	);

	const handleMouseUp = useCallback(
		( e ) => {
			if ( editorOpenRef.current || isReviewReadOnly() ) {
				return;
			}

			if ( eventHitsShadowNode( e, popoverRef.current ) ) {
				return;
			}

			const sourceWindow = e?.view || window;
			const mediaTarget = e?.target?.closest?.(
				`${ MEDIA }, .flow-embed-overlay`
			);
			if (
				mediaTarget &&
				resolveContentRootFor( sourceWindow.document, mediaTarget )
			) {
				return;
			}

			const press = pressRef.current;
			pressRef.current = null;

			requestAnimationFrame( () => {
				if ( editorOpenRef.current ) {
					return;
				}

				// Decided here, once the selection has settled: a drag that
				// selected text is a highlight wherever it started.
				const selection = sourceWindow.getSelection();
				if (
					! selection ||
					selection.isCollapsed ||
					! selection.toString().trim()
				) {
					setPosition( null );
					rangeRef.current = null;
					descriptorRef.current = null;
					if ( isPlainClick( press, e ) ) {
						offerPinAt( e, sourceWindow );
					}
					return;
				}

				const range = selection.getRangeAt( 0 );
				const contentRoot = resolveContentRootFor(
					sourceWindow.document,
					range.startContainer
				);
				if ( ! contentRoot ) {
					setPosition( null );
					rangeRef.current = null;
					descriptorRef.current = null;
					return;
				}

				if (
					rangeTouchesReviewInfoNotice( range, sourceWindow.document )
				) {
					setPosition( null );
					rangeRef.current = null;
					descriptorRef.current = null;
					sourceWindow.getSelection()?.removeAllRanges();
					return;
				}

				const rect = range.getBoundingClientRect();
				clearPinOffer();
				rangeRef.current = range.cloneRange();
				descriptorRef.current = null;
				positionNearRect( rect, sourceWindow );
			} );
		},
		[ positionNearRect, offerPinAt, clearPinOffer ]
	);

	const handleMediaClick = useCallback(
		( e ) => {
			if ( editorOpenRef.current || isReviewReadOnly() ) {
				return;
			}

			const tapped = e.target.closest?.( '.flow-embed-overlay' );
			if ( revealOverlayOnFirstTap( tapped, e ) ) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}
			if ( tapped ) {
				hideTouchOverlays( tapped.ownerDocument );
			}

			// Play / Go-to-link pills own their clicks; don't steal them here.
			if (
				e.target.closest?.(
					'.flow-embed-overlay__play-pill, .flow-embed-overlay__link-pill'
				)
			) {
				return;
			}

			const sourceWindow = e?.view || window;
			if ( e.target.closest?.( '.flow-review-info-notice' ) ) {
				return;
			}

			const overlay = e.target.closest?.( '.flow-embed-overlay' );
			const media = overlay
				? overlay.flowMedia ||
				  overlay.parentElement?.querySelector(
						'img, video, iframe'
				  ) ||
				  null
				: e.target.closest?.( MEDIA );

			if ( ! media ) {
				return;
			}

			// Resolve against the media node so a `.entry-content` (e.g. one of
			// WooCommerce's tab panels) other than the "longest" is still accepted.
			const contentRoot = resolveContentRootFor(
				sourceWindow.document,
				media
			);
			if ( ! contentRoot ) {
				return;
			}

			// Existing media highlights open the thread; still swallow the event so
			// theme lightbox / custom `[data-*-video="open"]` handlers don't fire.
			if (
				media.classList?.contains( 'flow-inline-highlight-media' ) ||
				media.closest?.( '.flow-inline-highlight' )
			) {
				e.preventDefault?.();
				e.stopPropagation?.();
				const ids = ( media.dataset.commentIds || '' )
					.split( ' ' )
					.map( Number )
					.filter( Boolean );
				const commentId =
					Number( media.dataset.commentId ) ||
					ids[ ids.length - 1 ] ||
					0;
				if ( commentId ) {
					window.dispatchEvent(
						new CustomEvent( 'flow:inline-comment-focus', {
							detail: { commentId },
						} )
					);
				}
				return;
			}

			// Capture-phase + stopPropagation: theme scripts often register a
			// document bubble listener (e.g. Jumplinks demo video modal via
			// `[data-jumplinks-video="open"]`) that would otherwise open a popin
			// before our bubble handler can claim the click.
			e.preventDefault?.();
			e.stopPropagation?.();

			const range = sourceWindow.document.createRange();
			range.selectNode( media );
			rangeRef.current = range;

			const tag = media.tagName;
			const label =
				media.getAttribute( 'alt' )?.trim() ||
				media.getAttribute( 'title' )?.trim() ||
				mediaTypeLabel( tag );
			descriptorRef.current = serializeMediaAnchor( media, label );

			// Media (img/video/iframe) are clicked through their `.flow-embed-overlay`
			const rect = media.getBoundingClientRect();
			// Keep the hover wash on this media until the form closes. The
			// "Click to comment" chip stays hidden; only the blue overlay holds.
			const held = overlay?.classList?.contains( 'flow-embed-overlay' )
				? overlay
				: overlayForMedia( media );
			if ( mediaOverlayRef.current && mediaOverlayRef.current !== held ) {
				mediaOverlayRef.current.classList.remove( MEDIA_COMMENT_CLASS );
			}
			held?.classList.add( MEDIA_COMMENT_CLASS );
			mediaOverlayRef.current = held || null;
			positionNearRect( rect, sourceWindow, true );
		},
		[ positionNearRect ]
	);

	const handleMouseDown = useCallback(
		( e ) => {
			if ( eventHitsShadowNode( e, popoverRef.current ) ) {
				return;
			}
			if ( eventInsidePortalUI( e ) ) {
				return;
			}
			pressRef.current = {
				x: e.clientX,
				y: e.clientY,
				view: e.view,
				suppressPin: editorOpenRef.current || threadOpenRef.current,
			};
			clearPinOffer();
			if ( editorOpenRef.current ) {
				setPosition( null );
				setEditorOpen( false );
				editorOpenRef.current = false;
				rangeRef.current = null;
				descriptorRef.current = null;
				releaseDraftHover();
				return;
			}
			setPosition( null );
			rangeRef.current = null;
			descriptorRef.current = null;
		},
		[ clearPinOffer, releaseDraftHover ]
	);

	// Show the popover from whatever selection is currently committed to JS.
	const showPopoverFromCurrentSelection = useCallback(
		( sourceWindow ) => {
			if ( editorOpenRef.current || isReviewReadOnly() ) {
				return;
			}
			const selection = sourceWindow.getSelection();
			if (
				! selection ||
				selection.isCollapsed ||
				! selection.toString().trim()
			) {
				return;
			}
			const range = selection.getRangeAt( 0 );
			const contentRoot = resolveContentRootFor(
				sourceWindow.document,
				range.startContainer
			);
			if ( ! contentRoot ) {
				return;
			}
			if (
				rangeTouchesReviewInfoNotice( range, sourceWindow.document )
			) {
				sourceWindow.getSelection()?.removeAllRanges();
				return;
			}
			const rect = range.getBoundingClientRect();
			clearPinOffer();
			rangeRef.current = range.cloneRange();
			descriptorRef.current = null;
			positionNearRect( rect, sourceWindow );
		},
		[ positionNearRect, clearPinOffer ]
	);

	useEffect( () => {
		document.addEventListener( 'mouseup', handleMouseUp );
		document.addEventListener( 'mousedown', handleMouseDown );
		// Capture so we beat theme document bubble listeners (video lightboxes).
		document.addEventListener( 'click', handleMediaClick, true );
		document.addEventListener( 'touchend', handleMouseUp );
		return () => {
			document.removeEventListener( 'mouseup', handleMouseUp );
			document.removeEventListener( 'mousedown', handleMouseDown );
			document.removeEventListener( 'click', handleMediaClick, true );
			document.removeEventListener( 'touchend', handleMouseUp );
		};
	}, [ handleMouseUp, handleMouseDown, handleMediaClick ] );

	// Debounced `selectionchange` is the primary signal on touch devices.
	useEffect( () => {
		let timer = null;
		const SETTLE_MS = 200;
		const settle = ( sourceWindow ) => {
			if ( editorOpenRef.current ) {
				return;
			}
			clearTimeout( timer );
			timer = setTimeout( () => {
				showPopoverFromCurrentSelection( sourceWindow );
			}, SETTLE_MS );
		};

		const onParentSelChange = () => settle( window );
		document.addEventListener( 'selectionchange', onParentSelChange );

		let attachedDoc = null;
		let onIframeSelChange = null;
		const attachIframe = ( iframe ) => {
			if ( ! iframe ) {
				return;
			}
			let doc = null;
			try {
				doc =
					iframe.contentDocument ||
					iframe.contentWindow?.document ||
					null;
			} catch {
				return;
			}
			if ( ! doc ) {
				return;
			}
			if ( attachedDoc && onIframeSelChange ) {
				try {
					attachedDoc.removeEventListener(
						'selectionchange',
						onIframeSelChange
					);
				} catch {}
			}
			const sw = iframe.contentWindow;
			onIframeSelChange = () => settle( sw );
			doc.addEventListener( 'selectionchange', onIframeSelChange );
			attachedDoc = doc;
		};
		const detachIframe = () => {
			if ( attachedDoc && onIframeSelChange ) {
				try {
					attachedDoc.removeEventListener(
						'selectionchange',
						onIframeSelChange
					);
				} catch {
					// already detached
				}
			}
			attachedDoc = null;
			onIframeSelChange = null;
		};

		const onIframeReady = ( e ) => attachIframe( e.detail?.iframe );
		const onIframeRemoved = () => detachIframe();

		attachIframe( getIframe() );
		window.addEventListener( 'flow:iframe-ready', onIframeReady );
		window.addEventListener( 'flow:iframe-removed', onIframeRemoved );

		return () => {
			clearTimeout( timer );
			document.removeEventListener(
				'selectionchange',
				onParentSelChange
			);
			window.removeEventListener( 'flow:iframe-ready', onIframeReady );
			window.removeEventListener(
				'flow:iframe-removed',
				onIframeRemoved
			);
			detachIframe();
		};
	}, [ showPopoverFromCurrentSelection ] );

	// Commenting on a link must not need a drag that can also activate it.
	// A pause offers Add Comment. A site review follows the link, so the pause
	// also opens a thread that is already there. The page review blocks
	// navigation, so that thread opens on click instead.
	useEffect( () => {
		const hover = linkHoverRef.current;
		let attachedDoc = null;
		const isBrowsing = () =>
			!! attachedDoc?.documentElement.classList.contains(
				'flow-clickable-links'
			);

		const releaseMark = () => {
			const marked = hover.marked;
			if ( ! marked ) {
				return;
			}
			marked.classList.remove( LINK_HOVER_CLASS );
			hover.marked = null;
			const selection = marked.ownerDocument.defaultView?.getSelection();
			if ( ! selection || ! selection.rangeCount ) {
				return;
			}
			const node = selection.getRangeAt( 0 ).commonAncestorContainer;
			if ( marked === node || marked.contains( node ) ) {
				selection.removeAllRanges();
			}
		};

		const dismissHoverThread = () => {
			const id = hover.openedThreadId;
			if ( ! id ) {
				return;
			}
			hover.openedThreadId = 0;
			window.dispatchEvent(
				new CustomEvent( 'flow:inline-thread-hover-dismiss', {
					detail: { commentId: id },
				} )
			);
		};

		const dismissOffer = () => {
			if (
				editorOpenRef.current ||
				popoverPointerRef.current ||
				hover.threadPointer
			) {
				return;
			}
			releaseMark();
			setPosition( null );
			rangeRef.current = null;
			descriptorRef.current = null;
			dismissHoverThread();
		};

		const scheduleLeave = () => {
			clearTimeout( hover.leaveTimer );
			hover.leaveTimer = window.setTimeout(
				dismissOffer,
				LINK_HOVER_LEAVE_MS
			);
		};
		scheduleLinkLeaveRef.current = scheduleLeave;

		const selectLink = ( anchor ) => {
			const doc = anchor.ownerDocument;
			const view = doc.defaultView;
			if ( ! view || ! positionNearRectRef.current ) {
				return;
			}
			const range = linkTextRange( anchor );
			if ( ! range ) {
				return;
			}
			const rect = range.getBoundingClientRect();
			if ( ! rect.width && ! rect.height ) {
				return;
			}
			clearPinOfferRef.current?.();
			dismissHoverThread();
			if ( hover.marked && hover.marked !== anchor ) {
				hover.marked.classList.remove( LINK_HOVER_CLASS );
			}
			anchor.classList.add( LINK_HOVER_CLASS );
			hover.marked = anchor;
			const selection = view.getSelection();
			selection?.removeAllRanges();
			selection?.addRange( range );
			rangeRef.current = range.cloneRange();
			descriptorRef.current = null;
			positionNearRectRef.current( rect, view );
		};

		const openCommentedThread = ( found ) => {
			clearPinOfferRef.current?.();
			releaseMark();
			setPosition( null );
			rangeRef.current = null;
			descriptorRef.current = null;
			hover.openedThreadId = found.commentId;
			window.dispatchEvent(
				new CustomEvent( 'flow:inline-comment-focus', {
					detail: {
						commentId: found.commentId,
						isResolved: found.mark.classList.contains(
							'flow-inline-highlight--resolved'
						),
					},
				} )
			);
		};

		const onOver = ( e ) => {
			if ( e.buttons || editorOpenRef.current ) {
				return;
			}
			// The thread popover lives in the parent document. A move
			// inside the preview means the pointer has left that popover.
			hover.threadPointer = false;
			const commented = commentOnControl( e.target );
			if ( commented && isBrowsing() ) {
				if ( hover.openedThreadId === commented.commentId ) {
					clearTimeout( hover.leaveTimer );
					hover.anchor = commented.control;
					return;
				}
				clearTimeout( hover.leaveTimer );
				clearTimeout( hover.timer );
				hover.anchor = commented.control;
				const token = ++hover.token;
				hover.timer = window.setTimeout( () => {
					if ( hover.token !== token || editorOpenRef.current ) {
						return;
					}
					openCommentedThread( commented );
				}, LINK_HOVER_DELAY_MS );
				return;
			}
			if ( hover.openedThreadId ) {
				scheduleLeave();
			}
			if ( isReviewReadOnly() ) {
				return;
			}
			const anchor = commentableControl( e.target );
			if ( ! anchor ) {
				return;
			}
			if ( hover.anchor === anchor ) {
				clearTimeout( hover.leaveTimer );
				return;
			}
			clearTimeout( hover.leaveTimer );
			clearTimeout( hover.timer );
			hover.anchor = anchor;
			const token = ++hover.token;
			hover.timer = window.setTimeout( () => {
				if (
					hover.token !== token ||
					editorOpenRef.current ||
					isReviewReadOnly()
				) {
					return;
				}
				selectLink( anchor );
			}, LINK_HOVER_DELAY_MS );
		};

		const onOut = ( e ) => {
			const anchor = e.target?.closest?.( COMMENTABLE_CONTROL );
			if ( ! anchor || anchor !== hover.anchor ) {
				return;
			}
			if ( e.relatedTarget && anchor.contains( e.relatedTarget ) ) {
				return;
			}
			clearTimeout( hover.timer );
			hover.anchor = null;
			hover.token += 1;
			scheduleLeave();
		};

		const onDown = ( e ) => {
			// A touch tap is handled on touchend. The synthetic mousedown
			// that follows it must not wipe the offer it just opened.
			if ( e.sourceCapabilities?.firesTouchEvents ) {
				return;
			}
			clearTimeout( hover.timer );
			hover.anchor = null;
			hover.token += 1;
			releaseMark();
			// A click keeps an open thread. Only a hover, with no press,
			// closes again once the pointer leaves.
			hover.openedThreadId = 0;
		};

		const onClick = ( e ) => {
			if (
				e.button !== 0 ||
				e.ctrlKey ||
				e.metaKey ||
				e.shiftKey ||
				e.pointerType === 'touch' ||
				editorOpenRef.current ||
				isBrowsing()
			) {
				return;
			}
			const commented = commentOnControl( e.target );
			if ( commented ) {
				// The highlight's own click handler opens it.
				if ( ! e.target.closest?.( COMMENT_MARK ) ) {
					window.dispatchEvent(
						new CustomEvent( 'flow:inline-comment-focus', {
							detail: {
								commentId: commented.commentId,
								isResolved: commented.mark.classList.contains(
									'flow-inline-highlight--resolved'
								),
							},
						} )
					);
				}
				return;
			}
			if ( isReviewReadOnly() ) {
				return;
			}
			const anchor = commentableControl( e.target );
			// The padding around the label still takes a pin.
			if (
				! anchor ||
				! isOverSelectableText(
					anchor.ownerDocument,
					e.clientX,
					e.clientY
				)
			) {
				return;
			}
			selectLink( anchor );
		};

		let touchStart = null;
		const onTouchStart = ( e ) => {
			const point = e.changedTouches?.[ 0 ];
			touchStart = point ? { x: point.clientX, y: point.clientY } : null;
		};
		const onTouchEnd = ( e ) => {
			const point = e.changedTouches?.[ 0 ];
			const start = touchStart;
			touchStart = null;
			if (
				! point ||
				! start ||
				editorOpenRef.current ||
				isReviewReadOnly() ||
				attachedDoc?.documentElement.classList.contains(
					'flow-clickable-links'
				)
			) {
				return;
			}
			if (
				Math.abs( point.clientX - start.x ) > 10 ||
				Math.abs( point.clientY - start.y ) > 10
			) {
				return;
			}
			const anchor = commentableControl( e.target );
			if ( ! anchor || controlKeepsActivation( anchor ) ) {
				return;
			}
			// Keep the later click from navigating or clearing this offer.
			e.preventDefault();
			selectLink( anchor );
		};

		const attach = ( iframe ) => {
			let doc = null;
			try {
				doc = iframe?.contentDocument || null;
			} catch {
				return;
			}
			if ( ! doc || doc === attachedDoc ) {
				return;
			}
			detach();
			doc.addEventListener( 'mouseover', onOver );
			doc.addEventListener( 'mouseout', onOut );
			doc.addEventListener( 'mousedown', onDown, true );
			doc.addEventListener( 'click', onClick, true );
			doc.addEventListener( 'touchstart', onTouchStart, {
				passive: true,
			} );
			doc.addEventListener( 'touchend', onTouchEnd, { passive: false } );
			attachedDoc = doc;
		};
		const detach = () => {
			if ( ! attachedDoc ) {
				return;
			}
			attachedDoc.removeEventListener( 'mouseover', onOver );
			attachedDoc.removeEventListener( 'mouseout', onOut );
			attachedDoc.removeEventListener( 'mousedown', onDown, true );
			attachedDoc.removeEventListener( 'click', onClick, true );
			attachedDoc.removeEventListener( 'touchstart', onTouchStart );
			attachedDoc.removeEventListener( 'touchend', onTouchEnd );
			attachedDoc = null;
		};

		attach( getIframe() );
		const onReady = ( e ) => attach( e.detail?.iframe );
		const onRemoved = () => {
			clearTimeout( hover.timer );
			clearTimeout( hover.leaveTimer );
			releaseMark();
			detach();
		};
		const onThreadPointer = ( e ) => {
			hover.threadPointer = !! e.detail?.inside;
			if ( hover.threadPointer ) {
				clearTimeout( hover.leaveTimer );
				return;
			}
			if ( hover.openedThreadId ) {
				scheduleLeave();
			}
		};
		const onThreadState = ( e ) => {
			if ( ! e.detail?.open ) {
				hover.openedThreadId = 0;
				hover.threadPointer = false;
			}
		};
		window.addEventListener( 'flow:iframe-ready', onReady );
		window.addEventListener( 'flow:iframe-removed', onRemoved );
		window.addEventListener(
			'flow:inline-thread-pointer',
			onThreadPointer
		);
		window.addEventListener( 'flow:inline-thread-state', onThreadState );
		return () => {
			clearTimeout( hover.timer );
			clearTimeout( hover.leaveTimer );
			releaseMark();
			window.removeEventListener( 'flow:iframe-ready', onReady );
			window.removeEventListener( 'flow:iframe-removed', onRemoved );
			window.removeEventListener(
				'flow:inline-thread-pointer',
				onThreadPointer
			);
			window.removeEventListener(
				'flow:inline-thread-state',
				onThreadState
			);
			detach();
		};
	}, [] );

	useEffect( () => {
		const attachIframe = ( iframe ) => {
			if ( ! iframe ) {
				return;
			}
			let doc = null;
			try {
				doc =
					iframe.contentDocument ||
					iframe.contentWindow?.document ||
					null;
			} catch ( err ) {
				// Cross-origin iframe — can't access contentDocument. Surface
				// it so customer-site debug sessions actually see why inline
				// comments stopped working.
				// eslint-disable-next-line no-console
				console.warn(
					'[Flow] Review iframe is cross-origin — inline comment popover disabled. Check that the parent and iframe URLs share the same protocol + host.',
					err
				);
				return;
			}
			if ( ! doc ) {
				return;
			}
			iframeLocalRef.current = iframe;
			doc.addEventListener( 'mouseup', handleMouseUp );
			doc.addEventListener( 'mousedown', handleMouseDown );
			doc.addEventListener( 'click', handleMediaClick, true );
			doc.addEventListener( 'touchend', handleMouseUp );
		};
		const detachIframe = ( iframe ) => {
			try {
				iframe?.contentDocument?.removeEventListener(
					'mouseup',
					handleMouseUp
				);
				iframe?.contentDocument?.removeEventListener(
					'mousedown',
					handleMouseDown
				);
				iframe?.contentDocument?.removeEventListener(
					'click',
					handleMediaClick,
					true
				);
				iframe?.contentDocument?.removeEventListener(
					'touchend',
					handleMouseUp
				);
			} catch {}
		};

		const onIframeReady = ( e ) => {
			attachIframe( e.detail?.iframe );
		};
		const onIframeRemoved = () => {
			setPosition( null );
			setEditorOpen( false );
			editorOpenRef.current = false;
			rangeRef.current = null;
			descriptorRef.current = null;
			clearPinOffer();
			releaseDraftHover();

			detachIframe( iframeLocalRef.current || getIframe() );
			iframeLocalRef.current = null;
		};

		attachIframe( getIframe() );

		window.addEventListener( 'flow:iframe-ready', onIframeReady );
		window.addEventListener( 'flow:iframe-removed', onIframeRemoved );
		return () => {
			window.removeEventListener( 'flow:iframe-ready', onIframeReady );
			window.removeEventListener(
				'flow:iframe-removed',
				onIframeRemoved
			);
			detachIframe( iframeLocalRef.current || getIframe() );
			iframeLocalRef.current = null;
			setPosition( null );
			setEditorOpen( false );
			editorOpenRef.current = false;
			rangeRef.current = null;
			descriptorRef.current = null;
			clearPinOffer();
			releaseDraftHover();
		};
	}, [
		handleMouseUp,
		handleMouseDown,
		handleMediaClick,
		clearPinOffer,
		releaseDraftHover,
	] );

	const handleOpenEditor = useCallback( () => {
		const range = rangeRef.current;
		const offer = pinOfferRef.current;
		if ( ! range && ! offer ) {
			return;
		}

		const rangeDoc = offer
			? offer.ownerDocument
			: range.startContainer.ownerDocument || document;
		if ( range && rangeTouchesReviewInfoNotice( range, rangeDoc ) ) {
			return;
		}

		let descriptor = descriptorRef.current;
		if ( ! descriptor && range ) {
			const mediaNode =
				range.startContainer.nodeType === Node.ELEMENT_NODE &&
				[ 'IMG', 'VIDEO', 'IFRAME' ].includes(
					range.startContainer.tagName
				)
					? range.startContainer
					: null;
			descriptor = mediaNode
				? serializeMediaAnchor(
						mediaNode,
						mediaNode.getAttribute( 'alt' )?.trim() ||
							mediaNode.getAttribute( 'title' )?.trim() ||
							mediaTypeLabel( mediaNode.tagName )
				  )
				: serializeRange( range );
			// A drag across the photo selects the overlay chips. That is the
			// photo, not the words "Click to comment" / "Go to link".
			if ( ! descriptor ) {
				const media = mediaForOverlaySelection( range );
				descriptor = media
					? serializeMediaAnchor(
							media,
							media.getAttribute( 'alt' )?.trim() ||
								media.getAttribute( 'title' )?.trim() ||
								mediaTypeLabel( media.tagName )
					  )
					: null;
				if ( media ) {
					holdMediaComment( media );
				}
			}
		}
		if ( ! descriptor ) {
			return;
		}

		descriptorRef.current = descriptor;
		editorOpenRef.current = true;

		const rect = ( offer || range ).getBoundingClientRect();
		const iframe = iframeLocalRef.current;
		const isInIframe = iframe && rangeDoc !== document;

		const reserveRight = 400;
		const reserveHeight = 320;

		let centerY;
		let anchorLeft;
		let anchorRight;
		let anchorTop;
		let anchorBottom;
		if ( isInIframe ) {
			const iframeRect = iframe.getBoundingClientRect();
			// rect lives in iframe-internal coords; the iframe is visually
			// transform-scaled so multiply before adding the parent offset.
			const s = getIframeScale();
			centerY = iframeRect.top + rect.top * s + ( rect.height * s ) / 2;
			anchorLeft = iframeRect.left + rect.left * s;
			anchorRight = iframeRect.left + rect.right * s;
			anchorTop = iframeRect.top + rect.top * s;
			anchorBottom = iframeRect.top + rect.bottom * s;
		} else {
			centerY = rect.top + rect.height / 2;
			anchorLeft = rect.left;
			anchorRight = rect.right;
			anchorTop = rect.top;
			anchorBottom = rect.bottom;
		}

		const { left, flipped } = placeBeside(
			anchorLeft,
			anchorRight,
			reserveRight
		);
		centerY = clampTopToViewport( centerY, reserveHeight );

		setPosition( {
			top: centerY,
			left,
			flipped,
			anchorLeft,
			anchorRight,
			anchorTop,
			anchorBottom,
		} );
		setEditorOpen( true );

		const sourceWindow = rangeDoc.defaultView || window;
		// A pin has no text to keep lit. A text anchor keeps its hover blue
		// for as long as the form is open; the native selection is released
		// only once that blue has been copied onto the highlight registry,
		// so focus can move into the field. Overlay chips are not part of it.
		const draftRanges = range && ! offer ? contentRanges( range ) : [];
		if ( draftRanges.length && paintDraftHighlight( draftRanges ) ) {
			draftHighlightDocRef.current = rangeDoc;
			sourceWindow.getSelection()?.removeAllRanges();
		} else if ( ! range || offer ) {
			sourceWindow.getSelection()?.removeAllRanges();
			linkHoverRef.current.marked?.classList.remove( LINK_HOVER_CLASS );
			linkHoverRef.current.marked = null;
		} else {
			sourceWindow.getSelection()?.removeAllRanges();
		}
	}, [ placeBeside, clampTopToViewport, holdMediaComment ] );

	const handleSubmit = useCallback(
		async ( html ) => {
			const descriptor = descriptorRef.current;
			if ( ! descriptor ) {
				return;
			}

			clearPinOffer();
			const comment = await api.postComment( {
				html,
				anchorText:
					descriptor.text ||
					__( 'Image', 'jumplinks-editorial-workflow' ),
				blockClientId: JSON.stringify( descriptor ),
			} );

			window.dispatchEvent(
				new CustomEvent( 'flow:highlight-add', {
					detail: {
						commentId: comment.id,
						rangeDescriptor: descriptor,
					},
				} )
			);

			window.dispatchEvent(
				new CustomEvent( 'flow:inline-comment-added', {
					detail: { comment },
				} )
			);

			setPosition( null );
			setEditorOpen( false );
			editorOpenRef.current = false;
			rangeRef.current = null;
			descriptorRef.current = null;
			releaseDraftHover();
		},
		[ api, clearPinOffer, releaseDraftHover ]
	);

	const handleCancel = useCallback( () => {
		setPosition( null );
		setEditorOpen( false );
		editorOpenRef.current = false;
		rangeRef.current = null;
		descriptorRef.current = null;
		clearPinOffer();
		releaseDraftHover();
	}, [ clearPinOffer, releaseDraftHover ] );

	const repositionPopover = useCallback( () => {
		const anchor = pinOfferRef.current || rangeRef.current;
		if ( ! anchor ) {
			return;
		}
		const rangeDoc = pinOfferRef.current
			? pinOfferRef.current.ownerDocument
			: anchor.startContainer?.ownerDocument || document;
		const rect = anchor.getBoundingClientRect();
		const iframe = iframeLocalRef.current;
		const isInIframe = iframe && rangeDoc !== document;

		const reserveRight = editorOpenRef.current ? 400 : 220;
		const reserveHeight = editorOpenRef.current ? 320 : 60;

		let centerY;
		let anchorLeft;
		let anchorRight;
		let anchorTop;
		let anchorBottom;
		let visibleTop = 0;
		let visibleBottom = window.innerHeight;
		if ( isInIframe ) {
			const iframeRect = iframe.getBoundingClientRect();
			// rect lives in iframe-internal coords; the iframe is visually
			// transform-scaled so multiply before adding the parent offset.
			const s = getIframeScale();
			anchorTop = iframeRect.top + rect.top * s;
			anchorBottom = iframeRect.top + rect.bottom * s;
			visibleTop = Math.max( 0, iframeRect.top );
			visibleBottom = Math.min( window.innerHeight, iframeRect.bottom );
			centerY = anchorTop + ( rect.height * s ) / 2;
			anchorLeft = iframeRect.left + rect.left * s;
			anchorRight = iframeRect.left + rect.right * s;
		} else {
			anchorTop = rect.top;
			anchorBottom = rect.bottom;
			centerY = rect.top + rect.height / 2;
			anchorLeft = rect.left;
			anchorRight = rect.right;
		}

		// The Add Comment button follows its anchor off-screen rather than
		// clinging to the viewport edge; an open editor stays reachable.
		const offscreen =
			! editorOpenRef.current &&
			( anchorBottom < visibleTop || anchorTop > visibleBottom );

		const { left, flipped } = placeBeside(
			anchorLeft,
			anchorRight,
			reserveRight
		);
		centerY = clampTopToViewport( centerY, reserveHeight );

		setPosition( {
			top: centerY,
			left,
			flipped,
			anchorLeft,
			anchorRight,
			anchorTop,
			anchorBottom,
			offscreen,
		} );
	}, [ placeBeside, clampTopToViewport ] );

	useEffect( () => {
		if ( ! position ) {
			return undefined;
		}

		// Coalesce scroll/resize bursts into one reposition per frame; passive
		// listeners so scrolling is never blocked on this work.
		let rafId = 0;
		const onViewportChange = () => {
			if ( rafId ) {
				return;
			}
			rafId = window.requestAnimationFrame( () => {
				rafId = 0;
				repositionPopover();
			} );
		};
		const attachIframeScroll = ( iframe ) => {
			try {
				iframe?.contentWindow?.addEventListener(
					'scroll',
					onViewportChange,
					{ capture: true, passive: true }
				);
			} catch {
				// cross-origin safety
			}
		};
		const detachIframeScroll = ( iframe ) => {
			try {
				iframe?.contentWindow?.removeEventListener(
					'scroll',
					onViewportChange,
					true
				);
			} catch {}
		};
		const onIframeReady = ( e ) => attachIframeScroll( e.detail?.iframe );
		const onIframeRemoved = () => detachIframeScroll( getIframe() );

		window.addEventListener( 'scroll', onViewportChange, {
			capture: true,
			passive: true,
		} );
		window.addEventListener( 'resize', onViewportChange, {
			passive: true,
		} );
		// iOS keeps the layout viewport when the keyboard opens; only the
		// visual viewport shrinks and pans.
		window.visualViewport?.addEventListener( 'resize', onViewportChange );
		window.visualViewport?.addEventListener( 'scroll', onViewportChange );
		window.addEventListener( 'flow:iframe-ready', onIframeReady );
		window.addEventListener( 'flow:iframe-removed', onIframeRemoved );
		attachIframeScroll( getIframe() );

		return () => {
			if ( rafId ) {
				window.cancelAnimationFrame( rafId );
			}
			window.removeEventListener( 'scroll', onViewportChange, true );
			window.removeEventListener( 'resize', onViewportChange );
			window.visualViewport?.removeEventListener(
				'resize',
				onViewportChange
			);
			window.visualViewport?.removeEventListener(
				'scroll',
				onViewportChange
			);
			window.removeEventListener( 'flow:iframe-ready', onIframeReady );
			window.removeEventListener(
				'flow:iframe-removed',
				onIframeRemoved
			);
			detachIframeScroll( getIframe() );
		};
	}, [ position, repositionPopover ] );

	useEffect( () => {
		if ( ! position ) {
			return;
		}
		const fallbackWidth = editorOpen ? 400 : 220;
		// Re-placed once the rendered width is known; it differs from the
		// fallback with a translated label or once the editor opens.
		const next =
			undefined === position.anchorRight
				? {
						left: clampLeftToViewport(
							position.left,
							fallbackWidth
						),
						flipped: !! position.flipped,
				  }
				: placeBeside(
						position.anchorLeft,
						position.anchorRight,
						fallbackWidth
				  );
		if (
			Math.abs( next.left - position.left ) > 0.5 ||
			next.flipped !== !! position.flipped
		) {
			setPosition( ( prev ) => ( prev ? { ...prev, ...next } : prev ) );
		}
	}, [ position, editorOpen, clampLeftToViewport, placeBeside ] );

	// The editor grows as the reviewer types; track its height.
	useEffect( () => {
		const el = popoverRef.current;
		if ( ! el || typeof window.ResizeObserver !== 'function' ) {
			return;
		}
		const observer = new window.ResizeObserver( () =>
			setPopoverHeight( el.offsetHeight )
		);
		observer.observe( el );
		return () => observer.disconnect();
	}, [ position ? 1 : 0 ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Keep the whole popover between the review bar and the bottom edge.
	useLayoutEffect( () => {
		const el = popoverRef.current;
		if ( ! el || ! position ) {
			return;
		}
		const half = el.offsetHeight / 2;
		const minTop = BAR_HEIGHT + 8 + half;
		const maxTop = Math.max( minTop, window.innerHeight - 8 - half );
		const clamped = Math.min( Math.max( position.top, minTop ), maxTop );
		const next = clamped - position.top;
		if ( Math.abs( next - shiftY ) > 0.5 ) {
			setShiftY( next );
		}
	}, [ position, popoverHeight, editorOpen, shiftY ] );

	// Desktop "beside" layout: the popover (Add Comment button, or the
	// comment form once it opens) sits level with the anchor's true
	// vertical centre, except when clamping had to push it off a screen
	// edge. Shift the caret by that difference so it still points at the
	// anchor. A layout effect, like the clamps above, so it reads the DOM
	// in the same pass they do; `editorOpen` is a dependency in its own
	// right (not just via `popoverHeight`) because a render can flip the
	// button to the form without `popoverHeight` having caught up yet —
	// skipping it left the clamp measuring the short button's height
	// after an image's editor had already opened, over-restricting the
	// shift and stranding the caret far from the anchor.
	useLayoutEffect( () => {
		if (
			! position ||
			mobilePos ||
			undefined === position.anchorTop ||
			undefined === position.anchorBottom
		) {
			setCaretOffsetY( 0 );
			return;
		}
		const height = popoverRef.current?.offsetHeight || 60;
		const maxShift = Math.max( 0, height / 2 - 12 );
		const anchorCenter = ( position.anchorTop + position.anchorBottom ) / 2;
		const renderedCenter = position.top + shiftY;
		const delta = anchorCenter - renderedCenter;
		setCaretOffsetY( Math.max( -maxShift, Math.min( delta, maxShift ) ) );
	}, [ position, shiftY, mobilePos, popoverHeight, editorOpen ] );

	// Mobile "below"/"above" layout: same idea along the horizontal axis.
	// The popover is centred under the anchor until clamped off a side edge.
	useLayoutEffect( () => {
		if ( ! position || ! mobilePos ) {
			setCaretOffsetX( 0 );
			return;
		}
		const width = popoverRef.current?.offsetWidth || 220;
		const maxShift = Math.max( 0, width / 2 - 12 );
		const anchorCenter =
			( position.anchorLeft +
				( position.anchorRight ?? position.anchorLeft ) ) /
			2;
		const renderedCenter = mobilePos.left + width / 2;
		const delta = anchorCenter - renderedCenter;
		setCaretOffsetX( Math.max( -maxShift, Math.min( delta, maxShift ) ) );
	}, [ position, mobilePos, popoverHeight, editorOpen ] );

	useLayoutEffect( () => {
		const el = popoverRef.current;
		const mobile = !! window.matchMedia?.( '(max-width: 782px)' )?.matches;
		if (
			! el ||
			! position ||
			! mobile ||
			undefined === position.anchorBottom
		) {
			if ( mobilePos ) {
				setMobilePos( null );
			}
			return;
		}
		const h = el.offsetHeight;
		const w = el.offsetWidth;
		// Stay inside what is visible above the on-screen keyboard.
		const vv = window.visualViewport;
		const viewTop = vv ? vv.offsetTop : 0;
		const viewBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
		const minTop = viewTop + 8 + Math.max( 0, BAR_HEIGHT - viewTop );
		const maxTop = Math.max( minTop, viewBottom - 8 - h );
		let top = position.anchorBottom + 8;
		let above = false;
		if ( top > maxTop && position.anchorTop - 8 - h >= minTop ) {
			top = position.anchorTop - 8 - h;
			above = true;
		}
		top = Math.min( Math.max( top, minTop ), maxTop );
		// Too tall for the space above the keyboard: keep the field and the
		// submit button in view, even if that covers the review bar.
		if ( editorOpen && top + h > viewBottom - 8 ) {
			top = Math.max( viewTop + 8, viewBottom - 8 - h );
		}
		// Centred under the selection so the caret points at it.
		const anchorCenter =
			( position.anchorLeft +
				( position.anchorRight ?? position.anchorLeft ) ) /
			2;
		const left = Math.min(
			Math.max( 8, anchorCenter - w / 2 ),
			Math.max( 8, window.innerWidth - 8 - w )
		);
		if (
			! mobilePos ||
			mobilePos.above !== above ||
			Math.abs( mobilePos.top - top ) > 0.5 ||
			Math.abs( mobilePos.left - left ) > 0.5
		) {
			setMobilePos( { top, left, above } );
		}
	}, [ position, popoverHeight, editorOpen, mobilePos ] );

	if ( ! position ) {
		// Unmounting skips mouseleave, which would otherwise leave the
		// pointer flag stuck and block the next hover from closing.
		popoverPointerRef.current = false;
		return null;
	}

	return (
		<div
			ref={ popoverRef }
			onMouseEnter={ () => {
				popoverPointerRef.current = true;
				clearTimeout( linkHoverRef.current.leaveTimer );
			} }
			onMouseLeave={ () => {
				popoverPointerRef.current = false;
				if ( ! editorOpenRef.current ) {
					scheduleLinkLeaveRef.current();
				}
			} }
			className={ `flow-inline-popover${
				editorOpen ? ' flow-inline-popover--editor' : ''
			}${ mobilePos ? ' flow-inline-popover--below' : '' }${
				mobilePos?.above ? ' flow-inline-popover--above' : ''
			}${ position.flipped ? ' flow-inline-popover--flipped' : '' }` }
			style={ {
				position: 'fixed',
				top: `${ mobilePos ? mobilePos.top : position.top + shiftY }px`,
				left: `${ mobilePos ? mobilePos.left : position.left }px`,
				transform: mobilePos ? 'none' : 'translateY(-50%)',
				zIndex: 1_000_001,
				visibility: position.offscreen ? 'hidden' : undefined,
				'--flow-caret-offset-x': `${ caretOffsetX }px`,
				'--flow-caret-offset-y': `${ caretOffsetY }px`,
			} }
		>
			{ editorOpen ? (
				<div className="flow-inline-popover__editor-wrap">
					{ descriptorRef.current?.type !== 'pin' && (
						<div className="flow-inline-popover__anchor-label">
							&ldquo;
							{ descriptorRef.current?.text?.length > 60
								? descriptorRef.current.text.slice( 0, 60 ) +
								  '\u2026'
								: descriptorRef.current?.text }
							&rdquo;
						</div>
					) }
					<CommentEditor
						autoFocus
						onSubmit={ handleSubmit }
						onCancel={ handleCancel }
						submitLabel={ __(
							'Add Comment',
							'jumplinks-editorial-workflow'
						) }
					/>
				</div>
			) : (
				<button
					type="button"
					className="flow-inline-popover__btn"
					onClick={ handleOpenEditor }
				>
					<Icon
						icon={ commentReplyIcon }
						className="flow-inline-popover__btn-icon"
					/>
					<span className="flow-inline-popover__btn-label">
						{ __( 'Add Comment', 'jumplinks-editorial-workflow' ) }
					</span>
				</button>
			) }
		</div>
	);
}
