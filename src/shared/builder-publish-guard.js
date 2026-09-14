import { isPublishBlocked } from './is-publish-blocked';
import { getConfig } from './config';

/**
 * Debounced publish-guard state for builder toolbars. `apply( blocked )` is
 * invoked after every scheduled recompute; builders decide how to lock their
 * own publish control.
 *
 * @param {(blocked: boolean) => void} apply
 * @param {{ delay?: number }} [opts]
 */
export function createBuilderPublishGuard( apply, opts = {} ) {
	const { delay = 80 } = opts;
	const ew = getConfig();
	const reviewMandatory = !! ew.reviewMandatory;
	const isPublished = !! ew.isPublished;
	const reviewerMeta = Number( ew.reviewerMeta || 0 );
	let lastReview = ew.activeReview || null;
	let blocked = false;
	let timer;

	function run() {
		blocked = isPublishBlocked( {
			reviewMandatory,
			isPublished,
			review: lastReview,
			reviewerMeta,
		} );
		apply( blocked );
	}

	function schedule( review ) {
		if ( review !== undefined ) {
			lastReview = review;
		}
		clearTimeout( timer );
		timer = setTimeout( run, delay );
	}

	new MutationObserver( function () {
		schedule();
	} ).observe( document.body, { childList: true, subtree: true } );

	schedule( lastReview );

	return {
		schedule,
		isBlocked: () => blocked,
		lastReview: () => lastReview,
	};
}
