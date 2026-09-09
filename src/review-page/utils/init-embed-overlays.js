/**
 * Add a "Click to comment" / "View comment" overlay over media in the review
 * page (iframes, images, videos). Gives users a consistent hover affordance
 * and, for embed iframes, prevents the cross-origin player from intercepting
 * clicks (which would play the video instead of opening the popover). The
 * review page's post-preview content lives inside a content iframe
 * (`#flow-template-frame`) created by ReviewBar. We scan THAT iframe's
 * contentDocument, not the main document — the only iframe in the main
 * document body is the content iframe itself, which we must never wrap. Each
 * media element gets wrapped in a `<span class="flow-embed-wrap">` that
 * matches its box exactly, plus an absolute-positioned `<span
 * class="flow-embed-overlay">` covering it. Iframes additionally get
 * `pointer-events: none` so YouTube/Vimeo can't capture the click first; for
 * img/video we skip that since their built-in click behavior is benign. The
 * InlineCommentPopover and highlight-manager click handlers resolve the
 * overlay back to its media sibling (img/video/iframe) when handling clicks.
 */
import { __ } from '@wordpress/i18n';
import { resolveCommentContentRoot, getIframeDoc } from './iframe-bridge';

const WRAPPED_FLAG = 'flowEmbedWrapped';

// CSS injected into the content iframe (where embeds live). The outer
// review-page stylesheet doesn't reach into iframe documents.
const OVERLAY_CSS = `
.flow-embed-wrap {
	display: inline-block;
	line-height: 0;
	max-width: 100%;
	position: relative;
	vertical-align: top;
}
.flow-embed-wrap > iframe {
	display: block;
	max-width: 100%;
}
.flow-embed-overlay {
	align-items: center;
	background: transparent;
	border: 0;
	cursor: pointer;
	display: flex;
	inset: 0;
	justify-content: center;
	position: absolute;
	transition: background-color 0.15s ease;
	z-index: 2;
}
.flow-embed-overlay:hover,
.flow-embed-overlay:focus-visible {
	background: rgba(0, 0, 0, 0.25);
}
.flow-embed-overlay:hover .flow-embed-overlay__hint,
.flow-embed-overlay:focus-visible .flow-embed-overlay__hint {
	opacity: 1;
}
.flow-embed-overlay:focus-visible {
	outline: 2px solid #2271b1;
	outline-offset: -2px;
}
.flow-embed-overlay__hint {
	background: rgba(0, 0, 0, 0.7);
	border-radius: 4px;
	color: #ffffff;
	font: 500 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	opacity: 0;
	padding: 8px 14px;
	pointer-events: none;
	transition: opacity 0.15s ease;
}
/* Secondary corner pill — shared style between the "Play" affordance (for
   video media) and the "Go to link" affordance (for images wrapped in a
   link on site review). Sized to roughly match the centered comment hint
   so the two affordances feel like peers. !important on positioning
   properties defends against theme button-styling rules that would
   otherwise override right/top/etc. and yank the pill out of the
   overlay's top-right corner. */
.flow-embed-overlay__play-pill,
.flow-embed-overlay__link-pill {
	align-items: center;
	background: rgba(0, 0, 0, 0.75);
	border: 0;
	border-radius: 4px;
	color: #ffffff;
	cursor: pointer;
	display: inline-flex;
	font: 500 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	gap: 8px;
	opacity: 0;
	padding: 8px 14px;
	pointer-events: auto;
	position: absolute !important;
	right: 8px !important;
	top: 8px !important;
	left: auto !important;
	bottom: auto !important;
	margin: 0 !important;
	transform: none !important;
	transition: background-color 0.15s ease, opacity 0.15s ease;
}
.flow-embed-overlay:hover .flow-embed-overlay__play-pill,
.flow-embed-overlay:focus-within .flow-embed-overlay__play-pill,
.flow-embed-overlay:hover .flow-embed-overlay__link-pill,
.flow-embed-overlay:focus-within .flow-embed-overlay__link-pill {
	opacity: 1;
}
.flow-embed-overlay__play-pill:hover,
.flow-embed-overlay__play-pill:focus-visible,
.flow-embed-overlay__link-pill:hover,
.flow-embed-overlay__link-pill:focus-visible {
	background: rgba(0, 0, 0, 0.92);
	outline: 0;
}
.flow-embed-overlay__play-pill svg,
.flow-embed-overlay__link-pill svg {
	display: block;
}
/* Persistent comment pin shown only after Play has been activated. Sits in
   the top-right so the reviewer can still drop a comment while the native
   player is in charge. */
.flow-embed-overlay__comment-pin {
	align-items: center;
	background: rgba(0, 0, 0, 0.75);
	border-radius: 50%;
	color: #ffffff;
	cursor: pointer;
	display: none;
	height: 36px;
	justify-content: center;
	pointer-events: auto;
	position: absolute;
	right: 8px;
	top: 8px;
	transition: background-color 0.15s ease;
	width: 36px;
}
.flow-embed-overlay__comment-pin:hover,
.flow-embed-overlay__comment-pin:focus-visible {
	background: rgba(0, 0, 0, 0.92);
	outline: 0;
}
.flow-embed-overlay__comment-pin svg {
	display: block;
}
/* Playing state: overlay backs off so the native player takes clicks, but
   the corner comment pin remains interactive. */
.flow-embed-overlay.is-playing {
	pointer-events: none;
}
.flow-embed-overlay.is-playing:hover,
.flow-embed-overlay.is-playing:focus-visible {
	background: transparent;
}
.flow-embed-overlay.is-playing .flow-embed-overlay__hint,
.flow-embed-overlay.is-playing .flow-embed-overlay__play-pill {
	display: none;
}
.flow-embed-overlay.is-playing .flow-embed-overlay__comment-pin {
	display: inline-flex;
}
/* Highlight ring renders as an inset outline on the overlay (sibling of the
   commented media). Same selector for both layouts (wrapped + positioned)
   so every kind of media gets the same look — no parent-overflow clipping
   issues since the outline is inside the overlay's own box. */
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
`;

