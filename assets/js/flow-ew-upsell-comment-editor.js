/**
 * "Unlock advanced editor" upsell — hooks `flow_ew_comment_editor_extras` (the
 * slot above the CommentSidebar's composer). Yields if any add-on returned
 * content first.
 */
( function () {
	'use strict';

	var data = window.flowEwUpsellCommentEditor;
	if ( ! data || ! data.label ) {
		return;
	}

	if ( ! window.wp || ! window.wp.element || ! window.wp.hooks ) {
		return;
	}

	var createElement = window.wp.element.createElement;

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

	var LINK_STYLE = {
		display: 'inline-block',
		color: '#018170',
		fontWeight: 600,
		textDecoration: 'underline',
		cursor: 'pointer',
	};

	var HELP_STYLE = {
		marginTop: '4px',
		marginBottom: 0,
		color: '#757575',
		fontSize: '12px',
		lineHeight: 1.4,
	};

	var WRAP_STYLE = {
		marginBottom: '12px',
	};

	window.wp.hooks.addFilter(
		'flow_ew_comment_editor_extras',
		'flow-ew/upsell-comment-editor',
		function ( existing ) {
			if ( existing ) {
				return existing;
			}
			return createElement(
				'div',
				{ className: 'flow-ew-upsell-comment-editor', style: WRAP_STYLE },
				createElement(
					'a',
					{ href: data.href, style: LINK_STYLE },
					createElement( 'span', { style: BADGE_STYLE }, 'PRO' ),
					data.label
				),
				data.helpText
					? createElement( 'p', { style: HELP_STYLE }, data.helpText )
					: null
			);
		}
	);
} )();
