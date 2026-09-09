import { useState, createInterpolateElement } from '@wordpress/element';
import { PanelRow, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	dismissNoReviewRolesNotice,
	isNoReviewRolesNoticeDismissed,
} from '../../shared/no-review-roles-notice';

const { flowEW } = window;

function SettingsHint( { settingsUrl, usersUrl } ) {
	const settingsLink = (
		<a
			href={ settingsUrl }
			className="flow-ew-review-notice__link"
			target="_blank"
			rel="noreferrer"
		/>
	);
	const usersLink = (
		<a
			href={ usersUrl }
			className="flow-ew-review-notice__link"
			target="_blank"
			rel="noreferrer"
		/>
	);

	return createInterpolateElement(
		__(
			'Please check the <settings>settings</settings> to see which user roles can review, and also if the role is applied the assigned <users>users</users>.',
			'jumplinks-editorial-workflow'
		),
		{
			settings: settingsLink,
			users: usersLink,
		}
	);
}

function DismissableNotice( {
	variant,
	role,
	publishGuardOnly = false,
	title,
	children,
} ) {
	const [ dismissed, setDismissed ] = useState( () =>
		isNoReviewRolesNoticeDismissed()
	);

	if ( dismissed ) {
		return null;
	}

	return (
		<PanelRow>
			<div
				className={ `flow-ew-review-notice flow-ew-review-notice--${ variant }` }
				role={ role }
				data-flow-ew-dismiss="no-review-roles"
				{ ...( publishGuardOnly
					? { 'data-flow-ew-publish-guard-only': '1' }
					: {} ) }
			>
				<Button
					className="flow-ew-review-notice__dismiss"
					icon="no-alt"
					label={ __( 'Dismiss', 'jumplinks-editorial-workflow' ) }
					onClick={ () => {
						dismissNoReviewRolesNotice();
						setDismissed( true );
					} }
					isSmall
				/>
				<p className="flow-ew-review-notice__title">{ title }</p>
				<p className="flow-ew-review-notice__desc">{ children }</p>
			</div>
		</PanelRow>
	);
}

export default function ReviewModeNotice( {
	reviewMandatory,
	publishBlocked,
	noReviewers,
	settingsUrl = flowEW.settingsUrl,
	usersUrl = flowEW.usersUrl,
} ) {
	if ( noReviewers && ! reviewMandatory ) {
		return (
			<DismissableNotice
				variant="in-review"
				role="status"
				title={ __(
					'No Review Roles Assigned',
					'jumplinks-editorial-workflow'
				) }
			>
				<SettingsHint
					settingsUrl={ settingsUrl }
					usersUrl={ usersUrl }
				/>
			</DismissableNotice>
		);
	}

	if ( ! publishBlocked ) {
		return null;
	}

	if ( noReviewers ) {
		return (
			<DismissableNotice
				variant="in-review"
				role="status"
				publishGuardOnly
				title={ __(
					'No Review Roles Assigned',
					'jumplinks-editorial-workflow'
				) }
			>
				{ __(
					'Post can go live only after approval by a reviewer.',
					'jumplinks-editorial-workflow'
				) }{ ' ' }
				<SettingsHint
					settingsUrl={ settingsUrl }
					usersUrl={ usersUrl }
				/>
			</DismissableNotice>
		);
	}

	return (
		<PanelRow>
			<div
				className="flow-ew-review-notice flow-ew-review-notice--in-review"
				role="note"
				data-flow-ew-publish-guard-only="1"
			>
				<p className="flow-ew-review-notice__title">
					{ __(
						'Review Mode set to Mandatory',
						'jumplinks-editorial-workflow'
					) }
				</p>
				<p className="flow-ew-review-notice__desc">
					{ __(
						'Post can go live only after approval by a reviewer.',
						'jumplinks-editorial-workflow'
					) }
				</p>
			</div>
		</PanelRow>
	);
}
