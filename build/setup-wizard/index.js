/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/setup-wizard/UserPicker.js"
/*!****************************************!*\
  !*** ./src/setup-wizard/UserPicker.js ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ UserPicker)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/api-fetch */ "@wordpress/api-fetch");
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);




const cfg = window.flowEWSetup || {};
const i18n = cfg.i18n || {};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Search-and-pick for one WordPress user, optionally accepting a typed email
 * address instead. Value: `{ id, name }`, `{ email }` or null.
 *
 * @param {Object}   props
 * @param {string}   props.id
 * @param {Object}   props.value
 * @param {Function} props.onChange
 * @param {boolean}  props.allowEmail
 */
function UserPicker({
  id,
  value,
  onChange,
  allowEmail
}) {
  const [query, setQuery] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [results, setResults] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const request = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(0);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return undefined;
    }
    const current = ++request.current;
    const timer = setTimeout(() => {
      _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2___default()({
        url: `${cfg.usersUrl}?q=${encodeURIComponent(q)}`,
        headers: {
          'X-WP-Nonce': cfg.nonce
        }
      }).then(users => {
        if (current === request.current) {
          setResults(Array.isArray(users) ? users : []);
        }
      }).catch(() => {
        if (current === request.current) {
          setResults([]);
        }
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);
  function pick(next) {
    onChange(next);
    setQuery('');
    setResults([]);
  }
  if (value) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
      className: "flow-ew-wizard__picker-selected",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("span", {
        children: value.email || value.name
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "secondary",
        size: "small",
        onClick: () => onChange(null),
        children: i18n.clear
      })]
    });
  }
  const typed = query.trim().toLowerCase();
  const options = results.map(user => ({
    key: `user-${user.id}`,
    label: user.name,
    meta: user.email || user.login || '',
    value: {
      id: Number(user.id),
      name: user.name
    }
  }));
  if (allowEmail && EMAIL_RE.test(typed)) {
    options.unshift({
      key: 'email',
      label: String(i18n.inviteEmail || 'Invite %s').replace('%s', typed),
      meta: '',
      value: {
        email: typed
      }
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
    className: "flow-ew-wizard__picker",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
      id: id,
      type: "search",
      className: "flow-ew-wizard__picker-input",
      placeholder: allowEmail ? i18n.searchUsersOrEmail : i18n.searchUsers,
      value: query,
      onChange: event => setQuery(event.target.value),
      autoComplete: "off"
    }), options.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("ul", {
      className: "flow-ew-wizard__picker-results",
      role: "listbox",
      children: options.map(option => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("li", {
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("button", {
          type: "button",
          role: "option",
          "aria-selected": "false",
          className: "flow-ew-wizard__picker-option",
          onClick: () => pick(option.value),
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("span", {
            children: option.label
          }), option.meta && option.meta !== option.label && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("span", {
            className: "flow-ew-wizard__picker-meta",
            children: option.meta
          })]
        })
      }, option.key))
    })]
  });
}

/***/ },

/***/ "./src/setup-wizard/index.js"
/*!***********************************!*\
  !*** ./src/setup-wizard/index.js ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/api-fetch */ "@wordpress/api-fetch");
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_dom_ready__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/dom-ready */ "@wordpress/dom-ready");
/* harmony import */ var _wordpress_dom_ready__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_dom_ready__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _paths__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./paths */ "./src/setup-wizard/paths.js");
/* harmony import */ var _steps__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./steps */ "./src/setup-wizard/steps.js");
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./style.scss */ "./src/setup-wizard/style.scss");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__);








const cfg = window.flowEWSetup || {};
const i18n = cfg.i18n || {};
const STEPS = {
  useCase: _steps__WEBPACK_IMPORTED_MODULE_5__.UseCaseStep,
  mode: _steps__WEBPACK_IMPORTED_MODULE_5__.ModeStep,
  types: _steps__WEBPACK_IMPORTED_MODULE_5__.PostTypesStep,
  roles: _steps__WEBPACK_IMPORTED_MODULE_5__.RolesStep,
  extras: _steps__WEBPACK_IMPORTED_MODULE_5__.ExtrasStep,
  agent: _steps__WEBPACK_IMPORTED_MODULE_5__.AgentStep,
  done: _steps__WEBPACK_IMPORTED_MODULE_5__.DoneStep
};

