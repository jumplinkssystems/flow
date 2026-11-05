/**
 * Where a pin sits on its element, one axis at a time. A click near an edge
 * keeps its pixel distance from that edge when the element resizes (a pin
 * 20px from a card's corner stays 20px from it on a phone); a click in the
 * middle keeps its share of the size. Distances are negative outside the box,
 * for a pin dropped in the margin next to the element.
 */

const SNAP_RANGE_PX = 240;
const SNAP_TIE_PX = 24;

/**
 * @param {number} point Client coordinate of the click.
 * @param {number} start Element's start (left or top).
 * @param {number} size  Element's width or height.
 * @return {{edge:'start'|'end', px:number}} Distance in from the nearer edge.
 */
export function axisAnchor( point, start, size ) {
	const fromStart = point - start;
	const fromEnd = start + size - point;
	return fromStart <= fromEnd
		? { edge: 'start', px: Math.round( fromStart ) }
		: { edge: 'end', px: Math.round( fromEnd ) };
}

/**
 * @param {number} start
 * @param {number} size
 * @param {number} fraction Share of the size, the fallback and older pins' only data.
 * @param {{edge:string, px:number}|undefined} anchor
 * @return {number} Client coordinate for the pin's tip.
 */
export function axisPosition( start, size, fraction, anchor ) {
	const px = Number( anchor?.px );
	// Past the middle the edge is no longer the nearer one; keep the proportion.
	if ( anchor && Number.isFinite( px ) && px <= size / 2 ) {
		return anchor.edge === 'end' ? start + size - px : start + px;
	}
	const share = Math.min( 1, Math.max( 0, Number( fraction ) || 0 ) );
	return start + share * size;
}

function distanceToRect( x, y, rect ) {
	const dx = Math.max( rect.left - x, 0, x - rect.right );
	const dy = Math.max( rect.top - y, 0, y - rect.bottom );
	return Math.hypot( dx, dy );
}

/**
 * A click in a container's gap belongs to the block beside it, not the whole
 * container. Among the nearest candidates, the smallest box wins, so a
 * paragraph beats the group that wraps it.
 *
 * @param {{x:number,y:number}} point
 * @param {Array<{el:*, rect:{left:number,top:number,right:number,bottom:number,width:number,height:number}}>} candidates
 * @return {*} The chosen candidate's `el`, or null when none is near enough.
 */
export function pickSnapTarget( point, candidates ) {
	const distances = candidates.map( ( c ) =>
		distanceToRect( point.x, point.y, c.rect )
	);
	const nearest = Math.min( Infinity, ...distances );
	if ( nearest > SNAP_RANGE_PX ) {
		return null;
	}
	let best = null;
	candidates.forEach( ( c, i ) => {
		if ( distances[ i ] > nearest + SNAP_TIE_PX ) {
			return;
		}
		const area = c.rect.width * c.rect.height;
		if ( ! best || area < best.area ) {
			best = { el: c.el, area };
		}
	} );
	return best ? best.el : null;
}
