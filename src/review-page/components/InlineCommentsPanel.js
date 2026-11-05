import {
	useState,
	useCallback,
	useEffect,
	useRef,
	useMemo,
} from '@wordpress/element';
import { Icon } from '@wordpress/components';
import { comment as commentIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { pageData } from '../utils/api';
import { defaultCommentApi } from '../utils/comment-api';
import CommentThread from './CommentThread';
import { buildCommentTree } from '../utils/comment-tree';
import { useConfirmDialog } from '../hooks/use-confirm-dialog';
import {
	getIframeDoc,
	resolveCommentContentRoot,
} from '../utils/iframe-bridge';
import {
	canPreviewDevices,
	currentDevice,
	pinViewportDevice,
} from '../../shared/device';
import PinnedOnHint from './PinnedOnHint';
import OutdatedHint from './OutdatedHint';
import { isAnchorOutdated, showPinOnDevice } from '../utils/comment-flags';

let focusedThread = null;

function clearFocusedThread() {
	focusedThread?.classList.remove( 'flow-inline-thread--focused' );
	focusedThread = null;
}

function isPinThread( thread ) {
	try {
		return JSON.parse( thread.blockClientId || '' )?.type === 'pin';
	} catch {
		return false;
	}
}

// Older pins carry no device; they are never flagged.
function pinDevice( thread ) {
	try {
		return pinViewportDevice( JSON.parse( thread.blockClientId || '' ) );
	} catch {
		return '';
	}
}

function focusThread( el ) {
	if ( ! el ) {
		return;
	}
	clearFocusedThread();
	el.scrollIntoView( { behavior: 'smooth', block: 'center' } );
	el.classList.add( 'flow-inline-thread--focused' );
	focusedThread = el;
	const docs = [ document, getIframeDoc() ].filter( Boolean );
	const onNextClick = () => {
		docs.forEach( ( d ) =>
			d.removeEventListener( 'pointerdown', onNextClick, true )
		);
		if ( focusedThread === el ) {
			clearFocusedThread();
		}
	};
	docs.forEach( ( d ) =>
		d.addEventListener( 'pointerdown', onNextClick, true )
	);
}

/**
 * @param {Object} [props]
 * @param {{
 *   postComment: Function,
 *   updateComment: Function,
 *   deleteComment: Function,
 * }} [props.api]
 *   Backend adapter. Defaults to Free's single-post review namespace.
 * @param {'active'|'resolved'} [props.threadFilter]
 * @param {boolean} [props.showEmptyState]
 *   When true and there are no inline threads at all, show the onboarding hint.
 * @param {Array} props.comments
 * @param {Function} props.setComments
 */
export default function InlineCommentsPanel( {
	api = defaultCommentApi,
	threadFilter = 'active',
	showEmptyState = false,
	comments,
	setComments,
} ) {
	const { confirm, confirmDialog } = useConfirmDialog();
	const [ outdatedMap, setOutdatedMap ] = useState( {} );
	const [ viewDevice, setViewDevice ] = useState( currentDevice );
	const threadRefs = useRef( {} );

	useEffect( () => {
		const sync = () => setViewDevice( currentDevice() );
		window.addEventListener( 'flow:set-device-preview', sync );
		window.addEventListener( 'flow:iframe-ready', sync );
		return () => {
			window.removeEventListener( 'flow:set-device-preview', sync );
			window.removeEventListener( 'flow:iframe-ready', sync );
		};
	}, [] );

	const tree = useMemo( () => buildCommentTree( comments ), [ comments ] );
	const { activeThreads, resolvedThreads } = useMemo( () => {
		const active = [];
		const resolved = [];
		for ( const thread of tree ) {
			( thread.isResolved ? resolved : active ).push( thread );
		}
		return { activeThreads: active, resolvedThreads: resolved };
	}, [ tree ] );

	useEffect( () => {
		const recalcOutdated = () => {
			const doc = getIframeDoc();
			if ( ! doc ) {
				setOutdatedMap( {} );
				return;
			}
			// Builders like Bricks have no content wrapper; highlights fall back to the body too.
			const root = resolveCommentContentRoot( doc ) || doc.body;
			if ( ! root ) {
				setOutdatedMap( {} );
				return;
			}
			const next = {};
			for ( const c of comments ) {
				if ( c.parentId || ! c.blockClientId ) {
					continue;
				}
				next[ c.id ] = isAnchorOutdated( c, root );
			}
			setOutdatedMap( next );
		};

		recalcOutdated();

		window.addEventListener( 'flow:iframe-ready', recalcOutdated );
		window.addEventListener( 'flow:iframe-removed', recalcOutdated );
		window.addEventListener( 'flow:highlight-add', recalcOutdated );
		window.addEventListener( 'flow:highlight-remove', recalcOutdated );

		return () => {
			window.removeEventListener( 'flow:iframe-ready', recalcOutdated );
			window.removeEventListener( 'flow:iframe-removed', recalcOutdated );
			window.removeEventListener( 'flow:highlight-add', recalcOutdated );
			window.removeEventListener(
				'flow:highlight-remove',
				recalcOutdated
			);
		};
	}, [ comments ] );

	useEffect( () => {
		const onFocus = ( e ) => {
			const { commentId } = e.detail || {};
			if ( ! commentId ) {
				return;
			}
			// Wait for the sidebar to show the thread's tab; a hidden list cannot scroll.
			setTimeout(
				() => focusThread( threadRefs.current[ commentId ] ),
				60
			);
		};
		window.addEventListener( 'flow:inline-comment-focus', onFocus );
		return () =>
			window.removeEventListener( 'flow:inline-comment-focus', onFocus );
	}, [] );

	const handleReply = useCallback(
		async ( parentId, html, reopen = false ) => {
			const comment = await api.postComment( { html, parentId } );
			setComments( ( prev ) => {
				const cid = Number( comment.id );
				if ( prev.some( ( c ) => Number( c.id ) === cid ) ) {
					return prev;
				}
				return [ ...prev, comment ];
			} );
			if ( reopen ) {
				// The reply already posted above; reopening the thread is
				// best-effort on top of that. Letting this throw would leave
				// the editor thinking the whole submit failed — the reviewer
				// retries, and that posts a second copy of the same reply.
				try {
					await api.updateComment( parentId, { resolved: false } );
					const pid = Number( parentId );
					setComments( ( prev ) =>
						prev.map( ( c ) =>
							Number( c.id ) === pid
								? { ...c, isResolved: false }
								: c
						)
					);
					window.dispatchEvent(
						new CustomEvent( 'flow:highlight-resolve', {
							detail: { commentId: parentId, resolved: false },
						} )
					);
					window.dispatchEvent(
						new CustomEvent( 'flow:inline-comment-resolved', {
							detail: { commentId: parentId, resolved: false },
						} )
					);
				} catch ( err ) {
					// eslint-disable-next-line no-console
					console.warn(
						'[Flow] Reply posted, but reopening the thread failed.',
						err
					);
				}
			}
			window.dispatchEvent(
				new CustomEvent( 'flow:inline-comment-added', {
					detail: { comment },
				} )
			);
		},
		[ api, setComments ]
	);

	const handleEdit = useCallback(
		async ( id, html ) => {
			const nid = Number( id );
			await api.updateComment( id, { html } );
			setComments( ( prev ) =>
				prev.map( ( c ) =>
					Number( c.id ) === nid ? { ...c, html } : c
				)
			);
			window.dispatchEvent(
				new CustomEvent( 'flow:inline-comment-updated', {
					detail: { id, html },
				} )
			);
		},
		[ api, setComments ]
	);

	const handleResolve = useCallback(
		async ( id ) => {
			const nid = Number( id );
			await api.updateComment( id, { resolved: true } );
			setComments( ( prev ) =>
				prev.map( ( c ) =>
					Number( c.id ) === nid ? { ...c, isResolved: true } : c
				)
			);

			window.dispatchEvent(
				new CustomEvent( 'flow:highlight-resolve', {
					detail: { commentId: id },
				} )
			);
			window.dispatchEvent(
				new CustomEvent( 'flow:inline-comment-resolved', {
					detail: {
						commentId: id,
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
		},
		[ api, setComments ]
	);

	const handleDelete = useCallback(
		async ( id ) => {
			if (
				! ( await confirm( {
					title: __(
						'Delete this comment?',
						'jumplinks-editorial-workflow'
					),
					message: __(
						'This action cannot be undone.',
						'jumplinks-editorial-workflow'
					),
				} ) )
			) {
				return;
			}
			const nid = Number( id );
			try {
				await api.deleteComment( id );

				setComments( ( prev ) => {
					const deleted = prev.find(
						( c ) => Number( c.id ) === nid
					);
					if ( deleted && ! deleted.parentId ) {
						window.dispatchEvent(
							new CustomEvent( 'flow:highlight-remove', {
								detail: { commentId: id },
							} )
						);
					}
					return prev.filter( ( c ) => Number( c.id ) !== nid );
				} );
				window.dispatchEvent(
					new CustomEvent( 'flow:inline-comment-deleted', {
						detail: { id },
					} )
				);
			} catch ( err ) {
				// eslint-disable-next-line no-alert
				window.alert(
					err.message ||
						__(
							'Failed to delete comment.',
							'jumplinks-editorial-workflow'
						)
				);
			}
		},
		[ api, setComments, confirm ]
	);

	// Mirrors the other direction: clicking a highlight in the preview both
	// scrolls this panel to the thread AND opens the floating popover there
	// (`InlineThreadPopover`'s `flow:inline-comment-focus` listener). Clicking
	// the thread here should do the same round trip, not just flash the mark.
	const handleAnchorClick = useCallback( ( commentId, isResolved ) => {
		// On phones the panel covers the page, so close it to show the comment.
		if ( window.matchMedia?.( '(max-width: 782px)' )?.matches ) {
			window.dispatchEvent(
				new CustomEvent( 'flow:comments-sidebar-toggle', {
					detail: { open: false },
				} )
			);
		}
		window.dispatchEvent(
			new CustomEvent( 'flow:scroll-to-highlight', {
				detail: { commentId },
			} )
		);
		window.dispatchEvent(
			new CustomEvent( 'flow:inline-comment-focus', {
				detail: { commentId, isResolved: !! isResolved },
			} )
		);
	}, [] );

	const handleThreadSurfaceClick = useCallback(
		( event, commentId, isResolved ) => {
			if (
				event.target.closest(
					'button, a, input, textarea, select, [contenteditable="true"], .flow-comment-editor, .components-button, [role="menu"]'
				)
			) {
				return;
			}
			handleAnchorClick( commentId, isResolved );
		},
		[ handleAnchorClick ]
	);

	const threads =
		threadFilter === 'resolved' ? resolvedThreads : activeThreads;

	if (
		showEmptyState &&
		threadFilter === 'active' &&
		activeThreads.length === 0 &&
		resolvedThreads.length === 0
	) {
		return (
			<div className="flow-inline-comments-empty">
				<div
					className="flow-inline-comments-empty__icon-wrap"
					aria-hidden="true"
				>
					<Icon icon={ commentIcon } size={ 28 } />
				</div>
				<h3 className="flow-inline-comments-empty__title">
					{ __(
						'No inline comments yet',
						'jumplinks-editorial-workflow'
					) }
				</h3>
				<p className="flow-inline-comments-empty__lead">
					{ __(
						'Highlight text in the content preview, then choose "Add comment".',
						'jumplinks-editorial-workflow'
					) }
				</p>
				<ul className="flow-inline-comments-empty__list">
					<li>
						{ __(
							'Comments are tied to the exact words or media you select.',
							'jumplinks-editorial-workflow'
						) }
					</li>
					<li>
						{ __(
							'Click an image or video in the article to comment on media.',
							'jumplinks-editorial-workflow'
						) }
					</li>
					<li>
						{ __(
							'Click anywhere on the page to pin a comment to that spot.',
							'jumplinks-editorial-workflow'
						) }
					</li>
				</ul>
			</div>
		);
	}

	const renderThread = ( thread ) => {
		// A resolved comment's text is expected to be gone; it keeps View original, not the warning.
		// A pin points at a spot, not words: nothing to quote.
		const isPin = isPinThread( thread );
		const pinnedOn = pinDevice( thread );
		const otherDevice = !! pinnedOn && pinnedOn !== viewDevice;
		// On another screen size the spot is approximate, which says more than "outdated".
		const isOutdated =
			! thread.isResolved &&
			( otherDevice || !! outdatedMap[ thread.id ] );
		return (
			<div
				key={ thread.id }
				role="presentation"
				className={
					isOutdated
						? 'flow-inline-thread flow-inline-thread--outdated flow-inline-thread--navigable'
						: 'flow-inline-thread flow-inline-thread--navigable'
				}
				ref={ ( el ) => {
					threadRefs.current[ thread.id ] = el;
				} }
				onClick={ ( event ) =>
					handleThreadSurfaceClick(
						event,
						thread.id,
						thread.isResolved
					)
				}
				title={
					isPin
						? __(
								'Scroll to pinned comment',
								'jumplinks-editorial-workflow'
						  )
						: __(
								'Scroll to highlighted text',
								'jumplinks-editorial-workflow'
						  )
				}
			>
				{ isPin && ( otherDevice || isOutdated ) && (
					<div className="flow-inline-anchor flow-inline-anchor--outdated">
						{ otherDevice ? (
							<PinnedOnHint device={ pinnedOn } />
						) : (
							<OutdatedHint />
						) }
					</div>
				) }
				{ ! isPin && thread.anchorText && (
					<div
						className={ [
							'flow-inline-anchor',
							isOutdated && 'flow-inline-anchor--outdated',
							thread.isResolved && 'flow-inline-anchor--resolved',
						]
							.filter( Boolean )
							.join( ' ' ) }
					>
						<span className="flow-inline-anchor__text">
							&ldquo;
							{ thread.anchorText.length > 80
								? thread.anchorText.slice( 0, 80 ) + '\u2026'
								: thread.anchorText }
							&rdquo;
						</span>
						{ isOutdated && <OutdatedHint /> }
					</div>
				) }
				<CommentThread
					thread={ thread }
					onEdit={ handleEdit }
					onDelete={ handleDelete }
					onReply={ handleReply }
					onResolve={ handleResolve }
					suppressBodyExpandClick
					isOutdated={ isOutdated && ! otherDevice }
					showOnDevice={
						otherDevice && canPreviewDevices() ? pinnedOn : ''
					}
					onShowOnDevice={ showPinOnDevice }
				/>
			</div>
		);
	};

	if ( threads.length === 0 ) {
		return confirmDialog;
	}

	return (
		<>
			<div className="flow-comment-threads">
				{ [ ...threads ].reverse().map( renderThread ) }
			</div>
			{ confirmDialog }
		</>
	);
}
