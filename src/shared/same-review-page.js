/**
 * Site review stores each comment's page as the URL in the reviewer's frame,
 * which may or may not carry Flow's own markers (`flow_sr_canvas=1`,
 * `flow_sr_*`, `flow_review*`). Two URLs name the same page when they match
 * without those markers, the hash and a trailing slash.
 *
 * @param {string} url
 * @return {string} Comparable form of the URL.
 */
export function pageKey( url ) {
	if ( ! url ) {
		return '';
	}
	try {
		const u = new URL( url, window.location.href );
		[ ...u.searchParams.keys() ]
			.filter( ( key ) => /^flow_(sr|review|token|invite)/.test( key ) )
			.forEach( ( key ) => u.searchParams.delete( key ) );
		u.hash = '';
		const path = u.pathname.replace( /\/+$/, '' ) || '/';
		const query = u.searchParams.toString();
		return u.origin + path + ( query ? '?' + query : '' );
	} catch ( e ) {
		return String( url );
	}
}

export function isSameReviewPage( a, b ) {
	return pageKey( a ) === pageKey( b );
}
