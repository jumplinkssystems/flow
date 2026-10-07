let currentIframe = null;

export function resolveCommentContentRoot( doc, containedNode = null ) {
	if ( ! doc?.querySelector ) {
		return null;
	}
	const preview = doc.querySelector( '.flow-preview-content' );
	if (
		preview &&
		( containedNode === null || preview.contains( containedNode ) )
	) {
		return preview;
	}

	const pickLongest = ( scope ) => {
		if ( ! scope?.querySelectorAll ) {
			return null;
		}
		const candidates = scope.querySelectorAll(
			'.entry-content, .wp-block-post-content, .product.type-product'
		);
		let best = null;
		let bestLen = -1;
		for ( const el of candidates ) {
			if ( containedNode !== null && ! el.contains( containedNode ) ) {
				continue;
			}
			const len = ( el.textContent || '' )
				.replace( /\s+/g, ' ' )
				.trim().length;
			if ( len > bestLen ) {
				bestLen = len;
				best = el;
			}
		}
		return best;
	};

	return (
		pickLongest( doc.querySelector( 'main' ) ) ||
		pickLongest( doc.querySelector( 'article' ) ) ||
		pickLongest( doc.body )
	);
}

export function setIframe( iframe ) {
	currentIframe = iframe;
}

export function clearIframe() {
	currentIframe = null;
}

export function getIframe() {
	return currentIframe;
}

export function getIframeDoc() {
	try {
		return currentIframe?.contentDocument || null;
	} catch {
		return null;
	}
}

export function getActiveContentRoot() {
	const iframeDoc = getIframeDoc();
	if ( iframeDoc ) {
		const root = resolveCommentContentRoot( iframeDoc );
		if ( root ) {
			return root;
		}
	}
	return resolveCommentContentRoot( document );
}

export function resolveContentRootFor( doc, node ) {
	if ( ! doc || ! node ) {
		return null;
	}
	return resolveCommentContentRoot( doc, node ) || doc.body || null;
}

/**
 * Current visual scale of the content iframe. ReviewBar applies `transform:
 * scale(s)` so the iframe's CSS width can stay at the full browser width
 * (content renders at a desktop viewport) while visually fitting the area
 * beside the sidebar. Anywhere we map a coordinate from inside the iframe to
 * the parent document needs to multiply by this factor. Derived from
 * `boundingRect.width / offsetWidth` rather than a stored value so we always
 * read the current state — no risk of using a stale scale if resize /
 * sidebar-toggle handlers haven't run yet.
 */
export function getIframeScale() {
	if ( ! currentIframe ) {
		return 1;
	}
	const cssW = currentIframe.offsetWidth;
	if ( ! cssW ) {
		return 1;
	}
	const visualW = currentIframe.getBoundingClientRect().width;
	return visualW / cssW;
}

export function rectToPageCoords( rect, inIframe ) {
	if ( ! inIframe || ! currentIframe ) {
		return {
			top: rect.top + window.scrollY,
			bottom: rect.bottom + window.scrollY,
			left: rect.left + window.scrollX,
			width: rect.width,
			height: rect.height,
		};
	}
	const iframeRect = currentIframe.getBoundingClientRect();
	const s = getIframeScale();
	return {
		top: rect.top * s + iframeRect.top + window.scrollY,
		bottom: rect.bottom * s + iframeRect.top + window.scrollY,
		left: rect.left * s + iframeRect.left + window.scrollX,
		width: rect.width * s,
		height: rect.height * s,
	};
}

