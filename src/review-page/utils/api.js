import apiFetch from '@wordpress/api-fetch';

const pageData = window.flowReviewPage || {};

apiFetch.use( apiFetch.createNonceMiddleware( pageData.nonce ) );

function shareToken() {
	for ( const source of [ window.location.href, pageData.contentOnlyUrl ] ) {
		try {
			const params = new URL( source || '', window.location.href )
				.searchParams;
			if ( params.get( 'flow_token' ) && params.get( 'flow_token_ts' ) ) {
				return {
					token: params.get( 'flow_token' ),
					ts: params.get( 'flow_token_ts' ),
				};
			}
		} catch {}
	}
	return null;
}

// A logged-out visitor on a public review proves they hold the share link.
apiFetch.use( ( options, next ) => {
	const target = String( options.url || options.path || '' );
	if (
		Number( pageData.currentUserId || 0 ) > 0 ||
		! /(^|\/)flow(-pro)?\/v1\//.test( target )
	) {
		return next( options );
	}
	const share = shareToken();
	if ( ! share ) {
		return next( options );
	}
	return next( {
		...options,
		headers: {
			...( options.headers || {} ),
			'X-Flow-Token': share.token,
			'X-Flow-Token-Ts': share.ts,
		},
	} );
} );

// Build a full URL directly instead of using apiFetch's path/middleware
// machinery — apiFetch resolves `path` against a global default root that
// gets clobbered when multiple bundles register their own root URLs (Free
// page-review + Pro site-review chrome both call `apiFetch.use`, so the
// last-registered root wins for ALL fetches). Building the full URL here
// keeps each adapter's REST calls scoped to its own namespace regardless
// of who else has hooked into apiFetch.
const REST_ROOT = ( pageData.restUrl || '' ).replace( /\/+$/, '' ) + '/';

export default function flowFetch( endpoint, options = {} ) {
	const url = REST_ROOT + String( endpoint ).replace( /^\/+/, '' );
	return apiFetch( {
		url,
		...options,
	} );
}

export { pageData };

export const isReviewReadOnly = () => !! pageData.isCancelled;

// Localized as "1" / "" (page reviews) or a boolean (site reviews).
export const canResolveComments = () => {
	if ( isReviewReadOnly() ) {
		return false;
	}
	if ( 'canResolveComments' in pageData ) {
		return [ true, 1, '1' ].includes( pageData.canResolveComments );
	}
	return Number( pageData.currentUserId || 0 ) > 0;
};

export const canReopenComments = () => {
	if ( isReviewReadOnly() ) {
		return false;
	}
	if ( 'canReopenComments' in pageData ) {
		return [ true, 1, '1' ].includes( pageData.canReopenComments );
	}
	return canResolveComments();
};
