/**
 * "Unlock public review" upsell. Two surfaces: 1. Gutenberg — hooks
 * `flow_ew_open_review_extras` filter. 2. Classic / Elementor / Bricks — fills
 * the `.flow-ew-open-review-extras` DOM slot Free renders below the Open
 * Review toggle; visibility tracked via `lastReview.is_open`.
 */
( function () {
	'use strict';

	var data = window.flowEwUpsell;
	if ( ! data || ! data.label ) {
		return;
	}

	var LINK_STYLE = [
		'display:inline-block',
		'margin-top:6px',
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

	// Gutenberg
	if ( window.wp && window.wp.hooks && window.wp.element ) {
		var createElement = window.wp.element.createElement;
		window.wp.hooks.addFilter(
			'flow_ew_open_review_extras',
			'flow-ew/upsell-open-review',
			function ( existing ) {
				// Yield to Pro's own filter when present (e.g. its
				// "Open to public" controls).
				if ( existing ) {
					return existing;
				}
				return createElement(
					'div',
					{ className: 'flow-ew-upsell-open-review' },
					createElement(
						'a',
						{
							href: data.href,
							style: { display: 'inline-block', marginTop: '6px', color: '#018170', fontSize: '13px', fontWeight: 600, lineHeight: 1.4, textDecoration: 'underline', cursor: 'pointer' },
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
		wrap.className = 'flow-ew-upsell-open-review';

		var a = document.createElement( 'a' );
		a.href = data.href;
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

	// Free renders the slot regardless of toggle state (its `:empty`
	var lastReview = ( window.flowEW && window.flowEW.activeReview ) || null;

	function fillSlots( root ) {
		var slots = ( root || document ).querySelectorAll(
			'.flow-ew-open-review-extras:not([data-flow-ew-upsell-filled])'
		);
		for ( var i = 0; i < slots.length; i++ ) {
			var slot = slots[ i ];
			slot.setAttribute( 'data-flow-ew-upsell-filled', '1' );
			var node = buildUpsellNode();
			node.setAttribute( 'data-flow-ew-upsell-node', '1' );
			slot.appendChild( node );
		}
	}

	function syncVisibility() {
		var open = !! ( lastReview && lastReview.is_open );
		var nodes = document.querySelectorAll( '[data-flow-ew-upsell-node]' );
		for ( var i = 0; i < nodes.length; i++ ) {
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
			var mo = new MutationObserver( function ( muts ) {
				for ( var i = 0; i < muts.length; i++ ) {
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
