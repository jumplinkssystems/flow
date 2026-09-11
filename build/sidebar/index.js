/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/shared/is-publish-blocked.js"
/*!******************************************!*\
  !*** ./src/shared/is-publish-blocked.js ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isPublishBlocked: () => (/* binding */ isPublishBlocked)
/* harmony export */ });
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
function isPublishBlocked({
  reviewMandatory,
  isPublished,
  review,
  reviewerMeta = 0
}) {
  if (!reviewMandatory || isPublished) {
    return false;
  }
  if (review?.status !== 'approved') {
    return true;
  }
  return !hasAssignedReviewer(review, reviewerMeta);
}

/**
 * @param {object|null|undefined} review
 * @param {number} reviewerMeta
 */
function hasAssignedReviewer(review, reviewerMeta = 0) {
  const wpId = Number(review?.reviewer_id || 0);
  if (wpId > 0) {
    return true;
  }

  // Synthetic email ids are negative; still a real assignment.
  const reviewerObjId = Number(review?.reviewer?.id || 0);
  if (reviewerObjId !== 0) {
    return true;
  }
  if (Number(reviewerMeta || 0) > 0) {
    return true;
  }
  if (review?.invite_email || review?.reviewer?.is_email) {
    return true;
  }
  if (Array.isArray(review?.email_invites) && review.email_invites.length > 0) {
    return true;
  }
  return false;
}

/***/ },

/***/ "./src/shared/no-review-roles-notice.js"
/*!**********************************************!*\
  !*** ./src/shared/no-review-roles-notice.js ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NO_REVIEW_ROLES_DISMISS_ATTR: () => (/* binding */ NO_REVIEW_ROLES_DISMISS_ATTR),
/* harmony export */   NO_REVIEW_ROLES_DISMISS_VALUE: () => (/* binding */ NO_REVIEW_ROLES_DISMISS_VALUE),
/* harmony export */   dismissNoReviewRolesNotice: () => (/* binding */ dismissNoReviewRolesNotice),
/* harmony export */   isNoReviewRolesNoticeDismissed: () => (/* binding */ isNoReviewRolesNoticeDismissed)
/* harmony export */ });
/**
 * Persistence for the "No Review Roles Assigned" editor notice.
 * Kept separate from publish-guard notices so dismissing roles guidance
 * does not hide mandatory-publish warnings.
 */
const DISMISS_KEY = 'flow_ew_dismiss_no_review_roles';
function isNoReviewRolesNoticeDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch (_err) {
    return false;
  }
}
function dismissNoReviewRolesNotice() {
  try {
    window.localStorage.setItem(DISMISS_KEY, '1');
  } catch (_err) {
    // ignore
  }
}
const NO_REVIEW_ROLES_DISMISS_ATTR = 'data-flow-ew-dismiss';
const NO_REVIEW_ROLES_DISMISS_VALUE = 'no-review-roles';

/***/ },

/***/ "./src/shared/publish-guard-ui.js"
/*!****************************************!*\
  !*** ./src/shared/publish-guard-ui.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   applyPublishGuardControl: () => (/* binding */ applyPublishGuardControl),
/* harmony export */   findBricksPublishControl: () => (/* binding */ findBricksPublishControl),
/* harmony export */   getPublishGuardTooltip: () => (/* binding */ getPublishGuardTooltip),
/* harmony export */   publishGuardTooltipTarget: () => (/* binding */ publishGuardTooltipTarget),
/* harmony export */   syncGutenbergPublishGuardTooltips: () => (/* binding */ syncGutenbergPublishGuardTooltips),
/* harmony export */   syncPublishGuardTooltip: () => (/* binding */ syncPublishGuardTooltip)
/* harmony export */ });
/**
 * Shared publish-guard UI helpers (opacity lock + hover tooltip).
 */

function getPublishGuardTooltip() {
  const i18n = window.flowEW?.i18n || {};
  return i18n.publishGuardTooltip || 'Post can go live only after approval by a reviewer.';
}

/**
 * @param {Element|null|undefined} el
 * @returns {Element|null}
 */
function publishGuardTooltipTarget(el) {
  if (!el || !el.closest) {
    return null;
  }
  if (el.id === 'publish') {
    return el.closest('#publishing-action') || el.parentElement || el;
  }
  const panelToggle = el.closest('.editor-post-publish-panel__toggle, .editor-post-schedule__panel-dropdown');
  if (panelToggle) {
    return panelToggle;
  }
  return el.parentElement || el;
}

/**
 * @param {Element|null|undefined} el
 * @param {boolean} blocked
 */
function applyPublishGuardControl(el, blocked) {
  if (!el) {
    return;
  }
  const hint = getPublishGuardTooltip();
  const tooltipEl = publishGuardTooltipTarget(el);
  if (blocked) {
    el.style.opacity = '0.4';
    el.style.pointerEvents = 'none';
    el.style.cursor = 'not-allowed';
    if (tooltipEl) {
      tooltipEl.setAttribute('title', hint);
      tooltipEl.style.cursor = 'not-allowed';
      tooltipEl.dataset.flowEwPublishGuardTooltip = '1';
    }
    return;
  }
  el.style.opacity = '';
  el.style.pointerEvents = '';
  el.style.cursor = '';
  if (tooltipEl?.dataset.flowEwPublishGuardTooltip === '1') {
    tooltipEl.removeAttribute('title');
    tooltipEl.style.cursor = '';
    delete tooltipEl.dataset.flowEwPublishGuardTooltip;
  }
}
const GUTENBERG_TOOLTIP_SELECTORS = ['.edit-post-header .editor-post-publish-panel__toggle', '.edit-post-header .editor-post-publish-button'];

/**
 * @param {boolean} blocked
 */
function syncGutenbergPublishGuardTooltips(blocked) {
  const hint = getPublishGuardTooltip();
  GUTENBERG_TOOLTIP_SELECTORS.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      if (blocked) {
        el.setAttribute('title', hint);
        el.style.cursor = 'not-allowed';
        el.dataset.flowEwPublishGuardTooltip = '1';
        return;
      }
      if (el.dataset.flowEwPublishGuardTooltip === '1') {
        el.removeAttribute('title');
        el.style.cursor = '';
        delete el.dataset.flowEwPublishGuardTooltip;
      }
    });
  });
}

/**
 * @param {Element|null|undefined} el
 * @param {boolean} blocked
 */
function syncPublishGuardTooltip(el, blocked) {
  if (!el) {
    return;
  }
  const hint = getPublishGuardTooltip();
  if (blocked) {
    el.setAttribute('title', hint);
    el.dataset.flowEwPublishGuardTooltip = '1';
    return;
  }
  if (el.dataset.flowEwPublishGuardTooltip === '1') {
    el.removeAttribute('title');
    delete el.dataset.flowEwPublishGuardTooltip;
  }
}

/** @returns {Element|null} */
function findBricksPublishControl() {
  return document.querySelector('#bricks-toolbar li:has([data-name="publish"])');
}

/***/ },

/***/ "./src/shared/share-bar-icons.js"
/*!***************************************!*\
  !*** ./src/shared/share-bar-icons.js ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ShareBarIcon: () => (/* binding */ ShareBarIcon),
/* harmony export */   shareBarIconHtml: () => (/* binding */ shareBarIconHtml)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);

/** @typedef {'copy' | 'copied' | 'external'} ShareBarIconName */

const iconClass = 'flow-ew-share-icon';
const svgAttrs = ' viewBox="0 0 24 24" aria-hidden="true"';

/** Figma 24px Icon/regular-copy (Frame 38). */
const figmaCopyPath = 'M18 0H8C6.897 0 6 0.897 6 2V6H2C0.897 6 0 6.897 0 8V18C0 19.103 0.897 20 2 20H12C13.103 20 14 19.103 14 18V14H18C19.103 14 20 13.103 20 12V2C20 0.897 19.103 0 18 0ZM2 18V8H12L12.002 18H2ZM18 12H14V8C14 6.897 13.103 6 12 6H8V2H18V12Z';

