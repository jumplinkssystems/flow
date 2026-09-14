/**
 * `window.flowEW` is printed by wp_localize_script after some bundles have
 * already evaluated (the Free sidebar depends on the Pro editor bundle), so
 * it must never be destructured at module scope. This accessor is null-safe.
 */
export function getConfig() {
	return ( typeof window !== 'undefined' && window.flowEW ) || {};
}
