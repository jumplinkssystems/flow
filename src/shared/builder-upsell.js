import { syncBuilderReviewerUpsell } from './sync-builder-reviewer-upsell';
import { getConfig } from './config';

const INLINE_LINK = {
	display: 'inline-block',
	padding: '0',
	height: 'auto',
	background: 'transparent',
	color: '#018170',
	'font-size': '13px',
	'font-weight': '600',
	'line-height': '1.4',
	'text-decoration': 'underline',
	cursor: 'pointer',
	'text-transform': 'none',
	'letter-spacing': 'normal',
};
const INLINE_BADGE = {
	display: 'inline-block',
	padding: '1px 6px',
	'margin-right': '4px',
	'font-size': '9px',
	'font-weight': '600',
	'letter-spacing': '0.04em',
	'line-height': '1.4',
	'border-radius': '8px',
	background: '#d0f9ec',
	color: '#09121e',
	'vertical-align': '1px',
	'text-transform': 'uppercase',
};
const INLINE_HELP = {
	'margin-top': '4px',
	'margin-bottom': '0',
	color: '#9aa4ad',
	'font-size': '12px',
	'font-weight': '400',
	'line-height': '1.4',
	'text-transform': 'none',
	'letter-spacing': 'normal',
};

function important( el, styles ) {
	Object.keys( styles ).forEach( function ( prop ) {
		el.style.setProperty( prop, styles[ prop ], 'important' );
	} );
}

/**
 * @param {{ href: string, label: string, helpText?: string }} data
 * @param {{ className: string, builder: string, type: string, linkMarginTop: string, inline?: boolean }} opts
 *   `inline` writes !important styles for builders (Avada) whose CSS otherwise
 *   restyles every link and paragraph inside the drawer.
 */
export function buildUpsellNode( data, opts ) {
	const { className, builder, type, linkMarginTop, inline = false } = opts;
	const wrap = document.createElement( 'div' );
	wrap.className = className;
	wrap.setAttribute( 'data-flow-ew-' + builder + '-upsell', '1' );
	wrap.setAttribute( 'data-flow-ew-' + builder + '-upsell-' + type, '1' );

	const link = document.createElement( 'a' );
	link.href = data.href || '#';
	link.style.marginTop = linkMarginTop;

	const badge = document.createElement( 'span' );
	badge.className = 'flow-ew-upsell-badge';
	badge.textContent = 'PRO';
	link.appendChild( badge );
	link.appendChild( document.createTextNode( data.label ) );
	wrap.appendChild( link );

	let help = null;
	if ( data.helpText ) {
		help = document.createElement( 'p' );
		help.className = 'flow-ew-upsell-help';
		help.textContent = data.helpText;
		wrap.appendChild( help );
	}

	if ( inline ) {
		important( wrap, {
			'font-size': '13px',
			'line-height': '1.4',
			padding: '0',
		} );
		important( link, INLINE_LINK );
		link.style.setProperty( 'margin-top', linkMarginTop, 'important' );
		important( badge, INLINE_BADGE );
		if ( help ) {
			important( help, INLINE_HELP );
		}
	}

	return wrap;
}

/**
 * Upsell copy is printed as data attributes on the drawer by the panel template.
 *
 * @param {HTMLElement|null} panel
 * @param {'open'|'reviewer'} type
 */
export function getFallbackUpsellData( panel, type ) {
	if ( ! panel || panel.dataset.flowEwUpsellEnabled !== '1' ) {
		return null;
	}
	const href = panel.dataset.flowEwUpsellHref || '';
	if ( ! href ) {
		return null;
	}
	const label =
		type === 'open'
			? panel.dataset.flowEwUpsellOpenLabel || ''
			: panel.dataset.flowEwUpsellReviewerLabel || '';
	if ( ! label ) {
		return null;
	}
	return {
		href,
		label,
		helpText:
			type === 'open'
				? panel.dataset.flowEwUpsellOpenHelp || ''
				: panel.dataset.flowEwUpsellReviewerHelp || '',
	};
}

/**
 * Keep the Free "Unlock public reviews" / "Unlock multiple reviewers" nodes in
 * sync with the current review inside a builder drawer.
 *
 * @param {{ root: HTMLElement|null, review: object|null|undefined, builder: string, inline?: boolean }} opts
 */
export function syncFreeUpsells( opts ) {
	const { root, review, builder, inline = false } = opts;
	if ( ! root ) {
		return;
	}

	const openData =
		window.flowEwUpsell || getFallbackUpsellData( root, 'open' );
	if ( openData && openData.label ) {
		root.querySelectorAll( '.flow-ew-open-review-extras' ).forEach(
			function ( slot ) {
				let node = slot.querySelector( '.flow-ew-upsell-open-review' );
				if ( ! node ) {
					node = buildUpsellNode( openData, {
						className: 'flow-ew-upsell-open-review',
						builder,
						type: 'open',
						linkMarginTop: '6px',
						inline,
					} );
					slot.appendChild( node );
				}
				const isOpen = !! ( review && review.is_open );
				node.style.display = isOpen ? '' : 'none';
			}
		);
	}

	const reviewerData =
		window.flowEwUpsellReviewer ||
		getFallbackUpsellData( root, 'reviewer' );
	if ( ! reviewerData || ! reviewerData.label ) {
		return;
	}
	syncBuilderReviewerUpsell( {
		root,
		review,
		data: reviewerData,
		className: 'flow-ew-upsell-reviewer',
		markerAttr: 'data-flow-ew-' + builder + '-upsell-reviewer',
		buildNode( data, className ) {
			return buildUpsellNode( data, {
				className,
				builder,
				type: 'reviewer',
				linkMarginTop: '14px',
				inline,
			} );
		},
	} );
	const reviewerSelect = root.querySelector( '#flow-ew-reviewer-select' );
	if ( reviewerSelect && ! reviewerSelect.dataset.flowEwUpsellBound ) {
		reviewerSelect.dataset.flowEwUpsellBound = '1';
		reviewerSelect.addEventListener( 'change', function () {
			syncFreeUpsells( {
				root,
				review: getConfig().activeReview || review,
				builder,
				inline,
			} );
		} );
	}
}
