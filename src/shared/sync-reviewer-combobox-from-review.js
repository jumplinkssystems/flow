import {
	getEmailPlaceholder,
	getExternalEmailLabel,
	getReviewerPlaceholder,
} from './reviewer-email-entry';

/**
 * Keep the Classic / builder Free combobox in sync with the active review.
 * Email invites use reviewer_id=0 and a synthetic negative reviewer.id — never
 * treat those as native <select> values or the field clears after every render.
 *
 * Once a reviewer (WP user or email invite) is assigned, the input is read-only
 * — remove only via the clear (×) button.
 *
 * @param {object|null|undefined} review
 * @param {ParentNode} [scope=document]
 */
export function syncReviewerComboboxFromReview( review, scope ) {
	const root = scope || document;
	const select =
		root.querySelector( '#flow-ew-reviewer-select' ) ||
		document.getElementById( 'flow-ew-reviewer-select' );
	const input =
		root.querySelector( '#flow-ew-reviewer-input' ) ||
		document.getElementById( 'flow-ew-reviewer-input' );
	if ( ! select || ! input ) {
		return;
	}
	const list =
		root.querySelector( '#flow-ew-reviewer-listbox' ) ||
		document.getElementById( 'flow-ew-reviewer-listbox' );
	const clearBtn =
		root.querySelector( '.flow-ew-reviewer-combobox__clear' ) ||
		document.querySelector( '.flow-ew-reviewer-combobox__clear' );

	const reviewerPlaceholder = getReviewerPlaceholder();
	const emailPlaceholder = getEmailPlaceholder();
	const externalLabel = getExternalEmailLabel();

	const inviteEmail = review
		? String(
				review.invite_email ||
					( review.reviewer && review.reviewer.is_email
						? review.reviewer.email || review.reviewer.name || ''
						: '' ) ||
					( Array.isArray( review.email_invites ) &&
					review.email_invites[ 0 ]
						? review.email_invites[ 0 ].email ||
						  review.email_invites[ 0 ].name ||
						  ''
						: '' )
		  ).trim()
		: '';
	const hasInvite = !!(
		inviteEmail ||
		( review && review.reviewer && review.reviewer.is_email ) ||
		( review &&
			Array.isArray( review.email_invites ) &&
			review.email_invites.length > 0 )
	);

	// Only real WP user ids belong in the native <select>.
	const rid = review ? Number( review.reviewer_id || 0 ) : 0;
	const locked = rid > 0 || hasInvite;
	const wasLocked =
		input.dataset.flowLocked === '1' || input.readOnly === true;

	if ( rid > 0 ) {
		select.value = String( rid );
		delete select.dataset.inviteEmail;
		const opt = select.options[ select.selectedIndex ];
		input.value =
			opt && opt.value
				? opt.textContent.replace( /^\s+|\s+$/g, '' )
				: '';
		input.placeholder = reviewerPlaceholder;
	} else if ( hasInvite ) {
		select.value = 'email';
		select.dataset.inviteEmail = inviteEmail;
		input.value =
			( review.reviewer &&
				( review.reviewer.name || review.reviewer.email ) ) ||
			inviteEmail ||
			'';
		input.placeholder = emailPlaceholder;
	} else if ( wasLocked ) {
		// Cleared an assigned reviewer — restore default autocomplete, not
		// External Email compose mode. Do not wipe while the user is only
		// composing an email (unlocked syncs must leave that alone).
		select.value = '';
		delete select.dataset.inviteEmail;
		input.value = '';
		input.placeholder = reviewerPlaceholder;
	}

	input.readOnly = locked;
	input.setAttribute( 'aria-readonly', locked ? 'true' : 'false' );
	input.dataset.flowLocked = locked ? '1' : '0';
	if ( locked ) {
		input.setAttribute( 'aria-expanded', 'false' );
		if ( list ) {
			list.hidden = true;
		}
	}

	if ( clearBtn ) {
		clearBtn.toggleAttribute( 'hidden', ! locked );
	}

	if ( list ) {
		list.querySelectorAll( '[role="option"]' ).forEach( function ( li ) {
			const value = String( li.dataset.value || '' );
			const match =
				( rid > 0 && Number( value ) === rid ) ||
				( hasInvite &&
					( value === 'email' || li.dataset.isEmail === '1' ) );
			if ( match ) {
				li.setAttribute( 'aria-selected', 'true' );
			} else {
				li.removeAttribute( 'aria-selected' );
			}
			if (
				wasLocked &&
				! locked &&
				( value === 'email' || li.dataset.isEmail === '1' )
			) {
				li.hidden = false;
				li.style.display = '';
				li.textContent = li.dataset.label || externalLabel;
			} else if ( wasLocked && ! locked ) {
				li.hidden = false;
				li.style.display = '';
			}
		} );
	}

	// Only when leaving an assignment — builders keep a local emailEntryMode.
	if ( wasLocked && ! locked ) {
		document.dispatchEvent(
			new CustomEvent( 'flow-ew:reviewer-field-reset', {
				detail: { scope: root },
			} )
		);
	}
}
