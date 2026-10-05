import './style.css';
import '../shared/share-bar.css';
import './open-review';
import './self-review';
import { applyStatusTheme } from '../shared/status-themes';
import { escAttr, escHtml } from '../shared/escape';
import { createRestClient } from './api';
import { isPublishBlocked } from '../shared/is-publish-blocked';
import { applyPublishGuardControl } from '../shared/publish-guard-ui';
import { shareBarIconHtml } from '../shared/share-bar-icons';
import { resolveClassicRoot } from '../shared/resolve-classic-root';
import { isValidEmail } from '../shared/assign-invite-email';
import {
	ensureReviewNotices,
	syncReviewNoticeVisibility,
} from '../shared/review-notice-dom';
import { shouldShowSendForReview } from '../shared/should-show-send-for-review';
import { syncReviewerComboboxFromReview } from '../shared/sync-reviewer-combobox-from-review';
import {
	exitReviewerEmailEntryMode,
	getReviewerPlaceholder,
} from '../shared/reviewer-email-entry';
import { initReviewerCombobox } from '../shared/reviewer-combobox';

( function bootClassicEditor( attempt ) {
	const { flowEW } = window;
	if ( ! flowEW ) {
		return;
	}

	const classicRoot = resolveClassicRoot();
	if ( ! classicRoot ) {
		// Elementor footer panel can appear after companion scripts; wait longer.
		if ( attempt < 600 ) {
			requestAnimationFrame( function () {
				bootClassicEditor( attempt + 1 );
			} );
		}
		return;
	}

	if ( classicRoot.dataset.flowEwClassicReady === '1' || flowEW.soloMode ) {
		return;
	}
	classicRoot.dataset.flowEwClassicReady = '1';

	( function runClassicEditor( root ) {
		const {
			restUrl,
			nonce,
			postId,
			currentUserId,
			currentUserCan,
			activeReview,
			reviewMandatory,
			reviewerMeta = 0,
			i18n,
		} = flowEW;

		const STATUS_LABELS = {
			pending: i18n.statusPending,
			in_review: i18n.statusInReview,
			changes_requested: i18n.statusChangesReq,
			approved: i18n.statusApproved,
			cancelled: i18n.statusCancelled,
			open_review: i18n.statusOpenReview,
		};

		let review = activeReview;
		let loading = false;

		const $ = ( sel, ctx ) => ( ctx || document ).querySelector( sel );

		const submitBox = $( '#submitdiv' );
		const reviewBox = $( '#flow-ew-review' );
		if (
			submitBox &&
			reviewBox &&
			submitBox.nextElementSibling !== reviewBox
		) {
			submitBox.insertAdjacentElement( 'afterend', reviewBox );
		}

		const { api, apiPost } = createRestClient( { restUrl, nonce } );

		function setLoading( val ) {
			loading = val;
			const spinner = $( '#flow-ew-classic-spinner' );
			if ( spinner ) {
				spinner.classList.toggle( 'is-active', val );
			}
			root.querySelectorAll(
				'button, select, .flow-ew-reviewer-combobox__input'
			).forEach( ( el ) => {
				el.disabled = val;
			} );
		}

		function isAlreadyPublished() {
			if ( flowEW && flowEW.isPublished ) {
				return true;
			}
			const orig = $( '#original_post_status' );
			return !! ( orig && orig.value === 'publish' );
		}

		function isPublishBlockedLocal() {
			return isPublishBlocked( {
				reviewMandatory,
				isPublished: isAlreadyPublished(),
				review,
				reviewerMeta,
			} );
		}

		function noticeState() {
			return {
				reviewMandatory,
				isPublished: isAlreadyPublished(),
				review,
				reviewerMeta,
				currentUserCan,
			};
		}

		function refreshReviewNotices() {
			ensureReviewNotices( noticeState() );
		}

		function syncReviewNoticeVisibilityLocal() {
			syncReviewNoticeVisibility( noticeState() );
		}

		function setPublishGuardStyles( el, blocked ) {
			applyPublishGuardControl( el, blocked );
		}

		let publishGuardDebounce;

		function updatePublishGuard() {
			const blocked = isPublishBlockedLocal();
			refreshReviewNotices();
			syncReviewNoticeVisibilityLocal();
			const publishBtn = $( '#publish' );
			if ( publishBtn ) {
				setPublishGuardStyles( publishBtn, blocked );
			}
		}

		function schedulePublishGuard() {
			clearTimeout( publishGuardDebounce );
			publishGuardDebounce = setTimeout( updatePublishGuard, 80 );
		}

		window.addEventListener( 'resize', schedulePublishGuard );

		function renderBadge() {
			const display =
				review && ( review.display_status || review.status );
			const label = display ? STATUS_LABELS[ display ] || '' : '';
			const visible = !! display && !! label;

			const drawerRoot = root.closest(
				'.flow-ew-elementor-drawer, .flow-ew-bricks-drawer, .flow-ew-breakdance-drawer, .flow-ew-avada-drawer, .flow-ew-beaver-drawer, .flow-ew-divi-drawer'
			);
			const drawerSlot = drawerRoot
				? drawerRoot.querySelector( '.flow-ew-drawer-status' )
				: $( '.flow-ew-drawer-status' );
			if ( drawerSlot ) {
				if ( visible ) {
					applyStatusTheme( drawerSlot, display );
					drawerSlot.setAttribute( 'data-status', display );
					drawerSlot.innerHTML =
						'<span class="flow-ew-classic__badge-dot"></span>' +
						escHtml( label );
					drawerSlot.removeAttribute( 'hidden' );
				} else {
					drawerSlot.removeAttribute( 'data-status' );
					drawerSlot.setAttribute( 'hidden', '' );
					drawerSlot.innerHTML = '';
				}
				return;
			}

			// Strip any pre-existing body badge (older renders / cached pages).
			const existing = $( '.flow-ew-classic__status', root );
			if ( existing ) {
				existing.remove();
			}
		}

		function renderNotice() {
			const existing = $( '.flow-ew-classic__notice', root );
			if ( existing ) {
				existing.remove();
			}
		}

		function renderActions() {
			const container = root.querySelector( '#flow-ew-classic-actions' );
			if ( ! container ) {
				return;
			}
			container.innerHTML = '';

			if ( ! review ) {
				return;
			}

			const status = review.status;
			const reviewerId = Number(
				review.reviewer_id ||
					( review.reviewer && review.reviewer.id ) ||
					0
			);
			const isReviewer = reviewerId === currentUserId;

			const hasPending = !! review.has_pending_reviewers;
			const hasInvite = !! (
				review.invite_email ||
				( review.reviewer && review.reviewer.is_email ) ||
				( Array.isArray( review.email_invites ) &&
					review.email_invites.length > 0 )
			);
			if (
				shouldShowSendForReview( review ) &&
				currentUserCan.assignReviewer
			) {
				container.appendChild(
					makeButton(
						i18n.sendForReview,
						'send',
						'button-primary',
						! reviewerId && ! hasInvite
					)
				);
			}

			if (
				status === 'changes_requested' &&
				! hasPending &&
				currentUserId === Number( flowEW.postAuthorId || 0 )
			) {
				container.appendChild(
					makeButton( i18n.resubmit, 'resubmit', 'button-primary' )
				);
			}

			if (
				status === 'in_review' &&
				isReviewer &&
				currentUserCan.reviewPosts
			) {
				container.appendChild(
					makeButton(
						i18n.approve,
						'approve',
						'button-primary flow-ew-classic__btn--approve'
					)
				);
				container.appendChild(
					makeButton(
						i18n.requestChanges,
						'request-changes',
						'flow-ew-classic__btn--changes'
					)
				);
			}
		}

		function makeButton( text, action, cls, disabled ) {
			const btn = document.createElement( 'button' );
			btn.type = 'button';
			const isBeaver = root.classList.contains(
				'flow-ew-classic--beaver'
			);
			if ( isBeaver ) {
				btn.className = 'fl-builder-button flow-ew-classic__btn';
				if ( action === 'send' || action === 'resubmit' ) {
					btn.classList.add( 'fl-builder-button-primary' );
				}
				if ( cls ) {
					cls.split( /\s+/ ).forEach( function ( part ) {
						if (
							part &&
							part !== 'button' &&
							part !== 'button-primary'
						) {
							btn.classList.add( part );
						}
					} );
				}
			} else {
				btn.className = 'button flow-ew-classic__btn ' + ( cls || '' );
			}
			btn.dataset.action = action;
			btn.textContent = text;
			if ( disabled ) {
				btn.disabled = true;
			}
			return btn;
		}

		function renderShareBar() {
			const existing = $( '#flow-ew-share' );
			if ( existing ) {
				existing.remove();
			}

			if (
				! review ||
				! review.revision_preview_url ||
				( review.status === 'pending' && ! review.is_open )
			) {
				return;
			}
			const url = review.revision_preview_url;
			const canCancel =
				currentUserCan.manageReviews ||
				Number(
					review.requester_id ||
						( review.requester && review.requester.id ) ||
						0
				) === Number( currentUserId );
			const div = document.createElement( 'div' );
			div.className = 'flow-ew-classic__share';
			div.id = 'flow-ew-share';
			div.innerHTML =
				'<span class="flow-ew-classic__share-label">' +
				escHtml( i18n.snapshotLink ) +
				'</span>' +
				'<span class="flow-ew-classic__share-row">' +
				'<a href="' +
				escAttr( url ) +
				'" target="_blank" rel="noreferrer" class="flow-ew-classic__share-link" title="' +
				escAttr( url ) +
				'"><span class="flow-ew-classic__share-link-text">' +
				escHtml( url ) +
				'</span></a>' +
				'<button type="button" class="button flow-ew-classic__share-copy" data-url="' +
				escAttr( url ) +
				'">' +
				shareBarIconHtml( 'copy' ) +
				'</button>' +
				( canCancel
					? '<button type="button" class="button flow-ew-classic__share-copy flow-ew-classic__share-cancel" data-action="cancel" aria-label="' +
					  escAttr( i18n.cancelReview ) +
					  '" title="' +
					  escAttr( i18n.cancelReview ) +
					  '">' +
					  shareBarIconHtml( 'cancel' ) +
					  '</button>'
					: '' ) +
				'<a href="' +
				escAttr( url ) +
				'" target="_blank" rel="noreferrer" class="flow-ew-classic__share-goto" aria-label="' +
				escAttr( i18n.goToReview || 'Go to review' ) +
				'">' +
				shareBarIconHtml( 'external' ) +
				'</a>' +
				'</span>';
			const spinner = $( '#flow-ew-classic-spinner' );
			root.insertBefore( div, spinner );
		}

		// The auto-assign hint only holds while nobody is assigned yet.
		function renderPendingReviewer() {
			const node = root.querySelector( '[data-flow-pending-reviewer]' );
			if ( ! node ) {
				return;
			}
			const reviewer = ( review && review.reviewer ) || null;
			const assigned = !! (
				review &&
				( Number(
					review.reviewer_id || ( reviewer && reviewer.id ) || 0
				) > 0 ||
					review.invite_email ||
					( reviewer && reviewer.is_email ) )
			);
			node.hidden = assigned;
		}

		let cancelledReviews = flowEW.cancelledReviews || [];
		const HISTORY_PAGE = 5;
		let historyVisible = HISTORY_PAGE;
		const historyKey = () =>
			review ? review.id + ':' + review.status : '';
		let lastHistoryKey = historyKey();

		function renderHistory() {
			const existing = $( '#flow-ew-history' );
			if ( existing ) {
				existing.remove();
			}
			const spinner = $( '#flow-ew-classic-spinner' );
			if ( ! cancelledReviews.length || ! spinner ) {
				return;
			}
			const div = document.createElement( 'div' );
			div.className = 'flow-ew-history';
			div.id = 'flow-ew-history';
			div.innerHTML =
				'<span class="flow-ew-classic__share-label">' +
				escHtml( i18n.cancelledReviews ) +
				'</span><ul class="flow-ew-history__list">' +
				cancelledReviews
					.slice( 0, historyVisible )
					.map( function ( item ) {
						return (
							'<li class="flow-ew-history__item"><a href="' +
							escAttr( item.url ) +
							'" target="_blank" rel="noreferrer">' +
							escHtml( item.date ) +
							'</a>' +
							( item.meta
								? '<span class="flow-ew-history__meta">- ' +
								  escHtml( item.meta ) +
								  '</span>'
								: '' ) +
							'</li>'
						);
					} )
					.join( '' ) +
				'</ul>';
			if ( cancelledReviews.length > historyVisible ) {
				const more = document.createElement( 'button' );
				more.type = 'button';
				more.className = 'button-link flow-ew-history__more';
				more.textContent = i18n.loadMore;
				more.addEventListener( 'click', function () {
					historyVisible += HISTORY_PAGE;
					renderHistory();
				} );
				div.appendChild( more );
			}
			root.insertBefore( div, spinner );
		}

		// A cancel swaps the active review, or (Pro roster) marks it cancelled.
		function refreshHistoryOnReviewChange() {
			const key = historyKey();
			if ( key === lastHistoryKey ) {
				return;
			}
			lastHistoryKey = key;
			api( '/reviews/' + postId + '/cancelled', 'GET' )
				.then( function ( list ) {
					cancelledReviews = Array.isArray( list ) ? list : [];
					renderHistory();
				} )
				.catch( function () {} );
		}

		let toastTimer = 0;
		function showToast( message ) {
			const existing = $( '#flow-ew-classic-toast' );
			if ( existing ) {
				existing.remove();
			}
			const toast = document.createElement( 'div' );
			toast.id = 'flow-ew-classic-toast';
			toast.className = 'flow-ew-classic__toast';
			toast.setAttribute( 'role', 'status' );
			toast.textContent = message;
			const spinner = $( '#flow-ew-classic-spinner' );
			if ( spinner && root.contains( spinner ) ) {
				root.insertBefore( toast, spinner );
			} else {
				root.appendChild( toast );
			}
			clearTimeout( toastTimer );
			toastTimer = setTimeout( function () {
				toast.remove();
			}, 4000 );
		}

		document.addEventListener( 'flow-ew:review-cancelled', function () {
			showToast( i18n.reviewCancelled );
		} );

		document.addEventListener( 'flow-ew:toast', function ( e ) {
			if ( e.detail && e.detail.message ) {
				showToast( e.detail.message );
			}
		} );

		function fullRender() {
			renderBadge();
			renderNotice();
			renderActions();
			renderShareBar();
			renderHistory();
			refreshHistoryOnReviewChange();
			updatePublishGuard();
			updateSendEnabled();
			renderPendingReviewer();

			flowEW.activeReview = review;

			document.dispatchEvent(
				new CustomEvent( 'flow-ew:classic-render', {
					detail: { review },
				} )
			);
		}

		document.addEventListener( 'flow-ew:set-review', function ( e ) {
			const next = e && e.detail ? e.detail.review : null;
			review = next || null;
			flowEW.activeReview = review;
			fullRender();
		} );

		function syncClearBtn() {
			syncReviewerComboboxFromReview( review, root );
		}

		// `remove-reviewer` keeps an open review running; `cancel` always ends it.
		function clearAssignedReviewer( action = 'cancel' ) {
			if ( loading ) {
				return;
			}
			if ( ! review && flowEW.activeReview ) {
				review = flowEW.activeReview;
			}
			if ( ! review || ! review.id ) {
				return;
			}
			setLoading( true );
			apiPost( '/reviews/' + review.id + '/' + action )
				.then( ( data ) => {
					review = data || null;
					if ( combobox ) {
						combobox.setEmailEntryMode( false );
					}
					if ( reviewerSelect ) {
						reviewerSelect.value = '';
						delete reviewerSelect.dataset.inviteEmail;
					}
					const input = root.querySelector(
						'#flow-ew-reviewer-input'
					);
					const list = root.querySelector(
						'#flow-ew-reviewer-listbox'
					);
					const opts = list
						? Array.from(
								list.querySelectorAll( '[role="option"]' )
						  )
						: [];
					if ( input ) {
						input.value = '';
						input.readOnly = false;
						input.placeholder = getReviewerPlaceholder();
					}
					exitReviewerEmailEntryMode( reviewerSelect, input, opts );
					if ( input ) {
						input.dataset.flowLocked = '0';
					}
					clearEmailError();
					fullRender();
					syncClearBtn();
					showToast(
						data ? i18n.reviewerRemoved : i18n.reviewCancelled
					);
					document.dispatchEvent(
						new CustomEvent( 'flow-ew:reviewer-field-reset', {
							detail: { scope: root },
						} )
					);
				} )
				.catch( () => {} )
				.finally( () => setLoading( false ) );
		}

		// The reviewer ×: only asks first when removing the reviewer cancels the review.
		function removeReviewer() {
			const current = review || flowEW.activeReview;
			if (
				current &&
				! current.is_open &&
				// eslint-disable-next-line no-alert
				! window.confirm( i18n.cancelReviewBody )
			) {
				return;
			}
			clearAssignedReviewer( 'remove-reviewer' );
		}

		document.addEventListener( 'flow-ew:clear-reviewer', removeReviewer );

		// Capture on document so Elementor/builder overlays cannot swallow the ×.
		document.addEventListener(
			'pointerdown',
			function ( e ) {
				const btn = e.target.closest(
					'.flow-ew-reviewer-combobox__clear'
				);
				if ( ! btn || ! root.contains( btn ) ) {
					return;
				}
				e.preventDefault();
				e.stopPropagation();
				removeReviewer();
			},
			true
		);

		document.addEventListener(
			'pointerdown',
			function ( e ) {
				const btn = e.target.closest(
					'.flow-ew-classic__share-cancel'
				);
				if ( ! btn || ! root.contains( btn ) || loading ) {
					return;
				}
				e.preventDefault();
				e.stopPropagation();
				// eslint-disable-next-line no-alert
				if ( ! window.confirm( i18n.cancelReviewBody ) ) {
					return;
				}
				clearAssignedReviewer();
			},
			true
		);

		let combobox = null;

		function invalidEmailMessage() {
			return (
				( i18n && i18n.invalidEmail ) ||
				'Please enter a valid email address.'
			);
		}

		function showEmailError( message ) {
			const slot =
				root.querySelector( '#flow-ew-classic-reviewer-slot' ) ||
				root.querySelector( '.flow-ew-reviewer-combobox' ) ||
				root;
			let el = root.querySelector( '.flow-ew-reviewer-email-error' );
			if ( ! el ) {
				el = document.createElement( 'p' );
				el.className = 'flow-ew-reviewer-email-error';
				el.setAttribute( 'role', 'alert' );
				const comboboxEl = root.querySelector(
					'#flow-ew-reviewer-combobox'
				);
				if ( comboboxEl && comboboxEl.parentNode ) {
					comboboxEl.parentNode.insertBefore(
						el,
						comboboxEl.nextSibling
					);
				} else {
					slot.appendChild( el );
				}
			}
			el.textContent = message || invalidEmailMessage();
			el.hidden = false;
		}

		function clearEmailError() {
			const el = root.querySelector( '.flow-ew-reviewer-email-error' );
			if ( el ) {
				el.hidden = true;
				el.textContent = '';
			}
		}

		function assignInviteEmail( email ) {
			const trimmed = ( email || '' ).trim().toLowerCase();
			if ( ! isValidEmail( trimmed ) ) {
				showEmailError();
				return;
			}
			const existingInvite = String(
				( review &&
					( review.invite_email ||
						( review.reviewer && review.reviewer.email ) ||
						'' ) ) ||
					''
			)
				.trim()
				.toLowerCase();
			if ( existingInvite && existingInvite === trimmed ) {
				if ( combobox ) {
					combobox.setEmailEntryMode( false );
				}
				syncClearBtn();
				return;
			}
			clearEmailError();
			setLoading( true );
			apiPost( '/reviews', { post_id: postId, invite_email: trimmed } )
				.then( ( data ) => {
					review = data;
					if ( combobox ) {
						combobox.setEmailEntryMode( false );
					}
					fullRender();
					syncClearBtn();
					const input = root.querySelector(
						'#flow-ew-reviewer-input'
					);
					if ( input ) {
						input.value =
							( data &&
								data.reviewer &&
								( data.reviewer.name ||
									data.reviewer.email ) ) ||
							trimmed;
					}
					if ( reviewerSelect ) {
						reviewerSelect.value = 'email';
						reviewerSelect.dataset.inviteEmail = trimmed;
					}
				} )
				.catch( ( err ) => {
					showEmailError(
						( err && err.message ) || invalidEmailMessage()
					);
				} )
				.finally( () => setLoading( false ) );
		}

		document.addEventListener(
			'flow-ew:assign-invite-email',
			function ( e ) {
				const email = e && e.detail ? e.detail.email : '';
				if ( email ) {
					assignInviteEmail( email );
				}
			}
		);

		// Reviewer select
		const reviewerSelect = root.querySelector( '#flow-ew-reviewer-select' );
		if ( reviewerSelect ) {
			reviewerSelect.addEventListener( 'change', function () {
				const raw = this.value;
				if ( ! raw ) {
					return;
				}
				const input = root.querySelector( '#flow-ew-reviewer-input' );
				// Locked after assign — only the clear (×) button may change roster.
				if ( input && input.readOnly ) {
					return;
				}
				if ( raw === 'email' ) {
					if ( combobox ) {
						combobox.setEmailEntryMode( true );
					}
					if ( input ) {
						input.value = '';
						input.placeholder =
							( i18n && i18n.emailPlaceholder ) ||
							'name@example.com';
						input.focus();
					}
					return;
				}
				if ( combobox ) {
					combobox.setEmailEntryMode( false );
				}
				const newId = Number( raw );
				if ( ! newId ) {
					return;
				}
				// Re-selecting the already-assigned reviewer must not re-POST
				// (Review::request would kick status back to pending).
				if ( review && Number( review.reviewer_id || 0 ) === newId ) {
					syncClearBtn();
					return;
				}
				setLoading( true );
				apiPost( '/reviews', { post_id: postId, reviewer_id: newId } )
					.then( ( data ) => {
						review = data;
						fullRender();
						syncClearBtn();
					} )
					.catch( () => {} )
					.finally( () => setLoading( false ) );
			} );
		}

		const comboboxRoot = root.querySelector( '#flow-ew-reviewer-combobox' );
		const isBuilderContext =
			/flow-ew-classic--(elementor|bricks|breakdance|oxygen|avada|beaver|divi)/.test(
				root.className || ''
			);
		combobox = comboboxRoot
			? initReviewerCombobox( comboboxRoot, {
					assignInviteEmail,
					showEmailError,
					clearEmailError,
					existingInviteEmail() {
						return String(
							( review &&
								( review.invite_email ||
									( review.reviewer &&
										review.reviewer.email ) ) ) ||
								''
						);
					},
					// Builders confirm an address with Enter or the Invite row.
					assignOnBlur: ! isBuilderContext,
			  } )
			: null;

		function updateSendEnabled() {
			const sendBtn = root.querySelector( '[data-action="send"]' );
			if ( ! sendBtn ) {
				return;
			}
			const sel = $( '#flow-ew-reviewer-select' );
			const hasWp = sel && Number( sel.value ) > 0;
			const hasInvite = !! (
				review &&
				( review.invite_email ||
					( review.reviewer && review.reviewer.is_email ) ||
					( sel &&
						sel.value === 'email' &&
						sel.dataset.inviteEmail ) )
			);
			const isOpen = !! ( review && review.is_open );
			sendBtn.disabled =
				loading || ( ! hasWp && ! hasInvite && ! isOpen );
		}

		function updatePostStatusDisplay( newStatus ) {
			const hiddenStatus = $( '#post_status' );
			if ( hiddenStatus ) {
				hiddenStatus.value = newStatus;
			}
			const display = $( '#post-status-display' );
			if ( display ) {
				const map = {
					pending: i18n.statusPending,
					draft: 'Draft',
					publish: 'Published',
				};
				display.textContent = map[ newStatus ] || newStatus;
			}
		}

		function sendForReview() {
			if ( ! review || loading ) {
				return;
			}
			setLoading( true );

			apiPost( '/reviews/' + review.id + '/send' )
				.then( ( data ) => {
					if ( data && data.id ) {
						review = data;
					}
					if ( ! isAlreadyPublished() ) {
						updatePostStatusDisplay( 'pending' );
					}
					fullRender();
				} )
				.catch( () => {} )
				.finally( () => setLoading( false ) );
		}

		// Action buttons (delegated)
		root.addEventListener( 'click', function ( e ) {
			const btn = e.target.closest( '[data-action]' );
			if ( ! btn || loading || ! review ) {
				return;
			}

			const action = btn.dataset.action;

			if ( action === 'send' ) {
				sendForReview();
				return;
			}
			if ( action === 'cancel' ) {
				return;
			}

			const endpoint = '/reviews/' + review.id + '/' + action;

			setLoading( true );
			apiPost( endpoint )
				.then( ( data ) => {
					if ( data && data.id ) {
						review = data;
					} else if ( data && data.success ) {
						const statusMap = {
							approve: 'approved',
							'request-changes': 'changes_requested',
							resubmit: 'in_review',
						};
						if ( statusMap[ action ] ) {
							review = { ...review, status: statusMap[ action ] };
						}
					}
					fullRender();
				} )
				.catch( () => {} )
				.finally( () => setLoading( false ) );
		} );

		// Copy button (delegated)
		root.addEventListener( 'click', function ( e ) {
			const copyBtn = e.target.closest( '.flow-ew-classic__share-copy' );
			if ( ! copyBtn ) {
				return;
			}
			const url = copyBtn.dataset.url;
			if ( ! url ) {
				return;
			}
			navigator.clipboard.writeText( url ).then( () => {
				copyBtn.innerHTML = shareBarIconHtml( 'copied' );
				copyBtn.classList.add( 'flow-ew-classic__share-copy--done' );
				setTimeout( () => {
					copyBtn.innerHTML = shareBarIconHtml( 'copy' );
					copyBtn.classList.remove(
						'flow-ew-classic__share-copy--done'
					);
				}, 2000 );
			} );
		} );

		// Reload review data after Classic Editor save (post_updated redirect)
		function reloadReview() {
			api( '/reviews/' + postId, 'GET' )
				.then( ( data ) => {
					if ( data && data.id ) {
						review = data;
					} else {
						review = null;
					}
					fullRender();
				} )
				.catch( () => {} );
		}

		if ( window.jQuery ) {
			window
				.jQuery( document )
				.on( 'heartbeat-tick.wp-refresh-nonces', function () {
					setTimeout( reloadReview, 500 );
				} );
		}

		// Allow external triggers (e.g. Elementor save) to reload review data.
		document.addEventListener( 'flow-ew:reload-review', function () {
			reloadReview();
		} );

		// Normalize PHP-rendered markup (actions/share/button classes) on first boot.
		fullRender();
		syncClearBtn();
	} )( classicRoot );
} )( 0 );