/** Start from what the site has, so a re-run only changes what the person touches. */
function initialAnswers() {
  const current = cfg.current || {};
  let autoAssign = null;
  if (current.autoAssignReviewer) {
    autoAssign = current.autoAssignReviewer;
  } else if (current.autoAssignEmail) {
    autoAssign = {
      email: current.autoAssignEmail
    };
  }
  return {
    useCase: _paths__WEBPACK_IMPORTED_MODULE_4__.USE_CASES.includes(current.useCase) ? current.useCase : _paths__WEBPACK_IMPORTED_MODULE_4__.EDITORIAL,
    reviewMode: current.reviewMode === 'mandatory' ? 'mandatory' : 'optional',
    postTypes: Array.isArray(current.postTypes) ? current.postTypes : [],
    reviewerRoles: Array.isArray(current.reviewerRoles) ? current.reviewerRoles : [],
    allowExternal: current.allowExternal !== false,
    selfReview: false,
    showReviewedBy: !!current.showReviewedBy,
    autoAssign,
    agentEnabled: !!current.agentComments,
    agentComments: !!current.agentComments,
    agentAuthor: current.agentAuthor || null,
    agentResolveNotes: current.agentResolveNotes !== false,
    agentFollowup: current.agentFollowup !== false,
    agentMarker: current.agentMarker !== false,
    agentAskBeforeEditing: !!current.agentAskBeforeEditing
  };
}
function payload(answers) {
  const auto = answers.autoAssign;
  return {
    use_case: answers.useCase,
    review_mode: answers.reviewMode,
    post_types: answers.postTypes,
    reviewer_roles: answers.reviewerRoles,
    allow_external: answers.allowExternal,
    self_review: answers.selfReview,
    show_reviewed_by: answers.showReviewedBy,
    auto_assign_reviewer_id: auto && auto.id ? auto.id : 0,
    auto_assign_email: auto && auto.email ? auto.email : '',
    agent_enabled: (0,_paths__WEBPACK_IMPORTED_MODULE_4__.alwaysHasAgent)(answers.useCase) || answers.agentEnabled,
    agent_comments: answers.agentComments,
    agent_author_id: answers.agentAuthor ? answers.agentAuthor.id : 0,
    agent_resolve_notes: answers.agentResolveNotes,
    agent_followup: answers.agentFollowup,
    agent_marker: answers.agentMarker,
    agent_ask_before_edit: answers.agentAskBeforeEditing
  };
}
function Wizard({
  onClose
}) {
  const [answers, setAnswers] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(initialAnswers);
  const [index, setIndex] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  const [saving, setSaving] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [error, setError] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [showErrors, setShowErrors] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const steps = (0,_paths__WEBPACK_IMPORTED_MODULE_4__.pathFor)(answers.useCase);
  const key = steps[Math.min(index, steps.length - 1)];
  const StepComponent = STEPS[key];
  const isFirst = index === 0;
  const isLast = index >= steps.length - 1;
  function update(patch) {
    setAnswers(prev => ({
      ...prev,
      ...patch
    }));
  }
  async function save() {
    setSaving(true);
    setError('');
    try {
      await _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2___default()({
        url: cfg.restUrl,
        method: 'POST',
        headers: {
          'X-WP-Nonce': cfg.nonce
        },
        data: payload(answers)
      });
      onClose({
        saved: true
      });
    } catch (e) {
      setError(e && e.message || i18n.errorGeneric);
    } finally {
      setSaving(false);
    }
  }
  function next() {
    setError('');
    if (key === 'agent' && (0,_steps__WEBPACK_IMPORTED_MODULE_5__.agentStepBlocked)(answers)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (isLast) {
      save();
    } else {
      setIndex(index + 1);
    }
  }
  function back() {
    setError('');
    setShowErrors(false);
    if (!isFirst) {
      setIndex(index - 1);
    }
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Modal, {
    title: i18n.title,
    onRequestClose: () => onClose({
      saved: false
    }),
    className: "flow-ew-wizard",
    size: "medium",
    shouldCloseOnClickOutside: false,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
      className: "flow-ew-wizard__body",
      children: [isFirst ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("p", {
        className: "flow-ew-wizard__lead",
        children: i18n.lead
      }) : null, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
        className: "flow-ew-wizard__progress",
        "aria-hidden": "true",
        children: [steps.map((stepKey, i) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("span", {
          className: `flow-ew-wizard__progress-dot ${i === index ? 'is-current' : ''} ${i < index ? 'is-done' : ''}`
        }, stepKey)), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("span", {
          className: "flow-ew-wizard__progress-label",
          children: [i18n.step, " ", index + 1, " ", i18n.of, " ", steps.length]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(StepComponent, {
        answers: answers,
        update: update,
        showErrors: showErrors
      }), error ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Notice, {
        status: "error",
        isDismissible: false,
        className: "flow-ew-wizard__notice",
        children: error
      }) : null]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
      className: "flow-ew-wizard__actions",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "link",
        onClick: () => onClose({
          saved: false
        }),
        disabled: saving,
        className: "flow-ew-wizard__skip",
        children: i18n.skip
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)("div", {
        className: "flow-ew-wizard__actions-right",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          variant: "tertiary",
          onClick: back,
          disabled: isFirst || saving,
          children: i18n.back
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          variant: "primary",
          onClick: next,
          disabled: saving,
          children: [saving && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.Fragment, {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Spinner, {}), " ", i18n.saving]
          }), !saving && (isLast ? i18n.finish : i18n.next)]
        })]
      })]
    })]
  });
}
function App() {
  const [open, setOpen] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(!!cfg.autoOpen);
  const [savedNotice, setSavedNotice] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    function onOpen() {
      setOpen(true);
    }
    function onClick(event) {
      if (event.target.closest('[data-flow-ew-open-setup]')) {
        event.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener('flow-ew:open-setup-wizard', onOpen);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('flow-ew:open-setup-wizard', onOpen);
      document.removeEventListener('click', onClick);
    };
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!savedNotice) {
      return undefined;
    }
    const t = setTimeout(() => setSavedNotice(false), 4000);
    return () => clearTimeout(t);
  }, [savedNotice]);
  function onClose({
    saved
  }) {
    setOpen(false);
    if (saved) {
      setSavedNotice(true);
      // Settings on this screen were rendered before the save.
      if (document.querySelector('[data-flow-ew-open-setup]')) {
        window.location.reload();
      }
      return;
    }
    _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_2___default()({
      url: cfg.skipUrl,
      method: 'POST',
      headers: {
        'X-WP-Nonce': cfg.nonce
      }
    }).catch(() => {});
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.Fragment, {
    children: [open ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(Wizard, {
      onClose: onClose
    }) : null, savedNotice ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)("div", {
      className: "flow-ew-wizard__toast",
      role: "status",
      children: i18n.saved
    }) : null]
  });
}
_wordpress_dom_ready__WEBPACK_IMPORTED_MODULE_3___default()(() => {
  const host = document.createElement('div');
  host.id = 'flow-ew-setup-wizard-host';
  document.body.appendChild(host);
  const root = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createRoot)(host);
  root.render(/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_7__.jsx)(App, {}));
});