/** Figma 24px Icon/regular-arrow-up-right-stroke (Frame 38). */
const figmaExternalPath = 'M9.71 9V0H0.71V2H6.3L0 8.29L1.42 9.71L7.71 3.41V9H9.71Z';

/**
 * @param {ShareBarIconName} name
 * @returns {string}
 */
function shareBarIconHtml(name) {
  if (name === 'copied') {
    return '<svg class="' + iconClass + ' flow-ew-share-icon--copied"' + svgAttrs + '>' + '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>' + '</svg>';
  }
  if (name === 'external') {
    return '<svg class="' + iconClass + ' flow-ew-share-icon--external"' + svgAttrs + ' xmlns="http://www.w3.org/2000/svg">' + '<path fill="currentColor" d="' + figmaExternalPath + '" transform="translate(7.145 7.145)"/>' + '</svg>';
  }
  return '<svg class="' + iconClass + ' flow-ew-share-icon--copy"' + svgAttrs + ' xmlns="http://www.w3.org/2000/svg">' + '<path fill="currentColor" d="' + figmaCopyPath + '" transform="translate(2 2)"/>' + '</svg>';
}

/**
 * @param {ShareBarIconName} name
 */
function ShareBarIcon({
  name
}) {
  if (name === 'copied') {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", {
      className: `${iconClass} flow-ew-share-icon--copied`,
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        d: "M5 13l4 4L19 7"
      })
    });
  }
  if (name === 'external') {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", {
      className: `${iconClass} flow-ew-share-icon--external`,
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      xmlns: "http://www.w3.org/2000/svg",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
        fill: "currentColor",
        d: figmaExternalPath,
        transform: "translate(7.145 7.145)"
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("svg", {
    className: `${iconClass} flow-ew-share-icon--copy`,
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
    xmlns: "http://www.w3.org/2000/svg",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx)("path", {
      fill: "currentColor",
      d: figmaCopyPath,
      transform: "translate(2 2)"
    })
  });
}

/***/ },

/***/ "./src/shared/should-show-send-for-review.js"
/*!***************************************************!*\
  !*** ./src/shared/should-show-send-for-review.js ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   hasUnsentReviewers: () => (/* binding */ hasUnsentReviewers),
/* harmony export */   shouldShowSendForReview: () => (/* binding */ shouldShowSendForReview)
/* harmony export */ });
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
function hasUnsentReviewers(review) {
  if (!review) {
    return false;
  }
  const rows = Array.isArray(review.reviewers) ? review.reviewers : [];
  if (rows.length === 0) {
    return false;
  }
  return rows.some(row => String(row?.status || 'pending') === 'pending');
}

/**
 * Show the Send for review CTA when the review has never been sent, or when
 * newly assigned reviewers still need a send.
 *
 * @param {object|null|undefined} review
 * @return {boolean}
 */
function shouldShowSendForReview(review) {
  if (!review) {
    return false;
  }
  return review.status === 'pending' || hasUnsentReviewers(review);
}

/***/ },

/***/ "./src/shared/status-labels.js"
/*!*************************************!*\
  !*** ./src/shared/status-labels.js ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   STATUS_LABELS: () => (/* binding */ STATUS_LABELS),
/* harmony export */   statusLabel: () => (/* binding */ statusLabel)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/**
 * Unified review status labels — keep in sync with Review::status_labels() in PHP.
 */

const STATUS_LABELS = {
  pending: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Pending Review', 'jumplinks-editorial-workflow'),
  in_review: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('In Review', 'jumplinks-editorial-workflow'),
  changes_requested: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Changes Requested', 'jumplinks-editorial-workflow'),
  approved: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Approved', 'jumplinks-editorial-workflow'),
  open_review: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Open Review', 'jumplinks-editorial-workflow')
};

/** @param {string|undefined|null} status */
function statusLabel(status) {
  return status && STATUS_LABELS[status] || status || '';
}

/***/ },

/***/ "./src/shared/status-themes.js"
/*!*************************************!*\
  !*** ./src/shared/status-themes.js ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   STATUS_COLORS: () => (/* binding */ STATUS_COLORS),
/* harmony export */   STATUS_THEMES: () => (/* binding */ STATUS_THEMES),
/* harmony export */   statusTextColor: () => (/* binding */ statusTextColor),
/* harmony export */   statusThemeStyle: () => (/* binding */ statusThemeStyle)
/* harmony export */ });
/**
 * Unified review status colors — single source of truth for JS surfaces.
 * Keep in sync with assets/css/status-themes.css and src/review-page/_tokens.scss.
 */
const STATUS_THEMES = {
  open_review: {
    bg: '#dff4ff',
    text: '#1579a5',
    border: '#b6e6ff'
  },
  approved: {
    bg: '#e7f5e4',
    text: '#458037',
    border: '#cae8c4'
  },
  in_review: {
    bg: '#fcf0ce',
    text: '#957500',
    border: '#f2dda4'
  },
  changes_requested: {
    bg: '#ffebea',
    text: '#c92122',
    border: '#ffd1d0'
  },
  pending: {
    bg: '#e6f3f5',
    text: '#5e777b',
    border: '#cde3e7'
  }
};

/** @param {string|undefined|null} status */
function statusThemeStyle(status) {
  const theme = status ? STATUS_THEMES[status] : null;
  if (!theme) {
    return {};
  }
  return {
    '--flow-status-bg': theme.bg,
    '--flow-status-text': theme.text,
    '--flow-status-border': theme.border,
    '--flow-badge-color': theme.text
  };
}

/** @param {string|undefined|null} status */
function statusTextColor(status) {
  return status && STATUS_THEMES[status]?.text || '#666';
}

/** Text colors only — backward compat for callers that only need the accent. */
const STATUS_COLORS = Object.fromEntries(Object.entries(STATUS_THEMES).map(([key, theme]) => [key, theme.text]));

/***/ },

/***/ "./src/sidebar/components/FlowReviewPanel.js"
/*!***************************************************!*\
  !*** ./src/sidebar/components/FlowReviewPanel.js ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ FlowReviewPanel)
/* harmony export */ });
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_notices__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/notices */ "@wordpress/notices");
/* harmony import */ var _wordpress_notices__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_notices__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/api-fetch */ "@wordpress/api-fetch");
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/hooks */ "@wordpress/hooks");
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _store__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../store */ "./src/sidebar/store.js");
/* harmony import */ var _shared_is_publish_blocked__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../shared/is-publish-blocked */ "./src/shared/is-publish-blocked.js");
/* harmony import */ var _shared_should_show_send_for_review__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../shared/should-show-send-for-review */ "./src/shared/should-show-send-for-review.js");
/* harmony import */ var _ReviewerField__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./ReviewerField */ "./src/sidebar/components/ReviewerField.js");
/* harmony import */ var _RevisionShareBar__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./RevisionShareBar */ "./src/sidebar/components/RevisionShareBar.js");
/* harmony import */ var _OpenReviewControl__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./OpenReviewControl */ "./src/sidebar/components/OpenReviewControl.js");
/* harmony import */ var _ReviewModeNotice__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./ReviewModeNotice */ "./src/sidebar/components/ReviewModeNotice.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__);















