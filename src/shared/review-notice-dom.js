import { isPublishBlocked } from './is-publish-blocked';
import {
	dismissNoReviewRolesNotice,
	isNoReviewRolesNoticeDismissed,
	NO_REVIEW_ROLES_DISMISS_VALUE,
} from './no-review-roles-notice';
import { resolveClassicRoot } from './resolve-classic-root';

function escHtml( str ) {
	const d = document.createElement( 'div' );
	d.textContent = str;
	return d.innerHTML;
}

function collectClassicRoots() {
	const roots = [];
	const primary = resolveClassicRoot();
	if ( primary ) {
		roots.push( primary );
	}
	document.querySelectorAll( '#flow-ew-classic' ).forEach( ( el ) => {
		if ( ! roots.includes( el ) ) {
			roots.push( el );
		}
	} );
	return roots;
}

function isRolesDismissNotice( el ) {
	return el?.dataset?.flowEwDismiss === NO_REVIEW_ROLES_DISMISS_VALUE;
}

function wireDismissButton( notice ) {
	if ( ! notice || ! isRolesDismissNotice( notice ) ) {
		return;
	}
	if ( notice.dataset.flowEwDismissWired === '1' ) {
		return;
	}
	notice.dataset.flowEwDismissWired = '1';

	let btn = notice.querySelector( '.flow-ew-review-notice__dismiss' );
	if ( ! btn ) {
		btn = document.createElement( 'button' );
		btn.type = 'button';
		btn.className = 'flow-ew-review-notice__dismiss';
		btn.setAttribute( 'aria-label', 'Dismiss' );
		btn.innerHTML = '<span aria-hidden="true">&times;</span>';
		notice.prepend( btn );
	}

	btn.addEventListener( 'click', ( event ) => {
		event.preventDefault();
		dismissNoReviewRolesNotice();
		document
			.querySelectorAll(
				`.flow-ew-review-notice[data-flow-ew-dismiss="${ NO_REVIEW_ROLES_DISMISS_VALUE }"]`
			)
			.forEach( ( el ) => {
				el.hidden = true;
			} );
	} );
}

/**
 * Toggle publish-guard notices. Works on PHP-rendered and JS-fallback notices.
 */
export function syncReviewNoticeVisibility( args ) {
	const blocked = isPublishBlocked( args );
	const rolesDismissed = isNoReviewRolesNoticeDismissed();

	document.querySelectorAll( '.flow-ew-review-notice' ).forEach( ( el ) => {
		if ( isRolesDismissNotice( el ) && rolesDismissed ) {
			el.hidden = true;
			return;
		}
		if ( el.dataset.flowEwPublishGuardOnly === '1' ) {
			el.hidden = ! blocked;
			return;
		}
		el.hidden = false;
	} );
}

function buildNoticeSpec( flowEW, review, publishBlocked ) {
	const i18n = flowEW.i18n || {};
	const noReviewers = !! flowEW.noReviewers;
	const reviewMandatory = !! flowEW.reviewMandatory;
	const rolesDismissed = isNoReviewRolesNoticeDismissed();

	if ( noReviewers && ! reviewMandatory ) {
		if ( rolesDismissed ) {
			return null;
		}
		return {
			variant: 'in-review',
			role: 'status',
			publishGuardOnly: false,
			dismissableRoles: true,
			title: i18n.noReviewRolesTitle || 'No Review Roles Assigned',
			descHtml: flowEW.reviewRolesHintHtml || '',
		};
	}

	if ( ! publishBlocked ) {
		return null;
	}

	if ( noReviewers ) {
		if ( rolesDismissed ) {
			return null;
		}
		const descParts = [
			i18n.reviewMandatoryDesc ||
				i18n.publishGuardTooltip ||
				'Post can go live only after approval by a reviewer.',
		];
		if ( flowEW.reviewRolesHintHtml ) {
			descParts.push( flowEW.reviewRolesHintHtml );
		}
		return {
			variant: 'in-review',
			role: 'status',
			publishGuardOnly: true,
			dismissableRoles: true,
			title: i18n.noReviewRolesTitle || 'No Review Roles Assigned',
			descHtml: descParts.join( ' ' ),
		};
	}

	return {
		variant: 'in-review',
		role: 'note',
		publishGuardOnly: true,
		title:
			i18n.reviewMandatoryTitle || 'Review Mode set to Mandatory',
		descHtml:
			i18n.reviewMandatoryDesc ||
			i18n.publishGuardTooltip ||
			'Post can go live only after approval by a reviewer.',
	};
}

function renderNoticeElement( spec ) {
	const div = document.createElement( 'div' );
	div.className =
		'flow-ew-review-notice flow-ew-review-notice--' + spec.variant;
	div.setAttribute( 'role', spec.role );
	div.dataset.flowEwJsNotice = '1';
	if ( spec.publishGuardOnly ) {
		div.dataset.flowEwPublishGuardOnly = '1';
	}
	if ( spec.dismissableRoles ) {
		div.dataset.flowEwDismiss = NO_REVIEW_ROLES_DISMISS_VALUE;
	}
	div.innerHTML =
		'<p class="flow-ew-review-notice__title">' +
		escHtml( spec.title ) +
		'</p>' +
		'<p class="flow-ew-review-notice__desc">' +
		spec.descHtml +
		'</p>';
	wireDismissButton( div );
	return div;
}

function insertNotice( root, notice ) {
	// Keep Mandatory / role notices above Open Review (and everything else).
	const openSlot = root.querySelector( '#flow-ew-classic-open-slot' );
	if ( openSlot ) {
		openSlot.insertAdjacentElement( 'beforebegin', notice );
		return;
	}
	root.prepend( notice );
}

/**
 * Ensure review mode notices exist in builder/classic panels (SSR fallback).
 */
export function ensureReviewNotices( { review, reviewMandatory, reviewerMeta, isPublished, currentUserCan } ) {
	const flowEW = window.flowEW;
	if ( ! flowEW || ! currentUserCan?.assignReviewer ) {
		document
			.querySelectorAll( '.flow-ew-review-notice[data-flow-ew-js-notice="1"]' )
			.forEach( ( el ) => el.remove() );
		syncReviewNoticeVisibility( {
			reviewMandatory,
			isPublished,
			review,
			reviewerMeta,
		} );
		return;
	}

	const publishBlocked = isPublishBlocked( {
		reviewMandatory,
		isPublished,
		review,
		reviewerMeta,
	} );
	const spec = buildNoticeSpec( flowEW, review, publishBlocked );

	collectClassicRoots().forEach( ( root ) => {
		const jsNotice = root.querySelector(
			'.flow-ew-review-notice[data-flow-ew-js-notice="1"]'
		);
		const hasPhpNotice = root.querySelector(
			'.flow-ew-review-notice:not([data-flow-ew-js-notice])'
		);

		if ( hasPhpNotice ) {
			wireDismissButton( hasPhpNotice );
		}

		if ( ! spec ) {
			if ( jsNotice ) {
				jsNotice.remove();
			}
			return;
		}

		if ( hasPhpNotice ) {
			if ( jsNotice ) {
				jsNotice.remove();
			}
			return;
		}

		if ( jsNotice ) {
			const next = renderNoticeElement( spec );
			jsNotice.replaceWith( next );
			return;
		}

		insertNotice( root, renderNoticeElement( spec ) );
	} );

	syncReviewNoticeVisibility( {
		reviewMandatory,
		isPublished,
		review,
		reviewerMeta,
	} );
}
