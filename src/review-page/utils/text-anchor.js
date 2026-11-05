import { __ } from '@wordpress/i18n';
import { currentDevice } from '../../shared/device';
import { axisAnchor, pickSnapTarget } from './pin-geometry';
import {
	getActiveContentRoot,
	getIframeDoc,
	resolveCommentContentRoot,
} from './iframe-bridge';
const HIGHLIGHT_CLASS = 'flow-inline-highlight';

function getContentRoot() {
	const root = getActiveContentRoot();
	if ( root ) {
		return root;
	}
	const iframeDoc = getIframeDoc();
	return iframeDoc?.body || document.body;
}

function getContentRootForNode( node ) {
	const doc = node.ownerDocument || document;
	return resolveCommentContentRoot( doc, node ) || doc.body;
}

function getContentRootForDocument( doc ) {
	return resolveCommentContentRoot( doc ) || doc?.body;
}

function getCssPath( node, root ) {
	const parts = [];
	let current = node;

	while ( current && current !== root ) {
		if ( current.nodeType !== Node.ELEMENT_NODE ) {
			current = current.parentElement;
			continue;
		}
		const parent = current.parentElement;
		if ( ! parent ) {
			break;
		}

		const siblings = Array.from( parent.children ).filter(
			( s ) => s.tagName === current.tagName
		);
		const tag = current.tagName.toLowerCase();
		if ( siblings.length > 1 ) {
			const idx = siblings.indexOf( current ) + 1;
			parts.unshift( `${ tag }:nth-of-type(${ idx })` );
		} else {
			parts.unshift( tag );
		}
		current = parent;
	}

	return parts.join( ' > ' );
}

function resolvePathToNode( path, root ) {
	if ( ! path ) {
		return null;
	}
	try {
		return root.querySelector( path );
	} catch {
		return null;
	}
}

function getTextNodeAtOffset( element, charOffset ) {
	const doc = element.ownerDocument || document;
	const walker = doc.createTreeWalker( element, NodeFilter.SHOW_TEXT, null );
	let remaining = charOffset;
	let node = walker.nextNode();

	while ( node ) {
		if ( remaining <= node.textContent.length ) {
			return { node, offset: remaining };
		}
		remaining -= node.textContent.length;
		node = walker.nextNode();
	}

	if ( element.lastChild && element.lastChild.nodeType === Node.TEXT_NODE ) {
		return {
			node: element.lastChild,
			offset: element.lastChild.textContent.length,
		};
	}
	return null;
}

function elementOf( node ) {
	return node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
}

function nodeInEmbedOverlay( node ) {
	return !! elementOf( node )?.closest?.( '.flow-embed-overlay' );
}

// Submit and button inputs carry their label in the value, not a text node,
// so a hover selection has to select the control itself. The blue wash is
// painted on the words only; see paintButtonLabelMetrics.
const BUTTON_INPUT =
	'input[type="submit" i], input[type="button" i], input[type="reset" i], input[type="image" i]';
export const BUTTON_LABEL_MARK_CLASS = 'flow-button-label-mark';
const labelMeasureCanvas = new WeakMap();

export function isButtonInput( node ) {
	return !! node?.matches?.( BUTTON_INPUT );
}

export function buttonInputLabel( node ) {
	if ( ! isButtonInput( node ) ) {
		return '';
	}
	if ( node.matches( 'input[type="image" i]' ) ) {
		return (
			node.getAttribute( 'alt' ) ||
			node.getAttribute( 'value' ) ||
			''
		).trim();
	}
	return ( node.value || node.getAttribute( 'value' ) || '' ).trim();
}

function displayedButtonLabel( label, textTransform ) {
	if ( textTransform === 'uppercase' ) {
		return label.toUpperCase();
	}
	if ( textTransform === 'lowercase' ) {
		return label.toLowerCase();
	}
	if ( textTransform === 'capitalize' ) {
		return label.replace( /\b\w/g, ( char ) => char.toUpperCase() );
	}
	return label;
}

