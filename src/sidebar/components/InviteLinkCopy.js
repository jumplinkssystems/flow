import { useState, useEffect } from '@wordpress/element';
import { useCopyToClipboard } from '@wordpress/compose';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { ShareBarIcon } from '../../shared/share-bar-icons';

/**
 * Read lazily, never at module scope. The Free sidebar script declares the Pro
 * editor bundle as a dependency, so Pro evaluates before `wp_localize_script`
 * has printed `flowEW`. Destructuring it up here throws and takes every filter
 * the Pro bundle registers down with it.
 */
function config() {
	return ( typeof window !== 'undefined' && window.flowEW ) || {};
}

/**
 * Copies an external reviewer's magic link.
 *
 * The link is fetched rather than read off the review payload: that payload
 * also feeds webhooks, and a live entry token must not travel off-site. It is
 * fetched on mount rather than on click so the clipboard write stays inside the
 * user gesture — Safari rejects a write that happens after an await.
 *
 * @param {Object} props
 * @param {number} props.reviewId
 * @param {string} [props.email]  Which invite to copy. Omit for the single
 *                                Free invite; Pro passes one per reviewer.
 */
export default function InviteLinkCopy( { reviewId, email = '' } ) {
	const [ url, setUrl ] = useState( '' );
	const [ copied, setCopied ] = useState( false );

	useEffect( () => {
		if ( ! reviewId ) {
			setUrl( '' );
			return undefined;
		}
		let cancelled = false;
		const query = email ? `?email=${ encodeURIComponent( email ) }` : '';
		const { restUrl } = config();
		apiFetch( { url: `${ restUrl }/reviews/${ reviewId }/invite-link${ query }` } )
			.then( ( res ) => {
				if ( ! cancelled ) {
					setUrl( ( res && res.url ) || '' );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setUrl( '' );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ reviewId, email ] );

	const ref = useCopyToClipboard( url, () => {
		setCopied( true );
		setTimeout( () => setCopied( false ), 2000 );
	} );

	if ( ! url ) {
		return null;
	}

	const { i18n } = config();
	const label = copied
		? i18n?.copied
		: i18n?.copyInviteLink ||
		  __( 'Copy invite link', 'jumplinks-editorial-workflow' );

	return (
		<Button
			ref={ ref }
			size="compact"
			variant="tertiary"
			label={ label }
			showTooltip
			className={ `flow-ew-reviewer-card__copy${
				copied ? ' flow-ew-reviewer-card__copy--done' : ''
			}` }
		>
			<ShareBarIcon name={ copied ? 'copied' : 'copy' } />
		</Button>
	);
}
