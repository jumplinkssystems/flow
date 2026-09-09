import { SVG, Path } from '@wordpress/primitives';

/**
 * Figma Alert / warning icon (Frame 30).
 */
const alertWarningIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
	>
		<Path
			d="M12 3.25L20.5 18.75C20.78 19.25 20.41 19.875 19.83 19.875H4.17C3.59 19.875 3.22 19.25 3.5 18.75L12 3.25Z"
			stroke="currentColor"
			strokeWidth="1.5"
			fill="none"
		/>
		<Path
			d="M11 9H13V14H11V9ZM11 15H13V17H11V15Z"
			fill="currentColor"
		/>
	</SVG>
);

export default alertWarningIcon;
