const LIMIT = 5;

function normalize( email ) {
	return String( email || '' )
		.trim()
		.toLowerCase();
}

/**
 * Addresses the current user invited before, newest first.
 *
 * @return {string[]}
 */
export function getRecentInviteEmails() {
	const raw = window.flowEW && window.flowEW.recentInviteEmails;
	const list = Array.isArray( raw )
		? raw
		: Object.values( raw && typeof raw === 'object' ? raw : {} );
	return list.map( normalize ).filter( Boolean );
}

/**
 * Keep the page's list in step with the server so the address is offered
 * again without a reload.
 *
 * @param {string|string[]} emails
 */
export function rememberInviteEmails( emails ) {
	if ( ! window.flowEW ) {
		return;
	}
	const fresh = ( Array.isArray( emails ) ? emails : [ emails ] )
		.map( normalize )
		.filter( Boolean );
	if ( ! fresh.length ) {
		return;
	}
	const merged = [];
	fresh
		.reverse()
		.concat( getRecentInviteEmails() )
		.forEach( function ( email ) {
			if ( merged.indexOf( email ) === -1 ) {
				merged.push( email );
			}
		} );
	window.flowEW.recentInviteEmails = merged.slice( 0, LIMIT );
}

/**
 * Remembered addresses containing the typed text, minus ones already used.
 * An exact match is left to the "Invite {email}" row.
 *
 * @param {string}   query
 * @param {string[]} [exclude]
 * @return {string[]}
 */
export function matchRecentInviteEmails( query, exclude ) {
	const needle = normalize( query );
	const skip = ( exclude || [] ).map( normalize );
	return getRecentInviteEmails().filter( function ( email ) {
		return (
			skip.indexOf( email ) === -1 &&
			email !== needle &&
			( ! needle || email.indexOf( needle ) !== -1 )
		);
	} );
}
