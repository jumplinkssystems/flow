/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/elementor/index.js"
/*!********************************!*\
  !*** ./src/elementor/index.js ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./style.css */ "./src/elementor/style.css");
/* harmony import */ var _shared_sync_reviewer_combobox_from_review__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shared/sync-reviewer-combobox-from-review */ "./src/shared/sync-reviewer-combobox-from-review.js");
/* harmony import */ var _shared_review_notice_dom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../shared/review-notice-dom */ "./src/shared/review-notice-dom.js");



(function bootElementorReview(attempt) {
  const drawer = document.getElementById('flow-ew-elementor-drawer');
  const toggle = document.getElementById('flow-ew-elementor-toggle');
  if (!drawer || !toggle) {
    if (attempt < 150) {
      requestAnimationFrame(function () {
        bootElementorReview(attempt + 1);
      });
    }
    return;
  }
  if (drawer.dataset.flowEwElementorReady === '1') {
    return;
  }
  drawer.dataset.flowEwElementorReady = '1';
  (function runElementorReview(drawer, toggle) {
    function debounce(fn, ms) {
      let t;
      return function () {
        clearTimeout(t);
        t = setTimeout(fn, ms);
      };
    }
    function findPublishButton(root) {
      if (!root) {
        return null;
      }
      const preferred = root.querySelectorAll('button.MuiButton-root.MuiButton-containedPrimary');
      for (let i = 0; i < preferred.length; i++) {
        const b = preferred[i];
        if (b.offsetParent !== null) {
          return b;
        }
      }

      // Fallback for older Elementor builds where primary styles differ.
      const buttons = root.querySelectorAll('button.MuiButton-root');
      for (let i = 0; i < buttons.length; i++) {
        const b = buttons[i];
        if (b.offsetParent === null) {
          continue;
        }
        const label = b.textContent.replace(/\s+/g, ' ').trim();
        if (/^(Publish|Submit)$/i.test(label)) {
          return b;
        }
      }
      return null;
    }
    function pickTopBarAnchor(root) {
      if (!root) {
        return null;
      }
      const buttons = Array.from(root.querySelectorAll('button.MuiButton-root')).filter(b => b.offsetParent !== null);
      if (!buttons.length) {
        return null;
      }
      const topButtons = buttons.filter(b => {
        const rect = b.getBoundingClientRect();
        return rect.top >= 0 && rect.top < 170;
      });
      const source = topButtons.length ? topButtons : buttons;
      source.sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right);
      return source[0] || null;
    }
    function findToolbarIconButtonRef(parent, roots) {
      if (parent) {
        const inParent = parent.querySelector('button.MuiIconButton-root');
        if (inParent && inParent.offsetParent !== null) {
          return inParent;
        }
      }
      for (let i = 0; i < roots.length; i++) {
        const btn = roots[i].querySelector('button.MuiIconButton-root');
        if (btn && btn.offsetParent !== null) {
          return btn;
        }
      }
      return null;
    }
    function syncInlineToggleMetrics(roots, parent) {
      if (!toggle.classList.contains('flow-ew-elementor-toggle--inline')) {
        toggle.style.width = '';
        toggle.style.height = '';
        toggle.style.alignSelf = '';
        return;
      }
      const ref = findToolbarIconButtonRef(parent, roots);
      if (ref) {
        const cs = window.getComputedStyle(ref);
        toggle.style.width = cs.width;
        toggle.style.height = cs.height;
        toggle.style.alignSelf = cs.alignSelf || 'center';
        return;
      }
      toggle.style.width = '';
      toggle.style.height = '';
      toggle.style.alignSelf = 'center';
    }
    function anchorToggleNearPublish() {
      const roots = [document.getElementById('elementor-editor-wrapper-v2'), document.getElementById('elementor-editor-wrapper')].filter(Boolean);
      let publish = null;
      for (let i = 0; i < roots.length; i++) {
        publish = findPublishButton(roots[i]);
        if (publish) {
          break;
        }
      }
      let anchor = publish;
      if (!anchor) {
        for (let i = 0; i < roots.length; i++) {
          anchor = pickTopBarAnchor(roots[i]);
          if (anchor) {
            break;
          }
        }
      }
      const parent = anchor && anchor.parentElement;
      if (parent && anchor) {
        // Inline next to Publish in the top bar. Skip if already in place
        // to avoid bouncing the MutationObserver.
        if (toggle.parentElement !== parent || toggle.nextSibling !== anchor) {
          parent.insertBefore(toggle, anchor);
        }
        syncInlineToggleMetrics(roots, parent);
        toggle.style.position = '';
        toggle.style.top = '';
        toggle.style.left = '';
        toggle.style.right = '';
        toggle.classList.remove('flow-ew-elementor-toggle--fallback');
        toggle.classList.remove('flow-ew-elementor-toggle--anchored');
        toggle.classList.add('flow-ew-elementor-toggle--inline');
      } else {
        // Only use floating fallback when the editor chrome itself is missing.
        const toolbarReady = roots.some(root => !!pickTopBarAnchor(root));
        if (!toolbarReady) {
          toggle.style.position = 'fixed';
          toggle.style.top = '';
          toggle.style.left = '';
          toggle.style.right = '';
          toggle.style.width = '';
          toggle.style.height = '';
          toggle.style.alignSelf = '';
          toggle.classList.add('flow-ew-elementor-toggle--fallback');
          toggle.classList.remove('flow-ew-elementor-toggle--anchored');
          toggle.classList.remove('flow-ew-elementor-toggle--inline');
        }
      }
    }
    const debouncedAnchor = debounce(anchorToggleNearPublish, 80);
    window.addEventListener('resize', debouncedAnchor);
    const observeRoots = [document.getElementById('elementor-editor-wrapper-v2'), document.getElementById('elementor-editor-wrapper')].filter(Boolean);
    for (let r = 0; r < observeRoots.length; r++) {
      new MutationObserver(debouncedAnchor).observe(observeRoots[r], {
        childList: true,
        subtree: true
      });
    }
    let anchorAttempts = 0;
    function tryAnchorLoop() {
      anchorToggleNearPublish();
      anchorAttempts++;
      if (anchorAttempts < 180 && !toggle.classList.contains('flow-ew-elementor-toggle--inline')) {
        requestAnimationFrame(tryAnchorLoop);
      }
    }
    tryAnchorLoop();

    // Anchor the popup directly under the Review toggle, right-aligned to it
    // so it never overflows past the top bar's right edge.
    function positionPopup() {
      const rect = toggle.getBoundingClientRect();
      const top = Math.max(8, Math.round(rect.bottom + 6));
      const available = Math.max(240, window.innerHeight - top - 8);
      // Half the available viewport (keeps the drawer compact).
      const height = Math.round(available / 2);
      drawer.style.top = top + 'px';
      drawer.style.right = window.innerWidth - rect.right + 'px';
      drawer.style.left = 'auto';
      drawer.style.bottom = 'auto';
      drawer.style.height = height + 'px';
      drawer.style.maxHeight = height + 'px';
    }
    function refreshReviewNotices() {
      const ew = window.flowEW;
      if (!ew) {
        return;
      }
      (0,_shared_review_notice_dom__WEBPACK_IMPORTED_MODULE_2__.ensureReviewNotices)({
        reviewMandatory: ew.reviewMandatory,
        isPublished: ew.isPublished,
        review: ew.activeReview,
        reviewerMeta: ew.reviewerMeta,
        currentUserCan: ew.currentUserCan
      });
    }
    function open() {
      drawer.style.display = '';
      positionPopup();
      drawer.classList.add('is-open');
      toggle.classList.add('is-active');
      refreshReviewNotices();
    }
    function close() {
      drawer.classList.remove('is-open');
      toggle.classList.remove('is-active');
      setTimeout(function () {
        if (!drawer.classList.contains('is-open')) {
          drawer.style.display = 'none';
        }
      }, 150);
    }
    toggle.addEventListener('click', function () {
      if (drawer.classList.contains('is-open')) {
        close();
      } else {
        open();
      }
    });
    const closeBtn = drawer.querySelector('.flow-ew-elementor-drawer__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', close);
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        close();
      }
    });

    // Click outside the popup closes it. Ignore the reviewer clear (×) so
    // removal is never treated as an outside-dismiss.
    document.addEventListener('mousedown', function (e) {
      if (!drawer.classList.contains('is-open')) {
        return;
      }
      if (e.target.closest('.flow-ew-reviewer-combobox__clear')) {
        return;
      }
      if (drawer.contains(e.target) || toggle.contains(e.target)) {
        return;
      }
      close();
    });

    // Backup clear wiring — classic capture may miss if boot attached elsewhere.
    drawer.addEventListener('pointerdown', function (e) {
      const btn = e.target.closest('.flow-ew-reviewer-combobox__clear');
      if (!btn || !drawer.contains(btn)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      document.dispatchEvent(new CustomEvent('flow-ew:clear-reviewer'));
    }, true);

    // Reposition on layout changes while open.
    window.addEventListener('resize', function () {
      if (drawer.classList.contains('is-open')) {
        positionPopup();
      }
    });
    function flowReviewStatusApproved() {
      const ds = toggle && toggle.dataset && toggle.dataset.status;
      if (ds === 'approved') {
        return true;
      }
      const ew = window.flowEW;
      return !!(ew && ew.activeReview && ew.activeReview.status === 'approved');
    }
    function tryElementorSetDocumentModified() {
      if (!flowReviewStatusApproved()) {
        return;
      }
      try {
        if (window.$e && typeof window.$e.internal === 'function') {
          window.$e.internal('document/save/set-is-modified', {
            status: true
          });
          return;
        }
      } catch (_) {
        // Command missing or editor not ready.
      }
      try {
        const doc = window.elementor && window.elementor.documents && window.elementor.documents.getCurrent && window.elementor.documents.getCurrent();
        if (doc && doc.editor) {
          doc.editor.isChanged = true;
          doc.editor.isSaved = false;
        }
        if (window.elementor && window.elementor.channels && window.elementor.channels.editor) {
          window.elementor.channels.editor.reply('status', true).trigger('status:change', true);
        }
      } catch (_) {
        // Legacy paths unavailable.
      }
    }
    function scheduleTryElementorSetDocumentModified() {
      window.requestAnimationFrame(function () {
        tryElementorSetDocumentModified();
        window.setTimeout(tryElementorSetDocumentModified, 150);
        window.setTimeout(tryElementorSetDocumentModified, 600);
      });
    }
    document.addEventListener('flow-ew:classic-render', function (e) {
      const review = e.detail && e.detail.review;
      toggle.dataset.status = review && review.status || '';
      (0,_shared_sync_reviewer_combobox_from_review__WEBPACK_IMPORTED_MODULE_1__.syncReviewerComboboxFromReview)(review, drawer);
      scheduleTryElementorSetDocumentModified();
    });
    document.addEventListener('flow-ew:reload-review', function () {
      window.setTimeout(scheduleTryElementorSetDocumentModified, 600);
    });
    if (window.jQuery) {
      window.jQuery(window).on('elementor:init', function () {
        scheduleTryElementorSetDocumentModified();
      });
    }
    if (flowReviewStatusApproved()) {
      scheduleTryElementorSetDocumentModified();
    }
    function onElementorSave() {
      setTimeout(function () {
        document.dispatchEvent(new CustomEvent('flow-ew:reload-review'));
      }, 500);
    }
    if (window.elementor) {
      try {
        window.elementor.on('document:saved', onElementorSave);
      } catch (_) {
        // Older Elementor.
      }
    }
    if (window.jQuery) {
      window.jQuery(document).on('heartbeat-tick.wp-refresh-nonces', function () {
        setTimeout(function () {
          document.dispatchEvent(new CustomEvent('flow-ew:reload-review'));
        }, 500);
      });
    }
  })(drawer, toggle);
})(0);