const {
  flowEW
} = window;
const {
  restUrl,
  currentUserId,
  currentUserCan,
  i18n
} = flowEW;
function FlowReviewPanel() {
  const review = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(sel => sel(_store__WEBPACK_IMPORTED_MODULE_7__.STORE_NAME).getReview(), []);
  const loading = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(sel => sel(_store__WEBPACK_IMPORTED_MODULE_7__.STORE_NAME).isLoading(), []);
  const postStatus = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(sel => sel('core/editor').getEditedPostAttribute('status'), []);
  const {
    setReview,
    setLoading
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_store__WEBPACK_IMPORTED_MODULE_7__.STORE_NAME);
  const {
    editPost,
    savePost
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)('core/editor');
  const {
    createSuccessNotice,
    createErrorNotice
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_wordpress_notices__WEBPACK_IMPORTED_MODULE_3__.store);
  const isInReview = review?.status === 'in_review';
  // Fresh review, or newly assigned reviewers that still need a send.
  const isPendingSend = (0,_shared_should_show_send_for_review__WEBPACK_IMPORTED_MODULE_9__.shouldShowSendForReview)(review);
  const isChangesRequested = review?.status === 'changes_requested' && !review?.has_pending_reviewers;
  const reviewerId = review ? Number(review.reviewer?.id || review.reviewer_id) : 0;
  const isReviewer = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__.applyFilters)('flow_ew_is_reviewer', review ? reviewerId === currentUserId : false, {
    review,
    currentUserId
  });
  const hasEmailInvite = !!(review && (review.invite_email || review.reviewer?.is_email || Array.isArray(review.email_invites) && review.email_invites.length > 0));
  const hasReviewer = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__.applyFilters)('flow_ew_has_reviewer',
  // Email invitees use a negative synthetic id — still a valid assignment.
  reviewerId > 0 || hasEmailInvite, {
    review,
    reviewerId
  });
  const myReviewerRow = review && Array.isArray(review.reviewers) ? review.reviewers.find(r => Number(r.id) === Number(currentUserId)) : null;
  const myVote = myReviewerRow ? myReviewerRow.status : review?.status;
  const myApproved = myVote === 'approved';
  const myChangesRequested = myVote === 'changes_requested';
  const postAuthorId = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(sel => sel('core/editor').getEditedPostAttribute('author'), []);
  const isPostAuthor = Number(postAuthorId) === Number(currentUserId);
  const approve = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async () => {
    if (!review) return;
    setLoading(true);
    try {
      const data = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5___default()({
        url: `${restUrl}/reviews/${review.id}/approve`,
        method: 'POST'
      });
      if (data) setReview(data);
      createSuccessNotice((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('✔ Approval recorded.', 'jumplinks-editorial-workflow'), {
        type: 'snackbar',
        isDismissible: true
      });
    } catch (err) {
      createErrorNotice(err?.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Failed to approve.', 'jumplinks-editorial-workflow'), {
        isDismissible: true
      });
    } finally {
      setLoading(false);
    }
  }, [review]); // eslint-disable-line react-hooks/exhaustive-deps

  const requestChanges = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async () => {
    if (!review) return;
    setLoading(true);
    try {
      const data = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5___default()({
        url: `${restUrl}/reviews/${review.id}/request-changes`,
        method: 'POST'
      });
      if (data) setReview(data);
      createSuccessNotice((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('✔ Changes requested.', 'jumplinks-editorial-workflow'), {
        type: 'snackbar',
        isDismissible: true
      });
    } catch (err) {
      createErrorNotice(err?.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Failed to request changes.', 'jumplinks-editorial-workflow'), {
        isDismissible: true
      });
    } finally {
      setLoading(false);
    }
  }, [review]); // eslint-disable-line react-hooks/exhaustive-deps

  const revokeApproval = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async () => {
    if (!review) return;
    setLoading(true);
    try {
      const data = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5___default()({
        url: `${restUrl}/reviews/${review.id}/revoke-approval`,
        method: 'POST'
      });
      if (data) setReview(data);
      createSuccessNotice((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Approval revoked.', 'jumplinks-editorial-workflow'), {
        type: 'snackbar',
        isDismissible: true
      });
    } catch (err) {
      createErrorNotice(err?.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Failed to revoke approval.', 'jumplinks-editorial-workflow'), {
        isDismissible: true
      });
    } finally {
      setLoading(false);
    }
  }, [review]); // eslint-disable-line react-hooks/exhaustive-deps

  const resubmit = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async () => {
    if (!review) return;
    setLoading(true);
    try {
      const data = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5___default()({
        url: `${restUrl}/reviews/${review.id}/resubmit`,
        method: 'POST'
      });
      if (data) setReview(data);
      createSuccessNotice((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('✔ Resubmitted for review.', 'jumplinks-editorial-workflow'), {
        type: 'snackbar',
        isDismissible: true
      });
    } catch (err) {
      createErrorNotice(err?.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Failed to resubmit.', 'jumplinks-editorial-workflow'), {
        isDismissible: true
      });
    } finally {
      setLoading(false);
    }
  }, [review]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendForReview = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async () => {
    if (!review) return;
    setLoading(true);
    try {
      // Only downgrade unpublished drafts to "pending" \u2014 a live post that
      // gets sent for a follow-up review must stay published.
      if (postStatus !== 'publish') {
        await editPost({
          status: 'pending'
        });
      }
      await savePost();
      const data = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5___default()({
        url: `${restUrl}/reviews/${review.id}/send`,
        method: 'POST'
      });
      setReview(data);
      createSuccessNotice((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('✔ Post sent for review.', 'jumplinks-editorial-workflow'), {
        type: 'snackbar',
        isDismissible: true
      });
    } catch (err) {
      createErrorNotice(err?.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Failed to send for review.', 'jumplinks-editorial-workflow'), {
        isDismissible: true
      });
    } finally {
      setLoading(false);
    }
  }, [review, postStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const reviewerFieldSlot = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__.applyFilters)('flow_ew_reviewer_field_slot', null, {
    review,
    loading,
    setReview,
    setLoading,
    restUrl
  });
  const reviewerFieldExtras = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__.applyFilters)('flow_ew_reviewer_field_extras', null, {
    review,
    loading,
    setReview,
    setLoading,
    restUrl
  });
  const sendDisabled = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__.applyFilters)('flow_ew_send_for_review_disabled', !hasReviewer || loading, {
    review,
    loading,
    hasReviewer
  });
  const sendDisabledHint = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__.applyFilters)('flow_ew_send_for_review_disabled_hint', '', {
    review,
    loading,
    hasReviewer
  });

  // WP reviewer roles/users empty — External Email may still be available.
  const noReviewers = currentUserCan.assignReviewer && !!flowEW.noReviewers;
  const isAlreadyPublished = postStatus === 'publish';
  const publishBlocked = (0,_shared_is_publish_blocked__WEBPACK_IMPORTED_MODULE_8__.isPublishBlocked)({
    reviewMandatory: flowEW.reviewMandatory,
    isPublished: isAlreadyPublished,
    review,
    reviewerMeta: flowEW.reviewerMeta
  });
  const showReviewNotice = currentUserCan.assignReviewer && (noReviewers && !flowEW.reviewMandatory || publishBlocked);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.Fragment, {
    children: [showReviewNotice && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_ReviewModeNotice__WEBPACK_IMPORTED_MODULE_13__["default"], {
      reviewMandatory: flowEW.reviewMandatory,
      publishBlocked: publishBlocked,
      noReviewers: noReviewers
    }), currentUserCan.assignReviewer && flowEW.openReviewEnabled && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_OpenReviewControl__WEBPACK_IMPORTED_MODULE_12__["default"], {
      review: review,
      loading: loading,
      setReview: setReview,
      setLoading: setLoading,
      restUrl: restUrl,
      createErrorNotice: createErrorNotice
    }), currentUserCan.assignReviewer && (reviewerFieldSlot || /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_ReviewerField__WEBPACK_IMPORTED_MODULE_10__["default"], {})), reviewerFieldExtras, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.PanelRow, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsxs)("div", {
        className: "flow-ew-actions",
        children: [isPendingSend && currentUserCan.assignReviewer && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.Fragment, {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
            variant: "primary",
            onClick: sendForReview,
            disabled: sendDisabled,
            isBusy: loading,
            className: "flow-ew-actions__btn",
            children: i18n.sendForReview
          }), sendDisabled && sendDisabledHint && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)("p", {
            className: "flow-ew-actions__hint",
            children: sendDisabledHint
          })]
        }), isChangesRequested && isPostAuthor && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
          variant: "primary",
          onClick: resubmit,
          disabled: loading,
          isBusy: loading,
          className: "flow-ew-actions__btn",
          children: i18n.resubmit
        }), isInReview && isReviewer && currentUserCan.reviewPosts && (myApproved ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
          variant: "secondary",
          onClick: revokeApproval,
          disabled: loading,
          isBusy: loading,
          className: "flow-ew-actions__btn",
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Revoke Approval', 'jumplinks-editorial-workflow')
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.Fragment, {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
            variant: "primary",
            onClick: approve,
            disabled: loading,
            isBusy: loading,
            className: "flow-ew-actions__btn flow-ew-actions__btn--approve",
            children: i18n.approve
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
            variant: "secondary",
            isDestructive: true,
            onClick: requestChanges,
            disabled: loading || myChangesRequested,
            isBusy: loading,
            className: "flow-ew-actions__btn",
            children: i18n.requestChanges
          })]
        })), review?.revision_preview_url && (review.status !== 'pending' || !!review.is_open) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_RevisionShareBar__WEBPACK_IMPORTED_MODULE_11__["default"], {
          url: review.revision_preview_url
        })]
      })
    })]
  });
}

