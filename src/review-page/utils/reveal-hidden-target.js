const TOGGLE_CLASS_HINT =
	/(title|header|heading|toggle|trigger|question|summary|tab|btn|button)/i;
const WAIT_MS = 900;
const SETTLE_MS = 1500;

function isCollapsed( el ) {
	const view = el.ownerDocument.defaultView;
	const style = view.getComputedStyle( el );
	if ( style.display === 'none' || style.visibility === 'hidden' ) {
		return true;
	}
	if ( el.hidden ) {
		return true;
	}
	// Height-animated accordions park the panel at 0 with overflow hidden.
	return (
		style.overflow !== 'visible' &&
		el.clientHeight < 2 &&
		el.scrollHeight > 2
	);
}

export function isHiddenTarget( el ) {
	if ( ! el?.isConnected ) {
		return false;
	}
	if ( el.closest( 'details:not([open])' ) ) {
		return true;
	}
	if ( typeof el.checkVisibility === 'function' && ! el.checkVisibility() ) {
		return true;
	}
	for (
		let node = el;
		node && node.nodeType === 1;
		node = node.parentElement
	) {
		if ( node.tagName === 'BODY' ) {
			break;
		}
		if ( isCollapsed( node ) ) {
			return true;
		}
	}
	return false;
}

function cssId( doc, id ) {
	const css = doc.defaultView?.CSS;
	return css?.escape ? css.escape( id ) : id.replace( /["\\]/g, '\\$&' );
}

function looksLikeToggle( el ) {
	if ( ! el || el.nodeType !== 1 ) {
		return false;
	}
	return (
		el.hasAttribute( 'aria-expanded' ) ||
		/^(BUTTON|SUMMARY)$/.test( el.tagName ) ||
		/^(button|tab)$/.test( el.getAttribute( 'role' ) || '' ) ||
		TOGGLE_CLASS_HINT.test( String( el.className || '' ) )
	);
}

// A label wrapper (Kadence and Spectra tab <li>s) is not what their scripts listen on.
function clickable( el ) {
	if (
		! el ||
		/^(A|BUTTON|SUMMARY)$/.test( el.tagName ) ||
		/^(button|tab)$/.test( el.getAttribute( 'role' ) || '' )
	) {
		return el;
	}
	return (
		el.querySelector(
			'[role="tab"], [role="button"], button, a[href], summary'
		) || el
	);
}

function findToggle( panel ) {
	return clickable( findToggleTarget( panel ) );
}

function findToggleTarget( panel ) {
	const doc = panel.ownerDocument;
	for (
		let node = panel;
		node && node.tagName !== 'BODY';
		node = node.parentElement
	) {
		if ( node.id ) {
			const id = cssId( doc, node.id );
			const byId = doc.querySelector(
				`[aria-controls~="${ id }"], [data-bs-target="#${ id }"], [data-target="#${ id }"], a[href="#${ id }"]`
			);
			if ( byId ) {
				return byId;
			}
		}
		const labelledBy = node.getAttribute( 'aria-labelledby' );
		if ( labelledBy && node.getAttribute( 'role' ) === 'tabpanel' ) {
			const tab = doc.getElementById( labelledBy.split( /\s+/ )[ 0 ] );
			if ( tab ) {
				return tab;
			}
		}
		if ( node !== panel && ! isCollapsed( node ) ) {
			break;
		}
	}
	const byIndex = findTabByIndex( panel );
	if ( byIndex ) {
		return byIndex;
	}
	let sibling = panel.previousElementSibling;
	for ( let i = 0; sibling && i < 2; i++ ) {
		// A neighbouring hidden panel is not a toggle, whatever its class says.
		if (
			isCollapsed( sibling ) ||
			sibling.getAttribute( 'role' ) === 'tabpanel'
		) {
			sibling = sibling.previousElementSibling;
			continue;
		}
		if ( looksLikeToggle( sibling ) ) {
			return sibling.querySelector( '[aria-expanded]' ) || sibling;
		}
		const inner = sibling.querySelector(
			'[aria-expanded], button, [role="button"]'
		);
		if ( inner ) {
			return inner;
		}
		sibling = sibling.previousElementSibling;
	}
	return null;
}

const TAB_LIST_HINT = /(tab|nav|control|menu|title)/i;

/**
 * Tabs without ids or ARIA (Divi) pair the Nth panel with the Nth control in
 * a nearby list. Peers must share a class with the panel so an accordion's
 * title and body are never mistaken for two panels.
 */
function findTabByIndex( panel ) {
	const parent = panel.parentElement;
	if ( ! parent ) {
		return null;
	}
	const own = new Set( panel.classList );
	const peers = Array.from( parent.children ).filter(
		( el ) =>
			el.tagName === panel.tagName &&
			Array.from( el.classList ).some( ( c ) => own.has( c ) )
	);
	if ( peers.length < 2 ) {
		return null;
	}
	const index = peers.indexOf( panel );
	let scope = parent.parentElement;
	for ( let depth = 0; scope && depth < 4; depth++ ) {
		for ( const list of scope.querySelectorAll(
			'[role="tablist"], ul, ol, nav, div'
		) ) {
			if ( list.contains( panel ) || parent.contains( list ) ) {
				continue;
			}
			const items = Array.from( list.children );
			if (
				items.length === peers.length &&
				( list.getAttribute( 'role' ) === 'tablist' ||
					TAB_LIST_HINT.test( String( list.className || '' ) ) )
			) {
				return items[ index ];
			}
		}
		scope = scope.parentElement;
	}
	return null;
}

/** Outermost first, so nested accordions open from the outside in. */
function hiddenAncestors( el ) {
	const out = [];
	for (
		let node = el;
		node && node.tagName !== 'BODY';
		node = node.parentElement
	) {
		if ( node.tagName === 'DETAILS' && ! node.open && node !== el ) {
			out.unshift( node );
		} else if ( isCollapsed( node ) ) {
			out.unshift( node );
		}
	}
	return out;
}

function waitUntilShown( el ) {
	const view = el.ownerDocument.defaultView || window;
	const start = Date.now();
	return new Promise( ( resolve ) => {
		const tick = () => {
			if ( ! isHiddenTarget( el ) || Date.now() - start > WAIT_MS ) {
				resolve();
				return;
			}
			view.requestAnimationFrame( tick );
		};
		tick();
	} );
}

// Slide animations keep growing the page after the panel shows; scrolling
// before they finish stops short of the comment.
function waitUntilSettled( el ) {
	const view = el.ownerDocument.defaultView || window;
	const docEl = el.ownerDocument.documentElement;
	const start = Date.now();
	let last = '';
	let stableFrames = 0;
	return new Promise( ( resolve ) => {
		const tick = () => {
			const rect = el.getBoundingClientRect();
			const now = `${ Math.round( rect.top + view.scrollY ) }:${
				docEl.scrollHeight
			}`;
			stableFrames = now === last ? stableFrames + 1 : 0;
			last = now;
			if ( stableFrames >= 4 || Date.now() - start > SETTLE_MS ) {
				resolve();
				return;
			}
			view.requestAnimationFrame( tick );
		};
		tick();
	} );
}

/**
 * Open the accordions, tabs and `<details>` hiding `el` so a comment inside
 * them can be scrolled to. Resolves once it shows, or after a short wait.
 *
 * @param {Element} el
 * @return {Promise<boolean>} Whether anything had to be opened.
 */
export async function revealHiddenTarget( el ) {
	if ( ! isHiddenTarget( el ) ) {
		return false;
	}
	const clicked = new Set();
	for ( const panel of hiddenAncestors( el ) ) {
		if ( panel.tagName === 'DETAILS' ) {
			panel.open = true;
			continue;
		}
		if ( ! isCollapsed( panel ) ) {
			continue;
		}
		const toggle = findToggle( panel );
		if ( toggle && ! clicked.has( toggle ) ) {
			clicked.add( toggle );
			toggle.click();
			await waitUntilShown( panel );
		}
	}
	await waitUntilShown( el );
	await waitUntilSettled( el );
	return true;
}
