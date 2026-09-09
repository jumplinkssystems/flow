/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/beaver/index.js"
/*!*****************************!*\
  !*** ./src/beaver/index.js ***!
  \*****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./style.css */ "./src/beaver/style.css");
/* harmony import */ var _shared_sync_reviewer_combobox_from_review__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shared/sync-reviewer-combobox-from-review */ "./src/shared/sync-reviewer-combobox-from-review.js");
/* harmony import */ var _shared_assign_invite_email__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../shared/assign-invite-email */ "./src/shared/assign-invite-email.js");
/* harmony import */ var _shared_sync_builder_reviewer_upsell__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../shared/sync-builder-reviewer-upsell */ "./src/shared/sync-builder-reviewer-upsell.js");
/* harmony import */ var _shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/reviewer-email-entry */ "./src/shared/reviewer-email-entry.js");
/* harmony import */ var _shared_share_bar_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shared/share-bar.css */ "./src/shared/share-bar.css");
/* harmony import */ var _shared_publish_guard_ui__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../shared/publish-guard-ui */ "./src/shared/publish-guard-ui.js");







(function bootBeaverReview(attempt) {
  const drawer = document.getElementById('flow-ew-beaver-drawer');
  const toggle = document.getElementById('flow-ew-beaver-toggle');
  if (!drawer || !toggle) {
    if (attempt < 150) {
      requestAnimationFrame(function () {
        bootBeaverReview(attempt + 1);
      });
    }
    return;
  }
  if (drawer.dataset.flowEwBeaverReady === '1') {
    return;
  }
  drawer.dataset.flowEwBeaverReady = '1';
  function getDrawer() {
    return document.getElementById('flow-ew-beaver-drawer');
  }
  function isBeaverDarkSkin() {
    return document.body.classList.contains('fl-builder-ui-skin--dark');
  }
  function syncBeaverDarkSkin() {
    const panel = getDrawer();
    if (!panel) {
      return;
    }
    const classic = panel.querySelector('.flow-ew-classic--beaver');
    if (classic) {
      classic.classList.toggle('flow-ew-classic--builder-dark', isBeaverDarkSkin());
    }
  }
  syncBeaverDarkSkin();
  if (!document.body.dataset.flowEwBeaverSkinObserver) {
    document.body.dataset.flowEwBeaverSkinObserver = '1';
    const skinObserver = new MutationObserver(syncBeaverDarkSkin);
    skinObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
  function resolveToggle() {
    return document.getElementById('flow-ew-beaver-toggle');
  }
  function resolveToolbarProxy() {
    return document.querySelector('.flow-ew-beaver-toggle-proxy');
  }
  function resolvePanelArrow() {
    const panel = getDrawer();
    return panel ? panel.querySelector('.fl-builder--panel-arrow') : null;
  }
  function isDrawerOpen() {
    const panel = getDrawer();
    return !!panel && panel.classList.contains('is-open');
  }
  function isToggleInteraction(target) {
    if (!target || !target.closest) {
      return false;
    }
    return !!target.closest('.flow-ew-beaver-toggle-proxy');
  }
  function hideBeaverContentPanel() {
    if (window.FLBuilder && typeof window.FLBuilder.triggerHook === 'function') {
      window.FLBuilder.triggerHook('hideContentPanel');
    }
  }
  function replayPanelAnimation(panel) {
    if (!panel) {
      return;
    }
    panel.style.animation = 'none';
    void panel.offsetWidth;
    panel.style.animation = '';
  }
  function alignPanelArrow() {
    const proxy = resolveToolbarProxy();
    const arrow = resolvePanelArrow();
    if (!proxy || !arrow) {
      return;
    }
    const styles = getComputedStyle(document.documentElement);
    const panelWidth = parseFloat(styles.getPropertyValue('--fl-builder-panel-width')) || 320;
    const arrowWidth = arrow.getBoundingClientRect().width || 20;
    const buttonRect = proxy.getBoundingClientRect();
    const buttonCenterX = buttonRect.x + buttonRect.width / 2;
    const panelLeft = window.innerWidth - panelWidth;
    let arrowX = 20;
    if (buttonCenterX >= panelLeft) {
      arrowX = buttonCenterX - panelLeft - arrowWidth / 2;
    }
    arrow.style.left = Math.max(12, arrowX) + 'px';
    arrow.style.right = 'auto';
  }
  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }
  function findBarActions() {
    return document.querySelector('.fl-builder-bar-actions');
  }
  function findDoneButton() {
    const actions = findBarActions();
    return actions ? actions.querySelector('.fl-builder-done-button') : null;
  }
  function findPublishActionButton() {
    return document.querySelector('.fl-builder-publish-actions [data-action="publish"]');
  }
  let closeTimer = null;
  function bindProxyToggle(proxy) {
    if (!proxy || proxy.dataset.flowEwToggleBound === '1') {
      return;
    }
    proxy.dataset.flowEwToggleBound = '1';
    proxy.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleDrawer();
    });
  }
  function syncToggleStatus(status) {
    const toggleEl = resolveToggle();
    const proxy = resolveToolbarProxy();
    const host = document.querySelector('.flow-ew-beaver-review');
    if (toggleEl) {
      toggleEl.dataset.status = status;
      toggleEl.setAttribute('data-status', status);
    }
    if (proxy) {
      proxy.dataset.status = status;
      proxy.setAttribute('data-status', status);
    }
    if (host) {
      host.setAttribute('data-status', status);
    }
  }
  function syncToolbarProxyActive(isActive) {
    const toggleEl = resolveToggle();
    const proxy = resolveToolbarProxy();
    [toggleEl, proxy].forEach(function (btn) {
      if (!btn) {
        return;
      }
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });
  }
  function isHostPlacedAfterDone(host, actions, doneBtn) {
    return host.parentElement === actions && host.previousElementSibling === doneBtn;
  }
  function ensureToolbarButton() {
    const toggleEl = resolveToggle();
    const actions = findBarActions();
    const doneBtn = findDoneButton();
    if (!toggleEl || !actions || !doneBtn) {
      return false;
    }
    let host = actions.querySelector('.flow-ew-beaver-review');
    if (!host) {
      host = document.createElement('span');
      host.className = 'flow-ew-beaver-review';
    }
    let proxy = host.querySelector('.flow-ew-beaver-toggle-proxy');
    if (!proxy) {
      proxy = document.createElement('button');
      proxy.type = 'button';
      proxy.className = toggleEl.className + ' flow-ew-beaver-toggle-proxy';
      if (toggleEl.getAttribute('aria-label')) {
        proxy.setAttribute('aria-label', toggleEl.getAttribute('aria-label'));
      }
      if (toggleEl.getAttribute('title')) {
        proxy.setAttribute('title', toggleEl.getAttribute('title'));
      }
      const icon = toggleEl.querySelector('.flow-ew-beaver-toggle__icon');
      proxy.innerHTML = icon ? icon.outerHTML : toggleEl.innerHTML;
      host.appendChild(proxy);
    }
    toggleEl.hidden = true;
    proxy.hidden = false;
    if (!isHostPlacedAfterDone(host, actions, doneBtn)) {
      const anchor = doneBtn.nextElementSibling;
      if (anchor && anchor !== host) {
        actions.insertBefore(host, anchor);
      } else {
        doneBtn.insertAdjacentElement('afterend', host);
      }
    }
    syncToggleStatus(toggleEl.dataset.status || '');
    syncToolbarProxyActive(isDrawerOpen());
    bindProxyToggle(proxy);
    alignPanelArrow();
    return true;
  }
  const debouncedEnsure = debounce(ensureToolbarButton, 80);
  const bodyObserver = new MutationObserver(debouncedEnsure);
  bodyObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  let attempts = 0;
  function tryEnsureLoop() {
    const ok = ensureToolbarButton();
    attempts++;
    if (!ok && attempts < 240) {
      requestAnimationFrame(tryEnsureLoop);
    }
  }
  tryEnsureLoop();
  function open() {
    const panel = getDrawer();
    if (!panel) {
      return;
    }
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    hideBeaverContentPanel();
    alignPanelArrow();
    panel.removeAttribute('hidden');
    document.body.classList.add('flow-ew-beaver-review-is-showing');
    replayPanelAnimation(panel);
    panel.classList.add('is-open');
    syncToolbarProxyActive(true);
  }
  function close() {
    const panel = getDrawer();
    if (!panel) {
      return;
    }
    panel.classList.remove('is-open');
    document.body.classList.remove('flow-ew-beaver-review-is-showing');
    syncToolbarProxyActive(false);
    if (closeTimer) {
      clearTimeout(closeTimer);
    }
    closeTimer = setTimeout(function () {
      closeTimer = null;
      const current = getDrawer();
      if (current && !current.classList.contains('is-open')) {
        current.setAttribute('hidden', '');
      }
    }, 150);
  }
  function toggleDrawer() {
    if (isDrawerOpen()) {
      close();
    } else {
      open();
    }
  }
  if (window.FLBuilder && typeof window.FLBuilder.addHook === 'function') {
    window.FLBuilder.addHook('willShowContentPanel', close);
  }
  window.addEventListener('resize', debounce(function () {
    if (isDrawerOpen()) {
      alignPanelArrow();
    }
  }, 80));
  const closeBtn = drawer.querySelector('.flow-ew-beaver-drawer__close');
  if (closeBtn && !closeBtn.dataset.flowEwCloseBound) {
    closeBtn.dataset.flowEwCloseBound = '1';
    closeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      close();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isDrawerOpen()) {
      close();
    }
  });
  document.addEventListener('mousedown', function (e) {
    if (!isDrawerOpen()) {
      return;
    }
    const panel = getDrawer();
    if (!panel) {
      return;
    }
    if (panel.contains(e.target) || isToggleInteraction(e.target)) {
      return;
    }
    close();
  });
  const ew = window.flowEW || {};
  const reviewMandatory = !!ew.reviewMandatory;
  const isPublished = !!ew.isPublished;
  const reviewerMeta = Number(ew.reviewerMeta || 0);
  let lastReview = ew.activeReview || null;
  let publishGuardTimer;
  let blockedState = false;
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
  function applyPublishGuard(review) {
    blockedState = isPublishBlocked(review);
    document.body.classList.toggle('flow-ew-beaver-publish-blocked', blockedState);
    (0,_shared_publish_guard_ui__WEBPACK_IMPORTED_MODULE_6__.syncPublishGuardTooltip)(findPublishActionButton(), blockedState);
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
    if (target.closest('.flow-ew-beaver-toggle-proxy') || target.closest('.flow-ew-beaver-review-panel')) {
      return;
    }
    if (target.closest('.fl-builder-publish-actions [data-action="publish"]')) {
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
  function buildUpsellNode(data, className, linkMarginTop) {
    const wrap = document.createElement('div');
    wrap.className = className;
    wrap.setAttribute('data-flow-ew-beaver-upsell', '1');
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
    const panel = getDrawer();
    if (!panel || panel.dataset.flowEwUpsellEnabled !== '1') {
      return null;
    }
    const href = panel.dataset.flowEwUpsellHref || '';
    if (!href) {
      return null;
    }
    if (type === 'open') {
      const label = panel.dataset.flowEwUpsellOpenLabel || '';
      if (!label) {
        return null;
      }
      return {
        href,
        label,
        helpText: panel.dataset.flowEwUpsellOpenHelp || ''
      };
    }
    const label = panel.dataset.flowEwUpsellReviewerLabel || '';
    if (!label) {
      return null;
    }
    return {
      href,
      label,
      helpText: panel.dataset.flowEwUpsellReviewerHelp || ''
    };
  }
  function syncFreeUpsells(review) {
    const panel = getDrawer();
    if (!panel) {
      return;
    }
    const openData = window.flowEwUpsell || getFallbackUpsellData('open');
    if (openData && openData.label) {
      panel.querySelectorAll('.flow-ew-open-review-extras').forEach(function (slot) {
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
        root: panel,
        review,
        data: reviewerData,
        className: 'flow-ew-upsell-reviewer',
        markerAttr: 'data-flow-ew-beaver-upsell-reviewer',
        buildNode: function (data, className) {
          const node = buildUpsellNode(data, className, '14px');
          node.setAttribute('data-flow-ew-beaver-upsell-reviewer', '1');
          return node;
        }
      });
      const reviewerSelect = panel.querySelector('#flow-ew-reviewer-select');
      if (reviewerSelect && !reviewerSelect.dataset.flowBeaverUpsellBound) {
        reviewerSelect.dataset.flowBeaverUpsellBound = '1';
        reviewerSelect.addEventListener('change', function () {
          syncFreeUpsells(window.flowEW && window.flowEW.activeReview || review);
        });
      }
    }
  }
  document.addEventListener('flow-ew:classic-render', function (e) {
    const review = e.detail && e.detail.review;
    const status = review && review.status || '';
    syncToggleStatus(status);
    (0,_shared_sync_reviewer_combobox_from_review__WEBPACK_IMPORTED_MODULE_1__.syncReviewerComboboxFromReview)(review);
    syncBeaverDarkSkin();
    schedulePublishGuard(review);
    syncFreeUpsells(review);
  });
  const comboboxRoot = document.getElementById('flow-ew-reviewer-combobox');
  if (comboboxRoot) {
    initReviewerCombobox(comboboxRoot);
  }
  syncFreeUpsells(lastReview);
  function initReviewerCombobox(root) {
    if (root.dataset.flowEwComboboxReady === '1') {
      return;
    }
    root.dataset.flowEwComboboxReady = '1';
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
      if (openList && hideAutocomplete()) {
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

/***/ "./src/beaver/style.css"
/*!******************************!*\
  !*** ./src/beaver/style.css ***!
  \******************************/
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
/******/ 			"beaver/index": 0,
/******/ 			"beaver/style-index": 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["beaver/style-index"], () => (__webpack_require__("./src/beaver/index.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map