function injectOverlayStyles( doc ) {
	if ( ! doc?.head ) {
		return;
	}
	if ( doc.querySelector( '#flow-embed-overlay-styles' ) ) {
		return;
	}
	const style = doc.createElement( 'style' );
	style.id = 'flow-embed-overlay-styles';
	style.textContent = OVERLAY_CSS;
	doc.head.appendChild( style );
}

// IDs of iframes the plugin itself injects — never wrap these.
const SKIP_IDS = new Set( [
	'flow-template-frame',
	'wp-auth-check-frame',
] );

const HINT_DEFAULT = 'Click to comment';
const HINT_HAS_COMMENT = 'View comment';
const HIGHLIGHT_CLASS = 'flow-inline-highlight-media';

// Iframe sources we recognise as video players. Matched against the iframe
// `src` to decide whether to render a Play affordance — generic iframes
// (forms, embeds, gists, etc.) get the comment-only overlay as before.
const VIDEO_IFRAME_HOST_RE = /(?:youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com|player\.vimeo\.com|dailymotion\.com|wistia\.com|wistia\.net|fast\.wistia\.net|twitch\.tv|player\.twitch\.tv|video\.wordpress\.com|videopress\.com|loom\.com|brightcove\.net|tiktok\.com|fb\.watch|facebook\.com\/plugins\/video)/i;

function isVideoMedia( media ) {
	if ( media.tagName === 'VIDEO' ) {
		return true;
	}
	if ( media.tagName === 'IFRAME' ) {
		const src =
			media.getAttribute( 'src' ) ||
			media.getAttribute( 'data-src' ) ||
			'';
		return VIDEO_IFRAME_HOST_RE.test( src );
	}
	return false;
}

const PLAY_SVG =
	'<svg width="12" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21"/></svg>';
const COMMENT_SVG =
	'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
const LINK_SVG =
	'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

