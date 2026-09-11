/**
 * "Unlock device selector" upsell — hooks `flow_ew_view_dropdown_extras` (the
 * slot Pro fills with its device-preview switcher). Yields to Pro when
 * present.
 */
( function () {
	'use strict';

	var data = window.flowEwUpsellDeviceSelector;
	if ( ! data || ! data.label ) {
		return;
	}

	if ( ! window.wp || ! window.wp.element || ! window.wp.components || ! window.wp.hooks ) {
		return;
	}

	var createElement = window.wp.element.createElement;
	var MenuGroup     = window.wp.components.MenuGroup;
	var MenuItem      = window.wp.components.MenuItem;

	var BADGE_STYLE = {
		display: 'inline-block',
		padding: '1px 6px',
		marginRight: '6px',
		fontSize: '9px',
		fontWeight: 600,
		letterSpacing: '0.04em',
		lineHeight: 1.4,
		borderRadius: '8px',
		background: '#d0f9ec',
		color: '#09121e',
		verticalAlign: '1px',
	};

	var LABEL_STYLE = {
		color: '#018170',
		fontWeight: 600,
	};

	var HELP_STYLE = {
		marginTop: '2px',
		color: '#757575',
		fontSize: '12px',
		lineHeight: 1.4,
		fontWeight: 400,
		whiteSpace: 'normal',
	};

	// Column wrapper so the label sits above the description inside
	// MenuItem's default single-row layout.
	var STACK_STYLE = {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'flex-start',
		padding: '2px 0',
	};

	window.wp.hooks.addFilter(
		'flow_ew_view_dropdown_extras',
		'flow-ew/upsell-device-selector',
		function ( existing ) {
			if ( existing ) {
				return existing;
			}
			return createElement(
				MenuGroup,
				null,
				createElement(
					MenuItem,
					{
						href: data.href, target: '_blank', rel: 'noopener noreferrer',
						className: 'flow-ew-upsell-device-selector',
					},
					createElement(
						'span',
						{ style: STACK_STYLE },
						createElement(
							'span',
							null,
							createElement( 'span', { style: BADGE_STYLE }, 'PRO' ),
							createElement( 'span', { style: LABEL_STYLE }, data.label )
						),
						data.helpText
							? createElement( 'span', { style: HELP_STYLE }, data.helpText )
							: null
					)
				)
			);
		}
	);
} )();
