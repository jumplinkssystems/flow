/**
 * Shared markup for the Free "Unlock …" upsell nodes (Gutenberg element and
 * plain DOM). Loaded before flow-ew-upsell-open-review.js and
 * flow-ew-upsell-reviewer.js, which only decide where and when to show it.
 */
( function () {
	'use strict';

	const LINK = {
		display: 'inline-block',
		color: '#018170',
		fontSize: '13px',
		fontWeight: 600,
		lineHeight: 1.4,
		textDecoration: 'underline',
		cursor: 'pointer',
	};
	const BADGE = {
		display: 'inline-block',
		padding: '1px 6px',
		marginRight: '4px',
		fontSize: '9px',
		fontWeight: 600,
		letterSpacing: '0.04em',
		lineHeight: 1.4,
		borderRadius: '8px',
		background: '#d0f9ec',
		color: '#09121e',
		verticalAlign: '1px',
	};
	const HELP = {
		marginTop: '4px',
		color: '#757575',
		fontSize: '12px',
		lineHeight: 1.4,
	};

	function assign( target, source ) {
		for ( const key in source ) {
			if ( Object.prototype.hasOwnProperty.call( source, key ) ) {
				target[ key ] = source[ key ];
			}
		}
		return target;
	}

	function cssText( styles ) {
		const out = [];
		for ( const key in styles ) {
			if ( Object.prototype.hasOwnProperty.call( styles, key ) ) {
				out.push(
					key.replace( /[A-Z]/g, function ( m ) {
						return '-' + m.toLowerCase();
					} ) +
						':' +
						styles[ key ]
				);
			}
		}
		return out.join( ';' );
	}

	window.flowEwUpsellLib = {
		/**
		 * @param {{href:string,label:string,helpText?:string}} data
		 * @param {{className:string,linkMarginTop:string}} opts
		 */
		buildNode( data, opts ) {
			const wrap = document.createElement( 'div' );
			wrap.className = opts.className;

			const a = document.createElement( 'a' );
			a.href = data.href;
			a.target = '_blank';
			a.rel = 'noopener noreferrer';
			a.style.cssText = cssText(
				assign( { marginTop: opts.linkMarginTop }, LINK )
			);

			const badge = document.createElement( 'span' );
			badge.style.cssText = cssText( BADGE );
			badge.textContent = 'PRO';
			a.appendChild( badge );
			a.appendChild( document.createTextNode( data.label ) );
			wrap.appendChild( a );

			if ( data.helpText ) {
				const help = document.createElement( 'p' );
				help.style.cssText = cssText( HELP );
				help.textContent = data.helpText;
				wrap.appendChild( help );
			}
			return wrap;
		},

		/**
		 * @param {Function} createElement wp.element.createElement
		 * @param {{href:string,label:string,helpText?:string}} data
		 * @param {{className:string,linkMarginTop:string,wrapStyle?:Object}} opts
		 */
		gutenbergNode( createElement, data, opts ) {
			return createElement(
				'div',
				assign(
					{ className: opts.className },
					opts.wrapStyle ? { style: opts.wrapStyle } : {}
				),
				createElement(
					'a',
					{
						href: data.href,
						target: '_blank',
						rel: 'noopener noreferrer',
						style: assign(
							{ marginTop: opts.linkMarginTop },
							LINK
						),
					},
					createElement( 'span', { style: BADGE }, 'PRO' ),
					data.label
				),
				data.helpText
					? createElement( 'p', { style: HELP }, data.helpText )
					: null
			);
		},
	};
} )();
