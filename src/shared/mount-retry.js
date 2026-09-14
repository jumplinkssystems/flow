import { debounce } from './debounce';

/**
 * Builders render their toolbars asynchronously. Run `ensure` on every DOM
 * mutation (debounced) and in a rAF loop until it reports success.
 *
 * @param {() => boolean} ensure
 * @param {{ attempts?: number, debounceMs?: number }} [opts]
 * @return {MutationObserver}
 */
export function mountWithRetry( ensure, opts = {} ) {
	const { attempts = 240, debounceMs = 80 } = opts;
	const observer = new MutationObserver( debounce( ensure, debounceMs ) );
	observer.observe( document.body, { childList: true, subtree: true } );

	let tries = 0;
	( function loop() {
		const ok = ensure();
		tries++;
		if ( ! ok && tries < attempts ) {
			requestAnimationFrame( loop );
		}
	} )();

	return observer;
}
