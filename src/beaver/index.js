import './style.css';
import { syncReviewerComboboxFromReview } from '../shared/sync-reviewer-combobox-from-review';
import '../shared/share-bar.css';
import { syncPublishGuardTooltip } from '../shared/publish-guard-ui';
import { debounce } from '../shared/debounce';
import { mountWithRetry } from '../shared/mount-retry';
import { createBuilderPublishGuard } from '../shared/builder-publish-guard';
import { syncFreeUpsells } from '../shared/builder-upsell';

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
			parseFloat(
				styles.getPropertyValue( '--fl-builder-panel-width' )
			) || 320;
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
			proxy.className =
				toggleEl.className + ' flow-ew-beaver-toggle-proxy';
			if ( toggleEl.getAttribute( 'aria-label' ) ) {
				proxy.setAttribute(
					'aria-label',
					toggleEl.getAttribute( 'aria-label' )
				);
			}
			if ( toggleEl.getAttribute( 'title' ) ) {
				proxy.setAttribute( 'title', toggleEl.getAttribute( 'title' ) );
			}
			const icon = toggleEl.querySelector(
				'.flow-ew-beaver-toggle__icon'
			);
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

	mountWithRetry( ensureToolbarButton );

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

	if ( window.FLBuilder && typeof window.FLBuilder.addHook === 'function' ) {
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

	const guard = createBuilderPublishGuard( function ( blocked ) {
		document.body.classList.toggle(
			'flow-ew-beaver-publish-blocked',
			blocked
		);
		syncPublishGuardTooltip( findPublishActionButton(), blocked );
	} );

	document.addEventListener(
		'click',
		function ( e ) {
			if ( ! guard.isBlocked() ) {
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

	document.addEventListener( 'flow-ew:classic-render', function ( e ) {
		const review = e.detail && e.detail.review;
		const status = ( review && review.status ) || '';
		syncToggleStatus( status );
		syncReviewerComboboxFromReview( review );
		syncBeaverDarkSkin();
		guard.schedule( review );
		syncFreeUpsells( { root: getDrawer(), review, builder: 'beaver' } );
	} );

	syncFreeUpsells( {
		root: getDrawer(),
		review: guard.lastReview(),
		builder: 'beaver',
	} );
} )( 0 );
