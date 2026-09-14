import './style.css';
import '../shared/share-bar.css';
import { syncReviewerComboboxFromReview } from '../shared/sync-reviewer-combobox-from-review';
import { collapseReviewerListbox } from '../shared/reviewer-combobox';
import { createBuilderDrawer } from '../shared/builder-drawer';
import { mountWithRetry } from '../shared/mount-retry';

( function () {
	const drawer = document.getElementById( 'flow-ew-oxygen-drawer' );
	const toggle = document.getElementById( 'flow-ew-oxygen-toggle' );
	if ( ! drawer || ! toggle ) {
		return;
	}

	/**
	 * Oxygen 6 has no `.top-bar-settings-and-structure-section`. Mount the
	 * review control in the right `.topbar-section`, immediately before the
	 * Save control's top-level sibling (Save itself may be nested).
	 */
	function findToolbarMount() {
		const save = document.querySelector( '.button-save-oxygen' );
		if ( ! save ) {
			return null;
		}
		const section = save.closest( '.topbar-section' );
		if ( ! section ) {
			return null;
		}
		// insertBefore requires a direct child of `section` as the reference node.
		let before = save;
		while ( before.parentElement && before.parentElement !== section ) {
			before = before.parentElement;
		}
		if ( before.parentElement !== section ) {
			return null;
		}
		return { section, before };
	}

	function ensureToolbarButton() {
		const mount = findToolbarMount();
		if ( ! mount ) {
			return false;
		}

		toggle.hidden = false;
		toggle.classList.add( 'breakdance-toolbar-icon-button' );

		if (
			toggle.parentElement !== mount.section ||
			toggle.nextElementSibling !== mount.before
		) {
			mount.section.insertBefore( toggle, mount.before );
		}

		return true;
	}

	mountWithRetry( ensureToolbarButton );

	createBuilderDrawer( {
		drawer,
		toggle,
		closeSelector: '.flow-ew-oxygen-drawer__close',
		activeClasses: [ 'is-active', 'breakdance-toolbar-icon-button-active' ],
		hideDelay: 200,
	} );

	document.addEventListener( 'flow-ew:classic-render', function ( e ) {
		const review = e.detail && e.detail.review;
		toggle.dataset.status = ( review && review.status ) || '';
		syncReviewerComboboxFromReview( review );
		collapseReviewerListbox();
	} );
} )();
