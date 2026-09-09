/**
 * Unified review status colors — single source of truth for JS surfaces.
 * Keep in sync with assets/css/status-themes.css and src/review-page/_tokens.scss.
 */
export const STATUS_THEMES = {
	open_review: {
		bg: '#dff4ff',
		text: '#1579a5',
		border: '#b6e6ff',
	},
	approved: {
		bg: '#e7f5e4',
		text: '#458037',
		border: '#cae8c4',
	},
	in_review: {
		bg: '#fcf0ce',
		text: '#957500',
		border: '#f2dda4',
	},
	changes_requested: {
		bg: '#ffebea',
		text: '#c92122',
		border: '#ffd1d0',
	},
	pending: {
		bg: '#e6f3f5',
		text: '#5e777b',
		border: '#cde3e7',
	},
};

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
	Object.entries( STATUS_THEMES ).map( ( [ key, theme ] ) => [ key, theme.text ] )
);
