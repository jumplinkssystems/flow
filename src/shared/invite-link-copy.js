/**
 * Copy control for an external reviewer's magic link, for the Classic editor,
 * every builder drawer, and the Pro multi-reviewer rows. Gutenberg has its own
 * React version in `sidebar/components/InviteLinkCopy.js`.
 *
 * The link is fetched rather than rendered into the page: the review payload
 * also feeds webhooks, and a live entry token must not travel off-site. It is
 * fetched when the button appears, not on click, so the clipboard write stays
 * inside the user gesture — Safari rejects a write that happens after an await.
 */

import { shareBarIconHtml } from './share-bar-icons';

const FREE_SELECTOR = '.flow-ew-reviewer-combobox__copy';
const PRO_SELECTOR = '.flow-ew-reviewer-card__copy';
const CLICK_SELECTOR = FREE_SELECTOR + ',' + PRO_SELECTOR;
const BOUND_FLAG = 'flowEwInviteCopyBound';

function config() {
	return ( typeof window !== 'undefined' && window.flowEW ) || {};
}

function copyLabel() {
	const { i18n } = config();
	return ( i18n && i18n.copyInviteLink ) || 'Copy invite link';
}

function copiedLabel() {
	const { i18n } = config();
	return ( i18n && i18n.copied ) || 'Copied!';
}

function hasEmailReviewer( review ) {
	if ( ! review ) {
		return false;
	}
	if ( review.invite_email ) {
		return true;
	}
	if ( review.reviewer && review.reviewer.is_email ) {
		return true;
	}
	return !! (
		Array.isArray( review.email_invites ) && review.email_invites.length > 0
	);
}

/** Sent yet? Before that there is nothing for the reviewer to open. */
function isSent( review ) {
	const status = review ? String( review.status || '' ) : '';
	return '' !== status && 'pending' !== status;
}

/**
 * Fetch one invite link into a button and reveal it.
 *
 * @param {HTMLElement}           button
 * @param {object|null|undefined} review
 * @param {string}                [email] Which invite. Omit for the single Free
 *                                        invite; Pro passes one per reviewer.
 */
export function prepareInviteCopyButton( button, review, email ) {
	if ( ! button ) {
		return;
	}

	const reviewId = review ? Number( review.id || 0 ) : 0;
	if ( ! reviewId || ! isSent( review ) ) {
		button.hidden = true;
		delete button.dataset.url;
		delete button.dataset.inviteKey;
		return;
	}

	button.setAttribute( 'aria-label', copyLabel() );
	button.setAttribute( 'title', copyLabel() );

	// Cached per review and address — the token stays valid for its lifetime.
	const key = reviewId + ':' + ( email || '' );
	if ( button.dataset.url && button.dataset.inviteKey === key ) {
		button.hidden = false;
		return;
	}

	const { restUrl, nonce } = config();
	if ( ! restUrl ) {
		return;
	}

	button.dataset.inviteKey = key;
	const query = email ? '?email=' + encodeURIComponent( email ) : '';
	fetch( restUrl + '/reviews/' + reviewId + '/invite-link' + query, {
		method: 'GET',
		credentials: 'same-origin',
		headers: { 'X-WP-Nonce': nonce || '' },
	} )
		.then( ( res ) => ( res.ok ? res.json() : null ) )
		.then( ( data ) => {
			if ( data && data.url ) {
				button.dataset.url = data.url;
				button.hidden = false;
			} else {
				button.hidden = true;
			}
		} )
		.catch( () => {
			button.hidden = true;
		} );
}

/**
 * Free combobox path: one invite, one button inside the reviewer field.
 *
 * @param {object|null|undefined} review
 * @param {ParentNode}            [scope=document]
 */
export function syncInviteLinkCopy( review, scope ) {
	const root = scope || document;
	const button =
		( root.querySelector && root.querySelector( FREE_SELECTOR ) ) ||
		document.querySelector( FREE_SELECTOR );
	if ( ! button ) {
		return;
	}
	if ( ! hasEmailReviewer( review ) ) {
		button.hidden = true;
		delete button.dataset.url;
		delete button.dataset.inviteKey;
		return;
	}
	prepareInviteCopyButton( button, review );
}

/**
 * Delegated click handler. Bound once per document however many surfaces call
 * it, since builders can mount several drawers over one page life.
 */
export function bindInviteLinkCopy() {
	if ( typeof document === 'undefined' || document.body[ BOUND_FLAG ] ) {
		return;
	}
	document.body[ BOUND_FLAG ] = true;

	// `fullRender()` is the canonical "review changed" hook and every builder
	// already listens to it. Sending for review flips the status without
	// touching the combobox, so without this the button would not appear until
	// the next reviewer edit.
	document.addEventListener( 'flow-ew:classic-render', function ( event ) {
		syncInviteLinkCopy( event && event.detail ? event.detail.review : null );
	} );

	document.addEventListener( 'click', function ( event ) {
		const button =
			event.target.closest && event.target.closest( CLICK_SELECTOR );
		if ( ! button || ! button.dataset.url ) {
			return;
		}
		event.preventDefault();

		const doneClass = button.classList.contains( 'flow-ew-reviewer-card__copy' )
			? 'flow-ew-reviewer-card__copy--done'
			: 'flow-ew-reviewer-combobox__copy--done';

		navigator.clipboard.writeText( button.dataset.url ).then( () => {
			button.innerHTML = shareBarIconHtml( 'copied' );
			button.classList.add( doneClass );
			button.setAttribute( 'aria-label', copiedLabel() );
			button.setAttribute( 'title', copiedLabel() );
			setTimeout( () => {
				button.innerHTML = shareBarIconHtml( 'copy' );
				button.classList.remove( doneClass );
				button.setAttribute( 'aria-label', copyLabel() );
				button.setAttribute( 'title', copyLabel() );
			}, 2000 );
		} );
	} );
}
