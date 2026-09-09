/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/classic-editor/index.js"
/*!*************************************!*\
  !*** ./src/classic-editor/index.js ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./style.css */ "./src/classic-editor/style.css");
/* harmony import */ var _shared_share_bar_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shared/share-bar.css */ "./src/shared/share-bar.css");
/* harmony import */ var _open_review__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./open-review */ "./src/classic-editor/open-review.js");
/* harmony import */ var _shared_status_themes__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../shared/status-themes */ "./src/shared/status-themes.js");
/* harmony import */ var _shared_is_publish_blocked__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/is-publish-blocked */ "./src/shared/is-publish-blocked.js");
/* harmony import */ var _shared_publish_guard_ui__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shared/publish-guard-ui */ "./src/shared/publish-guard-ui.js");
/* harmony import */ var _shared_share_bar_icons__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../shared/share-bar-icons */ "./src/shared/share-bar-icons.js");
/* harmony import */ var _shared_resolve_classic_root__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../shared/resolve-classic-root */ "./src/shared/resolve-classic-root.js");
/* harmony import */ var _shared_review_notice_dom__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../shared/review-notice-dom */ "./src/shared/review-notice-dom.js");
/* harmony import */ var _shared_should_show_send_for_review__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../shared/should-show-send-for-review */ "./src/shared/should-show-send-for-review.js");
/* harmony import */ var _shared_sync_reviewer_combobox_from_review__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../shared/sync-reviewer-combobox-from-review */ "./src/shared/sync-reviewer-combobox-from-review.js");
/* harmony import */ var _shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../shared/reviewer-email-entry */ "./src/shared/reviewer-email-entry.js");












