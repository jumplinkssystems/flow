import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { closeSmall } from '@wordpress/icons';
import commentReplyIcon from '../icons/comment-reply';
import commentResolveIcon from '../icons/comment-resolve';
import { __ } from '@wordpress/i18n';
import {
	closestFromEventTarget,
	eventHitsShadowNode,
	eventInsidePortalUI,
} from '../utils/dom-helpers';
import { getIframe, getIframeDoc, getIframeScale } from '../utils/iframe-bridge';
import { pageData } from '../utils/api';
import { defaultCommentApi } from '../utils/comment-api';
import CommentEditor from './CommentEditor';
import { buildCommentTree } from '../utils/comment-tree';

const HIGHLIGHT_CLASS = 'flow-inline-highlight';
const MEDIA_HIGHLIGHT_CLASS = 'flow-inline-highlight-media';

function getInitials( name ) {
	if ( ! name ) {
		return '?';
	}
	const parts = name.trim().split( /\s+/ );
	if ( parts.length === 1 ) {
		return parts[ 0 ][ 0 ].toUpperCase();
	}
	return ( parts[ 0 ][ 0 ] + parts[ parts.length - 1 ][ 0 ] ).toUpperCase();
}

function CommentAuthorRow( { comment, className = 'flow-thread-popover__header' } ) {
	return (
		<div className={ className }>
			{ comment.avatarUrl ? (
				<img
					className="flow-thread-popover__avatar flow-thread-popover__avatar--img"
					src={ comment.avatarUrl }
					alt=""
					width="28"
					height="28"
				/>
			) : (
				<span
					className="flow-thread-popover__avatar flow-thread-popover__avatar--fallback"
					aria-hidden="true"
				>
					{ getInitials( comment.author ) }
				</span>
			) }
			<span
				className="flow-thread-popover__author"
				title={ comment.author }
			>
				{ comment.author }
			</span>
			<span className="flow-thread-popover__date">{ comment.date }</span>
		</div>
	);
}

function collectThreadFlat( all, rootId ) {
	const rid = Number( rootId );
	const idSet = new Set( [ rid ] );
	let added = true;
	while ( added ) {
		added = false;
		for ( const c of all ) {
			const cid = Number( c.id );
			const pid = Number( c.parentId || 0 );
			if ( idSet.has( pid ) && ! idSet.has( cid ) ) {
				idSet.add( cid );
				added = true;
			}
		}
	}
	return all.filter( ( c ) => idSet.has( Number( c.id ) ) );
}

function findMarkElement( commentId ) {
	const selector = `.${ HIGHLIGHT_CLASS }[data-comment-id="${ commentId }"], .${ MEDIA_HIGHLIGHT_CLASS }`;
	const matches = ( el ) =>
		Number( el.dataset.commentId ) === commentId ||
		( el.dataset.commentIds || '' )
			.split( ' ' )
			.includes( String( commentId ) );

	const iframeDoc = getIframeDoc();
	if ( iframeDoc ) {
		const inIframe = [ ...iframeDoc.querySelectorAll( selector ) ].find(
			matches
		);
		if ( inIframe ) {
			return { mark: inIframe, inIframe: true };
		}
	}
	const inDoc = [ ...document.querySelectorAll( selector ) ].find( matches );
	if ( inDoc ) {
		return { mark: inDoc, inIframe: false };
	}
	return null;
}