// ::selection cannot paint an input's value. Measure the label and expose
// its box as custom properties so the highlight CSS can cover the words
// and leave the rest of the button alone.
export function paintButtonLabelMetrics( node ) {
	clearButtonLabelMetrics( node );
	if ( ! isButtonInput( node ) || node.matches( 'input[type="image" i]' ) ) {
		return false;
	}
	const view = node.ownerDocument?.defaultView;
	const label = buttonInputLabel( node );
	if ( ! view || ! label ) {
		return false;
	}
	let canvas = labelMeasureCanvas.get( view );
	if ( ! canvas ) {
		canvas = node.ownerDocument.createElement( 'canvas' );
		labelMeasureCanvas.set( view, canvas );
	}
	const ctx = canvas.getContext( '2d' );
	if ( ! ctx ) {
		return false;
	}
	const cs = view.getComputedStyle( node );
	const text = displayedButtonLabel( label, cs.textTransform );
	ctx.font = `${ cs.fontStyle } ${ cs.fontVariant } ${ cs.fontWeight } ${ cs.fontSize } ${ cs.fontFamily }`;
	if ( 'letterSpacing' in ctx ) {
		ctx.letterSpacing = cs.letterSpacing;
	}
	const metrics = ctx.measureText( text );
	let width = metrics.width;
	const spacing = parseFloat( cs.letterSpacing );
	if (
		! ( 'letterSpacing' in ctx ) &&
		Number.isFinite( spacing ) &&
		text.length > 1
	) {
		width += spacing * ( text.length - 1 );
	}
	if ( ! ( width > 0 ) ) {
		return false;
	}
	const padL = parseFloat( cs.paddingLeft ) || 0;
	const padR = parseFloat( cs.paddingRight ) || 0;
	const inner = Math.max( 0, node.clientWidth - padL - padR );
	width = Math.min( width, inner || width );
	const align = cs.textAlign;
	const rtl = cs.direction === 'rtl';
	const onLeft =
		align === 'left' ||
		( align === 'start' && ! rtl ) ||
		( align === 'end' && rtl );
	const onRight =
		align === 'right' ||
		( align === 'end' && ! rtl ) ||
		( align === 'start' && rtl );
	let x = padL + Math.max( 0, ( inner - width ) / 2 );
	if ( onLeft ) {
		x = padL;
	} else if ( onRight ) {
		x = padL + Math.max( 0, inner - width );
	}
	const fontSize = parseFloat( cs.fontSize ) || 16;
	const glyphs =
		( metrics.actualBoundingBoxAscent || 0 ) +
		( metrics.actualBoundingBoxDescent || 0 );
	const height = Math.max( fontSize * 1.35, glyphs + 4 );
	const y = Math.max( 0, ( node.clientHeight - height ) / 2 );
	node.style.setProperty( '--flow-label-x', `${ Math.round( x ) }px` );
	node.style.setProperty( '--flow-label-y', `${ Math.round( y ) }px` );
	node.style.setProperty( '--flow-label-w', `${ Math.round( width ) }px` );
	node.style.setProperty( '--flow-label-h', `${ Math.round( height ) }px` );
	node.style.setProperty(
		'--flow-label-line',
		`${ Math.round( y + height - 2 ) }px`
	);
	node.classList.add( BUTTON_LABEL_MARK_CLASS );
	return true;
}

export function clearButtonLabelMetrics( node ) {
	if ( ! node?.style ) {
		return;
	}
	node.classList?.remove( BUTTON_LABEL_MARK_CLASS );
	for ( const name of [
		'--flow-label-x',
		'--flow-label-y',
		'--flow-label-w',
		'--flow-label-h',
		'--flow-label-line',
	] ) {
		node.style.removeProperty( name );
	}
}

function buttonInputFromRange( range ) {
	if (
		! range ||
		range.startContainer !== range.endContainer ||
		range.startContainer.nodeType !== Node.ELEMENT_NODE ||
		range.endOffset !== range.startOffset + 1
	) {
		return null;
	}
	const node = range.startContainer.childNodes[ range.startOffset ];
	return isButtonInput( node ) ? node : null;
}

