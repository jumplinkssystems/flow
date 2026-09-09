import './style.css';
import '../shared/share-bar.css';
import './open-review';
import { statusThemeStyle } from '../shared/status-themes';
import { isPublishBlocked } from '../shared/is-publish-blocked';
import { applyPublishGuardControl } from '../shared/publish-guard-ui';
import { shareBarIconHtml } from '../shared/share-bar-icons';
import { resolveClassicRoot } from '../shared/resolve-classic-root';
import {
	ensureReviewNotices,
	syncReviewNoticeVisibility,
} from '../shared/review-notice-dom';
import { shouldShowSendForReview } from '../shared/should-show-send-for-review';
import { syncReviewerComboboxFromReview } from '../shared/sync-reviewer-combobox-from-review';
import {
	exitReviewerEmailEntryMode,
	filterReviewerComboboxOptions,
	getReviewerPlaceholder,
	isEmailComboboxOption,
	isValidEmail as isValidEmailShared,
} from '../shared/reviewer-email-entry';

( function bootClassicEditor( attempt ) {
	const { flowEW } = window;
	if ( ! flowEW ) {
		return;
	}

	const root = resolveClassicRoot();
	if ( ! root ) {
		// Elementor footer panel can appear after companion scripts; wait longer.
		if ( attempt < 600 ) {
			requestAnimationFrame( function () {
				bootClassicEditor( attempt + 1 );
			} );
		}
		return;
	}

	if ( root.dataset.flowEwClassicReady === '1' ) {
		return;
	}
	root.dataset.flowEwClassicReady = '1';

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
		open_review: i18n.statusOpenReview,
	};
	// Palette lives in src/shared/status-themes.js — keep CSS/SCSS mirrors in sync.

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

	function api( path, method ) {
		return fetch( restUrl + path, {
			method: method || 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': nonce,
			},
		} ).then( ( r ) => r.json() );
	}

	function apiPost( path, body ) {
		return fetch( restUrl + path, {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': nonce,
			},
			body: body ? JSON.stringify( body ) : undefined,
		} ).then( ( r ) => {
			if ( ! r.ok ) {
				return r.json().then( ( e ) => Promise.reject( e ) );
			}
			if ( r.status === 204 ) {
				return null;
			}
			return r.json();
		} );
	}

	function setLoading( val ) {
		loading = val;
		const spinner = $( '#flow-ew-classic-spinner' );
		if ( spinner ) {
			spinner.classList.toggle( 'is-active', val );
		}
		root
			.querySelectorAll(
				'button, select, .flow-ew-reviewer-combobox__input'
			)
			.forEach( ( el ) => {
				el.disabled = val;
			} );
	}

	function currentReviewerId() {
		const fromReview = Number(
			review?.reviewer_id ||
				( review?.reviewer && review.reviewer.id ) ||
				0
		);
		const fromMeta = Number( reviewerMeta || 0 );
		return fromReview > 0 ? fromReview : fromMeta;
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

	function getElementorEditorRoots() {
		return [
			document.getElementById( 'elementor-editor-wrapper-v2' ),
			document.getElementById( 'elementor-editor-wrapper' ),
		].filter( Boolean );
	}

	function findElementorPublishButtons() {
		const seen = new Set();
		const list = [];
		const roots = getElementorEditorRoots();
		for ( let r = 0; r < roots.length; r++ ) {
			const buttons = roots[ r ].querySelectorAll( 'button.MuiButton-root' );
			for ( let i = 0; i < buttons.length; i++ ) {
				const b = buttons[ i ];
				if ( seen.has( b ) ) {
					continue;
				}
				const label = b.textContent.replace( /\s+/g, ' ' ).trim();
				if ( /^(Publish|Submit)$/i.test( label ) ) {
					seen.add( b );
					list.push( b );
				}
			}
		}
		return list;
	}

	function setPublishGuardStyles( el, blocked ) {
		applyPublishGuardControl( el, blocked );
	}

	let publishGuardDebounce;
	let publishGuardObserver;

	function updatePublishGuard() {
		const blocked = isPublishBlockedLocal();
		refreshReviewNotices();
		syncReviewNoticeVisibilityLocal();
		const publishBtn = $( '#publish' );
		if ( publishBtn ) {
			setPublishGuardStyles( publishBtn, blocked );
		}
		findElementorPublishButtons().forEach( ( b ) =>
			setPublishGuardStyles( b, blocked )
		);
	}

	function schedulePublishGuard() {
		clearTimeout( publishGuardDebounce );
		publishGuardDebounce = setTimeout( updatePublishGuard, 80 );
	}

	function setupElementorPublishGuardObserver() {
		if ( publishGuardObserver ) {
			return;
		}
		const roots = getElementorEditorRoots();
		if ( ! roots.length ) {
			return;
		}
		publishGuardObserver = new MutationObserver( schedulePublishGuard );
		for ( let i = 0; i < roots.length; i++ ) {
			publishGuardObserver.observe( roots[ i ], {
				childList: true,
				subtree: true,
			} );
		}
	}

	let publishGuardAttachAttempts = 0;
	function tryAttachElementorPublishGuardObserver() {
		setupElementorPublishGuardObserver();
		publishGuardAttachAttempts++;
		if ( ! publishGuardObserver && publishGuardAttachAttempts < 200 ) {
			requestAnimationFrame( tryAttachElementorPublishGuardObserver );
		}
	}
	tryAttachElementorPublishGuardObserver();
	window.addEventListener( 'resize', schedulePublishGuard );

	function applyStatusTheme( el, status ) {
		const themeStyle = statusThemeStyle( status );
		[ '--flow-status-bg', '--flow-status-text', '--flow-status-border', '--flow-badge-color' ].forEach( ( prop ) => {
			el.style.removeProperty( prop );
		} );
		Object.entries( themeStyle ).forEach( ( [ prop, value ] ) => {
			el.style.setProperty( prop, value );
		} );
	}

	function renderBadge() {
		const display = review && ( review.display_status || review.status );
		const label = display ? ( STATUS_LABELS[ display ] || '' ) : '';
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
			review.reviewer_id || ( review.reviewer && review.reviewer.id ) || 0
		);
		const isReviewer = reviewerId === currentUserId;

		const hasPending = !! review.has_pending_reviewers;
		const hasInvite = !!(
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

		if ( status === 'changes_requested' && ! hasPending && currentUserId === Number( flowEW.postAuthorId || 0 ) ) {
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
		const isBeaver = root.classList.contains( 'flow-ew-classic--beaver' );
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

	function fullRender() {
		renderBadge();
		renderNotice();
		renderActions();
		renderShareBar();
		updatePublishGuard();
		updateSendEnabled();

		flowEW.activeReview = review;

		document.dispatchEvent(
			new CustomEvent( 'flow-ew:classic-render', { detail: { review } } )
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

	function clearAssignedReviewer() {
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
		apiPost( '/reviews/' + review.id + '/cancel' )
			.then( ( data ) => {
				review = data || null;
				emailEntryMode = false;
				if ( reviewerSelect ) {
					reviewerSelect.value = '';
					delete reviewerSelect.dataset.inviteEmail;
				}
				const input = root.querySelector( '#flow-ew-reviewer-input' );
				const list = root.querySelector( '#flow-ew-reviewer-listbox' );
				const opts = list
					? Array.from( list.querySelectorAll( '[role="option"]' ) )
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
				document.dispatchEvent(
					new CustomEvent( 'flow-ew:reviewer-field-reset', {
						detail: { scope: root },
					} )
				);
			} )
			.catch( () => {} )
			.finally( () => setLoading( false ) );
	}

	document.addEventListener( 'flow-ew:clear-reviewer', function () {
		clearAssignedReviewer();
	} );

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
			clearAssignedReviewer();
		},
		true
	);

	let emailEntryMode = false;

	function isValidEmail( value ) {
		return isValidEmailShared( value );
	}

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
			const combobox = root.querySelector( '#flow-ew-reviewer-combobox' );
			if ( combobox && combobox.parentNode ) {
				combobox.parentNode.insertBefore( el, combobox.nextSibling );
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
			emailEntryMode = false;
			syncClearBtn();
			return;
		}
		clearEmailError();
		setLoading( true );
		apiPost( '/reviews', { post_id: postId, invite_email: trimmed } )
			.then( ( data ) => {
				review = data;
				emailEntryMode = false;
				fullRender();
				syncClearBtn();
				const input = root.querySelector(
					'#flow-ew-reviewer-input'
				);
				if ( input ) {
					input.value =
						( data &&
							data.reviewer &&
							( data.reviewer.name || data.reviewer.email ) ) ||
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

	document.addEventListener( 'flow-ew:assign-invite-email', function ( e ) {
		const email = e && e.detail ? e.detail.email : '';
		if ( email ) {
			assignInviteEmail( email );
		}
	} );

	// Reviewer select
	const reviewerSelect = root.querySelector(
		'#flow-ew-reviewer-select'
	);
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
				emailEntryMode = true;
				if ( input ) {
					input.value = '';
					input.placeholder =
						( i18n && i18n.emailPlaceholder ) ||
						'name@example.com';
					input.focus();
				}
				return;
			}
			emailEntryMode = false;
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
	if (
		comboboxRoot &&
		! document.getElementById( 'flow-ew-avada-drawer' ) &&
		! document.getElementById( 'flow-ew-beaver-drawer' ) &&
		! document.getElementById( 'flow-ew-divi-drawer' ) &&
		! document.getElementById( 'flow-ew-oxygen-drawer' ) &&
		! document.getElementById( 'flow-ew-breakdance-drawer' ) &&
		! document.getElementById( 'flow-ew-bricks-drawer' )
	) {
		initReviewerCombobox( comboboxRoot );
	}

	function initReviewerCombobox( root ) {
		const input = root.querySelector( '.flow-ew-reviewer-combobox__input' );
		const list  = root.querySelector( '.flow-ew-reviewer-combobox__list' );
		const sel   = root.querySelector( '#flow-ew-reviewer-select' );
		if ( ! input || ! list || ! sel ) {
			return;
		}

		const options = Array.from( list.querySelectorAll( '[role="option"]' ) );
		let activeIndex = -1;

		function isEmailOption( li ) {
			return (
				li &&
				( li.dataset.isEmail === '1' || li.dataset.value === 'email' )
			);
		}

		function onlyEmailAvailable() {
			// No WP users left to pick — type an email directly (even if the
			// External Email option is missing from the native <select>).
			return ! options.some( function ( li ) {
				return ! isEmailOption( li );
			} );
		}

		// No WP reviewers in the list — go straight to typing an email.
		if ( onlyEmailAvailable() ) {
			emailEntryMode = true;
			sel.value = 'email';
			input.placeholder =
				( i18n && i18n.emailPlaceholder ) || 'name@example.com';
		}

		function setOpen( openList ) {
			// Never leave an empty bordered listbox under the field (e.g. after
			// an email assign filters out every option).
			// Allow the list when the typed value is a valid email so "Invite"
			// can appear — even after External Email was selected.
			const typed = ( input.value || '' ).trim();
			if ( openList && isValidEmail( typed ) ) {
				filterOptions( typed );
				if ( visibleOptions().length === 0 ) {
					openList = false;
				}
			} else if (
				openList &&
				( emailEntryMode ||
					sel.value === 'email' ||
					visibleOptions().length === 0 )
			) {
				openList = false;
			}
			list.hidden = ! openList;
			input.setAttribute( 'aria-expanded', openList ? 'true' : 'false' );
			const field = root.closest( '.flow-ew-classic__field' );
			if ( field ) {
				field.classList.toggle( 'is-list-open', openList );
			}
			const postbox = root.closest( '#flow-ew-review.postbox' );
			if ( postbox ) {
				postbox.classList.toggle( 'is-combobox-open', openList );
			}
		}

		function filterOptions( q ) {
			filterReviewerComboboxOptions( options, q, {
				emailOnly: onlyEmailAvailable(),
			} );
		}

		function visibleOptions() {
			return options.filter( function ( li ) {
				return ! li.hidden && li.style.display !== 'none';
			} );
		}

		function chooseOption( li ) {
			if ( ! li || li.hidden ) {
				return;
			}
			const id    = li.dataset.value;
			const label = li.dataset.label || li.textContent.trim();
			const isEmail = isEmailComboboxOption( li );
			sel.value   = id;
			if ( isEmail ) {
				const typed = ( input.value || '' ).trim();
				if ( isValidEmail( typed ) ) {
					emailEntryMode = true;
					setOpen( false );
					activeIndex = -1;
					assignInviteEmail( typed );
					return;
				}
				input.value = '';
				input.placeholder =
					( i18n && i18n.emailPlaceholder ) || 'name@example.com';
				setOpen( false );
				activeIndex = -1;
				emailEntryMode = true;
				sel.dispatchEvent( new Event( 'change', { bubbles: true } ) );
				input.focus();
				return;
			}
			emailEntryMode = false;
			input.value = label;
			setOpen( false );
			activeIndex = -1;
			sel.dispatchEvent( new Event( 'change', { bubbles: true } ) );
		}

		input.addEventListener( 'focus', function () {
			if ( input.disabled || input.readOnly ) return;
			if (
				emailEntryMode ||
				sel.value === 'email' ||
				onlyEmailAvailable()
			) {
				setOpen( false );
				return;
			}
			filterOptions( input.value );
			setOpen( true );
		} );

		input.addEventListener( 'input', function () {
			if ( input.disabled || input.readOnly ) return;
			const typed = ( input.value || '' ).trim();
			// Valid address → show Invite row (even after External Email).
			if ( isValidEmail( typed ) ) {
				emailEntryMode = true;
				sel.value = 'email';
				filterOptions( typed );
				setOpen( true );
				activeIndex = -1;
				clearEmailError();
				return;
			}
			// After choosing External Email (or email-only), keep list closed
			// while the address is still incomplete.
			if (
				emailEntryMode ||
				sel.value === 'email' ||
				onlyEmailAvailable()
			) {
				if ( ! typed && ! onlyEmailAvailable() ) {
					emailEntryMode = false;
					exitReviewerEmailEntryMode( sel, input, options );
					filterOptions( '' );
					setOpen( true );
					activeIndex = -1;
					clearEmailError();
					return;
				}
				emailEntryMode = true;
				sel.value = 'email';
				setOpen( false );
				activeIndex = -1;
				if ( ! typed ) {
					clearEmailError();
				}
				return;
			}
			filterOptions( input.value );
			setOpen( true );
			activeIndex = -1;
		} );

		input.addEventListener( 'blur', function () {
			// Assigned field is read-only — never re-invite on click-away
			// (that was resetting status to pending → Send for review again).
			if ( input.disabled || input.readOnly ) {
				return;
			}
			if ( ! emailEntryMode && sel.value !== 'email' ) {
				return;
			}
			window.setTimeout( function () {
				if ( document.activeElement === input ) {
					return;
				}
				if ( input.readOnly || input.disabled ) {
					return;
				}
				const typed = ( input.value || '' ).trim().toLowerCase();
				if ( ! typed ) {
					emailEntryMode = false;
					exitReviewerEmailEntryMode( sel, input, options );
					clearEmailError();
					return;
				}
				if ( ! isValidEmail( typed ) ) {
					// Invalid addresses only surface an error on Enter.
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
				if ( existingInvite && existingInvite === typed ) {
					return;
				}
				assignInviteEmail( typed );
			}, 150 );
		} );

		list.addEventListener( 'mousedown', function ( e ) {
			const li = e.target.closest( '[role="option"]' );
			if ( li && ! li.hidden ) {
				e.preventDefault();
				chooseOption( li );
			}
		} );

		document.addEventListener( 'click', function ( e ) {
			if ( ! root.contains( e.target ) ) {
				setOpen( false );
				activeIndex = -1;
			}
		} );

		document.addEventListener( 'flow-ew:reviewer-field-reset', function () {
			emailEntryMode = false;
			exitReviewerEmailEntryMode( sel, input, options );
			filterOptions( '' );
			setOpen( false );
			activeIndex = -1;
		} );

		function submitTypedEmail( event ) {
			if ( event ) {
				event.preventDefault();
				event.stopPropagation();
			}
			const typed = ( input.value || '' ).trim();
			if ( isValidEmail( typed ) ) {
				emailEntryMode = true;
				sel.value = 'email';
				assignInviteEmail( typed );
				return;
			}
			if ( typed ) {
				emailEntryMode = true;
				sel.value = 'email';
				showEmailError();
			}
		}

		input.addEventListener( 'keydown', function ( e ) {
			if ( input.disabled || input.readOnly ) return;
			const vis = visibleOptions();
			const typed = ( input.value || '' ).trim();
			const treatAsEmail =
				emailEntryMode ||
				sel.value === 'email' ||
				onlyEmailAvailable() ||
				isValidEmail( typed ) ||
				typed.includes( '@' );

			if ( e.key === 'ArrowDown' ) {
				e.preventDefault();
				if ( treatAsEmail ) {
					setOpen( false );
					return;
				}
				if ( ! list.hidden && vis.length ) {
					activeIndex = Math.min( activeIndex + 1, vis.length - 1 );
					vis[ activeIndex ].focus();
				} else {
					filterOptions( input.value );
					const next = visibleOptions();
					if ( ! next.length ) {
						return;
					}
					setOpen( true );
					activeIndex = 0;
					if ( next[ 0 ] ) next[ 0 ].focus();
				}
			} else if ( e.key === 'ArrowUp' ) {
				e.preventDefault();
				if ( ! list.hidden && vis.length ) {
					activeIndex = Math.max( activeIndex - 1, 0 );
					vis[ activeIndex ].focus();
				}
			} else if ( e.key === 'Enter' ) {
				if ( treatAsEmail ) {
					submitTypedEmail( e );
					return;
				}
				const focused = list.querySelector( '[role="option"]:focus' );
				if ( focused && ! focused.hidden ) {
					e.preventDefault();
					e.stopPropagation();
					chooseOption( focused );
				}
			} else if ( e.key === 'Escape' ) {
				setOpen( false );
				activeIndex = -1;
				input.focus();
			}
		} );

		// Classic post form submits on Enter in text inputs — block that while
		// the reviewer field is in email-entry mode.
		input.addEventListener( 'keypress', function ( e ) {
			if ( e.key !== 'Enter' && e.keyCode !== 13 ) {
				return;
			}
			const typed = ( input.value || '' ).trim();
			if (
				emailEntryMode ||
				sel.value === 'email' ||
				onlyEmailAvailable() ||
				isValidEmail( typed ) ||
				typed.includes( '@' )
			) {
				e.preventDefault();
				e.stopPropagation();
			}
		} );
	}

	function updateSendEnabled() {
		const sendBtn = root.querySelector( '[data-action="send"]' );
		if ( ! sendBtn ) {
			return;
		}
		const sel = $( '#flow-ew-reviewer-select' );
		const hasWp = sel && Number( sel.value ) > 0;
		const hasInvite = !!(
			review &&
			( review.invite_email ||
				( review.reviewer && review.reviewer.is_email ) ||
				( sel && sel.value === 'email' && sel.dataset.inviteEmail ) )
		);
		const isOpen = !!( review && review.is_open );
		sendBtn.disabled = loading || ( ! hasWp && ! hasInvite && ! isOpen );
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
				copyBtn.classList.remove( 'flow-ew-classic__share-copy--done' );
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

	function escHtml( str ) {
		const d = document.createElement( 'div' );
		d.textContent = str;
		return d.innerHTML;
	}

	function escAttr( str ) {
		return str
			.replace( /&/g, '&amp;' )
			.replace( /"/g, '&quot;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' );
	}
} )( root );
} )( 0 );
