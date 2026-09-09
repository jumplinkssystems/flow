/**
 * Prompt email invitees for a display name on first comment.
 * Runs from Free's comment API so it works whether or not Pro's anonymous
 * middleware is loaded, and whether the visitor is also logged into WP.
 */
import { createRoot } from '@wordpress/element';
import flowFetch, { pageData } from './api';
import AnonymousNamePrompt from '../components/AnonymousNamePrompt';

const STORAGE_NAME = 'flow_ew_anon_name';

const SHADOW_CSS = `
:host {
	all: initial;
	display: block;
	position: fixed;
	inset: 0;
	z-index: 100002;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans,
		Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
	font-size: 13px;
	line-height: 1.4;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	color: #1e1e1e;
}
*, *::before, *::after { box-sizing: border-box; }

.flow-ew-pro-anon-prompt__overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.4);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16px;
	animation: flow-ew-pro-fade-in 120ms ease-out;
}
@keyframes flow-ew-pro-fade-in {
	from { opacity: 0; }
	to   { opacity: 1; }
}

.flow-ew-pro-anon-prompt__dialog {
	background: #fff;
	border-radius: 4px;
	box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
	width: 100%;
	max-width: 384px;
	max-height: calc(100vh - 32px);
	overflow: auto;
	animation: flow-ew-pro-pop-in 140ms ease-out;
}
@keyframes flow-ew-pro-pop-in {
	from { opacity: 0; transform: translateY(-4px); }
	to   { opacity: 1; transform: translateY(0); }
}

.flow-ew-pro-anon-prompt__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 16px 16px 0;
}
.flow-ew-pro-anon-prompt__title {
	margin: 0;
	font-size: 14px;
	font-weight: 600;
	line-height: 1.4;
	color: #1e1e1e;
}
.flow-ew-pro-anon-prompt__close {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	margin: -8px -8px -8px 0;
	padding: 0;
	background: transparent;
	border: 0;
	border-radius: 2px;
	color: #1e1e1e;
	cursor: pointer;
}
.flow-ew-pro-anon-prompt__close:hover { background: #f0f0f0; }
.flow-ew-pro-anon-prompt__close:focus-visible {
	outline: 2px solid var(--wp-admin-theme-color, #007cba);
	outline-offset: -2px;
}

.flow-ew-pro-anon-prompt__body {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
}

.flow-ew-pro-anon-prompt__lead {
	margin: 0;
	font-size: 13px;
	line-height: 1.5;
	color: #1e1e1e;
}

.flow-ew-pro-anon-prompt__field {
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.flow-ew-pro-anon-prompt__label {
	font-size: 11px;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0;
	color: #1e1e1e;
}
.flow-ew-pro-anon-prompt__input {
	width: 100%;
	height: 40px;
	padding: 0 12px;
	font-family: inherit;
	font-size: 13px;
	line-height: 40px;
	color: #1e1e1e;
	background: #fff;
	border: 1px solid #949494;
	border-radius: 2px;
	outline: 0;
	box-shadow: none;
	-webkit-appearance: none;
	appearance: none;
}
.flow-ew-pro-anon-prompt__input:focus {
	border-color: var(--wp-admin-theme-color, #007cba);
	box-shadow: 0 0 0 1px var(--wp-admin-theme-color, #007cba);
}
.flow-ew-pro-anon-prompt__input:disabled {
	background: #f0f0f1;
	color: #50575e;
	border-color: #dcdcde;
	box-shadow: none;
}
.flow-ew-pro-anon-prompt__help {
	font-size: 12px;
	line-height: 1.4;
	color: #757575;
}

.flow-ew-pro-anon-prompt__actions {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 4px;
}
.flow-ew-pro-anon-prompt__btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 0;
	height: 40px;
	padding: 0 12px;
	font-family: inherit;
	font-size: 13px;
	font-weight: 500;
	line-height: 1;
	color: #1e1e1e;
	background: transparent;
	border: 1px solid transparent;
	border-radius: 2px;
	cursor: pointer;
	box-shadow: none;
	transition: background 0.1s ease, border-color 0.1s ease, color 0.1s ease;
}
.flow-ew-pro-anon-prompt__btn:focus-visible {
	outline: 2px solid var(--wp-admin-theme-color, #007cba);
	outline-offset: 2px;
}

.flow-ew-pro-anon-prompt__btn--tertiary {
	color: var(--wp-admin-theme-color, #007cba);
}
.flow-ew-pro-anon-prompt__btn--tertiary:hover:not(:disabled) {
	color: var(--wp-admin-theme-color-darker-10, #006ba1);
	box-shadow: inset 0 0 0 1px currentColor;
}

.flow-ew-pro-anon-prompt__btn--primary {
	color: #fff;
	background: var(--wp-admin-theme-color, #007cba);
	border-color: var(--wp-admin-theme-color, #007cba);
}
.flow-ew-pro-anon-prompt__btn--primary:hover:not(:disabled) {
	background: var(--wp-admin-theme-color-darker-10, #006ba1);
	border-color: var(--wp-admin-theme-color-darker-10, #006ba1);
	color: #fff;
}
.flow-ew-pro-anon-prompt__btn--primary:disabled {
	background: #dcdcde;
	border-color: #dcdcde;
	color: #a7aaad;
	cursor: not-allowed;
}
`;

