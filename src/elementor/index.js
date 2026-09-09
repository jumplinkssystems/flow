import './style.css';
import { syncReviewerComboboxFromReview } from '../shared/sync-reviewer-combobox-from-review';
import { ensureReviewNotices } from '../shared/review-notice-dom';

( function bootElementorReview( attempt ) {
	const drawer = document.getElementById( 'flow-ew-elementor-drawer' );
	const toggle = document.getElementById( 'flow-ew-elementor-toggle' );
	if ( ! drawer || ! toggle ) {
		if ( attempt < 150 ) {
			requestAnimationFrame( function () {
				bootElementorReview( attempt + 1 );
			} );
		}
		return;
	}

	if ( drawer.dataset.flowEwElementorReady === '1' ) {
		return;
	}
	drawer.dataset.flowEwElementorReady = '1';

( function runElementorReview( drawer, toggle ) {

	function debounce( fn, ms ) {
		let t;
		return function () {
			clearTimeout( t );
			t = setTimeout( fn, ms );
		};
	}

	function findPublishButton( root ) {
		if ( ! root ) {
			return null;
		}
		const preferred = root.querySelectorAll(
			'button.MuiButton-root.MuiButton-containedPrimary'
		);
		for ( let i = 0; i < preferred.length; i++ ) {
			const b = preferred[ i ];
			if ( b.offsetParent !== null ) {
				return b;
			}
		}

		// Fallback for older Elementor builds where primary styles differ.
		const buttons = root.querySelectorAll( 'button.MuiButton-root' );
		for ( let i = 0; i < buttons.length; i++ ) {
			const b = buttons[ i ];
			if ( b.offsetParent === null ) {
				continue;
			}
			const label = b.textContent.replace( /\s+/g, ' ' ).trim();
			if ( /^(Publish|Submit)$/i.test( label ) ) {
				return b;
			}
		}
		return null;
	}

	function pickTopBarAnchor( root ) {
		if ( ! root ) {
			return null;
		}
		const buttons = Array.from(
			root.querySelectorAll( 'button.MuiButton-root' )
		).filter( ( b ) => b.offsetParent !== null );
		if ( ! buttons.length ) {
			return null;
		}
		const topButtons = buttons.filter( ( b ) => {
			const rect = b.getBoundingClientRect();
			return rect.top >= 0 && rect.top < 170;
		} );
		const source = topButtons.length ? topButtons : buttons;
		source.sort(
			( a, b ) =>
				b.getBoundingClientRect().right - a.getBoundingClientRect().right
		);
		return source[ 0 ] || null;
	}

	function findToolbarIconButtonRef( parent, roots ) {
		if ( parent ) {
			const inParent = parent.querySelector(
				'button.MuiIconButton-root'
			);
			if ( inParent && inParent.offsetParent !== null ) {
				return inParent;
			}
		}
		for ( let i = 0; i < roots.length; i++ ) {
			const btn = roots[ i ].querySelector(
				'button.MuiIconButton-root'
			);
			if ( btn && btn.offsetParent !== null ) {
				return btn;
			}
		}
		return null;
	}

	function syncInlineToggleMetrics( roots, parent ) {
		if ( ! toggle.classList.contains( 'flow-ew-elementor-toggle--inline' ) ) {
			toggle.style.width = '';
			toggle.style.height = '';
			toggle.style.alignSelf = '';
			return;
		}
		const ref = findToolbarIconButtonRef( parent, roots );
		if ( ref ) {
			const cs = window.getComputedStyle( ref );
			toggle.style.width = cs.width;
			toggle.style.height = cs.height;
			toggle.style.alignSelf = cs.alignSelf || 'center';
			return;
		}
		toggle.style.width = '';
		toggle.style.height = '';
		toggle.style.alignSelf = 'center';
	}

	function anchorToggleNearPublish() {
		const roots = [
			document.getElementById( 'elementor-editor-wrapper-v2' ),
			document.getElementById( 'elementor-editor-wrapper' ),
		].filter( Boolean );
		let publish = null;
		for ( let i = 0; i < roots.length; i++ ) {
			publish = findPublishButton( roots[ i ] );
			if ( publish ) {
				break;
			}
		}
		let anchor = publish;
		if ( ! anchor ) {
			for ( let i = 0; i < roots.length; i++ ) {
				anchor = pickTopBarAnchor( roots[ i ] );
				if ( anchor ) {
					break;
				}
			}
		}

		const parent = anchor && anchor.parentElement;
		if ( parent && anchor ) {
			// Inline next to Publish in the top bar. Skip if already in place
			// to avoid bouncing the MutationObserver.
			if (
				toggle.parentElement !== parent ||
				toggle.nextSibling !== anchor
			) {
				parent.insertBefore( toggle, anchor );
			}
			syncInlineToggleMetrics( roots, parent );
			toggle.style.position = '';
			toggle.style.top = '';
			toggle.style.left = '';
			toggle.style.right = '';
			toggle.classList.remove( 'flow-ew-elementor-toggle--fallback' );
			toggle.classList.remove( 'flow-ew-elementor-toggle--anchored' );
			toggle.classList.add( 'flow-ew-elementor-toggle--inline' );
		} else {
			// Only use floating fallback when the editor chrome itself is missing.
			const toolbarReady = roots.some( ( root ) =>
				!! pickTopBarAnchor( root )
			);
			if ( ! toolbarReady ) {
				toggle.style.position = 'fixed';
				toggle.style.top = '';
				toggle.style.left = '';
				toggle.style.right = '';
				toggle.style.width = '';
				toggle.style.height = '';
				toggle.style.alignSelf = '';
				toggle.classList.add( 'flow-ew-elementor-toggle--fallback' );
				toggle.classList.remove( 'flow-ew-elementor-toggle--anchored' );
				toggle.classList.remove( 'flow-ew-elementor-toggle--inline' );
			}
		}
	}

	const debouncedAnchor = debounce( anchorToggleNearPublish, 80 );
	window.addEventListener( 'resize', debouncedAnchor );
	const observeRoots = [
		document.getElementById( 'elementor-editor-wrapper-v2' ),
		document.getElementById( 'elementor-editor-wrapper' ),
	].filter( Boolean );
	for ( let r = 0; r < observeRoots.length; r++ ) {
		new MutationObserver( debouncedAnchor ).observe( observeRoots[ r ], {
			childList: true,
			subtree: true,
		} );
	}
	let anchorAttempts = 0;
	function tryAnchorLoop() {
		anchorToggleNearPublish();
		anchorAttempts++;
		if (
			anchorAttempts < 180 &&
			! toggle.classList.contains(
				'flow-ew-elementor-toggle--inline'
			)
		) {
			requestAnimationFrame( tryAnchorLoop );
		}
	}
	tryAnchorLoop();

	// Anchor the popup directly under the Review toggle, right-aligned to it
	// so it never overflows past the top bar's right edge.
	function positionPopup() {
		const rect = toggle.getBoundingClientRect();
		const top = Math.max( 8, Math.round( rect.bottom + 6 ) );
		const available = Math.max( 240, window.innerHeight - top - 8 );
		// Half the available viewport (keeps the drawer compact).
		const height = Math.round( available / 2 );
		drawer.style.top = top + 'px';
		drawer.style.right = ( window.innerWidth - rect.right ) + 'px';
		drawer.style.left = 'auto';
		drawer.style.bottom = 'auto';
		drawer.style.height = height + 'px';
		drawer.style.maxHeight = height + 'px';
	}

	function refreshReviewNotices() {
		const ew = window.flowEW;
		if ( ! ew ) {
			return;
		}
		ensureReviewNotices( {
			reviewMandatory: ew.reviewMandatory,
			isPublished: ew.isPublished,
			review: ew.activeReview,
			reviewerMeta: ew.reviewerMeta,
			currentUserCan: ew.currentUserCan,
		} );
	}

	function open() {
		drawer.style.display = '';
		positionPopup();
		drawer.classList.add( 'is-open' );
		toggle.classList.add( 'is-active' );
		refreshReviewNotices();
	}

	function close() {
		drawer.classList.remove( 'is-open' );
		toggle.classList.remove( 'is-active' );
		setTimeout( function () {
			if ( ! drawer.classList.contains( 'is-open' ) ) {
				drawer.style.display = 'none';
			}
		}, 150 );
	}

	toggle.addEventListener( 'click', function () {
		if ( drawer.classList.contains( 'is-open' ) ) {
			close();
		} else {
			open();
		}
	} );

	const closeBtn = drawer.querySelector( '.flow-ew-elementor-drawer__close' );
	if ( closeBtn ) {
		closeBtn.addEventListener( 'click', close );
	}

	document.addEventListener( 'keydown', function ( e ) {
		if ( e.key === 'Escape' && drawer.classList.contains( 'is-open' ) ) {
			close();
		}
	} );

	// Click outside the popup closes it. Ignore the reviewer clear (×) so
	// removal is never treated as an outside-dismiss.
	document.addEventListener( 'mousedown', function ( e ) {
		if ( ! drawer.classList.contains( 'is-open' ) ) {
			return;
		}
		if ( e.target.closest( '.flow-ew-reviewer-combobox__clear' ) ) {
			return;
		}
		if ( drawer.contains( e.target ) || toggle.contains( e.target ) ) {
			return;
		}
		close();
	} );

	// Backup clear wiring — classic capture may miss if boot attached elsewhere.
	drawer.addEventListener(
		'pointerdown',
		function ( e ) {
			const btn = e.target.closest(
				'.flow-ew-reviewer-combobox__clear'
			);
			if ( ! btn || ! drawer.contains( btn ) ) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			document.dispatchEvent(
				new CustomEvent( 'flow-ew:clear-reviewer' )
			);
		},
		true
	);

	// Reposition on layout changes while open.
	window.addEventListener( 'resize', function () {
		if ( drawer.classList.contains( 'is-open' ) ) {
			positionPopup();
		}
	} );

	function flowReviewStatusApproved() {
		const ds = toggle && toggle.dataset && toggle.dataset.status;
		if ( ds === 'approved' ) {
			return true;
		}
		const ew = window.flowEW;
		return !! (
			ew &&
			ew.activeReview &&
			ew.activeReview.status === 'approved'
		);
	}

	function tryElementorSetDocumentModified() {
		if ( ! flowReviewStatusApproved() ) {
			return;
		}
		try {
			if ( window.$e && typeof window.$e.internal === 'function' ) {
				window.$e.internal(
					'document/save/set-is-modified',
					{ status: true }
				);
				return;
			}
		} catch ( _ ) {
			// Command missing or editor not ready.
		}
		try {
			const doc =
				window.elementor &&
				window.elementor.documents &&
				window.elementor.documents.getCurrent &&
				window.elementor.documents.getCurrent();
			if ( doc && doc.editor ) {
				doc.editor.isChanged = true;
				doc.editor.isSaved = false;
			}
			if (
				window.elementor &&
				window.elementor.channels &&
				window.elementor.channels.editor
			) {
				window.elementor.channels.editor
					.reply( 'status', true )
					.trigger( 'status:change', true );
			}
		} catch ( _ ) {
			// Legacy paths unavailable.
		}
	}

	function scheduleTryElementorSetDocumentModified() {
		window.requestAnimationFrame( function () {
			tryElementorSetDocumentModified();
			window.setTimeout( tryElementorSetDocumentModified, 150 );
			window.setTimeout( tryElementorSetDocumentModified, 600 );
		} );
	}

	document.addEventListener( 'flow-ew:classic-render', function ( e ) {
		const review = e.detail && e.detail.review;
		toggle.dataset.status = ( review && review.status ) || '';
		syncReviewerComboboxFromReview( review, drawer );
		scheduleTryElementorSetDocumentModified();
	} );

	document.addEventListener( 'flow-ew:reload-review', function () {
		window.setTimeout( scheduleTryElementorSetDocumentModified, 600 );
	} );

	if ( window.jQuery ) {
		window.jQuery( window ).on( 'elementor:init', function () {
			scheduleTryElementorSetDocumentModified();
		} );
	}

	if ( flowReviewStatusApproved() ) {
		scheduleTryElementorSetDocumentModified();
	}

	function onElementorSave() {
		setTimeout( function () {
			document.dispatchEvent(
				new CustomEvent( 'flow-ew:reload-review' )
			);
		}, 500 );
	}

	if ( window.elementor ) {
		try {
			window.elementor.on( 'document:saved', onElementorSave );
		} catch ( _ ) {
			// Older Elementor.
		}
	}

	if ( window.jQuery ) {
		window
			.jQuery( document )
			.on( 'heartbeat-tick.wp-refresh-nonces', function () {
				setTimeout( function () {
					document.dispatchEvent(
						new CustomEvent( 'flow-ew:reload-review' )
					);
				}, 500 );
			} );
	}

} )( drawer, toggle );
} )( 0 );
