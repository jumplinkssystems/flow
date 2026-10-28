/**
 * Shared pin observer and highlight-mutation rules. Kept free of DOM globals
 * so the review page and the node tests call the same code.
 */

/**
 * Fire every anchor callback once when the document or body changes size.
 * A record for one anchor still notifies only that anchor.
 *
 * @param {Map<Element, Set<Function>>} entries
 * @param {Array<{target: Element}>}    records
 * @param {Set<Element>}                layoutRoots
 */
export function dispatchSharedResize( entries, records, layoutRoots ) {
	const seen = new Set();
	const fire = ( cb ) => {
		if ( seen.has( cb ) ) {
			return;
		}
		seen.add( cb );
		cb();
	};
	let layoutShift = false;
	records.forEach( ( record ) => {
		if ( layoutRoots.has( record.target ) ) {
			layoutShift = true;
		}
		const cbs = entries.get( record.target );
		cbs?.forEach( fire );
	} );
	if ( ! layoutShift ) {
		return;
	}
	entries.forEach( ( cbs, target ) => {
		if ( layoutRoots.has( target ) ) {
			return;
		}
		cbs.forEach( fire );
	} );
}

/**
 * One ResizeObserver per document. Document and body records reposition
 * every pin, because content above an anchor can move it without resizing
 * the anchor itself.
 *
 * @param {Document}                      doc
 * @param {typeof ResizeObserver|undefined} ResizeObserverImpl
 * @return {{watch: (anchor: Element, cb: Function) => Function}}
 */
export function createSharedPinObserver( doc, ResizeObserverImpl ) {
	const entries = new Map();
	const layoutRoots = new Set(
		[ doc.documentElement, doc.body ].filter( Boolean )
	);
	let ro = null;
	if ( typeof ResizeObserverImpl === 'function' ) {
		ro = new ResizeObserverImpl( ( records ) => {
			dispatchSharedResize( entries, records, layoutRoots );
		} );
		layoutRoots.forEach( ( root ) => {
			ro.observe( root );
		} );
	}

	return {
		watch( anchor, cb ) {
			if ( ! ro ) {
				return () => {};
			}
			let set = entries.get( anchor );
			if ( ! set ) {
				set = new Set();
				entries.set( anchor, set );
				ro.observe( anchor );
			}
			set.add( cb );
			return () => {
				const current = entries.get( anchor );
				if ( ! current ) {
					return;
				}
				current.delete( cb );
				if ( current.size === 0 ) {
					entries.delete( anchor );
					try {
						ro.unobserve( anchor );
					} catch ( e ) {
						// Element may already be detached.
					}
				}
			};
		},
	};
}

/**
 * Highlight wrapping removes a text node and inserts a mark. That pair is
 * our own write. A text-only change in real content is not.
 *
 * @param {Array<{nodeType: number, chrome?: boolean}>} nodes
 * @param {boolean}                                     parentIsChrome
 * @return {boolean} True when the mutation should not schedule another wrap.
 */
export function shouldIgnoreHighlightMutation( nodes, parentIsChrome ) {
	if ( ! nodes.length ) {
		return false;
	}
	let sawText = false;
	let sawElement = false;
	for ( const node of nodes ) {
		if ( node.nodeType === 3 ) {
			sawText = true;
			continue;
		}
		if ( node.nodeType !== 1 || ! node.chrome ) {
			return false;
		}
		sawElement = true;
	}
	if ( sawText && ! sawElement ) {
		return parentIsChrome;
	}
	return true;
}