(function bootClassicEditor(attempt) {
  const {
    flowEW
  } = window;
  if (!flowEW) {
    return;
  }
  const root = (0,_shared_resolve_classic_root__WEBPACK_IMPORTED_MODULE_7__.resolveClassicRoot)();
  if (!root) {
    // Elementor footer panel can appear after companion scripts; wait longer.
    if (attempt < 600) {
      requestAnimationFrame(function () {
        bootClassicEditor(attempt + 1);
      });
    }
    return;
  }
  if (root.dataset.flowEwClassicReady === '1') {
    return;
  }
  root.dataset.flowEwClassicReady = '1';
  (function runClassicEditor(root) {
    const {
      restUrl,
      nonce,
      postId,
      currentUserId,
      currentUserCan,
      activeReview,
      reviewMandatory,
      reviewerMeta = 0,
      i18n
    } = flowEW;
    const STATUS_LABELS = {
      pending: i18n.statusPending,
      in_review: i18n.statusInReview,
      changes_requested: i18n.statusChangesReq,
      approved: i18n.statusApproved,
      open_review: i18n.statusOpenReview
    };
    // Palette lives in src/shared/status-themes.js — keep CSS/SCSS mirrors in sync.

    let review = activeReview;
    let loading = false;
    const $ = (sel, ctx) => (ctx || document).querySelector(sel);
    const submitBox = $('#submitdiv');
    const reviewBox = $('#flow-ew-review');
    if (submitBox && reviewBox && submitBox.nextElementSibling !== reviewBox) {
      submitBox.insertAdjacentElement('afterend', reviewBox);
    }
    function api(path, method) {
      return fetch(restUrl + path, {
        method: method || 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce
        }
      }).then(r => r.json());
    }
    function apiPost(path, body) {
      return fetch(restUrl + path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce
        },
        body: body ? JSON.stringify(body) : undefined
      }).then(r => {
        if (!r.ok) {
          return r.json().then(e => Promise.reject(e));
        }
        if (r.status === 204) {
          return null;
        }
        return r.json();
      });
    }
    function setLoading(val) {
      loading = val;
      const spinner = $('#flow-ew-classic-spinner');
      if (spinner) {
        spinner.classList.toggle('is-active', val);
      }
      root.querySelectorAll('button, select, .flow-ew-reviewer-combobox__input').forEach(el => {
        el.disabled = val;
      });
    }
    function currentReviewerId() {
      const fromReview = Number(review?.reviewer_id || review?.reviewer && review.reviewer.id || 0);
      const fromMeta = Number(reviewerMeta || 0);
      return fromReview > 0 ? fromReview : fromMeta;
    }
    function isAlreadyPublished() {
      if (flowEW && flowEW.isPublished) {
        return true;
      }
      const orig = $('#original_post_status');
      return !!(orig && orig.value === 'publish');
    }
    function isPublishBlockedLocal() {
      return (0,_shared_is_publish_blocked__WEBPACK_IMPORTED_MODULE_4__.isPublishBlocked)({
        reviewMandatory,
        isPublished: isAlreadyPublished(),
        review,
        reviewerMeta
      });
    }
    function noticeState() {
      return {
        reviewMandatory,
        isPublished: isAlreadyPublished(),
        review,
        reviewerMeta,
        currentUserCan
      };
    }
    function refreshReviewNotices() {
      (0,_shared_review_notice_dom__WEBPACK_IMPORTED_MODULE_8__.ensureReviewNotices)(noticeState());
    }
    function syncReviewNoticeVisibilityLocal() {
      (0,_shared_review_notice_dom__WEBPACK_IMPORTED_MODULE_8__.syncReviewNoticeVisibility)(noticeState());
    }
    function getElementorEditorRoots() {
      return [document.getElementById('elementor-editor-wrapper-v2'), document.getElementById('elementor-editor-wrapper')].filter(Boolean);
    }
    function findElementorPublishButtons() {
      const seen = new Set();
      const list = [];
      const roots = getElementorEditorRoots();
      for (let r = 0; r < roots.length; r++) {
        const buttons = roots[r].querySelectorAll('button.MuiButton-root');
        for (let i = 0; i < buttons.length; i++) {
          const b = buttons[i];
          if (seen.has(b)) {
            continue;
          }
          const label = b.textContent.replace(/\s+/g, ' ').trim();
          if (/^(Publish|Submit)$/i.test(label)) {
            seen.add(b);
            list.push(b);
          }
        }
      }
      return list;
    }
    function setPublishGuardStyles(el, blocked) {
      (0,_shared_publish_guard_ui__WEBPACK_IMPORTED_MODULE_5__.applyPublishGuardControl)(el, blocked);
    }
    let publishGuardDebounce;
    let publishGuardObserver;
    function updatePublishGuard() {
      const blocked = isPublishBlockedLocal();
      refreshReviewNotices();
      syncReviewNoticeVisibilityLocal();
      const publishBtn = $('#publish');
      if (publishBtn) {
        setPublishGuardStyles(publishBtn, blocked);
      }
      findElementorPublishButtons().forEach(b => setPublishGuardStyles(b, blocked));
    }
    function schedulePublishGuard() {
      clearTimeout(publishGuardDebounce);
      publishGuardDebounce = setTimeout(updatePublishGuard, 80);
    }
    function setupElementorPublishGuardObserver() {
      if (publishGuardObserver) {
        return;
      }
      const roots = getElementorEditorRoots();
      if (!roots.length) {
        return;
      }
      publishGuardObserver = new MutationObserver(schedulePublishGuard);
      for (let i = 0; i < roots.length; i++) {
        publishGuardObserver.observe(roots[i], {
          childList: true,
          subtree: true
        });
      }
    }
    let publishGuardAttachAttempts = 0;
    function tryAttachElementorPublishGuardObserver() {
      setupElementorPublishGuardObserver();
      publishGuardAttachAttempts++;
      if (!publishGuardObserver && publishGuardAttachAttempts < 200) {
        requestAnimationFrame(tryAttachElementorPublishGuardObserver);
      }
    }
    tryAttachElementorPublishGuardObserver();
    window.addEventListener('resize', schedulePublishGuard);
    function applyStatusTheme(el, status) {
      const themeStyle = (0,_shared_status_themes__WEBPACK_IMPORTED_MODULE_3__.statusThemeStyle)(status);
      ['--flow-status-bg', '--flow-status-text', '--flow-status-border', '--flow-badge-color'].forEach(prop => {
        el.style.removeProperty(prop);
      });
      Object.entries(themeStyle).forEach(([prop, value]) => {
        el.style.setProperty(prop, value);
      });
    }
    function renderBadge() {
      const display = review && (review.display_status || review.status);
      const label = display ? STATUS_LABELS[display] || '' : '';
      const visible = !!display && !!label;
      const drawerRoot = root.closest('.flow-ew-elementor-drawer, .flow-ew-bricks-drawer, .flow-ew-breakdance-drawer, .flow-ew-avada-drawer, .flow-ew-beaver-drawer, .flow-ew-divi-drawer');
      const drawerSlot = drawerRoot ? drawerRoot.querySelector('.flow-ew-drawer-status') : $('.flow-ew-drawer-status');
      if (drawerSlot) {
        if (visible) {
          applyStatusTheme(drawerSlot, display);
          drawerSlot.setAttribute('data-status', display);
          drawerSlot.innerHTML = '<span class="flow-ew-classic__badge-dot"></span>' + escHtml(label);
          drawerSlot.removeAttribute('hidden');
        } else {
          drawerSlot.removeAttribute('data-status');
          drawerSlot.setAttribute('hidden', '');
          drawerSlot.innerHTML = '';
        }
        return;
      }

      // Strip any pre-existing body badge (older renders / cached pages).
      const existing = $('.flow-ew-classic__status', root);
      if (existing) {
        existing.remove();
      }
    }
    function renderNotice() {
      const existing = $('.flow-ew-classic__notice', root);
      if (existing) {
        existing.remove();
      }
    }
    function renderActions() {
      const container = root.querySelector('#flow-ew-classic-actions');
      if (!container) {
        return;
      }
      container.innerHTML = '';
      if (!review) {
        return;
      }
      const status = review.status;
      const reviewerId = Number(review.reviewer_id || review.reviewer && review.reviewer.id || 0);
      const isReviewer = reviewerId === currentUserId;
      const hasPending = !!review.has_pending_reviewers;
      const hasInvite = !!(review.invite_email || review.reviewer && review.reviewer.is_email || Array.isArray(review.email_invites) && review.email_invites.length > 0);
      if ((0,_shared_should_show_send_for_review__WEBPACK_IMPORTED_MODULE_9__.shouldShowSendForReview)(review) && currentUserCan.assignReviewer) {
        container.appendChild(makeButton(i18n.sendForReview, 'send', 'button-primary', !reviewerId && !hasInvite));
      }
      if (status === 'changes_requested' && !hasPending && currentUserId === Number(flowEW.postAuthorId || 0)) {
        container.appendChild(makeButton(i18n.resubmit, 'resubmit', 'button-primary'));
      }
      if (status === 'in_review' && isReviewer && currentUserCan.reviewPosts) {
        container.appendChild(makeButton(i18n.approve, 'approve', 'button-primary flow-ew-classic__btn--approve'));
        container.appendChild(makeButton(i18n.requestChanges, 'request-changes', 'flow-ew-classic__btn--changes'));
      }
    }
    function makeButton(text, action, cls, disabled) {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isBeaver = root.classList.contains('flow-ew-classic--beaver');
      if (isBeaver) {
        btn.className = 'fl-builder-button flow-ew-classic__btn';
        if (action === 'send' || action === 'resubmit') {
          btn.classList.add('fl-builder-button-primary');
        }
        if (cls) {
          cls.split(/\s+/).forEach(function (part) {
            if (part && part !== 'button' && part !== 'button-primary') {
              btn.classList.add(part);
            }
          });
        }
      } else {
        btn.className = 'button flow-ew-classic__btn ' + (cls || '');
      }
      btn.dataset.action = action;
      btn.textContent = text;
      if (disabled) {
        btn.disabled = true;
      }
      return btn;
    }
    function renderShareBar() {
      const existing = $('#flow-ew-share');
      if (existing) {
        existing.remove();
      }
      if (!review || !review.revision_preview_url || review.status === 'pending' && !review.is_open) {
        return;
      }
      const url = review.revision_preview_url;
      const div = document.createElement('div');
      div.className = 'flow-ew-classic__share';
      div.id = 'flow-ew-share';
      div.innerHTML = '<span class="flow-ew-classic__share-label">' + escHtml(i18n.snapshotLink) + '</span>' + '<span class="flow-ew-classic__share-row">' + '<a href="' + escAttr(url) + '" target="_blank" rel="noreferrer" class="flow-ew-classic__share-link" title="' + escAttr(url) + '"><span class="flow-ew-classic__share-link-text">' + escHtml(url) + '</span></a>' + '<button type="button" class="button flow-ew-classic__share-copy" data-url="' + escAttr(url) + '">' + (0,_shared_share_bar_icons__WEBPACK_IMPORTED_MODULE_6__.shareBarIconHtml)('copy') + '</button>' + '<a href="' + escAttr(url) + '" target="_blank" rel="noreferrer" class="flow-ew-classic__share-goto" aria-label="' + escAttr(i18n.goToReview || 'Go to review') + '">' + (0,_shared_share_bar_icons__WEBPACK_IMPORTED_MODULE_6__.shareBarIconHtml)('external') + '</a>' + '</span>';
      const spinner = $('#flow-ew-classic-spinner');
      root.insertBefore(div, spinner);
    }
    function fullRender() {
      renderBadge();
      renderNotice();
      renderActions();
      renderShareBar();
      updatePublishGuard();
      updateSendEnabled();
      flowEW.activeReview = review;
      document.dispatchEvent(new CustomEvent('flow-ew:classic-render', {
        detail: {
          review
        }
      }));
    }
    document.addEventListener('flow-ew:set-review', function (e) {
      const next = e && e.detail ? e.detail.review : null;
      review = next || null;
      flowEW.activeReview = review;
      fullRender();
    });
    function syncClearBtn() {
      (0,_shared_sync_reviewer_combobox_from_review__WEBPACK_IMPORTED_MODULE_10__.syncReviewerComboboxFromReview)(review, root);
    }
    function clearAssignedReviewer() {
      if (loading) {
        return;
      }
      if (!review && flowEW.activeReview) {
        review = flowEW.activeReview;
      }
      if (!review || !review.id) {
        return;
      }
      setLoading(true);
      apiPost('/reviews/' + review.id + '/cancel').then(data => {
        review = data || null;
        emailEntryMode = false;
        if (reviewerSelect) {
          reviewerSelect.value = '';
          delete reviewerSelect.dataset.inviteEmail;
        }
        const input = root.querySelector('#flow-ew-reviewer-input');
        const list = root.querySelector('#flow-ew-reviewer-listbox');
        const opts = list ? Array.from(list.querySelectorAll('[role="option"]')) : [];
        if (input) {
          input.value = '';
          input.readOnly = false;
          input.placeholder = (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_11__.getReviewerPlaceholder)();
        }
        (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_11__.exitReviewerEmailEntryMode)(reviewerSelect, input, opts);
        if (input) {
          input.dataset.flowLocked = '0';
        }
        clearEmailError();
        fullRender();
        syncClearBtn();
        document.dispatchEvent(new CustomEvent('flow-ew:reviewer-field-reset', {
          detail: {
            scope: root
          }
        }));
      }).catch(() => {}).finally(() => setLoading(false));
    }
    document.addEventListener('flow-ew:clear-reviewer', function () {
      clearAssignedReviewer();
    });

    // Capture on document so Elementor/builder overlays cannot swallow the ×.
    document.addEventListener('pointerdown', function (e) {
      const btn = e.target.closest('.flow-ew-reviewer-combobox__clear');
      if (!btn || !root.contains(btn)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      clearAssignedReviewer();
    }, true);
    let emailEntryMode = false;
    function isValidEmail(value) {
      return (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_11__.isValidEmail)(value);
    }
    function invalidEmailMessage() {
      return i18n && i18n.invalidEmail || 'Please enter a valid email address.';
    }
    function showEmailError(message) {
      const slot = root.querySelector('#flow-ew-classic-reviewer-slot') || root.querySelector('.flow-ew-reviewer-combobox') || root;
      let el = root.querySelector('.flow-ew-reviewer-email-error');
      if (!el) {
        el = document.createElement('p');
        el.className = 'flow-ew-reviewer-email-error';
        el.setAttribute('role', 'alert');
        const combobox = root.querySelector('#flow-ew-reviewer-combobox');
        if (combobox && combobox.parentNode) {
          combobox.parentNode.insertBefore(el, combobox.nextSibling);
        } else {
          slot.appendChild(el);
        }
      }
      el.textContent = message || invalidEmailMessage();
      el.hidden = false;
    }
    function clearEmailError() {
      const el = root.querySelector('.flow-ew-reviewer-email-error');
      if (el) {
        el.hidden = true;
        el.textContent = '';
      }
    }
    function assignInviteEmail(email) {
      const trimmed = (email || '').trim().toLowerCase();
      if (!isValidEmail(trimmed)) {
        showEmailError();
        return;
      }
      const existingInvite = String(review && (review.invite_email || review.reviewer && review.reviewer.email || '') || '').trim().toLowerCase();
      if (existingInvite && existingInvite === trimmed) {
        emailEntryMode = false;
        syncClearBtn();
        return;
      }
      clearEmailError();
      setLoading(true);
      apiPost('/reviews', {
        post_id: postId,
        invite_email: trimmed
      }).then(data => {
        review = data;
        emailEntryMode = false;
        fullRender();
        syncClearBtn();
        const input = root.querySelector('#flow-ew-reviewer-input');
        if (input) {
          input.value = data && data.reviewer && (data.reviewer.name || data.reviewer.email) || trimmed;
        }
        if (reviewerSelect) {
          reviewerSelect.value = 'email';
          reviewerSelect.dataset.inviteEmail = trimmed;
        }
      }).catch(err => {
        showEmailError(err && err.message || invalidEmailMessage());
      }).finally(() => setLoading(false));
    }
    document.addEventListener('flow-ew:assign-invite-email', function (e) {
      const email = e && e.detail ? e.detail.email : '';
      if (email) {
        assignInviteEmail(email);
      }
    });

    // Reviewer select
    const reviewerSelect = root.querySelector('#flow-ew-reviewer-select');
    if (reviewerSelect) {
      reviewerSelect.addEventListener('change', function () {
        const raw = this.value;
        if (!raw) {
          return;
        }
        const input = root.querySelector('#flow-ew-reviewer-input');
        // Locked after assign — only the clear (×) button may change roster.
        if (input && input.readOnly) {
          return;
        }
        if (raw === 'email') {
          emailEntryMode = true;
          if (input) {
            input.value = '';
            input.placeholder = i18n && i18n.emailPlaceholder || 'name@example.com';
            input.focus();
          }
          return;
        }
        emailEntryMode = false;
        const newId = Number(raw);
        if (!newId) {
          return;
        }
        // Re-selecting the already-assigned reviewer must not re-POST
        // (Review::request would kick status back to pending).
        if (review && Number(review.reviewer_id || 0) === newId) {
          syncClearBtn();
          return;
        }
        setLoading(true);
        apiPost('/reviews', {
          post_id: postId,
          reviewer_id: newId
        }).then(data => {
          review = data;
          fullRender();
          syncClearBtn();
        }).catch(() => {}).finally(() => setLoading(false));
      });
    }
    const comboboxRoot = root.querySelector('#flow-ew-reviewer-combobox');
    if (comboboxRoot && !document.getElementById('flow-ew-avada-drawer') && !document.getElementById('flow-ew-beaver-drawer') && !document.getElementById('flow-ew-divi-drawer') && !document.getElementById('flow-ew-oxygen-drawer') && !document.getElementById('flow-ew-breakdance-drawer') && !document.getElementById('flow-ew-bricks-drawer')) {
      initReviewerCombobox(comboboxRoot);
    }
    function initReviewerCombobox(root) {
      const input = root.querySelector('.flow-ew-reviewer-combobox__input');
      const list = root.querySelector('.flow-ew-reviewer-combobox__list');
      const sel = root.querySelector('#flow-ew-reviewer-select');
      if (!input || !list || !sel) {
        return;
      }
      const options = Array.from(list.querySelectorAll('[role="option"]'));
      let activeIndex = -1;
      function isEmailOption(li) {
        return li && (li.dataset.isEmail === '1' || li.dataset.value === 'email');
      }
      function onlyEmailAvailable() {
        // No WP users left to pick — type an email directly (even if the
        // External Email option is missing from the native <select>).
        return !options.some(function (li) {
          return !isEmailOption(li);
        });
      }

      // No WP reviewers in the list — go straight to typing an email.
      if (onlyEmailAvailable()) {
        emailEntryMode = true;
        sel.value = 'email';
        input.placeholder = i18n && i18n.emailPlaceholder || 'name@example.com';
      }
      function setOpen(openList) {
        // Never leave an empty bordered listbox under the field (e.g. after
        // an email assign filters out every option).
        // Allow the list when the typed value is a valid email so "Invite"
        // can appear — even after External Email was selected.
        const typed = (input.value || '').trim();
        if (openList && isValidEmail(typed)) {
          filterOptions(typed);
          if (visibleOptions().length === 0) {
            openList = false;
          }
        } else if (openList && (emailEntryMode || sel.value === 'email' || visibleOptions().length === 0)) {
          openList = false;
        }
        list.hidden = !openList;
        input.setAttribute('aria-expanded', openList ? 'true' : 'false');
        const field = root.closest('.flow-ew-classic__field');
        if (field) {
          field.classList.toggle('is-list-open', openList);
        }
        const postbox = root.closest('#flow-ew-review.postbox');
        if (postbox) {
          postbox.classList.toggle('is-combobox-open', openList);
        }
      }
      function filterOptions(q) {
        (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_11__.filterReviewerComboboxOptions)(options, q, {
          emailOnly: onlyEmailAvailable()
        });
      }
      function visibleOptions() {
        return options.filter(function (li) {
          return !li.hidden && li.style.display !== 'none';
        });
      }
      function chooseOption(li) {
        if (!li || li.hidden) {
          return;
        }
        const id = li.dataset.value;
        const label = li.dataset.label || li.textContent.trim();
        const isEmail = (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_11__.isEmailComboboxOption)(li);
        sel.value = id;
        if (isEmail) {
          const typed = (input.value || '').trim();
          if (isValidEmail(typed)) {
            emailEntryMode = true;
            setOpen(false);
            activeIndex = -1;
            assignInviteEmail(typed);
            return;
          }
          input.value = '';
          input.placeholder = i18n && i18n.emailPlaceholder || 'name@example.com';
          setOpen(false);
          activeIndex = -1;
          emailEntryMode = true;
          sel.dispatchEvent(new Event('change', {
            bubbles: true
          }));
          input.focus();
          return;
        }
        emailEntryMode = false;
        input.value = label;
        setOpen(false);
        activeIndex = -1;
        sel.dispatchEvent(new Event('change', {
          bubbles: true
        }));
      }
      input.addEventListener('focus', function () {
        if (input.disabled || input.readOnly) return;
        if (emailEntryMode || sel.value === 'email' || onlyEmailAvailable()) {
          setOpen(false);
          return;
        }
        filterOptions(input.value);
        setOpen(true);
      });
      input.addEventListener('input', function () {
        if (input.disabled || input.readOnly) return;
        const typed = (input.value || '').trim();
        // Valid address → show Invite row (even after External Email).
        if (isValidEmail(typed)) {
          emailEntryMode = true;
          sel.value = 'email';
          filterOptions(typed);
          setOpen(true);
          activeIndex = -1;
          clearEmailError();
          return;
        }
        // After choosing External Email (or email-only), keep list closed
        // while the address is still incomplete.
        if (emailEntryMode || sel.value === 'email' || onlyEmailAvailable()) {
          if (!typed && !onlyEmailAvailable()) {
            emailEntryMode = false;
            (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_11__.exitReviewerEmailEntryMode)(sel, input, options);
            filterOptions('');
            setOpen(true);
            activeIndex = -1;
            clearEmailError();
            return;
          }
          emailEntryMode = true;
          sel.value = 'email';
          setOpen(false);
          activeIndex = -1;
          if (!typed) {
            clearEmailError();
          }
          return;
        }
        filterOptions(input.value);
        setOpen(true);
        activeIndex = -1;
      });
      input.addEventListener('blur', function () {
        // Assigned field is read-only — never re-invite on click-away
        // (that was resetting status to pending → Send for review again).
        if (input.disabled || input.readOnly) {
          return;
        }
        if (!emailEntryMode && sel.value !== 'email') {
          return;
        }
        window.setTimeout(function () {
          if (document.activeElement === input) {
            return;
          }
          if (input.readOnly || input.disabled) {
            return;
          }
          const typed = (input.value || '').trim().toLowerCase();
          if (!typed) {
            emailEntryMode = false;
            (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_11__.exitReviewerEmailEntryMode)(sel, input, options);
            clearEmailError();
            return;
          }
          if (!isValidEmail(typed)) {
            // Invalid addresses only surface an error on Enter.
            return;
          }
          const existingInvite = String(review && (review.invite_email || review.reviewer && review.reviewer.email || '') || '').trim().toLowerCase();
          if (existingInvite && existingInvite === typed) {
            return;
          }
          assignInviteEmail(typed);
        }, 150);
      });
      list.addEventListener('mousedown', function (e) {
        const li = e.target.closest('[role="option"]');
        if (li && !li.hidden) {
          e.preventDefault();
          chooseOption(li);
        }
      });
      document.addEventListener('click', function (e) {
        if (!root.contains(e.target)) {
          setOpen(false);
          activeIndex = -1;
        }
      });
      document.addEventListener('flow-ew:reviewer-field-reset', function () {
        emailEntryMode = false;
        (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_11__.exitReviewerEmailEntryMode)(sel, input, options);
        filterOptions('');
        setOpen(false);
        activeIndex = -1;
      });
      function submitTypedEmail(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        const typed = (input.value || '').trim();
        if (isValidEmail(typed)) {
          emailEntryMode = true;
          sel.value = 'email';
          assignInviteEmail(typed);
          return;
        }
        if (typed) {
          emailEntryMode = true;
          sel.value = 'email';
          showEmailError();
        }
      }
      input.addEventListener('keydown', function (e) {
        if (input.disabled || input.readOnly) return;
        const vis = visibleOptions();
        const typed = (input.value || '').trim();
        const treatAsEmail = emailEntryMode || sel.value === 'email' || onlyEmailAvailable() || isValidEmail(typed) || typed.includes('@');
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (treatAsEmail) {
            setOpen(false);
            return;
          }
          if (!list.hidden && vis.length) {
            activeIndex = Math.min(activeIndex + 1, vis.length - 1);
            vis[activeIndex].focus();
          } else {
            filterOptions(input.value);
            const next = visibleOptions();
            if (!next.length) {
              return;
            }
            setOpen(true);
            activeIndex = 0;
            if (next[0]) next[0].focus();
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (!list.hidden && vis.length) {
            activeIndex = Math.max(activeIndex - 1, 0);
            vis[activeIndex].focus();
          }
        } else if (e.key === 'Enter') {
          if (treatAsEmail) {
            submitTypedEmail(e);
            return;
          }
          const focused = list.querySelector('[role="option"]:focus');
          if (focused && !focused.hidden) {
            e.preventDefault();
            e.stopPropagation();
            chooseOption(focused);
          }
        } else if (e.key === 'Escape') {
          setOpen(false);
          activeIndex = -1;
          input.focus();
        }
      });

      // Classic post form submits on Enter in text inputs — block that while
      // the reviewer field is in email-entry mode.
      input.addEventListener('keypress', function (e) {
        if (e.key !== 'Enter' && e.keyCode !== 13) {
          return;
        }
        const typed = (input.value || '').trim();
        if (emailEntryMode || sel.value === 'email' || onlyEmailAvailable() || isValidEmail(typed) || typed.includes('@')) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    }
    function updateSendEnabled() {
      const sendBtn = root.querySelector('[data-action="send"]');
      if (!sendBtn) {
        return;
      }
      const sel = $('#flow-ew-reviewer-select');
      const hasWp = sel && Number(sel.value) > 0;
      const hasInvite = !!(review && (review.invite_email || review.reviewer && review.reviewer.is_email || sel && sel.value === 'email' && sel.dataset.inviteEmail));
      const isOpen = !!(review && review.is_open);
      sendBtn.disabled = loading || !hasWp && !hasInvite && !isOpen;
    }
    function updatePostStatusDisplay(newStatus) {
      const hiddenStatus = $('#post_status');
      if (hiddenStatus) {
        hiddenStatus.value = newStatus;
      }
      const display = $('#post-status-display');
      if (display) {
        const map = {
          pending: i18n.statusPending,
          draft: 'Draft',
          publish: 'Published'
        };
        display.textContent = map[newStatus] || newStatus;
      }
    }
    function sendForReview() {
      if (!review || loading) {
        return;
      }
      setLoading(true);
      apiPost('/reviews/' + review.id + '/send').then(data => {
        if (data && data.id) {
          review = data;
        }
        if (!isAlreadyPublished()) {
          updatePostStatusDisplay('pending');
        }
        fullRender();
      }).catch(() => {}).finally(() => setLoading(false));
    }

    // Action buttons (delegated)
    root.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action]');
      if (!btn || loading || !review) {
        return;
      }
      const action = btn.dataset.action;
      if (action === 'send') {
        sendForReview();
        return;
      }
      const endpoint = '/reviews/' + review.id + '/' + action;
      setLoading(true);
      apiPost(endpoint).then(data => {
        if (data && data.id) {
          review = data;
        } else if (data && data.success) {
          const statusMap = {
            approve: 'approved',
            'request-changes': 'changes_requested',
            resubmit: 'in_review'
          };
          if (statusMap[action]) {
            review = {
              ...review,
              status: statusMap[action]
            };
          }
        }
        fullRender();
      }).catch(() => {}).finally(() => setLoading(false));
    });

    // Copy button (delegated)
    root.addEventListener('click', function (e) {
      const copyBtn = e.target.closest('.flow-ew-classic__share-copy');
      if (!copyBtn) {
        return;
      }
      const url = copyBtn.dataset.url;
      if (!url) {
        return;
      }
      navigator.clipboard.writeText(url).then(() => {
        copyBtn.innerHTML = (0,_shared_share_bar_icons__WEBPACK_IMPORTED_MODULE_6__.shareBarIconHtml)('copied');
        copyBtn.classList.add('flow-ew-classic__share-copy--done');
        setTimeout(() => {
          copyBtn.innerHTML = (0,_shared_share_bar_icons__WEBPACK_IMPORTED_MODULE_6__.shareBarIconHtml)('copy');
          copyBtn.classList.remove('flow-ew-classic__share-copy--done');
        }, 2000);
      });
    });

    // Reload review data after Classic Editor save (post_updated redirect)
    function reloadReview() {
      api('/reviews/' + postId, 'GET').then(data => {
        if (data && data.id) {
          review = data;
        } else {
          review = null;
        }
        fullRender();
      }).catch(() => {});
    }
    if (window.jQuery) {
      window.jQuery(document).on('heartbeat-tick.wp-refresh-nonces', function () {
        setTimeout(reloadReview, 500);
      });
    }

    // Allow external triggers (e.g. Elementor save) to reload review data.
    document.addEventListener('flow-ew:reload-review', function () {
      reloadReview();
    });

    // Normalize PHP-rendered markup (actions/share/button classes) on first boot.
    fullRender();
    syncClearBtn();
    function escHtml(str) {
      const d = document.createElement('div');
      d.textContent = str;
      return d.innerHTML;
    }
    function escAttr(str) {
      return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  })(root);
})(0);

