import './style.css';
import { syncReviewerComboboxFromReview } from '../shared/sync-reviewer-combobox-from-review';
import {
	dispatchAssignInviteEmail,
	isValidEmail,
} from '../shared/assign-invite-email';
import { syncBuilderReviewerUpsell } from '../shared/sync-builder-reviewer-upsell';
import {
	exitReviewerEmailEntryMode,
	filterReviewerComboboxOptions,
	getEmailPlaceholder,
	isEmailComboboxOption,
	shouldHideReviewerAutocomplete,
} from '../shared/reviewer-email-entry';
import '../shared/share-bar.css';
import { ensureReviewNotices } from '../shared/review-notice-dom';
import { syncPublishGuardTooltip } from '../shared/publish-guard-ui';

( function bootDiviReview( attempt ) {
	const drawer = document.getElementById( 'flow-ew-divi-drawer' );
	if ( ! drawer ) {
		if ( attempt < 150 ) {
			requestAnimationFrame( function () {
				bootDiviReview( attempt + 1 );
			} );
		}
		return;
	}

	if ( drawer.dataset.flowEwDiviReady === '1' ) {
		return;
	}
	drawer.dataset.flowEwDiviReady = '1';

( function runDiviReview( drawer ) {
	let reviewWrapper = null;
	let reviewMainButton = null;
	let reviewDropdownButton = null;
	let toolbarMounted = false;

	function debounce( fn, ms ) {
		let t;
		return function () {
			clearTimeout( t );
			t = setTimeout( fn, ms );
		};
	}

	function ensureDrawerHost() {
		const host = document.querySelector( '.et-vb-top-window-ui' );
		if ( ! host ) {
			return false;
		}
		if ( drawer.parentElement !== host ) {
			host.appendChild( drawer );
		}
		return true;
	}

	function reviewLabel() {
		const i18n = window.flowEW && window.flowEW.i18n;
		return ( i18n && i18n.reviewPanelTitle ) || 'Review';
	}

	function findPageBarActions() {
		return (
			document.querySelector( '.et-vb-page-bar-right-side-save-button' ) ||
			document.querySelector( '.et-vb-page-bar-tools .et-vb-page-bar-right-side-save-button' ) ||
			document.querySelector( '.et-vb-page-bar' )?.querySelector(
				'.et-vb-page-bar-dropdown-button--fill'
			)?.closest( '.et-vb-page-bar-tools' ) ||
			null
		);
	}

	function findPreviewWrapper() {
		const bar = findPageBarActions();
		if ( ! bar ) {
			return null;
		}

		const wrappers = Array.from(
			bar.querySelectorAll( '.et-vb-page-bar-dropdown-button-wrapper' )
		);

		const byLabel = wrappers.find( function ( wrapper ) {
			const btn = wrapper.querySelector( '.et-vb-page-bar-action-button' );
			if ( ! btn ) {
				return false;
			}
			const label = ( btn.textContent || '' ).trim();
			return /preview/i.test( label );
		} );
		if ( byLabel ) {
			return byLabel;
		}

		const saveIdx = wrappers.findIndex( function ( wrapper ) {
			return !! wrapper.querySelector( '.et-vb-page-bar-dropdown-button--fill' );
		} );
		if ( saveIdx > 0 ) {
			return wrappers[ saveIdx - 1 ];
		}

		return wrappers.length >= 2 ? wrappers[ 1 ] : null;
	}

	function findExitWrapper() {
		const bar = findPageBarActions();
		if ( ! bar ) {
			return null;
		}

		const byClass = bar.querySelector( '.et-vb-page-bar-exit-button' );
		if ( byClass ) {
			return byClass;
		}

		return (
			Array.from(
				bar.querySelectorAll( '.et-vb-page-bar-dropdown-button-wrapper' )
			).find( function ( wrapper ) {
				const btn = wrapper.querySelector( '.et-vb-page-bar-action-button' );
				return (
					btn && /^\s*exit\s*$/i.test( ( btn.textContent || '' ).trim() )
				);
			} ) || null
		);
	}

	function bindReviewButtons( wrapper ) {
		if ( ! wrapper ) {
			return;
		}

		reviewMainButton = wrapper.querySelector( '.et-vb-page-bar-action-button' );
		reviewDropdownButton = wrapper.querySelector(
			'.et-vb-page-bar-dropdown-button--dropdown-menu'
		);

		[ reviewMainButton, reviewDropdownButton ].forEach( function ( btn ) {
			if ( ! btn ) {
				return;
			}
			if ( btn.dataset.flowEwReviewBound === '1' ) {
				return;
			}
			btn.dataset.flowEwReviewBound = '1';
			btn.addEventListener(
				'click',
				function ( e ) {
					e.preventDefault();
					e.stopPropagation();
					e.stopImmediatePropagation();
					toggleDrawer();
				},
				true
			);
		} );

		wrapper.dataset.flowEwReviewBound = '1';
	}

	function ensureReviewMainButtonContent( btn ) {
		if ( ! btn ) {
			return null;
		}

		let dot = btn.querySelector( '.flow-ew-divi-review-dot' );
		let label = btn.querySelector( '.flow-ew-divi-review-label' );

		if ( ! dot || ! label ) {
			btn.textContent = '';
			dot = document.createElement( 'span' );
			dot.className = 'flow-ew-divi-review-dot';
			dot.hidden = true;
			dot.setAttribute( 'aria-hidden', 'true' );
			label = document.createElement( 'span' );
			label.className = 'flow-ew-divi-review-label';
			btn.appendChild( dot );
			btn.appendChild( label );
		}

		label.textContent = reviewLabel();
		btn.setAttribute( 'aria-label', reviewLabel() );
		return { dot, label };
	}

	function syncReviewToolbarStatus( review ) {
		if ( ! reviewWrapper ) {
			return;
		}

		const status = review
			? review.display_status || review.status || ''
			: '';

		if ( status ) {
			reviewWrapper.setAttribute( 'data-status', status );
		} else {
			reviewWrapper.removeAttribute( 'data-status' );
		}

		const dot = reviewWrapper.querySelector( '.flow-ew-divi-review-dot' );
		if ( dot ) {
			dot.hidden = ! status;
		}
	}

	function createReviewWrapper( previewWrapper ) {
		const wrapper = document.createElement( 'div' );
		wrapper.className =
			'et-vb-page-bar-dropdown-button-wrapper flow-ew-divi-review-wrapper';

		const inner = document.createElement( 'div' );
		inner.className = 'et-vb-page-bar-dropdown-button';

		const mainBtn = document.createElement( 'button' );
		mainBtn.className = 'et-vb-page-bar-action-button';
		mainBtn.type = 'button';
		ensureReviewMainButtonContent( mainBtn );

		const dropdownBtn = document.createElement( 'div' );
		dropdownBtn.className = 'et-vb-page-bar-dropdown-button--dropdown-menu';
		dropdownBtn.setAttribute( 'role', 'button' );
		dropdownBtn.tabIndex = 0;
		dropdownBtn.setAttribute( 'aria-label', reviewLabel() );

		const previewCaret = previewWrapper
			? previewWrapper.querySelector(
					'.et-vb-page-bar-dropdown-button--dropdown-menu .et-vb-icon'
			  )
			: null;
		if ( previewCaret ) {
			dropdownBtn.appendChild( previewCaret.cloneNode( true ) );
		}

		inner.appendChild( mainBtn );
		inner.appendChild( dropdownBtn );
		wrapper.appendChild( inner );
		return wrapper;
	}

	function ensureReviewToolbarButton() {
		const exitWrapper = findExitWrapper();
		const previewWrapper = findPreviewWrapper();
		if ( ! exitWrapper || ! previewWrapper ) {
			return false;
		}

		if ( ! reviewWrapper || ! document.body.contains( reviewWrapper ) ) {
			reviewWrapper = createReviewWrapper( previewWrapper );
		}

		const mainBtn = reviewWrapper.querySelector(
			'.et-vb-page-bar-action-button'
		);
		ensureReviewMainButtonContent( mainBtn );
		syncReviewToolbarStatus(
			( window.flowEW && window.flowEW.activeReview ) || null
		);

		const exitParent = exitWrapper.parentElement;
		if (
			exitParent &&
			( reviewWrapper.parentElement !== exitParent ||
				reviewWrapper.nextElementSibling !== exitWrapper )
		) {
			exitParent.insertBefore( reviewWrapper, exitWrapper );
		}

		bindReviewButtons( reviewWrapper );
		toolbarMounted = true;
		return true;
	}

	function syncDiviColorMode() {
		const classic = drawer.querySelector( '.flow-ew-classic--divi' );
		if ( classic ) {
			// Match Divi submenus: dark panel in both light and dark app modes.
			classic.classList.add( 'flow-ew-classic--builder-dark' );
		}
	}

	syncDiviColorMode();
	if ( ! document.documentElement.dataset.flowEwDiviColorObserver ) {
		document.documentElement.dataset.flowEwDiviColorObserver = '1';
		const colorObserver = new MutationObserver( syncDiviColorMode );
		colorObserver.observe( document.documentElement, {
			attributes: true,
			attributeFilter: [ 'data-app-color-mode' ],
		} );
	}

	function syncToolbarAndDrawer() {
		ensureDrawerHost();
		return ensureReviewToolbarButton();
	}

	const debouncedEnsure = debounce( syncToolbarAndDrawer, 80 );
	const bodyObserver = new MutationObserver( function () {
		if ( ! toolbarMounted ) {
			syncToolbarAndDrawer();
		} else {
			debouncedEnsure();
		}
	} );
	bodyObserver.observe( document.body, {
		childList: true,
		subtree: true,
	} );

	let mountAttempts = 0;
	function tryMountLoop() {
		syncToolbarAndDrawer();
		mountAttempts++;
		if ( ! toolbarMounted && mountAttempts < 240 ) {
			requestAnimationFrame( tryMountLoop );
		}
	}
	tryMountLoop();

	function positionDrawer() {
		const anchor = reviewWrapper;
		if ( ! anchor ) {
			return;
		}
		const rect = anchor.getBoundingClientRect();
		const pageBar = document.querySelector( '.et-vb-page-bar' );
		const topPos = pageBar
			? Math.round( pageBar.getBoundingClientRect().bottom )
			: Math.round( rect.bottom );
		drawer.style.top = topPos + 'px';
		drawer.style.right = Math.round( window.innerWidth - rect.right ) + 'px';
		drawer.style.left = 'auto';
	}

	function refreshReviewNotices() {
		const ew = window.flowEW;
		if ( ! ew ) {
			return;
		}
		ensureReviewNotices( {
			reviewMandatory: ew.reviewMandatory,
			isPublished: ew.isPublished,
			review: ew.activeReview,
			reviewerMeta: ew.reviewerMeta,
			currentUserCan: ew.currentUserCan,
		} );
	}

	function setReviewActive( isActive ) {
		[ reviewMainButton, reviewDropdownButton ].forEach( function ( btn ) {
			if ( btn ) {
				btn.classList.toggle( 'et-vb-page-bar-button--active', isActive );
			}
		} );
	}

	function openDrawer() {
		ensureDrawerHost();
		drawer.hidden = false;
		positionDrawer();
		drawer.classList.add( 'is-open' );
		setReviewActive( true );
		refreshReviewNotices();
	}

	function closeDrawer() {
		drawer.classList.remove( 'is-open' );
		setReviewActive( false );
		drawer.hidden = true;
	}

	function toggleDrawer() {
		if ( drawer.classList.contains( 'is-open' ) ) {
			closeDrawer();
		} else {
			openDrawer();
		}
	}

	document.addEventListener( 'keydown', function ( e ) {
		if ( e.key === 'Escape' && drawer.classList.contains( 'is-open' ) ) {
			closeDrawer();
		}
	} );

	document.addEventListener( 'mousedown', function ( e ) {
		if ( ! drawer.classList.contains( 'is-open' ) ) {
			return;
		}
		if (
			drawer.contains( e.target ) ||
			( reviewWrapper && reviewWrapper.contains( e.target ) )
		) {
			return;
		}
		closeDrawer();
	} );

	window.addEventListener( 'resize', function () {
		if ( drawer.classList.contains( 'is-open' ) ) {
			positionDrawer();
		}
	} );

	const ew = window.flowEW || {};
	const reviewMandatory = !! ew.reviewMandatory;
	const isPublished = !! ew.isPublished;
	const reviewerMeta = Number( ew.reviewerMeta || 0 );
	let lastReview = ew.activeReview || null;
	let blockedState = false;
	let publishGuardTimer;

	function currentReviewerId( review ) {
		const fromReview = Number(
			( review && review.reviewer_id ) ||
				( review && review.reviewer && review.reviewer.id ) ||
				0
		);
		return fromReview > 0 ? fromReview : reviewerMeta;
	}

	function hasAssignedReviewer( review ) {
		if ( currentReviewerId( review ) > 0 ) {
			return true;
		}
		const sid = Number(
			( review && review.reviewer && review.reviewer.id ) || 0
		);
		if ( sid !== 0 ) {
			return true;
		}
		if (
			( review && review.invite_email ) ||
			( review && review.reviewer && review.reviewer.is_email )
		) {
			return true;
		}
		if (
			review &&
			Array.isArray( review.email_invites ) &&
			review.email_invites.length > 0
		) {
			return true;
		}
		return false;
	}

	function isPublishBlocked( review ) {
		if ( ! reviewMandatory ) {
			return false;
		}
		if ( isPublished ) {
			return false;
		}
		if ( ! review || review.status !== 'approved' ) {
			return true;
		}
		return ! hasAssignedReviewer( review );
	}

	function findSaveAndPublishMenuItem() {
		return Array.from(
			document.querySelectorAll( '.et-vb-right-click-option' )
		).find( function ( item ) {
			return /save\s*&\s*publish/i.test( ( item.textContent || '' ).trim() );
		} );
	}

	function applyPublishGuard( review ) {
		blockedState = isPublishBlocked( review );
		document.body.classList.toggle(
			'flow-ew-divi-publish-blocked',
			blockedState
		);

		const menuItem = findSaveAndPublishMenuItem();
		if ( ! menuItem ) {
			return;
		}

		const wrap =
			menuItem.closest( '.et-vb-right-click-option-wrap' ) || menuItem;

		wrap.classList.toggle(
			'et-vb-right-click-option-wrap--disabled',
			blockedState
		);
		wrap.classList.toggle( 'flow-ew-divi-publish-blocked-item', blockedState );

		if ( blockedState ) {
			menuItem.style.opacity = '0.4';
			menuItem.style.pointerEvents = 'none';
			menuItem.style.cursor = 'not-allowed';
		} else {
			menuItem.style.opacity = '';
			menuItem.style.pointerEvents = '';
			menuItem.style.cursor = '';
		}

		syncPublishGuardTooltip( menuItem, blockedState );
	}

	function schedulePublishGuard( review ) {
		if ( review !== undefined ) {
			lastReview = review;
		}
		clearTimeout( publishGuardTimer );
		publishGuardTimer = setTimeout( function () {
			applyPublishGuard( lastReview );
		}, 80 );
	}

	document.addEventListener(
		'click',
		function ( e ) {
			if ( ! blockedState ) {
				return;
			}
			const target = e.target;
			if ( ! target || ! target.closest ) {
				return;
			}
			if (
				target.closest( '.flow-ew-divi-drawer' ) ||
				target.closest( '.flow-ew-divi-review-wrapper' )
			) {
				return;
			}
			const menuItem = target.closest( '.et-vb-right-click-option' );
			if (
				menuItem &&
				/save\s*&\s*publish/i.test( ( menuItem.textContent || '' ).trim() )
			) {
				e.preventDefault();
				e.stopImmediatePropagation();
			}
		},
		true
	);

	const guardObserver = new MutationObserver( function () {
		schedulePublishGuard();
	} );
	guardObserver.observe( document.body, {
		childList: true,
		subtree: true,
	} );

	schedulePublishGuard( lastReview );



	document.addEventListener( 'flow-ew:classic-render', function ( e ) {
		const review = e.detail && e.detail.review;
		syncReviewToolbarStatus( review );
		syncReviewerComboboxFromReview( review );
		const list = document.getElementById( 'flow-ew-reviewer-listbox' );
		const input = document.getElementById( 'flow-ew-reviewer-input' );
		if ( list ) {
			list.hidden = true;
		}
		if ( input ) {
			input.setAttribute( 'aria-expanded', 'false' );
		}
		schedulePublishGuard( review );
		syncFreeUpsells( review );
	} );

	function buildUpsellNode( data, className, linkMarginTop ) {
		const wrap = document.createElement( 'div' );
		wrap.className = className;
		wrap.setAttribute( 'data-flow-ew-divi-upsell', '1' );

		const link = document.createElement( 'a' );
		link.href = data.href || '#';
		link.style.marginTop = linkMarginTop;

		const badge = document.createElement( 'span' );
		badge.className = 'flow-ew-upsell-badge';
		badge.textContent = 'PRO';
		link.appendChild( badge );
		link.appendChild( document.createTextNode( data.label ) );
		wrap.appendChild( link );

		if ( data.helpText ) {
			const help = document.createElement( 'p' );
			help.className = 'flow-ew-upsell-help';
			help.textContent = data.helpText;
			wrap.appendChild( help );
		}

		return wrap;
	}

	function getFallbackUpsellData( type ) {
		if ( drawer.dataset.flowEwUpsellEnabled !== '1' ) {
			return null;
		}
		const href = drawer.dataset.flowEwUpsellHref || '';
		if ( ! href ) {
			return null;
		}
		if ( type === 'open' ) {
			const label = drawer.dataset.flowEwUpsellOpenLabel || '';
			if ( ! label ) {
				return null;
			}
			return {
				href,
				label,
				helpText: drawer.dataset.flowEwUpsellOpenHelp || '',
			};
		}
		const label = drawer.dataset.flowEwUpsellReviewerLabel || '';
		if ( ! label ) {
			return null;
		}
		return {
			href,
			label,
			helpText: drawer.dataset.flowEwUpsellReviewerHelp || '',
		};
	}

	function syncFreeUpsells( review ) {
		const openData = window.flowEwUpsell || getFallbackUpsellData( 'open' );
		if ( openData && openData.label ) {
			drawer
				.querySelectorAll( '.flow-ew-open-review-extras' )
				.forEach( function ( slot ) {
					let node = slot.querySelector( '.flow-ew-upsell-open-review' );
					if ( ! node ) {
						node = buildUpsellNode(
							openData,
							'flow-ew-upsell-open-review',
							'6px'
						);
						slot.appendChild( node );
					}
					const open = !! ( review && review.is_open );
					node.style.display = open ? '' : 'none';
				} );
		}

		const reviewerData =
			window.flowEwUpsellReviewer || getFallbackUpsellData( 'reviewer' );
		if ( reviewerData && reviewerData.label ) {
			syncBuilderReviewerUpsell( {
				root: drawer,
				review,
				data: reviewerData,
				className: 'flow-ew-upsell-reviewer',
				markerAttr: 'data-flow-ew-divi-upsell-reviewer',
				buildNode: function ( data, className ) {
					const node = buildUpsellNode( data, className, '14px' );
					node.setAttribute( 'data-flow-ew-divi-upsell-reviewer', '1' );
					return node;
				},
			} );
			const reviewerSelect = drawer.querySelector(
				'#flow-ew-reviewer-select'
			);
			if ( reviewerSelect && ! reviewerSelect.dataset.flowDiviUpsellBound ) {
				reviewerSelect.dataset.flowDiviUpsellBound = '1';
				reviewerSelect.addEventListener( 'change', function () {
					syncFreeUpsells(
						( window.flowEW && window.flowEW.activeReview ) || review
					);
				} );
			}
		}
	}

	syncFreeUpsells( lastReview );

	const comboboxRoot = drawer.querySelector( '#flow-ew-reviewer-combobox' );
	if ( comboboxRoot ) {
		initReviewerCombobox( comboboxRoot );
	}

	function initReviewerCombobox( root ) {
		const input = root.querySelector( '.flow-ew-reviewer-combobox__input' );
		const list = root.querySelector( '.flow-ew-reviewer-combobox__list' );
		const select = root.querySelector( '#flow-ew-reviewer-select' );
		if ( ! input || ! list || ! select ) {
			return;
		}

		const options = Array.from(
			list.querySelectorAll( '[role="option"]' )
		);
		let activeIndex = -1;
		let emailEntryMode = false;

		function hideAutocomplete() {
			return shouldHideReviewerAutocomplete(
				select,
				input,
				emailEntryMode
			);
		}

		function setOpen( openList ) {
			if ( openList && ( hideAutocomplete() || visibleOptions().length === 0 ) ) {
				openList = false;
			}
			list.hidden = ! openList;
			input.setAttribute( 'aria-expanded', openList ? 'true' : 'false' );
		}

		function filterOptions( q ) {
			filterReviewerComboboxOptions( options, q );
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
			const id = li.dataset.value;
			const label = li.dataset.label || li.textContent.trim();
			select.value = id;
			setOpen( false );
			activeIndex = -1;
			if ( isEmailComboboxOption( li ) ) {
				const typed = ( input.value || '' ).trim();
				if ( isValidEmail( typed ) ) {
					emailEntryMode = true;
					select.value = 'email';
					setOpen( false );
					activeIndex = -1;
					dispatchAssignInviteEmail( typed );
					return;
				}
				emailEntryMode = true;
				input.readOnly = false;
				input.value = '';
				input.placeholder = getEmailPlaceholder();
				select.dispatchEvent( new Event( 'change', { bubbles: true } ) );
				input.focus();
				return;
			}
			emailEntryMode = false;
			input.value = label;
			select.dispatchEvent( new Event( 'change', { bubbles: true } ) );
		}

		input.addEventListener( 'focus', function () {
			if ( input.disabled || input.readOnly ) {
				return;
			}
			if ( hideAutocomplete() ) {
				setOpen( false );
				return;
			}
			filterOptions( input.value );
			setOpen( true );
		} );

		input.addEventListener( 'input', function () {
			if ( input.disabled || input.readOnly ) {
				return;
			}
			const typed = ( input.value || '' ).trim();
			// Valid address → show Invite row (even after External Email).
			if ( isValidEmail( typed ) ) {
				emailEntryMode = true;
				select.value = 'email';
				filterOptions( typed );
				setOpen( true );
				activeIndex = -1;
				return;
			}
			if ( emailEntryMode || select.value === 'email' ) {
				if ( ! typed ) {
					emailEntryMode = false;
					exitReviewerEmailEntryMode( select, input, options );
					filterOptions( '' );
					setOpen( true );
					activeIndex = -1;
					return;
				}
				emailEntryMode = true;
				select.value = 'email';
				setOpen( false );
				activeIndex = -1;
				return;
			}
			filterOptions( input.value );
			setOpen( true );
			activeIndex = -1;
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
			exitReviewerEmailEntryMode( select, input, options );
			filterOptions( '' );
			setOpen( false );
			activeIndex = -1;
		} );

		input.addEventListener( 'keydown', function ( e ) {
			if ( input.disabled || input.readOnly ) {
				return;
			}
			const vis = visibleOptions();
			if ( e.key === 'ArrowDown' ) {
				e.preventDefault();
				if ( hideAutocomplete() ) {
					setOpen( false );
					return;
				}
				if ( ! list.hidden && vis.length ) {
					activeIndex = Math.min( activeIndex + 1, vis.length - 1 );
					vis[ activeIndex ].focus();
				} else {
					filterOptions( input.value );
					setOpen( true );
					activeIndex = 0;
					if ( vis[ 0 ] ) {
						vis[ 0 ].focus();
					}
				}
			} else if ( e.key === 'ArrowUp' ) {
				e.preventDefault();
				if ( hideAutocomplete() ) {
					setOpen( false );
					return;
				}
				if ( ! list.hidden && vis.length ) {
					activeIndex = Math.max( activeIndex - 1, 0 );
					vis[ activeIndex ].focus();
				}
			} else if ( e.key === 'Enter' ) {
				const focused = list.querySelector( '[role="option"]:focus' );
				if ( focused && ! focused.hidden ) {
					e.preventDefault();
					chooseOption( focused );
					return;
				}
				const typed = ( input.value || '' ).trim();
				if ( isValidEmail( typed ) ) {
					e.preventDefault();
					e.stopPropagation();
					emailEntryMode = true;
					select.value = 'email';
					setOpen( false );
					activeIndex = -1;
					dispatchAssignInviteEmail( typed );
				}
			} else if ( e.key === 'Escape' ) {
				setOpen( false );
				activeIndex = -1;
				input.focus();
			}
		} );
	}

	refreshReviewNotices();
} )( drawer );
} )( 0 );
