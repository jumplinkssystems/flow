import { useEffect, useRef } from '@wordpress/element';

const EVENT = 'flow:comment-form-open';

/**
 * One reply or edit form open at a time: when this form opens, every other
 * reply and edit form closes (their unsent text is discarded, as on Cancel).
 *
 * @param {boolean}  isOpen Whether this form is open.
 * @param {Function} close  Closes this form.
 */
export function useSingleCommentForm( isOpen, close ) {
	const ownerRef = useRef( {} );
	const closeRef = useRef( close );
	closeRef.current = close;

	useEffect( () => {
		if ( ! isOpen ) {
			return undefined;
		}
		window.dispatchEvent(
			new CustomEvent( EVENT, { detail: { owner: ownerRef.current } } )
		);
		return undefined;
	}, [ isOpen ] );

	useEffect( () => {
		const onOtherOpen = ( e ) => {
			if ( e.detail?.owner !== ownerRef.current ) {
				closeRef.current();
			}
		};
		window.addEventListener( EVENT, onOtherOpen );
		return () => window.removeEventListener( EVENT, onOtherOpen );
	}, [] );
}
