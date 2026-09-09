/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/divi/index.js"
/*!***************************!*\
  !*** ./src/divi/index.js ***!
  \***************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./style.css */ "./src/divi/style.css");
/* harmony import */ var _shared_sync_reviewer_combobox_from_review__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shared/sync-reviewer-combobox-from-review */ "./src/shared/sync-reviewer-combobox-from-review.js");
/* harmony import */ var _shared_assign_invite_email__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../shared/assign-invite-email */ "./src/shared/assign-invite-email.js");
/* harmony import */ var _shared_sync_builder_reviewer_upsell__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../shared/sync-builder-reviewer-upsell */ "./src/shared/sync-builder-reviewer-upsell.js");
/* harmony import */ var _shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/reviewer-email-entry */ "./src/shared/reviewer-email-entry.js");
/* harmony import */ var _shared_share_bar_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shared/share-bar.css */ "./src/shared/share-bar.css");
/* harmony import */ var _shared_review_notice_dom__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../shared/review-notice-dom */ "./src/shared/review-notice-dom.js");
/* harmony import */ var _shared_publish_guard_ui__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../shared/publish-guard-ui */ "./src/shared/publish-guard-ui.js");








(function bootDiviReview(attempt) {
  const drawer = document.getElementById('flow-ew-divi-drawer');
  if (!drawer) {
    if (attempt < 150) {
      requestAnimationFrame(function () {
        bootDiviReview(attempt + 1);
      });
    }
    return;
  }
  if (drawer.dataset.flowEwDiviReady === '1') {
    return;
  }
  drawer.dataset.flowEwDiviReady = '1';
  (function runDiviReview(drawer) {
    let reviewWrapper = null;
    let reviewMainButton = null;
    let reviewDropdownButton = null;
    let toolbarMounted = false;
    function debounce(fn, ms) {
      let t;
      return function () {
        clearTimeout(t);
        t = setTimeout(fn, ms);
      };
    }
    function ensureDrawerHost() {
      const host = document.querySelector('.et-vb-top-window-ui');
      if (!host) {
        return false;
      }
      if (drawer.parentElement !== host) {
        host.appendChild(drawer);
      }
      return true;
    }
    function reviewLabel() {
      const i18n = window.flowEW && window.flowEW.i18n;
      return i18n && i18n.reviewPanelTitle || 'Review';
    }
    function findPageBarActions() {
      return document.querySelector('.et-vb-page-bar-right-side-save-button') || document.querySelector('.et-vb-page-bar-tools .et-vb-page-bar-right-side-save-button') || document.querySelector('.et-vb-page-bar')?.querySelector('.et-vb-page-bar-dropdown-button--fill')?.closest('.et-vb-page-bar-tools') || null;
    }
    function findPreviewWrapper() {
      const bar = findPageBarActions();
      if (!bar) {
        return null;
      }
      const wrappers = Array.from(bar.querySelectorAll('.et-vb-page-bar-dropdown-button-wrapper'));
      const byLabel = wrappers.find(function (wrapper) {
        const btn = wrapper.querySelector('.et-vb-page-bar-action-button');
        if (!btn) {
          return false;
        }
        const label = (btn.textContent || '').trim();
        return /preview/i.test(label);
      });
      if (byLabel) {
        return byLabel;
      }
      const saveIdx = wrappers.findIndex(function (wrapper) {
        return !!wrapper.querySelector('.et-vb-page-bar-dropdown-button--fill');
      });
      if (saveIdx > 0) {
        return wrappers[saveIdx - 1];
      }
      return wrappers.length >= 2 ? wrappers[1] : null;
    }
    function findExitWrapper() {
      const bar = findPageBarActions();
      if (!bar) {
        return null;
      }
      const byClass = bar.querySelector('.et-vb-page-bar-exit-button');
      if (byClass) {
        return byClass;
      }
      return Array.from(bar.querySelectorAll('.et-vb-page-bar-dropdown-button-wrapper')).find(function (wrapper) {
        const btn = wrapper.querySelector('.et-vb-page-bar-action-button');
        return btn && /^\s*exit\s*$/i.test((btn.textContent || '').trim());
      }) || null;
    }
    function bindReviewButtons(wrapper) {
      if (!wrapper) {
        return;
      }
      reviewMainButton = wrapper.querySelector('.et-vb-page-bar-action-button');
      reviewDropdownButton = wrapper.querySelector('.et-vb-page-bar-dropdown-button--dropdown-menu');
      [reviewMainButton, reviewDropdownButton].forEach(function (btn) {
        if (!btn) {
          return;
        }
        if (btn.dataset.flowEwReviewBound === '1') {
          return;
        }
        btn.dataset.flowEwReviewBound = '1';
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          toggleDrawer();
        }, true);
      });
      wrapper.dataset.flowEwReviewBound = '1';
    }
    function ensureReviewMainButtonContent(btn) {
      if (!btn) {
        return null;
      }
      let dot = btn.querySelector('.flow-ew-divi-review-dot');
      let label = btn.querySelector('.flow-ew-divi-review-label');
      if (!dot || !label) {
        btn.textContent = '';
        dot = document.createElement('span');
        dot.className = 'flow-ew-divi-review-dot';
        dot.hidden = true;
        dot.setAttribute('aria-hidden', 'true');
        label = document.createElement('span');
        label.className = 'flow-ew-divi-review-label';
        btn.appendChild(dot);
        btn.appendChild(label);
      }
      label.textContent = reviewLabel();
      btn.setAttribute('aria-label', reviewLabel());
      return {
        dot,
        label
      };
    }
    function syncReviewToolbarStatus(review) {
      if (!reviewWrapper) {
        return;
      }
      const status = review ? review.display_status || review.status || '' : '';
      if (status) {
        reviewWrapper.setAttribute('data-status', status);
      } else {
        reviewWrapper.removeAttribute('data-status');
      }
      const dot = reviewWrapper.querySelector('.flow-ew-divi-review-dot');
      if (dot) {
        dot.hidden = !status;
      }
    }
    function createReviewWrapper(previewWrapper) {
      const wrapper = document.createElement('div');
      wrapper.className = 'et-vb-page-bar-dropdown-button-wrapper flow-ew-divi-review-wrapper';
      const inner = document.createElement('div');
      inner.className = 'et-vb-page-bar-dropdown-button';
      const mainBtn = document.createElement('button');
      mainBtn.className = 'et-vb-page-bar-action-button';
      mainBtn.type = 'button';
      ensureReviewMainButtonContent(mainBtn);
      const dropdownBtn = document.createElement('div');
      dropdownBtn.className = 'et-vb-page-bar-dropdown-button--dropdown-menu';
      dropdownBtn.setAttribute('role', 'button');
      dropdownBtn.tabIndex = 0;
      dropdownBtn.setAttribute('aria-label', reviewLabel());
      const previewCaret = previewWrapper ? previewWrapper.querySelector('.et-vb-page-bar-dropdown-button--dropdown-menu .et-vb-icon') : null;
      if (previewCaret) {
        dropdownBtn.appendChild(previewCaret.cloneNode(true));
      }
      inner.appendChild(mainBtn);
      inner.appendChild(dropdownBtn);
      wrapper.appendChild(inner);
      return wrapper;
    }
    function ensureReviewToolbarButton() {
      const exitWrapper = findExitWrapper();
      const previewWrapper = findPreviewWrapper();
      if (!exitWrapper || !previewWrapper) {
        return false;
      }
      if (!reviewWrapper || !document.body.contains(reviewWrapper)) {
        reviewWrapper = createReviewWrapper(previewWrapper);
      }
      const mainBtn = reviewWrapper.querySelector('.et-vb-page-bar-action-button');
      ensureReviewMainButtonContent(mainBtn);
      syncReviewToolbarStatus(window.flowEW && window.flowEW.activeReview || null);
      const exitParent = exitWrapper.parentElement;
      if (exitParent && (reviewWrapper.parentElement !== exitParent || reviewWrapper.nextElementSibling !== exitWrapper)) {
        exitParent.insertBefore(reviewWrapper, exitWrapper);
      }
      bindReviewButtons(reviewWrapper);
      toolbarMounted = true;
      return true;
    }
    function syncDiviColorMode() {
      const classic = drawer.querySelector('.flow-ew-classic--divi');
      if (classic) {
        // Match Divi submenus: dark panel in both light and dark app modes.
        classic.classList.add('flow-ew-classic--builder-dark');
      }
    }
    syncDiviColorMode();
    if (!document.documentElement.dataset.flowEwDiviColorObserver) {
      document.documentElement.dataset.flowEwDiviColorObserver = '1';
      const colorObserver = new MutationObserver(syncDiviColorMode);
      colorObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-app-color-mode']
      });
    }
    function syncToolbarAndDrawer() {
      ensureDrawerHost();
      return ensureReviewToolbarButton();
    }
    const debouncedEnsure = debounce(syncToolbarAndDrawer, 80);
    const bodyObserver = new MutationObserver(function () {
      if (!toolbarMounted) {
        syncToolbarAndDrawer();
      } else {
        debouncedEnsure();
      }
    });
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    let mountAttempts = 0;
    function tryMountLoop() {
      syncToolbarAndDrawer();
      mountAttempts++;
      if (!toolbarMounted && mountAttempts < 240) {
        requestAnimationFrame(tryMountLoop);
      }
    }
    tryMountLoop();
    function positionDrawer() {
      const anchor = reviewWrapper;
      if (!anchor) {
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const pageBar = document.querySelector('.et-vb-page-bar');
      const topPos = pageBar ? Math.round(pageBar.getBoundingClientRect().bottom) : Math.round(rect.bottom);
      drawer.style.top = topPos + 'px';
      drawer.style.right = Math.round(window.innerWidth - rect.right) + 'px';
      drawer.style.left = 'auto';
    }
    function refreshReviewNotices() {
      const ew = window.flowEW;
      if (!ew) {
        return;
      }
      (0,_shared_review_notice_dom__WEBPACK_IMPORTED_MODULE_6__.ensureReviewNotices)({
        reviewMandatory: ew.reviewMandatory,
        isPublished: ew.isPublished,
        review: ew.activeReview,
        reviewerMeta: ew.reviewerMeta,
        currentUserCan: ew.currentUserCan
      });
    }
    function setReviewActive(isActive) {
      [reviewMainButton, reviewDropdownButton].forEach(function (btn) {
        if (btn) {
          btn.classList.toggle('et-vb-page-bar-button--active', isActive);
        }
      });
    }
    function openDrawer() {
      ensureDrawerHost();
      drawer.hidden = false;
      positionDrawer();
      drawer.classList.add('is-open');
      setReviewActive(true);
      refreshReviewNotices();
    }
    function closeDrawer() {
      drawer.classList.remove('is-open');
      setReviewActive(false);
      drawer.hidden = true;
    }
    function toggleDrawer() {
      if (drawer.classList.contains('is-open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });
    document.addEventListener('mousedown', function (e) {
      if (!drawer.classList.contains('is-open')) {
        return;
      }
      if (drawer.contains(e.target) || reviewWrapper && reviewWrapper.contains(e.target)) {
        return;
      }
      closeDrawer();
    });
    window.addEventListener('resize', function () {
      if (drawer.classList.contains('is-open')) {
        positionDrawer();
      }
    });
    const ew = window.flowEW || {};
    const reviewMandatory = !!ew.reviewMandatory;
    const isPublished = !!ew.isPublished;
    const reviewerMeta = Number(ew.reviewerMeta || 0);
    let lastReview = ew.activeReview || null;
    let blockedState = false;
    let publishGuardTimer;
    function currentReviewerId(review) {
      const fromReview = Number(review && review.reviewer_id || review && review.reviewer && review.reviewer.id || 0);
      return fromReview > 0 ? fromReview : reviewerMeta;
    }
    function hasAssignedReviewer(review) {
      if (currentReviewerId(review) > 0) {
        return true;
      }
      const sid = Number(review && review.reviewer && review.reviewer.id || 0);
      if (sid !== 0) {
        return true;
      }
      if (review && review.invite_email || review && review.reviewer && review.reviewer.is_email) {
        return true;
      }
      if (review && Array.isArray(review.email_invites) && review.email_invites.length > 0) {
        return true;
      }
      return false;
    }
    function isPublishBlocked(review) {
      if (!reviewMandatory) {
        return false;
      }
      if (isPublished) {
        return false;
      }
      if (!review || review.status !== 'approved') {
        return true;
      }
      return !hasAssignedReviewer(review);
    }
    function findSaveAndPublishMenuItem() {
      return Array.from(document.querySelectorAll('.et-vb-right-click-option')).find(function (item) {
        return /save\s*&\s*publish/i.test((item.textContent || '').trim());
      });
    }
    function applyPublishGuard(review) {
      blockedState = isPublishBlocked(review);
      document.body.classList.toggle('flow-ew-divi-publish-blocked', blockedState);
      const menuItem = findSaveAndPublishMenuItem();
      if (!menuItem) {
        return;
      }
      const wrap = menuItem.closest('.et-vb-right-click-option-wrap') || menuItem;
      wrap.classList.toggle('et-vb-right-click-option-wrap--disabled', blockedState);
      wrap.classList.toggle('flow-ew-divi-publish-blocked-item', blockedState);
      if (blockedState) {
        menuItem.style.opacity = '0.4';
        menuItem.style.pointerEvents = 'none';
        menuItem.style.cursor = 'not-allowed';
      } else {
        menuItem.style.opacity = '';
        menuItem.style.pointerEvents = '';
        menuItem.style.cursor = '';
      }
      (0,_shared_publish_guard_ui__WEBPACK_IMPORTED_MODULE_7__.syncPublishGuardTooltip)(menuItem, blockedState);
    }
    function schedulePublishGuard(review) {
      if (review !== undefined) {
        lastReview = review;
      }
      clearTimeout(publishGuardTimer);
      publishGuardTimer = setTimeout(function () {
        applyPublishGuard(lastReview);
      }, 80);
    }
    document.addEventListener('click', function (e) {
      if (!blockedState) {
        return;
      }
      const target = e.target;
      if (!target || !target.closest) {
        return;
      }
      if (target.closest('.flow-ew-divi-drawer') || target.closest('.flow-ew-divi-review-wrapper')) {
        return;
      }
      const menuItem = target.closest('.et-vb-right-click-option');
      if (menuItem && /save\s*&\s*publish/i.test((menuItem.textContent || '').trim())) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
    const guardObserver = new MutationObserver(function () {
      schedulePublishGuard();
    });
    guardObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    schedulePublishGuard(lastReview);
    document.addEventListener('flow-ew:classic-render', function (e) {
      const review = e.detail && e.detail.review;
      syncReviewToolbarStatus(review);
      (0,_shared_sync_reviewer_combobox_from_review__WEBPACK_IMPORTED_MODULE_1__.syncReviewerComboboxFromReview)(review);
      const list = document.getElementById('flow-ew-reviewer-listbox');
      const input = document.getElementById('flow-ew-reviewer-input');
      if (list) {
        list.hidden = true;
      }
      if (input) {
        input.setAttribute('aria-expanded', 'false');
      }
      schedulePublishGuard(review);
      syncFreeUpsells(review);
    });
    function buildUpsellNode(data, className, linkMarginTop) {
      const wrap = document.createElement('div');
      wrap.className = className;
      wrap.setAttribute('data-flow-ew-divi-upsell', '1');
      const link = document.createElement('a');
      link.href = data.href || '#';
      link.style.marginTop = linkMarginTop;
      const badge = document.createElement('span');
      badge.className = 'flow-ew-upsell-badge';
      badge.textContent = 'PRO';
      link.appendChild(badge);
      link.appendChild(document.createTextNode(data.label));
      wrap.appendChild(link);
      if (data.helpText) {
        const help = document.createElement('p');
        help.className = 'flow-ew-upsell-help';
        help.textContent = data.helpText;
        wrap.appendChild(help);
      }
      return wrap;
    }
    function getFallbackUpsellData(type) {
      if (drawer.dataset.flowEwUpsellEnabled !== '1') {
        return null;
      }
      const href = drawer.dataset.flowEwUpsellHref || '';
      if (!href) {
        return null;
      }
      if (type === 'open') {
        const label = drawer.dataset.flowEwUpsellOpenLabel || '';
        if (!label) {
          return null;
        }
        return {
          href,
          label,
          helpText: drawer.dataset.flowEwUpsellOpenHelp || ''
        };
      }
      const label = drawer.dataset.flowEwUpsellReviewerLabel || '';
      if (!label) {
        return null;
      }
      return {
        href,
        label,
        helpText: drawer.dataset.flowEwUpsellReviewerHelp || ''
      };
    }
    function syncFreeUpsells(review) {
      const openData = window.flowEwUpsell || getFallbackUpsellData('open');
      if (openData && openData.label) {
        drawer.querySelectorAll('.flow-ew-open-review-extras').forEach(function (slot) {
          let node = slot.querySelector('.flow-ew-upsell-open-review');
          if (!node) {
            node = buildUpsellNode(openData, 'flow-ew-upsell-open-review', '6px');
            slot.appendChild(node);
          }
          const open = !!(review && review.is_open);
          node.style.display = open ? '' : 'none';
        });
      }
      const reviewerData = window.flowEwUpsellReviewer || getFallbackUpsellData('reviewer');
      if (reviewerData && reviewerData.label) {
        (0,_shared_sync_builder_reviewer_upsell__WEBPACK_IMPORTED_MODULE_3__.syncBuilderReviewerUpsell)({
          root: drawer,
          review,
          data: reviewerData,
          className: 'flow-ew-upsell-reviewer',
          markerAttr: 'data-flow-ew-divi-upsell-reviewer',
          buildNode: function (data, className) {
            const node = buildUpsellNode(data, className, '14px');
            node.setAttribute('data-flow-ew-divi-upsell-reviewer', '1');
            return node;
          }
        });
        const reviewerSelect = drawer.querySelector('#flow-ew-reviewer-select');
        if (reviewerSelect && !reviewerSelect.dataset.flowDiviUpsellBound) {
          reviewerSelect.dataset.flowDiviUpsellBound = '1';
          reviewerSelect.addEventListener('change', function () {
            syncFreeUpsells(window.flowEW && window.flowEW.activeReview || review);
          });
        }
      }
    }
    syncFreeUpsells(lastReview);
    const comboboxRoot = drawer.querySelector('#flow-ew-reviewer-combobox');
    if (comboboxRoot) {
      initReviewerCombobox(comboboxRoot);
    }
    function initReviewerCombobox(root) {
      const input = root.querySelector('.flow-ew-reviewer-combobox__input');
      const list = root.querySelector('.flow-ew-reviewer-combobox__list');
      const select = root.querySelector('#flow-ew-reviewer-select');
      if (!input || !list || !select) {
        return;
      }
      const options = Array.from(list.querySelectorAll('[role="option"]'));
      let activeIndex = -1;
      let emailEntryMode = false;
      function hideAutocomplete() {
        return (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_4__.shouldHideReviewerAutocomplete)(select, input, emailEntryMode);
      }
      function setOpen(openList) {
        if (openList && (hideAutocomplete() || visibleOptions().length === 0)) {
          openList = false;
        }
        list.hidden = !openList;
        input.setAttribute('aria-expanded', openList ? 'true' : 'false');
      }
      function filterOptions(q) {
        (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_4__.filterReviewerComboboxOptions)(options, q);
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
        select.value = id;
        setOpen(false);
        activeIndex = -1;
        if ((0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_4__.isEmailComboboxOption)(li)) {
          const typed = (input.value || '').trim();
          if ((0,_shared_assign_invite_email__WEBPACK_IMPORTED_MODULE_2__.isValidEmail)(typed)) {
            emailEntryMode = true;
            select.value = 'email';
            setOpen(false);
            activeIndex = -1;
            (0,_shared_assign_invite_email__WEBPACK_IMPORTED_MODULE_2__.dispatchAssignInviteEmail)(typed);
            return;
          }
          emailEntryMode = true;
          input.readOnly = false;
          input.value = '';
          input.placeholder = (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_4__.getEmailPlaceholder)();
          select.dispatchEvent(new Event('change', {
            bubbles: true
          }));
          input.focus();
          return;
        }
        emailEntryMode = false;
        input.value = label;
        select.dispatchEvent(new Event('change', {
          bubbles: true
        }));
      }
      input.addEventListener('focus', function () {
        if (input.disabled || input.readOnly) {
          return;
        }
        if (hideAutocomplete()) {
          setOpen(false);
          return;
        }
        filterOptions(input.value);
        setOpen(true);
      });
      input.addEventListener('input', function () {
        if (input.disabled || input.readOnly) {
          return;
        }
        const typed = (input.value || '').trim();
        // Valid address → show Invite row (even after External Email).
        if ((0,_shared_assign_invite_email__WEBPACK_IMPORTED_MODULE_2__.isValidEmail)(typed)) {
          emailEntryMode = true;
          select.value = 'email';
          filterOptions(typed);
          setOpen(true);
          activeIndex = -1;
          return;
        }
        if (emailEntryMode || select.value === 'email') {
          if (!typed) {
            emailEntryMode = false;
            (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_4__.exitReviewerEmailEntryMode)(select, input, options);
            filterOptions('');
            setOpen(true);
            activeIndex = -1;
            return;
          }
          emailEntryMode = true;
          select.value = 'email';
          setOpen(false);
          activeIndex = -1;
          return;
        }
        filterOptions(input.value);
        setOpen(true);
        activeIndex = -1;
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
        (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_4__.exitReviewerEmailEntryMode)(select, input, options);
        filterOptions('');
        setOpen(false);
        activeIndex = -1;
      });
      input.addEventListener('keydown', function (e) {
        if (input.disabled || input.readOnly) {
          return;
        }
        const vis = visibleOptions();
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (hideAutocomplete()) {
            setOpen(false);
            return;
          }
          if (!list.hidden && vis.length) {
            activeIndex = Math.min(activeIndex + 1, vis.length - 1);
            vis[activeIndex].focus();
          } else {
            filterOptions(input.value);
            setOpen(true);
            activeIndex = 0;
            if (vis[0]) {
              vis[0].focus();
            }
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (hideAutocomplete()) {
            setOpen(false);
            return;
          }
          if (!list.hidden && vis.length) {
            activeIndex = Math.max(activeIndex - 1, 0);
            vis[activeIndex].focus();
          }
        } else if (e.key === 'Enter') {
          const focused = list.querySelector('[role="option"]:focus');
          if (focused && !focused.hidden) {
            e.preventDefault();
            chooseOption(focused);
            return;
          }
          const typed = (input.value || '').trim();
          if ((0,_shared_assign_invite_email__WEBPACK_IMPORTED_MODULE_2__.isValidEmail)(typed)) {
            e.preventDefault();
            e.stopPropagation();
            emailEntryMode = true;
            select.value = 'email';
            setOpen(false);
            activeIndex = -1;
            (0,_shared_assign_invite_email__WEBPACK_IMPORTED_MODULE_2__.dispatchAssignInviteEmail)(typed);
          }
        } else if (e.key === 'Escape') {
          setOpen(false);
          activeIndex = -1;
          input.focus();
        }
      });
    }
    refreshReviewNotices();
  })(drawer);
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

/***/ "./src/shared/sync-builder-reviewer-upsell.js"
/*!****************************************************!*\
  !*** ./src/shared/sync-builder-reviewer-upsell.js ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   syncBuilderReviewerUpsell: () => (/* binding */ syncBuilderReviewerUpsell)
/* harmony export */ });
/**
 * Free "Unlock multiple reviewers" upsell for builder drawers.
 * Always dedupes to a single node so classic-render / MutationObserver races
 * cannot stack copies.
 *
 * @param {object} opts
 * @param {ParentNode} opts.root Drawer/panel root.
 * @param {object|null|undefined} opts.review
 * @param {object|null|undefined} opts.data { href, label, helpText }
 * @param {string} opts.className
 * @param {string} [opts.markerAttr] Optional data-* attribute name to set.
 * @param {(data: object, className: string) => HTMLElement} opts.buildNode
 */
function syncBuilderReviewerUpsell(opts) {
  const root = opts && opts.root;
  const data = opts && opts.data;
  const buildNode = opts && opts.buildNode;
  const className = opts && opts.className || 'flow-ew-upsell-reviewer';
  const markerAttr = opts && opts.markerAttr;
  if (!root || !data || !data.label || typeof buildNode !== 'function') {
    return;
  }
  const select = root.querySelector('#flow-ew-reviewer-select') || document.getElementById('flow-ew-reviewer-select');
  if (!select) {
    return;
  }
  const review = opts.review;
  const val = String(select.value || '');
  const invite = (select.getAttribute('data-invite-email') || select.dataset.inviteEmail || '').trim();
  const hasReviewer = !!(val === 'email' || Number(val) > 0 || invite.length > 0 || review && Number(review.reviewer_id || 0) > 0 || review && review.reviewer && Number(review.reviewer.id || 0) !== 0 || review && (review.invite_email || review.reviewer && review.reviewer.is_email) || review && Array.isArray(review.email_invites) && review.email_invites.length > 0);
  const existing = Array.from(root.querySelectorAll(['.' + className, '[data-flow-ew-upsell-reviewer]', markerAttr ? '[' + markerAttr + ']' : null].filter(Boolean).join(', ')));
  let node = existing[0] || null;
  existing.slice(1).forEach(function (extra) {
    extra.remove();
  });
  if (!hasReviewer) {
    if (node) {
      node.remove();
    }
    return;
  }
  if (!node) {
    node = buildNode(data, className);
    if (markerAttr) {
      node.setAttribute(markerAttr, '1');
    }
    node.classList.add(className);
    // Mark for the shared classic upsell script so it does not inject again.
    node.setAttribute('data-flow-ew-upsell-reviewer', '1');
    const actions = root.querySelector('#flow-ew-classic-actions') || root.querySelector('.flow-ew-classic__actions');
    const anchor = root.querySelector('#flow-ew-reviewer-combobox') || select.parentElement;
    if (actions && actions.parentElement) {
      actions.parentElement.insertBefore(node, actions);
    } else if (anchor && anchor.parentElement) {
      anchor.parentElement.insertBefore(node, anchor.nextSibling);
    } else {
      root.appendChild(node);
    }
  }
  node.style.display = '';
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

/***/ "./src/divi/style.css"
/*!****************************!*\
  !*** ./src/divi/style.css ***!
  \****************************/
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
/******/ 			"divi/index": 0,
/******/ 			"divi/style-index": 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["divi/style-index"], () => (__webpack_require__("./src/divi/index.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map