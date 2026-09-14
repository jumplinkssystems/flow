import './style.css';
import { syncReviewerComboboxFromReview } from '../shared/sync-reviewer-combobox-from-review';
import '../shared/share-bar.css';
import { syncPublishGuardTooltip } from '../shared/publish-guard-ui';
import { debounce } from '../shared/debounce';
import { mountWithRetry } from '../shared/mount-retry';
import { createBuilderPublishGuard } from '../shared/builder-publish-guard';
import { syncFreeUpsells } from '../shared/builder-upsell';

( function () {
	const drawers = Array.from(
		document.querySelectorAll( '#flow-ew-avada-drawer' )
	);
	const toggles = Array.from(
		document.querySelectorAll( '#flow-ew-avada-toggle' )
	);
	const drawer = drawers.length ? drawers[ drawers.length - 1 ] : null;
	const toggle = toggles.length ? toggles[ toggles.length - 1 ] : null;
	if ( ! drawer || ! toggle ) {
		return;
	}

	// Avada can render footer content more than once in some builder flows.
	// Keep one canonical Flow drawer/toggle pair so ID-based selectors from
	// Classic/Pro companion bundles bind to the visible instance.
	drawers.forEach( function ( el ) {
		if ( el !== drawer ) {
			el.remove();
		}
	} );
	toggles.forEach( function ( el ) {
		if ( el !== toggle ) {
			el.remove();
		}
	} );

	function findToolbarRoot() {
		return (
			document.querySelector(
				'.fusion-builder-live-toolbar.fusion-top-frame'
			) ||
			document.getElementById( 'fusion_builder_controls' ) ||
			document.querySelector( '.save-wrapper.fb' ) ||
			document.querySelector( '.fusion-builder-update-buttons' ) ||
			document.querySelector( '.fusion-builder-controls' ) ||
			document.querySelector(
				'[class*="fusion-builder"][class*="toolbar"]'
			)
		);
	}

	function findPreviewControlHost() {
		const root = findToolbarRoot() || document;
		const nav =
			root.querySelector( '.fusion-toolbar-nav.fb' ) ||
			root.querySelector( '.fusion-toolbar-nav' );
		if ( ! nav ) {
			return null;
		}

		const byClass =
			nav.querySelector( 'li.preview' ) ||
			nav.querySelector( 'li.fusion-builder-preview' ) ||
			nav.querySelector( 'li[class*="preview"]' );
		if ( byClass ) {
			return byClass;
		}

		const candidate = Array.from(
			nav.querySelectorAll( 'li, a, button' )
		).find( ( el ) => {
			const label = (
				el.getAttribute( 'aria-label' ) ||
				el.getAttribute( 'title' ) ||
				el.textContent ||
				''
			)
				.trim()
				.toLowerCase();
			return label === 'preview' || label.includes( 'preview' );
		} );

		return candidate ? candidate.closest( 'li' ) || candidate : null;
	}

	function findAdditionalToolsList() {
		const root = findToolbarRoot() || document;
		return (
			root.querySelector( '.additional-tools > ul' ) ||
			root.querySelector( 'li.additional-tools > ul' ) ||
			null
		);
	}

	function visibleElement( candidates ) {
		return (
			candidates.find(
				( el ) => !! el && el.offsetParent !== null && ! el.hidden
			) || null
		);
	}

	function findPublishControl() {
		const root = findToolbarRoot() || document;
		const direct = visibleElement(
			Array.from(
				root.querySelectorAll(
					[
						'.save-wrapper.fb .post-status',
						'.save-wrapper.fb input[name="post-status"]',
						'.save-wrapper.fb label[for*="fusion-post-status"]',
						'#publish',
						'.fusion-builder-publish-tooltip',
						'.fusion-builder-update-buttons [class*="publish"]',
						'.fusion-builder-update-buttons input[type="checkbox"][name*="publish"]',
						'.fusion-builder-update-buttons input[type="checkbox"][id*="publish"]',
						'.fusion-builder-update-buttons .fusion-save-draft + *',
					].join( ',' )
				)
			)
		);
		if ( direct ) {
			return direct;
		}

		const byText = visibleElement(
			Array.from(
				root.querySelectorAll(
					'.fusion-builder-update-buttons a, .fusion-builder-update-buttons button, .fusion-builder-update-buttons label, .fusion-builder-update-buttons div'
				)
			).filter( ( el ) =>
				/(draft|publish)/i.test( ( el.textContent || '' ).trim() )
			)
		);
		return byText;
	}

	function findPublishControlHost() {
		const control = findPublishControl();
		if ( ! control ) {
			return null;
		}
		if (
			control.classList &&
			control.classList.contains( 'post-status' )
		) {
			return control;
		}
		return (
			control.closest(
				'.save-wrapper.fb .post-status, .save-wrapper.fb > ul > li, .fusion-builder-update-buttons > *, .fusion-builder-update-buttons a, .fusion-builder-update-buttons button, .fusion-builder-update-buttons label, .fusion-builder-publish-tooltip, .fusion-builder-status, .fusion-builder-checkbox, [class*="publish"], [class*="draft"]'
			) || control
		);
	}

	function ensureToolbarButton() {
		const additionalToolsList = findAdditionalToolsList();
		const previewHost = findPreviewControlHost();
		const publishHost = findPublishControlHost();
		const root = findToolbarRoot();
		const group =
			additionalToolsList ||
			( previewHost && previewHost.parentElement ) ||
			( publishHost && publishHost.parentElement ) ||
			root;
		if ( ! group ) {
			return false;
		}

		let host = group.querySelector( '.flow-ew-avada-review' );
		if ( ! host ) {
			host = document.createElement( 'li' );
			host.className = 'flow-ew-avada-review has-submenu';
			if (
				additionalToolsList &&
				previewHost &&
				previewHost.parentElement === additionalToolsList
			) {
				group.insertBefore( host, previewHost.nextSibling );
			} else if ( additionalToolsList ) {
				group.appendChild( host );
			} else if ( previewHost ) {
				group.insertBefore( host, previewHost.nextSibling );
			} else if ( publishHost ) {
				group.insertBefore( host, publishHost );
			} else {
				group.appendChild( host );
			}
		}

		toggle.hidden = false;
		let structureChanged = false;
		if ( toggle.parentElement !== host ) {
			host.appendChild( toggle );
			structureChanged = true;
		}
		if ( drawer.parentElement !== host ) {
			host.appendChild( drawer );
			structureChanged = true;
		}
		if ( structureChanged ) {
			stabilizeReviewerUi();
		}

		const status = toggle.dataset.status || '';
		host.setAttribute( 'data-status', status );
		return true;
	}

	const debouncedStabilize = debounce( stabilizeReviewerUi, 80 );
	const drawerObserver = new MutationObserver( debouncedStabilize );
	drawerObserver.observe( drawer, {
		childList: true,
		subtree: true,
	} );

	mountWithRetry( function () {
		const ok = ensureToolbarButton();
		enforceShareRowSizing();
		return ok;
	} );

	// Avada registers a window-level click listener that closes all submenus when
	// the click is not on a toggle trigger. Keep Flow drawer interactions open by
	// stopping those clicks from bubbling to the global closer.
	drawer.addEventListener( 'click', function ( e ) {
		e.stopPropagation();
	} );
	drawer.addEventListener( 'mousedown', function ( e ) {
		e.stopPropagation();
	} );

	function syncClearBtnVisibility( review ) {
		syncReviewerComboboxFromReview( review, drawer );
	}

	function enforceShareRowSizing() {
		const shareLink = drawer.querySelector(
			'.flow-ew-classic__share-link'
		);
		if ( shareLink ) {
			shareLink.style.fontSize = '13px';
			shareLink.style.lineHeight = '40px';
			shareLink.style.padding = '0 14px';
			shareLink.style.height = 'auto';
			shareLink.style.minHeight = '40px';
		}

		const shareRow = drawer.querySelector( '.flow-ew-classic__share-row' );
		if ( shareRow ) {
			shareRow.style.minHeight = '40px';
		}

		const shareCopy = drawer.querySelector(
			'.flow-ew-classic__share-copy'
		);
		if ( shareCopy ) {
			shareCopy.style.minWidth = '36px';
			shareCopy.style.padding = '0';
		}

		const shareGoto = drawer.querySelector(
			'.flow-ew-classic__share-goto'
		);
		if ( shareGoto ) {
			shareGoto.style.minWidth = '36px';
			shareGoto.style.padding = '0';
		}
	}

	function stabilizeReviewerUi() {
		drawer.querySelectorAll( 'ul' ).forEach( function ( list ) {
			if (
				list.classList.contains( 'flow-ew-reviewer-combobox__list' ) ||
				list.id === 'flow-ew-reviewer-listbox' ||
				list.id === 'flow-ew-pro-multi-reviewer-listbox'
			) {
				return;
			}
			list.style.setProperty( 'position', 'static', 'important' );
			list.style.setProperty( 'left', 'auto', 'important' );
			list.style.setProperty( 'right', 'auto', 'important' );
			list.style.setProperty( 'top', 'auto', 'important' );
			list.style.setProperty( 'inset', 'auto', 'important' );
			list.style.setProperty( 'width', '100%', 'important' );
		} );

		drawer
			.querySelectorAll(
				'.flow-ew-pro-multi-reviewer__body, .flow-ew-pro-multi-reviewer__chips, .flow-ew-pro-reviewers-list > li'
			)
			.forEach( function ( el ) {
				el.style.setProperty( 'position', 'static', 'important' );
				el.style.setProperty( 'left', 'auto', 'important' );
				el.style.setProperty( 'right', 'auto', 'important' );
				el.style.setProperty( 'top', 'auto', 'important' );
				el.style.setProperty( 'inset', 'auto', 'important' );
				el.style.setProperty( 'transform', 'none', 'important' );
				el.style.setProperty( 'width', '100%', 'important' );
				el.style.setProperty( 'box-sizing', 'border-box', 'important' );
			} );

		const slot = drawer.querySelector( '#flow-ew-classic-reviewer-slot' );
		if ( ! slot ) {
			return;
		}
		slot.style.position = 'static';
		slot.style.width = '100%';
		slot.style.transform = 'none';

		const multi =
			slot.querySelector( '.flow-ew-pro-multi-reviewer' ) ||
			drawer.querySelector( '.flow-ew-pro-multi-reviewer' );
		if ( multi ) {
			if ( multi.parentElement !== slot ) {
				slot.appendChild( multi );
			}
			multi.style.position = 'static';
			multi.style.width = '100%';
			multi.style.transform = 'none';
		}

		const proList = drawer.querySelector(
			'#flow-ew-pro-multi-reviewer-listbox'
		);
		if ( proList ) {
			proList.style.setProperty( 'position', 'absolute', 'important' );
			proList.style.setProperty( 'left', '0', 'important' );
			proList.style.setProperty( 'right', '0', 'important' );
			proList.style.setProperty( 'top', 'calc(100% + 4px)', 'important' );
			proList.style.setProperty( 'inset', 'auto', 'important' );
			proList.style.setProperty( 'z-index', '2000', 'important' );
			proList.style.setProperty( 'width', '100%', 'important' );
		}

		const proInput = drawer.querySelector(
			'#flow-ew-pro-multi-reviewer-input'
		);
		if ( proInput && proList && ! proInput.dataset.flowAvadaBound ) {
			proInput.dataset.flowAvadaBound = '1';
			// Avada's toolbar CSS can hide the list, so re-show it — but only
			// when the combobox itself wants to be open. Ignoring that flag
			// re-opened the list while composing an external email.
			const show = function () {
				if (
					proInput.getAttribute( 'aria-expanded' ) !== 'true' ||
					proList.childElementCount === 0
				) {
					return;
				}
				proList.hidden = false;
			};
			proInput.addEventListener( 'focus', show );
			proInput.addEventListener( 'input', show );
		}

		const singleInput = drawer.querySelector( '#flow-ew-reviewer-input' );
		const singleList = drawer.querySelector( '#flow-ew-reviewer-listbox' );
		if ( singleList ) {
			singleList.style.setProperty( 'position', 'absolute', 'important' );
			singleList.style.setProperty( 'left', '0', 'important' );
			singleList.style.setProperty( 'right', '0', 'important' );
			singleList.style.setProperty(
				'top',
				'calc(100% + 4px)',
				'important'
			);
			singleList.style.setProperty( 'inset', 'auto', 'important' );
			singleList.style.setProperty( 'z-index', '2000', 'important' );
			singleList.style.setProperty( 'width', '100%', 'important' );
		}
		if (
			singleInput &&
			singleList &&
			! singleInput.dataset.flowAvadaBound
		) {
			singleInput.dataset.flowAvadaBound = '1';
			const showSingle = function () {
				if (
					singleInput.getAttribute( 'aria-expanded' ) !== 'true' ||
					singleList.childElementCount === 0
				) {
					return;
				}
				singleList.hidden = false;
				singleList.style.display = 'block';
			};
			const hideSingle = function () {
				singleList.hidden = true;
				singleList.style.display = 'none';
				singleInput.setAttribute( 'aria-expanded', 'false' );
			};
			singleInput.addEventListener( 'focus', showSingle );
			singleInput.addEventListener( 'input', showSingle );
			const comboboxRoot = singleInput.closest(
				'#flow-ew-reviewer-combobox'
			);
			if ( comboboxRoot ) {
				comboboxRoot.addEventListener(
					'flow-ew:combobox-open-change',
					function ( e ) {
						if ( e.detail && e.detail.open ) {
							showSingle();
						} else {
							hideSingle();
						}
					}
				);
				comboboxRoot.addEventListener(
					'flow-ew:combobox-choose',
					function ( e ) {
						if ( ! e.detail || e.detail.isEmail ) {
							return;
						}
						const clearBtn = drawer.querySelector(
							'.flow-ew-reviewer-combobox__clear'
						);
						if ( clearBtn ) {
							clearBtn.setAttribute( 'hidden', '' );
						}
						singleInput.blur();
						syncClearBtnVisibility( {
							reviewer_id: Number( e.detail.id ),
						} );
					}
				);
			}
		}
	}

	document.addEventListener( 'flow-ew:classic-render', function ( e ) {
		const review = e.detail && e.detail.review;
		const status = ( review && review.status ) || '';
		toggle.dataset.status = status;
		const host = toggle.parentElement;
		if ( host && host.classList.contains( 'flow-ew-avada-review' ) ) {
			host.setAttribute( 'data-status', status );
		}
		syncReviewerComboboxFromReview( review );
		syncClearBtnVisibility( review );
		guard.schedule( review );
		enforceShareRowSizing();
		// Run after other classic-render listeners (e.g. pro multi-reviewer chips).
		requestAnimationFrame( function () {
			stabilizeReviewerUi();
		} );
		syncFreeUpsells( {
			root: drawer,
			review,
			builder: 'avada',
			inline: true,
		} );
	} );

	const guard = createBuilderPublishGuard( function ( blocked ) {
		document.body.classList.toggle(
			'flow-ew-avada-publish-blocked',
			blocked
		);
		const publishHost = findPublishControlHost();
		if ( publishHost ) {
			publishHost.classList.toggle(
				'flow-ew-avada-publish-blocked-control',
				blocked
			);
		}
		syncPublishGuardTooltip( publishHost, blocked );
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
			const publishControl = target.closest(
				[
					'.save-wrapper.fb .post-status',
					'.save-wrapper.fb input[name="post-status"]',
					'.save-wrapper.fb label[for*="fusion-post-status"]',
					'#publish',
					'.fusion-builder-publish-tooltip',
					'.fusion-builder-update-buttons [class*="publish"]',
					'.fusion-builder-update-buttons input[type="checkbox"]',
					'.fusion-builder-update-buttons label',
				].join( ',' )
			);
			if ( publishControl ) {
				e.preventDefault();
				e.stopImmediatePropagation();
			}
		},
		true
	);

	document.addEventListener(
		'change',
		function ( e ) {
			if ( ! guard.isBlocked() ) {
				return;
			}
			const target = e.target;
			if (
				target &&
				target.matches &&
				target.matches(
					'.save-wrapper.fb input[name="post-status"], .fusion-builder-update-buttons input[type="checkbox"]'
				)
			) {
				e.preventDefault();
				e.stopImmediatePropagation();
				target.checked = ! target.checked;
			}
		},
		true
	);

	enforceShareRowSizing();
	stabilizeReviewerUi();
	syncFreeUpsells( {
		root: drawer,
		review: guard.lastReview(),
		builder: 'avada',
		inline: true,
	} );
} )();
