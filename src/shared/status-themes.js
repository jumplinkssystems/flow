import STATUS_PALETTE from '../../assets/status-palette.json';

/** Review status colours; assets/status-palette.json is the single source. */
export const STATUS_THEMES = STATUS_PALETTE;

/** @param {string|undefined|null} status */
export function statusThemeStyle( status ) {
	const theme = status ? STATUS_THEMES[ status ] : null;
	if ( ! theme ) {
		return {};
	}
	return {
		'--flow-status-bg': theme.bg,
		'--flow-status-text': theme.text,
		'--flow-status-border': theme.border,
		'--flow-badge-color': theme.text,
	};
}

/** @param {string|undefined|null} status */
export function statusTextColor( status ) {
	return ( status && STATUS_THEMES[ status ]?.text ) || '#666';
}

/** Text colors only — backward compat for callers that only need the accent. */
export const STATUS_COLORS = Object.fromEntries(
	Object.entries( STATUS_THEMES ).map( ( [ key, theme ] ) => [
		key,
		theme.text,
	] )
);

const THEME_PROPS = [
	'--flow-status-bg',
	'--flow-status-text',
	'--flow-status-border',
	'--flow-badge-color',
];

/**
 * Write (or clear) the status custom properties on an element.
 *
 * @param {HTMLElement}           el
 * @param {string|undefined|null} status
 */
export function applyStatusTheme( el, status ) {
	const themeStyle = statusThemeStyle( status );
	THEME_PROPS.forEach( ( prop ) => el.style.removeProperty( prop ) );
	Object.entries( themeStyle ).forEach( ( [ prop, value ] ) => {
		el.style.setProperty( prop, value );
	} );
}
