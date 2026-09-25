import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { Button, Tooltip } from '@wordpress/components';
import { arrowLeft } from '@wordpress/icons';

/**
 * Gutenberg Settings sidebar icon — a rectangle with a vertical divider
 * representing content + sidebar. Lifted from the block editor so the
 * Review-sidebar toggle reads as the same affordance.
 */
const sidebarIcon = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-4 14.5H6c-.3 0-.5-.2-.5-.5V6c0-.3.2-.5.5-.5h8v13zm4.5-.5c0 .3-.2.5-.5.5h-2.5v-13H18c.3 0 .5.2.5.5v12z"
		/>
	</svg>
);
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import flowFetch, { pageData } from '../utils/api';
import { setIframe, clearIframe } from '../utils/iframe-bridge';
import { useReviewCommentTotals } from '../utils/review-comment-totals';
import { STATUS_LABELS } from '../../shared/status-labels';
import alertWarningIcon from '../icons/alert-warning';
import ViewDropdown from './ViewDropdown';
import WpLogoButton from './WpLogoButton';
import ReviewActions from './ReviewActions';
import {
	sameOriginIframeSrc,
	stampCanvasMarkerOnLinks,
} from '../utils/canvas-marker';

/**
 * Keep in sync with `$sidebar-width` / `$activity-sidebar-width` in
 *  `_tokens.scss` and the Pro activity sidebar's own host width.
 */
const COMMENTS_SIDEBAR_WIDTH_PX = 360;
const ACTIVITY_SIDEBAR_WIDTH_PX = 260;
const DEVICE_WIDTHS = { tablet: 780, mobile: 360 };

/**
 * Keep in sync with `$mobile-bp` in `_tokens.scss`. Below this, the sidebar
 *  overlays the content instead of pushing it, so it must contribute 0 to
 *  iframe-canvas math.
 */
const MOBILE_BP_PX = 782;
const isMobileViewport = () => window.innerWidth < MOBILE_BP_PX;

/**
 * Top bar for the review chrome.
 *
 * @param {Object}      [props]
 * @param {'review'|'site-review'} [props.mode]
 *   `'review'` (default): renders the per-post bar with status badge,
 *   ViewDropdown, default Approve / Request Changes / Resubmit / Revoke
 *   actions.
 *   `'site-review'`: drops the badge + ViewDropdown + default action
 *   cluster. The caller is expected to provide `actionsSlot` and to
 *   localize `pageData` with the site-review title/requester values.
 *   Revision-status meta and the edit-post icon are still suppressed
 *   automatically when their underlying `pageData` fields are empty (no
 *   mode check needed), so site-review just leaves those fields blank.
 * @param {React.ReactNode} [props.actionsSlot]
 *   When provided, rendered to the right of the sidebar toggle INSTEAD
 *   of the default Approve / Request Changes / Resubmit / Revoke
 *   buttons. Lets Pro inject custom action buttons (Site Review uses
 *   "Send feedback" and "Exit review").
 */