function readStoredName() {
	try {
		return window.localStorage.getItem( STORAGE_NAME ) || '';
	} catch ( _err ) {
		return '';
	}
}

function writeStoredName( name ) {
	try {
		window.localStorage.setItem( STORAGE_NAME, name || '' );
	} catch ( _err ) {
		// ignore
	}
}

function needsInviteDisplayName() {
	if ( ! pageData?.isEmailInvitee ) {
		return false;
	}
	// Only a real display name counts — currentUserName falls back to the email.
	return ! String( pageData.inviteDisplayName || '' ).trim();
}

function persistInviteDisplayName( name ) {
	const email = String( pageData.inviteEmail || '' ).trim();
	const reviewId = Number( pageData.reviewId || 0 );
	pageData.inviteDisplayName = name || '';
	pageData.currentUserName = name || email;
	writeStoredName( name );
	if ( reviewId <= 0 ) {
		return;
	}
	flowFetch( `reviews/${ reviewId }/invite-identity`, {
		method: 'POST',
		data: { name: name || '' },
	} ).catch( () => {} );
}

function promptForInviteName() {
	const email = String( pageData.inviteEmail || '' ).trim();
	const initialName = String(
		pageData.inviteDisplayName || readStoredName() || ''
	).trim();

	return new Promise( ( resolve, reject ) => {
		const host = document.createElement( 'div' );
		host.id = 'flow-ew-invite-name-prompt-host';
		document.body.appendChild( host );
		const shadow = host.attachShadow( { mode: 'open' } );
		const style = document.createElement( 'style' );
		style.textContent = SHADOW_CSS;
		shadow.appendChild( style );
		const mount = document.createElement( 'div' );
		shadow.appendChild( mount );
		const root = createRoot( mount );

		const cleanup = () => {
			try {
				root.unmount();
			} catch ( _err ) {
				// ignore
			}
			host.remove();
		};

		root.render(
			<AnonymousNamePrompt
				initialName={ initialName }
				initialEmail={ email }
				lockedEmail={ email }
				onSubmit={ ( data ) => {
					persistInviteDisplayName( data.name );
					cleanup();
					resolve( data.name );
				} }
				onCancel={ () => {
					cleanup();
					reject( new Error( 'cancelled' ) );
				} }
			/>
		);
	} );
}

/**
 * Ensure the email invitee has chosen a display name before posting a comment.
 * Throws if the prompt is cancelled so the comment is not sent.
 */
export async function ensureInviteCommentIdentity() {
	if ( ! needsInviteDisplayName() ) {
		return;
	}
	await promptForInviteName();
}
