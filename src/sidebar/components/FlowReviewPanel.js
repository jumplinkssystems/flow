import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { PanelRow, Button } from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { applyFilters } from '@wordpress/hooks';
import { STORE_NAME } from '../store';
import { isPublishBlocked } from '../../shared/is-publish-blocked';
import { shouldShowSendForReview } from '../../shared/should-show-send-for-review';
import ReviewerField from './ReviewerField';
import RevisionShareBar from './RevisionShareBar';
import OpenReviewControl from './OpenReviewControl';
import ReviewModeNotice from './ReviewModeNotice';

const { flowEW } = window;
const { restUrl, currentUserId, currentUserCan, i18n } = flowEW;

export default function FlowReviewPanel() {
  const review = useSelect((sel) => sel(STORE_NAME).getReview(), []);
  const loading = useSelect((sel) => sel(STORE_NAME).isLoading(), []);
  const postStatus = useSelect(
    (sel) => sel('core/editor').getEditedPostAttribute('status'),
    []
  );
  const { setReview, setLoading } = useDispatch(STORE_NAME);
  const { editPost, savePost } = useDispatch('core/editor');
  const { createSuccessNotice, createErrorNotice } = useDispatch(noticesStore);

  const isInReview = review?.status === 'in_review';
  // Fresh review, or newly assigned reviewers that still need a send.
  const isPendingSend = shouldShowSendForReview(review);
  const isChangesRequested =
    review?.status === 'changes_requested' && !review?.has_pending_reviewers;
  const reviewerId = review ? Number(review.reviewer?.id || review.reviewer_id) : 0;
  const isReviewer = applyFilters(
    'flow_ew_is_reviewer',
    review ? reviewerId === currentUserId : false,
    { review, currentUserId }
  );
  const hasEmailInvite = !!(
    review &&
    (review.invite_email ||
      review.reviewer?.is_email ||
      (Array.isArray(review.email_invites) && review.email_invites.length > 0))
  );
  const hasReviewer = applyFilters(
    'flow_ew_has_reviewer',
    // Email invitees use a negative synthetic id — still a valid assignment.
    reviewerId > 0 || hasEmailInvite,
    { review, reviewerId }
  );

  const myReviewerRow =
    review && Array.isArray(review.reviewers)
      ? review.reviewers.find(
          (r) => Number(r.id) === Number(currentUserId)
        )
      : null;
  const myVote = myReviewerRow ? myReviewerRow.status : review?.status;
  const myApproved = myVote === 'approved';
  const myChangesRequested = myVote === 'changes_requested';
  const postAuthorId = useSelect(
    (sel) => sel('core/editor').getEditedPostAttribute('author'),
    []
  );
  const isPostAuthor = Number(postAuthorId) === Number(currentUserId);

  const approve = useCallback(async () => {
    if (!review) return;
    setLoading(true);
    try {
      const data = await apiFetch({ url: `${restUrl}/reviews/${review.id}/approve`, method: 'POST' });
      if (data) setReview(data);
      createSuccessNotice(__('✔ Approval recorded.', 'jumplinks-editorial-workflow'), { type: 'snackbar', isDismissible: true });
    } catch (err) {
      createErrorNotice(err?.message || __('Failed to approve.', 'jumplinks-editorial-workflow'), { isDismissible: true });
    } finally {
      setLoading(false);
    }
  }, [review]); // eslint-disable-line react-hooks/exhaustive-deps

  const requestChanges = useCallback(async () => {
    if (!review) return;
    setLoading(true);
    try {
      const data = await apiFetch({ url: `${restUrl}/reviews/${review.id}/request-changes`, method: 'POST' });
      if (data) setReview(data);
      createSuccessNotice(__('✔ Changes requested.', 'jumplinks-editorial-workflow'), { type: 'snackbar', isDismissible: true });
    } catch (err) {
      createErrorNotice(err?.message || __('Failed to request changes.', 'jumplinks-editorial-workflow'), { isDismissible: true });
    } finally {
      setLoading(false);
    }
  }, [review]); // eslint-disable-line react-hooks/exhaustive-deps

  const revokeApproval = useCallback(async () => {
    if (!review) return;
    setLoading(true);
    try {
      const data = await apiFetch({ url: `${restUrl}/reviews/${review.id}/revoke-approval`, method: 'POST' });
      if (data) setReview(data);
      createSuccessNotice(__('Approval revoked.', 'jumplinks-editorial-workflow'), { type: 'snackbar', isDismissible: true });
    } catch (err) {
      createErrorNotice(err?.message || __('Failed to revoke approval.', 'jumplinks-editorial-workflow'), { isDismissible: true });
    } finally {
      setLoading(false);
    }
  }, [review]); // eslint-disable-line react-hooks/exhaustive-deps

  const resubmit = useCallback(async () => {
    if (!review) return;
    setLoading(true);
    try {
      const data = await apiFetch({ url: `${restUrl}/reviews/${review.id}/resubmit`, method: 'POST' });
      if (data) setReview(data);
      createSuccessNotice(__('✔ Resubmitted for review.', 'jumplinks-editorial-workflow'), { type: 'snackbar', isDismissible: true });
    } catch (err) {
      createErrorNotice(err?.message || __('Failed to resubmit.', 'jumplinks-editorial-workflow'), { isDismissible: true });
    } finally {
      setLoading(false);
    }
  }, [review]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendForReview = useCallback(async () => {
    if (!review) return;
    setLoading(true);
    try {
      // Only downgrade unpublished drafts to "pending" \u2014 a live post that
      // gets sent for a follow-up review must stay published.
      if (postStatus !== 'publish') {
        await editPost({ status: 'pending' });
      }
      await savePost();
      const data = await apiFetch({ url: `${restUrl}/reviews/${review.id}/send`, method: 'POST' });
      setReview(data);
      createSuccessNotice(__('✔ Post sent for review.', 'jumplinks-editorial-workflow'), { type: 'snackbar', isDismissible: true });
    } catch (err) {
      createErrorNotice(err?.message || __('Failed to send for review.', 'jumplinks-editorial-workflow'), { isDismissible: true });
    } finally {
      setLoading(false);
    }
  }, [review, postStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const reviewerFieldSlot = applyFilters('flow_ew_reviewer_field_slot', null, { review, loading, setReview, setLoading, restUrl });
  const reviewerFieldExtras = applyFilters('flow_ew_reviewer_field_extras', null, { review, loading, setReview, setLoading, restUrl });
  const sendDisabled = applyFilters(
    'flow_ew_send_for_review_disabled',
    !hasReviewer || loading,
    { review, loading, hasReviewer }
  );
  const sendDisabledHint = applyFilters(
    'flow_ew_send_for_review_disabled_hint',
    '',
    { review, loading, hasReviewer }
  );

  // WP reviewer roles/users empty — External Email may still be available.
  const noReviewers =
    currentUserCan.assignReviewer && !!flowEW.noReviewers;
  const isAlreadyPublished = postStatus === 'publish';
  const publishBlocked = isPublishBlocked({
    reviewMandatory: flowEW.reviewMandatory,
    isPublished: isAlreadyPublished,
    review,
    reviewerMeta: flowEW.reviewerMeta,
  });
  const showReviewNotice =
    currentUserCan.assignReviewer &&
    ((noReviewers && !flowEW.reviewMandatory) || publishBlocked);

  return (
    <>
      {showReviewNotice && (
        <ReviewModeNotice
          reviewMandatory={flowEW.reviewMandatory}
          publishBlocked={publishBlocked}
          noReviewers={noReviewers}
        />
      )}

      {currentUserCan.assignReviewer && flowEW.openReviewEnabled && (
        <OpenReviewControl
          review={review}
          loading={loading}
          setReview={setReview}
          setLoading={setLoading}
          restUrl={restUrl}
          createErrorNotice={createErrorNotice}
        />
      )}

      {currentUserCan.assignReviewer &&
        (reviewerFieldSlot || <ReviewerField />)}

      {reviewerFieldExtras}

      <PanelRow>
        <div className="flow-ew-actions">
          {isPendingSend && currentUserCan.assignReviewer && (
            <>
              <Button
                variant="primary"
                onClick={sendForReview}
                disabled={sendDisabled}
                isBusy={loading}
                className="flow-ew-actions__btn"
              >
                {i18n.sendForReview}
              </Button>
              {sendDisabled && sendDisabledHint && (
                <p className="flow-ew-actions__hint">{sendDisabledHint}</p>
              )}
            </>
          )}
          {isChangesRequested && isPostAuthor && (
            <Button
              variant="primary"
              onClick={resubmit}
              disabled={loading}
              isBusy={loading}
              className="flow-ew-actions__btn"
            >
              {i18n.resubmit}
            </Button>
          )}

          {isInReview && isReviewer && currentUserCan.reviewPosts && (
            myApproved ? (
              <Button
                variant="secondary"
                onClick={revokeApproval}
                disabled={loading}
                isBusy={loading}
                className="flow-ew-actions__btn"
              >
                {__('Revoke Approval', 'jumplinks-editorial-workflow')}
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  onClick={approve}
                  disabled={loading}
                  isBusy={loading}
                  className="flow-ew-actions__btn flow-ew-actions__btn--approve"
                >
                  {i18n.approve}
                </Button>
                <Button
                  variant="secondary"
                  isDestructive
                  onClick={requestChanges}
                  disabled={loading || myChangesRequested}
                  isBusy={loading}
                  className="flow-ew-actions__btn"
                >
                  {i18n.requestChanges}
                </Button>
              </>
            )
          )}

          {review?.revision_preview_url &&
            (review.status !== 'pending' || !!review.is_open) && (
            <RevisionShareBar url={review.revision_preview_url} />
          )}
        </div>
      </PanelRow>
    </>
  );
}