/***/ },

/***/ "./src/shared/assign-invite-email.js"
/*!*******************************************!*\
  !*** ./src/shared/assign-invite-email.js ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   dispatchAssignInviteEmail: () => (/* binding */ dispatchAssignInviteEmail),
/* harmony export */   isValidEmail: () => (/* binding */ isValidEmail)
/* harmony export */ });
/**
 * Ask the classic-editor companion to create/update a review with an external
 * email invite. Builders that own their own combobox (Avada / Beaver / Divi /
 * Oxygen / Breakdance) dispatch this instead of duplicating the REST call.
 *
 * @param {string} email
 * @return {boolean} Whether a non-empty email was dispatched.
 */
function dispatchAssignInviteEmail(email) {
  const trimmed = String(email || '').trim().toLowerCase();
  if (!trimmed) {
    return false;
  }
  document.dispatchEvent(new CustomEvent('flow-ew:assign-invite-email', {
    detail: {
      email: trimmed
    }
  }));
  return true;
}

/**
 * @param {string} value
 * @return {boolean}
 */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

/***/ },

/***/ "./src/shared/invite-link-copy.js"
/*!****************************************!*\
  !*** ./src/shared/invite-link-copy.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   bindInviteLinkCopy: () => (/* binding */ bindInviteLinkCopy),
