import { useEffect, useRef } from '@wordpress/element';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { desktop, external } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * View dropdown — Free renders the chrome and the "Preview in new tab" link.
 * Pro extends it via the `flow_ew_view_dropdown_extras` filter (device-preview
 * switcher) and `flow_ew_view_dropdown_icon` filter (device-aware trigger
 * icon). The pointer-down/click hack on the wrapper swallows the second click
 * that some browsers fire on the toggle when a portal-based popover is already
 * open — without it the menu reopens immediately after closing.
 */
export default function ViewDropdown( { postUrl, device } ) {
	const wrapperRef = useRef( null );

	useEffect( () => {
		const wrapper = wrapperRef.current;
		if ( ! wrapper ) {
			return;
		}
		let wasOpenOnPointerDown = false;
		const onPointerDown = ( e ) => {
			const toggle = wrapper.querySelector(
				'.components-dropdown-menu__toggle'
			);
			wasOpenOnPointerDown =
				!! toggle &&
				toggle.getAttribute( 'aria-expanded' ) === 'true' &&
				( toggle === e.target || toggle.contains( e.target ) );
		};
		const onClick = ( e ) => {
			if ( ! wasOpenOnPointerDown ) {
				return;
			}
			wasOpenOnPointerDown = false;
			const toggle = wrapper.querySelector(
				'.components-dropdown-menu__toggle'
			);
			if (
				toggle &&
				( toggle === e.target || toggle.contains( e.target ) )
			) {
				e.stopImmediatePropagation();
			}
		};
		wrapper.addEventListener( 'pointerdown', onPointerDown, true );
		wrapper.addEventListener( 'click', onClick, true );
		return () => {
			wrapper.removeEventListener( 'pointerdown', onPointerDown, true );
			wrapper.removeEventListener( 'click', onClick, true );
		};
	}, [] );

	const triggerIcon = applyFilters( 'flow_ew_view_dropdown_icon', desktop, {
		device,
	} );

	return (
		<div ref={ wrapperRef } className="flow-bar__view-dropdown-wrap">
			<DropdownMenu
				icon={ triggerIcon }
				label={ __( 'View', 'jumplinks-editorial-workflow' ) }
				className="flow-bar__view-dropdown"
				popoverProps={ { placement: 'bottom-end' } }
				toggleProps={ { size: 'compact' } }
			>
				{ ( { onClose } ) => (
					<>
						{ applyFilters( 'flow_ew_view_dropdown_extras', null, {
							onClose,
							device,
						} ) }
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
	);
}
