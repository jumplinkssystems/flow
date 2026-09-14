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
 * Whether anyone is on the hook for this review: a WordPress user, an email
 * invitee, or a Pro roster row. Turning on Open Review creates a review with
 * nobody assigned, which is a valid state but has nothing to send.
 *
 * @param {object|null|undefined} review
 * @return {boolean}
 */
export function hasAssignedReviewer( review ) {
	if ( ! review ) {
		return false;
	}
	// Email invitees carry a negative synthetic id, so the id alone is not enough.
	const reviewerId = Number( review.reviewer?.id ?? review.reviewer_id ?? 0 );
	if ( reviewerId > 0 ) {
		return true;
	}
	if ( review.invite_email || review.reviewer?.is_email ) {
		return true;
	}
	if (
		Array.isArray( review.email_invites ) &&
		review.email_invites.length > 0
	) {
		return true;
	}
	return Array.isArray( review.reviewers ) && review.reviewers.length > 0;
}

/**
 * Show the Send for review CTA when someone is assigned and the review has
 * never been sent, or when newly assigned reviewers still need a send.
 *
 * @param {object|null|undefined} review
 * @return {boolean}
 */
export function shouldShowSendForReview( review ) {
	if ( ! review || ! hasAssignedReviewer( review ) ) {
		return false;
	}
	return review.status === 'pending' || hasUnsentReviewers( review );
}