// Text nodes the range covers, with the slice of each that is actually inside it.
function textSlices( range ) {
	const doc = range.startContainer?.ownerDocument || document;
	const root = range.commonAncestorContainer;
	const scope =
		root?.nodeType === Node.TEXT_NODE ? root.parentNode || root : root;
	if ( ! scope ) {
		return [];
	}
	const slices = [];
	const walker = doc.createTreeWalker( scope, NodeFilter.SHOW_TEXT, null );
	let node = walker.nextNode();
	while ( node ) {
		let hit = false;
		try {
			hit = range.intersectsNode( node );
		} catch {
			hit = false;
		}
		if ( hit ) {
			const start = node === range.startContainer ? range.startOffset : 0;
			const end =
				node === range.endContainer
					? range.endOffset
					: node.textContent.length;
			if ( end > start ) {
				slices.push( {
					node,
					start,
					end,
					overlay: nodeInEmbedOverlay( node ),
				} );
			}
		}
		node = walker.nextNode();
	}
	return slices;
}

// Selection text with the image/video overlay chrome left out. "Click to
// comment" and "Go to link" sit in the DOM over the media, so a drag across
// the photo would otherwise quote them.
function contentText( range ) {
	return textSlices( range )
		.filter( ( slice ) => ! slice.overlay )
		.map( ( slice ) =>
			slice.node.textContent.slice( slice.start, slice.end )
		)
		.join( '' );
}

// One range per run of real text, so a highlight can skip the overlay chips
// that sit between the words.
export function contentRanges( range ) {
	const doc = range?.startContainer?.ownerDocument || document;
	const ranges = [];
	let current = null;
	textSlices( range ).forEach( ( slice ) => {
		if ( slice.overlay ) {
			current = null;
			return;
		}
		if (
			current &&
			current.endContainer === slice.node &&
			current.endOffset === slice.start
		) {
			current.setEnd( slice.node, slice.end );
			return;
		}
		current = doc.createRange();
		current.setStart( slice.node, slice.start );
		current.setEnd( slice.node, slice.end );
		ranges.push( current );
	} );
	return ranges;
}

// A drag that landed on the photo quotes only the overlay. The comment
// belongs to that image (or video), not to the chips.
export function mediaForOverlaySelection( range ) {
	const root = range?.commonAncestorContainer;
	const scope = elementOf( root );
	if ( ! scope ) {
		return null;
	}
	// The whole selection sits inside one overlay: it is that photo.
	const ownOverlay = scope.closest?.( '.flow-embed-overlay' );
	const ownMedia = ownOverlay?.flowMedia;
	if (
		ownMedia &&
		[ 'IMG', 'VIDEO', 'IFRAME' ].includes( ownMedia.tagName )
	) {
		return ownMedia;
	}
	if ( ! scope.querySelectorAll ) {
		return null;
	}
	const found = new Set();
	const consider = ( el ) => {
		let hit = false;
		try {
			hit = range.intersectsNode( el );
		} catch {
			hit = false;
		}
		if ( ! hit ) {
			return;
		}
		const media = el.classList?.contains( 'flow-embed-overlay' )
			? el.flowMedia
			: el;
		if ( media && [ 'IMG', 'VIDEO', 'IFRAME' ].includes( media.tagName ) ) {
			found.add( media );
		}
	};
	scope.querySelectorAll( '.flow-embed-overlay' ).forEach( consider );
	scope.querySelectorAll( 'img, video, iframe' ).forEach( consider );
	return found.size === 1 ? found.values().next().value : null;
}

