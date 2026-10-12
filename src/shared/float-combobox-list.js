/**
 * Builder panels scroll or clip their content, which cut a reviewer list off
 * at the panel edge. While the list is shown it is pinned to the viewport
 * under its field instead, whatever code opens or closes it.
 */
const FLOAT_PROPS = [
	'position',
	'top',
	'left',
	'right',
	'bottom',
	'width',
	'max-height',
	'z-index',
	'transition',
];

export function floatComboboxList( list, anchor ) {
	if ( ! list || ! anchor || list.dataset.flowEwFloating === '1' ) {
		return;
	}
	list.dataset.flowEwFloating = '1';
	let listening = false;

	const set = ( prop, value ) =>
		list.style.setProperty( prop, value, 'important' );

	const place = () => {
		const rect = anchor.getBoundingClientRect();
		// A builder's `transition: all` would make the measurement below read
		// a half-moved box.
		set( 'transition', 'none' );
		set( 'position', 'fixed' );
		set( 'right', 'auto' );
		set( 'bottom', 'auto' );
		set( 'z-index', '1000000' );
		set( 'top', '0px' );
		set( 'left', '0px' );
		// A transformed ancestor makes `fixed` relative to itself, not the
		// viewport; measure where 0,0 landed and correct for it.
		const origin = list.getBoundingClientRect();
		const top = rect.bottom + 4;
		const room = window.innerHeight - top - 12;
		set( 'top', top - origin.top + 'px' );
		set( 'left', rect.left - origin.left + 'px' );
		set( 'width', rect.width + 'px' );
		set( 'max-height', Math.max( 120, Math.min( 320, room ) ) + 'px' );
	};

	const onViewportChange = ( e ) => {
		// Scrolling the list itself must not re-place it.
		if ( ! list.hidden && e?.target !== list ) {
			place();
		}
	};

	const sync = () => {
		// The classic editor's metabox does not clip; leave it as it was.
		// Checked here: the list may not be in the page yet at setup.
		if ( ! list.hidden && ! list.closest( '#flow-ew-review.postbox' ) ) {
			place();
			// The drawer may still be animating in; place again once it settles.
			window.requestAnimationFrame( () => ! list.hidden && place() );
			window.setTimeout( () => ! list.hidden && place(), 250 );
			if ( ! listening ) {
				window.addEventListener( 'scroll', onViewportChange, true );
				window.addEventListener( 'resize', onViewportChange );
				listening = true;
			}
			return;
		}
		FLOAT_PROPS.forEach( ( prop ) => list.style.removeProperty( prop ) );
		if ( listening ) {
			window.removeEventListener( 'scroll', onViewportChange, true );
			window.removeEventListener( 'resize', onViewportChange );
			listening = false;
		}
	};

	new window.MutationObserver( sync ).observe( list, {
		attributes: true,
		attributeFilter: [ 'hidden' ],
	} );
	sync();
}