/**
 * True when the overlay module is running inside the site-review chrome.
 * The chrome's bootstrap localizes `window.flowSiteReview` before any
 * bundle runs; the per-post review path never sets it. Used to decide
 * whether to render the "Go to link" affordance on images wrapped in
 * anchor tags — site-review reviewers browse the live site, so the link
 * guard is off there and a default click on a linked image would
 * otherwise yank them away from the comment they were trying to leave.
 */
function isSiteReviewMode() {
	return (
		typeof window !== 'undefined' &&
		!! (
			window.flowSiteReview &&
			typeof window.flowSiteReview === 'object'
		)
	);
}

/**
 * Build the "Go to link" pill button. Extracted so we can call it from
 * `createOverlay` at initial render AND from the post-`load` recheck for
 * lazy-loaded images whose `<a>` ancestor wasn't observable at scan time
 * (some lazy-load libraries swap the wrapper element when the image
 * actually loads).
 */
function buildLinkPill( doc, href, target ) {
	const link = doc.createElement( 'button' );
	link.type = 'button';
	link.className = 'flow-embed-overlay__link-pill';
	link.setAttribute(
		'aria-label',
		__( 'Go to link', 'jumplinks-editorial-workflow' )
	);
	link.innerHTML =
		LINK_SVG +
		'<span>' +
		__( 'Go to link', 'jumplinks-editorial-workflow' ) +
		'</span>';
	link.addEventListener( 'click', ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		const win = doc.defaultView;
		if ( ! win ) {
			return;
		}
		// Respect target="_blank" — open in a new tab — otherwise navigate
		// the iframe in place (the site-review chrome picks up the new
		// page via `flow:iframe-ready`).
		if ( '_blank' === target ) {
			win.open( href, '_blank' );
		} else {
			win.location.assign( href );
		}
	} );
	return link;
}

/**
 * Idempotent install of the "swallow the default link follow but let the
 * click bubble so the comment popover still opens" handler. Marked with a
 * dataset flag so re-calling on lazy-loaded images doesn't pile up
 * duplicate listeners.
 *
 * Uses capture + stopPropagation so theme document bubble listeners
 * (custom video lightboxes, etc.) cannot open a popin over the comment UI.
 * InlineCommentPopover listens in capture on `document` and runs first.
 */
function ensureLinkClickBlocker( overlay ) {
	if ( overlay.dataset.flowLinkBlockerInstalled === '1' ) {
		return;
	}
	overlay.dataset.flowLinkBlockerInstalled = '1';
	overlay.addEventListener(
		'click',
		( e ) => {
			if (
				e.target.closest?.(
					'.flow-embed-overlay__play-pill, .flow-embed-overlay__link-pill'
				)
			) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
		},
		true
	);
}

function createOverlay( doc, opts = {} ) {
	const overlay = doc.createElement( 'span' );
	overlay.className = 'flow-embed-overlay';
	overlay.setAttribute( 'role', 'button' );
	overlay.setAttribute( 'aria-label', 'Click to leave a comment on this embed' );
	overlay.tabIndex = 0;

	const hint = doc.createElement( 'span' );
	hint.className = 'flow-embed-overlay__hint';
	hint.textContent = HINT_DEFAULT;
	overlay.appendChild( hint );

	if ( opts.isVideo ) {
		const play = doc.createElement( 'button' );
		play.type = 'button';
		play.className = 'flow-embed-overlay__play-pill';
		play.setAttribute(
			'aria-label',
			__( 'Play video', 'jumplinks-editorial-workflow' )
		);
		play.innerHTML =
			PLAY_SVG +
			'<span>' +
			__( 'Play', 'jumplinks-editorial-workflow' ) +
			'</span>';
		play.addEventListener( 'click', ( e ) => {
			// Don't let the click bubble to the overlay surface — that would
			// open the comment popover instead of starting playback.
			e.preventDefault();
			e.stopPropagation();
			activatePlayMode( overlay );
		} );
		overlay.appendChild( play );

		// Persistent comment affordance for the playing state — the overlay
		// itself becomes non-blocking once Play is hit, so the reviewer needs
		// a dedicated target to re-engage commenting mid-playback. Clicks
		// here bubble normally; the existing document-level handler resolves
		// the click via `closest('.flow-embed-overlay')`.
		const pin = doc.createElement( 'span' );
		pin.className = 'flow-embed-overlay__comment-pin';
		pin.setAttribute( 'role', 'button' );
		pin.setAttribute( 'aria-label', 'Click to leave a comment on this video' );
		pin.tabIndex = 0;
		pin.innerHTML = COMMENT_SVG;
		pin.addEventListener( 'keydown', ( e ) => {
			if ( e.key === 'Enter' || e.key === ' ' ) {
				e.preventDefault();
				pin.click();
			}
		} );
		overlay.appendChild( pin );
	}

	if ( opts.linkHref ) {
		overlay.appendChild(
			buildLinkPill( doc, opts.linkHref, opts.linkTarget || '' )
		);
	}

	overlay.addEventListener( 'keydown', ( e ) => {
		if ( e.key === 'Enter' || e.key === ' ' ) {
			e.preventDefault();
			overlay.click();
		}
	} );

	return overlay;
}