function getCharOffset( element, textNode, nodeOffset ) {
	if ( textNode === element ) {
		return Array.from( element.childNodes )
			.slice( 0, nodeOffset )
			.reduce( ( sum, child ) => sum + child.textContent.length, 0 );
	}
	const doc = element.ownerDocument || document;
	const walker = doc.createTreeWalker( element, NodeFilter.SHOW_TEXT, null );
	let offset = 0;
	let node = walker.nextNode();

	while ( node ) {
		if ( node === textNode ) {
			return offset + nodeOffset;
		}
		offset += node.textContent.length;
		node = walker.nextNode();
	}
	return offset;
}

export function serializeRange( range ) {
	const startRoot = getContentRootForNode( range.startContainer );
	const root =
		startRoot && ! startRoot.contains( range.endContainer )
			? range.startContainer.ownerDocument?.body || startRoot
			: startRoot;
	if ( ! root || ! root.contains( range.startContainer ) ) {
		return null;
	}

	const startEl =
		range.startContainer.nodeType === Node.TEXT_NODE
			? range.startContainer.parentElement
			: range.startContainer;
	const endEl =
		range.endContainer.nodeType === Node.TEXT_NODE
			? range.endContainer.parentElement
			: range.endContainer;

	const doc = range.startContainer.ownerDocument || document;
	const button = buttonInputFromRange( range );
	if ( button ) {
		const label = buttonInputLabel( button );
		if ( ! label ) {
			return null;
		}
		const descriptor = {
			type: 'control',
			nodePath: getCssPath( button, root ),
			text: label,
			rootType: root === doc.body ? 'body' : 'content',
		};
		if ( button.id ) {
			descriptor.elementId = button.id;
		}
		return descriptor;
	}
	const text = contentText( range );
	// Nothing but overlay chrome. Callers attach the image instead.
	if ( ! text.trim() ) {
		return null;
	}
	return {
		startPath: getCssPath( startEl, root ),
		startOffset: getCharOffset(
			startEl,
			range.startContainer,
			range.startOffset
		),
		endPath: getCssPath( endEl, root ),
		endOffset: getCharOffset( endEl, range.endContainer, range.endOffset ),
		text,
		// Tells the wrap-time code which root to resolve paths against. 'body'
		// is the fallback used when the selection lives outside the standard
		// content roots (title, post meta, etc.); 'content' is the default
		// `.entry-content` / `.wp-block-post-content` family.
		rootType: root === doc.body ? 'body' : 'content',
	};
}

export function serializeMediaAnchor( mediaEl, labelText = '' ) {
	if ( ! mediaEl || mediaEl.nodeType !== Node.ELEMENT_NODE ) {
		return null;
	}
	const tag = mediaEl.tagName || '';
	if ( ! [ 'IMG', 'VIDEO', 'IFRAME' ].includes( tag ) ) {
		return null;
	}
	const root = getContentRootForNode( mediaEl );
	if ( ! root || ! root.contains( mediaEl ) ) {
		return null;
	}

	const text =
		labelText ||
		mediaEl.getAttribute( 'alt' ) ||
		mediaEl.getAttribute( 'title' ) ||
		'';

	const typeMap = { IMG: 'image', VIDEO: 'video', IFRAME: 'embed' };
	const doc = mediaEl.ownerDocument || document;

	return {
		type: typeMap[ tag ],
		nodePath: getCssPath( mediaEl, root ),
		src: mediaEl.getAttribute( 'src' ) || '',
		text,
		rootType: root === doc.body ? 'body' : 'content',
	};
}

const PIN_TEXT_LIMIT = 160;
const SNAP_SCAN_LIMIT = 1500;
const SNAP_SKIP_TAGS =
	/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|BR|HR|SOURCE|TRACK|META|LINK)$/;
const SNAP_REPLACED_TAGS =
	/^(IMG|VIDEO|IFRAME|SVG|CANVAS|INPUT|BUTTON|SELECT|TEXTAREA|PICTURE)$/i;

/**
 * The element directly under the click is a container only when the click
 * missed all its children (a gap, padding or margin). Anchor to the nearest
 * block inside it instead, so the pin follows that block when the layout
 * reflows on another screen size.
 */
