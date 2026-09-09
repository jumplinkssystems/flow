import {
	getActiveContentRoot,
	getIframeDoc,
	resolveCommentContentRoot,
} from './iframe-bridge';
const HIGHLIGHT_CLASS = 'flow-inline-highlight';

function getContentRoot() {
	const root = getActiveContentRoot();
	if ( root ) return root;
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
		if ( ! parent ) break;

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
	if ( ! path ) return null;
	try {
		return root.querySelector( path );
	} catch {
		return null;
	}
}

function getTextNodeAtOffset( element, charOffset ) {
	const doc = element.ownerDocument || document;
	const walker = doc.createTreeWalker(
		element,
		NodeFilter.SHOW_TEXT,
		null
	);
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
		return { node: element.lastChild, offset: element.lastChild.textContent.length };
	}
	return null;
}

function getCharOffset( element, textNode, nodeOffset ) {
	const doc = element.ownerDocument || document;
	const walker = doc.createTreeWalker(
		element,
		NodeFilter.SHOW_TEXT,
		null
	);
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
	const root = getContentRootForNode( range.startContainer );
	if ( ! root || ! root.contains( range.startContainer ) ) return null;

	const startEl =
		range.startContainer.nodeType === Node.TEXT_NODE
			? range.startContainer.parentElement
			: range.startContainer;
	const endEl =
		range.endContainer.nodeType === Node.TEXT_NODE
			? range.endContainer.parentElement
			: range.endContainer;

	const doc = range.startContainer.ownerDocument || document;
	return {
		startPath: getCssPath( startEl, root ),
		startOffset: getCharOffset( startEl, range.startContainer, range.startOffset ),
		endPath: getCssPath( endEl, root ),
		endOffset: getCharOffset( endEl, range.endContainer, range.endOffset ),
		text: range.toString(),
		// Tells the wrap-time code which root to resolve paths against. 'body'
		// is the fallback used when the selection lives outside the standard
		// content roots (title, post meta, etc.); 'content' is the default
		// `.entry-content` / `.wp-block-post-content` family.
		rootType: root === doc.body ? 'body' : 'content',
	};
}

export function serializeMediaAnchor( mediaEl, labelText = '' ) {
	if ( ! mediaEl || mediaEl.nodeType !== Node.ELEMENT_NODE ) return null;
	const tag = mediaEl.tagName || '';
	if ( ! [ 'IMG', 'VIDEO', 'IFRAME' ].includes( tag ) ) return null;
	const root = getContentRootForNode( mediaEl );
	if ( ! root || ! root.contains( mediaEl ) ) return null;

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

function tryDeserializeFromPaths( descriptor, root ) {
	const startEl = resolvePathToNode( descriptor.startPath, root );
	const endEl = resolvePathToNode( descriptor.endPath, root );
	if ( ! startEl || ! endEl ) return null;

	const start = getTextNodeAtOffset( startEl, descriptor.startOffset );
	const end = getTextNodeAtOffset( endEl, descriptor.endOffset );
	if ( ! start || ! end ) return null;

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
	if ( ! text ) return null;
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
			if ( idx === -1 ) break;
			const absOffset = cumulative + idx;
			const distance = target === null ? 0 : Math.abs( absOffset - target );
			if ( distance < bestDistance ) {
				const range = doc.createRange();
				range.setStart( node, idx );
				range.setEnd( node, idx + needle.length );
				bestRange = range;
				bestDistance = distance;
				if ( distance === 0 ) return bestRange;
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
	if ( type === 'video' ) return 'video';
	if ( type === 'embed' ) return 'iframe';
	return 'img';
}

function tryDeserializeMedia( descriptor, root ) {
	if ( ! descriptor?.nodePath ) return null;

	const selector = selectorForMediaType( descriptor.type );
	let media = resolvePathToNode( descriptor.nodePath, root );
	if ( ! media && descriptor.src ) {
		const mediaNodes = root.querySelectorAll( selector );
		media = Array.from( mediaNodes ).find(
			( node ) => ( node.getAttribute( 'src' ) || '' ) === descriptor.src
		);
	}
	if ( ! media ) return null;

	const doc = root.ownerDocument || document;
	const range = doc.createRange();
	range.selectNode( media );
	return range;
}

export function resolveMediaNode( descriptor, optionalRoot ) {
	if ( ! MEDIA_TYPES.includes( descriptor?.type ) ) return null;
	const root =
		optionalRoot || getContentRootForDocument( getIframeDoc() || document );
	if ( ! root ) return null;

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

export function deserializeRange( descriptor, optionalRoot ) {
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
	if ( ! root ) return null;

	if ( isMedia ) {
		return tryDeserializeMedia( descriptor, root );
	}

	const range = tryDeserializeFromPaths( descriptor, root );
	if ( range && range.toString() === descriptor.text ) return range;

	return tryFuzzyTextSearch( descriptor, root );
}

export function wrapRange( range, commentId ) {
	if ( ! range ) return null;

	const doc = range.startContainer.ownerDocument || document;
	const mark = doc.createElement( 'mark' );
	mark.className = HIGHLIGHT_CLASS;
	mark.dataset.commentId = String( commentId );

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