function markRectToViewport( rect, inIframe, popoverHeight = 320 ) {
	const GAP = 8;
	const PAD = 8;

	let markTop;
	let markBottom;
	let left;
	if ( ! inIframe ) {
		markTop = rect.top;
		markBottom = rect.bottom;
		left = rect.left + rect.width / 2;
	} else {
		const iframe = getIframe();
		if ( ! iframe ) {
			markTop = rect.top;
			markBottom = rect.bottom;
			left = rect.left + rect.width / 2;
		} else {
			const iframeRect = iframe.getBoundingClientRect();
			// Iframe is visually transform-scaled in ReviewBar; rect coords
			// are iframe-internal so multiply before mapping to parent.
			const s = getIframeScale();
			markTop = iframeRect.top + rect.top * s;
			markBottom = iframeRect.top + rect.bottom * s;
			left = iframeRect.left + rect.left * s + ( rect.width * s ) / 2;
		}
	}

	const viewportBottom = window.innerHeight;
	const fitsBelow = markBottom + GAP + popoverHeight <= viewportBottom - PAD;
	const fitsAbove = markTop - GAP - popoverHeight >= PAD;

	let top;
	let placement;
	if ( fitsBelow ) {
		top = markBottom + GAP;
		placement = 'below';
	} else if ( fitsAbove ) {
		top = markTop - GAP - popoverHeight;
		placement = 'above';
	} else {
		// Popover taller than viewport (or both sides cramped) — pin to top.
		top = Math.max( PAD, viewportBottom - popoverHeight - PAD );
		placement = 'below';
	}

	return { top, left, placement };
}

/**
 * @param {object} [props]
 * @param {{ postComment: Function, updateComment: Function }} [props.api]
 *   Backend adapter. Defaults to the single-post review namespace. The
 *   site-review chrome (Pro) supplies its own adapter targeting the Pro
 *   namespace.
 * @param {string} [props.mode] Optional mode tag for downstream branching.
 *   Defaults to `'review'`.
 */
