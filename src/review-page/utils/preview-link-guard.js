export function installPreviewLinkGuard( doc ) {
	if ( ! doc?.documentElement ) {
		return () => {};
	}

	const anchorFromEvent = ( e ) => {
		const t = e.target;
		if ( ! t || typeof t.closest !== 'function' ) {
			return null;
		}
		return t.closest( 'a[href]' );
	};

	const shouldIgnore = ( e ) => {
		if ( e.ctrlKey || e.metaKey ) {
			return true;
		}
		return false;
	};

	// Keep rules aligned with enqueue_link_blocking() in class-flow-review-page.php.
	const isSkippableAnchor = ( a ) => {
		if ( ! a ) {
			return true;
		}
		if ( a.target === '_blank' ) {
			return true;
		}
		const href = ( a.getAttribute( 'href' ) || '' ).trim();
		if ( href === '' ) {
			return true;
		}
		const h = href.toLowerCase();
		if ( h === '#' || href.startsWith( '#' ) ) {
			return true;
		}
		if ( h.startsWith( 'javascript:' ) ) {
			return true;
		}
		if (
			h.startsWith( 'mailto:' ) ||
			h.startsWith( 'tel:' ) ||
			h.startsWith( 'sms:' )
		) {
			return true;
		}
		if ( h.startsWith( 'data:' ) ) {
			return true;
		}
		return false;
	};

	const onMouseDown = ( e ) => {
		if ( e.button !== 0 || shouldIgnore( e ) ) {
			return;
		}
		const a = anchorFromEvent( e );
		if ( isSkippableAnchor( a ) ) {
			return;
		}
		e.preventDefault();
	};

	const onClick = ( e ) => {
		if ( e.button !== 0 || shouldIgnore( e ) ) {
			return;
		}
		const a = anchorFromEvent( e );
		if ( isSkippableAnchor( a ) ) {
			return;
		}
		e.preventDefault();
		const onMedia =
			typeof e.target?.closest === 'function' &&
			e.target.closest( 'img, video, iframe, .flow-embed-overlay' );
		if ( ! onMedia ) {
			e.stopPropagation();
		}
	};

	const onAuxClick = ( e ) => {
		if ( e.button !== 1 ) {
			return;
		}
		const a = anchorFromEvent( e );
		if ( isSkippableAnchor( a ) ) {
			return;
		}
		e.preventDefault();
	};

	doc.addEventListener( 'mousedown', onMouseDown, true );
	doc.addEventListener( 'click', onClick, true );
	doc.addEventListener( 'auxclick', onAuxClick, true );

	const win = doc.defaultView;
	let restoreOpen = null;
	if ( win && typeof win.open === 'function' ) {
		const originalOpen = win.open.bind( win );
		const guardedOpen = function ( url, target, features ) {
			const t = ( target || '' ).toString().toLowerCase();
			if ( t === '_blank' ) {
				return originalOpen( url, target, features );
			}
			// Swallow; matches the "block top-level navigation" intent.
			return null;
		};
		try {
			win.open = guardedOpen;
			restoreOpen = () => {
				try {
					if ( win.open === guardedOpen ) {
						win.open = originalOpen;
					}
				} catch {
					// iframe torn down; nothing to restore.
				}
			};
		} catch {
			// Some sandboxed environments make window.open read-only.
			restoreOpen = null;
		}
	}

	return () => {
		doc.removeEventListener( 'mousedown', onMouseDown, true );
		doc.removeEventListener( 'click', onClick, true );
		doc.removeEventListener( 'auxclick', onAuxClick, true );
		if ( restoreOpen ) {
			restoreOpen();
		}
	};
}
