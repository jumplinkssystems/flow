import { __ } from '@wordpress/i18n';
import { hasFilter } from '@wordpress/hooks';

const DEVICE_SESSION_KEY = 'flow_review_device';

export function isValidDevice( value ) {
	return value === 'desktop' || value === 'tablet' || value === 'mobile';
}

/** Coarse only — iOS reports every phone as "iPhone", so an exact model is never reliable. */
export function detectRealDevice() {
	const ua = navigator.userAgent || '';
	if (
		/iPad/.test( ua ) ||
		( /Macintosh/.test( ua ) && navigator.maxTouchPoints > 1 )
	) {
		return 'tablet';
	}
	if ( /Mobi|iPhone|iPod|Windows Phone/.test( ua ) ) {
		return 'mobile';
	}
	if ( /Android/.test( ua ) ) {
		return /Mobile/.test( ua ) ? 'mobile' : 'tablet';
	}
	return 'desktop';
}

/** The device preview picked in the View menu; 'desktop' when none. */
export function readStoredDevice() {
	try {
		const stored = sessionStorage.getItem( DEVICE_SESSION_KEY );
		return isValidDevice( stored ) ? stored : 'desktop';
	} catch ( _err ) {
		return 'desktop';
	}
}

export function persistDevice( device ) {
	try {
		if ( device === 'desktop' ) {
			sessionStorage.removeItem( DEVICE_SESSION_KEY );
		} else {
			sessionStorage.setItem( DEVICE_SESSION_KEY, device );
		}
	} catch ( _err ) {
		// Storage disabled — selection only survives this load.
	}
}

function hasDeviceSwitcher() {
	return hasFilter(
		'flow_ew_view_dropdown_extras',
		'flow-pro/device-switcher'
	);
}

/** What the page is being viewed as: the preview when one is on, else the real device. */
export function currentDevice() {
	// Without the switcher nothing applies a stored preview, so it would mislabel the view.
	const preview = hasDeviceSwitcher() ? readStoredDevice() : 'desktop';
	return preview !== 'desktop' ? preview : detectRealDevice();
}

export function pinnedOnLabel( device ) {
	const labels = {
		desktop: __( 'Pinned on desktop.', 'jumplinks-editorial-workflow' ),
		tablet: __( 'Pinned on tablet.', 'jumplinks-editorial-workflow' ),
		mobile: __( 'Pinned on mobile.', 'jumplinks-editorial-workflow' ),
	};
	return labels[ device ] || '';
}

export function viewDeviceLabel( device ) {
	const labels = {
		desktop: __( 'View desktop', 'jumplinks-editorial-workflow' ),
		tablet: __( 'View tablet', 'jumplinks-editorial-workflow' ),
		mobile: __( 'View mobile', 'jumplinks-editorial-workflow' ),
	};
	return labels[ device ] || '';
}

/** Only a desktop can simulate the other sizes, and only with Pro's switcher. */
export function canPreviewDevices() {
	return detectRealDevice() === 'desktop' && hasDeviceSwitcher();
}

export function previewDevice( device ) {
	if ( ! isValidDevice( device ) ) {
		return;
	}
	persistDevice( device );
	window.dispatchEvent(
		new CustomEvent( 'flow:set-device-preview', { detail: { device } } )
	);
}

/** The device a pin was placed on; '' for older pins that never recorded one. */
export function pinViewportDevice( descriptor ) {
	const device = descriptor?.viewport?.device;
	return descriptor?.type === 'pin' && isValidDevice( device ) ? device : '';
}

/** The pin's device when it differs from what is on screen, else ''. */
export function pinOnOtherDevice( descriptor ) {
	const device = pinViewportDevice( descriptor );
	return device && device !== currentDevice() ? device : '';
}
