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

	// Stricter than enqueue_link_blocking() in class-flow-review-page.php:
	// the preview is for reading and commenting, so no link may leave it or
	// move it, including new tabs, mail, call and WhatsApp buttons. Only
	// script links stay live, since themes use them for tabs and toggles.
	const isSkippableAnchor = ( a ) => {
		if ( ! a ) {
			return true;
		}
		const href = ( a.getAttribute( 'href' ) || '' ).trim();
		return href === '' || href.toLowerCase().startsWith( 'javascript:' );
	};

	// Let a drag inside any link select its text instead of dragging the
	// link, including mailto: and new-tab links that are allowed to open.
	const onMouseDown = ( e ) => {
		if ( e.button !== 0 || shouldIgnore( e ) ) {
			return;
		}
		const a = anchorFromEvent( e );
		if ( a ) {
			a.draggable = false;
		}
	};

	const onDragStart = ( e ) => {
		if ( anchorFromEvent( e ) ) {
			e.preventDefault();
		}
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
	doc.addEventListener( 'dragstart', onDragStart, true );
	doc.addEventListener( 'click', onClick, true );
	doc.addEventListener( 'auxclick', onAuxClick, true );

	const win = doc.defaultView;
	let restoreOpen = null;
	if ( win && typeof win.open === 'function' ) {
		const originalOpen = win.open.bind( win );
		// Script-opened windows (chat and share buttons) are swallowed too.
		const guardedOpen = () => null;
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
		doc.removeEventListener( 'dragstart', onDragStart, true );
		doc.removeEventListener( 'click', onClick, true );
		doc.removeEventListener( 'auxclick', onAuxClick, true );
		if ( restoreOpen ) {
			restoreOpen();
		}
	};
}

// Site review keeps links live, but a drag that starts on one should select
// its text like anywhere else, and releasing that drag must not navigate.
export function installLinkDragSelect( doc ) {
	if ( ! doc?.documentElement ) {
		return () => {};
	}
	let press = null;

	const onMouseDown = ( e ) => {
		press = null;
		if ( e.button !== 0 ) {
			return;
		}
		const a =
			typeof e.target?.closest === 'function'
				? e.target.closest( 'a[href]' )
				: null;
		if ( ! a ) {
			return;
		}
		a.draggable = false;
		press = { x: e.clientX, y: e.clientY };
	};

	const onDragStart = ( e ) => {
		if (
			typeof e.target?.closest === 'function' &&
			e.target.closest( 'a[href]' )
		) {
			e.preventDefault();
		}
	};

	const onClick = ( e ) => {
		if ( ! press ) {
			return;
		}
		const moved =
			Math.abs( e.clientX - press.x ) > 4 ||
			Math.abs( e.clientY - press.y ) > 4;
		press = null;
		if ( moved ) {
			e.preventDefault();
			e.stopPropagation();
		}
	};

	doc.addEventListener( 'mousedown', onMouseDown, true );
	doc.addEventListener( 'dragstart', onDragStart, true );
	doc.addEventListener( 'click', onClick, true );
	return () => {
		doc.removeEventListener( 'mousedown', onMouseDown, true );
		doc.removeEventListener( 'dragstart', onDragStart, true );
		doc.removeEventListener( 'click', onClick, true );
	};
}