/***/ },

/***/ "./src/sidebar/components/FlowReviewerInfoPanel.js"
/*!*********************************************************!*\
  !*** ./src/sidebar/components/FlowReviewerInfoPanel.js ***!
  \*********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ FlowReviewerInfoPanel)
/* harmony export */ });
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/block-editor */ "@wordpress/block-editor");
/* harmony import */ var _wordpress_block_editor__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_editor__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/editor */ "@wordpress/editor");
/* harmony import */ var _wordpress_editor__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_editor__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _wordpress_notices__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/notices */ "@wordpress/notices");
/* harmony import */ var _wordpress_notices__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_notices__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @wordpress/api-fetch */ "@wordpress/api-fetch");
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _store__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../store */ "./src/sidebar/store.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__);










const {
  flowEW
} = window;
const {
  restUrl,
  postId,
  currentUserCan,
  i18n
} = flowEW;
function FlowReviewerInfoPanel() {
  const review = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(sel => sel(_store__WEBPACK_IMPORTED_MODULE_8__.STORE_NAME).getReview(), []);
  const reviewers = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(sel => sel(_store__WEBPACK_IMPORTED_MODULE_8__.STORE_NAME).getReviewers(), []);
  const {
    setReview
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_store__WEBPACK_IMPORTED_MODULE_8__.STORE_NAME);
  const {
    createSuccessNotice,
    createErrorNotice
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_wordpress_notices__WEBPACK_IMPORTED_MODULE_5__.store);
  const [popoverAnchor, setPopoverAnchor] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(null);
  const [filterValue, setFilterValue] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)('');
  const [isSaving, setIsSaving] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
  const reviewerId = review ? Number(review.reviewer?.id || review.reviewer_id) : 0;
  const reviewerData = reviewerId ? review.reviewer || reviewers.find(u => u.id === reviewerId) || null : null;
  const canAssign = currentUserCan.assignReviewer;
  const popoverProps = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => ({
    anchor: popoverAnchor,
    placement: 'left-start',
    offset: 36,
    shift: true
  }), [popoverAnchor]);
  const reviewerOptions = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => reviewers.map(u => ({
    value: String(u.id),
    label: u.name
  })), [reviewers]);
  const filteredOptions = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {
    if (!filterValue) return reviewerOptions;
    const lower = filterValue.toLowerCase();
    return reviewerOptions.filter(o => o.label.toLowerCase().includes(lower));
  }, [reviewerOptions, filterValue]);
  const handleSelect = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async (val, onClose) => {
    if (!val) return;
    const newId = Number(val);
    if (newId === reviewerId) {
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      const data = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_7___default()({
        url: `${restUrl}/reviews`,
        method: 'POST',
        data: {
          post_id: postId,
          reviewer_id: newId
        }
      });
      setReview(data);
      setFilterValue('');
      onClose();
      createSuccessNotice((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('✔ Reviewer updated.', 'jumplinks-editorial-workflow'), {
        type: 'snackbar',
        isDismissible: true
      });
    } catch (err) {
      createErrorNotice(err?.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_6__.__)('Failed to update reviewer.', 'jumplinks-editorial-workflow'), {
        isDismissible: true
      });
    } finally {
      setIsSaving(false);
    }
  }, [reviewerId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!reviewerData) return null;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_editor__WEBPACK_IMPORTED_MODULE_4__.PluginPostStatusInfo, {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("div", {
      ref: setPopoverAnchor,
      style: {
        width: '100%'
      },
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.__experimentalHStack, {
        className: "editor-post-panel__row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("div", {
          className: "editor-post-panel__row-label",
          children: i18n.reviewer
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)("div", {
          className: "editor-post-panel__row-control",
          children: canAssign ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Dropdown, {
            popoverProps: popoverProps,
            contentClassName: "editor-post-author__panel-dialog",
            focusOnMount: true,
            renderToggle: ({
              isOpen,
              onToggle
            }) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
              size: "compact",
              variant: "tertiary",
              className: "editor-post-author__panel-toggle",
              "aria-expanded": isOpen,
              onClick: onToggle,
              children: reviewerData.name || reviewerData.email
            }),
            renderContent: ({
              onClose
            }) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("div", {
              className: "editor-post-author",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_block_editor__WEBPACK_IMPORTED_MODULE_3__.__experimentalInspectorPopoverHeader, {
                title: i18n.reviewer,
                onClose: onClose
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsxs)("div", {
                style: {
                  padding: '0 16px 16px'
                },
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.ComboboxControl, {
                  __nextHasNoMarginBottom: true,
                  __next40pxDefaultSize: true,
                  label: i18n.selectReviewer,
                  hideLabelFromVision: true,
                  value: String(reviewerId),
                  options: reviewerOptions,
                  filteredOptions: filteredOptions,
                  onFilterValueChange: setFilterValue,
                  onChange: val => handleSelect(val, onClose),
                  disabled: isSaving
                }), isSaving && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Spinner, {})]
              })]
            })
          }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_9__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
            size: "compact",
            variant: "tertiary",
            className: "editor-post-author__panel-toggle",
            disabled: true,
            children: reviewerData.name || reviewerData.email
          })
        })]
      })
    })
  });
}

/***/ },

/***/ "./src/sidebar/components/InviteLinkCopy.js"
/*!**************************************************!*\
  !*** ./src/sidebar/components/InviteLinkCopy.js ***!
  \**************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ InviteLinkCopy)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/compose */ "@wordpress/compose");
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/api-fetch */ "@wordpress/api-fetch");
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _shared_share_bar_icons__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../shared/share-bar-icons */ "./src/shared/share-bar-icons.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__);







/**
 * Read lazily, never at module scope. The Free sidebar script declares the Pro
 * editor bundle as a dependency, so Pro evaluates before `wp_localize_script`
 * has printed `flowEW`. Destructuring it up here throws and takes every filter
 * the Pro bundle registers down with it.
 */

function config() {
  return typeof window !== 'undefined' && window.flowEW || {};
}

/**
 * Copies an external reviewer's magic link.
 *
 * The link is fetched rather than read off the review payload: that payload
 * also feeds webhooks, and a live entry token must not travel off-site. It is
 * fetched on mount rather than on click so the clipboard write stays inside the
 * user gesture — Safari rejects a write that happens after an await.
 *
 * @param {Object} props
 * @param {number} props.reviewId
 * @param {string} [props.email]  Which invite to copy. Omit for the single
 *                                Free invite; Pro passes one per reviewer.
 */
function InviteLinkCopy({
  reviewId,
  email = ''
}) {
  const [url, setUrl] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [copied, setCopied] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!reviewId) {
      setUrl('');
      return undefined;
    }
    let cancelled = false;
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const {
      restUrl
    } = config();
    _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_4___default()({
      url: `${restUrl}/reviews/${reviewId}/invite-link${query}`
    }).then(res => {
      if (!cancelled) {
        setUrl(res && res.url || '');
      }
    }).catch(() => {
      if (!cancelled) {
        setUrl('');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reviewId, email]);
  const ref = (0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__.useCopyToClipboard)(url, () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
  if (!url) {
    return null;
  }
  const {
    i18n
  } = config();
  const label = copied ? i18n?.copied : i18n?.copyInviteLink || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Copy invite link', 'jumplinks-editorial-workflow');
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
    ref: ref,
    size: "compact",
    variant: "tertiary",
    label: label,
    showTooltip: true,
    className: `flow-ew-reviewer-card__copy${copied ? ' flow-ew-reviewer-card__copy--done' : ''}`,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_shared_share_bar_icons__WEBPACK_IMPORTED_MODULE_5__.ShareBarIcon, {
      name: copied ? 'copied' : 'copy'
    })
  });
}