/**
 * Hand the underlying media over to its native player. For `<video>` we kick
 * playback ourselves; for iframes we drop the pointer-events guard so the
 * embedded player handles clicks, and best-effort add `autoplay=1` for
 * providers that honor it (YouTube/Vimeo/Wistia/Twitch all do). Some hosts
 * will trigger a reload to apply the query param — acceptable trade for a
 * one-click experience on the common case.
 */
function activatePlayMode( overlay ) {
	overlay.classList.add( 'is-playing' );
	const media = overlay.flowMedia;
	if ( ! media ) {
		return;
	}
	if ( media.tagName === 'VIDEO' ) {
		try {
			const result = media.play();
			if ( result && typeof result.catch === 'function' ) {
				result.catch( () => {} );
			}
		} catch ( _err ) {
			// Older browsers may throw synchronously when playback can't
			// start — the native controls remain accessible regardless.
		}
		return;
	}
	if ( media.tagName === 'IFRAME' ) {
		media.style.pointerEvents = '';
		const src = media.getAttribute( 'src' ) || '';
		if ( src && ! /[?&]autoplay=1\b/.test( src ) ) {
			const sep = src.includes( '?' ) ? '&' : '?';
			media.setAttribute( 'src', src + sep + 'autoplay=1' );
		}
	}
}

function updateHintForIframe( iframe, overlay ) {
	const hint = overlay?.querySelector( '.flow-embed-overlay__hint' );
	if ( ! hint ) {
		return;
	}
	const hasComment = iframe.classList.contains( HIGHLIGHT_CLASS );
	hint.textContent = hasComment ? HINT_HAS_COMMENT : HINT_DEFAULT;
	overlay.setAttribute(
		'aria-label',
		hasComment
			? 'View existing comment on this embed'
			: 'Click to leave a comment on this embed'
	);
}

function watchHighlightChanges( iframe, overlay ) {
	updateHintForIframe( iframe, overlay );
	const obs = new MutationObserver( () => {
		updateHintForIframe( iframe, overlay );
	} );
	obs.observe( iframe, { attributes: true, attributeFilter: [ 'class' ] } );
	return obs;
}