/* harmony export */   prepareInviteCopyButton: () => (/* binding */ prepareInviteCopyButton),
/* harmony export */   syncInviteLinkCopy: () => (/* binding */ syncInviteLinkCopy)
/* harmony export */ });
/* harmony import */ var _share_bar_icons__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./share-bar-icons */ "./src/shared/share-bar-icons.js");
/**
 * Copy control for an external reviewer's magic link, for the Classic editor,
 * every builder drawer, and the Pro multi-reviewer rows. Gutenberg has its own
 * React version in `sidebar/components/InviteLinkCopy.js`.
 *
 * The link is fetched rather than rendered into the page: the review payload
 * also feeds webhooks, and a live entry token must not travel off-site. It is
 * fetched when the button appears, not on click, so the clipboard write stays
 * inside the user gesture — Safari rejects a write that happens after an await.
 */


const FREE_SELECTOR = '.flow-ew-reviewer-combobox__copy';
const PRO_SELECTOR = '.flow-ew-reviewer-card__copy';
const CLICK_SELECTOR = FREE_SELECTOR + ',' + PRO_SELECTOR;
const BOUND_FLAG = 'flowEwInviteCopyBound';
function config() {
  return typeof window !== 'undefined' && window.flowEW || {};
}
function copyLabel() {
  const {
    i18n
  } = config();
  return i18n && i18n.copyInviteLink || 'Copy invite link';
}
function copiedLabel() {
  const {
    i18n
  } = config();
  return i18n && i18n.copied || 'Copied!';
}
function hasEmailReviewer(review) {
  if (!review) {
    return false;
  }
  if (review.invite_email) {
    return true;
  }
  if (review.reviewer && review.reviewer.is_email) {
    return true;
  }
  return !!(Array.isArray(review.email_invites) && review.email_invites.length > 0);
}

/** Sent yet? Before that there is nothing for the reviewer to open. */
function isSent(review) {
  const status = review ? String(review.status || '') : '';
  return '' !== status && 'pending' !== status;
}

/**
 * Fetch one invite link into a button and reveal it.
 *
 * @param {HTMLElement}           button
 * @param {object|null|undefined} review
 * @param {string}                [email] Which invite. Omit for the single Free
 *                                        invite; Pro passes one per reviewer.
 */