/***/ },

/***/ "./src/sidebar/components/OpenReviewControl.js"
/*!*****************************************************!*\
  !*** ./src/sidebar/components/OpenReviewControl.js ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ OpenReviewControl)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/api-fetch */ "@wordpress/api-fetch");
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/hooks */ "@wordpress/hooks");
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__);






const {
  flowEW
} = window;
const {
  postId
} = flowEW;

/**
 * Open Review checkbox for the Gutenberg sidebar. Lives above the Reviewer
 * field so requesters can flip a draft public-link before picking a reviewer.
 * If no review record exists yet, toggling on auto-creates one with no
 * reviewer assigned, then opens it.
 */
function OpenReviewControl({
  review,
  loading,
  setReview,
  setLoading,
  restUrl,
  createErrorNotice
}) {
  const onToggle = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async checked => {
    setLoading(true);
    try {
      let target = review;
      if (!target) {
        target = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_3___default()({
          url: `${restUrl}/reviews`,
          method: 'POST',
          data: {
            post_id: postId,
            reviewer_id: 0
          }
        });
      }
      const data = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_3___default()({
        url: `${restUrl}/reviews/${target.id}/${checked ? 'open' : 'close'}`,
        method: 'POST'
      });
      setReview(data);
    } catch (err) {
      createErrorNotice(err?.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Could not save. Please try again.', 'jumplinks-editorial-workflow'), {
        isDismissible: true
      });
    } finally {
      setLoading(false);
    }
  }, [review, restUrl, setReview, setLoading, createErrorNotice]);

  // Extension slot: only renders when the main toggle is on, so add-ons
  // (e.g. Pro's "Open to public") can layer sub-controls below the checkbox.
  const extras = review?.is_open ? (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_4__.applyFilters)('flow_ew_open_review_extras', null, {
    review,
    loading,
    setReview,
    setLoading,
    restUrl,
    createErrorNotice
  }) : null;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelRow, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_5__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.CheckboxControl, {
        __nextHasNoMarginBottom: true,
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Open review', 'jumplinks-editorial-workflow'),
        help: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('All users with the link will be able to add comments.', 'jumplinks-editorial-workflow'),
        checked: !!review?.is_open,
        onChange: onToggle,
        disabled: loading
      })
    }), extras]
  });
}

/***/ },

/***/ "./src/sidebar/components/PublishGuard.js"
/*!************************************************!*\
  !*** ./src/sidebar/components/PublishGuard.js ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ PublishGuard)
/* harmony export */ });
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _store__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../store */ "./src/sidebar/store.js");
/* harmony import */ var _shared_is_publish_blocked__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../shared/is-publish-blocked */ "./src/shared/is-publish-blocked.js");
/* harmony import */ var _shared_publish_guard_ui__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../shared/publish-guard-ui */ "./src/shared/publish-guard-ui.js");





const {
  flowEW
} = window;
const BLOCKED_PUBLISH_CLICK_SELECTOR = '.edit-post-header .editor-post-publish-panel__toggle, .edit-post-header .editor-post-publish-button';
function getPublishGuardStyles() {
  return `
		/* Header publish: keep pointer events so tooltip works; clicks blocked in JS. */
		.edit-post-header .editor-post-publish-panel__toggle,
		.edit-post-header .editor-post-publish-button {
			opacity: 0.4 !important;
			cursor: not-allowed !important;
		}
		/* Publish panel + schedule controls stay fully inert. */
		.editor-post-publish-panel .editor-post-publish-button,
		.editor-post-publish-panel .editor-post-publish-button__button,
		.editor-post-schedule__panel-dropdown,
		.editor-post-schedule__dialog-toggle {
			opacity: 0.4 !important;
			pointer-events: none !important;
			cursor: not-allowed !important;
		}
	`;
}
function PublishGuard() {
  const review = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(sel => sel(_store__WEBPACK_IMPORTED_MODULE_2__.STORE_NAME).getReview(), []);
  const isAlreadyPublished = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(sel => sel('core/editor').getCurrentPostAttribute('status') === 'publish', []);
  const blocked = (0,_shared_is_publish_blocked__WEBPACK_IMPORTED_MODULE_3__.isPublishBlocked)({
    reviewMandatory: flowEW.reviewMandatory,
    isPublished: isAlreadyPublished,
    review,
    reviewerMeta: flowEW.reviewerMeta
  });
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    const styleId = 'flow-ew-publish-guard';
    if (blocked) {
      let el = document.getElementById(styleId);
      if (!el) {
        el = document.createElement('style');
        el.id = styleId;
        document.head.appendChild(el);
      }
      el.textContent = getPublishGuardStyles();
    } else {
      const el = document.getElementById(styleId);
      if (el) {
        el.parentNode.removeChild(el);
      }
    }
    (0,_shared_publish_guard_ui__WEBPACK_IMPORTED_MODULE_4__.syncGutenbergPublishGuardTooltips)(blocked);
    if (!blocked) {
      return undefined;
    }
    const onClick = event => {
      if (event.target.closest(BLOCKED_PUBLISH_CLICK_SELECTOR)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };
    document.addEventListener('click', onClick, true);
    const observer = new MutationObserver(() => {
      (0,_shared_publish_guard_ui__WEBPACK_IMPORTED_MODULE_4__.syncGutenbergPublishGuardTooltips)(true);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    return () => {
      document.removeEventListener('click', onClick, true);
      observer.disconnect();
      (0,_shared_publish_guard_ui__WEBPACK_IMPORTED_MODULE_4__.syncGutenbergPublishGuardTooltips)(false);
    };
  }, [blocked]);
  return null;
}

/***/ },

/***/ "./src/sidebar/components/ReviewModeNotice.js"
/*!****************************************************!*\
  !*** ./src/sidebar/components/ReviewModeNotice.js ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ReviewModeNotice)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _shared_no_review_roles_notice__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../shared/no-review-roles-notice */ "./src/shared/no-review-roles-notice.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);





const {
  flowEW
} = window;
function SettingsHint({
  settingsUrl,
  usersUrl
}) {
  const settingsLink = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("a", {
    href: settingsUrl,
    className: "flow-ew-review-notice__link",
    target: "_blank",
    rel: "noreferrer"
  });
  const usersLink = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("a", {
    href: usersUrl,
    className: "flow-ew-review-notice__link",
    target: "_blank",
    rel: "noreferrer"
  });
  return (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createInterpolateElement)((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Please check the <settings>settings</settings> to see which user roles can review, and also if the role is applied the assigned <users>users</users>.', 'jumplinks-editorial-workflow'), {
    settings: settingsLink,
    users: usersLink
  });
}
function DismissableNotice({
  variant,
  role,
  publishGuardOnly = false,
  title,
  children
}) {
  const [dismissed, setDismissed] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => (0,_shared_no_review_roles_notice__WEBPACK_IMPORTED_MODULE_3__.isNoReviewRolesNoticeDismissed)());
  if (dismissed) {
    return null;
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelRow, {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      className: `flow-ew-review-notice flow-ew-review-notice--${variant}`,
      role: role,
      "data-flow-ew-dismiss": "no-review-roles",
      ...(publishGuardOnly ? {
        'data-flow-ew-publish-guard-only': '1'
      } : {}),
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        className: "flow-ew-review-notice__dismiss",
        icon: "no-alt",
        label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Dismiss', 'jumplinks-editorial-workflow'),
        onClick: () => {
          (0,_shared_no_review_roles_notice__WEBPACK_IMPORTED_MODULE_3__.dismissNoReviewRolesNotice)();
          setDismissed(true);
        },
        isSmall: true
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
        className: "flow-ew-review-notice__title",
        children: title
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
        className: "flow-ew-review-notice__desc",
        children: children
      })]
    })
  });
}
function ReviewModeNotice({
  reviewMandatory,
  publishBlocked,
  noReviewers,
  settingsUrl = flowEW.settingsUrl,
  usersUrl = flowEW.usersUrl
}) {
  if (noReviewers && !reviewMandatory) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(DismissableNotice, {
      variant: "in-review",
      role: "status",
      title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('No Review Roles Assigned', 'jumplinks-editorial-workflow'),
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(SettingsHint, {
        settingsUrl: settingsUrl,
        usersUrl: usersUrl
      })
    });
  }
  if (!publishBlocked) {
    return null;
  }
  if (noReviewers) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(DismissableNotice, {
      variant: "in-review",
      role: "status",
      publishGuardOnly: true,
      title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('No Review Roles Assigned', 'jumplinks-editorial-workflow'),
      children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Post can go live only after approval by a reviewer.', 'jumplinks-editorial-workflow'), ' ', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(SettingsHint, {
        settingsUrl: settingsUrl,
        usersUrl: usersUrl
      })]
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.PanelRow, {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      className: "flow-ew-review-notice flow-ew-review-notice--in-review",
      role: "note",
      "data-flow-ew-publish-guard-only": "1",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
        className: "flow-ew-review-notice__title",
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Review Mode set to Mandatory', 'jumplinks-editorial-workflow')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
        className: "flow-ew-review-notice__desc",
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Post can go live only after approval by a reviewer.', 'jumplinks-editorial-workflow')
      })]
    })
  });
}

