/**
 * "Unlock public review" upsell. Two surfaces: 1. Gutenberg — hooks
 * `flow_ew_open_review_extras` filter. 2. Classic / Elementor / Bricks — fills
 * the `.flow-ew-open-review-extras` DOM slot Free renders below the Open
 * Review toggle; visibility tracked via `lastReview.is_open`.
 */
( function () {
	'use strict';

	const data = window.flowEwUpsell;
	if ( ! data || ! data.label ) {
		return;
	}

	const lib = window.flowEwUpsellLib;
	if ( ! lib ) {
		return;
	}

	// Gutenberg
	if ( window.wp && window.wp.hooks && window.wp.element ) {
		const createElement = window.wp.element.createElement;
		window.wp.hooks.addFilter(
			'flow_ew_open_review_extras',
			'flow-ew/upsell-open-review',
			function ( existing ) {
				// Yield to Pro's own filter when present (e.g. its
				// "Open to public" controls).
				if ( existing ) {
					return existing;
				}
				return lib.gutenbergNode( createElement, data, {
					className: 'flow-ew-upsell-open-review',
					linkMarginTop: '6px',
				} );
			}
		);
	}

	function buildUpsellNode() {
		return lib.buildNode( data, {
			className: 'flow-ew-upsell-open-review',
			linkMarginTop: '6px',
		} );
	}

	// Free renders the slot regardless of toggle state (its `:empty`
	let lastReview = ( window.flowEW && window.flowEW.activeReview ) || null;

	function fillSlots( root ) {
		const slots = ( root || document ).querySelectorAll(
			'.flow-ew-open-review-extras:not([data-flow-ew-upsell-filled])'
		);
		for ( let i = 0; i < slots.length; i++ ) {
			const slot = slots[ i ];
			slot.setAttribute( 'data-flow-ew-upsell-filled', '1' );
			const node = buildUpsellNode();
			node.setAttribute( 'data-flow-ew-upsell-node', '1' );
			slot.appendChild( node );
		}
	}

	function syncVisibility() {
		const open = !! ( lastReview && lastReview.is_open );
		const nodes = document.querySelectorAll( '[data-flow-ew-upsell-node]' );
		for ( let i = 0; i < nodes.length; i++ ) {
			nodes[ i ].style.display = open ? '' : 'none';
		}
	}

	function init() {
		fillSlots( document );
		syncVisibility();

		document.addEventListener( 'flow-ew:classic-render', function ( e ) {
			lastReview = ( e.detail && e.detail.review ) || null;
			fillSlots( document );
			syncVisibility();
		} );

		// Slots can appear later when Elementor / Bricks drawers mount —
		// observe additions and re-scan.
		if ( typeof MutationObserver !== 'undefined' ) {
			const mo = new MutationObserver( function ( muts ) {
				for ( let i = 0; i < muts.length; i++ ) {
					if ( muts[ i ].addedNodes && muts[ i ].addedNodes.length ) {
						fillSlots( document );
						syncVisibility();
						return;
					}
				}
			} );
			mo.observe( document.body, { childList: true, subtree: true } );
		}
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
