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
import { deserializeRange } from '../utils/text-anchor';

/**
 * @param {object} [props]
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
	const threadRefs = useRef( {} );

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
			const root = resolveCommentContentRoot( doc );
			if ( ! root ) {
				setOutdatedMap( {} );
				return;
			}
			const next = {};
			for ( const c of comments ) {
				if ( c.parentId || ! c.blockClientId ) {
					continue;
				}
				try {
					const descriptor = JSON.parse( c.blockClientId );
					next[ c.id ] = ! deserializeRange( descriptor, root );
				} catch {
					next[ c.id ] = true;
				}
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

			const el = threadRefs.current[ commentId ];
			if ( el ) {
				el.scrollIntoView( { behavior: 'smooth', block: 'center' } );
			}
		};
		window.addEventListener( 'flow:inline-comment-focus', onFocus );
		return () =>
			window.removeEventListener( 'flow:inline-comment-focus', onFocus );
	}, [] );

	const handleReply = useCallback( async ( parentId, html ) => {
		const comment = await api.postComment( { html, parentId } );
		setComments( ( prev ) => {
			const cid = Number( comment.id );
			if ( prev.some( ( c ) => Number( c.id ) === cid ) ) {
				return prev;
			}
			return [ ...prev, comment ];
		} );
		window.dispatchEvent(
			new CustomEvent( 'flow:inline-comment-added', {
				detail: { comment },
			} )
		);
	}, [ api, setComments ] );

	const handleEdit = useCallback( async ( id, html ) => {
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
	}, [ api, setComments ] );

	const handleResolve = useCallback( async ( id ) => {
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
	}, [ api, setComments ] );

	const handleDelete = useCallback(
		async ( id ) => {
			const nid = Number( id );
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
			try {
				await api.deleteComment( id );

				setComments( ( prev ) => {
					const deleted = prev.find( ( c ) => Number( c.id ) === nid );
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

	const handleAnchorClick = useCallback( ( commentId ) => {
		window.dispatchEvent(
			new CustomEvent( 'flow:scroll-to-highlight', {
				detail: { commentId },
			} )
		);
	}, [] );

	const handleThreadSurfaceClick = useCallback( ( event, commentId ) => {
		if (
			event.target.closest(
				'button, a, input, textarea, select, [contenteditable="true"], .flow-comment-editor, .components-button, [role="menu"]'
			)
		) {
			return;
		}
		handleAnchorClick( commentId );
	}, [ handleAnchorClick ] );

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
				</ul>
			</div>
		);
	}

	const renderThread = ( thread ) => {
		const isOutdated = !! outdatedMap[ thread.id ];
		return (
			<div
				key={ thread.id }
				className={
					isOutdated
						? 'flow-inline-thread flow-inline-thread--outdated flow-inline-thread--navigable'
						: 'flow-inline-thread flow-inline-thread--navigable'
				}
				ref={ ( el ) => {
					threadRefs.current[ thread.id ] = el;
				} }
				onClick={ ( event ) =>
					handleThreadSurfaceClick( event, thread.id )
				}
				title={ __(
					'Scroll to highlighted text',
					'jumplinks-editorial-workflow'
				) }
			>
				{ thread.anchorText && (
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
								? thread.anchorText.slice( 0, 80 ) +
								  '\u2026'
								: thread.anchorText }
							&rdquo;
						</span>
						{ isOutdated && (
							<span className="flow-inline-anchor__hint">
								{ __(
									'Potentially outdated comment.',
									'jumplinks-editorial-workflow'
								) }
							</span>
						) }
					</div>
				) }
				<CommentThread
					thread={ thread }
					onEdit={ handleEdit }
					onDelete={ handleDelete }
					onReply={ handleReply }
					onResolve={ handleResolve }
					suppressBodyExpandClick
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
