/**
 * Open/close state for a builder review drawer driven by a toolbar toggle.
 *
 * @param {{
 *   drawer: HTMLElement,
 *   toggle: HTMLElement,
 *   closeSelector?: string,
 *   activeClasses?: string[],
 *   hideDelay?: number,
 *   onBeforeOpen?: () => void,
 *   onAfterOpen?: () => void,
 *   outsideClose?: false | { ignore?: string },
 * }} opts
 */
export function createBuilderDrawer( opts ) {
	const {
		drawer,
		toggle,
		closeSelector = '',
		activeClasses = [ 'is-active' ],
		hideDelay = 200,
		onBeforeOpen = null,
		onAfterOpen = null,
		outsideClose = false,
	} = opts;

	function isOpen() {
		return drawer.classList.contains( 'is-open' );
	}

	function open() {
		drawer.style.display = '';
		if ( onBeforeOpen ) {
			onBeforeOpen();
		}
		drawer.classList.add( 'is-open' );
		toggle.classList.add( ...activeClasses );
		if ( onAfterOpen ) {
			onAfterOpen();
		}
	}

	function close() {
		drawer.classList.remove( 'is-open' );
		toggle.classList.remove( ...activeClasses );
		setTimeout( function () {
			if ( ! isOpen() ) {
				drawer.style.display = 'none';
			}
		}, hideDelay );
	}

	function toggleDrawer() {
		if ( isOpen() ) {
			close();
		} else {
			open();
		}
	}

	toggle.addEventListener( 'click', function ( e ) {
		e.preventDefault();
		e.stopPropagation();
		toggleDrawer();
	} );

	const closeBtn = closeSelector
		? drawer.querySelector( closeSelector )
		: null;
	if ( closeBtn ) {
		closeBtn.addEventListener( 'click', close );
	}

	document.addEventListener( 'keydown', function ( e ) {
		if ( e.key === 'Escape' && isOpen() ) {
			close();
		}
	} );

	if ( outsideClose ) {
		document.addEventListener( 'mousedown', function ( e ) {
			if ( ! isOpen() ) {
				return;
			}
			if (
				outsideClose.ignore &&
				e.target.closest( outsideClose.ignore )
			) {
				return;
			}
			if ( drawer.contains( e.target ) || toggle.contains( e.target ) ) {
				return;
			}
			close();
		} );
	}

	return { open, close, toggle: toggleDrawer, isOpen };
}