function wrapMedia( media ) {
	if ( media.dataset[ WRAPPED_FLAG ] ) {
		return;
	}
	if ( SKIP_IDS.has( media.id ) ) {
		return;
	}
	const tag = media.tagName;
	const isIframe = tag === 'IFRAME';

	const w = media.getAttribute( 'width' );
	const h = media.getAttribute( 'height' );
	if ( w === '0' || h === '0' || w === '1' || h === '1' ) {
		return;
	}

	if ( tag === 'IMG' && media.classList.contains( 'emoji' ) ) {
		return;
	}
	if ( media.getAttribute( 'aria-hidden' ) === 'true' ) {
		return;
	}
	if ( media.hasAttribute( 'data-no-flow-overlay' ) ) {
		return;
	}
	if ( isIframe ) {
		const src = media.getAttribute( 'src' ) || '';
		if ( /\/recaptcha\//i.test( src ) || media.title === 'reCAPTCHA' ) {
			return;
		}
	}

	const doc = media.ownerDocument;
	const view = doc.defaultView;
	const parent = media.parentNode;
	if ( ! parent || ! view ) {
		return;
	}

	const cs0 = view.getComputedStyle( media );
	if ( cs0.display === 'none' || cs0.visibility === 'hidden' ) {
		return;
	}
	if ( media.offsetWidth === 0 && media.offsetHeight === 0 ) {
		return;
	}

	media.dataset[ WRAPPED_FLAG ] = '1';

	const cs = view.getComputedStyle( media );
	const isPositioned = cs.position === 'absolute' || cs.position === 'fixed';

	// Image-in-link detection (site-review only). On the per-post review
	// chrome the link guard intercepts navigation globally, so this is
	// strictly a site-review concern.
	const linkAncestor =
		tag === 'IMG' && isSiteReviewMode()
			? media.closest( 'a[href]' )
			: null;
	const linkHref = linkAncestor
		? ( linkAncestor.getAttribute( 'href' ) || '' ).trim()
		: '';
	const linkTarget = linkAncestor
		? linkAncestor.getAttribute( 'target' ) || ''
		: '';

	const overlay = createOverlay( doc, {
		isVideo: isVideoMedia( media ),
		linkHref: linkHref || null,
		linkTarget: linkTarget || null,
	} );
	overlay.flowMedia = media;

	// Always isolate overlay surface clicks from theme lightbox / video-modal
	// scripts. Link pills and play pills opt out inside the handler.
	ensureLinkClickBlocker( overlay );

	// Lazy-loaded images sometimes don't have a usable `<a>` ancestor at
	// scan time: native `loading="lazy"` is OK, but some lazy-load
	// libraries (LiteSpeed, Jetpack image lazy-loader, etc.) swap the
	// surrounding markup when the image actually loads. Re-check on the
	// `load` event and retro-fit the link pill + click blocker if a link
	// ancestor only became visible then. Idempotent — guarded against
	// double-installation via dataset flags.
	if ( tag === 'IMG' && isSiteReviewMode() && ! media.complete ) {
		media.addEventListener(
			'load',
			() => {
				if ( overlay.querySelector( '.flow-embed-overlay__link-pill' ) ) {
					return;
				}
				const a = media.closest( 'a[href]' );
				if ( ! a ) {
					return;
				}
				const href = ( a.getAttribute( 'href' ) || '' ).trim();
				if ( ! href ) {
					return;
				}
				const target = a.getAttribute( 'target' ) || '';
				overlay.appendChild( buildLinkPill( doc, href, target ) );
				ensureLinkClickBlocker( overlay );
			},
			{ once: true }
		);
	}

	if ( isIframe ) {
		media.style.pointerEvents = 'none';

		if ( isPositioned ) {
			// E.g. embed blocks place the iframe `position: absolute; inset: 0;`
			overlay.classList.add( 'flow-embed-overlay--positioned' );
			media.dataset.flowPositioned = '1';
			overlay.style.position = cs.position;
			overlay.style.top = '0';
			overlay.style.right = '0';
			overlay.style.bottom = '0';
			overlay.style.left = '0';
			parent.appendChild( overlay );
		} else {
			const wrap = doc.createElement( 'span' );
			wrap.className = 'flow-embed-wrap';
			parent.insertBefore( wrap, media );
			wrap.appendChild( media );
			wrap.appendChild( overlay );
		}
	} else if (
		tag === 'IMG' &&
		parent.children.length === 1 &&
		parent.firstElementChild === media &&
		parent instanceof view.HTMLElement
	) {
		// Snug parent: the image is the parent's only child (Elementor's
		// `.elementor-post__thumbnail`, theme card thumbnails, image-in-
		// link patterns). The parent's box already matches the image, so
		// no JS positioning is needed — `inset: 0` from the base overlay
		// class does the right thing, and the overlay automatically tracks
		// any layout change the theme applies to the parent. Just ensure
		// the parent is a containing block.
		const parentCs = view.getComputedStyle( parent );
		if ( parentCs.position === 'static' ) {
			parent.style.position = 'relative';
			parent.dataset.flowPositionedByFlow = '1';
		}
		overlay.classList.add( 'flow-embed-overlay--snug' );
		parent.appendChild( overlay );
	} else {
		// img / video in a non-snug parent (paragraph with text siblings,
		// figure with caption, etc.): fall back to JS-driven positioning.
		// Wrapping the image in a span is avoided because page-builders
		// sometimes look for the image as a direct child of their
		// container.
		attachFloatingOverlay( media, overlay, parent, view );
	}

	watchHighlightChanges( media, overlay );
}