/***/ },

/***/ "./src/setup-wizard/paths.js"
/*!***********************************!*\
  !*** ./src/setup-wizard/paths.js ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   APPROVE_AI: () => (/* binding */ APPROVE_AI),
/* harmony export */   BUILD_AI: () => (/* binding */ BUILD_AI),
/* harmony export */   CLIENT: () => (/* binding */ CLIENT),
/* harmony export */   EDITORIAL: () => (/* binding */ EDITORIAL),
/* harmony export */   USE_CASES: () => (/* binding */ USE_CASES),
/* harmony export */   alwaysHasAgent: () => (/* binding */ alwaysHasAgent),
/* harmony export */   pathFor: () => (/* binding */ pathFor),
/* harmony export */   previewSettings: () => (/* binding */ previewSettings)
/* harmony export */ });
const EDITORIAL = 'editorial';
const CLIENT = 'client';
const BUILD_AI = 'build_ai';
const APPROVE_AI = 'approve_ai';
const USE_CASES = [EDITORIAL, CLIENT, BUILD_AI, APPROVE_AI];

/** Use cases that always configure an agent, without asking first. Mirrors Setup_Presets::always_has_agent(). */
function alwaysHasAgent(useCase) {
  return useCase === BUILD_AI || useCase === APPROVE_AI;
}

/**
 * The screens a use case walks through, in order. The first screen (the
 * use-case cards) is always included so Back can return to it.
 *
 * @param {string} useCase
 * @return {string[]} Step keys.
 */
function pathFor(useCase) {
  switch (useCase) {
    case CLIENT:
      return ['useCase', 'types', 'extras', 'agent', 'done'];
    case BUILD_AI:
      return ['useCase', 'agent', 'done'];
    case APPROVE_AI:
      return ['useCase', 'types', 'roles', 'extras', 'agent', 'done'];
    default:
      return ['useCase', 'mode', 'types', 'roles', 'extras', 'agent', 'done'];
  }
}

/**
 * What Finish will store, in the same terms as the server preset, so the last
 * screen can say what changes. Keep in step with Setup_Presets::resolve().
 *
 * @param {Object}   answers
 * @param {string[]} allPostTypes Every eligible post type slug.
 * @return {Object} Setting key => value; keys the use case leaves alone are absent.
 */
