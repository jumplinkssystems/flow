import { useEffect, useRef, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { getConfig } from '../../shared/config';
import { ShareBarIcon } from '../../shared/share-bar-icons';
import CancelReviewModal from './CancelReviewModal';

const flowEW = getConfig();
const { restUrl, i18n } = flowEW;
const PAGE_SIZE = 5;

export default function CancelledReviews( {
	reviewKey,
	onRestore = null,
	isBusy = false,
	hasActiveReview = false,
} ) {
	const postId = useSelect(
		( sel ) => sel( 'core/editor' ).getCurrentPostId(),
		[]
	);
	const [ items, setItems ] = useState( [] );
	const [ visible, setVisible ] = useState( PAGE_SIZE );
	const [ confirmId, setConfirmId ] = useState( null );
	const [ isStale, setIsStale ] = useState( false );
	const [ hasLoaded, setHasLoaded ] = useState( false );
	const lastKey = useRef( reviewKey );
	const loading = useRef( false );

	// The panel stays mounted while collapsed. Fetch only once it is open,
	// and again after a cancel or restore changes the active review.
	useEffect( () => {
		if ( ! postId ) {
			return undefined;
		}
		let stopped = false;
		let observer = null;
		const panelIsOpen = () => {
			const panel = document.querySelector( '.flow-ew-review-panel' );
			return ! panel || panel.classList.contains( 'is-opened' );
		};
		const load = () => {
			const keyChanged = lastKey.current !== reviewKey;
			if ( loading.current || ( hasLoaded && ! keyChanged ) ) {
				return;
			}
			loading.current = true;
			lastKey.current = reviewKey;
			setIsStale( true );
			apiFetch( { url: `${ restUrl }/reviews/${ postId }/cancelled` } )
				.then( ( list ) => {
					if ( ! stopped ) {
						setItems( Array.isArray( list ) ? list : [] );
					}
				} )
				.catch( () => {} )
				.finally( () => {
					loading.current = false;
					if ( ! stopped ) {
						setIsStale( false );
						setHasLoaded( true );
					}
				} );
		};
		if ( panelIsOpen() ) {
			load();
		} else {
			observer = new MutationObserver( () => {
				if ( stopped || ! panelIsOpen() ) {
					return;
				}
				observer.disconnect();
				load();
			} );
			observer.observe( document.body, {
				attributes: true,
				subtree: true,
				attributeFilter: [ 'class' ],
			} );
		}
		return () => {
			stopped = true;
			loading.current = false;
			observer?.disconnect();
		};
	}, [ reviewKey, postId, hasLoaded ] );

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
						<span
							className={ `flow-ew-history__dot flow-ew-history__dot--${
								item.status || 'cancelled'
							}` }
							title={ item.tooltip }
							aria-hidden="true"
						/>
						<a
							href={ item.url }
							target="_blank"
							rel="noreferrer"
							title={ item.tooltip }
						>
							{ item.date }
						</a>
						{ item.canRestore && onRestore && (
							<Button
								size="small"
								variant="tertiary"
								className="flow-ew-history__restore"
								label={ i18n.restoreReview }
								showTooltip
								disabled={ isBusy || isStale }
								onClick={ () => setConfirmId( item.id ) }
							>
								<ShareBarIcon name="restore" />
							</Button>
						) }
						{ item.meta && (
							<span className="flow-ew-history__meta">
								{ item.meta }
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
			{ confirmId && (
				<CancelReviewModal
					title={ i18n.restoreReviewTitle }
					body={
						hasActiveReview
							? i18n.restoreReviewBodyReplace
							: i18n.restoreReviewBody
					}
					confirmLabel={ i18n.restoreReview }
					cancelLabel={ i18n.cancelEdit }
					isDestructive={ false }
					onConfirm={ () => onRestore( confirmId ) }
					onClose={ () => setConfirmId( null ) }
				/>
			) }
		</div>
	);
}
