import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useMemo, useCallback } from '@wordpress/element';
import {
  PanelRow,
  ComboboxControl,
  TextControl,
  Button,
  Spinner,
  __experimentalHStack as HStack,
  __experimentalText as Text,
} from '@wordpress/components';
import { store as noticesStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import InviteLinkCopy from './InviteLinkCopy';
import { STORE_NAME } from '../store';

const { flowEW } = window;
const { restUrl, postId, currentUserCan, i18n } = flowEW;

const EMAIL_SENTINEL = 'email';
const INVITE_PREFIX = 'invite:';

// Prefer the server-localized string: the plugin ships PHP catalogs but no
// JS translation files, so a bare __() here would stay English.
const invalidEmailMessage = () =>
  i18n?.invalidEmail ||
  __('Please enter a valid email address.', 'jumplinks-editorial-workflow');

function isValidEmail( value ) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( ( value || '' ).trim() );
}

function inviteValue( email ) {
  return INVITE_PREFIX + String( email || '' ).trim().toLowerCase();
}

function parseInviteValue( val ) {
  if ( typeof val !== 'string' || ! val.startsWith( INVITE_PREFIX ) ) {
    return '';
  }
  return val.slice( INVITE_PREFIX.length );
}

function isInviteOptionValue( val ) {
  return (
    val === EMAIL_SENTINEL ||
    ( typeof val === 'string' && val.startsWith( INVITE_PREFIX ) )
  );
}

/**
 * WordPress ComboboxControl ignores `filteredOptions` and only keeps options
 * whose `label` contains the typed input. The invite row label must therefore
 * equal (or contain) the current filter text whenever the user is typing an email.
 */
