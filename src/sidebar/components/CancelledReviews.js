import { useEffect, useRef, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { getConfig } from '../../shared/config';

const flowEW = getConfig();
const { restUrl, i18n } = flowEW;
const PAGE_SIZE = 5;

export default function CancelledReviews( { reviewKey } ) {
	const postId = useSelect(
		( sel ) => sel( 'core/editor' ).getCurrentPostId(),
		[]
	);
	const [ items, setItems ] = useState( flowEW.cancelledReviews || [] );
	const [ visible, setVisible ] = useState( PAGE_SIZE );
	const lastKey = useRef( reviewKey );

	// A cancel swaps the active review, or (Pro roster) marks it cancelled.
	useEffect( () => {
		if ( lastKey.current === reviewKey || ! postId ) {
			return;
		}
		lastKey.current = reviewKey;
		apiFetch( { url: `${ restUrl }/reviews/${ postId }/cancelled` } )
			.then( ( list ) => setItems( Array.isArray( list ) ? list : [] ) )
			.catch( () => {} );
	}, [ reviewKey, postId ] );

	if ( ! items.length ) {
		return null;
	}

	return (
		<div className="flow-ew-history">
			<p className="flow-ew-field-label flow-ew-share-bar__label">
				{ i18n.cancelledReviews }
			</p>
			<ul className="flow-ew-history__list">
				{ items.slice( 0, visible ).map( ( item ) => (
					<li key={ item.id } className="flow-ew-history__item">
						<a href={ item.url } target="_blank" rel="noreferrer">
							{ item.date }
						</a>
						{ item.meta && (
							<span className="flow-ew-history__meta">
								- { item.meta }
							</span>
						) }
					</li>
				) ) }
			</ul>
			{ items.length > visible && (
				<Button
					variant="link"
					className="flow-ew-history__more"
					onClick={ () => setVisible( visible + PAGE_SIZE ) }
				>
					{ i18n.loadMore }
				</Button>
			) }
		</div>
	);
}
