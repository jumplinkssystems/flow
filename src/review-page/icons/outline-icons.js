import { Path, SVG } from '@wordpress/primitives';

/*
 * Thin outline icons for the View menu and the bar. The inline fill keeps
 * WordPress's menu styles (`svg { fill: currentColor }`) from filling them.
 */
const outline = ( ...paths ) => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		style={ { fill: 'none' } }
	>
		{ paths.map( ( d ) => (
			<Path
				key={ d }
				d={ d }
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		) ) }
	</SVG>
);

export const eyeIcon = outline(
	'M2.75 12s3.25-6.25 9.25-6.25S21.25 12 21.25 12 18 18.25 12 18.25 2.75 12 2.75 12Z',
	'M12 14.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z'
);

export const eyeOffIcon = outline(
	'M10.1 5.95A9.4 9.4 0 0 1 12 5.75c6 0 9.25 6.25 9.25 6.25a17 17 0 0 1-2.6 3.35',
	'M14.1 14.1A2.75 2.75 0 0 1 9.9 9.9',
	'M17.1 17.1A9.2 9.2 0 0 1 12 18.25C6 18.25 2.75 12 2.75 12a16.6 16.6 0 0 1 4.15-5.1',
	'M3.75 3.75l16.5 16.5'
);

export const lockClosedIcon = outline(
	'M7.75 10.75V8a4.25 4.25 0 0 1 8.5 0v2.75',
	'M6.75 10.75h10.5a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1H6.75a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1Z'
);

export const lockOpenIcon = outline(
	'M7.75 10.75V8a4.25 4.25 0 0 1 8.1-1.8',
	'M6.75 10.75h10.5a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1H6.75a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1Z'
);
