import { useCallback, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { PanelRow, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { applyFilters } from '@wordpress/hooks';
import { getConfig } from '../../shared/config';
import { hasAssignedReviewer } from '../../shared/should-show-send-for-review';
import CancelReviewModal from './CancelReviewModal';

const flowEW = getConfig();
const { postId, i18n } = flowEW;

/**
 * Open Review checkbox for the Gutenberg sidebar. Lives above the Reviewer
 * field so requesters can flip a draft public-link before picking a reviewer.
 * If no review record exists yet, toggling on auto-creates one with no
 * reviewer assigned, then opens it.
 */
export default function OpenReviewControl( {
	review,
	loading,
	setReview,
	setLoading,
	restUrl,
	createErrorNotice,
} ) {
	const { createSuccessNotice } = useDispatch( noticesStore );
	const [ confirmingClose, setConfirmingClose ] = useState( false );
	const onToggle = useCallback(
		async ( checked ) => {
			setLoading( true );
			try {
				let target = review;
				if ( ! target ) {
					target = await apiFetch( {
						url: `${ restUrl }/reviews`,
						method: 'POST',
						data: { post_id: postId, reviewer_id: 0 },
					} );
				}
				const data = await apiFetch( {
					url: `${ restUrl }/reviews/${ target.id }/${
						checked ? 'open' : 'close'
					}`,
					method: 'POST',
				} );
				setReview( data || null );
				// Closing with nobody assigned cancels the review server-side.
				if ( ! checked && ! data ) {
					createSuccessNotice( i18n.reviewCancelled, {
						type: 'snackbar',
						isDismissible: true,
					} );
				}
			} catch ( err ) {
				createErrorNotice(
					err?.message ||
						__(
							'Could not save. Please try again.',
							'jumplinks-editorial-workflow'
						),
					{ isDismissible: true }
				);
			} finally {
				setLoading( false );
			}
		},
		[
			review,
			restUrl,
			setReview,
			setLoading,
			createErrorNotice,
			createSuccessNotice,
		]
	);

	// Extension slot: only renders when the main toggle is on, so add-ons
	// (e.g. Pro's "Open to public") can layer sub-controls below the checkbox.
	const extras = review?.is_open
		? applyFilters( 'flow_ew_open_review_extras', null, {
				review,
				loading,
				setReview,
				setLoading,
				restUrl,
				createErrorNotice,
		  } )
		: null;

	return (
		<>
			<PanelRow>
				<CheckboxControl
					__nextHasNoMarginBottom
					label={ __(
						'Open review',
						'jumplinks-editorial-workflow'
					) }
					help={ __(
						'All users with the link will be able to add comments.',
						'jumplinks-editorial-workflow'
					) }
					checked={ !! review?.is_open }
					onChange={ ( checked ) => {
						// With nobody assigned, unticking cancels the review.
						if ( ! checked && ! hasAssignedReviewer( review ) ) {
							setConfirmingClose( true );
							return;
						}
						onToggle( checked );
					} }
					disabled={ loading }
				/>
			</PanelRow>
			{ extras }
			{ confirmingClose && (
				<CancelReviewModal
					onConfirm={ () => onToggle( false ) }
					onClose={ () => setConfirmingClose( false ) }
				/>
			) }
		</>
	);
}
