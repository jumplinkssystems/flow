// Flow's own markers plus common tracking parameters added by shared links.
const IGNORED_PARAM =
	/^(flow_(sr|review|token|invite)|utm_|fbclid|gclid|msclkid|mc_cid|mc_eid|_ga|igshid)/;

/**
 * Site review stores each comment's page as the URL in the reviewer's frame,
 * which may or may not carry Flow's own markers (`flow_sr_canvas=1`,
 * `flow_sr_*`, `flow_review*`) or a tracking parameter. Two URLs name the
 * same page when they match without those, the hash and a trailing slash,
 * with the path decoded and lowercased (`%d0%bd`, `%D0%BD` and `н` agree).
 * Mirrors `Site_Review_Comments_DB::normalize_page_url()`.
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
			.filter( ( key ) => IGNORED_PARAM.test( key ) )
			.forEach( ( key ) => u.searchParams.delete( key ) );
		u.searchParams.sort();
		let path = u.pathname.replace( /\/+$/, '' ) || '/';
		try {
			path = decodeURIComponent( path );
		} catch ( e ) {}
		const query = u.searchParams.toString();
		return (
			u.host.toLowerCase() +
			path.toLowerCase() +
			( query ? '?' + query : '' )
		);
	} catch ( e ) {
		return String( url );
	}
}

export function isSameReviewPage( a, b ) {
	return pageKey( a ) === pageKey( b );
}

/**
 * A comment belongs to the page in view: by post id when both are known,
 * otherwise by URL.
 *
 * @param {{url?:string, postId?:number}} comment
 * @param {string}                        url     Page in view.
 * @param {number}                        postId  Its post id, 0 if unknown.
 * @return {boolean} Whether the comment was made on that page.
 */
export function isCommentOnPage( comment, url, postId ) {
	const own = Number( comment?.postId || 0 );
	if ( own > 0 && Number( postId || 0 ) > 0 ) {
		return own === Number( postId );
	}
	return isSameReviewPage( comment?.url || '', url || '' );
}

/**
 * Post id of a document from WordPress body classes (`postid-N`, `page-id-N`).
 *
 * @param {Document|null} doc
 * @return {number} Post id, or 0.
 */
export function postIdFromDocument( doc ) {
	const classes = doc?.body?.className || '';
	const match = String( classes ).match( /\b(?:postid|page-id)-(\d+)\b/ );
	return match ? parseInt( match[ 1 ], 10 ) || 0 : 0;
}
