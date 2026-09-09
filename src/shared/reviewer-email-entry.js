/**
 * Helpers for Free reviewer combobox email-entry mode.
 *
 * - After External Email is chosen, keep the list closed while the address is
 *   incomplete.
 * - Once the typed address is fully valid, open the list with an "Invite {email}"
 *   row (Classic / builders / Gutenberg).
 */

import { isValidEmail } from './assign-invite-email';

export { isValidEmail };

export function isEmailComboboxOption( li ) {
	return !!(
		li &&
		( li.dataset.isEmail === '1' || li.dataset.value === 'email' )
	);
}

export function getEmailPlaceholder() {
	const i18n = ( window.flowEW && window.flowEW.i18n ) || {};
	return i18n.emailPlaceholder || 'name@example.com';
}

export function getReviewerPlaceholder() {
	const i18n = ( window.flowEW && window.flowEW.i18n ) || {};
	return i18n.reviewerPlaceholder || 'assign a dedicated reviewer';
}

/**
 * Leave External Email compose mode and restore the default autocomplete UI.
 *
 * @param {HTMLSelectElement|null} select
 * @param {HTMLInputElement|null} input
 * @param {HTMLElement[]} [options]
 */
export function exitReviewerEmailEntryMode( select, input, options ) {
	if ( select ) {
		if ( select.value === 'email' ) {
			select.value = '';
		}
		delete select.dataset.inviteEmail;
	}
	if ( input && ! input.readOnly ) {
		input.placeholder = getReviewerPlaceholder();
	}
	const externalLabel = getExternalEmailLabel();
	( options || [] ).forEach( function ( li ) {
		if ( ! isEmailComboboxOption( li ) ) {
			return;
		}
		li.hidden = false;
		li.style.display = '';
		li.textContent = li.dataset.label || externalLabel;
	} );
}

export function getExternalEmailLabel() {
	const i18n = ( window.flowEW && window.flowEW.i18n ) || {};
	return i18n.externalEmail || 'External Email';
}

/**
 * @param {string} email
 * @return {string}
 */
export function formatInviteOptionLabel( email ) {
	const i18n = ( window.flowEW && window.flowEW.i18n ) || {};
	const tpl = i18n.inviteEmail || 'Invite %s';
	return String( tpl ).replace( '%s', String( email || '' ).trim() );
}

/**
 * Hide the autocomplete while composing an incomplete external email.
 * Always show it again once the typed value is a valid address (Invite row).
 *
 * @param {HTMLSelectElement|null} select
 * @param {HTMLInputElement|null} input
 * @param {boolean} [emailEntryMode]
 * @return {boolean}
 */
export function shouldHideReviewerAutocomplete( select, input, emailEntryMode ) {
	const typed = String( ( input && input.value ) || '' ).trim();
	if ( isValidEmail( typed ) ) {
		return false;
	}
	return !!(
		emailEntryMode ||
		( select && select.value === 'email' )
	);
}

/**
 * Filter combobox options. The email row shows as "External Email" when the
 * query is empty, or as "Invite {email}" only when the query is a valid address.
 *
 * @param {HTMLElement[]} options
 * @param {string} q
 * @param {{ emailOnly?: boolean }} [opts]
 */
export function filterReviewerComboboxOptions( options, q, opts ) {
	const needle = String( q || '' )
		.toLowerCase()
		.trim();
	const emailOnly = !!( opts && opts.emailOnly );
	const externalLabel = getExternalEmailLabel();

	( options || [] ).forEach( function ( li ) {
		const isEmail = isEmailComboboxOption( li );
		const baseLabel = String( li.dataset.label || externalLabel ).trim();
		const labelLower = baseLabel.toLowerCase();

		if ( isEmail ) {
			// No WP users — type the address directly; never a lone email row.
			if ( emailOnly ) {
				li.hidden = true;
				li.style.display = 'none';
				li.classList.remove(
					'flow-ew-reviewer-combobox__option--invite'
				);
				li.textContent = li.dataset.label || externalLabel;
				return;
			}
			if ( ! needle ) {
				li.hidden = false;
				li.style.display = '';
				// External Email above WP users — keep separator border.
				li.classList.remove(
					'flow-ew-reviewer-combobox__option--invite'
				);
				li.textContent = li.dataset.label || externalLabel;
				return;
			}
			if ( isValidEmail( needle ) ) {
				li.hidden = false;
				li.style.display = '';
				// Invite row is an action, not a section header — no border.
				li.classList.add( 'flow-ew-reviewer-combobox__option--invite' );
				li.textContent = formatInviteOptionLabel( needle );
				return;
			}
			// Incomplete address (e.g. test@t) — never show Invite / email row.
			li.hidden = true;
			li.style.display = 'none';
			li.classList.remove( 'flow-ew-reviewer-combobox__option--invite' );
			li.textContent = li.dataset.label || externalLabel;
			return;
		}

		const show = ! needle || labelLower.includes( needle );
		li.hidden = ! show;
		li.style.display = show ? '' : 'none';
	} );
}
