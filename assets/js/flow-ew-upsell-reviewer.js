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

	var data = window.flowEwUpsellReviewer;
	if ( ! data || ! data.label ) {
		return;
	}

	var LINK_STYLE = [
		'display:inline-block',
		'margin-top:14px',
		'color:#018170',
		'font-size:13px',
		'font-weight:600',
		'line-height:1.4',
		'text-decoration:underline',
		'cursor:pointer',
	].join( ';' );

	var BADGE_STYLE = [
		'display:inline-block',
		'padding:1px 6px',
		'margin-right:4px',
		'font-size:9px',
		'font-weight:600',
		'letter-spacing:0.04em',
		'line-height:1.4',
		'border-radius:8px',
		'background:#d0f9ec',
		'color:#09121e',
		'vertical-align:1px',
	].join( ';' );

	var HELP_STYLE = [
		'margin-top:4px',
		'color:#757575',
		'font-size:12px',
		'line-height:1.4',
	].join( ';' );

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
		if ( review.invite_email || ( review.reviewer && review.reviewer.is_email ) ) {
			return true;
		}
		if ( Array.isArray( review.email_invites ) && review.email_invites.length > 0 ) {
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
		var createElement = window.wp.element.createElement;
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
				return createElement(
					'div',
					{ className: 'flow-ew-upsell-reviewer', style: { padding: '14px 0 0' } },
					createElement(
						'a',
						{
							href: data.href, target: '_blank', rel: 'noopener noreferrer',
							style: { display: 'inline-block', marginTop: '0', color: '#018170', fontSize: '13px', fontWeight: 600, lineHeight: 1.4, textDecoration: 'underline', cursor: 'pointer' },
						},
						createElement(
							'span',
							{ style: { display: 'inline-block', padding: '1px 6px', marginRight: '4px', fontSize: '9px', fontWeight: 600, letterSpacing: '0.04em', lineHeight: 1.4, borderRadius: '8px', background: '#d0f9ec', color: '#09121e', verticalAlign: '1px' } },
							'PRO'
						),
						data.label
					),
					data.helpText
						? createElement(
								'p',
								{ style: { marginTop: '4px', color: '#757575', fontSize: '12px', lineHeight: 1.4 } },
								data.helpText
						  )
						: null
				);
			}
		);
	}

	function buildUpsellNode() {
		var wrap = document.createElement( 'div' );
		wrap.className = 'flow-ew-upsell-reviewer';
		wrap.setAttribute( 'data-flow-ew-upsell-reviewer', '1' );

		var a = document.createElement( 'a' );
		a.href = data.href;
		a.target = '_blank';
		a.rel = 'noopener noreferrer';
		a.style.cssText = LINK_STYLE;

		var badge = document.createElement( 'span' );
		badge.style.cssText = BADGE_STYLE;
		badge.textContent = 'PRO';
		a.appendChild( badge );
		a.appendChild( document.createTextNode( data.label ) );
		wrap.appendChild( a );

		if ( data.helpText ) {
			var help = document.createElement( 'p' );
			help.style.cssText = HELP_STYLE;
			help.textContent = data.helpText;
			wrap.appendChild( help );
		}
		return wrap;
	}

	function selectHasReviewer( select ) {
		if ( ! select ) {
			return false;
		}
		var v = String( select.value || '' );
		if ( v === 'email' ) {
			return true;
		}
		if ( Number( v ) > 0 ) {
			return true;
		}
		var invite = ( select.getAttribute( 'data-invite-email' ) || '' ).trim();
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
		return !!(
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
		var select = document.getElementById( 'flow-ew-reviewer-select' );
		if ( ! select ) {
			return;
		}
		// Builder drawers own this CTA via syncFreeUpsells — skip to avoid duplicates.
		if ( isBuilderManagedSelect( select ) ) {
			return;
		}
		var root = findClassicRoot( select );
		var existing = root.querySelector(
			'[data-flow-ew-upsell-reviewer]'
		);
		var actions =
			root.querySelector( '#flow-ew-classic-actions' ) ||
			root.querySelector( '.flow-ew-classic__actions' );
		var anchor =
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

		document.addEventListener( 'flow-ew:classic-render', syncReviewerUpsell );
		document.addEventListener( 'change', function ( e ) {
			if ( e.target && e.target.id === 'flow-ew-reviewer-select' ) {
				syncReviewerUpsell();
			}
		} );

		if ( typeof MutationObserver !== 'undefined' ) {
			var mo = new MutationObserver( function ( muts ) {
				for ( var i = 0; i < muts.length; i++ ) {
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
