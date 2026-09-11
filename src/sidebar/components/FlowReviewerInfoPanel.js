import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useMemo, useCallback } from '@wordpress/element';
import {
  Button,
  ComboboxControl,
  Dropdown,
  Spinner,
  __experimentalHStack as HStack,
} from '@wordpress/components';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { PluginPostStatusInfo } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { STORE_NAME } from '../store';

const { flowEW } = window;
const { restUrl, postId, currentUserCan, i18n } = flowEW;

export default function FlowReviewerInfoPanel() {
  const review = useSelect((sel) => sel(STORE_NAME).getReview(), []);
  const reviewers = useSelect((sel) => sel(STORE_NAME).getReviewers(), []);
  const { setReview } = useDispatch(STORE_NAME);
  const { createSuccessNotice, createErrorNotice } = useDispatch(noticesStore);

  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [filterValue, setFilterValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const reviewerId = review ? Number(review.reviewer?.id || review.reviewer_id) : 0;
  const reviewerData = reviewerId
    ? (review.reviewer || reviewers.find((u) => u.id === reviewerId) || null)
    : null;

  const canAssign = currentUserCan.assignReviewer;

  const popoverProps = useMemo(() => ({
    anchor: popoverAnchor,
    placement: 'left-start',
    offset: 36,
    shift: true,
  }), [popoverAnchor]);

  const reviewerOptions = useMemo(
    () => reviewers.map((u) => ({ value: String(u.id), label: u.name })),
    [reviewers]
  );

  const filteredOptions = useMemo(() => {
    if (!filterValue) return reviewerOptions;
    const lower = filterValue.toLowerCase();
    return reviewerOptions.filter((o) => o.label.toLowerCase().includes(lower));
  }, [reviewerOptions, filterValue]);

  const handleSelect = useCallback(async (val, onClose) => {
    if (!val) return;
    const newId = Number(val);
    if (newId === reviewerId) { onClose(); return; }
    setIsSaving(true);
    try {
      const data = await apiFetch({
        url: `${restUrl}/reviews`,
        method: 'POST',
        data: { post_id: postId, reviewer_id: newId },
      });
      setReview(data);
      setFilterValue('');
      onClose();
      createSuccessNotice(__('✔ Reviewer updated.', 'jumplinks-editorial-workflow'), { type: 'snackbar', isDismissible: true });
    } catch (err) {
      createErrorNotice(err?.message || __('Failed to update reviewer.', 'jumplinks-editorial-workflow'), { isDismissible: true });
    } finally {
      setIsSaving(false);
    }
  }, [reviewerId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!reviewerData) return null;

  return (
    <PluginPostStatusInfo>
      <div ref={setPopoverAnchor} style={{ width: '100%' }}>
        <HStack className="editor-post-panel__row">
          <div className="editor-post-panel__row-label">{i18n.reviewer}</div>
          <div className="editor-post-panel__row-control">
            {canAssign ? (
              <Dropdown
                popoverProps={popoverProps}
                contentClassName="editor-post-author__panel-dialog"
                focusOnMount
                renderToggle={({ isOpen, onToggle }) => (
                  <Button
                    size="compact"
                    variant="tertiary"
                    className="editor-post-author__panel-toggle"
                    aria-expanded={isOpen}
                    onClick={onToggle}
                  >
                    {reviewerData.name || reviewerData.email}
                  </Button>
                )}
                renderContent={({ onClose }) => (
                  <div className="editor-post-author">
                    <InspectorPopoverHeader
                      title={i18n.reviewer}
                      onClose={onClose}
                    />
                    <div style={{ padding: '0 16px 16px' }}>
                      <ComboboxControl
                        __nextHasNoMarginBottom
                        __next40pxDefaultSize
                        label={i18n.selectReviewer}
                        hideLabelFromVision
                        value={String(reviewerId)}
                        options={reviewerOptions}
                        filteredOptions={filteredOptions}
                        onFilterValueChange={setFilterValue}
                        onChange={(val) => handleSelect(val, onClose)}
                        disabled={isSaving}
                      />
                      {isSaving && <Spinner />}
                    </div>
                  </div>
                )}
              />
            ) : (
              <Button
                size="compact"
                variant="tertiary"
                className="editor-post-author__panel-toggle"
                disabled
              >
                {reviewerData.name || reviewerData.email}
              </Button>
            )}
          </div>
        </HStack>
      </div>
    </PluginPostStatusInfo>
  );
}
