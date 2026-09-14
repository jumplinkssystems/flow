/**
 * Minimal REST client for the classic companion (no @wordpress/api-fetch in
 * this bundle). `api` resolves to parsed JSON regardless of status; `apiPost`
 * rejects with the parsed error body on non-2xx and yields null on 204.
 */
export function createRestClient( { restUrl, nonce } ) {
	const headers = {
		'Content-Type': 'application/json',
		'X-WP-Nonce': nonce,
	};

	function api( path, method ) {
		return fetch( restUrl + path, {
			method: method || 'POST',
			credentials: 'same-origin',
			headers,
		} ).then( ( r ) => r.json() );
	}

	function apiPost( path, body ) {
		return fetch( restUrl + path, {
			method: 'POST',
			credentials: 'same-origin',
			headers,
			body: body ? JSON.stringify( body ) : undefined,
		} ).then( ( r ) => {
			if ( ! r.ok ) {
				return r.json().then( ( e ) => Promise.reject( e ) );
			}
			if ( r.status === 204 ) {
				return null;
			}
			return r.json();
		} );
	}

	return { api, apiPost };
}