function snapPinTarget( target, point ) {
	const view = target.ownerDocument.defaultView || window;
	const walker = target.ownerDocument.createTreeWalker(
		target,
		NodeFilter.SHOW_ELEMENT
	);
	const candidates = [];
	let scanned = 0;
	let node = walker.nextNode();
	while ( node && scanned++ < SNAP_SCAN_LIMIT ) {
		const current = node;
		node = walker.nextNode();
		if (
			SNAP_SKIP_TAGS.test( current.tagName ) ||
			current.closest( '.flow-inline-pin, .flow-embed-overlay' )
		) {
			continue;
		}
		const rect = current.getBoundingClientRect();
		if ( ! rect.width || ! rect.height ) {
			continue;
		}
		const display = view.getComputedStyle( current ).display;
		if (
			display === 'none' ||
			display === 'contents' ||
			( display === 'inline' &&
				! SNAP_REPLACED_TAGS.test( current.tagName ) )
		) {
			continue;
		}
		candidates.push( { el: current, rect } );
	}
	if ( ! candidates.length ) {
		return target;
	}
	return (
		pickSnapTarget( { x: point.clientX, y: point.clientY }, candidates ) ||
		target
	);
}

/**
 * A pin is a click on a spot rather than a selection: the element under the
 * pointer and where inside its box the click landed. `element` is never shown
 * in the UI; it tells an AI agent what the reviewer pointed at.
 *
 * @param {Element}                        el
 * @param {{clientX:number,clientY:number}} point
 * @param {Element}                        [optionalRoot]
 */
export function serializePinAnchor( el, point, optionalRoot ) {
	let target = el?.nodeType === Node.TEXT_NODE ? el.parentElement : el;
	if ( ! target || target.nodeType !== Node.ELEMENT_NODE ) {
		return null;
	}
	const doc = target.ownerDocument || document;
	if ( target === doc.documentElement ) {
		target = doc.body;
	}
	const root =
		target === doc.body
			? doc.body
			: optionalRoot || getContentRootForNode( target );
	if ( ! root || ! root.contains( target ) ) {
		return null;
	}
	target = snapPinTarget( target, point );
	const isBody = target === doc.body;

	const rect = target.getBoundingClientRect();
	const fraction = ( value, start, size ) =>
		size > 0
			? Math.round(
					Math.min( 1, Math.max( 0, ( value - start ) / size ) ) *
						10000
			  ) / 10000
			: 0;
	const visibleText = ( target.innerText || target.textContent || '' )
		.replace( /\s+/g, ' ' )
		.trim()
		.slice( 0, PIN_TEXT_LIMIT );

	const descriptor = {
		type: 'pin',
		nodePath: isBody ? '' : getCssPath( target, root ),
		x: fraction( point.clientX, rect.left, rect.width ),
		y: fraction( point.clientY, rect.top, rect.height ),
		ax: axisAnchor( point.clientX, rect.left, rect.width ),
		ay: axisAnchor( point.clientY, rect.top, rect.height ),
		rootType: root === doc.body ? 'body' : 'content',
		text: __( 'Pinned comment', 'jumplinks-editorial-workflow' ),
		element: {
			tag: target.tagName.toLowerCase(),
			id: target.id || '',
			classes: Array.from( target.classList ).slice( 0, 5 ),
			text: visibleText,
		},
	};
	if ( target.id ) {
		descriptor.elementId = target.id;
	}
	// The spot only holds on the screen size it was placed on.
	const width = Math.round( doc.defaultView?.innerWidth || 0 );
	descriptor.viewport = { device: currentDevice(), width };
	return descriptor;
}

export function resolveControlNode( descriptor, optionalRoot ) {
	if ( descriptor?.type !== 'control' ) {
		return null;
	}
	const doc = optionalRoot?.ownerDocument || getIframeDoc() || document;
	const root =
		descriptor.rootType === 'body'
			? doc.body
			: optionalRoot || getContentRootForDocument( doc );
	if ( ! root ) {
		return null;
	}
	let el = null;
	if ( descriptor.elementId ) {
		const byId = doc.getElementById( descriptor.elementId );
		if ( byId && root.contains( byId ) ) {
			el = byId;
		}
	}
	if ( ! el && descriptor.nodePath ) {
		el = resolvePathToNode( descriptor.nodePath, root );
	}
	return isButtonInput( el ) ? el : null;
}

