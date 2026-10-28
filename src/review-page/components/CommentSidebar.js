import {
	useState,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useMemo,
} from '@wordpress/element';
import { Button } from '@wordpress/components';
import { closeSmall } from '@wordpress/icons';
import commentReplyIcon from '../icons/comment-reply';
import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { pageData, isReviewReadOnly } from '../utils/api';
import { mergeCommentLists } from '../utils/comment-sync';
import { defaultCommentApi } from '../utils/comment-api';
import {
	countResolvedCommentThreads,
	countUnresolvedCommentThreads,
} from '../utils/review-comment-totals';
import CommentEditor from './CommentEditor';
import CommentThread from './CommentThread';
import InlineCommentsPanel from './InlineCommentsPanel';
import { buildCommentTree } from '../utils/comment-tree';
import { useConfirmDialog } from '../hooks/use-confirm-dialog';
import { useSingleCommentForm } from '../utils/single-comment-form';
import { isCommentOnPage } from '../../shared/same-review-page';

const SIDEBAR_TABS = [
	{
		name: 'comments',
		title: __( 'Comments', 'jumplinks-editorial-workflow' ),
	},
	{
		name: 'resolved',
		title: __( 'Resolved', 'jumplinks-editorial-workflow' ),
	},
];

function readStoredActiveTab() {
	const stored = sessionStorage.getItem( 'flow_active_tab' );
	if ( stored === 'resolved' ) {
		return 'resolved';
	}
	// Legacy tab ids from the Review + Comments layout.
	if ( stored === 'review' || stored === 'comments' ) {
		return 'comments';
	}
	return 'comments';
}

/**
 * @param {Object} [props]
 * @param {import('../utils/comment-api').CommentApi} [props.api]
 * @param {boolean} [props.showEditor]
 * @param {'active'|'resolved'} [props.threadFilter]
 * @param {Array} props.comments
 * @param {Function} props.setComments
 */
