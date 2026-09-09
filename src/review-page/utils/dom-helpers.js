export function closestFromEventTarget( target, selector ) {
	const el =
		target?.nodeType === Node.ELEMENT_NODE
			? target
			: target?.parentElement;
	return el?.closest?.( selector ) ?? null;
}

/**
 * True when an event originated inside (or on) a node that lives in a Shadow
 * DOM root.
 *
 * Document-level mouse listeners receive `e.target` retargeted to the shadow
 * host element, so a normal `node.contains(e.target)` check would always
 * return false even when the click is on a button rendered inside the
 * shadow. `composedPath()` traverses the shadow boundary correctly, so this
 * helper is the right primitive for "did this event happen inside the
 * popover (or any other shadow-mounted surface)?".
 *
 * Use this anywhere you'd otherwise reach for `popoverRef.current.contains(e.target)`
 * on review-page surfaces (popover, bar, sidebar) — the rule is one place, not
 * scattered across components.
 *
 * @param {Event} event
 * @param {Node|null|undefined} node
 * @return {boolean}
 */
export function eventHitsShadowNode( event, node ) {
	if ( ! node || ! event ) {
		return false;
	}
	const path = typeof event.composedPath === 'function' ? event.composedPath() : null;
	if ( ! path ) {
		return !! node.contains?.( event.target );
	}
	return path.includes( node );
}

/**
 * Was the event triggered from inside a "utility" overlay that's rendered
 * outside the popover's own shadow tree — e.g. a wp-components Popover or
 * DropdownMenu (block-type / alignment / list pickers in the comment editor),
 * an autocomplete suggestion list, or Pro's @mention picker host?
 *
 * The inline-comment popovers register `mousedown` on `document` to close
 * when the user clicks anywhere outside themselves. Without this guard,
 * opening a dropdown inside the comment editor and clicking one of its
 * menu items dismisses the comment popover and the user loses what they
 * were typing, because the menu items live in `document.body` portals
 * outside the shadow root.
 *
 * Add-ons that render their own portal hosts can opt in by setting
 * `data-flow-portal-ui="true"` on the host element.
 *
 * @param {Event} event
 * @return {boolean}
 */
export function eventInsidePortalUI( event ) {
	if ( ! event ) {
		return false;
	}
	const path = typeof event.composedPath === 'function' ? event.composedPath() : null;
	const probe = path && path.length ? path : ( event.target ? [ event.target ] : [] );
	for ( const node of probe ) {
		if ( ! node || node.nodeType !== 1 ) continue;
		// `closest` walks ancestors too — works whether `node` is the menu
		// item itself or a child element of it.
		if (
			node.closest?.(
				'.components-popover, .components-dropdown, [data-flow-portal-ui="true"]'
			)
		) {
			return true;
		}
	}
	return false;
}
