import { useSelect, useDispatch } from '@wordpress/data';
import { useState, createInterpolateElement } from '@wordpress/element';
import { PanelRow, Button } from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { getConfig } from '../../shared/config';
import {
	SOLO_NOTICE_DISMISS_VALUE,
	dismissSoloNotice,
	isSoloNoticeDismissed,
} from '../../shared/solo-mode-notice';
import SelfReviewControl from './SelfReviewControl';

const flowEW = getConfig();
const { i18n } = flowEW;

function SoloModeNotice() {
	const [ dismissed, setDismissed ] = useState( () =>
		isSoloNoticeDismissed()
	);
	if ( dismissed ) {
		return null;
	}
	return (
		<PanelRow>
			<div
				className="flow-ew-review-notice flow-ew-review-notice--in-review"
				role="status"
				data-flow-ew-dismiss={ SOLO_NOTICE_DISMISS_VALUE }
			>
				<Button
					className="flow-ew-review-notice__dismiss"
					icon="no-alt"
					label={ __( 'Dismiss', 'jumplinks-editorial-workflow' ) }
					onClick={ () => {
						dismissSoloNotice();
						setDismissed( true );
					} }
					isSmall
				/>
				<p className="flow-ew-review-notice__title">
					{ i18n.soloTitle }
				</p>
				<p className="flow-ew-review-notice__desc">
					{ createInterpolateElement( i18n.soloHint || '', {
						a: (
							// eslint-disable-next-line jsx-a11y/anchor-has-content -- createInterpolateElement fills it.
							<a
								href={ flowEW.settingsUrl }
								className="flow-ew-review-notice__link"
							/>
						),
					} ) }
				</p>
			</div>
		</PanelRow>
	);
}

/** Self review only mode: the private review is the whole panel. */
export default function SelfReviewOnlyPanel() {
	const postStatus = useSelect(
		( sel ) => sel( 'core/editor' ).getEditedPostAttribute( 'status' ),
		[]
	);
	const { createErrorNotice } = useDispatch( noticesStore );

	return (
		<>
			<SoloModeNotice />
			{ flowEW.selfReview?.offered && (
				<SelfReviewControl
					postStatus={ postStatus }
					createErrorNotice={ createErrorNotice }
					shareBar
				/>
			) }
		</>
	);
}
