/**
 * Mirrors PublishGuard / classic-editor publish blocking — show review
 * notices only while this returns true.
 *
 * Email invitees keep `reviewer_id === 0` and use a negative synthetic
 * `reviewer.id`; both count as an assigned reviewer once the review is approved.
 *
 * @param {{
 *   reviewMandatory?: boolean,
 *   isPublished?: boolean,
 *   review?: object|null,
 *   reviewerMeta?: number,
 * }} args
 */
export function isPublishBlocked( {
	reviewMandatory,
	isPublished,
	review,
	reviewerMeta = 0,
} ) {
	if ( ! reviewMandatory || isPublished ) {
		return false;
	}

	if ( review?.status !== 'approved' ) {
		return true;
	}

	return ! hasAssignedReviewer( review, reviewerMeta );
}

/**
 * @param {object|null|undefined} review
 * @param {number} reviewerMeta
 */
function hasAssignedReviewer( review, reviewerMeta = 0 ) {
	const wpId = Number( review?.reviewer_id || 0 );
	if ( wpId > 0 ) {
		return true;
	}

	// Synthetic email ids are negative; still a real assignment.
	const reviewerObjId = Number( review?.reviewer?.id || 0 );
	if ( reviewerObjId !== 0 ) {
		return true;
	}

	if ( Number( reviewerMeta || 0 ) > 0 ) {
		return true;
	}

	if ( review?.invite_email || review?.reviewer?.is_email ) {
		return true;
	}

	if (
		Array.isArray( review?.email_invites ) &&
		review.email_invites.length > 0
	) {
		return true;
	}

	return false;
}
