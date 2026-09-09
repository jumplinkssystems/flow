/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/oxygen/index.js"
/*!*****************************!*\
  !*** ./src/oxygen/index.js ***!
  \*****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _style_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./style.css */ "./src/oxygen/style.css");
/* harmony import */ var _shared_sync_reviewer_combobox_from_review__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../shared/sync-reviewer-combobox-from-review */ "./src/shared/sync-reviewer-combobox-from-review.js");
/* harmony import */ var _shared_assign_invite_email__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../shared/assign-invite-email */ "./src/shared/assign-invite-email.js");
/* harmony import */ var _shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../shared/reviewer-email-entry */ "./src/shared/reviewer-email-entry.js");
/* harmony import */ var _shared_share_bar_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../shared/share-bar.css */ "./src/shared/share-bar.css");





(function () {
  const drawer = document.getElementById('flow-ew-oxygen-drawer');
  const toggle = document.getElementById('flow-ew-oxygen-toggle');
  if (!drawer || !toggle) {
    return;
  }
  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  /**
   * Oxygen 6 has no `.top-bar-settings-and-structure-section`. Mount the
   * review control in the right `.topbar-section`, immediately before the
   * Save control's top-level sibling (Save itself may be nested).
   */
  function findSaveButton() {
    return document.querySelector('.button-save-oxygen');
  }
  function findToolbarMount() {
    const save = findSaveButton();
    if (!save) {
      return null;
    }
    const section = save.closest('.topbar-section');
    if (!section) {
      return null;
    }
    // insertBefore requires a direct child of `section` as the reference node.
    let before = save;
    while (before.parentElement && before.parentElement !== section) {
      before = before.parentElement;
    }
    if (before.parentElement !== section) {
      return null;
    }
    return {
      section: section,
      before: before
    };
  }
  function ensureToolbarButton() {
    const mount = findToolbarMount();
    if (!mount) {
      return false;
    }
    toggle.hidden = false;
    toggle.classList.add('breakdance-toolbar-icon-button');
    if (toggle.parentElement !== mount.section || toggle.nextElementSibling !== mount.before) {
      mount.section.insertBefore(toggle, mount.before);
    }
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
    drawer.style.display = '';
    drawer.classList.add('is-open');
    toggle.classList.add('is-active', 'breakdance-toolbar-icon-button-active');
  }
  function close() {
    drawer.classList.remove('is-open');
    toggle.classList.remove('is-active', 'breakdance-toolbar-icon-button-active');
    setTimeout(function () {
      if (!drawer.classList.contains('is-open')) {
        drawer.style.display = 'none';
      }
    }, 200);
  }
  toggle.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (drawer.classList.contains('is-open')) {
      close();
    } else {
      open();
    }
  });
  const closeBtn = drawer.querySelector('.flow-ew-oxygen-drawer__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', close);
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      close();
    }
  });
  document.addEventListener('flow-ew:classic-render', function (e) {
    const review = e.detail && e.detail.review;
    const status = review && review.status || '';
    toggle.dataset.status = status;
    (0,_shared_sync_reviewer_combobox_from_review__WEBPACK_IMPORTED_MODULE_1__.syncReviewerComboboxFromReview)(review);
    const list = document.getElementById('flow-ew-reviewer-listbox');
    const input = document.getElementById('flow-ew-reviewer-input');
    if (list) {
      list.hidden = true;
    }
    if (input) {
      input.setAttribute('aria-expanded', 'false');
    }
  });
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
      return (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_3__.shouldHideReviewerAutocomplete)(select, input, emailEntryMode);
    }
    function setOpen(openList) {
      if (openList && (hideAutocomplete() || visibleOptions().length === 0)) {
        openList = false;
      }
      list.hidden = !openList;
      input.setAttribute('aria-expanded', openList ? 'true' : 'false');
    }
    function filterOptions(q) {
      (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_3__.filterReviewerComboboxOptions)(options, q);
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
      if ((0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_3__.isEmailComboboxOption)(li)) {
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
        input.placeholder = (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_3__.getEmailPlaceholder)();
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
          (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_3__.exitReviewerEmailEntryMode)(select, input, options);
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
      (0,_shared_reviewer_email_entry__WEBPACK_IMPORTED_MODULE_3__.exitReviewerEmailEntryMode)(select, input, options);
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

/***/ "./src/oxygen/style.css"
/*!******************************!*\
  !*** ./src/oxygen/style.css ***!
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
/******/ 			"oxygen/index": 0,
/******/ 			"oxygen/style-index": 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["oxygen/style-index"], () => (__webpack_require__("./src/oxygen/index.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map