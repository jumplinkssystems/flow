/**
 * Sticky upgrade bar at the bottom of the review preview. Mounted in shadow
 * DOM so theme CSS can't bleed in. Admin-only at PHP enqueue;
 * `localStorage.flow_ew_review_upsell_dismissed` persists dismissal.
 */
( function () {
	'use strict';

	var data = window.flowEwUpsellReviewBar;
	if ( ! data ) {
		return;
	}

	function isAdmin() {
		return !! (
			window.flowReviewPage && window.flowReviewPage.currentUserIsAdmin
		);
	}

	function isDismissed() {
		try {
			return (
				window.localStorage.getItem(
					'flow_ew_review_upsell_dismissed'
				) === '1'
			);
		} catch ( _err ) {
			return false;
		}
	}

	function dismiss() {
		try {
			window.localStorage.setItem( 'flow_ew_review_upsell_dismissed', '1' );
		} catch ( _err ) {
			// Privacy mode — fall through; bar still removed for this page-view.
		}
	}

	var SHADOW_CSS = [
		':host{all:initial;position:fixed;left:0;right:0;bottom:0;z-index:2147483646;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif;}',
		'.bar{box-sizing:border-box;height:40px;display:flex;align-items:center;justify-content:center;gap:12px;padding:0 48px 0 16px;background:#018170;color:#fff;font-size:13px;line-height:1.2;box-shadow:0 -2px 8px rgba(0,0,0,0.15);}',
		'.bar__text{font-weight:500;}',
		'.bar__coupon{display:inline-flex;align-items:center;gap:4px;padding:1px 6px;margin:0 2px;background:#d0f9ec;color:#09121e;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;font-weight:700;letter-spacing:0.04em;border-radius:3px;vertical-align:middle;}',
		'.bar__coupon svg{flex-shrink:0;}',
		'.bar__cta{display:inline-flex;align-items:center;height:28px;padding:0 12px;background:#fff;color:#018170;font-weight:600;font-size:13px;text-decoration:none;border-radius:4px;transition:background 0.1s ease;}',
		'.bar__cta:hover{background:#d0f9ec;}',
		'.bar__cta--ghost{background:transparent;color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.6);}',
		'.bar__cta--ghost:hover{background:rgba(255,255,255,0.15);color:#fff;}',
		'.bar__close{position:absolute;right:12px;top:50%;transform:translateY(-50%);width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;background:transparent;border:0;color:rgba(255,255,255,0.8);cursor:pointer;font-size:18px;line-height:1;border-radius:50%;}',
		'.bar__close:hover{background:rgba(255,255,255,0.15);color:#fff;}',
		// Mobile: 40px is tight, allow growth on wrap.
		'@media (max-width: 600px){.bar{height:auto;min-height:40px;flex-wrap:wrap;padding:8px 44px 8px 12px;font-size:12px;}}',
	].join( '' );

	var BAR_HEIGHT_VAR = '--flow-ew-upsell-bar-height';
	var BAR_HEIGHT_PX  = '40px';

	function setBarHeightVar() {
		document.documentElement.style.setProperty( BAR_HEIGHT_VAR, BAR_HEIGHT_PX );
	}

	function clearBarHeightVar() {
		document.documentElement.style.removeProperty( BAR_HEIGHT_VAR );
	}

	function mountBar() {
		if ( ! isAdmin() ) return;
		if ( isDismissed() ) return;
		if ( document.getElementById( 'flow-ew-review-upsell-host' ) ) return;

		setBarHeightVar();

		var host = document.createElement( 'div' );
		host.id = 'flow-ew-review-upsell-host';
		document.body.appendChild( host );

		var shadow = host.attachShadow( { mode: 'open' } );

		var styleEl = document.createElement( 'style' );
		styleEl.textContent = SHADOW_CSS;
		shadow.appendChild( styleEl );

		var bar = document.createElement( 'div' );
		bar.className = 'bar';

		var text = document.createElement( 'span' );
		text.className = 'bar__text';
		var parts = String( data.message || '' ).split( '%s' );
		text.appendChild( document.createTextNode( parts[ 0 ] || '' ) );
		if ( data.coupon ) {
			var coupon = document.createElement( 'span' );
			coupon.className = 'bar__coupon';
			// Inline SVG (not emoji) so it inherits currentColor and
			// renders identically across platforms.
			var SVG_NS = 'http://www.w3.org/2000/svg';
			var svg = document.createElementNS( SVG_NS, 'svg' );
			svg.setAttribute( 'viewBox', '0 0 24 24' );
			svg.setAttribute( 'width', '11' );
			svg.setAttribute( 'height', '11' );
			svg.setAttribute( 'fill', 'currentColor' );
			svg.setAttribute( 'aria-hidden', 'true' );
			var path = document.createElementNS( SVG_NS, 'path' );
			path.setAttribute(
				'd',
				'M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z'
			);
			svg.appendChild( path );
			coupon.appendChild( svg );
			coupon.appendChild( document.createTextNode( data.coupon ) );
			text.appendChild( coupon );
			text.appendChild(
				document.createTextNode( parts.length > 1 ? parts.slice( 1 ).join( '%s' ) : '' )
			);
		} else if ( parts.length > 1 ) {
			text.appendChild(
				document.createTextNode( parts.slice( 1 ).join( '%s' ) )
			);
		}
		bar.appendChild( text );

		var cta = document.createElement( 'a' );
		cta.className = 'bar__cta';
		cta.href = data.href;
		cta.target = '_blank';
		cta.rel = 'noopener noreferrer';
		cta.textContent = data.ctaLabel;
		bar.appendChild( cta );

		if ( data.secondaryLabel ) {
			var secondary = document.createElement( 'a' );
			secondary.className = 'bar__cta bar__cta--ghost';
			secondary.href = data.secondaryHref || data.href;
			secondary.target = '_blank';
			secondary.rel = 'noopener noreferrer';
			secondary.textContent = data.secondaryLabel;
			bar.appendChild( secondary );
		}

		var close = document.createElement( 'button' );
		close.className = 'bar__close';
		close.type = 'button';
		close.setAttribute( 'aria-label', data.dismissLabel );
		close.textContent = '×';
		close.addEventListener( 'click', function () {
			dismiss();
			clearBarHeightVar();
			host.remove();
		} );
		bar.appendChild( close );

		shadow.appendChild( bar );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', mountBar );
	} else {
		mountBar();
	}
} )();