/***/ },

/***/ "./src/sidebar/components/ReviewerField.js"
/*!*************************************************!*\
  !*** ./src/sidebar/components/ReviewerField.js ***!
  \*************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ReviewerField)
/* harmony export */ });
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_notices__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/notices */ "@wordpress/notices");
/* harmony import */ var _wordpress_notices__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_notices__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/api-fetch */ "@wordpress/api-fetch");
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _InviteLinkCopy__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./InviteLinkCopy */ "./src/sidebar/components/InviteLinkCopy.js");
/* harmony import */ var _store__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../store */ "./src/sidebar/store.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__);









const {
  flowEW
} = window;
const {
  restUrl,
  postId,
  currentUserCan,
  i18n
} = flowEW;
const EMAIL_SENTINEL = 'email';
const INVITE_PREFIX = 'invite:';

// Prefer the server-localized string: the plugin ships PHP catalogs but no
// JS translation files, so a bare __() here would stay English.
const invalidEmailMessage = () => i18n?.invalidEmail || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Please enter a valid email address.', 'jumplinks-editorial-workflow');
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());
}
function inviteValue(email) {
  return INVITE_PREFIX + String(email || '').trim().toLowerCase();
}
function parseInviteValue(val) {
  if (typeof val !== 'string' || !val.startsWith(INVITE_PREFIX)) {
    return '';
  }
  return val.slice(INVITE_PREFIX.length);
}
function isInviteOptionValue(val) {
  return val === EMAIL_SENTINEL || typeof val === 'string' && val.startsWith(INVITE_PREFIX);
}

/**
 * WordPress ComboboxControl ignores `filteredOptions` and only keeps options
 * whose `label` contains the typed input. The invite row label must therefore
 * equal (or contain) the current filter text whenever the user is typing an email.
 */
function ReviewerField() {
  const review = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(sel => sel(_store__WEBPACK_IMPORTED_MODULE_7__.STORE_NAME).getReview(), []);
  const reviewers = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useSelect)(sel => sel(_store__WEBPACK_IMPORTED_MODULE_7__.STORE_NAME).getReviewers(), []);
  const {
    setReview
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_store__WEBPACK_IMPORTED_MODULE_7__.STORE_NAME);
  const {
    createSuccessNotice,
    createErrorNotice
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.useDispatch)(_wordpress_notices__WEBPACK_IMPORTED_MODULE_3__.store);
  const [isEditing, setIsEditing] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
  const [isSaving, setIsSaving] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
  const [filterValue, setFilterValue] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)('');
  const [emailMode, setEmailMode] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
  const inviteEmail = review?.invite_email || review?.reviewer?.email || '';
  const isEmailReviewer = !!(inviteEmail || review?.reviewer?.is_email);
  const reviewerId = review && !isEmailReviewer ? Number(review.reviewer?.id || review.reviewer_id || 0) : 0;
  const reviewerData = isEmailReviewer ? {
    name: review?.reviewer?.name || inviteEmail,
    email: inviteEmail,
    is_email: true,
    avatar_url: review?.reviewer?.avatar_url || ''
  } : reviewerId ? review.reviewer || reviewers.find(u => u.id === reviewerId) || null : null;
  const hasReviewer = !!reviewerData;
  const canAssign = currentUserCan.assignReviewer;
  const reviewId = review?.id || 0;
  const reviewStatus = review?.status || '';
  const canCopyInvite = canAssign && isEmailReviewer && reviewId > 0 && '' !== reviewStatus && 'pending' !== reviewStatus;
  const showCombobox = canAssign && (!hasReviewer || isEditing);
  const userOptions = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => reviewers.filter(u => String(u.id) !== EMAIL_SENTINEL && !u.is_email).map(u => ({
    value: String(u.id),
    label: u.name
  })), [reviewers]);

  // No WP reviewers available — skip the External Email pick step.
  const emailOnly = userOptions.length === 0;
  const inEmailMode = emailMode || emailOnly;
  const externalEmailLabel = i18n?.externalEmail || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('External Email', 'jumplinks-editorial-workflow');
  const comboboxOptions = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {
    // Combobox is only used to pick a WP user or "External Email".
    // Email typing uses TextControl (no autocomplete while composing).
    return [{
      value: EMAIL_SENTINEL,
      label: externalEmailLabel
    }, ...userOptions];
  }, [userOptions, externalEmailLabel]);
  const renderSuggestion = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(({
    item
  }) => {
    if (item.value === EMAIL_SENTINEL) {
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("strong", {
        children: item.label
      });
    }
    return item.label;
  }, []);
  const inviteSuggestionLabel = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useMemo)(() => {
    const trimmed = (filterValue || '').trim();
    if (!isValidEmail(trimmed)) {
      return '';
    }
    return (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.sprintf)(/* translators: %s: valid email address */
    i18n?.inviteEmail || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Invite %s', 'jumplinks-editorial-workflow'), trimmed);
  }, [filterValue]);
  const assignEmail = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async email => {
    const trimmed = (email || '').trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      createErrorNotice(invalidEmailMessage(), {
        type: 'snackbar',
        isDismissible: true
      });
      return;
    }
    setIsSaving(true);
    try {
      const data = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5___default()({
        url: `${restUrl}/reviews`,
        method: 'POST',
        data: {
          post_id: postId,
          invite_email: trimmed
        }
      });
      setReview(data);
      setIsEditing(false);
      setEmailMode(false);
      setFilterValue('');
      createSuccessNotice((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('✔ Email reviewer assigned.', 'jumplinks-editorial-workflow'), {
        type: 'snackbar',
        isDismissible: true
      });
    } catch (err) {
      createErrorNotice(err?.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Failed to assign reviewer.', 'jumplinks-editorial-workflow'), {
        type: 'snackbar',
        isDismissible: true
      });
    } finally {
      setIsSaving(false);
    }
  }, [setReview, createSuccessNotice, createErrorNotice]);
  const submitTypedEmail = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(() => {
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
      isDismissible: true
    });
  }, [filterValue, assignEmail, createErrorNotice]);
  const handleEmailKeyDown = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(event => {
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
  }, [inEmailMode, filterValue, submitTypedEmail]);
  const handleSelect = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async val => {
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
        isDismissible: true
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
      const data = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5___default()({
        url: `${restUrl}/reviews`,
        method: 'POST',
        data: {
          post_id: postId,
          reviewer_id: newId
        }
      });
      setReview(data);
      setIsEditing(false);
      setFilterValue('');
      createSuccessNotice((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('✔ Reviewer assigned.', 'jumplinks-editorial-workflow'), {
        type: 'snackbar',
        isDismissible: true
      });
    } catch (err) {
      createErrorNotice(err?.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Failed to assign reviewer.', 'jumplinks-editorial-workflow'), {
        type: 'snackbar',
        isDismissible: true
      });
    } finally {
      setIsSaving(false);
    }
  }, [reviewerId, setReview, createSuccessNotice, createErrorNotice, assignEmail, filterValue]);
  const handleFilterChange = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(value => {
    setFilterValue(value);
    const trimmed = (value || '').trim();
    if (trimmed.includes('@') || isValidEmail(trimmed)) {
      setEmailMode(true);
    }
  }, []);
  const handleRemove = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async () => {
    if (!review) return;
    setIsSaving(true);
    try {
      const data = await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_5___default()({
        url: `${restUrl}/reviews/${review.id}/cancel`,
        method: 'POST'
      });
      setReview(data || null);
      setIsEditing(false);
      setEmailMode(false);
      setFilterValue('');
      createSuccessNotice((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('✔ Reviewer removed.', 'jumplinks-editorial-workflow'), {
        type: 'snackbar',
        isDismissible: true
      });
    } catch (err) {
      createErrorNotice(err?.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Failed to remove reviewer.', 'jumplinks-editorial-workflow'), {
        isDismissible: true
      });
    } finally {
      setIsSaving(false);
    }
  }, [review, setReview, createSuccessNotice, createErrorNotice]);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.PanelRow, {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
      style: {
        width: '100%'
      },
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.__experimentalHStack, {
        justify: "space-between",
        className: "flow-ew-label-row",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("span", {
          className: "flow-ew-field-label",
          children: i18n.reviewer
        }), canAssign && hasReviewer && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
          variant: "link",
          onClick: () => {
            setIsEditing(v => !v);
            setFilterValue('');
            setEmailMode(false);
          },
          className: "flow-ew-link-btn",
          children: isEditing ? i18n.cancelEdit : i18n.editReviewer
        })]
      }), hasReviewer && !isEditing && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
        className: "flow-ew-reviewer-card",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
          className: "flow-ew-reviewer-card__main",
          children: [reviewerData.avatar_url && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("img", {
            src: reviewerData.avatar_url,
            alt: "",
            width: 24,
            height: 24,
            className: "flow-ew-avatar"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.__experimentalText, {
            size: "13",
            className: "flow-ew-truncate",
            children: reviewerData.name || reviewerData.email
          })]
        }), canCopyInvite && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_InviteLinkCopy__WEBPACK_IMPORTED_MODULE_6__["default"], {
          reviewId: reviewId
        }), canAssign && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
          icon: "no-alt",
          label: i18n.removeReviewer,
          isSmall: true,
          onClick: handleRemove,
          disabled: isSaving,
          className: "flow-ew-reviewer-card__remove"
        })]
      }), showCombobox && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)("div", {
        className: inEmailMode ? 'flow-ew-reviewer-combobox flow-ew-reviewer-combobox--email' : 'flow-ew-reviewer-combobox',
        onKeyDown: handleEmailKeyDown,
        children: [inEmailMode ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.Fragment, {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.TextControl, {
            className: "flow-ew-reviewer-combobox__control",
            hideLabelFromVision: true,
            label: i18n.selectReviewer,
            placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('name@example.com', 'jumplinks-editorial-workflow'),
            value: filterValue,
            onChange: handleFilterChange,
            disabled: isSaving,
            type: "email",
            autoComplete: "email",
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true
          }), inviteSuggestionLabel ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
            variant: "secondary",
            className: "flow-ew-reviewer-invite-suggestion",
            onClick: () => assignEmail(filterValue.trim()),
            disabled: isSaving,
            children: inviteSuggestionLabel
          }) : null]
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.ComboboxControl, {
          className: "flow-ew-reviewer-combobox__control",
          hideLabelFromVision: true,
          label: i18n.selectReviewer,
          placeholder: i18n.reviewerPlaceholder || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('assign a dedicated reviewer', 'jumplinks-editorial-workflow'),
          value: null,
          onChange: handleSelect,
          options: comboboxOptions,
          onFilterValueChange: handleFilterChange,
          __experimentalRenderItem: renderSuggestion,
          disabled: isSaving,
          __next40pxDefaultSize: true,
          __nextHasNoMarginBottom: true
        }), isSaving && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)("div", {
          className: "flow-ew-spinner-overlay",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_8__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Spinner, {})
        })]
      })]
    })
  });
}

