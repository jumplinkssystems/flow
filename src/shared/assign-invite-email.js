/**
 * Ask the classic-editor companion to create/update a review with an external
 * email invite. Builders that own their own combobox (Avada / Beaver / Divi /
 * Oxygen / Breakdance) dispatch this instead of duplicating the REST call.
 *
 * @param {string} email
 * @return {boolean} Whether a non-empty email was dispatched.
 */
export function dispatchAssignInviteEmail( email ) {
	const trimmed = String( email || '' )
		.trim()
		.toLowerCase();
	if ( ! trimmed ) {
		return false;
	}
	document.dispatchEvent(
		new CustomEvent( 'flow-ew:assign-invite-email', {
			detail: { email: trimmed },
		} )
	);
	return true;
}

/**
 * @param {string} value
 * @return {boolean}
 */
export function isValidEmail( value ) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( String( value || '' ).trim() );
}
