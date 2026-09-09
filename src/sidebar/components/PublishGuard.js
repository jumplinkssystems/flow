import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { STORE_NAME } from '../store';
import { isPublishBlocked } from '../../shared/is-publish-blocked';
import {
	syncGutenbergPublishGuardTooltips,
} from '../../shared/publish-guard-ui';

const { flowEW } = window;

const BLOCKED_PUBLISH_CLICK_SELECTOR =
	'.edit-post-header .editor-post-publish-panel__toggle, .edit-post-header .editor-post-publish-button';

function getPublishGuardStyles() {
	return `
		/* Header publish: keep pointer events so tooltip works; clicks blocked in JS. */
		.edit-post-header .editor-post-publish-panel__toggle,
		.edit-post-header .editor-post-publish-button {
			opacity: 0.4 !important;
			cursor: not-allowed !important;
		}
		/* Publish panel + schedule controls stay fully inert. */
		.editor-post-publish-panel .editor-post-publish-button,
		.editor-post-publish-panel .editor-post-publish-button__button,
		.editor-post-schedule__panel-dropdown,
		.editor-post-schedule__dialog-toggle {
			opacity: 0.4 !important;
			pointer-events: none !important;
			cursor: not-allowed !important;
		}
	`;
}

export default function PublishGuard() {
	const review = useSelect( ( sel ) => sel( STORE_NAME ).getReview(), [] );
	const isAlreadyPublished = useSelect(
		( sel ) => sel( 'core/editor' ).getCurrentPostAttribute( 'status' ) === 'publish',
		[]
	);
	const blocked = isPublishBlocked( {
		reviewMandatory: flowEW.reviewMandatory,
		isPublished: isAlreadyPublished,
		review,
		reviewerMeta: flowEW.reviewerMeta,
	} );

	useEffect( () => {
		const styleId = 'flow-ew-publish-guard';

		if ( blocked ) {
			let el = document.getElementById( styleId );
			if ( ! el ) {
				el = document.createElement( 'style' );
				el.id = styleId;
				document.head.appendChild( el );
			}
			el.textContent = getPublishGuardStyles();
		} else {
			const el = document.getElementById( styleId );
			if ( el ) {
				el.parentNode.removeChild( el );
			}
		}

		syncGutenbergPublishGuardTooltips( blocked );

		if ( ! blocked ) {
			return undefined;
		}

		const onClick = ( event ) => {
			if ( event.target.closest( BLOCKED_PUBLISH_CLICK_SELECTOR ) ) {
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();
			}
		};

		document.addEventListener( 'click', onClick, true );

		const observer = new MutationObserver( () => {
			syncGutenbergPublishGuardTooltips( true );
		} );
		observer.observe( document.body, { childList: true, subtree: true } );

		return () => {
			document.removeEventListener( 'click', onClick, true );
			observer.disconnect();
			syncGutenbergPublishGuardTooltips( false );
		};
	}, [ blocked ] );

	return null;
}
