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
import { syncPublishGuardTooltip } from '../shared/publish-guard-ui';

( function bootBeaverReview( attempt ) {
	const drawer = document.getElementById( 'flow-ew-beaver-drawer' );
	const toggle = document.getElementById( 'flow-ew-beaver-toggle' );
	if ( ! drawer || ! toggle ) {
		if ( attempt < 150 ) {
			requestAnimationFrame( function () {
				bootBeaverReview( attempt + 1 );
			} );
		}
		return;
	}

	if ( drawer.dataset.flowEwBeaverReady === '1' ) {
		return;
	}
	drawer.dataset.flowEwBeaverReady = '1';

	function getDrawer() {
		return document.getElementById( 'flow-ew-beaver-drawer' );
	}

	function isBeaverDarkSkin() {
		return document.body.classList.contains( 'fl-builder-ui-skin--dark' );
	}

	function syncBeaverDarkSkin() {
		const panel = getDrawer();
		if ( ! panel ) {
			return;
		}
		const classic = panel.querySelector( '.flow-ew-classic--beaver' );
		if ( classic ) {
			classic.classList.toggle(
				'flow-ew-classic--builder-dark',
				isBeaverDarkSkin()
			);
		}
	}

	syncBeaverDarkSkin();
	if ( ! document.body.dataset.flowEwBeaverSkinObserver ) {
		document.body.dataset.flowEwBeaverSkinObserver = '1';
		const skinObserver = new MutationObserver( syncBeaverDarkSkin );
		skinObserver.observe( document.body, {
			attributes: true,
			attributeFilter: [ 'class' ],
		} );
	}

	function resolveToggle() {
		return document.getElementById( 'flow-ew-beaver-toggle' );
	}

	function resolveToolbarProxy() {
		return document.querySelector( '.flow-ew-beaver-toggle-proxy' );
	}

	function resolvePanelArrow() {
		const panel = getDrawer();
		return panel ? panel.querySelector( '.fl-builder--panel-arrow' ) : null;
	}

	function isDrawerOpen() {
		const panel = getDrawer();
		return !! panel && panel.classList.contains( 'is-open' );
	}

	function isToggleInteraction( target ) {
		if ( ! target || ! target.closest ) {
			return false;
		}
		return !! target.closest( '.flow-ew-beaver-toggle-proxy' );
	}

	function hideBeaverContentPanel() {
		if (
			window.FLBuilder &&
			typeof window.FLBuilder.triggerHook === 'function'
		) {
			window.FLBuilder.triggerHook( 'hideContentPanel' );
		}
	}

	function replayPanelAnimation( panel ) {
		if ( ! panel ) {
			return;
		}
		panel.style.animation = 'none';
		void panel.offsetWidth;
		panel.style.animation = '';
	}

	function alignPanelArrow() {
		const proxy = resolveToolbarProxy();
		const arrow = resolvePanelArrow();
		if ( ! proxy || ! arrow ) {
			return;
		}

		const styles = getComputedStyle( document.documentElement );
		const panelWidth =
			parseFloat( styles.getPropertyValue( '--fl-builder-panel-width' ) ) ||
			320;
		const arrowWidth = arrow.getBoundingClientRect().width || 20;
		const buttonRect = proxy.getBoundingClientRect();
		const buttonCenterX = buttonRect.x + buttonRect.width / 2;
		const panelLeft = window.innerWidth - panelWidth;
		let arrowX = 20;

		if ( buttonCenterX >= panelLeft ) {
			arrowX = buttonCenterX - panelLeft - arrowWidth / 2;
		}

		arrow.style.left = Math.max( 12, arrowX ) + 'px';
		arrow.style.right = 'auto';
	}

	function debounce( fn, ms ) {
		let t;
		return function () {
			clearTimeout( t );
			t = setTimeout( fn, ms );
		};
	}

	function findBarActions() {
		return document.querySelector( '.fl-builder-bar-actions' );
	}

	function findDoneButton() {
		const actions = findBarActions();
		return actions
			? actions.querySelector( '.fl-builder-done-button' )
			: null;
	}

	function findPublishActionButton() {
		return document.querySelector(
			'.fl-builder-publish-actions [data-action="publish"]'
		);
	}

	let closeTimer = null;

	function bindProxyToggle( proxy ) {
		if ( ! proxy || proxy.dataset.flowEwToggleBound === '1' ) {
			return;
		}
		proxy.dataset.flowEwToggleBound = '1';
		proxy.addEventListener( 'click', function ( e ) {
			e.preventDefault();
			e.stopPropagation();
			toggleDrawer();
		} );
	}

	function syncToggleStatus( status ) {
		const toggleEl = resolveToggle();
		const proxy = resolveToolbarProxy();
		const host = document.querySelector( '.flow-ew-beaver-review' );
		if ( toggleEl ) {
			toggleEl.dataset.status = status;
			toggleEl.setAttribute( 'data-status', status );
		}
		if ( proxy ) {
			proxy.dataset.status = status;
			proxy.setAttribute( 'data-status', status );
		}
		if ( host ) {
			host.setAttribute( 'data-status', status );
		}
	}

	function syncToolbarProxyActive( isActive ) {
		const toggleEl = resolveToggle();
		const proxy = resolveToolbarProxy();
		[ toggleEl, proxy ].forEach( function ( btn ) {
			if ( ! btn ) {
				return;
			}
			btn.classList.toggle( 'is-active', isActive );
			btn.setAttribute( 'aria-expanded', isActive ? 'true' : 'false' );
		} );
	}

	function isHostPlacedAfterDone( host, actions, doneBtn ) {
		return (
			host.parentElement === actions &&
			host.previousElementSibling === doneBtn
		);
	}

	function ensureToolbarButton() {
		const toggleEl = resolveToggle();
		const actions = findBarActions();
		const doneBtn = findDoneButton();
		if ( ! toggleEl || ! actions || ! doneBtn ) {
			return false;
		}

		let host = actions.querySelector( '.flow-ew-beaver-review' );
		if ( ! host ) {
			host = document.createElement( 'span' );
			host.className = 'flow-ew-beaver-review';
		}

		let proxy = host.querySelector( '.flow-ew-beaver-toggle-proxy' );
		if ( ! proxy ) {
			proxy = document.createElement( 'button' );
			proxy.type = 'button';
			proxy.className = toggleEl.className + ' flow-ew-beaver-toggle-proxy';
			if ( toggleEl.getAttribute( 'aria-label' ) ) {
				proxy.setAttribute(
					'aria-label',
					toggleEl.getAttribute( 'aria-label' )
				);
			}
			if ( toggleEl.getAttribute( 'title' ) ) {
				proxy.setAttribute( 'title', toggleEl.getAttribute( 'title' ) );
			}
			const icon = toggleEl.querySelector( '.flow-ew-beaver-toggle__icon' );
			proxy.innerHTML = icon ? icon.outerHTML : toggleEl.innerHTML;
			host.appendChild( proxy );
		}

		toggleEl.hidden = true;
		proxy.hidden = false;

		if ( ! isHostPlacedAfterDone( host, actions, doneBtn ) ) {
			const anchor = doneBtn.nextElementSibling;
			if ( anchor && anchor !== host ) {
				actions.insertBefore( host, anchor );
			} else {
				doneBtn.insertAdjacentElement( 'afterend', host );
			}
		}

		syncToggleStatus( toggleEl.dataset.status || '' );
		syncToolbarProxyActive( isDrawerOpen() );
		bindProxyToggle( proxy );
		alignPanelArrow();
		return true;
	}

	const debouncedEnsure = debounce( ensureToolbarButton, 80 );
	const bodyObserver = new MutationObserver( debouncedEnsure );
	bodyObserver.observe( document.body, {
		childList: true,
		subtree: true,
	} );

	let attempts = 0;
	function tryEnsureLoop() {
		const ok = ensureToolbarButton();
		attempts++;
		if ( ! ok && attempts < 240 ) {
			requestAnimationFrame( tryEnsureLoop );
		}
	}
	tryEnsureLoop();

	function open() {
		const panel = getDrawer();
		if ( ! panel ) {
			return;
		}
		if ( closeTimer ) {
			clearTimeout( closeTimer );
			closeTimer = null;
		}
		hideBeaverContentPanel();
		alignPanelArrow();
		panel.removeAttribute( 'hidden' );
		document.body.classList.add( 'flow-ew-beaver-review-is-showing' );
		replayPanelAnimation( panel );
		panel.classList.add( 'is-open' );
		syncToolbarProxyActive( true );
	}

	function close() {
		const panel = getDrawer();
		if ( ! panel ) {
			return;
		}
		panel.classList.remove( 'is-open' );
		document.body.classList.remove( 'flow-ew-beaver-review-is-showing' );
		syncToolbarProxyActive( false );
		if ( closeTimer ) {
			clearTimeout( closeTimer );
		}
		closeTimer = setTimeout( function () {
			closeTimer = null;
			const current = getDrawer();
			if ( current && ! current.classList.contains( 'is-open' ) ) {
				current.setAttribute( 'hidden', '' );
			}
		}, 150 );
	}

	function toggleDrawer() {
		if ( isDrawerOpen() ) {
			close();
		} else {
			open();
		}
	}

	if (
		window.FLBuilder &&
		typeof window.FLBuilder.addHook === 'function'
	) {
		window.FLBuilder.addHook( 'willShowContentPanel', close );
	}

	window.addEventListener(
		'resize',
		debounce( function () {
			if ( isDrawerOpen() ) {
				alignPanelArrow();
			}
		}, 80 )
	);

	const closeBtn = drawer.querySelector( '.flow-ew-beaver-drawer__close' );
	if ( closeBtn && ! closeBtn.dataset.flowEwCloseBound ) {
		closeBtn.dataset.flowEwCloseBound = '1';
		closeBtn.addEventListener( 'click', function ( e ) {
			e.preventDefault();
			e.stopPropagation();
			close();
		} );
	}

	document.addEventListener( 'keydown', function ( e ) {
		if ( e.key === 'Escape' && isDrawerOpen() ) {
			close();
		}
	} );

	document.addEventListener( 'mousedown', function ( e ) {
		if ( ! isDrawerOpen() ) {
			return;
		}
		const panel = getDrawer();
		if ( ! panel ) {
			return;
		}
		if ( panel.contains( e.target ) || isToggleInteraction( e.target ) ) {
			return;
		}
		close();
	} );

	const ew = window.flowEW || {};
	const reviewMandatory = !! ew.reviewMandatory;
	const isPublished = !! ew.isPublished;
	const reviewerMeta = Number( ew.reviewerMeta || 0 );
	let lastReview = ew.activeReview || null;
	let publishGuardTimer;
	let blockedState = false;

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

	function applyPublishGuard( review ) {
		blockedState = isPublishBlocked( review );
		document.body.classList.toggle(
			'flow-ew-beaver-publish-blocked',
			blockedState
		);
		syncPublishGuardTooltip( findPublishActionButton(), blockedState );
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
				target.closest( '.flow-ew-beaver-toggle-proxy' ) ||
				target.closest( '.flow-ew-beaver-review-panel' )
			) {
				return;
			}
			if (
				target.closest(
					'.fl-builder-publish-actions [data-action="publish"]'
				)
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



	function buildUpsellNode( data, className, linkMarginTop ) {
		const wrap = document.createElement( 'div' );
		wrap.className = className;
		wrap.setAttribute( 'data-flow-ew-beaver-upsell', '1' );

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
		const panel = getDrawer();
		if ( ! panel || panel.dataset.flowEwUpsellEnabled !== '1' ) {
			return null;
		}
		const href = panel.dataset.flowEwUpsellHref || '';
		if ( ! href ) {
			return null;
		}
		if ( type === 'open' ) {
			const label = panel.dataset.flowEwUpsellOpenLabel || '';
			if ( ! label ) {
				return null;
			}
			return {
				href,
				label,
				helpText: panel.dataset.flowEwUpsellOpenHelp || '',
			};
		}
		const label = panel.dataset.flowEwUpsellReviewerLabel || '';
		if ( ! label ) {
			return null;
		}
		return {
			href,
			label,
			helpText: panel.dataset.flowEwUpsellReviewerHelp || '',
		};
	}

	function syncFreeUpsells( review ) {
		const panel = getDrawer();
		if ( ! panel ) {
			return;
		}

		const openData = window.flowEwUpsell || getFallbackUpsellData( 'open' );
		if ( openData && openData.label ) {
			panel
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
				root: panel,
				review,
				data: reviewerData,
				className: 'flow-ew-upsell-reviewer',
				markerAttr: 'data-flow-ew-beaver-upsell-reviewer',
				buildNode: function ( data, className ) {
					const node = buildUpsellNode( data, className, '14px' );
					node.setAttribute(
						'data-flow-ew-beaver-upsell-reviewer',
						'1'
					);
					return node;
				},
			} );
			const reviewerSelect = panel.querySelector(
				'#flow-ew-reviewer-select'
			);
			if (
				reviewerSelect &&
				! reviewerSelect.dataset.flowBeaverUpsellBound
			) {
				reviewerSelect.dataset.flowBeaverUpsellBound = '1';
				reviewerSelect.addEventListener( 'change', function () {
					syncFreeUpsells(
						( window.flowEW && window.flowEW.activeReview ) || review
					);
				} );
			}
		}
	}

	document.addEventListener( 'flow-ew:classic-render', function ( e ) {
		const review = e.detail && e.detail.review;
		const status = ( review && review.status ) || '';
		syncToggleStatus( status );
		syncReviewerComboboxFromReview( review );
		syncBeaverDarkSkin();
		schedulePublishGuard( review );
		syncFreeUpsells( review );
	} );

	const comboboxRoot = document.getElementById( 'flow-ew-reviewer-combobox' );
	if ( comboboxRoot ) {
		initReviewerCombobox( comboboxRoot );
	}

	syncFreeUpsells( lastReview );

	function initReviewerCombobox( root ) {
		if ( root.dataset.flowEwComboboxReady === '1' ) {
			return;
		}
		root.dataset.flowEwComboboxReady = '1';

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
			if ( openList && hideAutocomplete() ) {
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
} )( 0 );