function GeneralCommentsPanel( {
	api = defaultCommentApi,
	showEditor = true,
	threadFilter = 'active',
	comments,
	setComments,
} ) {
	const { confirm, confirmDialog } = useConfirmDialog();
	// The general comment form opens on demand and shares the one-open-form rule.
	const [ composing, setComposing ] = useState( false );
	useSingleCommentForm( composing, () => setComposing( false ) );

	const tree = useMemo( () => buildCommentTree( comments ), [ comments ] );
	const { activeThreads, resolvedThreads } = useMemo( () => {
		const active = [];
		const resolved = [];
		for ( const thread of tree ) {
			( thread.isResolved ? resolved : active ).push( thread );
		}
		return { activeThreads: active, resolvedThreads: resolved };
	}, [ tree ] );

	const appendComment = useCallback(
		( comment ) => {
			setComments( ( prev ) =>
				prev.some( ( c ) => c.id === comment.id )
					? prev
					: [ ...prev, comment ]
			);
		},
		[ setComments ]
	);

	const handleSubmit = useCallback(
		async ( html ) => {
			const comment = await api.postComment( { html } );
			appendComment( comment );
			window.dispatchEvent(
				new CustomEvent( 'flow:author-resubmit-activity', {
					detail: {
						userId: pageData.currentUserId,
						kind: 'comment_added',
					},
				} )
			);
		},
		[ api, appendComment ]
	);

	const handleReply = useCallback(
		async ( parentId, html, reopen = false ) => {
			const comment = await api.postComment( { html, parentId } );
			appendComment( comment );
			if ( reopen ) {
				await api.updateComment( parentId, { resolved: false } );
				setComments( ( prev ) =>
					prev.map( ( c ) =>
						c.id === parentId ? { ...c, isResolved: false } : c
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
			}
			window.dispatchEvent(
				new CustomEvent( 'flow:author-resubmit-activity', {
					detail: {
						userId: pageData.currentUserId,
						kind: 'comment_added',
					},
				} )
			);
		},
		[ api, appendComment, setComments ]
	);

	const handleEdit = useCallback(
		async ( id, html ) => {
			await api.updateComment( id, { html } );
			let syncInline = false;
			setComments( ( prev ) => {
				const cur = prev.find( ( c ) => c.id === id );
				syncInline = !! ( cur?.blockClientId || cur?.anchorText );
				return prev.map( ( c ) =>
					c.id === id ? { ...c, html } : c
				);
			} );
			if ( syncInline ) {
				window.dispatchEvent(
					new CustomEvent( 'flow:inline-comment-updated', {
						detail: { id, html },
					} )
				);
			}
		},
		[ api, setComments ]
	);

	const handleResolve = useCallback(
		async ( id ) => {
			await api.updateComment( id, { resolved: true } );
			let syncInline = false;
			setComments( ( prev ) => {
				const cur = prev.find( ( c ) => c.id === id );
				syncInline = !! ( cur?.blockClientId || cur?.anchorText );
				return prev.map( ( c ) =>
					c.id === id ? { ...c, isResolved: true } : c
				);
			} );
			if ( syncInline ) {
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
			}
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
			try {
				const deleted = comments.find( ( c ) => c.id === id );
				const syncInline = !! (
					deleted &&
					( deleted.blockClientId || deleted.anchorText ) &&
					! deleted.parentId
				);
				await api.deleteComment( id );
				setComments( ( prev ) => prev.filter( ( c ) => c.id !== id ) );
				if ( syncInline ) {
					window.dispatchEvent(
						new CustomEvent( 'flow:highlight-remove', {
							detail: { commentId: id },
						} )
					);
				}
				if (
					deleted &&
					( deleted.blockClientId || deleted.anchorText )
				) {
					window.dispatchEvent(
						new CustomEvent( 'flow:inline-comment-deleted', {
							detail: { id },
						} )
					);
				}
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
		[ comments, api, confirm, setComments ]
	);

	const threads =
		threadFilter === 'resolved' ? resolvedThreads : activeThreads;

	const readOnly = isReviewReadOnly();

	return (
		<>
			{ showEditor && ! readOnly && composing && (
				<div className="flow-sidebar__body">
					{ applyFilters(
						'flow_ew_comment_editor_extras',
						null,
						{}
					) }
					<CommentEditor
						onSubmit={ async ( html ) => {
							await handleSubmit( html );
							setComposing( false );
						} }
						onCancel={ () => setComposing( false ) }
						clearDraftOnCancel
						autoFocus
					/>
				</div>
			) }
			{ showEditor && ! readOnly && ! composing && (
				<div className="flow-sidebar__body">
					<Button
						icon={ commentReplyIcon }
						className="flow-btn--text flow-comment-thread__reply-btn flow-sidebar__add-general"
						onClick={ () => setComposing( true ) }
					>
						{ __(
							'Add general comment',
							'jumplinks-editorial-workflow'
						) }
					</Button>
				</div>
			) }
			{ threads.length > 0 && (
				<div className="flow-comment-threads">
					{ [ ...threads ].reverse().map( ( thread ) => (
						<CommentThread
							key={ thread.id }
							thread={ thread }
							onEdit={ readOnly ? undefined : handleEdit }
							onDelete={ readOnly ? undefined : handleDelete }
							onReply={ readOnly ? undefined : handleReply }
							onResolve={ readOnly ? undefined : handleResolve }
						/>
					) ) }
				</div>
			) }
			{ confirmDialog }
		</>
	);
}

/**
 * Site review: general threads belong to the page they were started on.
 * Replies follow their thread wherever they were written.
 *
 * @param {Array}  comments
 * @param {string} pageUrl  Page in view; empty on a single-post review.
 * @return {Array} Comments of threads started on that page.
 */
function generalCommentsForPage( comments, pageUrl, pagePostId ) {
	if ( ! pageUrl ) {
		return comments;
	}
	const byId = new Map( comments.map( ( c ) => [ Number( c.id ), c ] ) );
	const rootOf = ( c ) => {
		let node = c;
		const seen = new Set();
		while (
			node &&
			Number( node.parentId || 0 ) > 0 &&
			! seen.has( node.id )
		) {
			seen.add( node.id );
			node = byId.get( Number( node.parentId ) ) || null;
		}
		return node || c;
	};
	return comments.filter( ( c ) => {
		const root = rootOf( c );
		return (
			( ! root.url && ! Number( root.postId || 0 ) ) ||
			isCommentOnPage( root, pageUrl, pagePostId )
		);
	} );
}

function initialGeneralForPage() {
	return generalCommentsForPage(
		pageData.comments || [],
		window.flowCommentsPageUrl || '',
		window.flowCommentsPagePostId || 0
	);
}

function tabCountLabel( tabName, count ) {
	/* translators: %d: number of unresolved comment threads */
	const unresolved = __(
		'Unresolved comment threads: %d',
		'jumplinks-editorial-workflow'
	);
	/* translators: %d: number of resolved comment threads */
	const resolved = __(
		'Resolved comment threads: %d',
		'jumplinks-editorial-workflow'
	);
	const format = tabName === 'comments' ? unresolved : resolved;
	return sprintf( format, count );
}

/**
 * @param {Object} [props]
 * @param {{
 *   postComment: Function,
 *   updateComment: Function,
 *   deleteComment: Function,
 * }} [props.api]
 *   Backend adapter for comment mutations. Defaults to the single-post
 *   review namespace (`flow/v1/reviews/{id}/comments`). Pro's site-review
 *   chrome passes an adapter that targets the `flow-pro/v1/site-reviews/`
 *   namespace.
 * @param {React.ReactNode} [props.reviewIntro]
 *   Optional node rendered at the top of the Comments tab, above the
 *   general-comments editor. Site-review uses this to show the
 *   requester's "message to reviewer" callout so it's the first thing
 *   the reviewer reads when the chrome opens.
 */
export default function CommentSidebar( {
	api = defaultCommentApi,
	reviewIntro = null,
} = {} ) {
	const hostRef = useRef( null );
	const [ allGeneralComments, setGeneralComments ] = useState(
		() => pageData.comments || []
	);
	const [ pageUrl, setPageUrl ] = useState(
		() => window.flowCommentsPageUrl || ''
	);
	const [ pagePostId, setPagePostId ] = useState(
		() => window.flowCommentsPagePostId || 0
	);
	useEffect( () => {
		const onPage = ( e ) => {
			setPageUrl( e.detail?.url || '' );
			setPagePostId( e.detail?.postId || 0 );
		};
		window.addEventListener( 'flow:comments-page-url', onPage );
		return () =>
			window.removeEventListener( 'flow:comments-page-url', onPage );
	}, [] );
	const generalComments = useMemo(
		() => generalCommentsForPage( allGeneralComments, pageUrl, pagePostId ),
		[ allGeneralComments, pageUrl, pagePostId ]
	);
	const [ inlineComments, setInlineComments ] = useState(
		() => pageData.inlineComments || []
	);
	const pendingInlineResolvedRef = useRef( new Set() );
	const scrollRef = useRef( null );
	const [ activeTab, setActiveTab ] = useState( readStoredActiveTab );
	const inlineCommentsRef = useRef( inlineComments );
	inlineCommentsRef.current = inlineComments;
	// Clicking a highlight shows its thread: resolved ones live on the Resolved tab.
	useEffect( () => {
		const onFocus = ( e ) => {
			const id = Number( e.detail?.commentId || 0 );
			// The highlight knows best: a resolve from the popover may not have reached this list yet.
			let resolved = e.detail?.isResolved;
			if ( undefined === resolved ) {
				const comment = inlineCommentsRef.current.find(
					( c ) => Number( c.id ) === id
				);
				resolved = !! comment?.isResolved;
			}
			setActiveTab( resolved ? 'resolved' : 'comments' );
		};
		window.addEventListener( 'flow:inline-comment-focus', onFocus );
		return () =>
			window.removeEventListener( 'flow:inline-comment-focus', onFocus );
	}, [] );
	const [ reviewUnresolved, setReviewUnresolved ] = useState( () =>
		countUnresolvedCommentThreads( initialGeneralForPage() )
	);
	const [ inlineUnresolved, setInlineUnresolved ] = useState( () =>
		countUnresolvedCommentThreads( pageData.inlineComments || [] )
	);
	const [ reviewResolved, setReviewResolved ] = useState( () =>
		countResolvedCommentThreads( initialGeneralForPage() )
	);
	const [ inlineResolved, setInlineResolved ] = useState( () =>
		countResolvedCommentThreads( pageData.inlineComments || [] )
	);
	const commentsUnresolved = reviewUnresolved + inlineUnresolved;
	const commentsResolved = reviewResolved + inlineResolved;
	const generalResolvedCount = countResolvedCommentThreads( generalComments );
	const generalUnresolvedCount =
		countUnresolvedCommentThreads( generalComments );
	const inlineResolvedCount = countResolvedCommentThreads( inlineComments );
	const inlineUnresolvedCount =
		countUnresolvedCommentThreads( inlineComments );
	const showCommentsDelimiter =
		generalUnresolvedCount > 0 && inlineUnresolvedCount > 0;
	const showResolvedDelimiter =
		generalResolvedCount > 0 && inlineResolvedCount > 0;
	const closeSidebar = useCallback( () => {
		window.dispatchEvent(
			new CustomEvent( 'flow:comments-sidebar-toggle', {
				detail: { open: false },
			} )
		);
	}, [] );

	useEffect( () => {
		sessionStorage.setItem( 'flow_active_tab', activeTab );
	}, [ activeTab ] );

	useEffect( () => {
		window.dispatchEvent(
			new CustomEvent( 'flow:comment-count', {
				detail: {
					total: generalComments.length,
					unresolved:
						countUnresolvedCommentThreads( generalComments ),
					resolved: countResolvedCommentThreads( generalComments ),
				},
			} )
		);
	}, [ generalComments ] );

	useEffect( () => {
		window.dispatchEvent(
			new CustomEvent( 'flow:inline-comment-stats', {
				detail: {
					total: inlineComments.length,
					unresolved: countUnresolvedCommentThreads( inlineComments ),
					resolved: countResolvedCommentThreads( inlineComments ),
				},
			} )
		);
	}, [ inlineComments ] );

	useEffect( () => {
		const onAdded = ( e ) => {
			const { comment } = e.detail || {};
			if ( ! comment ) {
				return;
			}
			const cid = Number( comment.id );
			const forceResolved = pendingInlineResolvedRef.current.has( cid );
			if ( forceResolved ) {
				pendingInlineResolvedRef.current.delete( cid );
			}
			setInlineComments( ( prev ) => {
				if ( prev.some( ( c ) => Number( c.id ) === cid ) ) {
					return prev;
				}
				return [
					...prev,
					{
						...comment,
						isResolved: forceResolved || !! comment.isResolved,
					},
				];
			} );
		};
		const onResolved = ( e ) => {
			const cid = Number( e.detail?.commentId );
			if ( ! cid ) {
				return;
			}
			// Reopening a thread sends the same event with `resolved: false`.
			const resolved = e.detail?.resolved ?? true;
			setInlineComments( ( prev ) => {
				const has = prev.some( ( c ) => Number( c.id ) === cid );
				if ( ! has ) {
					if ( resolved ) {
						pendingInlineResolvedRef.current.add( cid );
					} else {
						pendingInlineResolvedRef.current.delete( cid );
					}
					return prev;
				}
				pendingInlineResolvedRef.current.delete( cid );
				return prev.map( ( c ) =>
					Number( c.id ) === cid ? { ...c, isResolved: resolved } : c
				);
			} );
		};
		const onReset = ( e ) => {
			const next = e.detail?.comments;
			if ( Array.isArray( next ) ) {
				pendingInlineResolvedRef.current.clear();
				setInlineComments( ( prev ) =>
					mergeCommentLists( prev, next )
				);
			}
		};
		const onGeneralReset = ( e ) => {
			const next = e.detail?.comments;
			if ( Array.isArray( next ) ) {
				setGeneralComments( ( prev ) =>
					mergeCommentLists( prev, next )
				);
			}
		};
		window.addEventListener( 'flow:inline-comment-added', onAdded );
		window.addEventListener( 'flow:inline-comment-resolved', onResolved );
		window.addEventListener( 'flow:inline-comments-reset', onReset );
		window.addEventListener(
			'flow:general-comments-reset',
			onGeneralReset
		);
		return () => {
			window.removeEventListener(
				'flow:general-comments-reset',
				onGeneralReset
			);
			window.removeEventListener( 'flow:inline-comment-added', onAdded );
			window.removeEventListener(
				'flow:inline-comment-resolved',
				onResolved
			);
			window.removeEventListener( 'flow:inline-comments-reset', onReset );
		};
	}, [] );

	useEffect( () => {
		const host =
			document.getElementById( 'flow-sidebar-host' ) ||
			hostRef.current?.getRootNode()?.host;
		if ( ! host ) {
			return undefined;
		}
		const startOpen = window.innerWidth >= 782;
		host.setAttribute( 'data-open', startOpen ? 'true' : 'false' );
		document.body.classList.toggle(
			'flow-review-page--comments-closed',
			! startOpen
		);

		const onToggle = ( e ) => {
			if ( typeof e.detail?.open !== 'boolean' ) {
				return;
			}
			const open = e.detail.open;
			host.setAttribute( 'data-open', open ? 'true' : 'false' );
			document.body.classList.toggle(
				'flow-review-page--comments-closed',
				! open
			);
		};

		window.addEventListener( 'flow:comments-sidebar-toggle', onToggle );
		return () =>
			window.removeEventListener(
				'flow:comments-sidebar-toggle',
				onToggle
			);
	}, [] );

	useEffect( () => {
		const onToggleTab = ( e ) => {
			const tab = e.detail?.tab;
			if (
				e.detail?.open &&
				( 'comments' === tab || 'resolved' === tab )
			) {
				setActiveTab( tab );
			}
		};
		window.addEventListener( 'flow:comments-sidebar-toggle', onToggleTab );
		return () =>
			window.removeEventListener(
				'flow:comments-sidebar-toggle',
				onToggleTab
			);
	}, [] );

	useEffect( () => {
		const onSwitchToComments = () => setActiveTab( 'comments' );
		window.addEventListener(
			'flow:inline-comment-added',
			onSwitchToComments
		);
		return () => {
			window.removeEventListener(
				'flow:inline-comment-added',
				onSwitchToComments
			);
		};
	}, [] );

	useEffect( () => {
		const onGeneral = ( e ) => {
			const d = e.detail;
			if ( typeof d === 'object' && d !== null && 'unresolved' in d ) {
				setReviewUnresolved( Number( d.unresolved ) || 0 );
			}
			if ( typeof d === 'object' && d !== null && 'resolved' in d ) {
				setReviewResolved( Number( d.resolved ) || 0 );
			}
		};
		const onInline = ( e ) => {
			const d = e.detail;
			if ( typeof d === 'object' && d !== null && 'unresolved' in d ) {
				setInlineUnresolved( Number( d.unresolved ) || 0 );
			}
			if ( typeof d === 'object' && d !== null && 'resolved' in d ) {
				setInlineResolved( Number( d.resolved ) || 0 );
			}
		};
		window.addEventListener( 'flow:comment-count', onGeneral );
		window.addEventListener( 'flow:inline-comment-stats', onInline );
		return () => {
			window.removeEventListener( 'flow:comment-count', onGeneral );
			window.removeEventListener( 'flow:inline-comment-stats', onInline );
		};
	}, [] );

	const tabsList = (
		<div className="flow-sidebar__tabs" role="tablist">
			{ SIDEBAR_TABS.map( ( tab ) => {
				const count =
					tab.name === 'comments'
						? commentsUnresolved
						: commentsResolved;
				const countClass =
					tab.name === 'comments'
						? 'flow-sidebar__tab-count--comments'
						: 'flow-sidebar__tab-count--resolved';
				return (
					<button
						key={ tab.name }
						type="button"
						role="tab"
						aria-selected={ activeTab === tab.name }
						className={ `flow-sidebar__tab${
							activeTab === tab.name
								? ' flow-sidebar__tab--active'
								: ''
						}` }
						onClick={ () => setActiveTab( tab.name ) }
					>
						<span className="flow-sidebar__tab-label">
							{ tab.title }
						</span>
						{ count > 0 ? (
							<span
								className={ `flow-sidebar__tab-count ${ countClass }` }
								aria-label={ tabCountLabel( tab.name, count ) }
							>
								{ count }
							</span>
						) : null }
					</button>
				);
			} ) }
		</div>
	);

	// Threads render newest-first, so a comment arriving from another reviewer
	// is inserted above the viewport and would otherwise shove the list down.
	const prevScrollHeightRef = useRef( 0 );
	useLayoutEffect( () => {
		const el = scrollRef.current;
		if ( ! el ) {
			return;
		}
		const previous = prevScrollHeightRef.current;
		prevScrollHeightRef.current = el.scrollHeight;
		if ( previous && el.scrollTop > 0 && el.scrollHeight !== previous ) {
			el.scrollTop += el.scrollHeight - previous;
		}
	}, [ generalComments, inlineComments ] );

	// Extensions (site review) can pin actions to the bottom; shown on mobile only.
	const sidebarFooter = applyFilters( 'flow_ew_review_sidebar_footer', null );

	return (
		<div className="flow-sidebar" ref={ hostRef }>
			<div className="flow-sidebar__tablist-and-close">
				<div className="flow-sidebar__header">
					{ tabsList }
					<Button
						icon={ closeSmall }
						className="flow-sidebar__header-close"
						label={ __( 'Close', 'jumplinks-editorial-workflow' ) }
						onClick={ closeSidebar }
					/>
				</div>
				<div className="flow-sidebar__tab-panel">
					<div
						className="flow-sidebar__tab-scroll"
						role="tabpanel"
						ref={ scrollRef }
					>
						<div
							className="flow-sidebar__tab-content"
							style={
								activeTab !== 'comments'
									? { display: 'none' }
									: undefined
							}
						>
							{ reviewIntro }
							<GeneralCommentsPanel
								api={ api }
								comments={ generalComments }
								setComments={ setGeneralComments }
								showEditor
								threadFilter="active"
							/>
							{ showCommentsDelimiter ? (
								<div
									className="flow-sidebar__section-divider"
									role="separator"
									aria-hidden="true"
								/>
							) : null }
							<InlineCommentsPanel
								api={ api }
								comments={ inlineComments }
								setComments={ setInlineComments }
								threadFilter="active"
								showEmptyState
							/>
						</div>
						<div
							className="flow-sidebar__tab-content"
							style={
								activeTab !== 'resolved'
									? { display: 'none' }
									: undefined
							}
						>
							{ commentsResolved === 0 ? (
								<div className="flow-sidebar__placeholder">
									{ __(
										'No resolved comments yet.',
										'jumplinks-editorial-workflow'
									) }
								</div>
							) : (
								<>
									{ generalResolvedCount > 0 ? (
										<GeneralCommentsPanel
											api={ api }
											comments={ generalComments }
											setComments={ setGeneralComments }
											showEditor={ false }
											threadFilter="resolved"
										/>
									) : null }
									{ showResolvedDelimiter ? (
										<div
											className="flow-sidebar__section-divider"
											role="separator"
											aria-hidden="true"
										/>
									) : null }
									<InlineCommentsPanel
										api={ api }
										comments={ inlineComments }
										setComments={ setInlineComments }
										threadFilter="resolved"
									/>
								</>
							) }
						</div>
					</div>
				</div>
				{ sidebarFooter ? (
					<div className="flow-sidebar__footer">
						{ sidebarFooter }
					</div>
				) : null }
			</div>
		</div>
	);
}