const HIGHLIGHT_CSS = `
.flow-inline-highlight {
	/* Highlights are <mark>s; keep the page's text colour, not the UA black. */
	color: inherit;
	background: rgba(255, 212, 59, 0.35);
	/* box-shadow underline — same visual as border-bottom but doesn't push
	   the line box, so wrapping text doesn't reflow when a highlight lands. */
	box-shadow: inset 0 -2px 0 rgba(255, 183, 0, 0.6);
	cursor: pointer;
	border-radius: 2px;
	transition: background 0.2s ease, box-shadow 0.2s ease;
}
.flow-inline-highlight:hover {
	background: rgba(255, 212, 59, 0.55);
}
.flow-inline-highlight--active {
	background: rgba(255, 183, 0, 0.55);
	box-shadow: inset 0 -2px 0 #e69500;
}
.flow-inline-highlight--resolved {
	background: rgba(130, 214, 142, 0.3);
	box-shadow: inset 0 -2px 0 rgba(130, 214, 142, 0.5);
}
.flow-inline-highlight--resolved:hover {
	background: rgba(130, 214, 142, 0.45);
}
img.flow-inline-highlight-media,
video.flow-inline-highlight-media,
iframe.flow-inline-highlight-media {
	cursor: pointer;
}
.flow-inline-highlight-media ~ .flow-embed-overlay {
	outline: 3px solid rgba(255, 183, 0, 0.75);
	outline-offset: -3px;
}
.flow-inline-highlight-media.flow-inline-highlight--active ~ .flow-embed-overlay {
	outline-color: #e69500;
}
.flow-inline-highlight-media.flow-inline-highlight--resolved ~ .flow-embed-overlay {
	outline-color: rgba(130, 214, 142, 0.8);
}
/* Pins: comments dropped on a spot. The tip of the pin sits on the point. */
.flow-inline-pin {
	all: initial;
	position: absolute;
	z-index: 2147483000;
	display: block;
	width: 34px;
	height: 42px;
	margin: 0;
	padding: 0;
	border: 0;
	background: transparent;
	line-height: 0;
	cursor: pointer;
	transform: translate(-50%, -100%);
	transition: filter 0.2s ease;
}
.flow-inline-pin svg {
	display: block;
	width: 34px;
	height: 42px;
	filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
}
.flow-inline-pin__body {
	fill: #ffd43b;
	stroke: #e69500;
	stroke-width: 1;
}
.flow-inline-pin__dot {
	fill: #e69500;
}
.flow-inline-pin:hover .flow-inline-pin__body {
	fill: #ffc300;
}
.flow-inline-pin.flow-inline-highlight--active {
	filter: drop-shadow(0 0 4px rgba(230, 149, 0, 0.9));
}
.flow-inline-pin.flow-inline-highlight--resolved .flow-inline-pin__body {
	fill: #82d68e;
	stroke: #458037;
}
.flow-inline-pin.flow-inline-highlight--resolved .flow-inline-pin__dot {
	fill: #458037;
}
.flow-inline-pin--offer {
	pointer-events: none;
	opacity: 0.85;
}
html.flow-comments-hidden .flow-inline-highlight:not(.flow-inline-highlight--revealed) {
	background: none;
	box-shadow: none;
	cursor: inherit;
}
html.flow-comments-hidden .flow-inline-highlight-media:not(.flow-inline-highlight--revealed) {
	cursor: inherit;
}
html.flow-comments-hidden .flow-inline-highlight-media:not(.flow-inline-highlight--revealed) ~ .flow-embed-overlay {
	outline: none;
}
html.flow-comments-hidden .flow-inline-pin:not(.flow-inline-pin--offer):not(.flow-inline-highlight--revealed) {
	display: none;
}
a[href] {
	cursor: text;
	-webkit-user-select: text;
	user-select: text;
	-webkit-user-drag: none;
}
html.flow-clickable-links a[href] {
	cursor: pointer;
}
/* Elementor's decorative overlay/shape layers sit absolutely positioned over
 * section content and intercept mouse drags, so text-selection never reaches
 * the heading/paragraphs underneath. Make them inert on the review page —
 * visual rendering is unaffected. */
.elementor-background-overlay,
.elementor-shape {
	pointer-events: none;
}
`;

export function injectHighlightStyles( iframeDoc ) {
	if (
		! iframeDoc?.head ||
		iframeDoc.head.querySelector( 'style[data-flow-highlight-styles]' )
	) {
		return;
	}
	const style = iframeDoc.createElement( 'style' );
	style.dataset.flowHighlightStyles = '1';
	style.textContent = HIGHLIGHT_CSS;
	iframeDoc.head.appendChild( style );
}
