/** @typedef {'copy' | 'copied' | 'external'} ShareBarIconName */

const iconClass = 'flow-ew-share-icon';
const svgAttrs = ' viewBox="0 0 24 24" aria-hidden="true"';

/** Figma 24px Icon/regular-copy (Frame 38). */
const figmaCopyPath =
	'M18 0H8C6.897 0 6 0.897 6 2V6H2C0.897 6 0 6.897 0 8V18C0 19.103 0.897 20 2 20H12C13.103 20 14 19.103 14 18V14H18C19.103 14 20 13.103 20 12V2C20 0.897 19.103 0 18 0ZM2 18V8H12L12.002 18H2ZM18 12H14V8C14 6.897 13.103 6 12 6H8V2H18V12Z';

/** Figma 24px Icon/regular-arrow-up-right-stroke (Frame 38). */
const figmaExternalPath = 'M9.71 9V0H0.71V2H6.3L0 8.29L1.42 9.71L7.71 3.41V9H9.71Z';

/**
 * @param {ShareBarIconName} name
 * @returns {string}
 */
export function shareBarIconHtml( name ) {
	if ( name === 'copied' ) {
		return (
			'<svg class="' +
			iconClass +
			' flow-ew-share-icon--copied"' +
			svgAttrs +
			'>' +
			'<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>' +
			'</svg>'
		);
	}

	if ( name === 'external' ) {
		return (
			'<svg class="' +
			iconClass +
			' flow-ew-share-icon--external"' +
			svgAttrs +
			' xmlns="http://www.w3.org/2000/svg">' +
			'<path fill="currentColor" d="' +
			figmaExternalPath +
			'" transform="translate(7.145 7.145)"/>' +
			'</svg>'
		);
	}

	return (
		'<svg class="' +
		iconClass +
		' flow-ew-share-icon--copy"' +
		svgAttrs +
		' xmlns="http://www.w3.org/2000/svg">' +
		'<path fill="currentColor" d="' +
		figmaCopyPath +
		'" transform="translate(2 2)"/>' +
		'</svg>'
	);
}

/**
 * @param {ShareBarIconName} name
 */
export function ShareBarIcon( { name } ) {
	if ( name === 'copied' ) {
		return (
			<svg
				className={ `${ iconClass } flow-ew-share-icon--copied` }
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M5 13l4 4L19 7"
				/>
			</svg>
		);
	}

	if ( name === 'external' ) {
		return (
			<svg
				className={ `${ iconClass } flow-ew-share-icon--external` }
				viewBox="0 0 24 24"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fill="currentColor"
					d={ figmaExternalPath }
					transform="translate(7.145 7.145)"
				/>
			</svg>
		);
	}

	return (
		<svg
			className={ `${ iconClass } flow-ew-share-icon--copy` }
			viewBox="0 0 24 24"
			aria-hidden="true"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path fill="currentColor" d={ figmaCopyPath } transform="translate(2 2)" />
		</svg>
	);
}