function prepareInviteCopyButton(button, review, email) {
  if (!button) {
    return;
  }
  const reviewId = review ? Number(review.id || 0) : 0;
  if (!reviewId || !isSent(review)) {
    button.hidden = true;
    delete button.dataset.url;
    delete button.dataset.inviteKey;
    return;
  }
  button.setAttribute('aria-label', copyLabel());
  button.setAttribute('title', copyLabel());

  // Cached per review and address — the token stays valid for its lifetime.
  const key = reviewId + ':' + (email || '');
  if (button.dataset.url && button.dataset.inviteKey === key) {
    button.hidden = false;
    return;
  }
  const {
    restUrl,
    nonce
  } = config();
  if (!restUrl) {
    return;
  }
  button.dataset.inviteKey = key;
  const query = email ? '?email=' + encodeURIComponent(email) : '';
  fetch(restUrl + '/reviews/' + reviewId + '/invite-link' + query, {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      'X-WP-Nonce': nonce || ''
    }
  }).then(res => res.ok ? res.json() : null).then(data => {
    if (data && data.url) {
      button.dataset.url = data.url;
      button.hidden = false;
    } else {
      button.hidden = true;
    }
  }).catch(() => {
    button.hidden = true;
  });
}

/**
 * Free combobox path: one invite, one button inside the reviewer field.
 *
 * @param {object|null|undefined} review
 * @param {ParentNode}            [scope=document]
 */
function syncInviteLinkCopy(review, scope) {
  const root = scope || document;
  const button = root.querySelector && root.querySelector(FREE_SELECTOR) || document.querySelector(FREE_SELECTOR);
  if (!button) {
    return;
  }
  if (!hasEmailReviewer(review)) {
    button.hidden = true;
    delete button.dataset.url;
    delete button.dataset.inviteKey;
    return;
  }
  prepareInviteCopyButton(button, review);
}

/**
 * Delegated click handler. Bound once per document however many surfaces call
 * it, since builders can mount several drawers over one page life.
 */
function bindInviteLinkCopy() {
  if (typeof document === 'undefined' || document.body[BOUND_FLAG]) {
    return;
  }
  document.body[BOUND_FLAG] = true;

  // `fullRender()` is the canonical "review changed" hook and every builder
  // already listens to it. Sending for review flips the status without
  // touching the combobox, so without this the button would not appear until
  // the next reviewer edit.
  document.addEventListener('flow-ew:classic-render', function (event) {
    syncInviteLinkCopy(event && event.detail ? event.detail.review : null);
  });
  document.addEventListener('click', function (event) {
    const button = event.target.closest && event.target.closest(CLICK_SELECTOR);
    if (!button || !button.dataset.url) {
      return;
    }
    event.preventDefault();
    const doneClass = button.classList.contains('flow-ew-reviewer-card__copy') ? 'flow-ew-reviewer-card__copy--done' : 'flow-ew-reviewer-combobox__copy--done';
    navigator.clipboard.writeText(button.dataset.url).then(() => {
      button.innerHTML = (0,_share_bar_icons__WEBPACK_IMPORTED_MODULE_0__.shareBarIconHtml)('copied');
      button.classList.add(doneClass);
      button.setAttribute('aria-label', copiedLabel());
      button.setAttribute('title', copiedLabel());
      setTimeout(() => {
        button.innerHTML = (0,_share_bar_icons__WEBPACK_IMPORTED_MODULE_0__.shareBarIconHtml)('copy');
        button.classList.remove(doneClass);
        button.setAttribute('aria-label', copyLabel());
        button.setAttribute('title', copyLabel());
      }, 2000);
    });
  });
}

/***/ },

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

/***/ "./src/shared/resolve-classic-root.js"
/*!********************************************!*\
  !*** ./src/shared/resolve-classic-root.js ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolveClassicOpenSlot: () => (/* binding */ resolveClassicOpenSlot),
/* harmony export */   resolveClassicReviewerSlot: () => (/* binding */ resolveClassicReviewerSlot),
/* harmony export */   resolveClassicRoot: () => (/* binding */ resolveClassicRoot)
/* harmony export */ });
/**
 * Prefer the visible builder drawer panel over the Classic Editor metabox.
 * On `post.php?action=elementor` both can exist in the DOM with duplicate IDs.
 */

const BUILDER_DRAWER_IDS = ['flow-ew-elementor-drawer', 'flow-ew-bricks-drawer', 'flow-ew-breakdance-drawer', 'flow-ew-avada-drawer', 'flow-ew-beaver-drawer', 'flow-ew-divi-drawer', 'flow-ew-oxygen-drawer'];

/**
 * When the Elementor toggle is already in the DOM, wait for the drawer panel
 * before falling back to a classic metabox — otherwise boot attaches to the
 * wrong root and the drawer × clear never fires.
 */
function shouldWaitForBuilderDrawer() {
  if (document.getElementById('flow-ew-elementor-toggle') && !document.getElementById('flow-ew-elementor-drawer')) {
    return true;
  }
  return false;
}
function resolveClassicRoot() {
  if (shouldWaitForBuilderDrawer()) {
    return null;
  }
  for (let i = 0; i < BUILDER_DRAWER_IDS.length; i++) {
    const el = document.querySelector('#' + BUILDER_DRAWER_IDS[i] + ' #flow-ew-classic');
    if (el) {
      return el;
    }
  }
  return document.getElementById('flow-ew-classic');
}
function resolveClassicOpenSlot() {
  for (let i = 0; i < BUILDER_DRAWER_IDS.length; i++) {
    const el = document.querySelector('#' + BUILDER_DRAWER_IDS[i] + ' #flow-ew-classic-open-slot');
    if (el) {
      return el;
    }
  }
  return document.getElementById('flow-ew-classic-open-slot');
}

