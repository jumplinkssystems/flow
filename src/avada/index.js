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

	function debounce( fn, ms ) {
		let t;
		return function () {
			clearTimeout( t );
			t = setTimeout( fn, ms );
		};
	}

	function findToolbarRoot() {
		return (
			document.querySelector( '.fusion-builder-live-toolbar.fusion-top-frame' ) ||
			document.getElementById( 'fusion_builder_controls' ) ||
			document.querySelector( '.save-wrapper.fb' ) ||
			document.querySelector( '.fusion-builder-update-buttons' ) ||
			document.querySelector( '.fusion-builder-controls' ) ||
			document.querySelector( '[class*="fusion-builder"][class*="toolbar"]' )
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
		if ( control.classList && control.classList.contains( 'post-status' ) ) {
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
			if ( additionalToolsList && previewHost && previewHost.parentElement === additionalToolsList ) {
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

	const debouncedEnsure = debounce( function () {
		ensureToolbarButton();
		enforceShareRowSizing();
	}, 80 );
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
		const shareLink = drawer.querySelector( '.flow-ew-classic__share-link' );
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

		const shareCopy = drawer.querySelector( '.flow-ew-classic__share-copy' );
		if ( shareCopy ) {
			shareCopy.style.minWidth = '36px';
			shareCopy.style.padding = '0';
		}

		const shareGoto = drawer.querySelector( '.flow-ew-classic__share-goto' );
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
			singleList.style.setProperty( 'top', 'calc(100% + 4px)', 'important' );
			singleList.style.setProperty( 'inset', 'auto', 'important' );
			singleList.style.setProperty( 'z-index', '2000', 'important' );
			singleList.style.setProperty( 'width', '100%', 'important' );
		}
		if ( singleInput && singleList && ! singleInput.dataset.flowAvadaBound ) {
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
			singleList.addEventListener( 'flow-ew:avada-close', hideSingle );
		}
	}

	function buildUpsellNode( data, markerAttr, linkMarginTop ) {
		const wrap = document.createElement( 'div' );
		wrap.className = markerAttr;
		wrap.setAttribute( markerAttr, '1' );
		wrap.style.setProperty( 'font-size', '13px', 'important' );
		wrap.style.setProperty( 'line-height', '1.4', 'important' );
		wrap.style.setProperty( 'padding', '0', 'important' );

		const link = document.createElement( 'a' );
		link.href = data.href || '#';
		link.style.setProperty( 'display', 'inline-block', 'important' );
		link.style.setProperty( 'margin-top', linkMarginTop, 'important' );
		link.style.setProperty( 'padding', '0', 'important' );
		link.style.setProperty( 'height', 'auto', 'important' );
		link.style.setProperty( 'background', 'transparent', 'important' );
		link.style.setProperty( 'color', '#018170', 'important' );
		link.style.setProperty( 'font-size', '13px', 'important' );
		link.style.setProperty( 'font-weight', '600', 'important' );
		link.style.setProperty( 'line-height', '1.4', 'important' );
		link.style.setProperty( 'text-decoration', 'underline', 'important' );
		link.style.setProperty( 'cursor', 'pointer', 'important' );
		link.style.setProperty( 'text-transform', 'none', 'important' );
		link.style.setProperty( 'letter-spacing', 'normal', 'important' );

		const badge = document.createElement( 'span' );
		badge.style.setProperty( 'display', 'inline-block', 'important' );
		badge.style.setProperty( 'padding', '1px 6px', 'important' );
		badge.style.setProperty( 'margin-right', '4px', 'important' );
		badge.style.setProperty( 'font-size', '9px', 'important' );
		badge.style.setProperty( 'font-weight', '600', 'important' );
		badge.style.setProperty( 'letter-spacing', '0.04em', 'important' );
		badge.style.setProperty( 'line-height', '1.4', 'important' );
		badge.style.setProperty( 'border-radius', '8px', 'important' );
		badge.style.setProperty( 'background', '#d0f9ec', 'important' );
		badge.style.setProperty( 'color', '#09121e', 'important' );
		badge.style.setProperty( 'vertical-align', '1px', 'important' );
		badge.style.setProperty( 'text-transform', 'uppercase', 'important' );
		badge.textContent = 'PRO';
		link.appendChild( badge );
		link.appendChild( document.createTextNode( data.label ) );
		wrap.appendChild( link );

		if ( data.helpText ) {
			const help = document.createElement( 'p' );
			help.style.setProperty( 'margin-top', '4px', 'important' );
			help.style.setProperty( 'margin-bottom', '0', 'important' );
			help.style.setProperty( 'color', '#9aa4ad', 'important' );
			help.style.setProperty( 'font-size', '12px', 'important' );
			help.style.setProperty( 'font-weight', '400', 'important' );
			help.style.setProperty( 'line-height', '1.4', 'important' );
			help.style.setProperty( 'text-transform', 'none', 'important' );
			help.style.setProperty( 'letter-spacing', 'normal', 'important' );
			help.textContent = data.helpText;
			wrap.appendChild( help );
		}

		return wrap;
	}

	function getFallbackUpsellData( type ) {
		if ( ! drawer || drawer.dataset.flowEwUpsellEnabled !== '1' ) {
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
					let node = slot.querySelector(
						'[data-flow-ew-avada-upsell-open]'
					);
					if ( ! node ) {
						node = buildUpsellNode(
							openData,
							'data-flow-ew-avada-upsell-open',
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
				markerAttr: 'data-flow-ew-avada-upsell-reviewer',
				buildNode: function ( data ) {
					return buildUpsellNode(
						data,
						'data-flow-ew-avada-upsell-reviewer',
						'14px'
					);
				},
			} );
			const reviewerSelect = drawer.querySelector(
				'#flow-ew-reviewer-select'
			);
			if ( reviewerSelect && ! reviewerSelect.dataset.flowAvadaUpsellBound ) {
				reviewerSelect.dataset.flowAvadaUpsellBound = '1';
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
		toggle.dataset.status = status;
		const host = toggle.parentElement;
		if ( host && host.classList.contains( 'flow-ew-avada-review' ) ) {
			host.setAttribute( 'data-status', status );
		}
		syncReviewerComboboxFromReview( review );
		syncClearBtnVisibility( review );
		schedulePublishGuard( review );
		enforceShareRowSizing();
		// Run after other classic-render listeners (e.g. pro multi-reviewer chips).
		requestAnimationFrame( function () {
			stabilizeReviewerUi();
		} );
		syncFreeUpsells( review );
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

	function applyPublishGuard( review ) {
		blockedState = isPublishBlocked( review );
		document.body.classList.toggle(
			'flow-ew-avada-publish-blocked',
			blockedState
		);
		const publishHost = findPublishControlHost();
		if ( publishHost ) {
			publishHost.classList.toggle(
				'flow-ew-avada-publish-blocked-control',
				blockedState
			);
		}
		syncPublishGuardTooltip( publishHost, blockedState );
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
			if ( ! blockedState ) {
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

	const guardObserver = new MutationObserver( function () {
		schedulePublishGuard();
	} );
	guardObserver.observe( document.body, {
		childList: true,
		subtree: true,
	} );

	schedulePublishGuard( lastReview );
	enforceShareRowSizing();
	stabilizeReviewerUi();
	syncFreeUpsells( lastReview );

	const comboboxRoot = document.getElementById( 'flow-ew-reviewer-combobox' );
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
			if ( openList && hideAutocomplete() ) {
				openList = false;
			}
			list.hidden = ! openList;
			list.style.display = openList ? 'block' : 'none';
			input.setAttribute( 'aria-expanded', openList ? 'true' : 'false' );
			if ( ! openList ) {
				list.dispatchEvent( new Event( 'flow-ew:avada-close', { bubbles: false } ) );
			}
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
			const isEmail = isEmailComboboxOption( li );
			select.value = id;
			setOpen( false );
			activeIndex = -1;
			if ( isEmail ) {
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
				const clearBtn = drawer.querySelector(
					'.flow-ew-reviewer-combobox__clear'
				);
				if ( clearBtn ) {
					clearBtn.setAttribute( 'hidden', '' );
				}
				select.dispatchEvent( new Event( 'change', { bubbles: true } ) );
				input.focus();
				return;
			}
			emailEntryMode = false;
			input.value = label;
			input.blur();
			syncClearBtnVisibility( { reviewer_id: Number( id ) } );
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
} )();