export default function ReviewBar( {
	mode = 'review',
	actionsSlot = null,
} = {} ) {
	const isSiteReview = mode === 'site-review';
	const {
		postTitle = '',
		postTypeLabel = '',
		snapshotLabel = '',
		status = '',
		displayStatus = '',
		wpLogoUrl = '/',
		postEditUrl = '',
		postUrl = '',
		canAct = false,
		reviewId = 0,
		debugMode = false,
		currentUserId = 0,
		currentUserIsAdmin = false,
		currentUserIsPostAuthor = false,
		comments = [],
		inlineComments = [],
		revisionStatus: initialRevisionStatus = null,
		latestRevisionUrl: initialLatestRevisionUrl = '',
		reviewers = [],
		isEmailInvitee = false,
		inviteSyntheticId = 0,
	} = pageData;

	const effectiveUserId = isEmailInvitee
		? Number( inviteSyntheticId || 0 )
		: Number( currentUserId );

	const [ actionStatus, setActionStatus ] = useState( null );
	useEffect( () => {
		if ( ! actionStatus ) {
			return undefined;
		}
		const t = setTimeout( () => setActionStatus( null ), 10_000 );
		return () => clearTimeout( t );
	}, [ actionStatus ] );
	const [ isBusy, setIsBusy ] = useState( false );
	const [ revisionStatus, setRevisionStatus ] = useState(
		initialRevisionStatus
	);
	const [ latestRevisionUrl, setLatestRevisionUrl ] = useState(
		initialLatestRevisionUrl
	);
	const revisionStatusRef = useRef( initialRevisionStatus );
	useEffect( () => {
		const onRevisionChanged = ( e ) => {
			const next = e.detail?.revisionStatus ?? null;
			const wasOutdated = revisionStatusRef.current === 'outdated';
			revisionStatusRef.current = next;
			setRevisionStatus( next );
			setLatestRevisionUrl( e.detail?.latestRevisionUrl || '' );
			if ( 'outdated' === next ) {
				// A newer version is exactly what the mount-time check counts
				// as resubmittable activity; without this the author is told
				// there is one while Resubmit stays disabled until a reload.
				setHasAuthorResubmitActivity( true );
			}
			// Only on the way in: a later poll still reports `outdated`, and
			// re-announcing it every time would nag.
			if ( 'outdated' === next && ! wasOutdated ) {
				setActionStatus( {
					type: 'info',
					message: __(
						'The author published a new version of this content.',
						'jumplinks-editorial-workflow'
					),
					linkUrl: e.detail?.latestRevisionUrl || '',
					// Same wording as the bar's own link, so one action reads
					// the same way in both places.
					linkLabel: __(
						'View the latest version',
						'jumplinks-editorial-workflow'
					),
				} );
			}
		};
		window.addEventListener( 'flow:revision-changed', onRevisionChanged );
		return () =>
			window.removeEventListener(
				'flow:revision-changed',
				onRevisionChanged
			);
	}, [] );
	const [ currentStatus, setCurrentStatus ] = useState(
		displayStatus || status
	);
	// Two independent panels: comments (right, default open on desktop) and
	// activity (left, default closed).
	const [ commentsOpen, setCommentsOpen ] = useState(
		() => ! isMobileViewport()
	);
	const [ activityOpen, setActivityOpen ] = useState( false );
	const [ device, setDevice ] = useState( 'desktop' );
	const previousDeviceRef = useRef( 'desktop' );
	const iframeLoadedRef = useRef( false );
	const [ hasAuthorResubmitActivity, setHasAuthorResubmitActivity ] =
		useState( () => {
			const hasNewerRevision = revisionStatus === 'outdated';
			const hasOwnComment = [ ...comments, ...inlineComments ].some(
				( comment ) =>
					Number( comment?.authorId || 0 ) === Number( currentUserId )
			);
			return hasNewerRevision || hasOwnComment;
		} );
	const iframeRef = useRef( null );
	const currentUserIdRef = useRef( currentUserId );
	currentUserIdRef.current = currentUserId;

	const onInlineCommentForResubmit = useCallback( ( e ) => {
		const authorId = Number( e?.detail?.comment?.authorId || 0 );
		if ( authorId > 0 && authorId === Number( currentUserIdRef.current ) ) {
			setHasAuthorResubmitActivity( true );
		}
	}, [] );

	const totalCommentCount = useReviewCommentTotals(
		onInlineCommentForResubmit
	);

	useEffect( () => {
		if ( iframeRef.current ) {
			return;
		}

		const iframe = document.createElement( 'iframe' );
		iframe.id = 'flow-template-frame';
		iframe.src = sameOriginIframeSrc( pageData.contentOnlyUrl || '' );
		document.body.appendChild( iframe );
		iframeRef.current = iframe;

		// Site-review iframes get a load handler too — same `flow:iframe-ready`
		iframe.addEventListener( 'load', () => {
			iframeLoadedRef.current = true;
			setIframe( iframe );
			try {
				stampCanvasMarkerOnLinks( iframe.contentDocument );
			} catch {
				// cross-origin transient or contentDocument null — non-fatal
			}
			window.dispatchEvent(
				new CustomEvent( 'flow:iframe-ready', { detail: { iframe } } )
			);
		} );

		return () => {
			if ( iframeRef.current ) {
				window.dispatchEvent(
					new CustomEvent( 'flow:iframe-removed' )
				);
				clearIframe();
				iframeRef.current.remove();
				iframeRef.current = null;
			}
		};
	}, [] );

	useEffect( () => {
		if ( ! iframeRef.current ) {
			return;
		}
		const iframe = iframeRef.current;
		const barHost = document.getElementById( 'flow-bar-host' );

		const apply = () => {
			const barHeight = Math.round(
				barHost?.getBoundingClientRect?.().height || 64
			);
			// On mobile both sidebars overlay the content (see style.scss
			// $mobile-bp), so neither contributes to canvas math.
			const mobile = isMobileViewport();
			const rightSidebar =
				commentsOpen && ! mobile ? COMMENTS_SIDEBAR_WIDTH_PX : 0;
			const leftSidebar =
				activityOpen && ! mobile ? ACTIVITY_SIDEBAR_WIDTH_PX : 0;
			const visualWidth = Math.max(
				0,
				window.innerWidth - rightSidebar - leftSidebar
			);
			const visualHeight = Math.max( 0, window.innerHeight - barHeight );

			const isDeviceMode = device === 'tablet' || device === 'mobile';
			const designedWidth = DEVICE_WIDTHS[ device ] || window.innerWidth;

			// Desktop: scale to fill the area between the two sidebars.
			const rawScale =
				designedWidth > 0 ? visualWidth / designedWidth : 1;
			const scale = isDeviceMode ? Math.min( 1, rawScale ) : rawScale;
			const designedHeight =
				scale > 0 ? visualHeight / scale : visualHeight;
			const visualDesignedWidth = designedWidth * scale;
			const leftOffset = isDeviceMode
				? leftSidebar +
				  Math.max( 0, ( visualWidth - visualDesignedWidth ) / 2 )
				: leftSidebar;

			iframe.style.cssText =
				`position:fixed;top:${ barHeight }px;left:${ leftOffset }px;` +
				`width:${ designedWidth }px;height:${ designedHeight }px;` +
				`transform:scale(${ scale });transform-origin:top left;` +
				`border:none;z-index:0;background:#fff;` +
				`box-shadow:${
					isDeviceMode
						? '0 0 0 1px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)'
						: 'none'
				};` +
				`transition:left 180ms ease,transform 180ms ease,width 180ms ease;`;

			document.body.classList.toggle(
				'flow-device-preview',
				isDeviceMode
			);
		};

		apply();
		window.addEventListener( 'resize', apply );
		return () => window.removeEventListener( 'resize', apply );
	}, [ commentsOpen, activityOpen, device ] );

	// Resizing the frame alone leaves a theme that wires its nav at load with
	// desktop behaviour at mobile width, so reload and let it boot at the new
	// size. Comment highlights survive: the manager re-wraps on every
	// `flow:iframe-ready`, which the load handler above fires again.
	useEffect( () => {
		const iframe = iframeRef.current;
		if ( ! iframe || previousDeviceRef.current === device ) {
			return;
		}
		const hadLoaded = iframeLoadedRef.current;
		previousDeviceRef.current = device;
		if ( ! hadLoaded ) {
			// Still loading its first document — it will use the new width.
			return;
		}

		let scrollY = 0;
		try {
			scrollY = iframe.contentWindow?.scrollY || 0;
		} catch {
			// cross-origin: reload without restoring
		}

		// The sizing effect just set the new width; flush it into layout or
		// the document reloads at the old one.
		void iframe.offsetWidth;

		const restoreScroll = () => {
			iframe.removeEventListener( 'load', restoreScroll );
			if ( ! scrollY ) {
				return;
			}
			try {
				iframe.contentWindow?.scrollTo( 0, scrollY );
			} catch {
				// the new document is shorter, or gone
			}
		};
		iframe.addEventListener( 'load', restoreScroll );

		try {
			iframe.contentWindow.location.reload();
		} catch {
			iframe.removeEventListener( 'load', restoreScroll );
		}
	}, [ device ] );

	const isExternalCommentsToggleRef = useRef( false );

	const toggleComments = useCallback( () => {
		setCommentsOpen( ( prev ) => ! prev );
	}, [] );

	useEffect( () => {
		if ( isExternalCommentsToggleRef.current ) {
			isExternalCommentsToggleRef.current = false;
			return;
		}
		window.dispatchEvent(
			new CustomEvent( 'flow:comments-sidebar-toggle', {
				detail: { open: commentsOpen },
			} )
		);
		// Our own listener runs synchronously during dispatch and sets the ref
		// to skip a redundant setState. Clear it again so the next bar-toggle
		// still broadcasts to CommentSidebar (which drives data-open / body class).
		isExternalCommentsToggleRef.current = false;
	}, [ commentsOpen ] );

	useEffect( () => {
		const onCommentsToggle = ( e ) => {
			if ( typeof e.detail?.open !== 'boolean' ) {
				return;
			}
			isExternalCommentsToggleRef.current = true;
			setCommentsOpen( e.detail.open );
		};
		const onActivityToggle = ( e ) => setActivityOpen( e.detail.open );
		const onStatusChange = ( e ) => {
			setCurrentStatus( e.detail.status || '' );
			if ( Object.prototype.hasOwnProperty.call( e.detail, 'myVote' ) ) {
				setMyVoteState( e.detail.myVote );
			}
			if ( e.detail.message ) {
				setActionStatus( {
					type: e.detail.type || 'success',
					message: e.detail.message,
				} );
			}
		};
		const onSetSrc = ( e ) => {
			if ( iframeRef.current && e.detail?.src ) {
				const next = sameOriginIframeSrc( e.detail.src );
				if ( iframeRef.current.src !== next ) {
					window.dispatchEvent(
						new CustomEvent( 'flow:iframe-removed' )
					);
					clearIframe();
					iframeRef.current.src = next;
				}
			}
		};
		const onAuthorResubmitActivity = () => {
			setHasAuthorResubmitActivity( true );
		};
		const onSetDevice = ( e ) => {
			const next = e?.detail?.device;
			if (
				next === 'desktop' ||
				next === 'tablet' ||
				next === 'mobile'
			) {
				setDevice( next );
			}
		};
		window.addEventListener(
			'flow:comments-sidebar-toggle',
			onCommentsToggle
		);
		window.addEventListener(
			'flow:activity-sidebar-toggle',
			onActivityToggle
		);
		window.addEventListener( 'flow:status-changed', onStatusChange );
		window.addEventListener( 'flow:set-iframe-src', onSetSrc );
		window.addEventListener(
			'flow:author-resubmit-activity',
			onAuthorResubmitActivity
		);
		window.addEventListener( 'flow:set-device-preview', onSetDevice );
		window.dispatchEvent(
			new CustomEvent( 'flow:request-device-preview' )
		);
		return () => {
			window.removeEventListener(
				'flow:comments-sidebar-toggle',
				onCommentsToggle
			);
			window.removeEventListener(
				'flow:activity-sidebar-toggle',
				onActivityToggle
			);
			window.removeEventListener( 'flow:status-changed', onStatusChange );
			window.removeEventListener( 'flow:set-iframe-src', onSetSrc );
			window.removeEventListener(
				'flow:author-resubmit-activity',
				onAuthorResubmitActivity
			);
			window.removeEventListener(
				'flow:set-device-preview',
				onSetDevice
			);
		};
	}, [] );

	const statusLabel =
		STATUS_LABELS[ currentStatus ] ||
		__( 'Review', 'jumplinks-editorial-workflow' );

	const [ myVoteState, setMyVoteState ] = useState( () => {
		if ( Array.isArray( reviewers ) && reviewers.length ) {
			const me = reviewers.find(
				( r ) => Number( r.id ) === effectiveUserId
			);
			if ( me && me.status ) {
				return me.status;
			}
		}
		return null;
	} );
	const myVote = myVoteState !== null ? myVoteState : currentStatus;
	const isApproved = myVote === 'approved';
	const canAuthorResubmit =
		currentStatus === 'changes_requested' &&
		currentUserIsPostAuthor &&
		Number( reviewId ) > 0;

	const canAdminOverride = debugMode && currentUserIsAdmin;
	const isOpenReview = currentStatus === 'open_review';
	// Email invitees act anonymously with a cookie session; WP users need login.
	const canActFinal =
		! isOpenReview &&
		( canAct || canAdminOverride ) &&
		( isEmailInvitee || Number( currentUserId ) > 0 );

	const resolvedTitle =
		postTitle && String( postTitle ).trim()
			? postTitle
			: __( '(No title)', 'jumplinks-editorial-workflow' );

	const doAction = useCallback(
		async ( endpoint, successMsg, nextStatus ) => {
			setIsBusy( true );
			setActionStatus( null );
			try {
				const data = await flowFetch(
					`reviews/${ reviewId }/${ endpoint }`,
					{ method: 'POST' }
				);
				const resolved =
					( data && ( data.display_status || data.status ) ) ||
					nextStatus;
				setCurrentStatus( resolved );
				let nextMyVote = null;
				if ( data && Array.isArray( data.reviewers ) ) {
					const mine = data.reviewers.find(
						( r ) => Number( r.id ) === effectiveUserId
					);
					nextMyVote = mine ? mine.status : null;
					setMyVoteState( nextMyVote );
				}
				window.dispatchEvent(
					new CustomEvent( 'flow:status-changed', {
						detail: { status: resolved, myVote: nextMyVote },
					} )
				);
				setActionStatus( { type: 'success', message: successMsg } );
			} catch ( err ) {
				setActionStatus( { type: 'error', message: err.message } );
			} finally {
				setIsBusy( false );
			}
		},
		[ reviewId, effectiveUserId ]
	);

	return (
		<div className="flow-bar">
			<div className="flow-bar__left">
				<WpLogoButton
					wpLogoUrl={ wpLogoUrl }
					isLoggedIn={ currentUserId > 0 }
				/>
				{ applyFilters( 'flow_ew_review_bar_left_extras', null, {
					activityOpen,
				} ) }
				{ postEditUrl ? (
					<Tooltip
						text={ __(
							'Edit content',
							'jumplinks-editorial-workflow'
						) }
						placement="bottom"
						fixed
					>
						<Button
							href={ postEditUrl }
							className="flow-bar__edit-post"
							icon={ arrowLeft }
							aria-label={ __(
								'Edit content',
								'jumplinks-editorial-workflow'
							) }
							onClick={ ( e ) => {
								if (
									e.metaKey ||
									e.ctrlKey ||
									e.shiftKey ||
									e.altKey
								) {
									return;
								}
								e.preventDefault();
								window.location.assign( postEditUrl );
							} }
						/>
					</Tooltip>
				) : null }
				<span
					className={
						isSiteReview || postTypeLabel
							? 'flow-bar__title'
							: 'flow-bar__title flow-bar__title--simple'
					}
				>
					{ isSiteReview || postTypeLabel ? (
						<>
							{ /* In site-review mode the prefix renders regardless of
                  `postTypeLabel` \u2014 we want "Reviewing [title]" even when
                  there's no suffix to show. Per-post review keeps the
                  old behaviour: prefix only when postTypeLabel is set. */ }
							<span className="flow-bar__title-prefix">
								{ __(
									'Reviewing',
									'jumplinks-editorial-workflow'
								) }
							</span>
							<span className="flow-bar__title-name">
								{ resolvedTitle }
							</span>
							{ postTypeLabel ? (
								<span className="flow-bar__title-suffix">
									<span
										className="flow-bar__title-dot"
										aria-hidden="true"
									>
										{ '\u00b7' }
									</span>
									<span className="flow-bar__title-type">
										{ postTypeLabel }
									</span>
								</span>
							) : null }
						</>
					) : (
						postTitle
					) }
				</span>
				{ isSiteReview ? null : (
					<span
						className={ `flow-bar__badge flow-bar__badge--${ currentStatus }` }
					>
						<span
							className="flow-bar__badge__dot"
							aria-hidden="true"
						/>
						{ statusLabel }
					</span>
				) }
			</div>

			{ revisionStatus ||
			snapshotLabel ||
			( debugMode && revisionStatus === 'latest' ) ? (
				<div className="flow-bar__meta">
					<div className="flow-bar__freshness-row">
						{ revisionStatus ? (
							<span
								className={ `flow-bar__freshness flow-bar__freshness--${ revisionStatus }` }
							>
								{ revisionStatus === 'latest' ? (
									__(
										'You are viewing the latest content',
										'jumplinks-editorial-workflow'
									)
								) : (
									<>
										{ __(
											'Content may be outdated.',
											'jumplinks-editorial-workflow'
										) }
										{ latestRevisionUrl && (
											<>
												{ ' ' }
												<a
													href={ latestRevisionUrl }
													className="flow-bar__freshness-link"
												>
													{ __(
														'View the latest version',
														'jumplinks-editorial-workflow'
													) }
												</a>
											</>
										) }
									</>
								) }
							</span>
						) : null }
						{ debugMode && revisionStatus === 'latest' ? (
							<span
								className="flow-bar__freshness flow-bar__freshness--debug"
								role="status"
							>
								<span
									className="flow-bar__freshness-icon"
									aria-hidden="true"
								>
									{ alertWarningIcon }
								</span>
								{ __(
									'Debug mode',
									'jumplinks-editorial-workflow'
								) }
							</span>
						) : null }
					</div>
					{ snapshotLabel ? (
						<span className="flow-bar__freshness-snapshot">
							{ snapshotLabel }
						</span>
					) : null }
				</div>
			) : null }

			<div className="flow-bar__right">
				{ /* Site review browses many pages, so it carries the device
				     switcher without the single-post preview link. */ }
				<ViewDropdown
					postUrl={ isSiteReview ? '' : postUrl }
					device={ device }
				/>
				<Tooltip
					text={ __( 'Review', 'jumplinks-editorial-workflow' ) }
					placement="bottom"
					fixed
				>
					<Button
						icon={ sidebarIcon }
						className={ `flow-bar__comments-toggle${
							commentsOpen ? ' is-pressed' : ''
						}` }
						aria-pressed={ commentsOpen }
						aria-label={ __(
							'Review',
							'jumplinks-editorial-workflow'
						) }
						onClick={ toggleComments }
					/>
				</Tooltip>
				<ReviewActions
					actionsSlot={ actionsSlot }
					canAuthorResubmit={ canAuthorResubmit }
					canActFinal={ canActFinal }
					isApproved={ isApproved }
					myVote={ myVote }
					isBusy={ isBusy }
					hasAuthorResubmitActivity={ hasAuthorResubmitActivity }
					actionStatus={ actionStatus }
					totalCommentCount={ totalCommentCount }
					doAction={ doAction }
				/>
			</div>
		</div>
	);
}