/**
 * Prefer the builder-drawer reviewer slot even when the drawer is display:none
 * (Elementor boots closed). Falling back to "first visible" picks the classic
 * metabox and leaves the Elementor drawer without Pro chips.
 */
function resolveClassicReviewerSlot() {
  const slots = Array.from(document.querySelectorAll('#flow-ew-classic-reviewer-slot'));
  if (!slots.length) {
    return null;
  }
  for (let i = 0; i < BUILDER_DRAWER_IDS.length; i++) {
    const id = BUILDER_DRAWER_IDS[i];
    if (!document.getElementById(id)) {
      continue;
    }
    const inDrawer = slots.find(el => el && el.closest('#' + id));
    if (inDrawer) {
      return inDrawer;
    }
  }
  const visible = slots.find(el => el && el.offsetParent !== null);
  return visible || slots[0];
}

/***/ },

/***/ "./src/shared/review-notice-dom.js"
/*!*****************************************!*\
  !*** ./src/shared/review-notice-dom.js ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ensureReviewNotices: () => (/* binding */ ensureReviewNotices),
/* harmony export */   syncReviewNoticeVisibility: () => (/* binding */ syncReviewNoticeVisibility)
/* harmony export */ });
/* harmony import */ var _is_publish_blocked__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./is-publish-blocked */ "./src/shared/is-publish-blocked.js");
/* harmony import */ var _no_review_roles_notice__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./no-review-roles-notice */ "./src/shared/no-review-roles-notice.js");
/* harmony import */ var _resolve_classic_root__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./resolve-classic-root */ "./src/shared/resolve-classic-root.js");



function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
function collectClassicRoots() {
  const roots = [];
  const primary = (0,_resolve_classic_root__WEBPACK_IMPORTED_MODULE_2__.resolveClassicRoot)();
  if (primary) {
    roots.push(primary);
  }
  document.querySelectorAll('#flow-ew-classic').forEach(el => {
    if (!roots.includes(el)) {
      roots.push(el);
    }
  });
  return roots;
}
function isRolesDismissNotice(el) {
  return el?.dataset?.flowEwDismiss === _no_review_roles_notice__WEBPACK_IMPORTED_MODULE_1__.NO_REVIEW_ROLES_DISMISS_VALUE;
}
function wireDismissButton(notice) {
  if (!notice || !isRolesDismissNotice(notice)) {
    return;
  }
  if (notice.dataset.flowEwDismissWired === '1') {
    return;
  }
  notice.dataset.flowEwDismissWired = '1';
  let btn = notice.querySelector('.flow-ew-review-notice__dismiss');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'flow-ew-review-notice__dismiss';
    btn.setAttribute('aria-label', 'Dismiss');
    btn.innerHTML = '<span aria-hidden="true">&times;</span>';
    notice.prepend(btn);
  }
  btn.addEventListener('click', event => {
    event.preventDefault();
    (0,_no_review_roles_notice__WEBPACK_IMPORTED_MODULE_1__.dismissNoReviewRolesNotice)();
    document.querySelectorAll(`.flow-ew-review-notice[data-flow-ew-dismiss="${_no_review_roles_notice__WEBPACK_IMPORTED_MODULE_1__.NO_REVIEW_ROLES_DISMISS_VALUE}"]`).forEach(el => {
      el.hidden = true;
    });
  });
}

/**
 * Toggle publish-guard notices. Works on PHP-rendered and JS-fallback notices.
 */