export default function InlineThreadPopover( { api = defaultCommentApi, mode = 'review' } = {} ) {
	const [ thread, setThread ] = useState( null );
	const [ position, setPosition ] = useState( null );
	const [ replying, setReplying ] = useState( false );
	const commentsRef = useRef( pageData.inlineComments || [] );
	const openThreadRootIdRef = useRef( null );
	const popoverRef = useRef( null );
	const [ caretOffset, setCaretOffset ] = useState( 0 );

	const getViewportBounds = useCallback( () => {
		const PAD = 16;
		let minLeft = PAD;
		let maxRight = window.innerWidth - PAD;

		// Activity sidebar (Pro) is on the LEFT — bounds minLeft.
		if ( document.body.classList.contains( 'flow-review-page--activity-open' ) ) {
			const activityHost = document.getElementById( 'flow-pro-activity-host' );
			const activityRight =
				activityHost?.getBoundingClientRect?.().right || 0;
			if ( activityRight > 0 ) {
				minLeft = Math.max( minLeft, activityRight + PAD );
			}
		}

		// Comments sidebar is on the RIGHT — bounds maxRight.
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

	const clampCenterToViewport = useCallback(
		( centerX ) => {
			const width = popoverRef.current?.offsetWidth || 420;
			const half = width / 2;
			const { minLeft, maxRight } = getViewportBounds();
			const minCenter = minLeft + half;
			const maxCenter = maxRight - half;
			if ( minCenter > maxCenter ) {
				return ( minLeft + maxRight ) / 2;
			}
			return Math.max( minCenter, Math.min( centerX, maxCenter ) );
		},
		[ getViewportBounds ]
	);

	const rebuildOpenThread = useCallback( () => {
		const rid = openThreadRootIdRef.current;
		if ( rid == null ) {
			return;
		}
		const flat = collectThreadFlat( commentsRef.current, rid );
		const trees = buildCommentTree( flat );
		const next = trees.find( ( t ) => Number( t.id ) === Number( rid ) );
		if ( next ) {
			setThread( next );
		} else {
			setThread( null );
			setPosition( null );
			openThreadRootIdRef.current = null;
		}
	}, [] );

	useEffect( () => {
		const onAdded = ( e ) => {
			const { comment } = e.detail || {};
			if ( ! comment ) {
				return;
			}
			const cid = Number( comment.id );
			if (
				commentsRef.current.some( ( c ) => Number( c.id ) === cid )
			) {
				rebuildOpenThread();
				return;
			}
			commentsRef.current = [ ...commentsRef.current, comment ];
			rebuildOpenThread();
		};
		window.addEventListener( 'flow:inline-comment-added', onAdded );
		return () =>
			window.removeEventListener( 'flow:inline-comment-added', onAdded );
	}, [ rebuildOpenThread ] );

	useEffect( () => {
		const onUpdated = ( e ) => {
			const { id, html } = e.detail || {};
			if ( ! id ) {
				return;
			}
			const nid = Number( id );
			commentsRef.current = commentsRef.current.map( ( c ) =>
				Number( c.id ) === nid ? { ...c, html } : c
			);
			rebuildOpenThread();
		};

		const onDeleted = ( e ) => {
			const { id } = e.detail || {};
			if ( ! id ) {
				return;
			}
			const nid = Number( id );
			commentsRef.current = commentsRef.current.filter(
				( c ) => Number( c.id ) !== nid
			);
			rebuildOpenThread();
		};

		const onResolved = ( e ) => {
			const commentId = e.detail?.commentId;
			if ( ! commentId ) {
				return;
			}
			const cid = Number( commentId );
			commentsRef.current = commentsRef.current.map( ( c ) =>
				Number( c.id ) === cid ? { ...c, isResolved: true } : c
			);
			rebuildOpenThread();
		};

		window.addEventListener( 'flow:inline-comment-updated', onUpdated );
		window.addEventListener( 'flow:inline-comment-deleted', onDeleted );
		window.addEventListener( 'flow:inline-comment-resolved', onResolved );
		return () => {
			window.removeEventListener(
				'flow:inline-comment-updated',
				onUpdated
			);
			window.removeEventListener(
				'flow:inline-comment-deleted',
				onDeleted
			);
			window.removeEventListener(
				'flow:inline-comment-resolved',
				onResolved
			);
		};
	}, [ rebuildOpenThread ] );

	const showPopover = useCallback(
		( e ) => {
			const { commentId } = e.detail || {};
			if ( ! commentId ) {
				return;
			}

			const id = Number( commentId );
			const found = findMarkElement( id );
			if ( ! found ) {
				return;
			}

			const flat = collectThreadFlat( commentsRef.current, id );
			const trees = buildCommentTree( flat );
			const nextThread = trees.find( ( t ) => Number( t.id ) === id );
			if ( ! nextThread ) {
				return;
			}

			const rect = found.mark.getBoundingClientRect();
			const next = markRectToViewport(
				rect,
				found.inIframe,
				popoverRef.current?.offsetHeight || 320
			);
			const left = clampCenterToViewport( next.left );
			openThreadRootIdRef.current = id;
			setPosition( { ...next, left, anchorLeft: next.left } );
			setThread( nextThread );
			setReplying( false );
		},
		[ clampCenterToViewport ]
	);

	const showPopoverDelayed = useCallback(
		( e ) => {
			setTimeout( () => showPopover( e ), 350 );
		},
		[ showPopover ]
	);

	const repositionToThreadAnchor = useCallback( () => {
		if ( ! thread ) {
			return;
		}
		const found = findMarkElement( Number( thread.id ) );
		if ( ! found ) {
			return;
		}
		const rect = found.mark.getBoundingClientRect();
		const next = markRectToViewport(
			rect,
			found.inIframe,
			popoverRef.current?.offsetHeight || 320
		);
		const left = clampCenterToViewport( next.left );
		setPosition( ( prev ) => {
			if (
				prev &&
				prev.top === next.top &&
				prev.left === left &&
				prev.placement === next.placement
			) {
				return prev;
			}
			return { ...next, left, anchorLeft: next.left };
		} );
	}, [ thread, clampCenterToViewport ] );

	useEffect( () => {
		if ( ! thread ) return;
		const id = window.requestAnimationFrame( () => {
			repositionToThreadAnchor();
		} );
		return () => window.cancelAnimationFrame( id );
	}, [ thread, repositionToThreadAnchor ] );

	useEffect( () => {
		window.addEventListener( 'flow:inline-comment-focus', showPopover );
		window.addEventListener(
			'flow:scroll-to-highlight',
			showPopoverDelayed
		);
		return () => {
			window.removeEventListener(
				'flow:inline-comment-focus',
				showPopover
			);
			window.removeEventListener(
				'flow:scroll-to-highlight',
				showPopoverDelayed
			);
		};
	}, [ showPopover, showPopoverDelayed ] );

	useEffect( () => {
		if ( ! thread ) {
			return undefined;
		}

		const onViewportChange = () => repositionToThreadAnchor();
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
			window.removeEventListener(
				'flow:iframe-removed',
				onIframeRemoved
			);
			detachIframeScroll( getIframe() );
		};
	}, [ thread, repositionToThreadAnchor ] );

	useEffect( () => {
		if ( ! position ) {
			return;
		}
		const clampedLeft = clampCenterToViewport( position.left );
		if ( Math.abs( clampedLeft - position.left ) > 0.5 ) {
			setPosition( ( prev ) =>
				prev ? { ...prev, left: clampedLeft } : prev
			);
		}
	}, [ position, clampCenterToViewport ] );

	useEffect( () => {
		if ( ! position ) {
			setCaretOffset( 0 );
			return;
		}
		const cardWidth = popoverRef.current?.offsetWidth || 360;
		const maxShift = Math.max( 0, cardWidth / 2 - 20 );
		const anchorLeft = Number( position.anchorLeft || position.left );
		const popoverCentre =
			window.innerWidth <= 600
				? window.innerWidth / 2
				: position.left;
		const delta = anchorLeft - popoverCentre;
		setCaretOffset( Math.max( -maxShift, Math.min( delta, maxShift ) ) );
	}, [ position ] );

	const handleClose = useCallback( () => {
		openThreadRootIdRef.current = null;
		setThread( null );
		setPosition( null );
		setReplying( false );
	}, [] );

	const handleMouseDown = useCallback( ( e ) => {
		if ( eventHitsShadowNode( e, popoverRef.current ) ) {
			return;
		}
		if ( eventInsidePortalUI( e ) ) {
			return;
		}
		const mark = closestFromEventTarget(
			e.target,
			`.${ HIGHLIGHT_CLASS }, .${ MEDIA_HIGHLIGHT_CLASS }`
		);
		if ( mark ) {
			return;
		}
		handleClose();
	}, [ handleClose ] );

	useEffect( () => {
		const attachIframe = ( iframe ) => {
			try {
				iframe?.contentDocument?.addEventListener(
					'mousedown',
					handleMouseDown
				);
			} catch {
				// cross-origin safety
			}
		};
		const detachIframe = ( iframe ) => {
			try {
				iframe?.contentDocument?.removeEventListener(
					'mousedown',
					handleMouseDown
				);
			} catch {
			}
		};

		document.addEventListener( 'mousedown', handleMouseDown );
		attachIframe( getIframe() );

		const onIframeReady = ( e ) => {
			attachIframe( e.detail?.iframe );
		};
		const onIframeRemoved = () => {
			detachIframe( getIframe() );
			openThreadRootIdRef.current = null;
			setThread( null );
			setPosition( null );
			setReplying( false );
		};

		window.addEventListener( 'flow:iframe-ready', onIframeReady );
		window.addEventListener( 'flow:iframe-removed', onIframeRemoved );

		return () => {
			document.removeEventListener( 'mousedown', handleMouseDown );
			detachIframe( getIframe() );
			window.removeEventListener( 'flow:iframe-ready', onIframeReady );
			window.removeEventListener(
				'flow:iframe-removed',
				onIframeRemoved
			);
		};
	}, [ handleMouseDown ] );

	const handleResolve = useCallback( async () => {
		if ( ! thread ) {
			return;
		}
		await api.updateComment( thread.id, { resolved: true } );

		const tid = Number( thread.id );
		commentsRef.current = commentsRef.current.map( ( c ) =>
			Number( c.id ) === tid ? { ...c, isResolved: true } : c
		);

		openThreadRootIdRef.current = null;

		window.dispatchEvent(
			new CustomEvent( 'flow:highlight-resolve', {
				detail: { commentId: thread.id },
			} )
		);

		window.dispatchEvent(
			new CustomEvent( 'flow:inline-comment-resolved', {
				detail: {
					commentId: thread.id,
					userId: pageData.currentUserId,
				},
			} )
		);
		window.dispatchEvent(
			new CustomEvent( 'flow:author-resubmit-activity', {
				detail: {
					userId: pageData.currentUserId,
					kind: 'comment_resolved',
				},
			} )
		);

		setThread( null );
		setPosition( null );
	}, [ thread, api ] );

	const handleReplySubmit = useCallback(
		async ( html ) => {
			if ( ! thread ) {
				return;
			}
			const comment = await api.postComment( {
				html,
				parentId: thread.id,
			} );

			window.dispatchEvent(
				new CustomEvent( 'flow:inline-comment-added', {
					detail: { comment },
				} )
			);
			rebuildOpenThread();
			setReplying( false );
		},
		[ thread, rebuildOpenThread, api ]
	);

	if ( ! thread || ! position ) {
		return null;
	}

	const replies = thread.replies || [];

	const placement = position.placement || 'below';

	return (
		<div
			ref={ popoverRef }
			className={ `flow-thread-popover flow-thread-popover--${ placement }` }
			style={ {
				position: 'fixed',
				top: `${ position.top }px`,
				left: `${ position.left }px`,
				transform: 'translateX(-50%)',
				zIndex: 1_000_001,
			} }
		>
			<span
				className="flow-thread-popover__caret"
				style={ { marginLeft: `${ caretOffset }px` } }
				aria-hidden="true"
			/>
			<div className="flow-thread-popover__card">
				<div className="flow-thread-popover__header-actions">
					{ ! thread.isResolved &&
						Number( pageData.currentUserId || 0 ) > 0 && (
						<Button
							icon={ commentResolveIcon }
							size="small"
							className="flow-thread-popover__resolve-icon"
							label={ __(
								'Mark as resolved',
								'jumplinks-editorial-workflow'
							) }
							onClick={ handleResolve }
						/>
					) }
					<Button
						icon={ closeSmall }
						className="flow-thread-popover__close"
						label={ __( 'Close', 'jumplinks-editorial-workflow' ) }
						onClick={ handleClose }
					/>
				</div>
				<CommentAuthorRow comment={ thread } />
				<div
					className="flow-thread-popover__body"
					dangerouslySetInnerHTML={ { __html: thread.html } }
				/>

				{ replies.length > 0 && (
					<div className="flow-thread-popover__replies">
						{ replies.map( ( reply ) => (
							<div
								key={ reply.id }
								className="flow-thread-popover__reply"
							>
								<CommentAuthorRow
									comment={ reply }
									className="flow-thread-popover__reply-header"
								/>
								<div
									className="flow-thread-popover__reply-body"
									dangerouslySetInnerHTML={ {
										__html: reply.html,
									} }
								/>
							</div>
						) ) }
					</div>
				) }

				{ replying && (
					<div className="flow-thread-popover__reply-editor">
						<CommentEditor
							autoFocus
							onSubmit={ handleReplySubmit }
							onCancel={ () => setReplying( false ) }
							submitLabel={ __(
								'Reply',
								'jumplinks-editorial-workflow'
							) }
						/>
					</div>
				) }

				{ ! thread.isResolved && ! replying && (
					<div className="flow-thread-popover__actions">
						<Button
							className="flow-btn--text flow-thread-popover__reply-btn"
							icon={ commentReplyIcon }
							onClick={ () => setReplying( true ) }
						>
							{ __( 'Reply', 'jumplinks-editorial-workflow' ) }
						</Button>
					</div>
				) }

				{ thread.isResolved && (
					<div className="flow-thread-popover__resolved-badge">
						{ __( 'Resolved', 'jumplinks-editorial-workflow' ) }
					</div>
				) }
			</div>
		</div>
	);
}
