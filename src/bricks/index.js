import './style.css';
import '../shared/share-bar.css';
import { syncReviewerComboboxFromReview } from '../shared/sync-reviewer-combobox-from-review';
import {
	findBricksPublishControl,
	syncPublishGuardTooltip,
} from '../shared/publish-guard-ui';
import { createBuilderDrawer } from '../shared/builder-drawer';
import { createBuilderPublishGuard } from '../shared/builder-publish-guard';
import { mountWithRetry } from '../shared/mount-retry';

( function () {
	const drawer = document.getElementById( 'flow-ew-bricks-drawer' );
	const toggle = document.getElementById( 'flow-ew-bricks-toggle' );
	if ( ! drawer || ! toggle ) {
		return;
	}

	// Bricks 2.4 renamed #bricks-toolbar to #bricks-toolbar-top.bricks-toolbar.
	const TOOLBAR = '#bricks-toolbar, .bricks-toolbar';

	function findSaveButton( root ) {
		const save = root.querySelector( 'li.save' );
		if ( save ) {
			return save;
		}
		const publish = root.querySelector( '[data-name="publish"]' );
		return publish ? publish.closest( 'li' ) : null;
	}

	function findToolbarEndGroup() {
		const toolbar = document.querySelector( TOOLBAR );
		if ( ! toolbar ) {
			return null;
		}
		const saveBtn = findSaveButton( toolbar );
		if ( saveBtn && saveBtn.parentElement ) {
			return saveBtn.parentElement;
		}
		const groups = toolbar.querySelectorAll( '.group-wrapper' );
		return groups.length ? groups[ groups.length - 1 ] : null;
	}

	function ensureToolbarButton() {
		const group = findToolbarEndGroup();
		if ( ! group ) {
			return false;
		}

		let host = group.querySelector( 'li.flow-ew-bricks-review' );
		if ( ! host ) {
			host = document.createElement( 'li' );
			host.className = 'flow-ew-bricks-review';
			host.setAttribute( 'data-balloon', 'Review' );
			host.setAttribute( 'data-balloon-pos', 'bottom' );

			const saveBtn = findSaveButton( group );
			if ( saveBtn ) {
				// 2.4 orders toolbar items with flex `order`; match it to sit just before Save.
				host.style.order = saveBtn.style.order;
				group.insertBefore( host, saveBtn );
			} else {
				group.appendChild( host );
			}
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
		closeSelector: '.flow-ew-bricks-drawer__close',
		hideDelay: 200,
	} );

	const guard = createBuilderPublishGuard( function ( blocked ) {
		document.body.classList.toggle(
			'flow-ew-bricks-publish-blocked',
			blocked
		);
		syncPublishGuardTooltip( findBricksPublishControl(), blocked );
	} );

	document.addEventListener(
		'click',
		function ( e ) {
			if ( ! guard.isBlocked() ) {
				return;
			}
			const target = e.target;
			if ( ! target || ! target.closest ) {
				return;
			}
			if (
				target.closest( '[data-name="publish"]' ) &&
				target.closest( TOOLBAR )
			) {
				e.preventDefault();
				e.stopImmediatePropagation();
			}
		},
		true
	);

	document.addEventListener( 'flow-ew:classic-render', function ( e ) {
		const review = e.detail && e.detail.review;
		const status = ( review && review.status ) || '';
		toggle.dataset.status = status;
		const host = toggle.parentElement;
		if ( host && host.classList.contains( 'flow-ew-bricks-review' ) ) {
			host.setAttribute( 'data-status', status );
		}
		syncReviewerComboboxFromReview( review );
		guard.schedule( review );
	} );
} )();
