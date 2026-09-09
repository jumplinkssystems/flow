/**
 * Shared publish-guard UI helpers (opacity lock + hover tooltip).
 */

export function getPublishGuardTooltip() {
	const i18n = window.flowEW?.i18n || {};
	return (
		i18n.publishGuardTooltip ||
		'Post can go live only after approval by a reviewer.'
	);
}

/**
 * @param {Element|null|undefined} el
 * @returns {Element|null}
 */
export function publishGuardTooltipTarget( el ) {
	if ( ! el || ! el.closest ) {
		return null;
	}

	if ( el.id === 'publish' ) {
		return (
			el.closest( '#publishing-action' ) ||
			el.parentElement ||
			el
		);
	}

	const panelToggle = el.closest(
		'.editor-post-publish-panel__toggle, .editor-post-schedule__panel-dropdown'
	);
	if ( panelToggle ) {
		return panelToggle;
	}

	return el.parentElement || el;
}

/**
 * @param {Element|null|undefined} el
 * @param {boolean} blocked
 */
export function applyPublishGuardControl( el, blocked ) {
	if ( ! el ) {
		return;
	}

	const hint = getPublishGuardTooltip();
	const tooltipEl = publishGuardTooltipTarget( el );

	if ( blocked ) {
		el.style.opacity = '0.4';
		el.style.pointerEvents = 'none';
		el.style.cursor = 'not-allowed';
		if ( tooltipEl ) {
			tooltipEl.setAttribute( 'title', hint );
			tooltipEl.style.cursor = 'not-allowed';
			tooltipEl.dataset.flowEwPublishGuardTooltip = '1';
		}
		return;
	}

	el.style.opacity = '';
	el.style.pointerEvents = '';
	el.style.cursor = '';
	if ( tooltipEl?.dataset.flowEwPublishGuardTooltip === '1' ) {
		tooltipEl.removeAttribute( 'title' );
		tooltipEl.style.cursor = '';
		delete tooltipEl.dataset.flowEwPublishGuardTooltip;
	}
}

const GUTENBERG_TOOLTIP_SELECTORS = [
	'.edit-post-header .editor-post-publish-panel__toggle',
	'.edit-post-header .editor-post-publish-button',
];

/**
 * @param {boolean} blocked
 */
export function syncGutenbergPublishGuardTooltips( blocked ) {
	const hint = getPublishGuardTooltip();
	GUTENBERG_TOOLTIP_SELECTORS.forEach( ( selector ) => {
		document.querySelectorAll( selector ).forEach( ( el ) => {
			if ( blocked ) {
				el.setAttribute( 'title', hint );
				el.style.cursor = 'not-allowed';
				el.dataset.flowEwPublishGuardTooltip = '1';
				return;
			}
			if ( el.dataset.flowEwPublishGuardTooltip === '1' ) {
				el.removeAttribute( 'title' );
				el.style.cursor = '';
				delete el.dataset.flowEwPublishGuardTooltip;
			}
		} );
	} );
}

/**
 * @param {Element|null|undefined} el
 * @param {boolean} blocked
 */
export function syncPublishGuardTooltip( el, blocked ) {
	if ( ! el ) {
		return;
	}

	const hint = getPublishGuardTooltip();

	if ( blocked ) {
		el.setAttribute( 'title', hint );
		el.dataset.flowEwPublishGuardTooltip = '1';
		return;
	}

	if ( el.dataset.flowEwPublishGuardTooltip === '1' ) {
		el.removeAttribute( 'title' );
		delete el.dataset.flowEwPublishGuardTooltip;
	}
}

/** @returns {Element|null} */
export function findBricksPublishControl() {
	return document.querySelector(
		'#bricks-toolbar li:has([data-name="publish"])'
	);
}
