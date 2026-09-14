import { dispatchAssignInviteEmail, isValidEmail } from './assign-invite-email';
import {
	exitReviewerEmailEntryMode,
	filterReviewerComboboxOptions,
	getEmailPlaceholder,
	isEmailComboboxOption,
} from './reviewer-email-entry';

/**
 * Close the reviewer listbox without touching its state (used by builders
 * after a re-render).
 *
 * @param {ParentNode} [scope=document]
 */
export function collapseReviewerListbox( scope ) {
	const root = scope || document;
	const list = root.querySelector( '#flow-ew-reviewer-listbox' );
	const input = root.querySelector( '#flow-ew-reviewer-input' );
	if ( list ) {
		list.hidden = true;
	}
	if ( input ) {
		input.setAttribute( 'aria-expanded', 'false' );
	}
}

/**
 * The Free reviewer combobox (classic editor and every builder drawer).
 *
 * Dispatches `flow-ew:combobox-open-change` ({ open }) and
 * `flow-ew:combobox-choose` ({ id, isEmail }) on `root` so builders that
 * restyle the list (Avada) can react without owning the state.
 *
 * @param {HTMLElement} root
 * @param {{
 *   assignInviteEmail?: (email: string) => void,
 *   showEmailError?: (() => void)|null,
 *   clearEmailError?: () => void,
 *   existingInviteEmail?: () => string,
 *   assignOnBlur?: boolean,
 * }} [opts]
 * @return {{ setEmailEntryMode: (v: boolean) => void, isEmailEntryMode: () => boolean, reset: () => void }|null}
 */
