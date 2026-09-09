import { SVG, Path } from '@wordpress/primitives';

/**
 * Resolve action — outlined circle + check by default; solid filled
 * circle + check on hover (see sidebar.scss / popover.scss).
 */
const commentResolve = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		width="24"
		height="24"
	>
		<Path
			className="flow-comment-resolve__default"
			d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12C20 16.411 16.411 20 12 20Z"
			fill="#458037"
		/>
		<Path
			className="flow-comment-resolve__default"
			d="M9.99896 13.587L7.69996 11.292L6.28796 12.708L10.001 16.413L16.707 9.70697L15.293 8.29297L9.99896 13.587Z"
			fill="#458037"
		/>
		<Path
			className="flow-comment-resolve__hover"
			d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM10.001 16.413L6.288 12.708L7.7 11.292L9.999 13.587L15.293 8.293L16.707 9.707L10.001 16.413Z"
			fill="#458037"
		/>
	</SVG>
);

export default commentResolve;
