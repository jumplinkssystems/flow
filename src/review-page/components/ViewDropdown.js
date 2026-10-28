import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Tooltip,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { desktop, external } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

import useDropdownToggleGuard from '../utils/use-dropdown-toggle-guard';
import { eyeIcon, eyeOffIcon } from '../icons/outline-icons';
import {
	applyInlineCommentsVisibility,
	areInlineCommentsHidden,
	areResolvedCommentsHidden,
	setInlineCommentsHidden,
	setResolvedCommentsHidden,
} from '../utils/comment-visibility';

/**
 * View dropdown — Free renders the chrome and the "Preview in new tab" link.
 * Pro extends it via the `flow_ew_view_dropdown_extras` filter (device-preview
 * switcher) and `flow_ew_view_dropdown_icon` filter (device-aware trigger
 * icon). The wrapper carries the toggle guard from `useDropdownToggleGuard`.
 */
// Matches $mobile-bp: a phone has no use for device previews or a new tab.
const isMobileViewport = () =>
	!! window.matchMedia?.( '(max-width: 782px)' )?.matches;

export default function ViewDropdown( { postUrl, device } ) {
	const wrapperRef = useDropdownToggleGuard();
	const [ commentsHidden, setCommentsHidden ] = useState(
		areInlineCommentsHidden
	);
	const [ resolvedHidden, setResolvedHidden ] = useState(
		areResolvedCommentsHidden
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
					popoverProps={ {
						placement: 'bottom-end',
						className:
							'flow-bar__view-dropdown-popover flow-ew-portal',
					} }
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
							{ ! isMobileViewport() &&
								applyFilters(
									'flow_ew_view_dropdown_extras',
									null,
									{
										onClose,
										device,
									}
								) }
							<MenuGroup>
								{ applyFilters(
									'flow_ew_view_dropdown_toggles',
									null
								) }
								<MenuItem
									role="menuitemcheckbox"
									isSelected={ commentsHidden }
									aria-label={ __(
										'Hide inline comments',
										'jumplinks-editorial-workflow'
									) }
									icon={
										commentsHidden ? eyeOffIcon : eyeIcon
									}
									onClick={ () => {
										const next = ! commentsHidden;
										setInlineCommentsHidden( next );
										setCommentsHidden( next );
									} }
								>
									{ __(
										'Inline comments',
										'jumplinks-editorial-workflow'
									) }
								</MenuItem>
								<MenuItem
									role="menuitemcheckbox"
									isSelected={ resolvedHidden }
									aria-label={ __(
										'Hide resolved comments',
										'jumplinks-editorial-workflow'
									) }
									icon={
										resolvedHidden ? eyeOffIcon : eyeIcon
									}
									onClick={ () => {
										const next = ! resolvedHidden;
										setResolvedCommentsHidden( next );
										setResolvedHidden( next );
									} }
								>
									{ __(
										'Resolved comments',
										'jumplinks-editorial-workflow'
									) }
								</MenuItem>
							</MenuGroup>
							{ postUrl && ! isMobileViewport() ? (
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
