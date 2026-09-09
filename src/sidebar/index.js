import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useSelect, useDispatch, subscribe, select } from '@wordpress/data';
import { useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { applyFilters } from '@wordpress/hooks';
import { STORE_NAME, STATUS_LABELS, statusThemeStyle } from './store';
import FlowReviewPanel from './components/FlowReviewPanel';
import PublishGuard from './components/PublishGuard';
import FlowReviewerInfoPanel from './components/FlowReviewerInfoPanel';
import '../shared/share-bar.css';
import './index.css';

const { flowEW } = window;
const { restUrl, nonce, postId, i18n } = flowEW;

apiFetch.use(apiFetch.createNonceMiddleware(nonce));

function applyReviewPayload(reviewerList, reviewPayload, setReviewers, setReview) {
  const reviewers = Array.isArray(reviewerList) ? reviewerList : [];
  setReviewers(reviewers);

  if (reviewPayload === undefined) {
    return;
  }

  let next = reviewPayload;
  if (next && next.reviewer && next.reviewer.id) {
    const found = reviewers.find((u) => u.id === Number(next.reviewer.id));
    if (found) {
      next = { ...next, reviewer: found };
    }
  }
  setReview(next ?? null);
}

function FlowDataLoader() {
  const { setReviewers, setReview } = useDispatch(STORE_NAME);

  const loadReviewData = useCallback(() => {
    Promise.all([
      apiFetch({ url: `${restUrl}/reviewers?post_id=${postId}` }).catch(() => []),
      apiFetch({ url: `${restUrl}/reviews/${postId}` }).catch(() => undefined),
    ])
      .then(([reviewerList, reviewPayload]) => {
        applyReviewPayload(reviewerList, reviewPayload, setReviewers, setReview);
      })
      .catch(() => {});
  }, [postId, restUrl, setReview, setReviewers]);

  useEffect(() => {
    loadReviewData();
  }, [loadReviewData]);

  useEffect(() => {
    let prevSaving = select('core/editor').isSavingPost();
    let prevAutosaving = select('core/editor').isAutosavingPost();
    let debounceTimer;

    const scheduleReload = () => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        loadReviewData();
      }, 400);
    };

    const unsub = subscribe(() => {
      const saving = select('core/editor').isSavingPost();
      const autosaving = select('core/editor').isAutosavingPost();
      if ((prevSaving && !saving) || (prevAutosaving && !autosaving)) {
        scheduleReload();
      }
      prevSaving = saving;
      prevAutosaving = autosaving;
    });

    return () => {
      unsub();
      clearTimeout(debounceTimer);
    };
  }, [loadReviewData]);

  return null;
}

function FlowReviewRoot() {
  const review = useSelect((sel) => sel(STORE_NAME).getReview(), []);
  const displayStatus = review ? (review.display_status || review.status) : null;
  const statusLabel = displayStatus ? (STATUS_LABELS[displayStatus] || null) : null;
  const panelTitle = statusLabel ? (
    <span className="flow-ew-panel-title">
      {i18n.reviewPanelTitle}
      <span
        className="flow-ew-panel-title__badge"
        style={statusThemeStyle(displayStatus)}
      >
        <span className="flow-ew-badge__dot" aria-hidden="true" />
        {statusLabel}
      </span>
    </span>
  ) : i18n.reviewPanelTitle;

  const queueBadge = applyFilters('flow_ew_sidebar_queue_badge', null);

  return (
    <>
      <FlowDataLoader />
      <PublishGuard />
      <PluginDocumentSettingPanel
        name="flow-ew-review"
        title={panelTitle}
        className="flow-ew-review-panel"
        initialOpen
      >
        {queueBadge}
        <FlowReviewPanel />
      </PluginDocumentSettingPanel>
    </>
  );
}

registerPlugin('flow-ew-review-panel', { render: FlowReviewRoot });
registerPlugin('flow-ew-reviewer-info', { render: FlowReviewerInfoPanel });
