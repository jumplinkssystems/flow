import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Tooltip,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { check, desktop, external } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { SVG } from '@wordpress/primitives';

import useDropdownToggleGuard from '../utils/use-dropdown-toggle-guard';
import {
	applyInlineCommentsVisibility,
	areInlineCommentsHidden,
	setInlineCommentsHidden,
} from '../utils/comment-visibility';

/**
 * View dropdown — Free renders the chrome and the "Preview in new tab" link.
 * Pro extends it via the `flow_ew_view_dropdown_extras` filter (device-preview
 * switcher) and `flow_ew_view_dropdown_icon` filter (device-aware trigger
 * icon). The wrapper carries the toggle guard from `useDropdownToggleGuard`.
 */
// Holds the check mark's slot so the row keeps its height when unchecked.
const blankIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" />
);

export default function ViewDropdown( { postUrl, device } ) {
	const wrapperRef = useDropdownToggleGuard();
	const [ commentsHidden, setCommentsHidden ] = useState(
		areInlineCommentsHidden
	);

	// Each reload of the preview (device, revision, site navigation) needs it again.
	useEffect( () => {
		const onIframeReady = ( e ) =>
			applyInlineCommentsVisibility(
				e.detail?.iframe?.contentDocument || undefined
			);
		applyInlineCommentsVisibility();
		window.addEventListener( 'flow:iframe-ready', onIframeReady );
		return () =>
			window.removeEventListener( 'flow:iframe-ready', onIframeReady );
	}, [] );

	const triggerIcon = applyFilters( 'flow_ew_view_dropdown_icon', desktop, {
		device,
	} );

	return (
		<Tooltip
			text={ __( 'View', 'jumplinks-editorial-workflow' ) }
			placement="bottom"
			fixed
		>
			<div ref={ wrapperRef } className="flow-bar__view-dropdown-wrap">
				<DropdownMenu
					icon={ triggerIcon }
					label={ __( 'View', 'jumplinks-editorial-workflow' ) }
					className="flow-bar__view-dropdown"
					popoverProps={ { placement: 'bottom-end' } }
					toggleProps={ {
						size: 'compact',
						// The built-in tooltip anchors to the document while the
						// bar sits in a fixed shadow host, so it lands on top of
						// the button. The wrapper's Tooltip is positioned with
						// the fixed strategy instead, like the bar's others.
						showTooltip: false,
					} }
				>
					{ ( { onClose } ) => (
						<>
							{ applyFilters(
								'flow_ew_view_dropdown_extras',
								null,
								{
									onClose,
									device,
								}
							) }
							<MenuGroup>
								<MenuItem
									role="menuitemcheckbox"
									isSelected={ commentsHidden }
									icon={ commentsHidden ? check : blankIcon }
									onClick={ () => {
										const next = ! commentsHidden;
										setInlineCommentsHidden( next );
										setCommentsHidden( next );
									} }
								>
									{ __(
										'Hide inline comments',
										'jumplinks-editorial-workflow'
									) }
								</MenuItem>
							</MenuGroup>
							{ postUrl ? (
								<MenuGroup>
									<MenuItem
										href={ postUrl }
										target="_blank"
										rel="noreferrer"
										icon={ external }
										iconPosition="right"
									>
										{ __(
											'Preview in new tab',
											'jumplinks-editorial-workflow'
										) }
									</MenuItem>
								</MenuGroup>
							) : null }
						</>
					) }
				</DropdownMenu>
			</div>
		</Tooltip>
	);
}