/***/ },

/***/ "./src/sidebar/components/RevisionShareBar.js"
/*!****************************************************!*\
  !*** ./src/sidebar/components/RevisionShareBar.js ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ RevisionShareBar)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/compose */ "@wordpress/compose");
/* harmony import */ var _wordpress_compose__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _shared_share_bar_icons__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../shared/share-bar-icons */ "./src/shared/share-bar-icons.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);





const {
  flowEW
} = window;
const {
  i18n
} = flowEW;
function RevisionShareBar({
  url
}) {
  const [copied, setCopied] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const ref = (0,_wordpress_compose__WEBPACK_IMPORTED_MODULE_1__.useCopyToClipboard)(url, () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "flow-ew-share-bar",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
      className: "flow-ew-field-label flow-ew-share-bar__label",
      children: i18n.snapshotLink
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      className: "flow-ew-share-bar__row",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("a", {
        href: url,
        target: "_blank",
        rel: "noreferrer",
        className: "flow-ew-share-bar__link",
        title: url,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("span", {
          className: "flow-ew-share-bar__link-text",
          children: url
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Button, {
        ref: ref,
        size: "compact",
        variant: "tertiary",
        label: copied ? i18n.copied : i18n.copyLink,
        showTooltip: true,
        className: `flow-ew-share-bar__copy ${copied ? 'flow-ew-share-bar__copy--done' : ''}`,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_shared_share_bar_icons__WEBPACK_IMPORTED_MODULE_3__.ShareBarIcon, {
          name: copied ? 'copied' : 'copy'
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("a", {
        href: url,
        target: "_blank",
        rel: "noreferrer",
        className: "flow-ew-share-bar__goto",
        "aria-label": i18n.goToReview || 'Go to review',
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_shared_share_bar_icons__WEBPACK_IMPORTED_MODULE_3__.ShareBarIcon, {
          name: "external"
        })
      })]
    })]
  });
}

/***/ },

/***/ "./src/sidebar/store.js"
/*!******************************!*\
  !*** ./src/sidebar/store.js ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   STATUS_COLORS: () => (/* reexport safe */ _shared_status_themes__WEBPACK_IMPORTED_MODULE_1__.STATUS_COLORS),
/* harmony export */   STATUS_LABELS: () => (/* reexport safe */ _shared_status_labels__WEBPACK_IMPORTED_MODULE_2__.STATUS_LABELS),
/* harmony export */   STATUS_THEMES: () => (/* reexport safe */ _shared_status_themes__WEBPACK_IMPORTED_MODULE_1__.STATUS_THEMES),
/* harmony export */   STORE_NAME: () => (/* binding */ STORE_NAME),
/* harmony export */   statusLabel: () => (/* reexport safe */ _shared_status_labels__WEBPACK_IMPORTED_MODULE_2__.statusLabel),
/* harmony export */   statusTextColor: () => (/* reexport safe */ _shared_status_themes__WEBPACK_IMPORTED_MODULE_1__.statusTextColor),
/* harmony export */   statusThemeStyle: () => (/* reexport safe */ _shared_status_themes__WEBPACK_IMPORTED_MODULE_1__.statusThemeStyle)
/* harmony export */ });
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _shared_status_themes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shared/status-themes */ "./src/shared/status-themes.js");
/* harmony import */ var _shared_status_labels__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../shared/status-labels */ "./src/shared/status-labels.js");





