/**
 * Prefer the visible builder drawer panel over the Classic Editor metabox.
 * On `post.php?action=elementor` both can exist in the DOM with duplicate IDs.
 */

const BUILDER_DRAWER_IDS = [
	'flow-ew-elementor-drawer',
	'flow-ew-bricks-drawer',
	'flow-ew-breakdance-drawer',
	'flow-ew-avada-drawer',
	'flow-ew-beaver-drawer',
	'flow-ew-divi-drawer',
	'flow-ew-oxygen-drawer',
];

/**
 * When the Elementor toggle is already in the DOM, wait for the drawer panel
 * before falling back to a classic metabox — otherwise boot attaches to the
 * wrong root and the drawer × clear never fires.
 */
function shouldWaitForBuilderDrawer() {
	if (
		document.getElementById( 'flow-ew-elementor-toggle' ) &&
		! document.getElementById( 'flow-ew-elementor-drawer' )
	) {
		return true;
	}
	return false;
}

export function resolveClassicRoot() {
	if ( shouldWaitForBuilderDrawer() ) {
		return null;
	}

	for ( let i = 0; i < BUILDER_DRAWER_IDS.length; i++ ) {
		const el = document.querySelector(
			'#' + BUILDER_DRAWER_IDS[ i ] + ' #flow-ew-classic'
		);
		if ( el ) {
			return el;
		}
	}

	return document.getElementById( 'flow-ew-classic' );
}

export function resolveClassicOpenSlot() {
	for ( let i = 0; i < BUILDER_DRAWER_IDS.length; i++ ) {
		const el = document.querySelector(
			'#' + BUILDER_DRAWER_IDS[ i ] + ' #flow-ew-classic-open-slot'
		);
		if ( el ) {
			return el;
		}
	}

	return document.getElementById( 'flow-ew-classic-open-slot' );
}

/**
 * Prefer the builder-drawer reviewer slot even when the drawer is display:none
 * (Elementor boots closed). Falling back to "first visible" picks the classic
 * metabox and leaves the Elementor drawer without Pro chips.
 */
export function resolveClassicReviewerSlot() {
	const slots = Array.from(
		document.querySelectorAll( '#flow-ew-classic-reviewer-slot' )
	);
	if ( ! slots.length ) {
		return null;
	}

	for ( let i = 0; i < BUILDER_DRAWER_IDS.length; i++ ) {
		const id = BUILDER_DRAWER_IDS[ i ];
		if ( ! document.getElementById( id ) ) {
			continue;
		}
		const inDrawer = slots.find(
			( el ) => el && el.closest( '#' + id )
		);
		if ( inDrawer ) {
			return inDrawer;
		}
	}

	const visible = slots.find( ( el ) => el && el.offsetParent !== null );
	return visible || slots[ 0 ];
}