export function initReviewerCombobox( root, opts = {} ) {
	const {
		assignInviteEmail = dispatchAssignInviteEmail,
		showEmailError = null,
		clearEmailError = () => {},
		existingInviteEmail = () => '',
		assignOnBlur = false,
	} = opts;

	if ( ! root || root.dataset.flowEwComboboxReady === '1' ) {
		return null;
	}
	const input = root.querySelector( '.flow-ew-reviewer-combobox__input' );
	const list = root.querySelector( '.flow-ew-reviewer-combobox__list' );
	const select = root.querySelector( '#flow-ew-reviewer-select' );
	if ( ! input || ! list || ! select ) {
		return null;
	}
	root.dataset.flowEwComboboxReady = '1';

	const options = Array.from( list.querySelectorAll( '[role="option"]' ) );
	let activeIndex = -1;
	let emailEntryMode = false;

	function emit( name, detail ) {
		root.dispatchEvent( new CustomEvent( name, { detail } ) );
	}

	function onlyEmailAvailable() {
		// No WP users left to pick — type an email directly.
		return ! options.some( function ( li ) {
			return ! isEmailComboboxOption( li );
		} );
	}

	function inEmailMode() {
		return (
			emailEntryMode || select.value === 'email' || onlyEmailAvailable()
		);
	}

	if ( onlyEmailAvailable() ) {
		emailEntryMode = true;
		select.value = 'email';
		input.placeholder = getEmailPlaceholder();
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

	function setOpen( openList ) {
		// Never leave an empty bordered listbox under the field. A valid typed
		// address may still open the list so the "Invite" row can show.
		const typed = ( input.value || '' ).trim();
		if ( openList && isValidEmail( typed ) ) {
			filterOptions( typed );
			if ( visibleOptions().length === 0 ) {
				openList = false;
			}
		} else if (
			openList &&
			( emailEntryMode ||
				select.value === 'email' ||
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
		emit( 'flow-ew:combobox-open-change', { open: openList } );
	}

	function chooseOption( li ) {
		if ( ! li || li.hidden ) {
			return;
		}
		const id = li.dataset.value;
		const label = li.dataset.label || li.textContent.trim();
		const isEmail = isEmailComboboxOption( li );
		select.value = id;
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
			input.placeholder = getEmailPlaceholder();
			setOpen( false );
			activeIndex = -1;
			emailEntryMode = true;
			select.dispatchEvent( new Event( 'change', { bubbles: true } ) );
			input.focus();
			return;
		}
		emailEntryMode = false;
		input.value = label;
		setOpen( false );
		activeIndex = -1;
		select.dispatchEvent( new Event( 'change', { bubbles: true } ) );
		emit( 'flow-ew:combobox-choose', { id, isEmail: false } );
	}

	function submitTypedEmail( event ) {
		if ( event ) {
			event.preventDefault();
			event.stopPropagation();
		}
		const typed = ( input.value || '' ).trim();
		if ( isValidEmail( typed ) ) {
			emailEntryMode = true;
			select.value = 'email';
			assignInviteEmail( typed );
			return;
		}
		if ( typed ) {
			emailEntryMode = true;
			select.value = 'email';
			if ( showEmailError ) {
				showEmailError();
			}
		}
	}

	input.addEventListener( 'focus', function () {
		if ( input.disabled || input.readOnly ) {
			return;
		}
		if ( inEmailMode() ) {
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
		// Valid address → show the Invite row (even after External Email).
		if ( isValidEmail( typed ) ) {
			emailEntryMode = true;
			select.value = 'email';
			filterOptions( typed );
			setOpen( true );
			activeIndex = -1;
			clearEmailError();
			return;
		}
		// Keep the list closed while the address is still incomplete.
		if ( inEmailMode() ) {
			if ( ! typed && ! onlyEmailAvailable() ) {
				emailEntryMode = false;
				exitReviewerEmailEntryMode( select, input, options );
				filterOptions( '' );
				setOpen( true );
				activeIndex = -1;
				clearEmailError();
				return;
			}
			emailEntryMode = true;
			select.value = 'email';
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

	if ( assignOnBlur ) {
		input.addEventListener( 'blur', function () {
			// Assigned field is read-only — never re-invite on click-away.
			if ( input.disabled || input.readOnly ) {
				return;
			}
			if ( ! emailEntryMode && select.value !== 'email' ) {
				return;
			}
			window.setTimeout( function () {
				if ( input.ownerDocument.activeElement === input ) {
					return;
				}
				if ( input.readOnly || input.disabled ) {
					return;
				}
				const typed = ( input.value || '' ).trim().toLowerCase();
				if ( ! typed ) {
					emailEntryMode = false;
					exitReviewerEmailEntryMode( select, input, options );
					clearEmailError();
					return;
				}
				if ( ! isValidEmail( typed ) ) {
					// Invalid addresses only surface an error on Enter.
					return;
				}
				const existing = String( existingInviteEmail() || '' )
					.trim()
					.toLowerCase();
				if ( existing && existing === typed ) {
					return;
				}
				assignInviteEmail( typed );
			}, 150 );
		} );
	}

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

	function reset() {
		emailEntryMode = false;
		exitReviewerEmailEntryMode( select, input, options );
		filterOptions( '' );
		setOpen( false );
		activeIndex = -1;
	}

	document.addEventListener( 'flow-ew:reviewer-field-reset', reset );

	input.addEventListener( 'keydown', function ( e ) {
		if ( input.disabled || input.readOnly ) {
			return;
		}
		const typed = ( input.value || '' ).trim();
		const treatAsEmail =
			inEmailMode() || isValidEmail( typed ) || typed.includes( '@' );

		if ( e.key === 'ArrowDown' ) {
			e.preventDefault();
			if ( treatAsEmail ) {
				setOpen( false );
				return;
			}
			const vis = visibleOptions();
			if ( ! list.hidden && vis.length ) {
				activeIndex = Math.min( activeIndex + 1, vis.length - 1 );
				vis[ activeIndex ].focus();
				return;
			}
			filterOptions( input.value );
			const next = visibleOptions();
			if ( ! next.length ) {
				return;
			}
			setOpen( true );
			activeIndex = 0;
			next[ 0 ].focus();
		} else if ( e.key === 'ArrowUp' ) {
			e.preventDefault();
			const vis = visibleOptions();
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

	// The classic post form submits on Enter in text inputs — block that while
	// the reviewer field is in email-entry mode.
	input.addEventListener( 'keypress', function ( e ) {
		if ( e.key !== 'Enter' && e.keyCode !== 13 ) {
			return;
		}
		const typed = ( input.value || '' ).trim();
		if ( inEmailMode() || isValidEmail( typed ) || typed.includes( '@' ) ) {
			e.preventDefault();
			e.stopPropagation();
		}
	} );

	return {
		setEmailEntryMode( value ) {
			emailEntryMode = !! value;
		},
		isEmailEntryMode() {
			return emailEntryMode;
		},
		reset,
	};
}