function previewSettings(answers, allPostTypes) {
  const {
    useCase
  } = answers;
  const out = {};
  if (useCase === CLIENT) {
    out.reviewMode = 'optional';
  } else if (useCase === BUILD_AI) {
    out.reviewMode = 'solo';
  } else if (useCase === APPROVE_AI) {
    out.reviewMode = 'mandatory';
  } else {
    out.reviewMode = answers.reviewMode === 'mandatory' ? 'mandatory' : 'optional';
  }
  out.postTypes = useCase === BUILD_AI ? allPostTypes : answers.postTypes || [];
  if (useCase !== BUILD_AI) {
    out.reviewerRoles = useCase === CLIENT ? [] : answers.reviewerRoles || [];
    out.allowExternal = useCase === CLIENT ? true : !!answers.allowExternal;
    out.openReviews = useCase === EDITORIAL;
    out.selfReview = !!answers.selfReview;
    out.showReviewedBy = !!answers.showReviewedBy;
    out.autoAssign = answers.autoAssign || null;
  }
  if (alwaysHasAgent(useCase) || answers.agentEnabled) {
    out.agentComments = !!answers.agentComments && !!answers.agentAuthor;
    out.agentAuthor = answers.agentAuthor || null;
  }
  return out;
}

/***/ },

/***/ "./src/setup-wizard/steps.js"
/*!***********************************!*\
  !*** ./src/setup-wizard/steps.js ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AgentStep: () => (/* binding */ AgentStep),
/* harmony export */   DoneStep: () => (/* binding */ DoneStep),
/* harmony export */   ExtrasStep: () => (/* binding */ ExtrasStep),
/* harmony export */   ModeStep: () => (/* binding */ ModeStep),
/* harmony export */   PostTypesStep: () => (/* binding */ PostTypesStep),
/* harmony export */   RolesStep: () => (/* binding */ RolesStep),
/* harmony export */   UseCaseStep: () => (/* binding */ UseCaseStep),
/* harmony export */   agentStepBlocked: () => (/* binding */ agentStepBlocked)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _UserPicker__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./UserPicker */ "./src/setup-wizard/UserPicker.js");
/* harmony import */ var _paths__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./paths */ "./src/setup-wizard/paths.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);