export default function ReviewerField() {
  const review = useSelect((sel) => sel(STORE_NAME).getReview(), []);
  const reviewers = useSelect((sel) => sel(STORE_NAME).getReviewers(), []);
  const { setReview } = useDispatch(STORE_NAME);
  const { createSuccessNotice, createErrorNotice } = useDispatch(noticesStore);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [emailMode, setEmailMode] = useState(false);

  const inviteEmail = review?.invite_email || review?.reviewer?.email || '';
  const isEmailReviewer = !!(
    inviteEmail ||
    review?.reviewer?.is_email
  );
  const reviewerId = review && !isEmailReviewer
    ? Number(review.reviewer?.id || review.reviewer_id || 0)
    : 0;
  const reviewerData = isEmailReviewer
    ? {
        name: review?.reviewer?.name || inviteEmail,
        email: inviteEmail,
        is_email: true,
        avatar_url: review?.reviewer?.avatar_url || '',
      }
    : reviewerId
      ? (review.reviewer || reviewers.find((u) => u.id === reviewerId) || null)
      : null;
  const hasReviewer = !!reviewerData;
  const canAssign = currentUserCan.assignReviewer;

  const reviewId = review?.id || 0;
  const reviewStatus = review?.status || '';
  const canCopyInvite =
    canAssign && isEmailReviewer && reviewId > 0 && '' !== reviewStatus && 'pending' !== reviewStatus;
  const showCombobox = canAssign && (!hasReviewer || isEditing);

  const userOptions = useMemo(
    () =>
      reviewers
        .filter((u) => String(u.id) !== EMAIL_SENTINEL && !u.is_email)
        .map((u) => ({ value: String(u.id), label: u.name })),
    [reviewers]
  );

  // No WP reviewers available — skip the External Email pick step.
  const emailOnly = userOptions.length === 0;
  const inEmailMode = emailMode || emailOnly;

  const externalEmailLabel =
    i18n?.externalEmail ||
    __('External Email', 'jumplinks-editorial-workflow');

  const comboboxOptions = useMemo(() => {
    // Combobox is only used to pick a WP user or "External Email".
    // Email typing uses TextControl (no autocomplete while composing).
    return [
      { value: EMAIL_SENTINEL, label: externalEmailLabel },
      ...userOptions,
    ];
  }, [userOptions, externalEmailLabel]);

  const renderSuggestion = useCallback(
    ({ item }) => {
      if (item.value === EMAIL_SENTINEL) {
        return <strong>{item.label}</strong>;
      }
      return item.label;
    },
    []
  );

  const inviteSuggestionLabel = useMemo(() => {
    const trimmed = (filterValue || '').trim();
    if (!isValidEmail(trimmed)) {
      return '';
    }
    return sprintf(
      /* translators: %s: valid email address */
      i18n?.inviteEmail ||
        __('Invite %s', 'jumplinks-editorial-workflow'),
      trimmed
    );
  }, [filterValue]);

  const assignEmail = useCallback(
    async (email) => {
      const trimmed = (email || '').trim().toLowerCase();
      if (!isValidEmail(trimmed)) {
        createErrorNotice(invalidEmailMessage(), {
          type: 'snackbar',
          isDismissible: true,
        });
        return;
      }
      setIsSaving(true);
      try {
        const data = await apiFetch({
          url: `${restUrl}/reviews`,
          method: 'POST',
          data: { post_id: postId, invite_email: trimmed },
        });
        setReview(data);
        setIsEditing(false);
        setEmailMode(false);
        setFilterValue('');
        createSuccessNotice(
          __('✔ Email reviewer assigned.', 'jumplinks-editorial-workflow'),
          { type: 'snackbar', isDismissible: true }
        );
      } catch (err) {
        createErrorNotice(
          err?.message ||
            __('Failed to assign reviewer.', 'jumplinks-editorial-workflow'),
          { type: 'snackbar', isDismissible: true }
        );
      } finally {
        setIsSaving(false);
      }
    },
    [setReview, createSuccessNotice, createErrorNotice]
  );

  const submitTypedEmail = useCallback(() => {
    const typed = (filterValue || '').trim();
    if (!typed) {
      return;
    }
    if (isValidEmail(typed)) {
      assignEmail(typed);
      return;
    }
    createErrorNotice(invalidEmailMessage(), {
      type: 'snackbar',
      isDismissible: true,
    });
  }, [filterValue, assignEmail, createErrorNotice]);

  const handleEmailKeyDown = useCallback(
    (event) => {
      if (event.key !== 'Enter' || !inEmailMode) {
        return;
      }
      const typed = (filterValue || '').trim();
      if (!typed) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      submitTypedEmail();
    },
    [inEmailMode, filterValue, submitTypedEmail]
  );

  const handleSelect = useCallback(
    async (val) => {
      if (!val) return;

      const invite = parseInviteValue(val);
      if (invite) {
        await assignEmail(invite);
        return;
      }

      if (val === EMAIL_SENTINEL) {
        const typed = (filterValue || '').trim();
        if (!typed) {
          setEmailMode(true);
          return;
        }
        if (isValidEmail(typed)) {
          await assignEmail(typed);
          return;
        }
        createErrorNotice(invalidEmailMessage(), {
          type: 'snackbar',
          isDismissible: true,
        });
        setEmailMode(true);
        return;
      }

      setEmailMode(false);
      const newId = Number(val);
      if (!newId || newId === reviewerId) {
        setIsEditing(false);
        return;
      }
      setIsSaving(true);
      try {
        const data = await apiFetch({
          url: `${restUrl}/reviews`,
          method: 'POST',
          data: { post_id: postId, reviewer_id: newId },
        });
        setReview(data);
        setIsEditing(false);
        setFilterValue('');
        createSuccessNotice(
          __('✔ Reviewer assigned.', 'jumplinks-editorial-workflow'),
          { type: 'snackbar', isDismissible: true }
        );
      } catch (err) {
        createErrorNotice(
          err?.message ||
            __('Failed to assign reviewer.', 'jumplinks-editorial-workflow'),
          { type: 'snackbar', isDismissible: true }
        );
      } finally {
        setIsSaving(false);
      }
    },
    [
      reviewerId,
      setReview,
      createSuccessNotice,
      createErrorNotice,
      assignEmail,
      filterValue,
    ]
  );

  const handleFilterChange = useCallback((value) => {
    setFilterValue(value);
    const trimmed = (value || '').trim();
    if (trimmed.includes('@') || isValidEmail(trimmed)) {
      setEmailMode(true);
    }
  }, []);

  const handleRemove = useCallback(async () => {
    if (!review) return;
    setIsSaving(true);
    try {
      const data = await apiFetch({
        url: `${restUrl}/reviews/${review.id}/cancel`,
        method: 'POST',
      });
      setReview(data || null);
      setIsEditing(false);
      setEmailMode(false);
      setFilterValue('');
      createSuccessNotice(
        __('✔ Reviewer removed.', 'jumplinks-editorial-workflow'),
        { type: 'snackbar', isDismissible: true }
      );
    } catch (err) {
      createErrorNotice(
        err?.message ||
          __('Failed to remove reviewer.', 'jumplinks-editorial-workflow'),
        { isDismissible: true }
      );
    } finally {
      setIsSaving(false);
    }
  }, [review, setReview, createSuccessNotice, createErrorNotice]);

  return (
    <PanelRow>
      <div style={{ width: '100%' }}>
        <HStack justify="space-between" className="flow-ew-label-row">
          <span className="flow-ew-field-label">{i18n.reviewer}</span>
          {canAssign && hasReviewer && (
            <Button
              variant="link"
              onClick={() => {
                setIsEditing((v) => !v);
                setFilterValue('');
                setEmailMode(false);
              }}
              className="flow-ew-link-btn"
            >
              {isEditing ? i18n.cancelEdit : i18n.editReviewer}
            </Button>
          )}
        </HStack>

        {hasReviewer && !isEditing && (
          <div className="flow-ew-reviewer-card">
            <div className="flow-ew-reviewer-card__main">
              {reviewerData.avatar_url && (
                <img
                  src={reviewerData.avatar_url}
                  alt=""
                  width={24}
                  height={24}
                  className="flow-ew-avatar"
                />
              )}
              <Text size="13" className="flow-ew-truncate">
                {reviewerData.name || reviewerData.email}
              </Text>
            </div>
            {canCopyInvite && <InviteLinkCopy reviewId={reviewId} />}
            {canAssign && (
              <Button
                icon="no-alt"
                label={i18n.removeReviewer}
                isSmall
                onClick={handleRemove}
                disabled={isSaving}
                className="flow-ew-reviewer-card__remove"
              />
            )}
          </div>
        )}

        {showCombobox && (
          <div
            className={
              inEmailMode
                ? 'flow-ew-reviewer-combobox flow-ew-reviewer-combobox--email'
                : 'flow-ew-reviewer-combobox'
            }
            onKeyDown={handleEmailKeyDown}
          >
            {inEmailMode ? (
              <>
                <TextControl
                  className="flow-ew-reviewer-combobox__control"
                  hideLabelFromVision
                  label={i18n.selectReviewer}
                  placeholder={__(
                    'name@example.com',
                    'jumplinks-editorial-workflow'
                  )}
                  value={filterValue}
                  onChange={handleFilterChange}
                  disabled={isSaving}
                  type="email"
                  autoComplete="email"
                  __next40pxDefaultSize
                  __nextHasNoMarginBottom
                />
                {inviteSuggestionLabel ? (
                  <Button
                    variant="secondary"
                    className="flow-ew-reviewer-invite-suggestion"
                    onClick={() => assignEmail(filterValue.trim())}
                    disabled={isSaving}
                  >
                    {inviteSuggestionLabel}
                  </Button>
                ) : null}
              </>
            ) : (
              <ComboboxControl
                className="flow-ew-reviewer-combobox__control"
                hideLabelFromVision
                label={i18n.selectReviewer}
                placeholder={
                  i18n.reviewerPlaceholder ||
                  __(
                    'assign a dedicated reviewer',
                    'jumplinks-editorial-workflow'
                  )
                }
                value={null}
                onChange={handleSelect}
                options={comboboxOptions}
                onFilterValueChange={handleFilterChange}
                __experimentalRenderItem={renderSuggestion}
                disabled={isSaving}
                __next40pxDefaultSize
                __nextHasNoMarginBottom
              />
            )}
            {isSaving && (
              <div className="flow-ew-spinner-overlay">
                <Spinner />
              </div>
            )}
          </div>
        )}
      </div>
    </PanelRow>
  );
}
