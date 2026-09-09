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
			const len = ( el.textContent || '' ).replace( /\s+/g, ' ' ).trim().length;
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
		if ( root ) return root;
	}
	return resolveCommentContentRoot( document );
}

// Markup that identifies "this is the post" — title, byline, content, meta,
// everything editorially owned by the post. Combines semantic wrappers
// (`<article>`, `<main>`, WordPress's `post_class()` output, `id="post-N"`)
// with the canonical title/meta classes WP itself emits — those cover block
// themes / classic themes that render the title outside any wrapper.
const POST_WRAPPER_SELECTOR = [
	'article',
	'main',
	'[class~="type-post"]',
	'[class~="type-page"]',
	'[class~="type-product"]',
	'[class~="type-attachment"]',
	'[id^="post-"]',
	'.entry-title',
	'.entry-header',
	'.entry-meta',
	'.wp-block-post-title',
].join( ',' );

const POST_REGION_SELECTOR =
	'.flow-preview-content, .entry-content, .wp-block-post-content, .product.type-product';

export function resolveContentRootFor( doc, node ) {
	if ( ! doc || ! node ) return null;
	const direct = resolveCommentContentRoot( doc, node );
	if ( direct ) return direct;
	// Selection is outside the post body. Accept it if it's still inside
	// the post's wrapper — title, byline, categories, etc. — and anchor to
	// `<body>` (rootType: 'body' on the descriptor). Reject otherwise so
	// nav/footer/sidebar selections never become comments.
	const targetEl = node.nodeType === 1 ? node : node.parentElement;
	if ( targetEl && targetEl.closest( POST_WRAPPER_SELECTOR ) && doc.body ) {
		return doc.body;
	}
	const hasAnyRoot = !! doc.querySelector( POST_REGION_SELECTOR );
	if ( hasAnyRoot ) return null;
	return doc.body || null;
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
	if ( ! currentIframe ) return 1;
	const cssW = currentIframe.offsetWidth;
	if ( ! cssW ) return 1;
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
a[href] {
	cursor: text;
	-webkit-user-select: text;
	user-select: text;
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
	if ( ! iframeDoc?.head ) return;
	const style = iframeDoc.createElement( 'style' );
	style.textContent = HIGHLIGHT_CSS;
	iframeDoc.head.appendChild( style );
}