export function resolvePinNode( descriptor, optionalRoot ) {
	if ( descriptor?.type !== 'pin' ) {
		return null;
	}
	const doc = optionalRoot?.ownerDocument || getIframeDoc() || document;
	const root =
		descriptor.rootType === 'body'
			? doc.body
			: optionalRoot || getContentRootForDocument( doc );
	if ( ! root ) {
		return null;
	}
	if ( descriptor.elementId ) {
		const byId = doc.getElementById( descriptor.elementId );
		if ( byId && root.contains( byId ) ) {
			return byId;
		}
	}
	// No path: the click landed on the root itself (a margin of the content).
	if ( ! descriptor.nodePath ) {
		return root;
	}
	const exact = resolvePathToNode( descriptor.nodePath, root );
	if ( exact ) {
		return exact;
	}
	// A later highlight can wrap the element in a <mark>, which breaks the
	// child combinator; retry as a descendant path, same tag at the end.
	const loose = resolvePathToNode(
		descriptor.nodePath.split( ' > ' ).join( ' ' ),
		root
	);
	const lastTag = descriptor.nodePath.split( ' > ' ).pop().split( ':' )[ 0 ];
	return loose && loose.tagName.toLowerCase() === lastTag ? loose : null;
}

function tryDeserializeFromPaths( descriptor, root ) {
	const startEl = resolvePathToNode( descriptor.startPath, root );
	const endEl = resolvePathToNode( descriptor.endPath, root );
	if ( ! startEl || ! endEl ) {
		return null;
	}

	const start = getTextNodeAtOffset( startEl, descriptor.startOffset );
	const end = getTextNodeAtOffset( endEl, descriptor.endOffset );
	if ( ! start || ! end ) {
		return null;
	}

	try {
		const doc = root.ownerDocument || document;
		const range = doc.createRange();
		range.setStart( start.node, start.offset );
		range.setEnd( end.node, end.offset );
		return range;
	} catch {
		return null;
	}
}

/**
 * Locate `descriptor.text` somewhere under `root` when path-based resolution
 * failed (DOM was edited, descriptor paths drifted, etc). Previously this
 * returned the FIRST text-node match anywhere in the root — which silently
 * anchored every comment on the same word to its first occurrence when
 * path-based fell through. We now iterate ALL matches across all descendant
 * text nodes, track each match's cumulative character offset from the root,
 * and return the match whose absolute offset is closest to the saved
 * `descriptor.startOffset`. A nice property: an exact offset hit returns
 * immediately. If `startOffset` is missing (older descriptors) we still return
 * the first match — same behaviour as before for that legacy case.
 */
function tryFuzzyTextSearch( descriptor, root ) {
	const text = descriptor?.text;
	if ( ! text ) {
		return null;
	}
	const doc = root.ownerDocument || document;
	const walker = doc.createTreeWalker( root, NodeFilter.SHOW_TEXT, null );
	const needle = text.trim();
	const target = Number.isFinite( descriptor?.startOffset )
		? Number( descriptor.startOffset )
		: null;

	let cumulative = 0;
	let bestRange = null;
	let bestDistance = Infinity;

	let node = walker.nextNode();
	while ( node ) {
		const content = node.textContent;
		let searchFrom = 0;
		while ( true ) {
			const idx = content.indexOf( needle, searchFrom );
			if ( idx === -1 ) {
				break;
			}
			const absOffset = cumulative + idx;
			const distance =
				target === null ? 0 : Math.abs( absOffset - target );
			if ( distance < bestDistance ) {
				const range = doc.createRange();
				range.setStart( node, idx );
				range.setEnd( node, idx + needle.length );
				bestRange = range;
				bestDistance = distance;
				if ( distance === 0 ) {
					return bestRange;
				}
			}
			if ( target === null ) {
				// No offset → first-match wins, original behaviour.
				return bestRange;
			}
			searchFrom = idx + 1;
		}
		cumulative += content.length;
		node = walker.nextNode();
	}
	return bestRange;
}

