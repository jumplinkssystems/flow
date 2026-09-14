import './style.css';
import { syncReviewerComboboxFromReview } from '../shared/sync-reviewer-combobox-from-review';
import '../shared/share-bar.css';
import { ensureReviewNotices } from '../shared/review-notice-dom';
import { syncPublishGuardTooltip } from '../shared/publish-guard-ui';
import { collapseReviewerListbox } from '../shared/reviewer-combobox';
import { mountWithRetry } from '../shared/mount-retry';
import { createBuilderPublishGuard } from '../shared/builder-publish-guard';
import { syncFreeUpsells } from '../shared/builder-upsell';

( function bootDiviReview( attempt ) {
	const diviDrawer = document.getElementById( 'flow-ew-divi-drawer' );
	if ( ! diviDrawer ) {
		if ( attempt < 150 ) {
			requestAnimationFrame( function () {
				bootDiviReview( attempt + 1 );
			} );
		}
		return;
	}

	if ( diviDrawer.dataset.flowEwDiviReady === '1' ) {
		return;
	}
	diviDrawer.dataset.flowEwDiviReady = '1';

	( function runDiviReview( drawer ) {
		let reviewWrapper = null;
		let reviewMainButton = null;
		let reviewDropdownButton = null;

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
				document.querySelector(
					'.et-vb-page-bar-right-side-save-button'
				) ||
				document.querySelector(
					'.et-vb-page-bar-tools .et-vb-page-bar-right-side-save-button'
				) ||
				document
					.querySelector( '.et-vb-page-bar' )
					?.querySelector( '.et-vb-page-bar-dropdown-button--fill' )
					?.closest( '.et-vb-page-bar-tools' ) ||
				null
			);
		}

		function findPreviewWrapper() {
			const bar = findPageBarActions();
			if ( ! bar ) {
				return null;
			}

			const wrappers = Array.from(
				bar.querySelectorAll(
					'.et-vb-page-bar-dropdown-button-wrapper'
				)
			);

			const byLabel = wrappers.find( function ( wrapper ) {
				const btn = wrapper.querySelector(
					'.et-vb-page-bar-action-button'
				);
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
				return !! wrapper.querySelector(
					'.et-vb-page-bar-dropdown-button--fill'
				);
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
					bar.querySelectorAll(
						'.et-vb-page-bar-dropdown-button-wrapper'
					)
				).find( function ( wrapper ) {
					const btn = wrapper.querySelector(
						'.et-vb-page-bar-action-button'
					);
					return (
						btn &&
						/^\s*exit\s*$/i.test( ( btn.textContent || '' ).trim() )
					);
				} ) || null
			);
		}

		function bindReviewButtons( wrapper ) {
			if ( ! wrapper ) {
				return;
			}

			reviewMainButton = wrapper.querySelector(
				'.et-vb-page-bar-action-button'
			);
			reviewDropdownButton = wrapper.querySelector(
				'.et-vb-page-bar-dropdown-button--dropdown-menu'
			);

			[ reviewMainButton, reviewDropdownButton ].forEach(
				function ( btn ) {
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
				}
			);

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

			const dot = reviewWrapper.querySelector(
				'.flow-ew-divi-review-dot'
			);
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
			dropdownBtn.className =
				'et-vb-page-bar-dropdown-button--dropdown-menu';
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

			if (
				! reviewWrapper ||
				! document.body.contains( reviewWrapper )
			) {
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

		mountWithRetry( syncToolbarAndDrawer );

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
			drawer.style.right =
				Math.round( window.innerWidth - rect.right ) + 'px';
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
			[ reviewMainButton, reviewDropdownButton ].forEach(
				function ( btn ) {
					if ( btn ) {
						btn.classList.toggle(
							'et-vb-page-bar-button--active',
							isActive
						);
					}
				}
			);
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
			if (
				e.key === 'Escape' &&
				drawer.classList.contains( 'is-open' )
			) {
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

		const guard = createBuilderPublishGuard( function ( blocked ) {
			document.body.classList.toggle(
				'flow-ew-divi-publish-blocked',
				blocked
			);

			const menuItem = findSaveAndPublishMenuItem();
			if ( ! menuItem ) {
				return;
			}
			const wrap =
				menuItem.closest( '.et-vb-right-click-option-wrap' ) ||
				menuItem;
			wrap.classList.toggle(
				'et-vb-right-click-option-wrap--disabled',
				blocked
			);
			wrap.classList.toggle(
				'flow-ew-divi-publish-blocked-item',
				blocked
			);
			menuItem.style.opacity = blocked ? '0.4' : '';
			menuItem.style.pointerEvents = blocked ? 'none' : '';
			menuItem.style.cursor = blocked ? 'not-allowed' : '';
			syncPublishGuardTooltip( menuItem, blocked );
		} );

		function findSaveAndPublishMenuItem() {
			return Array.from(
				document.querySelectorAll( '.et-vb-right-click-option' )
			).find( function ( item ) {
				return /save\s*&\s*publish/i.test(
					( item.textContent || '' ).trim()
				);
			} );
		}

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
					target.closest( '.flow-ew-divi-drawer' ) ||
					target.closest( '.flow-ew-divi-review-wrapper' )
				) {
					return;
				}
				const menuItem = target.closest( '.et-vb-right-click-option' );
				if (
					menuItem &&
					/save\s*&\s*publish/i.test(
						( menuItem.textContent || '' ).trim()
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
			syncReviewToolbarStatus( review );
			syncReviewerComboboxFromReview( review );
			collapseReviewerListbox();
			guard.schedule( review );
			syncFreeUpsells( { root: drawer, review, builder: 'divi' } );
		} );

		syncFreeUpsells( {
			root: drawer,
			review: guard.lastReview(),
			builder: 'divi',
		} );

		refreshReviewNotices();
	} )( diviDrawer );
} )( 0 );
