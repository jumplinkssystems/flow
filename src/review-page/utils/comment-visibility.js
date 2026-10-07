import { getIframeDoc } from './iframe-bridge';

export const COMMENTS_HIDDEN_CLASS = 'flow-comments-hidden';
const STORAGE_KEY = 'flowEwHideInlineComments';

let hidden = false;
try {
	hidden = window.localStorage.getItem( STORAGE_KEY ) === '1';
} catch {}

export function areInlineCommentsHidden() {
	return hidden;
}

export function applyInlineCommentsVisibility( doc = getIframeDoc() ) {
	doc?.documentElement?.classList.toggle( COMMENTS_HIDDEN_CLASS, hidden );
}

export function setInlineCommentsHidden( next ) {
	hidden = !! next;
	try {
		if ( hidden ) {
			window.localStorage.setItem( STORAGE_KEY, '1' );
		} else {
			window.localStorage.removeItem( STORAGE_KEY );
		}
	} catch {}
	applyInlineCommentsVisibility();
}
