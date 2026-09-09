/**
 * True when at least one assigned reviewer still has status `pending`
 * (assigned but not yet notified via Send). After send, Pro bumps those rows
 * to `in_review`, so this becomes false until the roster changes again.
 *
 * Distinct from `has_pending_reviewers`, which means "undecided" (pending OR
 * in_review) and is used for resubmit / rollup UI.
 *
 * @param {object|null|undefined} review
 * @return {boolean}
 */
export function hasUnsentReviewers( review ) {
	if ( ! review ) {
		return false;
	}
	const rows = Array.isArray( review.reviewers ) ? review.reviewers : [];
	if ( rows.length === 0 ) {
		return false;
	}
	return rows.some(
		( row ) => String( row?.status || 'pending' ) === 'pending'
	);
}

/**
 * Show the Send for review CTA when the review has never been sent, or when
 * newly assigned reviewers still need a send.
 *
 * @param {object|null|undefined} review
 * @return {boolean}
 */
export function shouldShowSendForReview( review ) {
	if ( ! review ) {
		return false;
	}
	return review.status === 'pending' || hasUnsentReviewers( review );
}
