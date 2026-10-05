import { useEffect, useRef, useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import flowFetch from '../utils/api';

export default function RevisionsDialog( { reviewId, viewingId, onClose } ) {
	const [ items, setItems ] = useState( null );
	const [ failed, setFailed ] = useState( false );
	const closeRef = useRef( null );

	useEffect( () => {
		closeRef.current?.focus();
		flowFetch(
			`reviews/${ reviewId }/revisions?viewing=${ Number(
				viewingId || 0
			) }`
		)
			.then( ( list ) => setItems( Array.isArray( list ) ? list : [] ) )
			.catch( () => setFailed( true ) );
	}, [ reviewId, viewingId ] );

	useEffect( () => {
		const onKeyDown = ( event ) => {
			if ( event.key === 'Escape' ) {
				onClose();
			}
		};
		window.addEventListener( 'keydown', onKeyDown );
		return () => window.removeEventListener( 'keydown', onKeyDown );
	}, [ onClose ] );

	const title = __( 'Revisions', 'jumplinks-editorial-workflow' );

	return (
		<div className="flow-confirm-dialog">
			<button
				type="button"
				className="flow-confirm-dialog__backdrop"
				aria-label={ __( 'Close', 'jumplinks-editorial-workflow' ) }
				onClick={ onClose }
			/>
			<div
				className="flow-confirm-dialog__panel flow-confirm-dialog__panel--neutral"
				role="dialog"
				aria-modal="true"
				aria-labelledby="flow-revisions-title"
			>
				<div className="flow-confirm-dialog__alert">
					<div className="flow-confirm-dialog__content">
						<p
							id="flow-revisions-title"
							className="flow-confirm-dialog__title"
						>
							{ title }
						</p>
						{ failed && (
							<p className="flow-confirm-dialog__message">
								{ __(
									'Could not load the revisions. Please try again.',
									'jumplinks-editorial-workflow'
								) }
							</p>
						) }
						{ ! failed && null === items && (
							<p className="flow-confirm-dialog__message">
								{ __(
									'Loading…',
									'jumplinks-editorial-workflow'
								) }
							</p>
						) }
						{ items && (
							<ul className="flow-revisions">
								{ items.map( ( item ) => (
									<li key={ item.id }>
										<a
											href={ item.url }
											className={ `flow-revisions__item${
												item.viewing
													? ' is-viewing'
													: ''
											}` }
											aria-current={
												item.viewing
													? 'page'
													: undefined
											}
										>
											<span className="flow-revisions__date">
												{ item.date }
											</span>
											{ item.latest && (
												<span className="flow-revisions__tag">
													{ __(
														'Latest',
														'jumplinks-editorial-workflow'
													) }
												</span>
											) }
											{ item.viewing && (
												<span className="flow-revisions__tag">
													{ __(
														'Viewing',
														'jumplinks-editorial-workflow'
													) }
												</span>
											) }
											<span className="flow-revisions__resolved">
												{ item.resolved > 0
													? sprintf(
															/* translators: %d: number of resolved comments. */
															_n(
																'%d resolved comment',
																'%d resolved comments',
																item.resolved,
																'jumplinks-editorial-workflow'
															),
															item.resolved
													  )
													: '' }
											</span>
										</a>
									</li>
								) ) }
							</ul>
						) }
					</div>
				</div>
				<div className="flow-confirm-dialog__actions">
					<Button
						ref={ closeRef }
						className="flow-btn--cancel"
						onClick={ onClose }
					>
						{ __( 'Close', 'jumplinks-editorial-workflow' ) }
					</Button>
				</div>
			</div>
		</div>
	);
}
