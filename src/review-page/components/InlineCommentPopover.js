import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/components';
import commentReplyIcon from '../icons/comment-reply';
import { serializeRange, serializeMediaAnchor } from '../utils/text-anchor';
import {
	getIframe,
	getIframeScale,
	resolveContentRootFor,
} from '../utils/iframe-bridge';
import { eventHitsShadowNode, eventInsidePortalUI } from '../utils/dom-helpers';
import { pageData } from '../utils/api';
import { defaultCommentApi } from '../utils/comment-api';
import CommentEditor from './CommentEditor';

function rangeTouchesReviewInfoNotice( range, doc ) {
	const notice = doc.querySelector( '.flow-review-info-notice' );
	if ( ! notice ) return false;
	return (
		notice.contains( range.startContainer ) ||
		notice.contains( range.endContainer )
	);
}

/**
 * @param {object} [props]
 * @param {{ postComment: Function, updateComment: Function }} [props.api]
 *   Backend adapter. Defaults to the single-post review namespace
 *   (`flow/v1/reviews/{id}/comments`). The site-review chrome (Pro) passes
 *   its own adapter that targets `flow-pro/v1/site-reviews/{id}/comments`.
 * @param {string} [props.mode] Optional mode tag; carried through unchanged
 *   for downstream code that wants to vary copy/behaviour. Defaults to
 *   `'review'`.
 */
