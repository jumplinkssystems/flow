/** Persistence for the "Self review only" editor notice. */
const DISMISS_KEY = 'flow_ew_dismiss_solo_notice';

export const SOLO_NOTICE_DISMISS_VALUE = 'solo-mode';

export function isSoloNoticeDismissed() {
	try {
		return window.localStorage.getItem( DISMISS_KEY ) === '1';
	} catch ( _err ) {
		return false;
	}
}

export function dismissSoloNotice() {
	try {
		window.localStorage.setItem( DISMISS_KEY, '1' );
	} catch ( _err ) {
		// ignore
	}
}