const cfg = window.flowEWSetup || {};
const i18n = cfg.i18n || {};
const choices = cfg.choices || {
  postTypes: [],
  roles: []
};
const reviewerRoleSlug = cfg.reviewerRoleSlug || 'flow_reviewer';
function StepHeader({
  title,
  desc
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("h2", {
      className: "flow-ew-wizard__step-title",
      children: title
    }), desc ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
      className: "flow-ew-wizard__step-desc",
      children: desc
    }) : null]
  });
}
function RadioCard({
  name,
  checked,
  onSelect,
  title,
  children
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("label", {
    className: `flow-ew-wizard__option ${checked ? 'is-selected' : ''}`,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("input", {
      type: "radio",
      name: name,
      checked: checked,
      onChange: onSelect
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("strong", {
        children: title
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalText, {
        variant: "muted",
        as: "p",
        children: children
      })]
    })]
  });
}
function CheckCard({
  checked,
  onChange,
  title,
  badge,
  children
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("label", {
    className: `flow-ew-wizard__option flow-ew-wizard__option--check ${checked ? 'is-selected' : ''}`,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("input", {
      type: "checkbox",
      checked: checked,
      onChange: event => onChange(event.target.checked)
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("strong", {
        children: [title, badge ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("span", {
          className: "flow-ew-wizard__badge",
          children: badge
        }) : null]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalText, {
        variant: "muted",
        as: "p",
        children: children
      })]
    })]
  });
}
const USE_CASE_COPY = {
  [_paths__WEBPACK_IMPORTED_MODULE_3__.EDITORIAL]: ['editorialLabel', 'editorialDesc'],
  [_paths__WEBPACK_IMPORTED_MODULE_3__.CLIENT]: ['clientLabel', 'clientDesc'],
  [_paths__WEBPACK_IMPORTED_MODULE_3__.BUILD_AI]: ['buildAiLabel', 'buildAiDesc'],
  [_paths__WEBPACK_IMPORTED_MODULE_3__.APPROVE_AI]: ['approveAiLabel', 'approveAiDesc']
};
function UseCaseStep({
  answers,
  update
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "flow-ew-wizard__step",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(StepHeader, {
      title: i18n.useCaseTitle,
      desc: i18n.useCaseDesc
    }), _paths__WEBPACK_IMPORTED_MODULE_3__.USE_CASES.map(useCase => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(RadioCard, {
      name: "flow-ew-use-case",
      checked: answers.useCase === useCase,
      onSelect: () => update({
        useCase
      }),
      title: i18n[USE_CASE_COPY[useCase][0]],
      children: i18n[USE_CASE_COPY[useCase][1]]
    }, useCase))]
  });
}
function ModeStep({
  answers,
  update
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "flow-ew-wizard__step",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(StepHeader, {
      title: i18n.modeTitle,
      desc: i18n.modeDesc
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(RadioCard, {
      name: "flow-ew-mode",
      checked: answers.reviewMode !== 'mandatory',
      onSelect: () => update({
        reviewMode: 'optional'
      }),
      title: i18n.modeOptional,
      children: i18n.modeOptionalDesc
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(RadioCard, {
      name: "flow-ew-mode",
      checked: answers.reviewMode === 'mandatory',
      onSelect: () => update({
        reviewMode: 'mandatory'
      }),
      title: i18n.modeMandatory,
      children: i18n.modeMandatoryDesc
    })]
  });
}
function SelectAllToggle({
  all,
  value,
  onChange
}) {
  const allChecked = all.length > 0 && all.every(s => value.includes(s));
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("button", {
    type: "button",
    className: "flow-ew-wizard__select-all",
    onClick: event => {
      event.preventDefault();
      onChange(allChecked ? [] : all.slice());
    },
    children: allChecked ? i18n.deselectAll : i18n.selectAll
  });
}
function toggleIn(list, slug, on) {
  const next = new Set(list);
  if (on) {
    next.add(slug);
  } else {
    next.delete(slug);
  }
  return Array.from(next);
}
function PostTypesStep({
  answers,
  update
}) {
  const list = choices.postTypes || [];
  const value = answers.postTypes;
  if (list.length === 0) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
      className: "flow-ew-wizard__step",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(StepHeader, {
        title: i18n.typesTitle,
        desc: i18n.typesEmpty
      })
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "flow-ew-wizard__step",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(StepHeader, {
      title: i18n.typesTitle,
      desc: i18n.typesDesc
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(SelectAllToggle, {
      all: list.map(pt => pt.slug),
      value: value,
      onChange: postTypes => update({
        postTypes
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
      className: "flow-ew-wizard__check-list",
      children: list.map(pt => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.CheckboxControl, {
        label: `${pt.label}  (${pt.slug})`,
        checked: value.includes(pt.slug),
        onChange: on => update({
          postTypes: toggleIn(value, pt.slug, on)
        }),
        __nextHasNoMarginBottom: true
      }, pt.slug))
    })]
  });
}
function RolesStep({
  answers,
  update
}) {
  const list = choices.roles || [];
  const value = answers.reviewerRoles;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "flow-ew-wizard__step",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(StepHeader, {
      title: i18n.rolesTitle,
      desc: i18n.rolesDesc
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(SelectAllToggle, {
      all: list.map(r => r.slug),
      value: value,
      onChange: reviewerRoles => update({
        reviewerRoles
      })
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
      className: "flow-ew-wizard__check-list flow-ew-wizard__check-list--roles",
      children: list.map(r => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        children: [r.slug === reviewerRoleSlug ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("div", {
          className: "flow-ew-wizard__roles-divider",
          "aria-hidden": "true"
        }) : null, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.CheckboxControl, {
          label: r.label,
          help: r.description || undefined,
          checked: value.includes(r.slug),
          onChange: on => update({
            reviewerRoles: toggleIn(value, r.slug, on)
          }),
          __nextHasNoMarginBottom: true
        })]
      }, r.slug))
    })]
  });
}
function ExtrasStep({
  answers,
  update
}) {
  const isClient = answers.useCase === _paths__WEBPACK_IMPORTED_MODULE_3__.CLIENT;
  const allowEmail = isClient || answers.allowExternal;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "flow-ew-wizard__step",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(StepHeader, {
      title: i18n.extrasTitle,
      desc: i18n.extrasDesc
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(CheckCard, {
      checked: !!answers.selfReview,
      onChange: selfReview => update({
        selfReview
      }),
      title: i18n.selfReviewLabel,
      children: i18n.selfReviewDesc
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(CheckCard, {
      checked: !!answers.showReviewedBy,
      onChange: showReviewedBy => update({
        showReviewedBy
      }),
      title: i18n.reviewedByLabel,
      children: i18n.reviewedByDesc
    }), !isClient && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(CheckCard, {
      checked: !!answers.allowExternal,
      onChange: allowExternal => update({
        allowExternal,
        autoAssign: !allowExternal && answers.autoAssign?.email ? null : answers.autoAssign
      }),
      title: i18n.externalLabel,
      children: i18n.externalDesc
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      className: "flow-ew-wizard__field",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("label", {
        className: "flow-ew-wizard__field-label",
        htmlFor: "flow-ew-wizard-auto-assign",
        children: i18n.autoAssignLabel
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_UserPicker__WEBPACK_IMPORTED_MODULE_2__["default"], {
        id: "flow-ew-wizard-auto-assign",
        value: answers.autoAssign,
        onChange: autoAssign => update({
          autoAssign
        }),
        allowEmail: allowEmail
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalText, {
        variant: "muted",
        as: "p",
        children: allowEmail ? i18n.autoAssignEmailDesc : i18n.autoAssignDesc
      })]
    })]
  });
}
function AgentStep({
  answers,
  update,
  showErrors
}) {
  const optional = !(0,_paths__WEBPACK_IMPORTED_MODULE_3__.alwaysHasAgent)(answers.useCase);
  const missingUser = answers.agentComments && !answers.agentAuthor;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "flow-ew-wizard__step",
    children: [optional ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(StepHeader, {
        title: i18n.agentAskTitle,
        desc: i18n.agentAskDesc
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(CheckCard, {
        checked: !!answers.agentEnabled,
        onChange: agentEnabled => update({
          agentEnabled
        }),
        title: i18n.agentAskLabel,
        children: i18n.agentAskHelp
      })]
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(StepHeader, {
      title: i18n.agentTitle,
      desc: i18n.agentDesc
    }), (!optional || answers.agentEnabled) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(AgentSettings, {
      answers: answers,
      update: update,
      showErrors: showErrors,
      missingUser: missingUser
    })]
  });
}
function AgentSettings({
  answers,
  update,
  showErrors,
  missingUser
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(CheckCard, {
      checked: !!answers.agentComments,
      onChange: agentComments => update({
        agentComments
      }),
      title: i18n.agentCommentsLabel,
      children: i18n.agentCommentsDesc
    }), answers.agentComments && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
        className: "flow-ew-wizard__field",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("label", {
          className: "flow-ew-wizard__field-label",
          htmlFor: "flow-ew-wizard-agent-user",
          children: i18n.agentAuthorLabel
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_UserPicker__WEBPACK_IMPORTED_MODULE_2__["default"], {
          id: "flow-ew-wizard-agent-user",
          value: answers.agentAuthor,
          onChange: agentAuthor => update({
            agentAuthor
          }),
          allowEmail: false
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.__experimentalText, {
          variant: "muted",
          as: "p",
          children: i18n.agentAuthorDesc
        }), showErrors && missingUser ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
          className: "flow-ew-wizard__field-error",
          role: "alert",
          children: i18n.agentAuthorRequired
        }) : null]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(CheckCard, {
        checked: !!answers.agentResolveNotes,
        onChange: agentResolveNotes => update({
          agentResolveNotes
        }),
        title: i18n.agentResolveLabel,
        children: i18n.agentResolveDesc
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(CheckCard, {
        checked: !!answers.agentFollowup,
        onChange: agentFollowup => update({
          agentFollowup
        }),
        title: i18n.agentFollowupLabel,
        children: i18n.agentFollowupDesc
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(CheckCard, {
        checked: !!answers.agentMarker,
        onChange: agentMarker => update({
          agentMarker
        }),
        title: i18n.agentMarkerLabel,
        children: i18n.agentMarkerDesc
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(CheckCard, {
        checked: !!answers.agentAskBeforeEditing,
        onChange: agentAskBeforeEditing => update({
          agentAskBeforeEditing
        }),
        title: i18n.agentAskEditLabel,
        badge: i18n.experimental,
        children: i18n.agentAskEditDesc
      })]
    })]
  });
}

/** True when the agent screen would refuse to continue. */
function agentStepBlocked(answers) {
  if (!(0,_paths__WEBPACK_IMPORTED_MODULE_3__.alwaysHasAgent)(answers.useCase) && !answers.agentEnabled) {
    return false;
  }
  return !!answers.agentComments && !answers.agentAuthor;
}
function copyText(text) {
  if (window.navigator?.clipboard && window.isSecureContext) {
    return window.navigator.clipboard.writeText(text);
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  document.body.removeChild(area);
  return Promise.resolve();
}
function PromptBox({
  prompt
}) {
  const [copied, setCopied] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "flow-ew-wizard__prompt",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("code", {
      children: prompt
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("button", {
      type: "button",
      className: "button flow-ew-wizard__prompt-copy",
      onClick: () => copyText(prompt).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }),
      children: copied ? i18n.copied : i18n.copy
    })]
  });
}
const MODE_LABELS = () => ({
  optional: i18n.modeOptional,
  mandatory: i18n.modeMandatory,
  solo: i18n.modeSolo
});
function onOff(value) {
  return value ? i18n.on : i18n.off;
}
function listLabel(slugs, list) {
  if (!slugs || slugs.length === 0) {
    return i18n.none;
  }
  return slugs.map(slug => {
    const found = list.find(item => item.slug === slug);
    return found ? String(found.label).replace(/ \(\d+\)$/, '') : slug;
  }).join(', ');
}
function personLabel(person) {
  if (!person) {
    return i18n.none;
  }
  return person.email || person.name;
}

