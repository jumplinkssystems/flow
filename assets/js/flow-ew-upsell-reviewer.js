/**
 * "Unlock multiple reviewers" upsell. Two surfaces: 1. Gutenberg — hooks
 * `flow_ew_reviewer_field_extras`. Pro replaces the reviewer field via
 * `flow_ew_reviewer_field_slot`; this filter only renders when Free is active
 * and a reviewer (WP user or email invite) is already assigned. 2. Classic /
 * Elementor / Bricks — injects above the action buttons when a reviewer is
 * selected.
 */
( function () {
	'use strict';

	const data = window.flowEwUpsellReviewer;
	if ( ! data || ! data.label ) {
		return;
	}

	const lib = window.flowEwUpsellLib;
	if ( ! lib ) {
		return;
	}

	function reviewHasAssignedReviewer( review ) {
		if ( ! review ) {
			return false;
		}
		if ( Number( review.reviewer_id || 0 ) > 0 ) {
			return true;
		}
		if ( review.reviewer && Number( review.reviewer.id || 0 ) > 0 ) {
			return true;
		}
		if (
			review.invite_email ||
			( review.reviewer && review.reviewer.is_email )
		) {
			return true;
		}
		if (
			Array.isArray( review.email_invites ) &&
			review.email_invites.length > 0
		) {
			return true;
		}
		// Synthetic email reviewer ids are negative.
		if ( review.reviewer && Number( review.reviewer.id || 0 ) !== 0 ) {
			return true;
		}
		return false;
	}

	// Gutenberg
	if ( window.wp && window.wp.hooks && window.wp.element ) {
		const createElement = window.wp.element.createElement;
		window.wp.hooks.addFilter(
			'flow_ew_reviewer_field_extras',
			'flow-ew/upsell-reviewer',
			function ( existing, ctx ) {
				if ( existing ) {
					return existing;
				}
				if ( ! reviewHasAssignedReviewer( ctx && ctx.review ) ) {
					return null;
				}
				// PanelBody already provides 16px horizontal indent; we
				// only need vertical spacing here.
				return lib.gutenbergNode( createElement, data, {
					className: 'flow-ew-upsell-reviewer',
					linkMarginTop: '0',
					wrapStyle: { padding: '14px 0 0' },
				} );
			}
		);
	}

	function buildUpsellNode() {
		const wrap = lib.buildNode( data, {
			className: 'flow-ew-upsell-reviewer',
			linkMarginTop: '14px',
		} );
		wrap.setAttribute( 'data-flow-ew-upsell-reviewer', '1' );
		return wrap;
	}

	function selectHasReviewer( select ) {
		if ( ! select ) {
			return false;
		}
		const v = String( select.value || '' );
		if ( v === 'email' ) {
			return true;
		}
		if ( Number( v ) > 0 ) {
			return true;
		}
		const invite = (
			select.getAttribute( 'data-invite-email' ) || ''
		).trim();
		return invite.length > 0;
	}

	function findClassicRoot( select ) {
		return (
			select.closest( '#flow-ew-classic' ) ||
			select.closest( '.flow-ew-classic' ) ||
			document
		);
	}

	function isBuilderManagedSelect( select ) {
		return !! (
			select &&
			select.closest &&
			select.closest(
				[
					'.flow-ew-avada-drawer',
					'#flow-ew-avada-drawer',
					'.flow-ew-beaver-drawer',
					'#flow-ew-beaver-drawer',
					'.flow-ew-divi-drawer',
					'#flow-ew-divi-drawer',
					'.flow-ew-oxygen-drawer',
					'#flow-ew-oxygen-drawer',
					'.flow-ew-breakdance-drawer',
					'#flow-ew-breakdance-drawer',
				].join( ',' )
			)
		);
	}

	function syncReviewerUpsell() {
		const select = document.getElementById( 'flow-ew-reviewer-select' );
		if ( ! select ) {
			return;
		}
		// Builder drawers own this CTA via syncFreeUpsells — skip to avoid duplicates.
		if ( isBuilderManagedSelect( select ) ) {
			return;
		}
		const root = findClassicRoot( select );
		let existing = root.querySelector( '[data-flow-ew-upsell-reviewer]' );
		const actions =
			root.querySelector( '#flow-ew-classic-actions' ) ||
			root.querySelector( '.flow-ew-classic__actions' );
		const anchor =
			root.querySelector( '#flow-ew-reviewer-combobox' ) ||
			select.parentElement;

		if ( selectHasReviewer( select ) ) {
			if ( ! existing ) {
				existing = buildUpsellNode();
				if ( actions && actions.parentElement ) {
					actions.parentElement.insertBefore( existing, actions );
				} else if ( anchor && anchor.parentElement ) {
					anchor.parentElement.insertBefore(
						existing,
						anchor.nextSibling
					);
				}
			}
		} else if ( existing ) {
			existing.parentNode.removeChild( existing );
		}
	}

	function init() {
		syncReviewerUpsell();

		document.addEventListener(
			'flow-ew:classic-render',
			syncReviewerUpsell
		);
		document.addEventListener( 'change', function ( e ) {
			if ( e.target && e.target.id === 'flow-ew-reviewer-select' ) {
				syncReviewerUpsell();
			}
		} );

		if ( typeof MutationObserver !== 'undefined' ) {
			const mo = new MutationObserver( function ( muts ) {
				for ( let i = 0; i < muts.length; i++ ) {
					if ( muts[ i ].addedNodes && muts[ i ].addedNodes.length ) {
						syncReviewerUpsell();
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