function syncReviewNoticeVisibility(args) {
  const blocked = (0,_is_publish_blocked__WEBPACK_IMPORTED_MODULE_0__.isPublishBlocked)(args);
  const rolesDismissed = (0,_no_review_roles_notice__WEBPACK_IMPORTED_MODULE_1__.isNoReviewRolesNoticeDismissed)();
  document.querySelectorAll('.flow-ew-review-notice').forEach(el => {
    if (isRolesDismissNotice(el) && rolesDismissed) {
      el.hidden = true;
      return;
    }
    if (el.dataset.flowEwPublishGuardOnly === '1') {
      el.hidden = !blocked;
      return;
    }
    el.hidden = false;
  });
}
function buildNoticeSpec(flowEW, review, publishBlocked) {
  const i18n = flowEW.i18n || {};
  const noReviewers = !!flowEW.noReviewers;
  const reviewMandatory = !!flowEW.reviewMandatory;
  const rolesDismissed = (0,_no_review_roles_notice__WEBPACK_IMPORTED_MODULE_1__.isNoReviewRolesNoticeDismissed)();
  if (noReviewers && !reviewMandatory) {
    if (rolesDismissed) {
      return null;
    }
    return {
      variant: 'in-review',
      role: 'status',
      publishGuardOnly: false,
      dismissableRoles: true,
      title: i18n.noReviewRolesTitle || 'No Review Roles Assigned',
      descHtml: flowEW.reviewRolesHintHtml || ''
    };
  }
  if (!publishBlocked) {
    return null;
  }
  if (noReviewers) {
    if (rolesDismissed) {
      return null;
    }
    const descParts = [i18n.reviewMandatoryDesc || i18n.publishGuardTooltip || 'Post can go live only after approval by a reviewer.'];
    if (flowEW.reviewRolesHintHtml) {
      descParts.push(flowEW.reviewRolesHintHtml);
    }
    return {
      variant: 'in-review',
      role: 'status',
      publishGuardOnly: true,
      dismissableRoles: true,
      title: i18n.noReviewRolesTitle || 'No Review Roles Assigned',
      descHtml: descParts.join(' ')
    };
  }
  return {
    variant: 'in-review',
    role: 'note',
    publishGuardOnly: true,
    title: i18n.reviewMandatoryTitle || 'Review Mode set to Mandatory',
    descHtml: i18n.reviewMandatoryDesc || i18n.publishGuardTooltip || 'Post can go live only after approval by a reviewer.'
  };
}
function renderNoticeElement(spec) {
  const div = document.createElement('div');
  div.className = 'flow-ew-review-notice flow-ew-review-notice--' + spec.variant;
  div.setAttribute('role', spec.role);
  div.dataset.flowEwJsNotice = '1';
  if (spec.publishGuardOnly) {
    div.dataset.flowEwPublishGuardOnly = '1';
  }
  if (spec.dismissableRoles) {
    div.dataset.flowEwDismiss = _no_review_roles_notice__WEBPACK_IMPORTED_MODULE_1__.NO_REVIEW_ROLES_DISMISS_VALUE;
  }
  div.innerHTML = '<p class="flow-ew-review-notice__title">' + escHtml(spec.title) + '</p>' + '<p class="flow-ew-review-notice__desc">' + spec.descHtml + '</p>';
  wireDismissButton(div);
  return div;
}
function insertNotice(root, notice) {
  // Keep Mandatory / role notices above Open Review (and everything else).
  const openSlot = root.querySelector('#flow-ew-classic-open-slot');
  if (openSlot) {
    openSlot.insertAdjacentElement('beforebegin', notice);
    return;
  }
  root.prepend(notice);
}

/**
 * Ensure review mode notices exist in builder/classic panels (SSR fallback).
 */
function ensureReviewNotices({
  review,
  reviewMandatory,
  reviewerMeta,
  isPublished,
  currentUserCan
}) {
  const flowEW = window.flowEW;
  if (!flowEW || !currentUserCan?.assignReviewer) {
    document.querySelectorAll('.flow-ew-review-notice[data-flow-ew-js-notice="1"]').forEach(el => el.remove());
    syncReviewNoticeVisibility({
      reviewMandatory,
      isPublished,
      review,
      reviewerMeta
    });
    return;
  }
  const publishBlocked = (0,_is_publish_blocked__WEBPACK_IMPORTED_MODULE_0__.isPublishBlocked)({
    reviewMandatory,
    isPublished,
    review,
    reviewerMeta
  });
  const spec = buildNoticeSpec(flowEW, review, publishBlocked);
  collectClassicRoots().forEach(root => {
    const jsNotice = root.querySelector('.flow-ew-review-notice[data-flow-ew-js-notice="1"]');
    const hasPhpNotice = root.querySelector('.flow-ew-review-notice:not([data-flow-ew-js-notice])');
    if (hasPhpNotice) {
      wireDismissButton(hasPhpNotice);
    }
    if (!spec) {
      if (jsNotice) {
        jsNotice.remove();
      }
      return;
    }
    if (hasPhpNotice) {
      if (jsNotice) {
        jsNotice.remove();
      }
      return;
    }
    if (jsNotice) {
      const next = renderNoticeElement(spec);
      jsNotice.replaceWith(next);
      return;
    }
    insertNotice(root, renderNoticeElement(spec));
  });
  syncReviewNoticeVisibility({
    reviewMandatory,
    isPublished,
    review,
    reviewerMeta
  });
}

/***/ },

/***/ "./src/shared/reviewer-email-entry.js"
/*!********************************************!*\
  !*** ./src/shared/reviewer-email-entry.js ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   exitReviewerEmailEntryMode: () => (/* binding */ exitReviewerEmailEntryMode),
/* harmony export */   filterReviewerComboboxOptions: () => (/* binding */ filterReviewerComboboxOptions),
/* harmony export */   formatInviteOptionLabel: () => (/* binding */ formatInviteOptionLabel),
/* harmony export */   getEmailPlaceholder: () => (/* binding */ getEmailPlaceholder),
/* harmony export */   getExternalEmailLabel: () => (/* binding */ getExternalEmailLabel),
/* harmony export */   getReviewerPlaceholder: () => (/* binding */ getReviewerPlaceholder),
/* harmony export */   isEmailComboboxOption: () => (/* binding */ isEmailComboboxOption),
/* harmony export */   isValidEmail: () => (/* reexport safe */ _assign_invite_email__WEBPACK_IMPORTED_MODULE_0__.isValidEmail),
/* harmony export */   shouldHideReviewerAutocomplete: () => (/* binding */ shouldHideReviewerAutocomplete)
/* harmony export */ });
/* harmony import */ var _assign_invite_email__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./assign-invite-email */ "./src/shared/assign-invite-email.js");
/**
 * Helpers for Free reviewer combobox email-entry mode.
 *
 * - After External Email is chosen, keep the list closed while the address is
 *   incomplete.
 * - Once the typed address is fully valid, open the list with an "Invite {email}"
 *   row (Classic / builders / Gutenberg).
 */



