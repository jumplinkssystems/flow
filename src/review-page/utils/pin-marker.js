/**
 * Pin markers: comments dropped on a spot of the page rather than on selected
 * text. A pin is a button appended to the page body and positioned over the
 * element it belongs to, at a fraction of that element's box, so it follows
 * the element through reflows and viewport changes.
 */
export const PIN_CLASS = 'flow-inline-pin';
export const PIN_OFFER_CLASS = 'flow-inline-pin--offer';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PIN_BODY_PATH =
	'M12 1.5C7.305 1.5 3.5 5.305 3.5 10c0 5.95 7.43 11.93 7.746 12.18a1.2 1.2 0 0 0 1.508 0C13.07 21.93 20.5 15.95 20.5 10c0-4.695-3.805-8.5-8.5-8.5Z';
const PIN_DOT_PATH = 'M12 13.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z';

export function createPinElement(
	doc,
	{ commentId = 0, offer = false, label = '' } = {}
) {
	const pin = doc.createElement( 'button' );
	pin.type = 'button';
	pin.className = offer ? `${ PIN_CLASS } ${ PIN_OFFER_CLASS }` : PIN_CLASS;
	if ( commentId ) {
		pin.dataset.commentId = String( commentId );
	}
	if ( label ) {
		pin.setAttribute( 'aria-label', label );
	}
	const svg = doc.createElementNS( SVG_NS, 'svg' );
	svg.setAttribute( 'viewBox', '0 0 24 24' );
	svg.setAttribute( 'aria-hidden', 'true' );
	[
		[ PIN_BODY_PATH, 'flow-inline-pin__body' ],
		[ PIN_DOT_PATH, 'flow-inline-pin__dot' ],
	].forEach( ( [ d, className ] ) => {
		const path = doc.createElementNS( SVG_NS, 'path' );
		path.setAttribute( 'd', d );
		path.setAttribute( 'class', className );
		svg.appendChild( path );
	} );
	pin.appendChild( svg );
	doc.body.appendChild( pin );
	return pin;
}

// Absolute children of <body> are placed against the body box when the theme
// positions it, otherwise against the document.
function bodyOffsetForClientPoint( doc, clientX, clientY ) {
	const view = doc.defaultView || window;
	const body = doc.body;
	if ( view.getComputedStyle( body ).position !== 'static' ) {
		const rect = body.getBoundingClientRect();
		const cs = view.getComputedStyle( body );
		return {
			left:
				clientX - rect.left - ( parseFloat( cs.borderLeftWidth ) || 0 ),
			top: clientY - rect.top - ( parseFloat( cs.borderTopWidth ) || 0 ),
		};
	}
	return { left: clientX + view.scrollX, top: clientY + view.scrollY };
}

export function placePinAtClientPoint( pin, clientX, clientY ) {
	const { left, top } = bodyOffsetForClientPoint(
		pin.ownerDocument,
		clientX,
		clientY
	);
	pin.style.left = `${ left }px`;
	pin.style.top = `${ top }px`;
}

export function placePinOnAnchor( pin, anchor, x, y ) {
	const rect = anchor.getBoundingClientRect();
	placePinAtClientPoint(
		pin,
		rect.left + Number( x || 0 ) * rect.width,
		rect.top + Number( y || 0 ) * rect.height
	);
}

export function observePinAnchor( pin, anchor, reposition ) {
	pin.flowCleanup?.();
	const view = pin.ownerDocument.defaultView || window;
	let ro = null;
	if ( typeof view.ResizeObserver === 'function' ) {
		ro = new view.ResizeObserver( reposition );
		ro.observe( anchor );
		ro.observe( pin.ownerDocument.documentElement );
	}
	pin.addEventListener( 'pointerenter', reposition );
	pin.flowCleanup = () => {
		ro?.disconnect();
		pin.removeEventListener( 'pointerenter', reposition );
	};
}

export function removePin( pin ) {
	if ( ! pin ) {
		return;
	}
	pin.flowCleanup?.();
	pin.remove();
}
