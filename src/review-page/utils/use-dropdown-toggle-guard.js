import { useEffect, useRef } from '@wordpress/element';

/**
 * Swallows the second click some browsers fire on a DropdownMenu toggle when
 * its portal-based popover is already open — without it the menu closes and
 * reopens immediately. Attach the returned ref to a wrapper around the menu.
 */
export default function useDropdownToggleGuard() {
	const wrapperRef = useRef( null );

	useEffect( () => {
		const wrapper = wrapperRef.current;
		if ( ! wrapper ) {
			return;
		}
		let wasOpenOnPointerDown = false;
		const toggleOf = () =>
			wrapper.querySelector( '.components-dropdown-menu__toggle' );
		const onPointerDown = ( e ) => {
			const toggle = toggleOf();
			wasOpenOnPointerDown =
				!! toggle &&
				toggle.getAttribute( 'aria-expanded' ) === 'true' &&
				( toggle === e.target || toggle.contains( e.target ) );
		};
		const onClick = ( e ) => {
			if ( ! wasOpenOnPointerDown ) {
				return;
			}
			wasOpenOnPointerDown = false;
			const toggle = toggleOf();
			if (
				toggle &&
				( toggle === e.target || toggle.contains( e.target ) )
			) {
				e.stopImmediatePropagation();
			}
		};
		wrapper.addEventListener( 'pointerdown', onPointerDown, true );
		wrapper.addEventListener( 'click', onClick, true );
		return () => {
			wrapper.removeEventListener( 'pointerdown', onPointerDown, true );
			wrapper.removeEventListener( 'click', onClick, true );
		};
	}, [] );

	return wrapperRef;
}
