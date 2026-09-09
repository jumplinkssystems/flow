import apiFetch from '@wordpress/api-fetch';

const pageData = window.flowReviewPage || {};

apiFetch.use(apiFetch.createNonceMiddleware(pageData.nonce));

// Build a full URL directly instead of using apiFetch's path/middleware
// machinery — apiFetch resolves `path` against a global default root that
// gets clobbered when multiple bundles register their own root URLs (Free
// page-review + Pro site-review chrome both call `apiFetch.use`, so the
// last-registered root wins for ALL fetches). Building the full URL here
// keeps each adapter's REST calls scoped to its own namespace regardless
// of who else has hooked into apiFetch.
const REST_ROOT = (pageData.restUrl || '').replace(/\/+$/, '') + '/';

export default function flowFetch(endpoint, options = {}) {
  const url = REST_ROOT + String(endpoint).replace(/^\/+/, '');
  return apiFetch({
    url,
    ...options,
  });
}

export { pageData };
