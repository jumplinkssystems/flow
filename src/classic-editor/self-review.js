import {
	SOLO_NOTICE_DISMISS_VALUE,
	dismissSoloNotice,
	isSoloNoticeDismissed,
} from '../shared/solo-mode-notice';

const SOLO_NOTICE = `.flow-ew-review-notice[data-flow-ew-dismiss="${ SOLO_NOTICE_DISMISS_VALUE }"]`;

// Builder drawers render the panel late, so reveal on each click as well as on load.
function revealSoloNotices() {
	if ( isSoloNoticeDismissed() ) {
		return;
	}
	document.querySelectorAll( SOLO_NOTICE ).forEach( function ( el ) {
		el.hidden = false;
	} );
}
revealSoloNotices();
document.addEventListener( 'DOMContentLoaded', revealSoloNotices );

function copyLink( button ) {
	const url = button.dataset.url || '';
	const done = () => {
		button.classList.add( 'flow-ew-classic__share-copy--done' );
		setTimeout(
			() =>
				button.classList.remove( 'flow-ew-classic__share-copy--done' ),
			2000
		);
	};
	if ( window.navigator?.clipboard && window.isSecureContext ) {
		window.navigator.clipboard.writeText( url ).then( done );
		return;
	}
	const area = document.createElement( 'textarea' );
	area.value = url;
	area.style.position = 'fixed';
	area.style.opacity = '0';
	document.body.appendChild( area );
	area.select();
	document.execCommand( 'copy' );
	document.body.removeChild( area );
	done();
}

document.addEventListener( 'click', function ( event ) {
	const copy = event.target.closest?.( '.flow-ew-classic-self__copy' );
	if ( copy ) {
		event.preventDefault();
		copyLink( copy );
		return;
	}
	const dismiss = event.target.closest?.(
		SOLO_NOTICE + ' .flow-ew-review-notice__dismiss'
	);
	if ( ! dismiss ) {
		revealSoloNotices();
		return;
	}
	event.preventDefault();
	dismissSoloNotice();
	document.querySelectorAll( SOLO_NOTICE ).forEach( function ( el ) {
		el.hidden = true;
	} );
} );

/**
 * Self review checkbox in the Classic Editor metabox and builder drawers. The
 * markup is server-rendered; this only saves the per-post switch and shows or
 * hides the go-to link.
 */
document.addEventListener( 'change', function ( event ) {
	const toggle = event.target;
	if ( ! toggle.classList?.contains( 'flow-ew-classic-self__toggle' ) ) {
		return;
	}
	const { flowEW } = window;
	if ( ! flowEW ) {
		return;
	}
	const root = toggle.closest( '[data-flow-ew-self-review]' );
	const goto = root && root.querySelector( '.flow-ew-classic-self__goto' );
	const share = root && root.querySelector( '.flow-ew-classic-self__share' );
	const enabled = toggle.checked;

	toggle.disabled = true;
	fetch( flowEW.restUrl + '/self-review/' + flowEW.postId, {
		method: 'POST',
		credentials: 'same-origin',
		headers: {
			'Content-Type': 'application/json',
			'X-WP-Nonce': flowEW.nonce,
		},
		body: JSON.stringify( { enabled } ),
	} )
		.then( function ( r ) {
			if ( ! r.ok ) {
				throw new Error( 'Failed' );
			}
			if ( '1' !== root.dataset.saved ) {
				return;
			}
			if ( share ) {
				share.hidden = ! enabled;
			} else if ( goto ) {
				goto.hidden = ! enabled;
			}
		} )
		.catch( function () {
			toggle.checked = ! enabled;
		} )
		.finally( function () {
			toggle.disabled = false;
		} );
} );