/** Rows of what Finish changes compared with what the site has now. */
function changes(answers) {
  const current = cfg.current || {};
  const next = (0,_paths__WEBPACK_IMPORTED_MODULE_3__.previewSettings)(answers, (choices.postTypes || []).map(pt => pt.slug));
  let currentAutoAssign = current.autoAssignReviewer || null;
  if (!currentAutoAssign && current.autoAssignEmail) {
    currentAutoAssign = {
      email: current.autoAssignEmail
    };
  }
  const rows = [['reviewMode', i18n.modeTitle, MODE_LABELS()[next.reviewMode], MODE_LABELS()[current.reviewMode]], ['postTypes', i18n.typesTitle, listLabel(next.postTypes, choices.postTypes), listLabel(current.postTypes, choices.postTypes)], ['reviewerRoles', i18n.rolesTitle, listLabel(next.reviewerRoles, choices.roles), listLabel(current.reviewerRoles, choices.roles)], ['allowExternal', i18n.externalLabel, onOff(next.allowExternal), onOff(current.allowExternal)], ['openReviews', i18n.openReviewLabel, onOff(next.openReviews), onOff(current.openReviews)], ['selfReview', i18n.selfReviewLabel, onOff(next.selfReview), onOff(current.selfReview)], ['showReviewedBy', i18n.reviewedByLabel, onOff(next.showReviewedBy), onOff(current.showReviewedBy)], ['autoAssign', i18n.autoAssignLabel, personLabel(next.autoAssign), personLabel(currentAutoAssign)], ['agentComments', i18n.agentCommentsLabel, onOff(next.agentComments), onOff(current.agentComments)], ['agentAuthor', i18n.agentAuthorLabel, personLabel(next.agentAuthor), personLabel(current.agentAuthor)]];
  return rows.filter(([key,, value, was]) => key in next && value !== was);
}
const next = cfg.next || {};
function startUrl(answers, preferPage) {
  const types = answers.postTypes || [];
  let type = types[0] || 'post';
  if (preferPage && types.includes('page')) {
    type = 'page';
  }
  return `${next.newPostUrl}?post_type=${encodeURIComponent(type)}`;
}
function Steps({
  items
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("ol", {
    className: "flow-ew-wizard__next-steps",
    children: items.filter(Boolean).map(text => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("li", {
      children: text
    }, text))
  });
}
function StartButton({
  href
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("a", {
      className: "button button-primary",
      href: href,
      children: i18n.nextStart
    })
  });
}

