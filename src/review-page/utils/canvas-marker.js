/**
 * Coerce the iframe URL onto the parent's origin. The server builds the iframe
 * URL from get_permalink() / home_url(), which may return https://example.com
 * even when the visitor reached the review page at https://www.example.com (or
 * http vs https). The mismatch makes the iframe cross-origin, which silently
 * breaks the inline-comment popover (parent can't attach mouseup/click
 * listeners on iframe.contentDocument). Forcing protocol+host to match the
 * parent eliminates that whole class of "popover-host is empty" reports on
 * production sites.
 */
/** Server-side recursive-shell guard in `Site_Review_Chrome::is_iframe_canvas_request()`. */
export const CANVAS_MARKER = 'flow_sr_canvas';

export function sameOriginIframeSrc( src ) {
	if ( ! src ) {
		return src;
	}
	try {
		const url = new URL( src, window.location.href );
		if ( url.origin !== window.location.origin ) {
			url.protocol = window.location.protocol;
			url.host = window.location.host;
		}
		// Stamp the canvas marker. The server uses it to recognise iframe-canvas
		// requests on environments where Sec-Fetch-Dest is stripped (e.g. nginx
		// FastCGI on ddev / Local) — without it, the chrome activates on the
		// iframe and renders recursive shells inside itself.
		if ( ! url.searchParams.has( CANVAS_MARKER ) ) {
			url.searchParams.set( CANVAS_MARKER, '1' );
		}
		return url.toString();
	} catch {
		return src;
	}
}

/**
 * Rewrite same-origin `<a href>` in the iframe doc to carry the canvas marker.
 * Link clicks navigate the iframe to URLs that wouldn't otherwise have it,
 * which makes the server fall back to Referer-based detection — and that
 * fails the moment Referrer-Policy strips the query string (default policy
 * on many setups since Chrome 85+). Stamping the marker on hrefs at load
 * time keeps every link click going to a URL the server can recognise as
 * an iframe canvas via the explicit marker, regardless of Referer behaviour.
 */
export function stampCanvasMarkerOnLinks( iframeDoc ) {
	if ( ! iframeDoc?.querySelectorAll ) {
		return;
	}
	const parentOrigin = window.location.origin;
	const anchors = iframeDoc.querySelectorAll( 'a[href]' );
	for ( const a of anchors ) {
		const target = a.getAttribute( 'target' );
		if ( target && target !== '_self' ) {
			continue;
		} // _blank etc. leave the iframe — don't touch
		try {
			const url = new URL( a.href, iframeDoc.baseURI || parentOrigin );
			if ( url.origin !== parentOrigin ) {
				continue;
			}
			if ( url.searchParams.has( CANVAS_MARKER ) ) {
				continue;
			}
			url.searchParams.set( CANVAS_MARKER, '1' );
			a.href = url.toString();
		} catch {
			// unparseable href (mailto:, tel:, javascript:, …) — ignore
		}
	}
}
