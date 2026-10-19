import { render } from '@wordpress/element';

// The site's Customizer "Additional CSS" is for the theme, not for Flow.
const WP_STYLE_SELECTOR =
	'style[id^="wp-"]:not(#wp-custom-css), link[id^="wp-"]';

export default function mountInShadow( hostEl, cssText, Tree ) {
	const shadow = hostEl.attachShadow( { mode: 'open' } );

	const style = document.createElement( 'style' );
	// A leading BOM would be parsed as part of the first selector, silently
	// dropping that rule — usually the `:host` block that positions the panel.
	style.textContent = String( cssText || '' ).replace( /^\uFEFF/, '' );
	shadow.appendChild( style );

	const cloneNode = ( node ) => shadow.appendChild( node.cloneNode( true ) );
	document.querySelectorAll( WP_STYLE_SELECTOR ).forEach( cloneNode );

	const observer = new MutationObserver( ( mutations ) => {
		for ( const mutation of mutations ) {
			for ( const node of mutation.addedNodes ) {
				if ( node.nodeType !== 1 ) {
					continue;
				}
				const id = node.id || '';
				if (
					id.startsWith( 'wp-' ) &&
					id !== 'wp-custom-css' &&
					( node.tagName === 'STYLE' || node.tagName === 'LINK' )
				) {
					cloneNode( node );
				}
			}
		}
	} );
	observer.observe( document.head, { childList: true } );

	const mountPoint = document.createElement( 'div' );
	mountPoint.style.cssText = 'display:contents';
	shadow.appendChild( mountPoint );

	render( <Tree />, mountPoint );

	window.dispatchEvent(
		new CustomEvent( 'flow:shadow-mounted', {
			detail: { hostEl, shadowRoot: shadow },
		} )
	);
}