/** Who can review with the roles picked in this run. */
function ReviewerCheck({
  answers
}) {
  const picked = (choices.roles || []).filter(role => (answers.reviewerRoles || []).includes(role.slug));
  const total = picked.reduce((sum, role) => sum + Number(role.userCount || 0), 0);
  const names = picked.map(role => String(role.label).replace(/ \(\d+\)$/, '')).join(', ');
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: `flow-ew-wizard__check flow-ew-wizard__check--${total > 0 ? 'ok' : 'warn'}`,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("p", {
      children: [total > 0 ? String(i18n.nextRolesSome).replace('%1$d', String(total)).replace('%2$s', names) : i18n.nextRolesNone, ' ', i18n.nextRolesHint]
    }), (next.addUserUrl || next.usersUrl) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("p", {
      className: "flow-ew-wizard__check-actions",
      children: [next.addUserUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("a", {
        className: "button",
        href: next.addUserUrl,
        target: "_blank",
        rel: "noreferrer",
        children: i18n.nextAddUser
      }), next.usersUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("a", {
        className: "button button-link",
        href: next.usersUrl,
        target: "_blank",
        rel: "noreferrer",
        children: i18n.nextManageUsers
      })]
    })]
  });
}
function Clip({
  src,
  label
}) {
  if (!src) {
    return null;
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("video", {
    className: "flow-ew-wizard__video",
    src: src,
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    "aria-label": label
  });
}
function AgentPrompt({
  first,
  title
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: `flow-ew-wizard__agent${first ? ' flow-ew-wizard__agent--first' : ''}`,
    children: [title && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
      className: "flow-ew-wizard__next-title",
      children: title
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
      className: "flow-ew-wizard__step-desc",
      children: i18n.nextPastePrompt
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(PromptBox, {
      prompt: cfg.agentPrompt
    })]
  });
}
function AskExamples({
  items
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
      className: "flow-ew-wizard__step-desc",
      children: i18n.nextTryAsking
    }), items.map(text => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(PromptBox, {
      prompt: text
    }, text))]
  });
}
function AiNextSteps({
  useCase
}) {
  const build = useCase === _paths__WEBPACK_IMPORTED_MODULE_3__.BUILD_AI;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(AgentPrompt, {
      first: build
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(Steps, {
      items: build ? [i18n.nextBuildAi1, i18n.nextBuildAi2, i18n.nextBuildAi3, i18n.nextBuildAi4] : [i18n.nextApproveAi1, i18n.nextApproveAi2, i18n.nextApproveAi3, i18n.nextMandatory]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(AskExamples, {
      items: build ? [i18n.nextBuildAiAsk1, i18n.nextBuildAiAsk2] : [i18n.nextApproveAiAsk1, i18n.nextApproveAiAsk2]
    })]
  });
}
function NextSteps({
  answers
}) {
  const {
    useCase
  } = answers;
  if ((0,_paths__WEBPACK_IMPORTED_MODULE_3__.alwaysHasAgent)(useCase)) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      className: "flow-ew-wizard__next",
      children: [useCase === _paths__WEBPACK_IMPORTED_MODULE_3__.APPROVE_AI && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(ReviewerCheck, {
        answers: answers
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(AiNextSteps, {
        useCase: useCase
      })]
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "flow-ew-wizard__next",
    children: [useCase === _paths__WEBPACK_IMPORTED_MODULE_3__.EDITORIAL && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(ReviewerCheck, {
        answers: answers
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(Steps, {
        items: [i18n.nextEditorial1, i18n.nextEditorial2, i18n.nextEditorial3, answers.reviewMode === 'mandatory' ? i18n.nextMandatory : '']
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(Clip, {
        src: next.editorialVideoWebm,
        label: i18n.nextEditorialVideo
      })]
    }), useCase === _paths__WEBPACK_IMPORTED_MODULE_3__.CLIENT && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.Fragment, {
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(Steps, {
        items: [i18n.nextClient1, i18n.nextClient2, i18n.nextClient3]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(Clip, {
        src: next.clientVideoWebm,
        label: i18n.nextClientVideo
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
        className: "flow-ew-wizard__step-desc",
        children: i18n.nextClientTip
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(StartButton, {
      href: startUrl(answers, useCase === _paths__WEBPACK_IMPORTED_MODULE_3__.CLIENT)
    }), answers.agentEnabled && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(AgentPrompt, {
      title: i18n.nextAgentTitle
    })]
  });
}
function DoneStep({
  answers
}) {
  const rows = cfg.completed ? changes(answers) : [];
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "flow-ew-wizard__step",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(StepHeader, {
      title: i18n.doneTitle
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(NextSteps, {
      answers: answers
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
      className: "flow-ew-wizard__docs",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("a", {
        href: cfg.docsUrl,
        target: "_blank",
        rel: "noreferrer",
        children: i18n.doneDocs
      })
    }), cfg.completed && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      className: "flow-ew-wizard__changes",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
        className: "flow-ew-wizard__changes-title",
        children: rows.length ? i18n.doneChanges : i18n.doneNoChanges
      }), rows.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("ul", {
        children: rows.map(([key, label, value, was]) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("li", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("strong", {
            children: [label, ":"]
          }), " ", value, ' ', /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("span", {
            className: "flow-ew-wizard__was",
            children: String(i18n.was || '(was %s)').replace('%s', was)
          })]
        }, key))
      })]
    })]
  });
}

/***/ },

/***/ "./src/setup-wizard/style.scss"
/*!*************************************!*\
  !*** ./src/setup-wizard/style.scss ***!
  \*************************************/
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

/***/ "@wordpress/components"
/*!************************************!*\
  !*** external ["wp","components"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["components"];

/***/ },

/***/ "@wordpress/dom-ready"
/*!**********************************!*\
  !*** external ["wp","domReady"] ***!
  \**********************************/
(module) {

module.exports = window["wp"]["domReady"];

/***/ },

/***/ "@wordpress/element"
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["element"];

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
/******/ 			"setup-wizard/index": 0,
/******/ 			"setup-wizard/style-index": 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["setup-wizard/style-index"], () => (__webpack_require__("./src/setup-wizard/index.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map