import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';
import commentReplyIcon from '../icons/comment-reply';
import {
	serializeRange,
	serializeMediaAnchor,
	serializePinAnchor,
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
import { isReviewReadOnly } from '../utils/api';
import CommentEditor from './CommentEditor';

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
const PIN_EXCLUDED =
	'.flow-inline-highlight, .flow-inline-highlight-media, .flow-embed-overlay, .flow-embed-wrap, .flow-inline-pin, .flow-review-info-notice, img, video, iframe, input, textarea, select, [contenteditable]';
// In a site review the reviewer browses the site, so its controls stay live.
const PIN_EXCLUDED_BROWSING =
	'a[href], button, [role="button"], summary, label';

const PIN_OFFER_DELAY_MS = 200;

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
	const iframeLocalRef = useRef( null );
	const pressRef = useRef( null );
	const pinOfferRef = useRef( null );
	const threadOpenRef = useRef( false );

	const pinOfferTimerRef = useRef( null );

	const clearPinOffer = useCallback( () => {
		clearTimeout( pinOfferTimerRef.current );
		pinOfferTimerRef.current = null;
		removePin( pinOfferRef.current );
		pinOfferRef.current = null;
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
			if ( isInIframe ) {
				const iframeRect = iframe.getBoundingClientRect();
				// rect lives in iframe-internal coords; the iframe is visually
				// transform-scaled so multiply before adding the parent offset.
				const s = getIframeScale();
				centerY =
					iframeRect.top + rect.top * s + ( rect.height * s ) / 2;
				anchorLeft = iframeRect.left + rect.left * s;
				anchorRight = iframeRect.left + rect.right * s;
			} else {
				centerY = rect.top + rect.height / 2;
				anchorLeft = rect.left;
				anchorRight = rect.right;
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
			} );
			if ( openEditor ) {
				setEditorOpen( true );
				editorOpenRef.current = true;
			}
		},
		[ placeBeside, clampTopToViewport ]
	);

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
				'img,video,.flow-embed-overlay'
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
						// Held back for the double-click interval so the first
						// click of a word selection never flashes a pin.
						clearTimeout( pinOfferTimerRef.current );
						pinOfferTimerRef.current = setTimeout( () => {
							pinOfferTimerRef.current = null;
							offerPinAt( e, sourceWindow );
						}, PIN_OFFER_DELAY_MS );
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
				: e.target.closest?.( 'img,video' );

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
				return;
			}
			setPosition( null );
			rangeRef.current = null;
			descriptorRef.current = null;
		},
		[ clearPinOffer ]
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
		};
	}, [ handleMouseUp, handleMouseDown, handleMediaClick, clearPinOffer ] );

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

		const descriptor =
			descriptorRef.current ||
			( range.startContainer.nodeType === Node.ELEMENT_NODE &&
			[ 'IMG', 'VIDEO' ].includes( range.startContainer.tagName )
				? serializeMediaAnchor(
						range.startContainer,
						range.startContainer.getAttribute( 'alt' )?.trim() ||
							( range.startContainer.tagName === 'VIDEO'
								? __( 'Video', 'jumplinks-editorial-workflow' )
								: __(
										'Image',
										'jumplinks-editorial-workflow'
								  ) )
				  )
				: serializeRange( range ) );
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
		if ( isInIframe ) {
			const iframeRect = iframe.getBoundingClientRect();
			// rect lives in iframe-internal coords; the iframe is visually
			// transform-scaled so multiply before adding the parent offset.
			const s = getIframeScale();
			centerY = iframeRect.top + rect.top * s + ( rect.height * s ) / 2;
			anchorLeft = iframeRect.left + rect.left * s;
			anchorRight = iframeRect.left + rect.right * s;
		} else {
			centerY = rect.top + rect.height / 2;
			anchorLeft = rect.left;
			anchorRight = rect.right;
		}

		const { left, flipped } = placeBeside(
			anchorLeft,
			anchorRight,
			reserveRight
		);
		centerY = clampTopToViewport( centerY, reserveHeight );

		setPosition( { top: centerY, left, flipped, anchorLeft, anchorRight } );
		setEditorOpen( true );

		const sourceWindow = rangeDoc.defaultView || window;
		sourceWindow.getSelection()?.removeAllRanges();
	}, [ placeBeside, clampTopToViewport ] );

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
		},
		[ api, clearPinOffer ]
	);

	const handleCancel = useCallback( () => {
		setPosition( null );
		setEditorOpen( false );
		editorOpenRef.current = false;
		rangeRef.current = null;
		descriptorRef.current = null;
		clearPinOffer();
	}, [ clearPinOffer ] );

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
		window.addEventListener( 'flow:iframe-ready', onIframeReady );
		window.addEventListener( 'flow:iframe-removed', onIframeRemoved );
		attachIframeScroll( getIframe() );

		return () => {
			if ( rafId ) {
				window.cancelAnimationFrame( rafId );
			}
			window.removeEventListener( 'scroll', onViewportChange, true );
			window.removeEventListener( 'resize', onViewportChange );
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

	if ( ! position ) {
		return null;
	}

	return (
		<div
			ref={ popoverRef }
			className={ `flow-inline-popover${
				editorOpen ? ' flow-inline-popover--editor' : ''
			}${ position.flipped ? ' flow-inline-popover--flipped' : '' }` }
			style={ {
				position: 'fixed',
				top: `${ position.top }px`,
				left: `${ position.left }px`,
				transform: 'translateY(-50%)',
				zIndex: 1_000_001,
				visibility: position.offscreen ? 'hidden' : undefined,
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
