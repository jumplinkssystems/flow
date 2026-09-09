import { useCallback } from '@wordpress/element';
import { PanelRow, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { applyFilters } from '@wordpress/hooks';

const { flowEW } = window;
const { postId } = flowEW;

/**
 * Open Review checkbox for the Gutenberg sidebar. Lives above the Reviewer
 * field so requesters can flip a draft public-link before picking a reviewer.
 * If no review record exists yet, toggling on auto-creates one with no
 * reviewer assigned, then opens it.
 */
export default function OpenReviewControl({
	review,
	loading,
	setReview,
	setLoading,
	restUrl,
	createErrorNotice,
}) {
	const onToggle = useCallback(
		async (checked) => {
			setLoading(true);
			try {
				let target = review;
				if (!target) {
					target = await apiFetch({
						url: `${restUrl}/reviews`,
						method: 'POST',
						data: { post_id: postId, reviewer_id: 0 },
					});
				}
				const data = await apiFetch({
					url: `${restUrl}/reviews/${target.id}/${checked ? 'open' : 'close'}`,
					method: 'POST',
				});
				setReview(data);
			} catch (err) {
				createErrorNotice(
					err?.message ||
						__('Could not save. Please try again.', 'jumplinks-editorial-workflow'),
					{ isDismissible: true }
				);
			} finally {
				setLoading(false);
			}
		},
		[review, restUrl, setReview, setLoading, createErrorNotice]
	);

	// Extension slot: only renders when the main toggle is on, so add-ons
	// (e.g. Pro's "Open to public") can layer sub-controls below the checkbox.
	const extras = review?.is_open
		? applyFilters('flow_ew_open_review_extras', null, {
				review,
				loading,
				setReview,
				setLoading,
				restUrl,
				createErrorNotice,
		  })
		: null;

	return (
		<>
			<PanelRow>
				<CheckboxControl
					__nextHasNoMarginBottom
					label={__('Open review', 'jumplinks-editorial-workflow')}
					help={__(
						'All users with the link will be able to add comments.',
						'jumplinks-editorial-workflow'
					)}
					checked={!!review?.is_open}
					onChange={onToggle}
					disabled={loading}
				/>
			</PanelRow>
			{extras}
		</>
	);
}