const MEDIA_TYPES = [ 'image', 'video', 'embed' ];

function selectorForMediaType( type ) {
	if ( type === 'video' ) {
		return 'video';
	}
	if ( type === 'embed' ) {
		return 'iframe';
	}
	return 'img';
}

function tryDeserializeMedia( descriptor, root ) {
	if ( ! descriptor?.nodePath ) {
		return null;
	}

	const selector = selectorForMediaType( descriptor.type );
	let media = resolvePathToNode( descriptor.nodePath, root );
	if ( ! media && descriptor.src ) {
		const mediaNodes = root.querySelectorAll( selector );
		media = Array.from( mediaNodes ).find(
			( node ) => ( node.getAttribute( 'src' ) || '' ) === descriptor.src
		);
	}
	if ( ! media ) {
		return null;
	}

	const doc = root.ownerDocument || document;
	const range = doc.createRange();
	range.selectNode( media );
	return range;
}

export function resolveMediaNode( descriptor, optionalRoot ) {
	if ( ! MEDIA_TYPES.includes( descriptor?.type ) ) {
		return null;
	}
	const root =
		optionalRoot || getContentRootForDocument( getIframeDoc() || document );
	if ( ! root ) {
		return null;
	}

	const selector = selectorForMediaType( descriptor.type );
	let media = resolvePathToNode( descriptor.nodePath, root );
	if ( media?.tagName?.toLowerCase() !== selector ) {
		media = null;
	}
	if ( ! media && descriptor.src ) {
		const mediaNodes = root.querySelectorAll( selector );
		media = Array.from( mediaNodes ).find(
			( node ) => ( node.getAttribute( 'src' ) || '' ) === descriptor.src
		);
	}
	return media || null;
}

/**
 * @param {Object}      descriptor
 * @param {Element}      [optionalRoot]
 * @param {{exact?: boolean}} [matchInfo]
 *   Optional out-param. When a range is returned, callers that care whether
 *   it came from an exact path+text match versus a same-element fuzzy text
 *   search (content shifted since the comment was saved) can read
 *   `matchInfo.exact` afterwards. Unset for pin/media descriptors, where
 *   resolution is a direct element lookup rather than a text search.
 */
export function deserializeRange( descriptor, optionalRoot, matchInfo ) {
	if ( descriptor?.type === 'pin' ) {
		const el = resolvePinNode( descriptor, optionalRoot );
		if ( ! el ) {
			return null;
		}
		const range = ( el.ownerDocument || document ).createRange();
		range.selectNode( el );
		return range;
	}
	if ( descriptor?.type === 'control' ) {
		const el = resolveControlNode( descriptor, optionalRoot );
		if ( ! el ) {
			return null;
		}
		const range = ( el.ownerDocument || document ).createRange();
		range.selectNode( el );
		if ( matchInfo ) {
			const label = buttonInputLabel( el );
			matchInfo.exact =
				! descriptor.text || label === String( descriptor.text ).trim();
		}
		return range;
	}
	const isMedia = MEDIA_TYPES.includes( descriptor?.type );
	let root =
		optionalRoot ||
		( isMedia
			? getContentRootForDocument( getIframeDoc() || document )
			: getContentRoot() );
	if ( descriptor?.rootType === 'body' ) {
		const doc = root?.ownerDocument || getIframeDoc() || document;
		root = doc?.body || root;
	}
	if ( ! root ) {
		return null;
	}

	if ( isMedia ) {
		return tryDeserializeMedia( descriptor, root );
	}

	const range = tryDeserializeFromPaths( descriptor, root );
	// contentText drops overlay chips, so a drag across a photo still matches
	// the saved quote after those labels are left out of it.
	if (
		range &&
		( range.toString() === descriptor.text ||
			contentText( range ) === descriptor.text )
	) {
		if ( matchInfo ) {
			matchInfo.exact = true;
		}
		return range;
	}

	if ( matchInfo ) {
		matchInfo.exact = false;
	}

	// Look again only inside the element the comment was on: the same word in
	// another section is a different spot, so the comment reads as outdated instead.
	if ( descriptor?.startPath ) {
		const scope = resolvePathToNode( descriptor.startPath, root );
		return scope ? tryFuzzyTextSearch( descriptor, scope ) : null;
	}
	return tryFuzzyTextSearch( descriptor, root );
}