/**
 * Drop the overlay as a sibling and dynamically size it to match the media's
 * box. Resilient to layout changes (responsive image resizes, late-loading
 * dimensions, etc.) via ResizeObserver. Sets `position: relative` on the
 * parent if it's static so the overlay's `position: absolute` resolves
 * against the right containing block.
 *
 * @param {HTMLElement} media
 * @param {HTMLElement} overlay
 * @param {Node}        parent
 * @param {Window}      view
 */
function attachFloatingOverlay( media, overlay, parent, view ) {
	if ( ! ( parent instanceof view.HTMLElement ) ) {
		// Document fragment, ShadowRoot, etc — fall back to the previous
		// wrap behaviour rather than try to mutate something we don't own.
		const wrap = media.ownerDocument.createElement( 'span' );
		wrap.className = 'flow-embed-wrap';
		parent.insertBefore( wrap, media );
		wrap.appendChild( media );
		wrap.appendChild( overlay );
		return;
	}

	overlay.classList.add( 'flow-embed-overlay--floating' );
	// !important on the overlay's position so theme rules can't accidentally
	// reset it to `static` — that would knock the pill's containing block
	// up to the next positioned ancestor and yank it out of the corner.
	overlay.style.setProperty( 'position', 'absolute', 'important' );

	const parentCs = view.getComputedStyle( parent );
	if ( parentCs.position === 'static' ) {
		parent.style.position = 'relative';
		parent.dataset.flowPositionedByFlow = '1';
	}

	// getBoundingClientRect is robust where offsetLeft/Top isn't: themes that
	// place images in flex/grid cells, `<picture>` elements, or wrappers with
	// unusual borders all confuse the offset-based math. We compute the
	// media-to-parent delta off bounding rects and then back out parent's
	// border so the result is in the same coordinate system position:absolute
	// uses (i.e. parent's padding edge).
	const reposition = () => {
		const mr = media.getBoundingClientRect();
		const pr = parent.getBoundingClientRect();
		const pcs = view.getComputedStyle( parent );
		const bl = parseFloat( pcs.borderLeftWidth ) || 0;
		const bt = parseFloat( pcs.borderTopWidth ) || 0;
		overlay.style.left = ( mr.left - pr.left - bl ) + 'px';
		overlay.style.top = ( mr.top - pr.top - bt ) + 'px';
		overlay.style.width = mr.width + 'px';
		overlay.style.height = mr.height + 'px';
	};
	reposition();
	parent.appendChild( overlay );

	// Hover-time recompute is the primary signal — by the time the
	// reviewer is hovering, layout has fully settled and the user is
	// about to SEE the overlay state, so this is the right moment to
	// reposition. Listening on both media and overlay covers the case
	// where the overlay is misplaced enough that the cursor hits the
	// media first.
	media.addEventListener( 'pointerenter', reposition );
	overlay.addEventListener( 'pointerenter', reposition );

	// ResizeObserver as an event-based safety net for the case where the
	// image resizes WITHOUT a hover trigger — e.g. theme grid JS
	// equalising card heights, viewport reflow, late CSS settling.
	// Event-based (not polled), fires only when the box actually changes.
	if ( typeof view.ResizeObserver === 'function' ) {
		const ro = new view.ResizeObserver( reposition );
		ro.observe( media );
		ro.observe( parent );
	}

	// Image hasn't loaded yet — dimensions arrive asynchronously. One
	// reposition on load keeps the overlay aligned even before any hover.
	if ( media.tagName === 'IMG' ) {
		media.addEventListener( 'load', reposition );
	}
}