function isEmailComboboxOption(li) {
  return !!(li && (li.dataset.isEmail === '1' || li.dataset.value === 'email'));
}
function getEmailPlaceholder() {
  const i18n = window.flowEW && window.flowEW.i18n || {};
  return i18n.emailPlaceholder || 'name@example.com';
}
function getReviewerPlaceholder() {
  const i18n = window.flowEW && window.flowEW.i18n || {};
  return i18n.reviewerPlaceholder || 'assign a dedicated reviewer';
}

/**
 * Leave External Email compose mode and restore the default autocomplete UI.
 *
 * @param {HTMLSelectElement|null} select
 * @param {HTMLInputElement|null} input
 * @param {HTMLElement[]} [options]
 */
function exitReviewerEmailEntryMode(select, input, options) {
  if (select) {
    if (select.value === 'email') {
      select.value = '';
    }
    delete select.dataset.inviteEmail;
  }
  if (input && !input.readOnly) {
    input.placeholder = getReviewerPlaceholder();
  }
  const externalLabel = getExternalEmailLabel();
  (options || []).forEach(function (li) {
    if (!isEmailComboboxOption(li)) {
      return;
    }
    li.hidden = false;
    li.style.display = '';
    li.textContent = li.dataset.label || externalLabel;
  });
}
function getExternalEmailLabel() {
  const i18n = window.flowEW && window.flowEW.i18n || {};
  return i18n.externalEmail || 'External Email';
}

/**
 * @param {string} email
 * @return {string}
 */
function formatInviteOptionLabel(email) {
  const i18n = window.flowEW && window.flowEW.i18n || {};
  const tpl = i18n.inviteEmail || 'Invite %s';
  return String(tpl).replace('%s', String(email || '').trim());
}

/**
 * Hide the autocomplete while composing an incomplete external email.
 * Always show it again once the typed value is a valid address (Invite row).
 *
 * @param {HTMLSelectElement|null} select
 * @param {HTMLInputElement|null} input
 * @param {boolean} [emailEntryMode]
 * @return {boolean}
 */
function shouldHideReviewerAutocomplete(select, input, emailEntryMode) {
  const typed = String(input && input.value || '').trim();
  if ((0,_assign_invite_email__WEBPACK_IMPORTED_MODULE_0__.isValidEmail)(typed)) {
    return false;
  }
  return !!(emailEntryMode || select && select.value === 'email');
}

/**
 * Filter combobox options. The email row shows as "External Email" when the
 * query is empty, or as "Invite {email}" only when the query is a valid address.
 *
 * @param {HTMLElement[]} options
 * @param {string} q
 * @param {{ emailOnly?: boolean }} [opts]
 */
function filterReviewerComboboxOptions(options, q, opts) {
  const needle = String(q || '').toLowerCase().trim();
  const emailOnly = !!(opts && opts.emailOnly);
  const externalLabel = getExternalEmailLabel();
  (options || []).forEach(function (li) {
    const isEmail = isEmailComboboxOption(li);
    const baseLabel = String(li.dataset.label || externalLabel).trim();
    const labelLower = baseLabel.toLowerCase();
    if (isEmail) {
      // No WP users — type the address directly; never a lone email row.
      if (emailOnly) {
        li.hidden = true;
        li.style.display = 'none';
        li.classList.remove('flow-ew-reviewer-combobox__option--invite');
        li.textContent = li.dataset.label || externalLabel;
        return;
      }
      if (!needle) {
        li.hidden = false;
        li.style.display = '';
        // External Email above WP users — keep separator border.
        li.classList.remove('flow-ew-reviewer-combobox__option--invite');
        li.textContent = li.dataset.label || externalLabel;
        return;
      }
      if ((0,_assign_invite_email__WEBPACK_IMPORTED_MODULE_0__.isValidEmail)(needle)) {
        li.hidden = false;
        li.style.display = '';
        // Invite row is an action, not a section header — no border.
        li.classList.add('flow-ew-reviewer-combobox__option--invite');
        li.textContent = formatInviteOptionLabel(needle);
        return;
      }
      // Incomplete address (e.g. test@t) — never show Invite / email row.
      li.hidden = true;
      li.style.display = 'none';
      li.classList.remove('flow-ew-reviewer-combobox__option--invite');
      li.textContent = li.dataset.label || externalLabel;
      return;
    }
    const show = !needle || labelLower.includes(needle);
    li.hidden = !show;
    li.style.display = show ? '' : 'none';
  });
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

/***/ "./src/shared/sync-reviewer-combobox-from-review.js"
/*!**********************************************************!*\
  !*** ./src/shared/sync-reviewer-combobox-from-review.js ***!
  \**********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   syncReviewerComboboxFromReview: () => (/* binding */ syncReviewerComboboxFromReview)