const {
  flowEW
} = window;
const STORE_NAME = 'flow-ew/review';
const DEFAULT_STATE = {
  reviewers: [],
  review: flowEW.activeReview || null,
  loading: false,
  error: null
};
const flowStore = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.createReduxStore)(STORE_NAME, {
  reducer(state = DEFAULT_STATE, action) {
    switch (action.type) {
      case 'SET_REVIEWERS':
        return {
          ...state,
          reviewers: action.reviewers
        };
      case 'SET_REVIEW':
        return {
          ...state,
          review: action.review
        };
      case 'SET_LOADING':
        return {
          ...state,
          loading: action.loading
        };
      case 'SET_ERROR':
        return {
          ...state,
          error: action.error
        };
      default:
        return state;
    }
  },
  actions: {
    setReviewers: reviewers => ({
      type: 'SET_REVIEWERS',
      reviewers
    }),
    setReview: review => ({
      type: 'SET_REVIEW',
      review
    }),
    setLoading: loading => ({
      type: 'SET_LOADING',
      loading
    }),
    setError: error => ({
      type: 'SET_ERROR',
      error
    })
  },
  selectors: {
    getReviewers: state => state.reviewers,
    getReview: state => state.review,
    isLoading: state => state.loading,
    getError: state => state.error
  }
});
(0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.register)(flowStore);

/***/ },

/***/ "./src/shared/share-bar.css"
/*!**********************************!*\
  !*** ./src/shared/share-bar.css ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "./src/sidebar/index.css"
/*!*******************************!*\
  !*** ./src/sidebar/index.css ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "react/jsx-runtime"
/*!**********************************!*\
  !*** external "ReactJSXRuntime" ***!
  \**********************************/
(module) {

module.exports = window["ReactJSXRuntime"];

/***/ },

/***/ "@wordpress/api-fetch"
/*!**********************************!*\
  !*** external ["wp","apiFetch"] ***!
  \**********************************/
(module) {

module.exports = window["wp"]["apiFetch"];

/***/ },

/***/ "@wordpress/block-editor"
/*!*************************************!*\
  !*** external ["wp","blockEditor"] ***!
  \*************************************/
(module) {

module.exports = window["wp"]["blockEditor"];

/***/ },

/***/ "@wordpress/components"
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["components"];

/***/ },

/***/ "@wordpress/compose"
/*!*********************************!*\
  !*** external ["wp","compose"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["compose"];

/***/ },

/***/ "@wordpress/data"
/*!******************************!*\
  !*** external ["wp","data"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["data"];

/***/ },

/***/ "@wordpress/editor"
/*!********************************!*\
  !*** external ["wp","editor"] ***!
  \********************************/
(module) {

module.exports = window["wp"]["editor"];

/***/ },

/***/ "@wordpress/element"
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["element"];

/***/ },

/***/ "@wordpress/hooks"
/*!*******************************!*\
  !*** external ["wp","hooks"] ***!
  \*******************************/
(module) {

module.exports = window["wp"]["hooks"];

/***/ },

/***/ "@wordpress/i18n"
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
(module) {

module.exports = window["wp"]["i18n"];

/***/ },

/***/ "@wordpress/notices"
/*!*********************************!*\
  !*** external ["wp","notices"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["notices"];

/***/ },

/***/ "@wordpress/plugins"
/*!*********************************!*\
  !*** external ["wp","plugins"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["plugins"];

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!******************************!*\
  !*** ./src/sidebar/index.js ***!
  \******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_plugins__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/plugins */ "@wordpress/plugins");
/* harmony import */ var _wordpress_plugins__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_plugins__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_editor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/editor */ "@wordpress/editor");
/* harmony import */ var _wordpress_editor__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_editor__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/api-fetch */ "@wordpress/api-fetch");
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/hooks */ "@wordpress/hooks");
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _store__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./store */ "./src/sidebar/store.js");
/* harmony import */ var _components_FlowReviewPanel__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./components/FlowReviewPanel */ "./src/sidebar/components/FlowReviewPanel.js");
/* harmony import */ var _components_PublishGuard__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./components/PublishGuard */ "./src/sidebar/components/PublishGuard.js");
/* harmony import */ var _components_FlowReviewerInfoPanel__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./components/FlowReviewerInfoPanel */ "./src/sidebar/components/FlowReviewerInfoPanel.js");
/* harmony import */ var _shared_share_bar_css__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../shared/share-bar.css */ "./src/shared/share-bar.css");
/* harmony import */ var _index_css__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./index.css */ "./src/sidebar/index.css");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__);













const {
  flowEW
} = window;
const {
  restUrl,
  nonce,
  postId,
  i18n
} = flowEW;
_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_4___default().use(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_4___default().createNonceMiddleware(nonce));
function applyReviewPayload(reviewerList, reviewPayload, setReviewers, setReview) {
  const reviewers = Array.isArray(reviewerList) ? reviewerList : [];
  setReviewers(reviewers);
  if (reviewPayload === undefined) {
    return;
  }
  let next = reviewPayload;
  if (next && next.reviewer && next.reviewer.id) {
    const found = reviewers.find(u => u.id === Number(next.reviewer.id));
    if (found) {
      next = {
        ...next,
        reviewer: found
      };
    }
  }
  setReview(next ?? null);
}
function FlowDataLoader() {
  const {
    setReviewers,
    setReview
  } = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_2__.useDispatch)(_store__WEBPACK_IMPORTED_MODULE_6__.STORE_NAME);
  const loadReviewData = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_3__.useCallback)(() => {
    Promise.all([_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_4___default()({
      url: `${restUrl}/reviewers?post_id=${postId}`
    }).catch(() => []), _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_4___default()({
      url: `${restUrl}/reviews/${postId}`
    }).catch(() => undefined)]).then(([reviewerList, reviewPayload]) => {
      applyReviewPayload(reviewerList, reviewPayload, setReviewers, setReview);
    }).catch(() => {});
  }, [postId, restUrl, setReview, setReviewers]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_3__.useEffect)(() => {
    loadReviewData();
  }, [loadReviewData]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_3__.useEffect)(() => {
    let prevSaving = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_2__.select)('core/editor').isSavingPost();
    let prevAutosaving = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_2__.select)('core/editor').isAutosavingPost();
    let debounceTimer;
    const scheduleReload = () => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        loadReviewData();
      }, 400);
    };
    const unsub = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_2__.subscribe)(() => {
      const saving = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_2__.select)('core/editor').isSavingPost();
      const autosaving = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_2__.select)('core/editor').isAutosavingPost();
      if (prevSaving && !saving || prevAutosaving && !autosaving) {
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
  const review = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_2__.useSelect)(sel => sel(_store__WEBPACK_IMPORTED_MODULE_6__.STORE_NAME).getReview(), []);
  const displayStatus = review ? review.display_status || review.status : null;
  const statusLabel = displayStatus ? _store__WEBPACK_IMPORTED_MODULE_6__.STATUS_LABELS[displayStatus] || null : null;
  const panelTitle = statusLabel ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("span", {
    className: "flow-ew-panel-title",
    children: [i18n.reviewPanelTitle, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("span", {
      className: "flow-ew-panel-title__badge",
      style: (0,_store__WEBPACK_IMPORTED_MODULE_6__.statusThemeStyle)(displayStatus),
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
        className: "flow-ew-badge__dot",
        "aria-hidden": "true"
      }), statusLabel]
    })]
  }) : i18n.reviewPanelTitle;
  const queueBadge = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_5__.applyFilters)('flow_ew_sidebar_queue_badge', null);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(FlowDataLoader, {}), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_components_PublishGuard__WEBPACK_IMPORTED_MODULE_8__["default"], {}), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(_wordpress_editor__WEBPACK_IMPORTED_MODULE_1__.PluginDocumentSettingPanel, {
      name: "flow-ew-review",
      title: panelTitle,
      className: "flow-ew-review-panel",
      initialOpen: true,
      children: [queueBadge, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_components_FlowReviewPanel__WEBPACK_IMPORTED_MODULE_7__["default"], {})]
    })]
  });
}
(0,_wordpress_plugins__WEBPACK_IMPORTED_MODULE_0__.registerPlugin)('flow-ew-review-panel', {
  render: FlowReviewRoot
});
(0,_wordpress_plugins__WEBPACK_IMPORTED_MODULE_0__.registerPlugin)('flow-ew-reviewer-info', {
  render: _components_FlowReviewerInfoPanel__WEBPACK_IMPORTED_MODULE_9__["default"]
});
})();

/******/ })()
;
//# sourceMappingURL=index.js.map