export function wrapRange( range, commentId ) {
	if ( ! range ) {
		return null;
	}

	const doc = range.startContainer.ownerDocument || document;
	const mark = doc.createElement( 'mark' );
	mark.className = HIGHLIGHT_CLASS;
	mark.dataset.commentId = String( commentId );

	// The overlay's own labels must never wear the comment highlight.
	if ( textSlices( range ).some( ( slice ) => slice.overlay ) ) {
		const marks = wrapRangeAcrossNodes( range, commentId );
		return marks.length ? marks[ 0 ] : null;
	}

	try {
		range.surroundContents( mark );
		return mark;
	} catch {
		const marks = wrapRangeAcrossNodes( range, commentId );
		return marks.length ? marks[ 0 ] : null;
	}
}

/**
 * Wrap each text node's portion of the range with its own <mark>. Used when
 * the range spans element boundaries (multiple block-level elements or mixed
 * inline + block). Returns the array of created marks.
 */
function wrapRangeAcrossNodes( range, commentId ) {
	const doc = range.startContainer.ownerDocument || document;
	const root = range.commonAncestorContainer;
	const created = [];

	// Collect text nodes that intersect the range, snapshot up front so DOM
	// mutations during wrapping don't invalidate the iteration.
	const textNodes = [];
	const walker = doc.createTreeWalker(
		root.nodeType === Node.TEXT_NODE ? root.parentNode || root : root,
		NodeFilter.SHOW_TEXT,
		null
	);
	let node = walker.nextNode();
	while ( node ) {
		if ( range.intersectsNode && range.intersectsNode( node ) ) {
			textNodes.push( node );
		}
		node = walker.nextNode();
	}
	if ( root.nodeType === Node.TEXT_NODE && range.intersectsNode( root ) ) {
		textNodes.push( root );
	}

	for ( const textNode of textNodes ) {
		if ( nodeInEmbedOverlay( textNode ) ) {
			continue;
		}
		const startOffset =
			textNode === range.startContainer ? range.startOffset : 0;
		const endOffset =
			textNode === range.endContainer
				? range.endOffset
				: textNode.textContent.length;
		if ( startOffset >= endOffset ) {
			continue;
		}
		const subRange = doc.createRange();
		try {
			subRange.setStart( textNode, startOffset );
			subRange.setEnd( textNode, endOffset );
			const mark = doc.createElement( 'mark' );
			mark.className = HIGHLIGHT_CLASS;
			mark.dataset.commentId = String( commentId );
			subRange.surroundContents( mark );
			created.push( mark );
		} catch {
			// Skip nodes that can't be wrapped (e.g. detached during wrapping)
		}
	}

	return created;
}

export function clearHighlight( commentId ) {
	const selector = `.${ HIGHLIGHT_CLASS }[data-comment-id="${ commentId }"]`;
	const marks = [ ...document.querySelectorAll( selector ) ];
	const iframeDoc = getIframeDoc();
	if ( iframeDoc ) {
		marks.push( ...iframeDoc.querySelectorAll( selector ) );
	}
	marks.forEach( ( mark ) => {
		const parent = mark.parentNode;
		while ( mark.firstChild ) {
			parent.insertBefore( mark.firstChild, mark );
		}
		parent.removeChild( mark );
		parent.normalize();
	} );
}
