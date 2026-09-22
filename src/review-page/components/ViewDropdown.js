import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Tooltip,
} from '@wordpress/components';
import { desktop, external } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

import useDropdownToggleGuard from '../utils/use-dropdown-toggle-guard';

/**
 * View dropdown — Free renders the chrome and the "Preview in new tab" link.
 * Pro extends it via the `flow_ew_view_dropdown_extras` filter (device-preview
 * switcher) and `flow_ew_view_dropdown_icon` filter (device-aware trigger
 * icon). The wrapper carries the toggle guard from `useDropdownToggleGuard`.
 */
export default function ViewDropdown( { postUrl, device } ) {
	const wrapperRef = useDropdownToggleGuard();

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