export default function InlineCommentPopover( { api = defaultCommentApi, mode = 'review' } = {} ) {
	const [ position, setPosition ] = useState( null );
	const [ editorOpen, setEditorOpen ] = useState( false );
	const editorOpenRef = useRef( false );
	const rangeRef = useRef( null );
	const descriptorRef = useRef( null );
	const popoverRef = useRef( null );
	const iframeLocalRef = useRef( null );

	const getViewportBounds = useCallback( () => {
		const PAD = 12;
		let minLeft = PAD;
		let maxRight = window.innerWidth - PAD;

		if ( document.body.classList.contains( 'flow-review-page--activity-open' ) ) {
			const activityHost = document.getElementById( 'flow-pro-activity-host' );
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

	const clampLeftToViewport = useCallback( ( left, fallbackWidth ) => {
		const width = popoverRef.current?.offsetWidth || fallbackWidth;
		const { minLeft, maxRight } = getViewportBounds();
		const maxLeft = Math.max( minLeft, maxRight - width );
		return Math.max( minLeft, Math.min( left, maxLeft ) );
	}, [ getViewportBounds ] );

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

	const positionNearRect = useCallback( ( rect, sourceWindow, openEditor = false ) => {
		const iframe = iframeLocalRef.current;
		const isInIframe = sourceWindow !== window && iframe;

		const GAP = 12;
		const reserveRight = openEditor ? 400 : 220;
		const reserveHeight = openEditor ? 320 : 60;

		let centerY;
		let leftX;
		if ( isInIframe ) {
			const iframeRect = iframe.getBoundingClientRect();
			// rect lives in iframe-internal coords; the iframe is visually
			// transform-scaled so multiply before adding the parent offset.
			const s = getIframeScale();
			centerY = iframeRect.top + rect.top * s + ( rect.height * s ) / 2;
			leftX = iframeRect.left + rect.right * s + GAP;
		} else {
			centerY = rect.top + rect.height / 2;
			leftX = rect.right + GAP;
		}

		leftX = clampLeftToViewport( leftX, reserveRight );
		centerY = clampTopToViewport( centerY, reserveHeight );

		setPosition( { top: centerY, left: leftX } );
		if ( openEditor ) {
			setEditorOpen( true );
			editorOpenRef.current = true;
		}
	}, [ clampLeftToViewport, clampTopToViewport ] );

	const handleMouseUp = useCallback( ( e ) => {
		if ( editorOpenRef.current ) return;

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

		requestAnimationFrame( () => {
			if ( editorOpenRef.current ) return;

			const selection = sourceWindow.getSelection();
			if (
				! selection ||
				selection.isCollapsed ||
				! selection.toString().trim()
			) {
				setPosition( null );
				rangeRef.current = null;
				descriptorRef.current = null;
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

			if ( rangeTouchesReviewInfoNotice( range, sourceWindow.document ) ) {
				setPosition( null );
				rangeRef.current = null;
				descriptorRef.current = null;
				sourceWindow.getSelection()?.removeAllRanges();
				return;
			}

			const rect = range.getBoundingClientRect();
			rangeRef.current = range.cloneRange();
			descriptorRef.current = null;
			positionNearRect( rect, sourceWindow );
		} );
	}, [ positionNearRect ] );

	const handleMediaClick = useCallback( ( e ) => {
		if ( editorOpenRef.current ) return;

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
		let media = overlay
			? overlay.flowMedia ||
			  overlay.parentElement?.querySelector( 'img, video, iframe' ) ||
			  null
			: e.target.closest?.( 'img,video' );

		if ( ! media ) return;

		// Resolve against the media node so a `.entry-content` (e.g. one of
		// WooCommerce's tab panels) other than the "longest" is still accepted.
		const contentRoot = resolveContentRootFor( sourceWindow.document, media );
		if ( ! contentRoot ) return;

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
		const isVideo = tag === 'VIDEO';
		const isEmbed = tag === 'IFRAME';
		const label =
			media.getAttribute( 'alt' )?.trim() ||
			media.getAttribute( 'title' )?.trim() ||
			( isVideo
				? __( 'Video', 'jumplinks-editorial-workflow' )
				: isEmbed
					? __( 'Embed', 'jumplinks-editorial-workflow' )
					: __( 'Image', 'jumplinks-editorial-workflow' ) );
		descriptorRef.current = serializeMediaAnchor( media, label );

		// Media (img/video/iframe) are clicked through their `.flow-embed-overlay`
		const rect = media.getBoundingClientRect();
		positionNearRect( rect, sourceWindow, true );
	}, [ positionNearRect ] );

	const handleMouseDown = useCallback( ( e ) => {
		if ( eventHitsShadowNode( e, popoverRef.current ) ) {
			return;
		}
		if ( eventInsidePortalUI( e ) ) {
			return;
		}
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
	}, [] );

	// Show the popover from whatever selection is currently committed to JS.
	const showPopoverFromCurrentSelection = useCallback( ( sourceWindow ) => {
		if ( editorOpenRef.current ) return;
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
		if ( rangeTouchesReviewInfoNotice( range, sourceWindow.document ) ) {
			sourceWindow.getSelection()?.removeAllRanges();
			return;
		}
		const rect = range.getBoundingClientRect();
		rangeRef.current = range.cloneRange();
		descriptorRef.current = null;
		positionNearRect( rect, sourceWindow );
	}, [ positionNearRect ] );

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
			if ( editorOpenRef.current ) return;
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
			if ( ! iframe ) return;
			let doc = null;
			try {
				doc =
					iframe.contentDocument ||
					iframe.contentWindow?.document ||
					null;
			} catch {
				return;
			}
			if ( ! doc ) return;
			if ( attachedDoc && onIframeSelChange ) {
				try {
					attachedDoc.removeEventListener(
						'selectionchange',
						onIframeSelChange
					);
				} catch {
				}
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
			document.removeEventListener( 'selectionchange', onParentSelChange );
			window.removeEventListener( 'flow:iframe-ready', onIframeReady );
			window.removeEventListener( 'flow:iframe-removed', onIframeRemoved );
			detachIframe();
		};
	}, [ showPopoverFromCurrentSelection ] );

	useEffect( () => {
		const attachIframe = ( iframe ) => {
			if ( ! iframe ) return;
			let doc = null;
			try {
				doc = iframe.contentDocument || iframe.contentWindow?.document || null;
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
			if ( ! doc ) return;
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
			} catch {
			}
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

			detachIframe( iframeLocalRef.current || getIframe() );
			iframeLocalRef.current = null;
		};

		attachIframe( getIframe() );

		window.addEventListener( 'flow:iframe-ready', onIframeReady );
		window.addEventListener( 'flow:iframe-removed', onIframeRemoved );
		return () => {
			window.removeEventListener( 'flow:iframe-ready', onIframeReady );
			window.removeEventListener( 'flow:iframe-removed', onIframeRemoved );
			detachIframe( iframeLocalRef.current || getIframe() );
			iframeLocalRef.current = null;
			setPosition( null );
			setEditorOpen( false );
			editorOpenRef.current = false;
			rangeRef.current = null;
			descriptorRef.current = null;
		};
	}, [ handleMouseUp, handleMouseDown, handleMediaClick ] );

	const handleOpenEditor = useCallback( () => {
		const range = rangeRef.current;
		if ( ! range ) return;

		const rangeDoc = range.startContainer.ownerDocument || document;
		if ( rangeTouchesReviewInfoNotice( range, rangeDoc ) ) {
			return;
		}

		let descriptor =
			descriptorRef.current ||
			( range.startContainer.nodeType === Node.ELEMENT_NODE &&
			[ 'IMG', 'VIDEO' ].includes( range.startContainer.tagName )
				? serializeMediaAnchor(
						range.startContainer,
						range.startContainer.getAttribute( 'alt' )?.trim() ||
							( range.startContainer.tagName === 'VIDEO'
								? __( 'Video', 'jumplinks-editorial-workflow' )
								: __( 'Image', 'jumplinks-editorial-workflow' ) )
				  )
				: serializeRange( range ) );
		if ( ! descriptor ) return;

		descriptorRef.current = descriptor;
		editorOpenRef.current = true;

		const rect = range.getBoundingClientRect();
		const iframe = iframeLocalRef.current;
		const isInIframe = iframe && rangeDoc !== document;

		const GAP = 12;
		const reserveRight = 400;
		const reserveHeight = 320;

		let centerY;
		let leftX;
		if ( isInIframe ) {
			const iframeRect = iframe.getBoundingClientRect();
			// rect lives in iframe-internal coords; the iframe is visually
			// transform-scaled so multiply before adding the parent offset.
			const s = getIframeScale();
			centerY = iframeRect.top + rect.top * s + ( rect.height * s ) / 2;
			leftX = iframeRect.left + rect.right * s + GAP;
		} else {
			centerY = rect.top + rect.height / 2;
			leftX = rect.right + GAP;
		}

		leftX = clampLeftToViewport( leftX, reserveRight );
		centerY = clampTopToViewport( centerY, reserveHeight );

		setPosition( { top: centerY, left: leftX } );
		setEditorOpen( true );

		const sourceWindow = rangeDoc.defaultView || window;
		sourceWindow.getSelection()?.removeAllRanges();
	}, [ clampLeftToViewport, clampTopToViewport ] );

	const handleSubmit = useCallback( async ( html ) => {
		const descriptor = descriptorRef.current;
		if ( ! descriptor ) return;

		const comment = await api.postComment( {
			html,
			anchorText: descriptor.text || __( 'Image', 'jumplinks-editorial-workflow' ),
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
	}, [ api ] );

	const handleCancel = useCallback( () => {
		setPosition( null );
		setEditorOpen( false );
		editorOpenRef.current = false;
		rangeRef.current = null;
		descriptorRef.current = null;
	}, [] );

	const repositionPopover = useCallback( () => {
		if ( ! rangeRef.current ) {
			return;
		}
		const range = rangeRef.current;
		const rangeDoc = range.startContainer?.ownerDocument || document;
		const rect = range.getBoundingClientRect();
		const iframe = iframeLocalRef.current;
		const isInIframe = iframe && rangeDoc !== document;

		const GAP = 12;
		const reserveRight = editorOpenRef.current ? 400 : 220;
		const reserveHeight = editorOpenRef.current ? 320 : 60;

		let centerY;
		let leftX;
		if ( isInIframe ) {
			const iframeRect = iframe.getBoundingClientRect();
			// rect lives in iframe-internal coords; the iframe is visually
			// transform-scaled so multiply before adding the parent offset.
			const s = getIframeScale();
			centerY = iframeRect.top + rect.top * s + ( rect.height * s ) / 2;
			leftX = iframeRect.left + rect.right * s + GAP;
		} else {
			centerY = rect.top + rect.height / 2;
			leftX = rect.right + GAP;
		}

		leftX = clampLeftToViewport( leftX, reserveRight );
		centerY = clampTopToViewport( centerY, reserveHeight );

		setPosition( { top: centerY, left: leftX } );
	}, [ clampLeftToViewport, clampTopToViewport ] );

	useEffect( () => {
		if ( ! position ) {
			return undefined;
		}

		const onViewportChange = () => repositionPopover();
		const attachIframeScroll = ( iframe ) => {
			try {
				iframe?.contentWindow?.addEventListener(
					'scroll',
					onViewportChange,
					true
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
			} catch {
			}
		};
		const onIframeReady = ( e ) => attachIframeScroll( e.detail?.iframe );
		const onIframeRemoved = () => detachIframeScroll( getIframe() );

		window.addEventListener( 'scroll', onViewportChange, true );
		window.addEventListener( 'resize', onViewportChange );
		window.addEventListener( 'flow:iframe-ready', onIframeReady );
		window.addEventListener( 'flow:iframe-removed', onIframeRemoved );
		attachIframeScroll( getIframe() );

		return () => {
			window.removeEventListener( 'scroll', onViewportChange, true );
			window.removeEventListener( 'resize', onViewportChange );
			window.removeEventListener( 'flow:iframe-ready', onIframeReady );
			window.removeEventListener( 'flow:iframe-removed', onIframeRemoved );
			detachIframeScroll( getIframe() );
		};
	}, [ position, repositionPopover ] );

	useEffect( () => {
		if ( ! position ) {
			return;
		}
		const fallbackWidth = editorOpen ? 400 : 220;
		const clampedLeft = clampLeftToViewport( position.left, fallbackWidth );
		if ( Math.abs( clampedLeft - position.left ) > 0.5 ) {
			setPosition( ( prev ) =>
				prev ? { ...prev, left: clampedLeft } : prev
			);
		}
	}, [ position, editorOpen, clampLeftToViewport ] );

	if ( ! position ) return null;

	return (
		<div
			ref={ popoverRef }
			className={ `flow-inline-popover${ editorOpen ? ' flow-inline-popover--editor' : '' }` }
			style={ {
				position: 'fixed',
				top: `${ position.top }px`,
				left: `${ position.left }px`,
				transform: 'translateY(-50%)',
				zIndex: 1_000_001,
			} }
		>
			{ editorOpen ? (
				<div className="flow-inline-popover__editor-wrap">
					<div className="flow-inline-popover__anchor-label">
						&ldquo;{ descriptorRef.current?.text?.length > 60
							? descriptorRef.current.text.slice( 0, 60 ) + '\u2026'
							: descriptorRef.current?.text }&rdquo;
					</div>
					<CommentEditor
						autoFocus
						onSubmit={ handleSubmit }
						onCancel={ handleCancel }
						submitLabel={ __( 'Add Comment', 'jumplinks-editorial-workflow' ) }
					/>
				</div>
			) : (
				<button
					type="button"
					className="flow-inline-popover__btn"
					onClick={ handleOpenEditor }
				>
					<Icon icon={ commentReplyIcon } className="flow-inline-popover__btn-icon" />
					<span className="flow-inline-popover__btn-label">
						{ __( 'Add Comment', 'jumplinks-editorial-workflow' ) }
					</span>
				</button>
			) }
		</div>
	);
}
