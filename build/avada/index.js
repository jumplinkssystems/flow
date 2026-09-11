/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/avada/index.js"
/*!****************************!*\
  !*** ./src/avada/index.js ***!
  \****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./style.css */ "./src/avada/style.css");
/* harmony import */ var _shared_sync_reviewer_combobox_from_review__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shared/sync-reviewer-combobox-from-review */ "./src/shared/sync-reviewer-combobox-from-review.js");
/* harmony import */ var _shared_assign_invite_email__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../shared/assign-invite-email */ "./src/shared/assign-invite-email.js");
/* harmony import */ var _shared_sync_builder_reviewer_upsell__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../shared/sync-builder-reviewer-upsell */ "./src/shared/sync-builder-reviewer-upsell.js");
/* harmony import */ var _shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/reviewer-email-entry */ "./src/shared/reviewer-email-entry.js");
/* harmony import */ var _shared_share_bar_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../shared/share-bar.css */ "./src/shared/share-bar.css");
/* harmony import */ var _shared_publish_guard_ui__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../shared/publish-guard-ui */ "./src/shared/publish-guard-ui.js");







(function () {
  const drawers = Array.from(document.querySelectorAll('#flow-ew-avada-drawer'));
  const toggles = Array.from(document.querySelectorAll('#flow-ew-avada-toggle'));
  const drawer = drawers.length ? drawers[drawers.length - 1] : null;
  const toggle = toggles.length ? toggles[toggles.length - 1] : null;
  if (!drawer || !toggle) {
    return;
  }

  // Avada can render footer content more than once in some builder flows.
  // Keep one canonical Flow drawer/toggle pair so ID-based selectors from
  // Classic/Pro companion bundles bind to the visible instance.
  drawers.forEach(function (el) {
    if (el !== drawer) {
      el.remove();
    }
  });
  toggles.forEach(function (el) {
    if (el !== toggle) {
      el.remove();
    }
  });
  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }
  function findToolbarRoot() {
    return document.querySelector('.fusion-builder-live-toolbar.fusion-top-frame') || document.getElementById('fusion_builder_controls') || document.querySelector('.save-wrapper.fb') || document.querySelector('.fusion-builder-update-buttons') || document.querySelector('.fusion-builder-controls') || document.querySelector('[class*="fusion-builder"][class*="toolbar"]');
  }
  function findPreviewControlHost() {
    const root = findToolbarRoot() || document;
    const nav = root.querySelector('.fusion-toolbar-nav.fb') || root.querySelector('.fusion-toolbar-nav');
    if (!nav) {
      return null;
    }
    const byClass = nav.querySelector('li.preview') || nav.querySelector('li.fusion-builder-preview') || nav.querySelector('li[class*="preview"]');
    if (byClass) {
      return byClass;
    }
    const candidate = Array.from(nav.querySelectorAll('li, a, button')).find(el => {
      const label = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim().toLowerCase();
      return label === 'preview' || label.includes('preview');
    });
    return candidate ? candidate.closest('li') || candidate : null;
  }
  function findAdditionalToolsList() {
    const root = findToolbarRoot() || document;
    return root.querySelector('.additional-tools > ul') || root.querySelector('li.additional-tools > ul') || null;
  }
  function visibleElement(candidates) {
    return candidates.find(el => !!el && el.offsetParent !== null && !el.hidden) || null;
  }
  function findPublishControl() {
    const root = findToolbarRoot() || document;
    const direct = visibleElement(Array.from(root.querySelectorAll(['.save-wrapper.fb .post-status', '.save-wrapper.fb input[name="post-status"]', '.save-wrapper.fb label[for*="fusion-post-status"]', '#publish', '.fusion-builder-publish-tooltip', '.fusion-builder-update-buttons [class*="publish"]', '.fusion-builder-update-buttons input[type="checkbox"][name*="publish"]', '.fusion-builder-update-buttons input[type="checkbox"][id*="publish"]', '.fusion-builder-update-buttons .fusion-save-draft + *'].join(','))));
    if (direct) {
      return direct;
    }
    const byText = visibleElement(Array.from(root.querySelectorAll('.fusion-builder-update-buttons a, .fusion-builder-update-buttons button, .fusion-builder-update-buttons label, .fusion-builder-update-buttons div')).filter(el => /(draft|publish)/i.test((el.textContent || '').trim())));
    return byText;
  }
  function findPublishControlHost() {
    const control = findPublishControl();
    if (!control) {
      return null;
    }
    if (control.classList && control.classList.contains('post-status')) {
      return control;
    }
    return control.closest('.save-wrapper.fb .post-status, .save-wrapper.fb > ul > li, .fusion-builder-update-buttons > *, .fusion-builder-update-buttons a, .fusion-builder-update-buttons button, .fusion-builder-update-buttons label, .fusion-builder-publish-tooltip, .fusion-builder-status, .fusion-builder-checkbox, [class*="publish"], [class*="draft"]') || control;
  }
  function ensureToolbarButton() {
    const additionalToolsList = findAdditionalToolsList();
    const previewHost = findPreviewControlHost();
    const publishHost = findPublishControlHost();
    const root = findToolbarRoot();
    const group = additionalToolsList || previewHost && previewHost.parentElement || publishHost && publishHost.parentElement || root;
    if (!group) {
      return false;
    }
    let host = group.querySelector('.flow-ew-avada-review');
    if (!host) {
      host = document.createElement('li');
      host.className = 'flow-ew-avada-review has-submenu';
      if (additionalToolsList && previewHost && previewHost.parentElement === additionalToolsList) {
        group.insertBefore(host, previewHost.nextSibling);
      } else if (additionalToolsList) {
        group.appendChild(host);
      } else if (previewHost) {
        group.insertBefore(host, previewHost.nextSibling);
      } else if (publishHost) {
        group.insertBefore(host, publishHost);
      } else {
        group.appendChild(host);
      }
    }
    toggle.hidden = false;
    let structureChanged = false;
    if (toggle.parentElement !== host) {
      host.appendChild(toggle);
      structureChanged = true;
    }
    if (drawer.parentElement !== host) {
      host.appendChild(drawer);
      structureChanged = true;
    }
    if (structureChanged) {
      stabilizeReviewerUi();
    }
    const status = toggle.dataset.status || '';
    host.setAttribute('data-status', status);
    return true;
  }
  const debouncedStabilize = debounce(stabilizeReviewerUi, 80);
  const drawerObserver = new MutationObserver(debouncedStabilize);
  drawerObserver.observe(drawer, {
    childList: true,
    subtree: true
  });
  const debouncedEnsure = debounce(function () {
    ensureToolbarButton();
    enforceShareRowSizing();
  }, 80);
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

  // Avada registers a window-level click listener that closes all submenus when
  // the click is not on a toggle trigger. Keep Flow drawer interactions open by
  // stopping those clicks from bubbling to the global closer.
  drawer.addEventListener('click', function (e) {
    e.stopPropagation();
  });
  drawer.addEventListener('mousedown', function (e) {
    e.stopPropagation();
  });
  function syncClearBtnVisibility(review) {
    (0,_shared_sync_reviewer_combobox_from_review__WEBPACK_IMPORTED_MODULE_1__.syncReviewerComboboxFromReview)(review, drawer);
  }
  function enforceShareRowSizing() {
    const shareLink = drawer.querySelector('.flow-ew-classic__share-link');
    if (shareLink) {
      shareLink.style.fontSize = '13px';
      shareLink.style.lineHeight = '40px';
      shareLink.style.padding = '0 14px';
      shareLink.style.height = 'auto';
      shareLink.style.minHeight = '40px';
    }
    const shareRow = drawer.querySelector('.flow-ew-classic__share-row');
    if (shareRow) {
      shareRow.style.minHeight = '40px';
    }
    const shareCopy = drawer.querySelector('.flow-ew-classic__share-copy');
    if (shareCopy) {
      shareCopy.style.minWidth = '36px';
      shareCopy.style.padding = '0';
    }
    const shareGoto = drawer.querySelector('.flow-ew-classic__share-goto');
    if (shareGoto) {
      shareGoto.style.minWidth = '36px';
      shareGoto.style.padding = '0';
    }
  }
  function stabilizeReviewerUi() {
    drawer.querySelectorAll('ul').forEach(function (list) {
      if (list.classList.contains('flow-ew-reviewer-combobox__list') || list.id === 'flow-ew-reviewer-listbox' || list.id === 'flow-ew-pro-multi-reviewer-listbox') {
        return;
      }
      list.style.setProperty('position', 'static', 'important');
      list.style.setProperty('left', 'auto', 'important');
      list.style.setProperty('right', 'auto', 'important');
      list.style.setProperty('top', 'auto', 'important');
      list.style.setProperty('inset', 'auto', 'important');
      list.style.setProperty('width', '100%', 'important');
    });
    drawer.querySelectorAll('.flow-ew-pro-multi-reviewer__body, .flow-ew-pro-multi-reviewer__chips, .flow-ew-pro-reviewers-list > li').forEach(function (el) {
      el.style.setProperty('position', 'static', 'important');
      el.style.setProperty('left', 'auto', 'important');
      el.style.setProperty('right', 'auto', 'important');
      el.style.setProperty('top', 'auto', 'important');
      el.style.setProperty('inset', 'auto', 'important');
      el.style.setProperty('transform', 'none', 'important');
      el.style.setProperty('width', '100%', 'important');
      el.style.setProperty('box-sizing', 'border-box', 'important');
    });
    const slot = drawer.querySelector('#flow-ew-classic-reviewer-slot');
    if (!slot) {
      return;
    }
    slot.style.position = 'static';
    slot.style.width = '100%';
    slot.style.transform = 'none';
    const multi = slot.querySelector('.flow-ew-pro-multi-reviewer') || drawer.querySelector('.flow-ew-pro-multi-reviewer');
    if (multi) {
      if (multi.parentElement !== slot) {
        slot.appendChild(multi);
      }
      multi.style.position = 'static';
      multi.style.width = '100%';
      multi.style.transform = 'none';
    }
    const proList = drawer.querySelector('#flow-ew-pro-multi-reviewer-listbox');
    if (proList) {
      proList.style.setProperty('position', 'absolute', 'important');
      proList.style.setProperty('left', '0', 'important');
      proList.style.setProperty('right', '0', 'important');
      proList.style.setProperty('top', 'calc(100% + 4px)', 'important');
      proList.style.setProperty('inset', 'auto', 'important');
      proList.style.setProperty('z-index', '2000', 'important');
      proList.style.setProperty('width', '100%', 'important');
    }
    const proInput = drawer.querySelector('#flow-ew-pro-multi-reviewer-input');
    if (proInput && proList && !proInput.dataset.flowAvadaBound) {
      proInput.dataset.flowAvadaBound = '1';
      // Avada's toolbar CSS can hide the list, so re-show it — but only
      // when the combobox itself wants to be open. Ignoring that flag
      // re-opened the list while composing an external email.
      const show = function () {
        if (proInput.getAttribute('aria-expanded') !== 'true' || proList.childElementCount === 0) {
          return;
        }
        proList.hidden = false;
      };
      proInput.addEventListener('focus', show);
      proInput.addEventListener('input', show);
    }
    const singleInput = drawer.querySelector('#flow-ew-reviewer-input');
    const singleList = drawer.querySelector('#flow-ew-reviewer-listbox');
    if (singleList) {
      singleList.style.setProperty('position', 'absolute', 'important');
      singleList.style.setProperty('left', '0', 'important');
      singleList.style.setProperty('right', '0', 'important');
      singleList.style.setProperty('top', 'calc(100% + 4px)', 'important');
      singleList.style.setProperty('inset', 'auto', 'important');
      singleList.style.setProperty('z-index', '2000', 'important');
      singleList.style.setProperty('width', '100%', 'important');
    }
    if (singleInput && singleList && !singleInput.dataset.flowAvadaBound) {
      singleInput.dataset.flowAvadaBound = '1';
      const showSingle = function () {
        if (singleInput.getAttribute('aria-expanded') !== 'true' || singleList.childElementCount === 0) {
          return;
        }
        singleList.hidden = false;
        singleList.style.display = 'block';
      };
      const hideSingle = function () {
        singleList.hidden = true;
        singleList.style.display = 'none';
        singleInput.setAttribute('aria-expanded', 'false');
      };
      singleInput.addEventListener('focus', showSingle);
      singleInput.addEventListener('input', showSingle);
      singleList.addEventListener('flow-ew:avada-close', hideSingle);
    }
  }
  function buildUpsellNode(data, markerAttr, linkMarginTop) {
    const wrap = document.createElement('div');
    wrap.className = markerAttr;
    wrap.setAttribute(markerAttr, '1');
    wrap.style.setProperty('font-size', '13px', 'important');
    wrap.style.setProperty('line-height', '1.4', 'important');
    wrap.style.setProperty('padding', '0', 'important');
    const link = document.createElement('a');
    link.href = data.href || '#';
    link.style.setProperty('display', 'inline-block', 'important');
    link.style.setProperty('margin-top', linkMarginTop, 'important');
    link.style.setProperty('padding', '0', 'important');
    link.style.setProperty('height', 'auto', 'important');
    link.style.setProperty('background', 'transparent', 'important');
    link.style.setProperty('color', '#018170', 'important');
    link.style.setProperty('font-size', '13px', 'important');
    link.style.setProperty('font-weight', '600', 'important');
    link.style.setProperty('line-height', '1.4', 'important');
    link.style.setProperty('text-decoration', 'underline', 'important');
    link.style.setProperty('cursor', 'pointer', 'important');
    link.style.setProperty('text-transform', 'none', 'important');
    link.style.setProperty('letter-spacing', 'normal', 'important');
    const badge = document.createElement('span');
    badge.style.setProperty('display', 'inline-block', 'important');
    badge.style.setProperty('padding', '1px 6px', 'important');
    badge.style.setProperty('margin-right', '4px', 'important');
    badge.style.setProperty('font-size', '9px', 'important');
    badge.style.setProperty('font-weight', '600', 'important');
    badge.style.setProperty('letter-spacing', '0.04em', 'important');
    badge.style.setProperty('line-height', '1.4', 'important');
    badge.style.setProperty('border-radius', '8px', 'important');
    badge.style.setProperty('background', '#d0f9ec', 'important');
    badge.style.setProperty('color', '#09121e', 'important');
    badge.style.setProperty('vertical-align', '1px', 'important');
    badge.style.setProperty('text-transform', 'uppercase', 'important');
    badge.textContent = 'PRO';
    link.appendChild(badge);
    link.appendChild(document.createTextNode(data.label));
    wrap.appendChild(link);
    if (data.helpText) {
      const help = document.createElement('p');
      help.style.setProperty('margin-top', '4px', 'important');
      help.style.setProperty('margin-bottom', '0', 'important');
      help.style.setProperty('color', '#9aa4ad', 'important');
      help.style.setProperty('font-size', '12px', 'important');
      help.style.setProperty('font-weight', '400', 'important');
      help.style.setProperty('line-height', '1.4', 'important');
      help.style.setProperty('text-transform', 'none', 'important');
      help.style.setProperty('letter-spacing', 'normal', 'important');
      help.textContent = data.helpText;
      wrap.appendChild(help);
    }
    return wrap;
  }
  function getFallbackUpsellData(type) {
    if (!drawer || drawer.dataset.flowEwUpsellEnabled !== '1') {
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
        let node = slot.querySelector('[data-flow-ew-avada-upsell-open]');
        if (!node) {
          node = buildUpsellNode(openData, 'data-flow-ew-avada-upsell-open', '6px');
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
        markerAttr: 'data-flow-ew-avada-upsell-reviewer',
        buildNode: function (data) {
          return buildUpsellNode(data, 'data-flow-ew-avada-upsell-reviewer', '14px');
        }
      });
      const reviewerSelect = drawer.querySelector('#flow-ew-reviewer-select');
      if (reviewerSelect && !reviewerSelect.dataset.flowAvadaUpsellBound) {
        reviewerSelect.dataset.flowAvadaUpsellBound = '1';
        reviewerSelect.addEventListener('change', function () {
          syncFreeUpsells(window.flowEW && window.flowEW.activeReview || review);
        });
      }
    }
  }
  document.addEventListener('flow-ew:classic-render', function (e) {
    const review = e.detail && e.detail.review;
    const status = review && review.status || '';
    toggle.dataset.status = status;
    const host = toggle.parentElement;
    if (host && host.classList.contains('flow-ew-avada-review')) {
      host.setAttribute('data-status', status);
    }
    (0,_shared_sync_reviewer_combobox_from_review__WEBPACK_IMPORTED_MODULE_1__.syncReviewerComboboxFromReview)(review);
    syncClearBtnVisibility(review);
    schedulePublishGuard(review);
    enforceShareRowSizing();
    // Run after other classic-render listeners (e.g. pro multi-reviewer chips).
    requestAnimationFrame(function () {
      stabilizeReviewerUi();
    });
    syncFreeUpsells(review);
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
  function applyPublishGuard(review) {
    blockedState = isPublishBlocked(review);
    document.body.classList.toggle('flow-ew-avada-publish-blocked', blockedState);
    const publishHost = findPublishControlHost();
    if (publishHost) {
      publishHost.classList.toggle('flow-ew-avada-publish-blocked-control', blockedState);
    }
    (0,_shared_publish_guard_ui__WEBPACK_IMPORTED_MODULE_6__.syncPublishGuardTooltip)(publishHost, blockedState);
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
    const publishControl = target.closest(['.save-wrapper.fb .post-status', '.save-wrapper.fb input[name="post-status"]', '.save-wrapper.fb label[for*="fusion-post-status"]', '#publish', '.fusion-builder-publish-tooltip', '.fusion-builder-update-buttons [class*="publish"]', '.fusion-builder-update-buttons input[type="checkbox"]', '.fusion-builder-update-buttons label'].join(','));
    if (publishControl) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('change', function (e) {
    if (!blockedState) {
      return;
    }
    const target = e.target;
    if (target && target.matches && target.matches('.save-wrapper.fb input[name="post-status"], .fusion-builder-update-buttons input[type="checkbox"]')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      target.checked = !target.checked;
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
  enforceShareRowSizing();
  stabilizeReviewerUi();
  syncFreeUpsells(lastReview);
  const comboboxRoot = document.getElementById('flow-ew-reviewer-combobox');
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
      if (openList && hideAutocomplete()) {
        openList = false;
      }
      list.hidden = !openList;
      list.style.display = openList ? 'block' : 'none';
      input.setAttribute('aria-expanded', openList ? 'true' : 'false');
      if (!openList) {
        list.dispatchEvent(new Event('flow-ew:avada-close', {
          bubbles: false
        }));
      }
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
      const isEmail = (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_4__.isEmailComboboxOption)(li);
      select.value = id;
      setOpen(false);
      activeIndex = -1;
      if (isEmail) {
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
        const clearBtn = drawer.querySelector('.flow-ew-reviewer-combobox__clear');
        if (clearBtn) {
          clearBtn.setAttribute('hidden', '');
        }
        select.dispatchEvent(new Event('change', {
          bubbles: true
        }));
        input.focus();
        return;
      }
      emailEntryMode = false;
      input.value = label;
      input.blur();
      syncClearBtnVisibility({
        reviewer_id: Number(id)
      });
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
})();

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

/***/ "./src/avada/style.css"
/*!*****************************!*\
  !*** ./src/avada/style.css ***!
  \*****************************/
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
/******/ 			"avada/index": 0,
/******/ 			"avada/style-index": 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["avada/style-index"], () => (__webpack_require__("./src/avada/index.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map