/***/ },

/***/ "./src/classic-editor/open-review.js"
/*!*******************************************!*\
  !*** ./src/classic-editor/open-review.js ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _shared_resolve_classic_root__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../shared/resolve-classic-root */ "./src/shared/resolve-classic-root.js");
/**
 * Open Review checkbox for the Classic Editor metabox (also reused by the
 * Elementor and Bricks drawers, which render the same panel HTML and load this
 * companion bundle). Rendered above the reviewer field — toggling on
 * auto-creates a review with no reviewer assigned if one doesn't exist yet,
 * then opens it.
 */

(function bootOpenReview(attempt) {
  const {
    flowEW
  } = window;
  if (!flowEW) {
    return;
  }
  const slot = (0,_shared_resolve_classic_root__WEBPACK_IMPORTED_MODULE_0__.resolveClassicOpenSlot)();
  if (!slot) {
    if (attempt < 150) {
      requestAnimationFrame(function () {
        bootOpenReview(attempt + 1);
      });
    }
    return;
  }
  if (slot.dataset.flowEwOpenReviewReady === '1') {
    return;
  }
  slot.dataset.flowEwOpenReviewReady = '1';
  (function runOpenReview(slot) {
    if (!flowEW.currentUserCan?.assignReviewer) {
      return;
    }
    if (!flowEW.openReviewEnabled) {
      return;
    }
    const {
      restUrl,
      nonce,
      postId
    } = flowEW;
    let currentReview = flowEW.activeReview || null;
    let isOpen = !!(currentReview && currentReview.is_open);
    let loading = false;
    const wrapper = document.createElement('div');
    wrapper.className = 'flow-ew-classic-open';
    const row = document.createElement('label');
    row.className = 'flow-ew-classic-open__row';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isOpen;
    const labelText = document.createElement('span');
    labelText.textContent = flowEW.i18n && flowEW.i18n.openLabel || 'Open review';
    row.appendChild(checkbox);
    row.appendChild(labelText);
    const desc = document.createElement('p');
    desc.className = 'flow-ew-classic-open__desc';
    desc.textContent = flowEW.i18n && flowEW.i18n.openReviewDesc || '';
    wrapper.appendChild(row);
    if (desc.textContent) {
      wrapper.appendChild(desc);
    }

    // Extension slot for add-ons (e.g. Pro's "Open to public" sub-checkbox).
    const extras = document.createElement('div');
    extras.className = 'flow-ew-open-review-extras';
    wrapper.appendChild(extras);
    slot.appendChild(wrapper);
    function sync(review) {
      currentReview = review;
      isOpen = !!(review && review.is_open);
      checkbox.checked = isOpen;
    }
    function jsonRequest(url, body) {
      const opts = {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce
        }
      };
      if (body !== undefined) {
        opts.body = JSON.stringify(body);
      }
      return fetch(url, opts).then(function (r) {
        if (!r.ok) {
          throw new Error('Failed');
        }
        return r.json();
      });
    }
    checkbox.addEventListener('change', function () {
      if (loading) {
        checkbox.checked = isOpen;
        return;
      }
      const wantOpen = checkbox.checked;
      loading = true;
      const ensureReview = currentReview ? Promise.resolve(currentReview) : jsonRequest(restUrl + '/reviews', {
        post_id: postId,
        reviewer_id: 0
      });
      ensureReview.then(function (review) {
        return jsonRequest(restUrl + '/reviews/' + review.id + '/' + (wantOpen ? 'open' : 'close'));
      }).then(function (data) {
        sync(data);
        flowEW.activeReview = data;
        document.dispatchEvent(new CustomEvent('flow-ew:set-review', {
          detail: {
            review: data
          }
        }));
      }).catch(function () {
        checkbox.checked = isOpen;
      }).finally(function () {
        loading = false;
      });
    });
    document.addEventListener('flow-ew:classic-render', function (e) {
      sync(e.detail && e.detail.review || null);
    });
  })(slot);
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

/***/ "./src/classic-editor/style.css"
/*!**************************************!*\
  !*** ./src/classic-editor/style.css ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "./src/shared/share-bar.css"
/*!**********************************!*\
  !*** ./src/shared/share-bar.css ***!
  \**********************************/
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
/******/ 			"classic-editor/index": 0,
/******/ 			"classic-editor/style-index": 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["classic-editor/style-index"], () => (__webpack_require__("./src/classic-editor/index.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map