/* harmony export */ });
/* harmony import */ var _reviewer_email_entry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./reviewer-email-entry */ "./src/shared/reviewer-email-entry.js");
/* harmony import */ var _invite_link_copy__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./invite-link-copy */ "./src/shared/invite-link-copy.js");



/**
 * Keep the Classic / builder Free combobox in sync with the active review.
 * Email invites use reviewer_id=0 and a synthetic negative reviewer.id — never
 * treat those as native <select> values or the field clears after every render.
 *
 * Once a reviewer (WP user or email invite) is assigned, the input is read-only
 * — remove only via the clear (×) button.
 *
 * @param {object|null|undefined} review
 * @param {ParentNode} [scope=document]
 */
function syncReviewerComboboxFromReview(review, scope) {
  const root = scope || document;
  const select = root.querySelector('#flow-ew-reviewer-select') || document.getElementById('flow-ew-reviewer-select');
  const input = root.querySelector('#flow-ew-reviewer-input') || document.getElementById('flow-ew-reviewer-input');
  if (!select || !input) {
    return;
  }
  const list = root.querySelector('#flow-ew-reviewer-listbox') || document.getElementById('flow-ew-reviewer-listbox');
  const clearBtn = root.querySelector('.flow-ew-reviewer-combobox__clear') || document.querySelector('.flow-ew-reviewer-combobox__clear');
  const reviewerPlaceholder = (0,_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_0__.getReviewerPlaceholder)();
  const emailPlaceholder = (0,_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_0__.getEmailPlaceholder)();
  const externalLabel = (0,_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_0__.getExternalEmailLabel)();
  const inviteEmail = review ? String(review.invite_email || (review.reviewer && review.reviewer.is_email ? review.reviewer.email || review.reviewer.name || '' : '') || (Array.isArray(review.email_invites) && review.email_invites[0] ? review.email_invites[0].email || review.email_invites[0].name || '' : '')).trim() : '';
  const hasInvite = !!(inviteEmail || review && review.reviewer && review.reviewer.is_email || review && Array.isArray(review.email_invites) && review.email_invites.length > 0);

  // Only real WP user ids belong in the native <select>.
  const rid = review ? Number(review.reviewer_id || 0) : 0;
  const locked = rid > 0 || hasInvite;
  const wasLocked = input.dataset.flowLocked === '1' || input.readOnly === true;
  if (rid > 0) {
    select.value = String(rid);
    delete select.dataset.inviteEmail;
    const opt = select.options[select.selectedIndex];
    input.value = opt && opt.value ? opt.textContent.replace(/^\s+|\s+$/g, '') : '';
    input.placeholder = reviewerPlaceholder;
  } else if (hasInvite) {
    select.value = 'email';
    select.dataset.inviteEmail = inviteEmail;
    input.value = review.reviewer && (review.reviewer.name || review.reviewer.email) || inviteEmail || '';
    input.placeholder = emailPlaceholder;
  } else if (wasLocked) {
    // Cleared an assigned reviewer — restore default autocomplete, not
    // External Email compose mode. Do not wipe while the user is only
    // composing an email (unlocked syncs must leave that alone).
    select.value = '';
    delete select.dataset.inviteEmail;
    input.value = '';
    input.placeholder = reviewerPlaceholder;
  }
  input.readOnly = locked;
  input.setAttribute('aria-readonly', locked ? 'true' : 'false');
  input.dataset.flowLocked = locked ? '1' : '0';
  if (locked) {
    input.setAttribute('aria-expanded', 'false');
    if (list) {
      list.hidden = true;
    }
  }
  if (clearBtn) {
    clearBtn.toggleAttribute('hidden', !locked);
  }
  (0,_invite_link_copy__WEBPACK_IMPORTED_MODULE_1__.bindInviteLinkCopy)();
  (0,_invite_link_copy__WEBPACK_IMPORTED_MODULE_1__.syncInviteLinkCopy)(review, root);
  if (list) {
    list.querySelectorAll('[role="option"]').forEach(function (li) {
      const value = String(li.dataset.value || '');
      const match = rid > 0 && Number(value) === rid || hasInvite && (value === 'email' || li.dataset.isEmail === '1');
      if (match) {
        li.setAttribute('aria-selected', 'true');
      } else {
        li.removeAttribute('aria-selected');
      }
      if (wasLocked && !locked && (value === 'email' || li.dataset.isEmail === '1')) {
        li.hidden = false;
        li.style.display = '';
        li.textContent = li.dataset.label || externalLabel;
      } else if (wasLocked && !locked) {
        li.hidden = false;
        li.style.display = '';
      }
    });
  }

  // Only when leaving an assignment — builders keep a local emailEntryMode.
  if (wasLocked && !locked) {
    document.dispatchEvent(new CustomEvent('flow-ew:reviewer-field-reset', {
      detail: {
        scope: root
      }
    }));
  }
}

/***/ },

/***/ "./src/elementor/style.css"
/*!*********************************!*\
  !*** ./src/elementor/style.css ***!
  \*********************************/
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
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
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
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"elementor/index": 0,
/******/ 			"elementor/style-index": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = globalThis["webpackChunkjumplinks_editorial_workflow"] = globalThis["webpackChunkjumplinks_editorial_workflow"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["elementor/style-index"], () => (__webpack_require__("./src/elementor/index.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map