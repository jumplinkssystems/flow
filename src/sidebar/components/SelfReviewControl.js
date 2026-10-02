import { useState, useCallback } from '@wordpress/element';
import { PanelRow, CheckboxControl, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { ShareBarIcon } from '../../shared/share-bar-icons';
import RevisionShareBar from './RevisionShareBar';
import { getConfig } from '../../shared/config';

const flowEW = getConfig();
const { postId, restUrl, i18n } = flowEW;

/**
 * Per-post switch for the private self review, above Open Review. On by
 * default; the go-to link appears once the post has been saved.
 */
/**
 * @param {Object}   props
 * @param {string}   props.postStatus
 * @param {Function} props.createErrorNotice
 * @param {boolean}  props.shareBar Self review only: show the link like the client review's, instead of the icon.
 */
export default function SelfReviewControl( {
	postStatus,
	createErrorNotice,
	shareBar = false,
} ) {
	const [ active, setActive ] = useState( !! flowEW.selfReview?.active );
	const [ busy, setBusy ] = useState( false );

	const onToggle = useCallback(
		async ( checked ) => {
			setBusy( true );
			setActive( checked );
			try {
				await apiFetch( {
					url: `${ restUrl }/self-review/${ postId }`,
					method: 'POST',
					data: { enabled: checked },
				} );
			} catch ( err ) {
				setActive( ! checked );
				createErrorNotice(
					err?.message ||
						__(
							'Could not save. Please try again.',
							'jumplinks-editorial-workflow'
						),
					{
						isDismissible: true,
					}
				);
			} finally {
				setBusy( false );
			}
		},
		[ createErrorNotice ]
	);

	return (
		<>
			<PanelRow>
				<div className="flow-ew-self-review">
					<CheckboxControl
						__nextHasNoMarginBottom
						label={ i18n.selfReview }
						help={ i18n.myReviewHint }
						checked={ active }
						onChange={ onToggle }
						disabled={ busy }
					/>
					{ ! shareBar && active && postStatus !== 'auto-draft' && (
						<Button
							href={ flowEW.selfReview.startUrl }
							target="_blank"
							rel="noreferrer"
							size="compact"
							variant="tertiary"
							label={ i18n.myReviewGoTo }
							showTooltip
							className="flow-ew-self-review__goto"
							icon={ <ShareBarIcon name="external" /> }
						/>
					) }
				</div>
			</PanelRow>
			{ shareBar && active && postStatus !== 'auto-draft' && (
				<PanelRow>
					<div className="flow-ew-actions">
						<RevisionShareBar
							url={
								flowEW.selfReview.link ||
								flowEW.selfReview.startUrl
							}
							label={ i18n.selfReview }
						/>
					</div>
				</PanelRow>
			) }
		</>
	);
}
