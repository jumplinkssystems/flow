import './style.css';
import { syncReviewerComboboxFromReview } from '../shared/sync-reviewer-combobox-from-review';
import {
	dispatchAssignInviteEmail,
	isValidEmail,
} from '../shared/assign-invite-email';
import {
	exitReviewerEmailEntryMode,
	filterReviewerComboboxOptions,
	getEmailPlaceholder,
	isEmailComboboxOption,
	shouldHideReviewerAutocomplete,
} from '../shared/reviewer-email-entry';
import '../shared/share-bar.css';
import {
	findBricksPublishControl,
	syncPublishGuardTooltip,
} from '../shared/publish-guard-ui';

( function () {
	const drawer = document.getElementById( 'flow-ew-bricks-drawer' );
	const toggle = document.getElementById( 'flow-ew-bricks-toggle' );
	if ( ! drawer || ! toggle ) {
		return;
	}

	function debounce( fn, ms ) {
		let t;
		return function () {
			clearTimeout( t );
			t = setTimeout( fn, ms );
		};
	}

	function findPublishButton() {
		const toolbar = document.getElementById( 'bricks-toolbar' );
		if ( ! toolbar ) {
			return null;
		}
		const marker = toolbar.querySelector( '[data-name="publish"]' );
		if ( marker ) {
			return marker.closest( 'li' );
		}
		return null;
	}

	function findToolbarEndGroup() {
		const toolbar = document.getElementById( 'bricks-toolbar' );
		if ( ! toolbar ) {
			return null;
		}
		const saveBtn = toolbar.querySelector( 'li.save' );
		if ( saveBtn && saveBtn.parentElement ) {
			return saveBtn.parentElement;
		}
		const groups = toolbar.querySelectorAll( '.group-wrapper' );
		return groups.length ? groups[ groups.length - 1 ] : null;
	}

	function ensureToolbarButton() {
		const group = findToolbarEndGroup();
		if ( ! group ) {
			return false;
		}

		let host = group.querySelector( 'li.flow-ew-bricks-review' );
		if ( ! host ) {
			host = document.createElement( 'li' );
			host.className = 'flow-ew-bricks-review';
			host.setAttribute( 'data-balloon', 'Review' );
			host.setAttribute( 'data-balloon-pos', 'bottom' );

			const saveBtn = group.querySelector( 'li.save' );
			if ( saveBtn ) {
				group.insertBefore( host, saveBtn );
			} else {
				group.appendChild( host );
			}
		}

		toggle.hidden = false;
		if ( toggle.parentElement !== host ) {
			host.appendChild( toggle );
		}

		const status = toggle.dataset.status || '';
		host.setAttribute( 'data-status', status );

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
		drawer.style.display = '';
		drawer.classList.add( 'is-open' );
		toggle.classList.add( 'is-active' );
	}

	function close() {
		drawer.classList.remove( 'is-open' );
		toggle.classList.remove( 'is-active' );
		setTimeout( function () {
			if ( ! drawer.classList.contains( 'is-open' ) ) {
				drawer.style.display = 'none';
			}
		}, 200 );
	}

	toggle.addEventListener( 'click', function ( e ) {
		e.preventDefault();
		e.stopPropagation();
		if ( drawer.classList.contains( 'is-open' ) ) {
			close();
		} else {
			open();
		}
	} );

	const closeBtn = drawer.querySelector( '.flow-ew-bricks-drawer__close' );
	if ( closeBtn ) {
		closeBtn.addEventListener( 'click', close );
	}

	document.addEventListener( 'keydown', function ( e ) {
		if ( e.key === 'Escape' && drawer.classList.contains( 'is-open' ) ) {
			close();
		}
	} );

	document.addEventListener( 'flow-ew:classic-render', function ( e ) {
		const review = e.detail && e.detail.review;
		const status = ( review && review.status ) || '';
		toggle.dataset.status = status;
		const host = toggle.parentElement;
		if ( host && host.classList.contains( 'flow-ew-bricks-review' ) ) {
			host.setAttribute( 'data-status', status );
		}
		syncReviewerComboboxFromReview( review );
		schedulePublishGuard( review );
	} );

	const ew = window.flowEW || {};
	const reviewMandatory = !! ew.reviewMandatory;
	const isPublished = !! ew.isPublished;
	const reviewerMeta = Number( ew.reviewerMeta || 0 );
	let lastReview = ew.activeReview || null;
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
		// Mandatory review gates the *first* publish only — updates to live
		// posts shouldn't be locked behind a stale review.
		if ( isPublished ) {
			return false;
		}
		if ( ! review || review.status !== 'approved' ) {
			return true;
		}
		return ! hasAssignedReviewer( review );
	}

	let blockedState = false;

	function applyPublishGuard( review ) {
		blockedState = isPublishBlocked( review );
		document.body.classList.toggle( 'flow-ew-bricks-publish-blocked', blockedState );
		syncPublishGuardTooltip( findBricksPublishControl(), blockedState );
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
			const publishLi = target.closest(
				'#bricks-toolbar [data-name="publish"]'
			);
			if ( publishLi ) {
				e.preventDefault();
				e.stopImmediatePropagation();
			}
		},
		true
	);

	function schedulePublishGuard( review ) {
		if ( review !== undefined ) {
			lastReview = review;
		}
		clearTimeout( publishGuardTimer );
		publishGuardTimer = setTimeout( function () {
			applyPublishGuard( lastReview );
		}, 80 );
	}

	const guardObserver = new MutationObserver( function () {
		schedulePublishGuard();
	} );
	guardObserver.observe( document.body, {
		childList: true,
		subtree: true,
	} );

	schedulePublishGuard( lastReview );



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
} )();