const MEDIA_SELECTOR = 'iframe, img, video';

function scanRoot( root ) {
	if ( ! root || ! root.querySelectorAll ) {
		return;
	}
	root.querySelectorAll( MEDIA_SELECTOR ).forEach( wrapMedia );
}

let observer = null;
let lateLoadHandler = null;
let lateLoadRoot = null;

export function attachToDoc( doc ) {
	if ( ! doc ) {
		return;
	}
	const root =
		resolveCommentContentRoot( doc ) || doc.body || doc.documentElement;
	if ( ! root ) {
		return;
	}
	injectOverlayStyles( doc );
	scanRoot( root );

	if ( observer ) {
		observer.disconnect();
	}
	observer = new MutationObserver( ( mutations ) => {
		for ( const m of mutations ) {
			for ( const node of m.addedNodes ) {
				if ( node.nodeType !== 1 ) continue;
				const tag = node.tagName;
				if ( tag === 'IFRAME' || tag === 'IMG' || tag === 'VIDEO' ) {
					wrapMedia( node );
				} else if ( node.querySelectorAll ) {
					node.querySelectorAll( MEDIA_SELECTOR ).forEach(
						wrapMedia
					);
				}
			}
		}
	} );
	observer.observe( root, { childList: true, subtree: true } );

	// Lazy-loaded images (native `loading="lazy"` below the fold, or themes
	// that swap `data-src` → `src` via JS) are 0×0 at initial scan and get
	// skipped. Retry wrapping when their `load` event fires — by then they
	// have real dimensions. `load` doesn't bubble, so we listen in the
	// capture phase off the scan root.
	if ( lateLoadHandler && lateLoadRoot ) {
		lateLoadRoot.removeEventListener( 'load', lateLoadHandler, true );
	}
	lateLoadHandler = ( e ) => {
		const t = e.target;
		if ( ! t || t.tagName !== 'IMG' ) {
			return;
		}
		if ( t.dataset[ WRAPPED_FLAG ] ) {
			return;
		}
		wrapMedia( t );
	};
	lateLoadRoot = root;
	root.addEventListener( 'load', lateLoadHandler, true );
}

export function initEmbedOverlays() {
	// The post-preview content lives inside #flow-template-frame, which
	// ReviewBar creates asynchronously. Hook the ready event to scan it.
	const onIframeReady = ( e ) => {
		const iframe = e?.detail?.iframe;
		if ( ! iframe ) return;
		// Defer until contentDocument is fully populated.
		const handle = () => attachToDoc( iframe.contentDocument );
		if (
			iframe.contentDocument &&
			iframe.contentDocument.readyState === 'complete'
		) {
			handle();
		} else {
			iframe.addEventListener( 'load', handle, { once: true } );
		}
	};
	window.addEventListener( 'flow:iframe-ready', onIframeReady );

	// If the iframe is already up by the time we run, attach immediately.
	const existing = getIframeDoc();
	if ( existing ) {
		attachToDoc( existing );
	}

	const detach = () => {
		if ( observer ) {
			observer.disconnect();
			observer = null;
		}
		if ( lateLoadHandler && lateLoadRoot ) {
			lateLoadRoot.removeEventListener(
				'load',
				lateLoadHandler,
				true
			);
			lateLoadHandler = null;
			lateLoadRoot = null;
		}
	};
	window.addEventListener( 'flow:iframe-removed', detach );

	return () => {
		window.removeEventListener( 'flow:iframe-ready', onIframeReady );
		window.removeEventListener( 'flow:iframe-removed', detach );
		detach();
	};
}
