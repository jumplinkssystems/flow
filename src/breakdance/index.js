import './style.css';
import '../shared/share-bar.css';
import { syncReviewerComboboxFromReview } from '../shared/sync-reviewer-combobox-from-review';
import { collapseReviewerListbox } from '../shared/reviewer-combobox';
import { createBuilderDrawer } from '../shared/builder-drawer';
import { mountWithRetry } from '../shared/mount-retry';

( function () {
	const drawer = document.getElementById( 'flow-ew-breakdance-drawer' );
	const toggle = document.getElementById( 'flow-ew-breakdance-toggle' );
	if ( ! drawer || ! toggle ) {
		return;
	}

	function ensureToolbarButton() {
		const section = document.querySelector(
			'.top-bar-settings-and-structure-section'
		);
		if ( ! section ) {
			return false;
		}

		let host = section.querySelector( '.flow-ew-breakdance-review' );
		if ( ! host ) {
			host = document.createElement( 'div' );
			host.className = 'flow-ew-breakdance-review';
		}
		if ( host.parentElement !== section ) {
			section.appendChild( host );
		}

		toggle.hidden = false;
		if ( toggle.parentElement !== host ) {
			host.appendChild( toggle );
		}

		host.setAttribute( 'data-status', toggle.dataset.status || '' );
		return true;
	}

	mountWithRetry( ensureToolbarButton );

	createBuilderDrawer( {
		drawer,
		toggle,
		closeSelector: '.flow-ew-breakdance-drawer__close',
		activeClasses: [ 'is-active', 'breakdance-toolbar-icon-button-active' ],
		hideDelay: 200,
	} );

	document.addEventListener( 'flow-ew:classic-render', function ( e ) {
		const review = e.detail && e.detail.review;
		const status = ( review && review.status ) || '';
		toggle.dataset.status = status;
		const host = toggle.parentElement;
		if ( host && host.classList.contains( 'flow-ew-breakdance-review' ) ) {
			host.setAttribute( 'data-status', status );
		}
		syncReviewerComboboxFromReview( review );
		collapseReviewerListbox();
	} );
} )();
