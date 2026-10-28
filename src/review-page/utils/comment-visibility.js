import { getIframeDoc } from './iframe-bridge';

export const COMMENTS_HIDDEN_CLASS = 'flow-comments-hidden';
export const RESOLVED_HIDDEN_CLASS = 'flow-resolved-hidden';
const STORAGE_KEY = 'flowEwHideInlineComments';
const RESOLVED_STORAGE_KEY = 'flowEwHideResolvedComments';

function readFlag( key ) {
	try {
		return window.localStorage.getItem( key ) === '1';
	} catch {
		return false;
	}
}

function writeFlag( key, on ) {
	try {
		if ( on ) {
			window.localStorage.setItem( key, '1' );
		} else {
			window.localStorage.removeItem( key );
		}
	} catch {}
}

let hidden = readFlag( STORAGE_KEY );
let resolvedHidden = readFlag( RESOLVED_STORAGE_KEY );

export function areInlineCommentsHidden() {
	return hidden;
}

export function areResolvedCommentsHidden() {
	return resolvedHidden;
}

export function applyInlineCommentsVisibility( doc = getIframeDoc() ) {
	doc?.documentElement?.classList.toggle( COMMENTS_HIDDEN_CLASS, hidden );
	doc?.documentElement?.classList.toggle(
		RESOLVED_HIDDEN_CLASS,
		resolvedHidden
	);
}

export function setInlineCommentsHidden( next ) {
	hidden = !! next;
	writeFlag( STORAGE_KEY, hidden );
	applyInlineCommentsVisibility();
}

export function setResolvedCommentsHidden( next ) {
	resolvedHidden = !! next;
	writeFlag( RESOLVED_STORAGE_KEY, resolvedHidden );
	applyInlineCommentsVisibility();
}
