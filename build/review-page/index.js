/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/review-page/components/AnonymousNamePrompt.js"
/*!***********************************************************!*\
  !*** ./src/review-page/components/AnonymousNamePrompt.js ***!
  \***********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ AnonymousNamePrompt)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);



/**
 * Identity prompt for anonymous visitors on a public review page. Plain HTML —
 * the surrounding shadow root carries the Gutenberg-styled CSS for the form
 * chrome, so we don't need @wordpress/components inside (which would either
 * escape the shadow root via portals or rely on cloned wp-* stylesheets that
 * may not all reach this tree).
 *
 * For email invitees, pass `lockedEmail` so the invite address is shown
 * prefilled and disabled (identity is already gated by the invite cookie).
 */

function AnonymousNamePrompt({
  onSubmit,
  onCancel,
  initialName = '',
  initialEmail = '',
  lockedEmail = ''
}) {
  const locked = String(lockedEmail || '').trim();
  const [name, setName] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(initialName || '');
  const [email, setEmail] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(locked || initialEmail || '');
  const inputRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const handleSubmit = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(event => {
    event?.preventDefault?.();
    const trimmed = (name || '').trim();
    if (!trimmed) {
      return;
    }
    onSubmit({
      name: trimmed,
      email: locked || (email || '').trim()
    });
  }, [name, email, locked, onSubmit]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    inputRef.current?.focus();
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const onKey = e => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);
  const trimmedName = (name || '').trim();
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
    className: "flow-ew-pro-anon-prompt__overlay",
    role: "presentation",
    onClick: e => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "flow-ew-pro-anon-prompt__dialog",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "flow-ew-pro-anon-prompt-title",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "flow-ew-pro-anon-prompt__header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h1", {
          className: "flow-ew-pro-anon-prompt__title",
          id: "flow-ew-pro-anon-prompt-title",
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Add your name to comment', 'jumplinks-editorial-workflow')
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
          type: "button",
          className: "flow-ew-pro-anon-prompt__close",
          onClick: onCancel,
          "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Close', 'jumplinks-editorial-workflow'),
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("svg", {
            viewBox: "0 0 24 24",
            width: "24",
            height: "24",
            "aria-hidden": "true",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("path", {
              fill: "currentColor",
              d: "M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z"
            })
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("form", {
        onSubmit: handleSubmit,
        className: "flow-ew-pro-anon-prompt__body",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
          className: "flow-ew-pro-anon-prompt__lead",
          children: locked ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Tell us who you are so the author knows where the feedback is from.', 'jumplinks-editorial-workflow') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('You’re leaving a comment on a public review page. Tell us who you are so the author knows where the feedback is from.', 'jumplinks-editorial-workflow')
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("label", {
          className: "flow-ew-pro-anon-prompt__field",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
            className: "flow-ew-pro-anon-prompt__label",
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Name', 'jumplinks-editorial-workflow')
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
            ref: inputRef,
            type: "text",
            className: "flow-ew-pro-anon-prompt__input",
            value: name,
            onChange: e => setName(e.target.value),
            required: true,
            autoComplete: "name"
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("label", {
          className: "flow-ew-pro-anon-prompt__field",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
            className: "flow-ew-pro-anon-prompt__label",
            children: locked ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Email', 'jumplinks-editorial-workflow') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Email (optional)', 'jumplinks-editorial-workflow')
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
            type: "email",
            className: "flow-ew-pro-anon-prompt__input",
            value: email,
            onChange: e => {
              if (!locked) {
                setEmail(e.target.value);
              }
            },
            disabled: !!locked,
            readOnly: !!locked,
            autoComplete: "email"
          }), !locked && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
            className: "flow-ew-pro-anon-prompt__help",
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('We’ll only use it to notify you when someone replies.', 'jumplinks-editorial-workflow')
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
          className: "flow-ew-pro-anon-prompt__actions",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
            type: "button",
            className: "flow-ew-pro-anon-prompt__btn flow-ew-pro-anon-prompt__btn--tertiary",
            onClick: onCancel,
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Cancel', 'jumplinks-editorial-workflow')
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
            type: "submit",
            className: "flow-ew-pro-anon-prompt__btn flow-ew-pro-anon-prompt__btn--primary",
            disabled: !trimmedName,
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Continue', 'jumplinks-editorial-workflow')
          })]
        })]
      })]
    })
  });
}

/***/ },

/***/ "./src/review-page/components/BasicCommentEditor.js"
/*!**********************************************************!*\
  !*** ./src/review-page/components/BasicCommentEditor.js ***!
  \**********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ BasicCommentEditor)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);




function htmlToPlainText(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.innerText || div.textContent || '').replace(/\u00a0/g, ' ');
}
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function plainTextToCommentHtml(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }
  const blocks = trimmed.split(/\n{2,}/);
  return blocks.map(block => {
    const withBreaks = escapeHtml(block).replace(/\n/g, '<br />');
    return `<p>${withBreaks}</p>`;
  }).join('');
}
function BasicCommentEditor({
  onSubmit,
  disabled,
  initialHtml = null,
  onCancel = null,
  clearDraftOnCancel = false,
  submitLabel = null,
  autoFocus = false
}) {
  const isEditMode = initialHtml !== null;
  const textareaRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const [text, setText] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => htmlToPlainText(initialHtml || ''));
  const [submitting, setSubmitting] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [submitError, setSubmitError] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (initialHtml !== null) {
      setText(htmlToPlainText(initialHtml));
    }
  }, [initialHtml]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!autoFocus) {
      return;
    }
    const focusField = () => {
      const el = textareaRef.current;
      if (!el || document.activeElement === el) {
        return true;
      }
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
      return document.activeElement === el;
    };

    // Clicking "Add Comment" can leave focus on the (unmounted) button or
    // the iframe selection; retry past the next paint so focus sticks.
    let cancelled = false;
    const tryFocus = () => {
      if (cancelled || focusField()) {
        return;
      }
      requestAnimationFrame(() => {
        if (cancelled || focusField()) {
          return;
        }
        window.setTimeout(() => {
          if (!cancelled) {
            focusField();
          }
        }, 50);
      });
    };
    tryFocus();
    return () => {
      cancelled = true;
    };
  }, [autoFocus]);
  const isEmpty = !text.trim();
  const submitDisabled = isEmpty || submitting || disabled;
  const showCancel = onCancel != null || clearDraftOnCancel && !submitDisabled;
  const handleCancelClick = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    if (onCancel) {
      onCancel();
      return;
    }
    setText('');
    setSubmitError(null);
  }, [onCancel]);
  const handleSubmit = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async () => {
    if (submitDisabled) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(plainTextToCommentHtml(text));
      if (!isEditMode) {
        setText('');
      }
    } catch (err) {
      setSubmitError(err.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Failed to post comment.', 'jumplinks-editorial-workflow'));
    } finally {
      setSubmitting(false);
    }
  }, [submitDisabled, onSubmit, text, isEditMode]);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
    className: "flow-comment-editor flow-comment-editor--basic",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
      className: "flow-comment-editor__content",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("textarea", {
        ref: textareaRef,
        className: "flow-comment-editor__textarea",
        value: text,
        onChange: e => setText(e.target.value),
        placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Write a comment…', 'jumplinks-editorial-workflow'),
        disabled: submitting || disabled,
        rows: 3,
        autoFocus: autoFocus
      })
    }), submitError && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
      className: "flow-comment-editor__error",
      children: submitError
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
      className: "flow-comment-editor__submit-row",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        variant: "secondary",
        className: "flow-comment-editor__submit-btn",
        onClick: handleSubmit,
        disabled: submitDisabled,
        __next40pxDefaultSize: true,
        children: submitting ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Saving…', 'jumplinks-editorial-workflow') : submitLabel || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Add Comment', 'jumplinks-editorial-workflow')
      }), showCancel && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        className: "flow-btn--text flow-btn--cancel",
        onClick: handleCancelClick,
        disabled: submitting,
        __next40pxDefaultSize: true,
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Cancel', 'jumplinks-editorial-workflow')
      })]
    })]
  });
}

/***/ },

/***/ "./src/review-page/components/CommentCard.js"
/*!***************************************************!*\
  !*** ./src/review-page/components/CommentCard.js ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ CommentCard)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/chevron-up.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/close-small.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/api */ "./src/review-page/utils/api.js");
/* harmony import */ var _utils_dom_helpers__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/dom-helpers */ "./src/review-page/utils/dom-helpers.js");
/* harmony import */ var _CommentEditor__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./CommentEditor */ "./src/review-page/components/CommentEditor.js");
/* harmony import */ var _icons_comment_more__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../icons/comment-more */ "./src/review-page/icons/comment-more.js");
/* harmony import */ var _icons_comment_resolve__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../icons/comment-resolve */ "./src/review-page/icons/comment-resolve.js");
/* harmony import */ var _icons_comment_edit__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../icons/comment-edit */ "./src/review-page/icons/comment-edit.js");
/* harmony import */ var _icons_comment_trash__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../icons/comment-trash */ "./src/review-page/icons/comment-trash.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__);












function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
const TRUNCATE_HEIGHT = 80;
function CommentCard({
  comment,
  onEdit,
  onDelete,
  onResolve,
  showResolveInActions = true,
  isThreadExpanded = false,
  canTriggerExpand = false,
  canCollapseThread = false,
  onRequestExpand = null,
  onRequestCollapse = null,
  isReply = false
}) {
  const currentUserId = Number(_utils_api__WEBPACK_IMPORTED_MODULE_5__.pageData.currentUserId || 0);
  const isAnonymousViewer = currentUserId === 0;
  const isOwn = Number(comment.authorId) > 0 && Number(comment.authorId) === currentUserId;
  const [editing, setEditing] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [menuOpen, setMenuOpen] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [truncated, setTruncated] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const bodyRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const editEditorRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const menuRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (bodyRef.current && bodyRef.current.scrollHeight > TRUNCATE_HEIGHT) {
      setTruncated(true);
    }
  }, [comment.html]);
  const handleEditSave = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async html => {
    await onEdit(comment.id, html);
    setEditing(false);
  }, [comment.id, onEdit]);
  const initials = getInitials(comment.author);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!editing || !editEditorRef.current) {
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const submitRow = editEditorRef.current?.querySelector('.flow-comment-editor__submit-row');
        const target = submitRow || editEditorRef.current;
        const scroller = target.closest('.components-tab-panel__tab-content');
        if (!scroller) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest'
          });
          return;
        }
        const scrollerRect = scroller.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const desiredBottom = scrollerRect.bottom - 10;
        const delta = targetRect.bottom - desiredBottom;
        if (delta > 0) {
          scroller.scrollBy({
            top: delta,
            behavior: 'smooth'
          });
        }
      });
    });
  }, [editing]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!menuOpen) {
      return undefined;
    }
    const handlePointerDown = e => {
      if ((0,_utils_dom_helpers__WEBPACK_IMPORTED_MODULE_6__.eventHitsShadowNode)(e, menuRef.current)) {
        return;
      }
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [menuOpen]);
  const handleEditClick = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    setMenuOpen(false);
    setEditing(true);
  }, []);
  const handleDeleteClick = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    setMenuOpen(false);
    onDelete(comment.id);
  }, [comment.id, onDelete]);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
    className: `flow-comment-card${isReply ? ' flow-comment-card--reply' : ''}`,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
      className: "flow-comment-card__header",
      children: [comment.avatarUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("img", {
        className: "flow-comment-card__avatar flow-comment-card__avatar--img",
        src: comment.avatarUrl,
        alt: "",
        width: "28",
        height: "28"
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
        className: "flow-comment-card__avatar flow-comment-card__avatar--fallback",
        "aria-hidden": "true",
        children: initials
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
        className: "flow-comment-card__author",
        title: comment.author,
        children: comment.author
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
        className: "flow-comment-card__date",
        children: comment.date
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("span", {
        className: "flow-comment-card__actions",
        children: [!menuOpen && isThreadExpanded && canCollapseThread && onRequestCollapse && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
          size: "small",
          className: "flow-comment-card__action-btn flow-comment-card__action-btn--collapse",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Collapse thread', 'jumplinks-editorial-workflow'),
          onClick: onRequestCollapse
        }), !menuOpen && !isAnonymousViewer && showResolveInActions && onResolve && !comment.isResolved && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          icon: _icons_comment_resolve__WEBPACK_IMPORTED_MODULE_9__["default"],
          size: "small",
          className: "flow-comment-card__action-icon flow-comment-card__resolve-icon",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Mark as resolved', 'jumplinks-editorial-workflow'),
          onClick: () => onResolve(comment.id)
        }), isOwn && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
          ref: menuRef,
          className: menuOpen ? 'flow-comment-card__menu flow-comment-card__menu--open' : 'flow-comment-card__menu',
          children: menuOpen ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.Fragment, {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
              icon: _icons_comment_edit__WEBPACK_IMPORTED_MODULE_10__["default"],
              size: "small",
              className: "flow-comment-card__action-icon flow-comment-card__action-icon--edit",
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Edit', 'jumplinks-editorial-workflow'),
              onClick: handleEditClick
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
              icon: _icons_comment_trash__WEBPACK_IMPORTED_MODULE_11__["default"],
              size: "small",
              className: "flow-comment-card__action-icon flow-comment-card__action-icon--destructive",
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Delete', 'jumplinks-editorial-workflow'),
              onClick: handleDeleteClick
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
              icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__["default"],
              size: "small",
              className: "flow-comment-card__action-icon flow-comment-card__action-icon--close",
              label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Close', 'jumplinks-editorial-workflow'),
              onClick: () => setMenuOpen(false),
              "aria-expanded": true
            })]
          }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
            icon: _icons_comment_more__WEBPACK_IMPORTED_MODULE_8__["default"],
            size: "small",
            className: "flow-comment-card__action-icon flow-comment-card__menu-trigger",
            label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Actions', 'jumplinks-editorial-workflow'),
            onClick: () => setMenuOpen(true),
            "aria-expanded": false,
            "aria-haspopup": "true"
          })
        })]
      })]
    }), editing ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
      ref: editEditorRef,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_CommentEditor__WEBPACK_IMPORTED_MODULE_7__["default"], {
        autoFocus: true,
        initialHtml: comment.html,
        onSubmit: handleEditSave,
        onCancel: () => setEditing(false),
        submitLabel: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_4__.__)('Save', 'jumplinks-editorial-workflow')
      })
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.Fragment, {
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
        ref: bodyRef,
        className: `flow-comment-card__body${truncated && !isThreadExpanded ? ' flow-comment-card__body--truncated' : ''}`,
        dangerouslySetInnerHTML: {
          __html: comment.html
        },
        onClick: () => {
          if (truncated && !isThreadExpanded && canTriggerExpand && onRequestExpand) {
            onRequestExpand();
          }
        }
      })
    })]
  });
}

/***/ },

/***/ "./src/review-page/components/CommentEditor.js"
/*!*****************************************************!*\
  !*** ./src/review-page/components/CommentEditor.js ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ CommentEditor)
/* harmony export */ });
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/hooks */ "@wordpress/hooks");
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _BasicCommentEditor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./BasicCommentEditor */ "./src/review-page/components/BasicCommentEditor.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);



function CommentEditor(props) {
  const Component = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_0__.applyFilters)('flow_ew_comment_editor', _BasicCommentEditor__WEBPACK_IMPORTED_MODULE_1__["default"]);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(Component, {
    ...props
  });
}

/***/ },

/***/ "./src/review-page/components/CommentSidebar.js"
/*!******************************************************!*\
  !*** ./src/review-page/components/CommentSidebar.js ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ CommentSidebar)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/close-small.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/hooks */ "@wordpress/hooks");
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/api */ "./src/review-page/utils/api.js");
/* harmony import */ var _utils_comment_api__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/comment-api */ "./src/review-page/utils/comment-api.js");
/* harmony import */ var _utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/review-comment-totals */ "./src/review-page/utils/review-comment-totals.js");
/* harmony import */ var _CommentEditor__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./CommentEditor */ "./src/review-page/components/CommentEditor.js");
/* harmony import */ var _CommentThread__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./CommentThread */ "./src/review-page/components/CommentThread.js");
/* harmony import */ var _InlineCommentsPanel__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./InlineCommentsPanel */ "./src/review-page/components/InlineCommentsPanel.js");
/* harmony import */ var _utils_comment_tree__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../utils/comment-tree */ "./src/review-page/utils/comment-tree.js");
/* harmony import */ var _hooks_use_confirm_dialog__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../hooks/use-confirm-dialog */ "./src/review-page/hooks/use-confirm-dialog.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__);














const SIDEBAR_TABS = [{
  name: 'comments',
  title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Comments', 'jumplinks-editorial-workflow')
}, {
  name: 'resolved',
  title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Resolved', 'jumplinks-editorial-workflow')
}];
function readStoredActiveTab() {
  const stored = sessionStorage.getItem('flow_active_tab');
  if (stored === 'resolved') {
    return 'resolved';
  }
  // Legacy tab ids from the Review + Comments layout.
  if (stored === 'review' || stored === 'comments') {
    return 'comments';
  }
  return 'comments';
}

/**
 * @param {object} [props]
 * @param {import('../utils/comment-api').CommentApi} [props.api]
 * @param {boolean} [props.showEditor]
 * @param {'active'|'resolved'} [props.threadFilter]
 * @param {Array} props.comments
 * @param {Function} props.setComments
 */
function GeneralCommentsPanel({
  api = _utils_comment_api__WEBPACK_IMPORTED_MODULE_6__.defaultCommentApi,
  showEditor = true,
  threadFilter = 'active',
  comments,
  setComments
}) {
  const {
    confirm,
    confirmDialog
  } = (0,_hooks_use_confirm_dialog__WEBPACK_IMPORTED_MODULE_12__.useConfirmDialog)();
  const tree = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => (0,_utils_comment_tree__WEBPACK_IMPORTED_MODULE_11__.buildCommentTree)(comments), [comments]);
  const {
    activeThreads,
    resolvedThreads
  } = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    const active = [];
    const resolved = [];
    for (const thread of tree) {
      (thread.isResolved ? resolved : active).push(thread);
    }
    return {
      activeThreads: active,
      resolvedThreads: resolved
    };
  }, [tree]);
  const appendComment = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(comment => {
    setComments(prev => prev.some(c => c.id === comment.id) ? prev : [...prev, comment]);
  }, []);
  const handleSubmit = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async html => {
    const comment = await api.postComment({
      html
    });
    appendComment(comment);
    window.dispatchEvent(new CustomEvent('flow:author-resubmit-activity', {
      detail: {
        userId: _utils_api__WEBPACK_IMPORTED_MODULE_5__.pageData.currentUserId,
        kind: 'comment_added'
      }
    }));
  }, [api, appendComment]);
  const handleReply = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (parentId, html) => {
    const comment = await api.postComment({
      html,
      parentId
    });
    appendComment(comment);
    window.dispatchEvent(new CustomEvent('flow:author-resubmit-activity', {
      detail: {
        userId: _utils_api__WEBPACK_IMPORTED_MODULE_5__.pageData.currentUserId,
        kind: 'comment_added'
      }
    }));
  }, [api, appendComment]);
  const handleEdit = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (id, html) => {
    await api.updateComment(id, {
      html
    });
    let syncInline = false;
    setComments(prev => {
      const cur = prev.find(c => c.id === id);
      syncInline = !!(cur?.blockClientId || cur?.anchorText);
      return prev.map(c => c.id === id ? {
        ...c,
        html
      } : c);
    });
    if (syncInline) {
      window.dispatchEvent(new CustomEvent('flow:inline-comment-updated', {
        detail: {
          id,
          html
        }
      }));
    }
  }, [api]);
  const handleResolve = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async id => {
    await api.updateComment(id, {
      resolved: true
    });
    let syncInline = false;
    setComments(prev => {
      const cur = prev.find(c => c.id === id);
      syncInline = !!(cur?.blockClientId || cur?.anchorText);
      return prev.map(c => c.id === id ? {
        ...c,
        isResolved: true
      } : c);
    });
    if (syncInline) {
      window.dispatchEvent(new CustomEvent('flow:highlight-resolve', {
        detail: {
          commentId: id
        }
      }));
      window.dispatchEvent(new CustomEvent('flow:inline-comment-resolved', {
        detail: {
          commentId: id,
          userId: _utils_api__WEBPACK_IMPORTED_MODULE_5__.pageData.currentUserId
        }
      }));
    }
    window.dispatchEvent(new CustomEvent('flow:author-resubmit-activity', {
      detail: {
        userId: _utils_api__WEBPACK_IMPORTED_MODULE_5__.pageData.currentUserId,
        kind: 'comment_resolved'
      }
    }));
  }, [api]);
  const handleDelete = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async id => {
    if (!(await confirm({
      title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Delete this comment?', 'jumplinks-editorial-workflow'),
      message: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('This action cannot be undone.', 'jumplinks-editorial-workflow')
    }))) {
      return;
    }
    try {
      const deleted = comments.find(c => c.id === id);
      const syncInline = !!(deleted && (deleted.blockClientId || deleted.anchorText) && !deleted.parentId);
      await api.deleteComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
      if (syncInline) {
        window.dispatchEvent(new CustomEvent('flow:highlight-remove', {
          detail: {
            commentId: id
          }
        }));
      }
      if (deleted && (deleted.blockClientId || deleted.anchorText)) {
        window.dispatchEvent(new CustomEvent('flow:inline-comment-deleted', {
          detail: {
            id
          }
        }));
      }
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(err.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Failed to delete comment.', 'jumplinks-editorial-workflow'));
    }
  }, [comments, api, confirm]);
  const threads = threadFilter === 'resolved' ? resolvedThreads : activeThreads;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.Fragment, {
    children: [showEditor && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsxs)("div", {
      className: "flow-sidebar__body",
      children: [(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_4__.applyFilters)('flow_ew_comment_editor_extras', null, {}), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)(_CommentEditor__WEBPACK_IMPORTED_MODULE_8__["default"], {
        onSubmit: handleSubmit,
        clearDraftOnCancel: true
      })]
    }), threads.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)("div", {
      className: "flow-comment-threads",
      children: [...threads].reverse().map(thread => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)(_CommentThread__WEBPACK_IMPORTED_MODULE_9__["default"], {
        thread: thread,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onReply: handleReply,
        onResolve: handleResolve
      }, thread.id))
    }), confirmDialog]
  });
}

/**
 * @param {object} [props]
 * @param {'review'|'site-review'} [props.mode]
 *   `'review'` (default): per-post chrome. Renders the Comments + Resolved
 *   tabs.
 *   `'site-review'`: same tab layout but the decision-action footer is
 *   suppressed (Send Feedback / Exit Review live in the bar instead).
 * @param {{
 *   postComment: Function,
 *   updateComment: Function,
 *   deleteComment: Function,
 * }} [props.api]
 *   Backend adapter for comment mutations. Defaults to the single-post
 *   review namespace (`flow/v1/reviews/{id}/comments`). Pro's site-review
 *   chrome passes an adapter that targets the `flow-pro/v1/site-reviews/`
 *   namespace.
 * @param {React.ReactNode} [props.reviewIntro]
 *   Optional node rendered at the top of the Comments tab, above the
 *   general-comments editor. Site-review uses this to show the
 *   requester's "message to reviewer" callout so it's the first thing
 *   the reviewer reads when the chrome opens.
 */
function CommentSidebar({
  mode = 'review',
  api = _utils_comment_api__WEBPACK_IMPORTED_MODULE_6__.defaultCommentApi,
  reviewIntro = null
} = {}) {
  const hostRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const [generalComments, setGeneralComments] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => _utils_api__WEBPACK_IMPORTED_MODULE_5__.pageData.comments || []);
  const [inlineComments, setInlineComments] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => _utils_api__WEBPACK_IMPORTED_MODULE_5__.pageData.inlineComments || []);
  const pendingInlineResolvedRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(new Set());
  const [activeTab, setActiveTab] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(readStoredActiveTab);
  const [reviewUnresolved, setReviewUnresolved] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => (0,_utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_7__.countUnresolvedCommentThreads)(_utils_api__WEBPACK_IMPORTED_MODULE_5__.pageData.comments || []));
  const [inlineUnresolved, setInlineUnresolved] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => (0,_utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_7__.countUnresolvedCommentThreads)(_utils_api__WEBPACK_IMPORTED_MODULE_5__.pageData.inlineComments || []));
  const [reviewResolved, setReviewResolved] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => (0,_utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_7__.countResolvedCommentThreads)(_utils_api__WEBPACK_IMPORTED_MODULE_5__.pageData.comments || []));
  const [inlineResolved, setInlineResolved] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => (0,_utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_7__.countResolvedCommentThreads)(_utils_api__WEBPACK_IMPORTED_MODULE_5__.pageData.inlineComments || []));
  const commentsUnresolved = reviewUnresolved + inlineUnresolved;
  const commentsResolved = reviewResolved + inlineResolved;
  const generalResolvedCount = (0,_utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_7__.countResolvedCommentThreads)(generalComments);
  const generalUnresolvedCount = (0,_utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_7__.countUnresolvedCommentThreads)(generalComments);
  const inlineResolvedCount = (0,_utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_7__.countResolvedCommentThreads)(inlineComments);
  const inlineUnresolvedCount = (0,_utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_7__.countUnresolvedCommentThreads)(inlineComments);
  const showCommentsDelimiter = generalUnresolvedCount > 0 && inlineUnresolvedCount > 0;
  const showResolvedDelimiter = generalResolvedCount > 0 && inlineResolvedCount > 0;
  const closeSidebar = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    window.dispatchEvent(new CustomEvent('flow:comments-sidebar-toggle', {
      detail: {
        open: false
      }
    }));
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    sessionStorage.setItem('flow_active_tab', activeTab);
  }, [activeTab]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    window.dispatchEvent(new CustomEvent('flow:comment-count', {
      detail: {
        total: generalComments.length,
        unresolved: (0,_utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_7__.countUnresolvedCommentThreads)(generalComments),
        resolved: (0,_utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_7__.countResolvedCommentThreads)(generalComments)
      }
    }));
  }, [generalComments]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    window.dispatchEvent(new CustomEvent('flow:inline-comment-stats', {
      detail: {
        total: inlineComments.length,
        unresolved: (0,_utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_7__.countUnresolvedCommentThreads)(inlineComments),
        resolved: (0,_utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_7__.countResolvedCommentThreads)(inlineComments)
      }
    }));
  }, [inlineComments]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const onAdded = e => {
      const {
        comment
      } = e.detail || {};
      if (!comment) {
        return;
      }
      const cid = Number(comment.id);
      const forceResolved = pendingInlineResolvedRef.current.has(cid);
      if (forceResolved) {
        pendingInlineResolvedRef.current.delete(cid);
      }
      setInlineComments(prev => {
        if (prev.some(c => Number(c.id) === cid)) {
          return prev;
        }
        return [...prev, {
          ...comment,
          isResolved: forceResolved || !!comment.isResolved
        }];
      });
    };
    const onResolved = e => {
      const cid = Number(e.detail?.commentId);
      if (!cid) {
        return;
      }
      setInlineComments(prev => {
        const has = prev.some(c => Number(c.id) === cid);
        if (!has) {
          pendingInlineResolvedRef.current.add(cid);
          return prev;
        }
        pendingInlineResolvedRef.current.delete(cid);
        return prev.map(c => Number(c.id) === cid ? {
          ...c,
          isResolved: true
        } : c);
      });
    };
    const onReset = e => {
      const next = e.detail?.comments;
      if (Array.isArray(next)) {
        pendingInlineResolvedRef.current.clear();
        setInlineComments(next);
      }
    };
    window.addEventListener('flow:inline-comment-added', onAdded);
    window.addEventListener('flow:inline-comment-resolved', onResolved);
    window.addEventListener('flow:inline-comments-reset', onReset);
    return () => {
      window.removeEventListener('flow:inline-comment-added', onAdded);
      window.removeEventListener('flow:inline-comment-resolved', onResolved);
      window.removeEventListener('flow:inline-comments-reset', onReset);
    };
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const host = document.getElementById('flow-sidebar-host') || hostRef.current?.getRootNode()?.host;
    if (!host) {
      return undefined;
    }
    const startOpen = window.innerWidth >= 782;
    host.setAttribute('data-open', startOpen ? 'true' : 'false');
    document.body.classList.toggle('flow-review-page--comments-closed', !startOpen);
    const onToggle = e => {
      if (typeof e.detail?.open !== 'boolean') {
        return;
      }
      const open = e.detail.open;
      host.setAttribute('data-open', open ? 'true' : 'false');
      document.body.classList.toggle('flow-review-page--comments-closed', !open);
    };
    window.addEventListener('flow:comments-sidebar-toggle', onToggle);
    return () => window.removeEventListener('flow:comments-sidebar-toggle', onToggle);
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const onSwitchToComments = () => setActiveTab('comments');
    window.addEventListener('flow:inline-comment-added', onSwitchToComments);
    window.addEventListener('flow:inline-comment-focus', onSwitchToComments);
    return () => {
      window.removeEventListener('flow:inline-comment-added', onSwitchToComments);
      window.removeEventListener('flow:inline-comment-focus', onSwitchToComments);
    };
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const onGeneral = e => {
      const d = e.detail;
      if (typeof d === 'object' && d !== null && 'unresolved' in d) {
        setReviewUnresolved(Number(d.unresolved) || 0);
      }
      if (typeof d === 'object' && d !== null && 'resolved' in d) {
        setReviewResolved(Number(d.resolved) || 0);
      }
    };
    const onInline = e => {
      const d = e.detail;
      if (typeof d === 'object' && d !== null && 'unresolved' in d) {
        setInlineUnresolved(Number(d.unresolved) || 0);
      }
      if (typeof d === 'object' && d !== null && 'resolved' in d) {
        setInlineResolved(Number(d.resolved) || 0);
      }
    };
    window.addEventListener('flow:comment-count', onGeneral);
    window.addEventListener('flow:inline-comment-stats', onInline);
    return () => {
      window.removeEventListener('flow:comment-count', onGeneral);
      window.removeEventListener('flow:inline-comment-stats', onInline);
    };
  }, []);
  const tabsList = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)("div", {
    className: "flow-sidebar__tabs",
    role: "tablist",
    children: SIDEBAR_TABS.map(tab => {
      const count = tab.name === 'comments' ? commentsUnresolved : commentsResolved;
      const countClass = tab.name === 'comments' ? 'flow-sidebar__tab-count--comments' : 'flow-sidebar__tab-count--resolved';
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsxs)("button", {
        type: "button",
        role: "tab",
        "aria-selected": activeTab === tab.name,
        className: `flow-sidebar__tab${activeTab === tab.name ? ' flow-sidebar__tab--active' : ''}`,
        onClick: () => setActiveTab(tab.name),
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)("span", {
          className: "flow-sidebar__tab-label",
          children: tab.title
        }), count > 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)("span", {
          className: `flow-sidebar__tab-count ${countClass}`,
          "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.sprintf)(tab.name === 'comments' ? /* translators: %d: number of unresolved comment threads */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Unresolved comment threads: %d', 'jumplinks-editorial-workflow') : /* translators: %d: number of resolved comment threads */
          (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Resolved comment threads: %d', 'jumplinks-editorial-workflow'), count),
          children: count
        }) : null]
      }, tab.name);
    })
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)("div", {
    className: "flow-sidebar",
    ref: hostRef,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsxs)("div", {
      className: "flow-sidebar__tablist-and-close",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsxs)("div", {
        className: "flow-sidebar__header",
        children: [tabsList, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
          className: "flow-sidebar__header-close",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Close', 'jumplinks-editorial-workflow'),
          onClick: closeSidebar
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)("div", {
        className: "flow-sidebar__tab-panel",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsxs)("div", {
          className: "flow-sidebar__tab-scroll",
          role: "tabpanel",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsxs)("div", {
            className: "flow-sidebar__tab-content",
            style: activeTab !== 'comments' ? {
              display: 'none'
            } : undefined,
            children: [reviewIntro, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)(GeneralCommentsPanel, {
              api: api,
              comments: generalComments,
              setComments: setGeneralComments,
              showEditor: true,
              threadFilter: "active"
            }), showCommentsDelimiter ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)("div", {
              className: "flow-sidebar__section-divider",
              role: "separator",
              "aria-hidden": "true"
            }) : null, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)(_InlineCommentsPanel__WEBPACK_IMPORTED_MODULE_10__["default"], {
              api: api,
              comments: inlineComments,
              setComments: setInlineComments,
              threadFilter: "active",
              showEmptyState: true
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)("div", {
            className: "flow-sidebar__tab-content",
            style: activeTab !== 'resolved' ? {
              display: 'none'
            } : undefined,
            children: commentsResolved === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)("div", {
              className: "flow-sidebar__placeholder",
              children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('No resolved comments yet.', 'jumplinks-editorial-workflow')
            }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.Fragment, {
              children: [generalResolvedCount > 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)(GeneralCommentsPanel, {
                api: api,
                comments: generalComments,
                setComments: setGeneralComments,
                showEditor: false,
                threadFilter: "resolved"
              }) : null, showResolvedDelimiter ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)("div", {
                className: "flow-sidebar__section-divider",
                role: "separator",
                "aria-hidden": "true"
              }) : null, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_13__.jsx)(_InlineCommentsPanel__WEBPACK_IMPORTED_MODULE_10__["default"], {
                api: api,
                comments: inlineComments,
                setComments: setInlineComments,
                threadFilter: "resolved"
              })]
            })
          })]
        })
      })]
    })
  });
}

/***/ },

/***/ "./src/review-page/components/CommentThread.js"
/*!*****************************************************!*\
  !*** ./src/review-page/components/CommentThread.js ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ CommentThread)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _icons_comment_reply__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../icons/comment-reply */ "./src/review-page/icons/comment-reply.js");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _CommentCard__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./CommentCard */ "./src/review-page/components/CommentCard.js");
/* harmony import */ var _CommentEditor__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./CommentEditor */ "./src/review-page/components/CommentEditor.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__);







const COLLAPSED_REPLY_LIMIT = 1;
function CommentThread({
  thread,
  onEdit,
  onDelete,
  onReply,
  onResolve,
  suppressBodyExpandClick = false
}) {
  const replies = thread.replies || [];
  const [replyingTo, setReplyingTo] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [threadExpanded, setThreadExpanded] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const replyEditorRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const handleReply = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(parentId => {
    setReplyingTo(prev => prev === parentId ? null : parentId);
  }, []);
  const handleReplySubmit = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async html => {
    await onReply(replyingTo, html);
    setReplyingTo(null);
  }, [replyingTo, onReply]);
  const visibleReplies = threadExpanded ? replies : replies.slice(Math.max(0, replies.length - COLLAPSED_REPLY_LIMIT));
  const hiddenCount = Math.max(0, replies.length - COLLAPSED_REPLY_LIMIT);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!replyingTo || !replyEditorRef.current) {
      return;
    }

    // Wait for the editor to render and then bring action buttons into view.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const submitRow = replyEditorRef.current?.querySelector('.flow-comment-editor__submit-row');
        const target = submitRow || replyEditorRef.current;
        const scroller = target.closest('.components-tab-panel__tab-content');
        if (!scroller) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest'
          });
          return;
        }
        const scrollerRect = scroller.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const desiredBottom = scrollerRect.bottom - 10;
        const delta = targetRect.bottom - desiredBottom;
        if (delta > 0) {
          scroller.scrollBy({
            top: delta,
            behavior: 'smooth'
          });
        }
      });
    });
  }, [replyingTo]);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
    className: `flow-comment-thread${thread.isResolved ? ' flow-comment-thread--resolved' : ''}`,
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_CommentCard__WEBPACK_IMPORTED_MODULE_4__["default"], {
      comment: thread,
      onEdit: onEdit,
      onDelete: onDelete,
      onResolve: onResolve,
      showResolveInActions: true,
      isThreadExpanded: threadExpanded,
      canTriggerExpand: !suppressBodyExpandClick,
      canCollapseThread: true,
      onRequestExpand: () => setThreadExpanded(true),
      onRequestCollapse: () => setThreadExpanded(false)
    }), replies.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsxs)("div", {
      className: "flow-comment-thread__replies",
      children: [!threadExpanded && hiddenCount > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("button", {
        type: "button",
        className: "flow-comment-thread__toggle",
        onClick: () => setThreadExpanded(true),
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.sprintf)(/* translators: %d: number of hidden replies */
        (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('%d more replies', 'jumplinks-editorial-workflow'), hiddenCount)
      }), visibleReplies.map(reply => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_CommentCard__WEBPACK_IMPORTED_MODULE_4__["default"], {
        comment: reply,
        onEdit: onEdit,
        onDelete: onDelete,
        isThreadExpanded: threadExpanded,
        isReply: true
      }, reply.id))]
    }), onResolve && !thread.isResolved && !replyingTo && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
      className: "flow-comment-thread__resolve-row",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
        className: "flow-btn--text flow-comment-thread__reply-btn",
        icon: _icons_comment_reply__WEBPACK_IMPORTED_MODULE_2__["default"],
        onClick: () => handleReply(thread.id),
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Reply', 'jumplinks-editorial-workflow')
      })
    }), replyingTo && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)("div", {
      className: "flow-comment-thread__reply-editor",
      ref: replyEditorRef,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_6__.jsx)(_CommentEditor__WEBPACK_IMPORTED_MODULE_5__["default"], {
        autoFocus: true,
        onSubmit: handleReplySubmit,
        onCancel: () => setReplyingTo(null),
        submitLabel: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Reply', 'jumplinks-editorial-workflow')
      })
    })]
  });
}

/***/ },

/***/ "./src/review-page/components/ConfirmDialog.js"
/*!*****************************************************!*\
  !*** ./src/review-page/components/ConfirmDialog.js ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ConfirmDialog)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _icons_alert_error__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../icons/alert-error */ "./src/review-page/icons/alert-error.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__);





function ConfirmDialog({
  title,
  message,
  confirmLabel = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Delete', 'jumplinks-editorial-workflow'),
  cancelLabel = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Cancel', 'jumplinks-editorial-workflow'),
  onConfirm,
  onCancel
}) {
  const confirmRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    confirmRef.current?.focus();
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
    className: "flow-confirm-dialog",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("button", {
      type: "button",
      className: "flow-confirm-dialog__backdrop",
      "aria-label": cancelLabel,
      onClick: onCancel
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
      className: "flow-confirm-dialog__panel",
      role: "alertdialog",
      "aria-modal": "true",
      "aria-labelledby": "flow-confirm-dialog-title",
      "aria-describedby": message ? 'flow-confirm-dialog-message' : undefined,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
        className: "flow-confirm-dialog__alert",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("span", {
          className: "flow-confirm-dialog__icon",
          "aria-hidden": "true",
          children: _icons_alert_error__WEBPACK_IMPORTED_MODULE_3__["default"]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
          className: "flow-confirm-dialog__content",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
            id: "flow-confirm-dialog-title",
            className: "flow-confirm-dialog__title",
            children: title
          }), message ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)("p", {
            id: "flow-confirm-dialog-message",
            className: "flow-confirm-dialog__message",
            children: message
          }) : null]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsxs)("div", {
        className: "flow-confirm-dialog__actions",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          className: "flow-btn--cancel",
          onClick: onCancel,
          children: cancelLabel
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          ref: confirmRef,
          className: "flow-confirm-dialog__confirm",
          onClick: onConfirm,
          children: confirmLabel
        })]
      })]
    })]
  });
}

/***/ },

/***/ "./src/review-page/components/InlineCommentPopover.js"
/*!************************************************************!*\
  !*** ./src/review-page/components/InlineCommentPopover.js ***!
  \************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ InlineCommentPopover)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _icons_comment_reply__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../icons/comment-reply */ "./src/review-page/icons/comment-reply.js");
/* harmony import */ var _utils_text_anchor__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/text-anchor */ "./src/review-page/utils/text-anchor.js");
/* harmony import */ var _utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/iframe-bridge */ "./src/review-page/utils/iframe-bridge.js");
/* harmony import */ var _utils_dom_helpers__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/dom-helpers */ "./src/review-page/utils/dom-helpers.js");
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/api */ "./src/review-page/utils/api.js");
/* harmony import */ var _utils_comment_api__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/comment-api */ "./src/review-page/utils/comment-api.js");
/* harmony import */ var _CommentEditor__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./CommentEditor */ "./src/review-page/components/CommentEditor.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__);











function rangeTouchesReviewInfoNotice(range, doc) {
  const notice = doc.querySelector('.flow-review-info-notice');
  if (!notice) return false;
  return notice.contains(range.startContainer) || notice.contains(range.endContainer);
}

/**
 * @param {object} [props]
 * @param {{ postComment: Function, updateComment: Function }} [props.api]
 *   Backend adapter. Defaults to the single-post review namespace
 *   (`flow/v1/reviews/{id}/comments`). The site-review chrome (Pro) passes
 *   its own adapter that targets `flow-pro/v1/site-reviews/{id}/comments`.
 * @param {string} [props.mode] Optional mode tag; carried through unchanged
 *   for downstream code that wants to vary copy/behaviour. Defaults to
 *   `'review'`.
 */
function InlineCommentPopover({
  api = _utils_comment_api__WEBPACK_IMPORTED_MODULE_8__.defaultCommentApi,
  mode = 'review'
} = {}) {
  const [position, setPosition] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [editorOpen, setEditorOpen] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const editorOpenRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(false);
  const rangeRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const descriptorRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const popoverRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const iframeLocalRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const getViewportBounds = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    const PAD = 12;
    let minLeft = PAD;
    let maxRight = window.innerWidth - PAD;
    if (document.body.classList.contains('flow-review-page--activity-open')) {
      const activityHost = document.getElementById('flow-pro-activity-host');
      const activityRight = activityHost?.getBoundingClientRect?.().right || 0;
      if (activityRight > 0) {
        minLeft = Math.max(minLeft, activityRight + PAD);
      }
    }

    // Comments sidebar lives on the RIGHT — its left edge bounds the
    // popover from drifting underneath the sidebar.
    const isCommentsClosed = document.body.classList.contains('flow-review-page--comments-closed');
    if (!isCommentsClosed) {
      const sidebarHost = document.getElementById('flow-sidebar-host');
      const sidebarLeft = sidebarHost?.getBoundingClientRect?.().left;
      if (typeof sidebarLeft === 'number' && sidebarLeft > 0) {
        maxRight = Math.min(maxRight, sidebarLeft - PAD);
      }
    }
    return {
      minLeft,
      maxRight
    };
  }, []);
  const clampLeftToViewport = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((left, fallbackWidth) => {
    const width = popoverRef.current?.offsetWidth || fallbackWidth;
    const {
      minLeft,
      maxRight
    } = getViewportBounds();
    const maxLeft = Math.max(minLeft, maxRight - width);
    return Math.max(minLeft, Math.min(left, maxLeft));
  }, [getViewportBounds]);
  const clampTopToViewport = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((top, fallbackHeight) => {
    const height = popoverRef.current?.offsetHeight || fallbackHeight;
    const PAD = 8;
    const half = height / 2;
    const minTop = PAD + half;
    const maxTop = window.innerHeight - PAD - half;
    if (maxTop < minTop) {
      return Math.max(PAD + half, window.innerHeight / 2);
    }
    return Math.max(minTop, Math.min(top, maxTop));
  }, []);
  const positionNearRect = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((rect, sourceWindow, openEditor = false) => {
    const iframe = iframeLocalRef.current;
    const isInIframe = sourceWindow !== window && iframe;
    const GAP = 12;
    const reserveRight = openEditor ? 400 : 220;
    const reserveHeight = openEditor ? 320 : 60;
    let centerY;
    let leftX;
    if (isInIframe) {
      const iframeRect = iframe.getBoundingClientRect();
      // rect lives in iframe-internal coords; the iframe is visually
      // transform-scaled so multiply before adding the parent offset.
      const s = (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.getIframeScale)();
      centerY = iframeRect.top + rect.top * s + rect.height * s / 2;
      leftX = iframeRect.left + rect.right * s + GAP;
    } else {
      centerY = rect.top + rect.height / 2;
      leftX = rect.right + GAP;
    }
    leftX = clampLeftToViewport(leftX, reserveRight);
    centerY = clampTopToViewport(centerY, reserveHeight);
    setPosition({
      top: centerY,
      left: leftX
    });
    if (openEditor) {
      setEditorOpen(true);
      editorOpenRef.current = true;
    }
  }, [clampLeftToViewport, clampTopToViewport]);
  const handleMouseUp = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(e => {
    if (editorOpenRef.current) return;
    if ((0,_utils_dom_helpers__WEBPACK_IMPORTED_MODULE_6__.eventHitsShadowNode)(e, popoverRef.current)) {
      return;
    }
    const sourceWindow = e?.view || window;
    const mediaTarget = e?.target?.closest?.('img,video,.flow-embed-overlay');
    if (mediaTarget && (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.resolveContentRootFor)(sourceWindow.document, mediaTarget)) {
      return;
    }
    requestAnimationFrame(() => {
      if (editorOpenRef.current) return;
      const selection = sourceWindow.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setPosition(null);
        rangeRef.current = null;
        descriptorRef.current = null;
        return;
      }
      const range = selection.getRangeAt(0);
      const contentRoot = (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.resolveContentRootFor)(sourceWindow.document, range.startContainer);
      if (!contentRoot) {
        setPosition(null);
        rangeRef.current = null;
        descriptorRef.current = null;
        return;
      }
      if (rangeTouchesReviewInfoNotice(range, sourceWindow.document)) {
        setPosition(null);
        rangeRef.current = null;
        descriptorRef.current = null;
        sourceWindow.getSelection()?.removeAllRanges();
        return;
      }
      const rect = range.getBoundingClientRect();
      rangeRef.current = range.cloneRange();
      descriptorRef.current = null;
      positionNearRect(rect, sourceWindow);
    });
  }, [positionNearRect]);
  const handleMediaClick = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(e => {
    if (editorOpenRef.current) return;

    // Play / Go-to-link pills own their clicks; don't steal them here.
    if (e.target.closest?.('.flow-embed-overlay__play-pill, .flow-embed-overlay__link-pill')) {
      return;
    }
    const sourceWindow = e?.view || window;
    if (e.target.closest?.('.flow-review-info-notice')) {
      return;
    }
    const overlay = e.target.closest?.('.flow-embed-overlay');
    let media = overlay ? overlay.flowMedia || overlay.parentElement?.querySelector('img, video, iframe') || null : e.target.closest?.('img,video');
    if (!media) return;

    // Resolve against the media node so a `.entry-content` (e.g. one of
    // WooCommerce's tab panels) other than the "longest" is still accepted.
    const contentRoot = (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.resolveContentRootFor)(sourceWindow.document, media);
    if (!contentRoot) return;

    // Existing media highlights open the thread; still swallow the event so
    // theme lightbox / custom `[data-*-video="open"]` handlers don't fire.
    if (media.classList?.contains('flow-inline-highlight-media') || media.closest?.('.flow-inline-highlight')) {
      e.preventDefault?.();
      e.stopPropagation?.();
      const ids = (media.dataset.commentIds || '').split(' ').map(Number).filter(Boolean);
      const commentId = Number(media.dataset.commentId) || ids[ids.length - 1] || 0;
      if (commentId) {
        window.dispatchEvent(new CustomEvent('flow:inline-comment-focus', {
          detail: {
            commentId
          }
        }));
      }
      return;
    }

    // Capture-phase + stopPropagation: theme scripts often register a
    // document bubble listener (e.g. Jumplinks demo video modal via
    // `[data-jumplinks-video="open"]`) that would otherwise open a popin
    // before our bubble handler can claim the click.
    e.preventDefault?.();
    e.stopPropagation?.();
    const range = sourceWindow.document.createRange();
    range.selectNode(media);
    rangeRef.current = range;
    const tag = media.tagName;
    const isVideo = tag === 'VIDEO';
    const isEmbed = tag === 'IFRAME';
    const label = media.getAttribute('alt')?.trim() || media.getAttribute('title')?.trim() || (isVideo ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Video', 'jumplinks-editorial-workflow') : isEmbed ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Embed', 'jumplinks-editorial-workflow') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Image', 'jumplinks-editorial-workflow'));
    descriptorRef.current = (0,_utils_text_anchor__WEBPACK_IMPORTED_MODULE_4__.serializeMediaAnchor)(media, label);

    // Media (img/video/iframe) are clicked through their `.flow-embed-overlay`
    const rect = media.getBoundingClientRect();
    positionNearRect(rect, sourceWindow, true);
  }, [positionNearRect]);
  const handleMouseDown = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(e => {
    if ((0,_utils_dom_helpers__WEBPACK_IMPORTED_MODULE_6__.eventHitsShadowNode)(e, popoverRef.current)) {
      return;
    }
    if ((0,_utils_dom_helpers__WEBPACK_IMPORTED_MODULE_6__.eventInsidePortalUI)(e)) {
      return;
    }
    if (editorOpenRef.current) {
      setPosition(null);
      setEditorOpen(false);
      editorOpenRef.current = false;
      rangeRef.current = null;
      descriptorRef.current = null;
      return;
    }
    setPosition(null);
    rangeRef.current = null;
    descriptorRef.current = null;
  }, []);

  // Show the popover from whatever selection is currently committed to JS.
  const showPopoverFromCurrentSelection = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(sourceWindow => {
    if (editorOpenRef.current) return;
    const selection = sourceWindow.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      return;
    }
    const range = selection.getRangeAt(0);
    const contentRoot = (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.resolveContentRootFor)(sourceWindow.document, range.startContainer);
    if (!contentRoot) {
      return;
    }
    if (rangeTouchesReviewInfoNotice(range, sourceWindow.document)) {
      sourceWindow.getSelection()?.removeAllRanges();
      return;
    }
    const rect = range.getBoundingClientRect();
    rangeRef.current = range.cloneRange();
    descriptorRef.current = null;
    positionNearRect(rect, sourceWindow);
  }, [positionNearRect]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    // Capture so we beat theme document bubble listeners (video lightboxes).
    document.addEventListener('click', handleMediaClick, true);
    document.addEventListener('touchend', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('click', handleMediaClick, true);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseUp, handleMouseDown, handleMediaClick]);

  // Debounced `selectionchange` is the primary signal on touch devices.
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    let timer = null;
    const SETTLE_MS = 200;
    const settle = sourceWindow => {
      if (editorOpenRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        showPopoverFromCurrentSelection(sourceWindow);
      }, SETTLE_MS);
    };
    const onParentSelChange = () => settle(window);
    document.addEventListener('selectionchange', onParentSelChange);
    let attachedDoc = null;
    let onIframeSelChange = null;
    const attachIframe = iframe => {
      if (!iframe) return;
      let doc = null;
      try {
        doc = iframe.contentDocument || iframe.contentWindow?.document || null;
      } catch {
        return;
      }
      if (!doc) return;
      if (attachedDoc && onIframeSelChange) {
        try {
          attachedDoc.removeEventListener('selectionchange', onIframeSelChange);
        } catch {}
      }
      const sw = iframe.contentWindow;
      onIframeSelChange = () => settle(sw);
      doc.addEventListener('selectionchange', onIframeSelChange);
      attachedDoc = doc;
    };
    const detachIframe = () => {
      if (attachedDoc && onIframeSelChange) {
        try {
          attachedDoc.removeEventListener('selectionchange', onIframeSelChange);
        } catch {
          // already detached
        }
      }
      attachedDoc = null;
      onIframeSelChange = null;
    };
    const onIframeReady = e => attachIframe(e.detail?.iframe);
    const onIframeRemoved = () => detachIframe();
    attachIframe((0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.getIframe)());
    window.addEventListener('flow:iframe-ready', onIframeReady);
    window.addEventListener('flow:iframe-removed', onIframeRemoved);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('selectionchange', onParentSelChange);
      window.removeEventListener('flow:iframe-ready', onIframeReady);
      window.removeEventListener('flow:iframe-removed', onIframeRemoved);
      detachIframe();
    };
  }, [showPopoverFromCurrentSelection]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const attachIframe = iframe => {
      if (!iframe) return;
      let doc = null;
      try {
        doc = iframe.contentDocument || iframe.contentWindow?.document || null;
      } catch (err) {
        // Cross-origin iframe — can't access contentDocument. Surface
        // it so customer-site debug sessions actually see why inline
        // comments stopped working.
        // eslint-disable-next-line no-console
        console.warn('[Flow] Review iframe is cross-origin — inline comment popover disabled. Check that the parent and iframe URLs share the same protocol + host.', err);
        return;
      }
      if (!doc) return;
      iframeLocalRef.current = iframe;
      doc.addEventListener('mouseup', handleMouseUp);
      doc.addEventListener('mousedown', handleMouseDown);
      doc.addEventListener('click', handleMediaClick, true);
      doc.addEventListener('touchend', handleMouseUp);
    };
    const detachIframe = iframe => {
      try {
        iframe?.contentDocument?.removeEventListener('mouseup', handleMouseUp);
        iframe?.contentDocument?.removeEventListener('mousedown', handleMouseDown);
        iframe?.contentDocument?.removeEventListener('click', handleMediaClick, true);
        iframe?.contentDocument?.removeEventListener('touchend', handleMouseUp);
      } catch {}
    };
    const onIframeReady = e => {
      attachIframe(e.detail?.iframe);
    };
    const onIframeRemoved = () => {
      setPosition(null);
      setEditorOpen(false);
      editorOpenRef.current = false;
      rangeRef.current = null;
      descriptorRef.current = null;
      detachIframe(iframeLocalRef.current || (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.getIframe)());
      iframeLocalRef.current = null;
    };
    attachIframe((0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.getIframe)());
    window.addEventListener('flow:iframe-ready', onIframeReady);
    window.addEventListener('flow:iframe-removed', onIframeRemoved);
    return () => {
      window.removeEventListener('flow:iframe-ready', onIframeReady);
      window.removeEventListener('flow:iframe-removed', onIframeRemoved);
      detachIframe(iframeLocalRef.current || (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.getIframe)());
      iframeLocalRef.current = null;
      setPosition(null);
      setEditorOpen(false);
      editorOpenRef.current = false;
      rangeRef.current = null;
      descriptorRef.current = null;
    };
  }, [handleMouseUp, handleMouseDown, handleMediaClick]);
  const handleOpenEditor = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    const range = rangeRef.current;
    if (!range) return;
    const rangeDoc = range.startContainer.ownerDocument || document;
    if (rangeTouchesReviewInfoNotice(range, rangeDoc)) {
      return;
    }
    let descriptor = descriptorRef.current || (range.startContainer.nodeType === Node.ELEMENT_NODE && ['IMG', 'VIDEO'].includes(range.startContainer.tagName) ? (0,_utils_text_anchor__WEBPACK_IMPORTED_MODULE_4__.serializeMediaAnchor)(range.startContainer, range.startContainer.getAttribute('alt')?.trim() || (range.startContainer.tagName === 'VIDEO' ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Video', 'jumplinks-editorial-workflow') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Image', 'jumplinks-editorial-workflow'))) : (0,_utils_text_anchor__WEBPACK_IMPORTED_MODULE_4__.serializeRange)(range));
    if (!descriptor) return;
    descriptorRef.current = descriptor;
    editorOpenRef.current = true;
    const rect = range.getBoundingClientRect();
    const iframe = iframeLocalRef.current;
    const isInIframe = iframe && rangeDoc !== document;
    const GAP = 12;
    const reserveRight = 400;
    const reserveHeight = 320;
    let centerY;
    let leftX;
    if (isInIframe) {
      const iframeRect = iframe.getBoundingClientRect();
      // rect lives in iframe-internal coords; the iframe is visually
      // transform-scaled so multiply before adding the parent offset.
      const s = (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.getIframeScale)();
      centerY = iframeRect.top + rect.top * s + rect.height * s / 2;
      leftX = iframeRect.left + rect.right * s + GAP;
    } else {
      centerY = rect.top + rect.height / 2;
      leftX = rect.right + GAP;
    }
    leftX = clampLeftToViewport(leftX, reserveRight);
    centerY = clampTopToViewport(centerY, reserveHeight);
    setPosition({
      top: centerY,
      left: leftX
    });
    setEditorOpen(true);
    const sourceWindow = rangeDoc.defaultView || window;
    sourceWindow.getSelection()?.removeAllRanges();
  }, [clampLeftToViewport, clampTopToViewport]);
  const handleSubmit = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async html => {
    const descriptor = descriptorRef.current;
    if (!descriptor) return;
    const comment = await api.postComment({
      html,
      anchorText: descriptor.text || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Image', 'jumplinks-editorial-workflow'),
      blockClientId: JSON.stringify(descriptor)
    });
    window.dispatchEvent(new CustomEvent('flow:highlight-add', {
      detail: {
        commentId: comment.id,
        rangeDescriptor: descriptor
      }
    }));
    window.dispatchEvent(new CustomEvent('flow:inline-comment-added', {
      detail: {
        comment
      }
    }));
    setPosition(null);
    setEditorOpen(false);
    editorOpenRef.current = false;
    rangeRef.current = null;
    descriptorRef.current = null;
  }, [api]);
  const handleCancel = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    setPosition(null);
    setEditorOpen(false);
    editorOpenRef.current = false;
    rangeRef.current = null;
    descriptorRef.current = null;
  }, []);
  const repositionPopover = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    if (!rangeRef.current) {
      return;
    }
    const range = rangeRef.current;
    const rangeDoc = range.startContainer?.ownerDocument || document;
    const rect = range.getBoundingClientRect();
    const iframe = iframeLocalRef.current;
    const isInIframe = iframe && rangeDoc !== document;
    const GAP = 12;
    const reserveRight = editorOpenRef.current ? 400 : 220;
    const reserveHeight = editorOpenRef.current ? 320 : 60;
    let centerY;
    let leftX;
    if (isInIframe) {
      const iframeRect = iframe.getBoundingClientRect();
      // rect lives in iframe-internal coords; the iframe is visually
      // transform-scaled so multiply before adding the parent offset.
      const s = (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.getIframeScale)();
      centerY = iframeRect.top + rect.top * s + rect.height * s / 2;
      leftX = iframeRect.left + rect.right * s + GAP;
    } else {
      centerY = rect.top + rect.height / 2;
      leftX = rect.right + GAP;
    }
    leftX = clampLeftToViewport(leftX, reserveRight);
    centerY = clampTopToViewport(centerY, reserveHeight);
    setPosition({
      top: centerY,
      left: leftX
    });
  }, [clampLeftToViewport, clampTopToViewport]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!position) {
      return undefined;
    }
    const onViewportChange = () => repositionPopover();
    const attachIframeScroll = iframe => {
      try {
        iframe?.contentWindow?.addEventListener('scroll', onViewportChange, true);
      } catch {
        // cross-origin safety
      }
    };
    const detachIframeScroll = iframe => {
      try {
        iframe?.contentWindow?.removeEventListener('scroll', onViewportChange, true);
      } catch {}
    };
    const onIframeReady = e => attachIframeScroll(e.detail?.iframe);
    const onIframeRemoved = () => detachIframeScroll((0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.getIframe)());
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('flow:iframe-ready', onIframeReady);
    window.addEventListener('flow:iframe-removed', onIframeRemoved);
    attachIframeScroll((0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.getIframe)());
    return () => {
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('flow:iframe-ready', onIframeReady);
      window.removeEventListener('flow:iframe-removed', onIframeRemoved);
      detachIframeScroll((0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_5__.getIframe)());
    };
  }, [position, repositionPopover]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!position) {
      return;
    }
    const fallbackWidth = editorOpen ? 400 : 220;
    const clampedLeft = clampLeftToViewport(position.left, fallbackWidth);
    if (Math.abs(clampedLeft - position.left) > 0.5) {
      setPosition(prev => prev ? {
        ...prev,
        left: clampedLeft
      } : prev);
    }
  }, [position, editorOpen, clampLeftToViewport]);
  if (!position) return null;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("div", {
    ref: popoverRef,
    className: `flow-inline-popover${editorOpen ? ' flow-inline-popover--editor' : ''}`,
    style: {
      position: 'fixed',
      top: `${position.top}px`,
      left: `${position.left}px`,
      transform: 'translateY(-50%)',
      zIndex: 1_000_001
    },
    children: editorOpen ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
      className: "flow-inline-popover__editor-wrap",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("div", {
        className: "flow-inline-popover__anchor-label",
        children: ["\u201C", descriptorRef.current?.text?.length > 60 ? descriptorRef.current.text.slice(0, 60) + '\u2026' : descriptorRef.current?.text, "\u201D"]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_CommentEditor__WEBPACK_IMPORTED_MODULE_9__["default"], {
        autoFocus: true,
        onSubmit: handleSubmit,
        onCancel: handleCancel,
        submitLabel: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Add Comment', 'jumplinks-editorial-workflow')
      })]
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsxs)("button", {
      type: "button",
      className: "flow-inline-popover__btn",
      onClick: handleOpenEditor,
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_2__.Icon, {
        icon: _icons_comment_reply__WEBPACK_IMPORTED_MODULE_3__["default"],
        className: "flow-inline-popover__btn-icon"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_10__.jsx)("span", {
        className: "flow-inline-popover__btn-label",
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Add Comment', 'jumplinks-editorial-workflow')
      })]
    })
  });
}

/***/ },

/***/ "./src/review-page/components/InlineCommentsPanel.js"
/*!***********************************************************!*\
  !*** ./src/review-page/components/InlineCommentsPanel.js ***!
  \***********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ InlineCommentsPanel)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/comment.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/api */ "./src/review-page/utils/api.js");
/* harmony import */ var _utils_comment_api__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/comment-api */ "./src/review-page/utils/comment-api.js");
/* harmony import */ var _CommentThread__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./CommentThread */ "./src/review-page/components/CommentThread.js");
/* harmony import */ var _utils_comment_tree__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/comment-tree */ "./src/review-page/utils/comment-tree.js");
/* harmony import */ var _hooks_use_confirm_dialog__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../hooks/use-confirm-dialog */ "./src/review-page/hooks/use-confirm-dialog.js");
/* harmony import */ var _utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../utils/iframe-bridge */ "./src/review-page/utils/iframe-bridge.js");
/* harmony import */ var _utils_text_anchor__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../utils/text-anchor */ "./src/review-page/utils/text-anchor.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__);












/**
 * @param {object} [props]
 * @param {{
 *   postComment: Function,
 *   updateComment: Function,
 *   deleteComment: Function,
 * }} [props.api]
 *   Backend adapter. Defaults to Free's single-post review namespace.
 * @param {'active'|'resolved'} [props.threadFilter]
 * @param {boolean} [props.showEmptyState]
 *   When true and there are no inline threads at all, show the onboarding hint.
 * @param {Array} props.comments
 * @param {Function} props.setComments
 */

function InlineCommentsPanel({
  api = _utils_comment_api__WEBPACK_IMPORTED_MODULE_5__.defaultCommentApi,
  threadFilter = 'active',
  showEmptyState = false,
  comments,
  setComments
}) {
  const {
    confirm,
    confirmDialog
  } = (0,_hooks_use_confirm_dialog__WEBPACK_IMPORTED_MODULE_8__.useConfirmDialog)();
  const [outdatedMap, setOutdatedMap] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)({});
  const threadRefs = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)({});
  const tree = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => (0,_utils_comment_tree__WEBPACK_IMPORTED_MODULE_7__.buildCommentTree)(comments), [comments]);
  const {
    activeThreads,
    resolvedThreads
  } = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    const active = [];
    const resolved = [];
    for (const thread of tree) {
      (thread.isResolved ? resolved : active).push(thread);
    }
    return {
      activeThreads: active,
      resolvedThreads: resolved
    };
  }, [tree]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const recalcOutdated = () => {
      const doc = (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_9__.getIframeDoc)();
      if (!doc) {
        setOutdatedMap({});
        return;
      }
      const root = (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_9__.resolveCommentContentRoot)(doc);
      if (!root) {
        setOutdatedMap({});
        return;
      }
      const next = {};
      for (const c of comments) {
        if (c.parentId || !c.blockClientId) {
          continue;
        }
        try {
          const descriptor = JSON.parse(c.blockClientId);
          next[c.id] = !(0,_utils_text_anchor__WEBPACK_IMPORTED_MODULE_10__.deserializeRange)(descriptor, root);
        } catch {
          next[c.id] = true;
        }
      }
      setOutdatedMap(next);
    };
    recalcOutdated();
    window.addEventListener('flow:iframe-ready', recalcOutdated);
    window.addEventListener('flow:iframe-removed', recalcOutdated);
    window.addEventListener('flow:highlight-add', recalcOutdated);
    window.addEventListener('flow:highlight-remove', recalcOutdated);
    return () => {
      window.removeEventListener('flow:iframe-ready', recalcOutdated);
      window.removeEventListener('flow:iframe-removed', recalcOutdated);
      window.removeEventListener('flow:highlight-add', recalcOutdated);
      window.removeEventListener('flow:highlight-remove', recalcOutdated);
    };
  }, [comments]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const onFocus = e => {
      const {
        commentId
      } = e.detail || {};
      if (!commentId) {
        return;
      }
      const el = threadRefs.current[commentId];
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    };
    window.addEventListener('flow:inline-comment-focus', onFocus);
    return () => window.removeEventListener('flow:inline-comment-focus', onFocus);
  }, []);
  const handleReply = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (parentId, html) => {
    const comment = await api.postComment({
      html,
      parentId
    });
    setComments(prev => {
      const cid = Number(comment.id);
      if (prev.some(c => Number(c.id) === cid)) {
        return prev;
      }
      return [...prev, comment];
    });
    window.dispatchEvent(new CustomEvent('flow:inline-comment-added', {
      detail: {
        comment
      }
    }));
  }, [api, setComments]);
  const handleEdit = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (id, html) => {
    const nid = Number(id);
    await api.updateComment(id, {
      html
    });
    setComments(prev => prev.map(c => Number(c.id) === nid ? {
      ...c,
      html
    } : c));
    window.dispatchEvent(new CustomEvent('flow:inline-comment-updated', {
      detail: {
        id,
        html
      }
    }));
  }, [api, setComments]);
  const handleResolve = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async id => {
    const nid = Number(id);
    await api.updateComment(id, {
      resolved: true
    });
    setComments(prev => prev.map(c => Number(c.id) === nid ? {
      ...c,
      isResolved: true
    } : c));
    window.dispatchEvent(new CustomEvent('flow:highlight-resolve', {
      detail: {
        commentId: id
      }
    }));
    window.dispatchEvent(new CustomEvent('flow:inline-comment-resolved', {
      detail: {
        commentId: id,
        userId: _utils_api__WEBPACK_IMPORTED_MODULE_4__.pageData.currentUserId
      }
    }));
    window.dispatchEvent(new CustomEvent('flow:author-resubmit-activity', {
      detail: {
        userId: _utils_api__WEBPACK_IMPORTED_MODULE_4__.pageData.currentUserId,
        kind: 'comment_resolved'
      }
    }));
  }, [api, setComments]);
  const handleDelete = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async id => {
    const nid = Number(id);
    if (!(await confirm({
      title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Delete this comment?', 'jumplinks-editorial-workflow'),
      message: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('This action cannot be undone.', 'jumplinks-editorial-workflow')
    }))) {
      return;
    }
    try {
      await api.deleteComment(id);
      setComments(prev => {
        const deleted = prev.find(c => Number(c.id) === nid);
        if (deleted && !deleted.parentId) {
          window.dispatchEvent(new CustomEvent('flow:highlight-remove', {
            detail: {
              commentId: id
            }
          }));
        }
        return prev.filter(c => Number(c.id) !== nid);
      });
      window.dispatchEvent(new CustomEvent('flow:inline-comment-deleted', {
        detail: {
          id
        }
      }));
    } catch (err) {
      // eslint-disable-next-line no-alert
      window.alert(err.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Failed to delete comment.', 'jumplinks-editorial-workflow'));
    }
  }, [api, setComments, confirm]);
  const handleAnchorClick = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(commentId => {
    window.dispatchEvent(new CustomEvent('flow:scroll-to-highlight', {
      detail: {
        commentId
      }
    }));
  }, []);
  const handleThreadSurfaceClick = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((event, commentId) => {
    if (event.target.closest('button, a, input, textarea, select, [contenteditable="true"], .flow-comment-editor, .components-button, [role="menu"]')) {
      return;
    }
    handleAnchorClick(commentId);
  }, [handleAnchorClick]);
  const threads = threadFilter === 'resolved' ? resolvedThreads : activeThreads;
  if (showEmptyState && threadFilter === 'active' && activeThreads.length === 0 && resolvedThreads.length === 0) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)("div", {
      className: "flow-inline-comments-empty",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("div", {
        className: "flow-inline-comments-empty__icon-wrap",
        "aria-hidden": "true",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Icon, {
          icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
          size: 28
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("h3", {
        className: "flow-inline-comments-empty__title",
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('No inline comments yet', 'jumplinks-editorial-workflow')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("p", {
        className: "flow-inline-comments-empty__lead",
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Highlight text in the content preview, then choose "Add comment".', 'jumplinks-editorial-workflow')
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)("ul", {
        className: "flow-inline-comments-empty__list",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("li", {
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Comments are tied to the exact words or media you select.', 'jumplinks-editorial-workflow')
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("li", {
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Click an image or video in the article to comment on media.', 'jumplinks-editorial-workflow')
        })]
      })]
    });
  }
  const renderThread = thread => {
    const isOutdated = !!outdatedMap[thread.id];
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)("div", {
      className: isOutdated ? 'flow-inline-thread flow-inline-thread--outdated flow-inline-thread--navigable' : 'flow-inline-thread flow-inline-thread--navigable',
      ref: el => {
        threadRefs.current[thread.id] = el;
      },
      onClick: event => handleThreadSurfaceClick(event, thread.id),
      title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Scroll to highlighted text', 'jumplinks-editorial-workflow'),
      children: [thread.anchorText && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)("div", {
        className: ['flow-inline-anchor', isOutdated && 'flow-inline-anchor--outdated', thread.isResolved && 'flow-inline-anchor--resolved'].filter(Boolean).join(' '),
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)("span", {
          className: "flow-inline-anchor__text",
          children: ["\u201C", thread.anchorText.length > 80 ? thread.anchorText.slice(0, 80) + '\u2026' : thread.anchorText, "\u201D"]
        }), isOutdated && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("span", {
          className: "flow-inline-anchor__hint",
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_3__.__)('Potentially outdated comment.', 'jumplinks-editorial-workflow')
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)(_CommentThread__WEBPACK_IMPORTED_MODULE_6__["default"], {
        thread: thread,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onReply: handleReply,
        onResolve: handleResolve,
        suppressBodyExpandClick: true
      })]
    }, thread.id);
  };
  if (threads.length === 0) {
    return confirmDialog;
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.Fragment, {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_11__.jsx)("div", {
      className: "flow-comment-threads",
      children: [...threads].reverse().map(renderThread)
    }), confirmDialog]
  });
}

/***/ },

/***/ "./src/review-page/components/InlineThreadPopover.js"
/*!***********************************************************!*\
  !*** ./src/review-page/components/InlineThreadPopover.js ***!
  \***********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ InlineThreadPopover)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/close-small.mjs");
/* harmony import */ var _icons_comment_reply__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../icons/comment-reply */ "./src/review-page/icons/comment-reply.js");
/* harmony import */ var _icons_comment_resolve__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../icons/comment-resolve */ "./src/review-page/icons/comment-resolve.js");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _utils_dom_helpers__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/dom-helpers */ "./src/review-page/utils/dom-helpers.js");
/* harmony import */ var _utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/iframe-bridge */ "./src/review-page/utils/iframe-bridge.js");
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/api */ "./src/review-page/utils/api.js");
/* harmony import */ var _utils_comment_api__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../utils/comment-api */ "./src/review-page/utils/comment-api.js");
/* harmony import */ var _CommentEditor__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./CommentEditor */ "./src/review-page/components/CommentEditor.js");
/* harmony import */ var _utils_comment_tree__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../utils/comment-tree */ "./src/review-page/utils/comment-tree.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__);













const HIGHLIGHT_CLASS = 'flow-inline-highlight';
const MEDIA_HIGHLIGHT_CLASS = 'flow-inline-highlight-media';
function getInitials(name) {
  if (!name) {
    return '?';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function CommentAuthorRow({
  comment,
  className = 'flow-thread-popover__header'
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
    className: className,
    children: [comment.avatarUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("img", {
      className: "flow-thread-popover__avatar flow-thread-popover__avatar--img",
      src: comment.avatarUrl,
      alt: "",
      width: "28",
      height: "28"
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
      className: "flow-thread-popover__avatar flow-thread-popover__avatar--fallback",
      "aria-hidden": "true",
      children: getInitials(comment.author)
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
      className: "flow-thread-popover__author",
      title: comment.author,
      children: comment.author
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
      className: "flow-thread-popover__date",
      children: comment.date
    })]
  });
}
function collectThreadFlat(all, rootId) {
  const rid = Number(rootId);
  const idSet = new Set([rid]);
  let added = true;
  while (added) {
    added = false;
    for (const c of all) {
      const cid = Number(c.id);
      const pid = Number(c.parentId || 0);
      if (idSet.has(pid) && !idSet.has(cid)) {
        idSet.add(cid);
        added = true;
      }
    }
  }
  return all.filter(c => idSet.has(Number(c.id)));
}
function findMarkElement(commentId) {
  const selector = `.${HIGHLIGHT_CLASS}[data-comment-id="${commentId}"], .${MEDIA_HIGHLIGHT_CLASS}`;
  const matches = el => Number(el.dataset.commentId) === commentId || (el.dataset.commentIds || '').split(' ').includes(String(commentId));
  const iframeDoc = (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_7__.getIframeDoc)();
  if (iframeDoc) {
    const inIframe = [...iframeDoc.querySelectorAll(selector)].find(matches);
    if (inIframe) {
      return {
        mark: inIframe,
        inIframe: true
      };
    }
  }
  const inDoc = [...document.querySelectorAll(selector)].find(matches);
  if (inDoc) {
    return {
      mark: inDoc,
      inIframe: false
    };
  }
  return null;
}
function markRectToViewport(rect, inIframe, popoverHeight = 320) {
  const GAP = 8;
  const PAD = 8;
  let markTop;
  let markBottom;
  let left;
  if (!inIframe) {
    markTop = rect.top;
    markBottom = rect.bottom;
    left = rect.left + rect.width / 2;
  } else {
    const iframe = (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_7__.getIframe)();
    if (!iframe) {
      markTop = rect.top;
      markBottom = rect.bottom;
      left = rect.left + rect.width / 2;
    } else {
      const iframeRect = iframe.getBoundingClientRect();
      // Iframe is visually transform-scaled in ReviewBar; rect coords
      // are iframe-internal so multiply before mapping to parent.
      const s = (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_7__.getIframeScale)();
      markTop = iframeRect.top + rect.top * s;
      markBottom = iframeRect.top + rect.bottom * s;
      left = iframeRect.left + rect.left * s + rect.width * s / 2;
    }
  }
  const viewportBottom = window.innerHeight;
  const fitsBelow = markBottom + GAP + popoverHeight <= viewportBottom - PAD;
  const fitsAbove = markTop - GAP - popoverHeight >= PAD;
  let top;
  let placement;
  if (fitsBelow) {
    top = markBottom + GAP;
    placement = 'below';
  } else if (fitsAbove) {
    top = markTop - GAP - popoverHeight;
    placement = 'above';
  } else {
    // Popover taller than viewport (or both sides cramped) — pin to top.
    top = Math.max(PAD, viewportBottom - popoverHeight - PAD);
    placement = 'below';
  }
  return {
    top,
    left,
    placement
  };
}

/**
 * @param {object} [props]
 * @param {{ postComment: Function, updateComment: Function }} [props.api]
 *   Backend adapter. Defaults to the single-post review namespace. The
 *   site-review chrome (Pro) supplies its own adapter targeting the Pro
 *   namespace.
 * @param {string} [props.mode] Optional mode tag for downstream branching.
 *   Defaults to `'review'`.
 */
function InlineThreadPopover({
  api = _utils_comment_api__WEBPACK_IMPORTED_MODULE_9__.defaultCommentApi,
  mode = 'review'
} = {}) {
  const [thread, setThread] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [position, setPosition] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [replying, setReplying] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const commentsRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(_utils_api__WEBPACK_IMPORTED_MODULE_8__.pageData.inlineComments || []);
  const openThreadRootIdRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const popoverRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const [caretOffset, setCaretOffset] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(0);
  const getViewportBounds = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    const PAD = 16;
    let minLeft = PAD;
    let maxRight = window.innerWidth - PAD;

    // Activity sidebar (Pro) is on the LEFT — bounds minLeft.
    if (document.body.classList.contains('flow-review-page--activity-open')) {
      const activityHost = document.getElementById('flow-pro-activity-host');
      const activityRight = activityHost?.getBoundingClientRect?.().right || 0;
      if (activityRight > 0) {
        minLeft = Math.max(minLeft, activityRight + PAD);
      }
    }

    // Comments sidebar is on the RIGHT — bounds maxRight.
    const isCommentsClosed = document.body.classList.contains('flow-review-page--comments-closed');
    if (!isCommentsClosed) {
      const sidebarHost = document.getElementById('flow-sidebar-host');
      const sidebarLeft = sidebarHost?.getBoundingClientRect?.().left;
      if (typeof sidebarLeft === 'number' && sidebarLeft > 0) {
        maxRight = Math.min(maxRight, sidebarLeft - PAD);
      }
    }
    return {
      minLeft,
      maxRight
    };
  }, []);
  const clampCenterToViewport = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(centerX => {
    const width = popoverRef.current?.offsetWidth || 420;
    const half = width / 2;
    const {
      minLeft,
      maxRight
    } = getViewportBounds();
    const minCenter = minLeft + half;
    const maxCenter = maxRight - half;
    if (minCenter > maxCenter) {
      return (minLeft + maxRight) / 2;
    }
    return Math.max(minCenter, Math.min(centerX, maxCenter));
  }, [getViewportBounds]);
  const rebuildOpenThread = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    const rid = openThreadRootIdRef.current;
    if (rid == null) {
      return;
    }
    const flat = collectThreadFlat(commentsRef.current, rid);
    const trees = (0,_utils_comment_tree__WEBPACK_IMPORTED_MODULE_11__.buildCommentTree)(flat);
    const next = trees.find(t => Number(t.id) === Number(rid));
    if (next) {
      setThread(next);
    } else {
      setThread(null);
      setPosition(null);
      openThreadRootIdRef.current = null;
    }
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const onAdded = e => {
      const {
        comment
      } = e.detail || {};
      if (!comment) {
        return;
      }
      const cid = Number(comment.id);
      if (commentsRef.current.some(c => Number(c.id) === cid)) {
        rebuildOpenThread();
        return;
      }
      commentsRef.current = [...commentsRef.current, comment];
      rebuildOpenThread();
    };
    window.addEventListener('flow:inline-comment-added', onAdded);
    return () => window.removeEventListener('flow:inline-comment-added', onAdded);
  }, [rebuildOpenThread]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const onUpdated = e => {
      const {
        id,
        html
      } = e.detail || {};
      if (!id) {
        return;
      }
      const nid = Number(id);
      commentsRef.current = commentsRef.current.map(c => Number(c.id) === nid ? {
        ...c,
        html
      } : c);
      rebuildOpenThread();
    };
    const onDeleted = e => {
      const {
        id
      } = e.detail || {};
      if (!id) {
        return;
      }
      const nid = Number(id);
      commentsRef.current = commentsRef.current.filter(c => Number(c.id) !== nid);
      rebuildOpenThread();
    };
    const onResolved = e => {
      const commentId = e.detail?.commentId;
      if (!commentId) {
        return;
      }
      const cid = Number(commentId);
      commentsRef.current = commentsRef.current.map(c => Number(c.id) === cid ? {
        ...c,
        isResolved: true
      } : c);
      rebuildOpenThread();
    };
    window.addEventListener('flow:inline-comment-updated', onUpdated);
    window.addEventListener('flow:inline-comment-deleted', onDeleted);
    window.addEventListener('flow:inline-comment-resolved', onResolved);
    return () => {
      window.removeEventListener('flow:inline-comment-updated', onUpdated);
      window.removeEventListener('flow:inline-comment-deleted', onDeleted);
      window.removeEventListener('flow:inline-comment-resolved', onResolved);
    };
  }, [rebuildOpenThread]);
  const showPopover = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(e => {
    const {
      commentId
    } = e.detail || {};
    if (!commentId) {
      return;
    }
    const id = Number(commentId);
    const found = findMarkElement(id);
    if (!found) {
      return;
    }
    const flat = collectThreadFlat(commentsRef.current, id);
    const trees = (0,_utils_comment_tree__WEBPACK_IMPORTED_MODULE_11__.buildCommentTree)(flat);
    const nextThread = trees.find(t => Number(t.id) === id);
    if (!nextThread) {
      return;
    }
    const rect = found.mark.getBoundingClientRect();
    const next = markRectToViewport(rect, found.inIframe, popoverRef.current?.offsetHeight || 320);
    const left = clampCenterToViewport(next.left);
    openThreadRootIdRef.current = id;
    setPosition({
      ...next,
      left,
      anchorLeft: next.left
    });
    setThread(nextThread);
    setReplying(false);
  }, [clampCenterToViewport]);
  const showPopoverDelayed = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(e => {
    setTimeout(() => showPopover(e), 350);
  }, [showPopover]);
  const repositionToThreadAnchor = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    if (!thread) {
      return;
    }
    const found = findMarkElement(Number(thread.id));
    if (!found) {
      return;
    }
    const rect = found.mark.getBoundingClientRect();
    const next = markRectToViewport(rect, found.inIframe, popoverRef.current?.offsetHeight || 320);
    const left = clampCenterToViewport(next.left);
    setPosition(prev => {
      if (prev && prev.top === next.top && prev.left === left && prev.placement === next.placement) {
        return prev;
      }
      return {
        ...next,
        left,
        anchorLeft: next.left
      };
    });
  }, [thread, clampCenterToViewport]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!thread) return;
    const id = window.requestAnimationFrame(() => {
      repositionToThreadAnchor();
    });
    return () => window.cancelAnimationFrame(id);
  }, [thread, repositionToThreadAnchor]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    window.addEventListener('flow:inline-comment-focus', showPopover);
    window.addEventListener('flow:scroll-to-highlight', showPopoverDelayed);
    return () => {
      window.removeEventListener('flow:inline-comment-focus', showPopover);
      window.removeEventListener('flow:scroll-to-highlight', showPopoverDelayed);
    };
  }, [showPopover, showPopoverDelayed]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!thread) {
      return undefined;
    }
    const onViewportChange = () => repositionToThreadAnchor();
    const attachIframeScroll = iframe => {
      try {
        iframe?.contentWindow?.addEventListener('scroll', onViewportChange, true);
      } catch {
        // cross-origin safety
      }
    };
    const detachIframeScroll = iframe => {
      try {
        iframe?.contentWindow?.removeEventListener('scroll', onViewportChange, true);
      } catch {}
    };
    const onIframeReady = e => attachIframeScroll(e.detail?.iframe);
    const onIframeRemoved = () => detachIframeScroll((0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_7__.getIframe)());
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('flow:iframe-ready', onIframeReady);
    window.addEventListener('flow:iframe-removed', onIframeRemoved);
    attachIframeScroll((0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_7__.getIframe)());
    return () => {
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('flow:iframe-ready', onIframeReady);
      window.removeEventListener('flow:iframe-removed', onIframeRemoved);
      detachIframeScroll((0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_7__.getIframe)());
    };
  }, [thread, repositionToThreadAnchor]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!position) {
      return;
    }
    const clampedLeft = clampCenterToViewport(position.left);
    if (Math.abs(clampedLeft - position.left) > 0.5) {
      setPosition(prev => prev ? {
        ...prev,
        left: clampedLeft
      } : prev);
    }
  }, [position, clampCenterToViewport]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!position) {
      setCaretOffset(0);
      return;
    }
    const cardWidth = popoverRef.current?.offsetWidth || 360;
    const maxShift = Math.max(0, cardWidth / 2 - 20);
    const anchorLeft = Number(position.anchorLeft || position.left);
    const popoverCentre = window.innerWidth <= 600 ? window.innerWidth / 2 : position.left;
    const delta = anchorLeft - popoverCentre;
    setCaretOffset(Math.max(-maxShift, Math.min(delta, maxShift)));
  }, [position]);
  const handleClose = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    openThreadRootIdRef.current = null;
    setThread(null);
    setPosition(null);
    setReplying(false);
  }, []);
  const handleMouseDown = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(e => {
    if ((0,_utils_dom_helpers__WEBPACK_IMPORTED_MODULE_6__.eventHitsShadowNode)(e, popoverRef.current)) {
      return;
    }
    if ((0,_utils_dom_helpers__WEBPACK_IMPORTED_MODULE_6__.eventInsidePortalUI)(e)) {
      return;
    }
    const mark = (0,_utils_dom_helpers__WEBPACK_IMPORTED_MODULE_6__.closestFromEventTarget)(e.target, `.${HIGHLIGHT_CLASS}, .${MEDIA_HIGHLIGHT_CLASS}`);
    if (mark) {
      return;
    }
    handleClose();
  }, [handleClose]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const attachIframe = iframe => {
      try {
        iframe?.contentDocument?.addEventListener('mousedown', handleMouseDown);
      } catch {
        // cross-origin safety
      }
    };
    const detachIframe = iframe => {
      try {
        iframe?.contentDocument?.removeEventListener('mousedown', handleMouseDown);
      } catch {}
    };
    document.addEventListener('mousedown', handleMouseDown);
    attachIframe((0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_7__.getIframe)());
    const onIframeReady = e => {
      attachIframe(e.detail?.iframe);
    };
    const onIframeRemoved = () => {
      detachIframe((0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_7__.getIframe)());
      openThreadRootIdRef.current = null;
      setThread(null);
      setPosition(null);
      setReplying(false);
    };
    window.addEventListener('flow:iframe-ready', onIframeReady);
    window.addEventListener('flow:iframe-removed', onIframeRemoved);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      detachIframe((0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_7__.getIframe)());
      window.removeEventListener('flow:iframe-ready', onIframeReady);
      window.removeEventListener('flow:iframe-removed', onIframeRemoved);
    };
  }, [handleMouseDown]);
  const handleResolve = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async () => {
    if (!thread) {
      return;
    }
    await api.updateComment(thread.id, {
      resolved: true
    });
    const tid = Number(thread.id);
    commentsRef.current = commentsRef.current.map(c => Number(c.id) === tid ? {
      ...c,
      isResolved: true
    } : c);
    openThreadRootIdRef.current = null;
    window.dispatchEvent(new CustomEvent('flow:highlight-resolve', {
      detail: {
        commentId: thread.id
      }
    }));
    window.dispatchEvent(new CustomEvent('flow:inline-comment-resolved', {
      detail: {
        commentId: thread.id,
        userId: _utils_api__WEBPACK_IMPORTED_MODULE_8__.pageData.currentUserId
      }
    }));
    window.dispatchEvent(new CustomEvent('flow:author-resubmit-activity', {
      detail: {
        userId: _utils_api__WEBPACK_IMPORTED_MODULE_8__.pageData.currentUserId,
        kind: 'comment_resolved'
      }
    }));
    setThread(null);
    setPosition(null);
  }, [thread, api]);
  const handleReplySubmit = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async html => {
    if (!thread) {
      return;
    }
    const comment = await api.postComment({
      html,
      parentId: thread.id
    });
    window.dispatchEvent(new CustomEvent('flow:inline-comment-added', {
      detail: {
        comment
      }
    }));
    rebuildOpenThread();
    setReplying(false);
  }, [thread, rebuildOpenThread, api]);
  if (!thread || !position) {
    return null;
  }
  const replies = thread.replies || [];
  const placement = position.placement || 'below';
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
    ref: popoverRef,
    className: `flow-thread-popover flow-thread-popover--${placement}`,
    style: {
      position: 'fixed',
      top: `${position.top}px`,
      left: `${position.left}px`,
      transform: 'translateX(-50%)',
      zIndex: 1_000_001
    },
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
      className: "flow-thread-popover__caret",
      style: {
        marginLeft: `${caretOffset}px`
      },
      "aria-hidden": "true"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
      className: "flow-thread-popover__card",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
        className: "flow-thread-popover__header-actions",
        children: [!thread.isResolved && Number(_utils_api__WEBPACK_IMPORTED_MODULE_8__.pageData.currentUserId || 0) > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          icon: _icons_comment_resolve__WEBPACK_IMPORTED_MODULE_4__["default"],
          size: "small",
          className: "flow-thread-popover__resolve-icon",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Mark as resolved', 'jumplinks-editorial-workflow'),
          onClick: handleResolve
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
          className: "flow-thread-popover__close",
          label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Close', 'jumplinks-editorial-workflow'),
          onClick: handleClose
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(CommentAuthorRow, {
        comment: thread
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
        className: "flow-thread-popover__body",
        dangerouslySetInnerHTML: {
          __html: thread.html
        }
      }), replies.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
        className: "flow-thread-popover__replies",
        children: replies.map(reply => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
          className: "flow-thread-popover__reply",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(CommentAuthorRow, {
            comment: reply,
            className: "flow-thread-popover__reply-header"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
            className: "flow-thread-popover__reply-body",
            dangerouslySetInnerHTML: {
              __html: reply.html
            }
          })]
        }, reply.id))
      }), replying && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
        className: "flow-thread-popover__reply-editor",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_CommentEditor__WEBPACK_IMPORTED_MODULE_10__["default"], {
          autoFocus: true,
          onSubmit: handleReplySubmit,
          onCancel: () => setReplying(false),
          submitLabel: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Reply', 'jumplinks-editorial-workflow')
        })
      }), !thread.isResolved && !replying && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
        className: "flow-thread-popover__actions",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          className: "flow-btn--text flow-thread-popover__reply-btn",
          icon: _icons_comment_reply__WEBPACK_IMPORTED_MODULE_3__["default"],
          onClick: () => setReplying(true),
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Reply', 'jumplinks-editorial-workflow')
        })
      }), thread.isResolved && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
        className: "flow-thread-popover__resolved-badge",
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Resolved', 'jumplinks-editorial-workflow')
      })]
    })]
  });
}

/***/ },

/***/ "./src/review-page/components/ReviewBar.js"
/*!*************************************************!*\
  !*** ./src/review-page/components/ReviewBar.js ***!
  \*************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ReviewBar)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/components */ "@wordpress/components");
/* harmony import */ var _wordpress_components__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/arrow-left.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/desktop.mjs");
/* harmony import */ var _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/icons */ "./node_modules/@wordpress/icons/build-module/library/external.mjs");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/hooks */ "@wordpress/hooks");
/* harmony import */ var _wordpress_hooks__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/api */ "./src/review-page/utils/api.js");
/* harmony import */ var _utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/iframe-bridge */ "./src/review-page/utils/iframe-bridge.js");
/* harmony import */ var _utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../utils/review-comment-totals */ "./src/review-page/utils/review-comment-totals.js");
/* harmony import */ var _shared_status_labels__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../shared/status-labels */ "./src/shared/status-labels.js");
/* harmony import */ var _icons_alert_warning__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../icons/alert-warning */ "./src/review-page/icons/alert-warning.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__);




/**
 * Gutenberg Settings sidebar icon — a rectangle with a vertical divider
 * representing content + sidebar. Lifted from the block editor so the
 * Review-sidebar toggle reads as the same affordance.
 */
const sidebarIcon = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  width: "24",
  height: "24",
  "aria-hidden": "true",
  focusable: "false",
  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("path", {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-4 14.5H6c-.3 0-.5-.2-.5-.5V6c0-.3.2-.5.5-.5h8v13zm4.5-.5c0 .3-.2.5-.5.5h-2.5v-13H18c.3 0 .5.2.5.5v12z"
  })
});








/** Keep in sync with `$sidebar-width` / `$activity-sidebar-width` in
 *  `_tokens.scss` and the Pro activity sidebar's own host width. */

const COMMENTS_SIDEBAR_WIDTH_PX = 360;
const ACTIVITY_SIDEBAR_WIDTH_PX = 260;
/** Used by the mobile-breakpoint check; either constant works since the
 *  check fires below 782px where both sidebars overlay instead of push. */
const SIDEBAR_WIDTH_PX = COMMENTS_SIDEBAR_WIDTH_PX;

/** Keep in sync with `$mobile-bp` in `_tokens.scss`. Below this, the sidebar
 *  overlays the content instead of pushing it, so it must contribute 0 to
 *  iframe-canvas math. */
const MOBILE_BP_PX = 782;
const isMobileViewport = () => window.innerWidth < MOBILE_BP_PX;

/**
 * Coerce the iframe URL onto the parent's origin. The server builds the iframe
 * URL from get_permalink() / home_url(), which may return https://example.com
 * even when the visitor reached the review page at https://www.example.com (or
 * http vs https). The mismatch makes the iframe cross-origin, which silently
 * breaks the inline-comment popover (parent can't attach mouseup/click
 * listeners on iframe.contentDocument). Forcing protocol+host to match the
 * parent eliminates that whole class of "popover-host is empty" reports on
 * production sites.
 */
/** Server-side recursive-shell guard in `Site_Review_Chrome::is_iframe_canvas_request()`. */
const CANVAS_MARKER = 'flow_sr_canvas';
function sameOriginIframeSrc(src) {
  if (!src) return src;
  try {
    const url = new URL(src, window.location.href);
    if (url.origin !== window.location.origin) {
      url.protocol = window.location.protocol;
      url.host = window.location.host;
    }
    // Stamp the canvas marker. The server uses it to recognise iframe-canvas
    // requests on environments where Sec-Fetch-Dest is stripped (e.g. nginx
    // FastCGI on ddev / Local) — without it, the chrome activates on the
    // iframe and renders recursive shells inside itself.
    if (!url.searchParams.has(CANVAS_MARKER)) {
      url.searchParams.set(CANVAS_MARKER, '1');
    }
    return url.toString();
  } catch {
    return src;
  }
}

/**
 * Rewrite same-origin `<a href>` in the iframe doc to carry the canvas marker.
 * Link clicks navigate the iframe to URLs that wouldn't otherwise have it,
 * which makes the server fall back to Referer-based detection — and that
 * fails the moment Referrer-Policy strips the query string (default policy
 * on many setups since Chrome 85+). Stamping the marker on hrefs at load
 * time keeps every link click going to a URL the server can recognise as
 * an iframe canvas via the explicit marker, regardless of Referer behaviour.
 */
function stampCanvasMarkerOnLinks(iframeDoc) {
  if (!iframeDoc?.querySelectorAll) return;
  const parentOrigin = window.location.origin;
  const anchors = iframeDoc.querySelectorAll('a[href]');
  for (const a of anchors) {
    const target = a.getAttribute('target');
    if (target && target !== '_self') continue; // _blank etc. leave the iframe — don't touch
    try {
      const url = new URL(a.href, iframeDoc.baseURI || parentOrigin);
      if (url.origin !== parentOrigin) continue;
      if (url.searchParams.has(CANVAS_MARKER)) continue;
      url.searchParams.set(CANVAS_MARKER, '1');
      a.href = url.toString();
    } catch {
      // unparseable href (mailto:, tel:, javascript:, …) — ignore
    }
  }
}

/**
 * View dropdown — Free renders the chrome and the "Preview in new tab" link.
 * Pro extends it via the `flow_ew_view_dropdown_extras` filter (device-preview
 * switcher) and `flow_ew_view_dropdown_icon` filter (device-aware trigger
 * icon). The pointer-down/click hack on the wrapper swallows the second click
 * that some browsers fire on the toggle when a portal-based popover is already
 * open — without it the menu reopens immediately after closing.
 */
function ViewDropdown({
  postUrl,
  device
}) {
  const wrapperRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let wasOpenOnPointerDown = false;
    const onPointerDown = e => {
      const toggle = wrapper.querySelector('.components-dropdown-menu__toggle');
      wasOpenOnPointerDown = !!toggle && toggle.getAttribute('aria-expanded') === 'true' && (toggle === e.target || toggle.contains(e.target));
    };
    const onClick = e => {
      if (!wasOpenOnPointerDown) return;
      wasOpenOnPointerDown = false;
      const toggle = wrapper.querySelector('.components-dropdown-menu__toggle');
      if (toggle && (toggle === e.target || toggle.contains(e.target))) {
        e.stopImmediatePropagation();
      }
    };
    wrapper.addEventListener('pointerdown', onPointerDown, true);
    wrapper.addEventListener('click', onClick, true);
    return () => {
      wrapper.removeEventListener('pointerdown', onPointerDown, true);
      wrapper.removeEventListener('click', onClick, true);
    };
  }, []);
  const triggerIcon = (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__.applyFilters)('flow_ew_view_dropdown_icon', _wordpress_icons__WEBPACK_IMPORTED_MODULE_3__["default"], {
    device
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
    ref: wrapperRef,
    className: "flow-bar__view-dropdown-wrap",
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.DropdownMenu, {
      icon: triggerIcon,
      label: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('View', 'jumplinks-editorial-workflow'),
      className: "flow-bar__view-dropdown",
      popoverProps: {
        placement: 'bottom-end'
      },
      toggleProps: {
        size: 'compact'
      },
      children: ({
        onClose
      }) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.Fragment, {
        children: [(0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__.applyFilters)('flow_ew_view_dropdown_extras', null, {
          onClose,
          device
        }), postUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuGroup, {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.MenuItem, {
            href: postUrl,
            target: "_blank",
            rel: "noreferrer",
            icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_4__["default"],
            iconPosition: "right",
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Preview in new tab', 'jumplinks-editorial-workflow')
          })
        }) : null]
      })
    })
  });
}
function WpLogoButton({
  wpLogoUrl,
  isLoggedIn
}) {
  const label = isLoggedIn ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Review dashboard', 'jumplinks-editorial-workflow') : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Find out more on jumplinks.net', 'jumplinks-editorial-workflow');
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Tooltip, {
    text: label,
    placement: "right",
    fixed: true,
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
      className: "flow-bar__wp-logo",
      tabIndex: "0",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("a", {
        href: wpLogoUrl,
        className: "flow-bar__wp-logo-link",
        "aria-label": label,
        target: isLoggedIn ? undefined : '_blank',
        rel: isLoggedIn ? undefined : 'noopener noreferrer',
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
          className: "flow-bar__wp-logo-icon",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            width: "48",
            height: "48",
            fill: "currentColor",
            "aria-hidden": "true",
            focusable: "false",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("path", {
              d: "M15.56,7.62c.65-.11,1.07-.19,1.07-.19.19-.03.37-.14.49-.32l1.53-2.17c.25-.36.16-.86-.21-1.11-.13-.09-.28-.13-.43-.13-.25,0-.5.12-.66.35l-1.3,1.95-1.22.21c-.25.04-.32.37-.1.51.6.4.8.83.83.88Z"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("path", {
              d: "M6.01,11.32c.24,0,.48-.11.66-.37l1.28-2.01c.26-.04.67-.11,1.16-.2l.07-.41c.04-.26.11-.51.2-.73.08-.2-.1-.41-.31-.38l-1.7.29c-.19.03-.37.14-.49.31,0,.01-1.54,2.22-1.55,2.23-.42.64.12,1.27.68,1.27Z"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("path", {
              d: "M9.73,17.56l-2.21,1.63c-1.02-.82-3.25-2.6-3.25-2.6-.18-.13-.35-.19-.52-.19-.68,0-1.19.92-.52,1.49l3.75,3c.15.12.34.19.52.19.18,0,.35-.06.5-.17l3.24-2.47c.2-.15.12-.46-.13-.5-.04,0-.09-.01-.13-.02-.47-.08-.89-.2-1.25-.37Z"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("path", {
              d: "M20.77,15.85s-3.8-2.94-3.8-2.94c-.13-.1-.3-.16-.46-.16s-.31.05-.45.15l-.88.65h0s-.14.85-.25,1.49c-.04.25.25.42.45.27l1.11-.85c.99.82,3.26,2.7,3.27,2.71.17.12.35.18.51.18.68,0,1.18-.93.5-1.49Z"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("path", {
              d: "M15.1,9.4c.05-.31.06-.63-.01-.94-.03-.12-.07-.24-.12-.36-.06-.12-.13-.23-.22-.34-.34-.42-.94-.76-1.91-.93-.28-.05-.55-.07-.81-.07-1.06,0-1.9.44-2.11,1.69l-.25,1.51c.43-.3.97-.46,1.61-.49l.06-.36.04-.22c.01-.06.02-.12.04-.17.11-.33.37-.49.8-.49.12,0,.26.01.41.04.21.03.38.08.52.15.17.08.3.19.38.32.09.15.11.32.08.53l-.1.59-.06.38-.06.38h0s-.19,1.12-.19,1.12c-.03.19-.1.34-.21.44-.08.08-.2.14-.33.18-.1.02-.2.04-.32.04h0c-.14,0-.31-.02-.45-.05s-.31.07-.33.23l-.18,1.09c.17.04.74.12.74.12.13.01.26.02.38.02,0,0,.24,0,.38-.02,1.02-.11,1.51-.68,1.72-1.34h0c.04-.13.07-.27.09-.4l.1-.59h0s.1-.59.1-.59l.25-1.47Z"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("path", {
              d: "M12.67,5.46l.41.07.41.07c.34.06.62.02.84-.12.21-.14.35-.36.4-.68l.08-.5.08-.5c.05-.31,0-.57-.16-.77-.16-.2-.41-.33-.75-.39l-.41-.07-.41-.07c-.72-.12-1.13.15-1.24.8l-.08.5-.08.5c-.11.65.19,1.04.91,1.16Z"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("path", {
              d: "M13.28,14.48c-.18.04-.37.06-.56.07l-.07.39-.03.2c-.03.19-.1.33-.21.44,0,0,0,0,0,0,0,0,0,0,0,0-.04.04-.08.07-.13.1h0c-.13.07-.3.11-.51.11-.08,0-.16,0-.25-.02-.04,0-.09-.01-.13-.02-.13-.02-.25-.05-.36-.08-.5-.16-.69-.45-.62-.91l.41-2.48c.03-.19.1-.34.2-.44.08-.09.19-.15.33-.19.09-.02.19-.03.31-.03h.03c.14,0,.31.02.46.05s.3-.07.33-.23l.18-1.09c-.12-.03-.25-.06-.39-.08-.12-.02-.23-.04-.35-.05,0,0,0,0,0,0-.13-.01-.25-.02-.38-.02-.03,0-.05,0-.08,0-.1,0-.2,0-.3.01-.83.07-1.48.46-1.74,1.36h0c-.03.1-.05.2-.07.31l-.47,2.81c-.16.95.17,1.57.79,1.97.11.07.23.14.36.2.13.06.27.11.42.16.21.06.43.11.66.15.29.05.56.07.8.07.61,0,1.05-.14,1.38-.37.03-.02.06-.04.08-.06h0c.42-.34.62-.82.71-1.32l.25-1.48c-.3.22-.65.37-1.05.45h0Z"
            })]
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
          className: "flow-bar__wp-logo-back",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            width: "24",
            height: "24",
            "aria-hidden": "true",
            focusable: "false",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("path", {
              d: "M14 6H6v8h1.5V8.5L17 18l1-1-9.5-9.5H14V6Z"
            })
          })
        })]
      })
    })
  });
}

/**
 * Top bar for the review chrome.
 *
 * @param {object}      [props]
 * @param {'review'|'site-review'} [props.mode]
 *   `'review'` (default): renders the per-post bar with status badge,
 *   ViewDropdown, default Approve / Request Changes / Resubmit / Revoke
 *   actions.
 *   `'site-review'`: drops the badge + ViewDropdown + default action
 *   cluster. The caller is expected to provide `actionsSlot` and to
 *   localize `pageData` with the site-review title/requester values.
 *   Revision-status meta and the edit-post icon are still suppressed
 *   automatically when their underlying `pageData` fields are empty (no
 *   mode check needed), so site-review just leaves those fields blank.
 * @param {React.ReactNode} [props.actionsSlot]
 *   When provided, rendered to the right of the sidebar toggle INSTEAD
 *   of the default Approve / Request Changes / Resubmit / Revoke
 *   buttons. Lets Pro inject custom action buttons (Site Review uses
 *   "Send feedback" and "Exit review").
 */
function ReviewBar({
  mode = 'review',
  actionsSlot = null
} = {}) {
  const isSiteReview = mode === 'site-review';
  const {
    postTitle = '',
    postTypeLabel = '',
    snapshotLabel = '',
    status = '',
    displayStatus = '',
    wpLogoUrl = '/',
    postEditUrl = '',
    postUrl = '',
    canAct = false,
    reviewId = 0,
    debugMode = false,
    currentUserId = 0,
    reviewerId = 0,
    currentUserIsAdmin = false,
    currentUserIsPostAuthor = false,
    currentUserCanResubmit = false,
    comments = [],
    inlineComments = [],
    revisionStatus = null,
    latestRevisionUrl = '',
    reviewers = [],
    isEmailInvitee = false,
    inviteSyntheticId = 0
  } = _utils_api__WEBPACK_IMPORTED_MODULE_7__.pageData;
  const effectiveUserId = isEmailInvitee ? Number(inviteSyntheticId || 0) : Number(currentUserId);
  const [actionStatus, setActionStatus] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!actionStatus) return undefined;
    const t = setTimeout(() => setActionStatus(null), 10_000);
    return () => clearTimeout(t);
  }, [actionStatus]);
  const [isBusy, setIsBusy] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [currentStatus, setCurrentStatus] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(displayStatus || status);
  // Two independent panels: comments (right, default open on desktop) and
  // activity (left, default closed).
  const [commentsOpen, setCommentsOpen] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => !isMobileViewport());
  const [activityOpen, setActivityOpen] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [device, setDevice] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('desktop');
  const [hasAuthorResubmitActivity, setHasAuthorResubmitActivity] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => {
    const hasNewerRevision = revisionStatus === 'outdated';
    const hasOwnComment = [...comments, ...inlineComments].some(comment => Number(comment?.authorId || 0) === Number(currentUserId));
    return hasNewerRevision || hasOwnComment;
  });
  const iframeRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const currentUserIdRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(currentUserId);
  currentUserIdRef.current = currentUserId;
  const onInlineCommentForResubmit = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(e => {
    const authorId = Number(e?.detail?.comment?.authorId || 0);
    if (authorId > 0 && authorId === Number(currentUserIdRef.current)) {
      setHasAuthorResubmitActivity(true);
    }
  }, []);
  const totalCommentCount = (0,_utils_review_comment_totals__WEBPACK_IMPORTED_MODULE_9__.useReviewCommentTotals)(onInlineCommentForResubmit);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (iframeRef.current) return;
    const iframe = document.createElement('iframe');
    iframe.id = 'flow-template-frame';
    iframe.src = sameOriginIframeSrc(_utils_api__WEBPACK_IMPORTED_MODULE_7__.pageData.contentOnlyUrl || '');
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    // Site-review iframes get a load handler too — same `flow:iframe-ready`
    iframe.addEventListener('load', () => {
      (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_8__.setIframe)(iframe);
      try {
        stampCanvasMarkerOnLinks(iframe.contentDocument);
      } catch {
        // cross-origin transient or contentDocument null — non-fatal
      }
      window.dispatchEvent(new CustomEvent('flow:iframe-ready', {
        detail: {
          iframe
        }
      }));
    });
    return () => {
      if (iframeRef.current) {
        window.dispatchEvent(new CustomEvent('flow:iframe-removed'));
        (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_8__.clearIframe)();
        iframeRef.current.remove();
        iframeRef.current = null;
      }
    };
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!iframeRef.current) return;
    const iframe = iframeRef.current;
    const barHost = document.getElementById('flow-bar-host');
    const apply = () => {
      const barHeight = Math.round(barHost?.getBoundingClientRect?.().height || 64);
      // On mobile both sidebars overlay the content (see style.scss
      // $mobile-bp), so neither contributes to canvas math.
      const mobile = isMobileViewport();
      const rightSidebar = commentsOpen && !mobile ? COMMENTS_SIDEBAR_WIDTH_PX : 0;
      const leftSidebar = activityOpen && !mobile ? ACTIVITY_SIDEBAR_WIDTH_PX : 0;
      const visualWidth = Math.max(0, window.innerWidth - rightSidebar - leftSidebar);
      const visualHeight = Math.max(0, window.innerHeight - barHeight);
      const isDeviceMode = device === 'tablet' || device === 'mobile';
      const designedWidth = isDeviceMode ? device === 'tablet' ? 780 : 360 : window.innerWidth;

      // Desktop: scale to fill the area between the two sidebars.
      const rawScale = designedWidth > 0 ? visualWidth / designedWidth : 1;
      const scale = isDeviceMode ? Math.min(1, rawScale) : rawScale;
      const designedHeight = scale > 0 ? visualHeight / scale : visualHeight;
      const visualDesignedWidth = designedWidth * scale;
      const leftOffset = isDeviceMode ? leftSidebar + Math.max(0, (visualWidth - visualDesignedWidth) / 2) : leftSidebar;
      iframe.style.cssText = `position:fixed;top:${barHeight}px;left:${leftOffset}px;` + `width:${designedWidth}px;height:${designedHeight}px;` + `transform:scale(${scale});transform-origin:top left;` + `border:none;z-index:0;background:#fff;` + `box-shadow:${isDeviceMode ? '0 0 0 1px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)' : 'none'};` + `transition:left 180ms ease,transform 180ms ease,width 180ms ease;`;
      document.body.classList.toggle('flow-device-preview', isDeviceMode);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [commentsOpen, activityOpen, device]);
  const isExternalCommentsToggleRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(false);
  const toggleComments = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(() => {
    setCommentsOpen(prev => !prev);
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (isExternalCommentsToggleRef.current) {
      isExternalCommentsToggleRef.current = false;
      return;
    }
    window.dispatchEvent(new CustomEvent('flow:comments-sidebar-toggle', {
      detail: {
        open: commentsOpen
      }
    }));
    // Our own listener runs synchronously during dispatch and sets the ref
    // to skip a redundant setState. Clear it again so the next bar-toggle
    // still broadcasts to CommentSidebar (which drives data-open / body class).
    isExternalCommentsToggleRef.current = false;
  }, [commentsOpen]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const onCommentsToggle = e => {
      if (typeof e.detail?.open !== 'boolean') {
        return;
      }
      isExternalCommentsToggleRef.current = true;
      setCommentsOpen(e.detail.open);
    };
    const onActivityToggle = e => setActivityOpen(e.detail.open);
    const onStatusChange = e => {
      setCurrentStatus(e.detail.status || '');
      if (Object.prototype.hasOwnProperty.call(e.detail, 'myVote')) {
        setMyVoteState(e.detail.myVote);
      }
      if (e.detail.message) {
        setActionStatus({
          type: e.detail.type || 'success',
          message: e.detail.message
        });
      }
    };
    const onSetSrc = e => {
      if (iframeRef.current && e.detail?.src) {
        const next = sameOriginIframeSrc(e.detail.src);
        if (iframeRef.current.src !== next) {
          window.dispatchEvent(new CustomEvent('flow:iframe-removed'));
          (0,_utils_iframe_bridge__WEBPACK_IMPORTED_MODULE_8__.clearIframe)();
          iframeRef.current.src = next;
        }
      }
    };
    const onAuthorResubmitActivity = () => {
      setHasAuthorResubmitActivity(true);
    };
    const onSetDevice = e => {
      const next = e?.detail?.device;
      if (next === 'desktop' || next === 'tablet' || next === 'mobile') {
        setDevice(next);
      }
    };
    window.addEventListener('flow:comments-sidebar-toggle', onCommentsToggle);
    window.addEventListener('flow:activity-sidebar-toggle', onActivityToggle);
    window.addEventListener('flow:status-changed', onStatusChange);
    window.addEventListener('flow:set-iframe-src', onSetSrc);
    window.addEventListener('flow:author-resubmit-activity', onAuthorResubmitActivity);
    window.addEventListener('flow:set-device-preview', onSetDevice);
    window.dispatchEvent(new CustomEvent('flow:request-device-preview'));
    return () => {
      window.removeEventListener('flow:comments-sidebar-toggle', onCommentsToggle);
      window.removeEventListener('flow:activity-sidebar-toggle', onActivityToggle);
      window.removeEventListener('flow:status-changed', onStatusChange);
      window.removeEventListener('flow:set-iframe-src', onSetSrc);
      window.removeEventListener('flow:author-resubmit-activity', onAuthorResubmitActivity);
      window.removeEventListener('flow:set-device-preview', onSetDevice);
    };
  }, []);
  const statusLabel = _shared_status_labels__WEBPACK_IMPORTED_MODULE_10__.STATUS_LABELS[currentStatus] || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Review', 'jumplinks-editorial-workflow');
  const isChangesRequested = currentStatus === 'changes_requested';
  const [myVoteState, setMyVoteState] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => {
    if (Array.isArray(reviewers) && reviewers.length) {
      const me = reviewers.find(r => Number(r.id) === effectiveUserId);
      if (me && me.status) return me.status;
    }
    return null;
  });
  const myVote = myVoteState !== null ? myVoteState : currentStatus;
  const isApproved = myVote === 'approved';
  const canAuthorResubmit = currentStatus === 'changes_requested' && currentUserIsPostAuthor && Number(reviewId) > 0;
  const canAdminOverride = debugMode && currentUserIsAdmin;
  const isOpenReview = currentStatus === 'open_review';
  // Email invitees act anonymously with a cookie session; WP users need login.
  const canActFinal = !isOpenReview && (canAct || canAdminOverride) && (isEmailInvitee || Number(currentUserId) > 0);
  const resolvedTitle = postTitle && String(postTitle).trim() ? postTitle : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('(No title)', 'jumplinks-editorial-workflow');
  const doAction = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(async (endpoint, successMsg, nextStatus) => {
    setIsBusy(true);
    setActionStatus(null);
    try {
      const data = await (0,_utils_api__WEBPACK_IMPORTED_MODULE_7__["default"])(`reviews/${reviewId}/${endpoint}`, {
        method: 'POST'
      });
      const resolved = data && (data.display_status || data.status) || nextStatus;
      setCurrentStatus(resolved);
      let nextMyVote = null;
      if (data && Array.isArray(data.reviewers)) {
        const mine = data.reviewers.find(r => Number(r.id) === effectiveUserId);
        nextMyVote = mine ? mine.status : null;
        setMyVoteState(nextMyVote);
      }
      window.dispatchEvent(new CustomEvent('flow:status-changed', {
        detail: {
          status: resolved,
          myVote: nextMyVote
        }
      }));
      setActionStatus({
        type: 'success',
        message: successMsg
      });
    } catch (err) {
      setActionStatus({
        type: 'error',
        message: err.message
      });
    } finally {
      setIsBusy(false);
    }
  }, [reviewId, effectiveUserId]);
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
    className: "flow-bar",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
      className: "flow-bar__left",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(WpLogoButton, {
        wpLogoUrl: wpLogoUrl,
        isLoggedIn: currentUserId > 0
      }), (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__.applyFilters)('flow_ew_review_bar_left_extras', null, {
        activityOpen
      }), postEditUrl ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Tooltip, {
        text: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Edit content', 'jumplinks-editorial-workflow'),
        placement: "bottom",
        fixed: true,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          href: postEditUrl,
          className: "flow-bar__edit-post",
          icon: _wordpress_icons__WEBPACK_IMPORTED_MODULE_2__["default"],
          "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Edit content', 'jumplinks-editorial-workflow'),
          onClick: e => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
              return;
            }
            e.preventDefault();
            window.location.assign(postEditUrl);
          }
        })
      }) : null, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
        className: isSiteReview || postTypeLabel ? 'flow-bar__title' : 'flow-bar__title flow-bar__title--simple',
        children: isSiteReview || postTypeLabel ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.Fragment, {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
            className: "flow-bar__title-prefix",
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Reviewing', 'jumplinks-editorial-workflow')
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
            className: "flow-bar__title-name",
            children: resolvedTitle
          }), postTypeLabel ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("span", {
            className: "flow-bar__title-suffix",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
              className: "flow-bar__title-dot",
              "aria-hidden": "true",
              children: '\u00b7'
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
              className: "flow-bar__title-type",
              children: postTypeLabel
            })]
          }) : null]
        }) : postTitle
      }), isSiteReview ? null : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("span", {
        className: `flow-bar__badge flow-bar__badge--${currentStatus}`,
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
          className: "flow-bar__badge__dot",
          "aria-hidden": "true"
        }), statusLabel]
      })]
    }), revisionStatus || snapshotLabel || debugMode && revisionStatus === 'latest' ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
      className: "flow-bar__meta",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
        className: "flow-bar__freshness-row",
        children: [revisionStatus ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
          className: `flow-bar__freshness flow-bar__freshness--${revisionStatus}`,
          children: revisionStatus === 'latest' ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('You are viewing the latest content', 'jumplinks-editorial-workflow') : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.Fragment, {
            children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Content may be outdated.', 'jumplinks-editorial-workflow'), latestRevisionUrl && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.Fragment, {
              children: [" ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("a", {
                href: latestRevisionUrl,
                className: "flow-bar__freshness-link",
                children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('View the latest version', 'jumplinks-editorial-workflow')
              })]
            })]
          })
        }) : null, debugMode && revisionStatus === 'latest' ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("span", {
          className: "flow-bar__freshness flow-bar__freshness--debug",
          role: "status",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
            className: "flow-bar__freshness-icon",
            "aria-hidden": "true",
            children: _icons_alert_warning__WEBPACK_IMPORTED_MODULE_11__["default"]
          }), (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Debug mode', 'jumplinks-editorial-workflow')]
        }) : null]
      }), snapshotLabel ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("span", {
        className: "flow-bar__freshness-snapshot",
        children: snapshotLabel
      }) : null]
    }) : null, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
      className: "flow-bar__right",
      children: [isSiteReview ? null : (0,_wordpress_hooks__WEBPACK_IMPORTED_MODULE_6__.applyFilters)('flow_ew_review_participants_display', null, {
        pageData: _utils_api__WEBPACK_IMPORTED_MODULE_7__.pageData
      }), isSiteReview ? null : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(ViewDropdown, {
        postUrl: postUrl,
        device: device
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Tooltip, {
        text: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Review', 'jumplinks-editorial-workflow'),
        placement: "bottom",
        fixed: true,
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          icon: sidebarIcon,
          className: `flow-bar__comments-toggle${commentsOpen ? ' is-pressed' : ''}`,
          "aria-pressed": commentsOpen,
          "aria-label": (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Review', 'jumplinks-editorial-workflow'),
          onClick: toggleComments
        })
      }), actionsSlot ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
        className: "flow-bar__actions",
        children: actionsSlot
      }) : null, actionsSlot ? null : canAuthorResubmit ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
        className: "flow-bar__actions",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          variant: "primary",
          onClick: () => doAction('resubmit', (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('✓ Resubmitted for review.', 'jumplinks-editorial-workflow'), 'in_review'),
          disabled: isBusy || !hasAuthorResubmitActivity,
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Resubmit for review', 'jumplinks-editorial-workflow')
        })
      }) : null, actionsSlot ? null : canActFinal ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsxs)("div", {
        className: "flow-bar__actions",
        children: [actionStatus && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
          className: "components-snackbar-list flow-bar__snackbar-list",
          "aria-live": "polite",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
            className: "components-snackbar-list__notice-container",
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
              className: "components-snackbar flow-bar__snackbar",
              role: actionStatus.type === 'error' ? 'alert' : 'status',
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)("div", {
                className: "components-snackbar__content",
                children: actionStatus.message
              })
            })
          })
        }), !isApproved ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          className: "flow-bar__btn--request-changes",
          onClick: () => doAction('request-changes', (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('✓ Changes requested — author notified.', 'jumplinks-editorial-workflow'), 'changes_requested'),
          disabled: isBusy || totalCommentCount === 0 || myVote === 'changes_requested',
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Request Changes', 'jumplinks-editorial-workflow')
        }) : null, isApproved ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          variant: "secondary",
          onClick: () => doAction('revoke-approval', (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Approval revoked.', 'jumplinks-editorial-workflow'), 'in_review'),
          disabled: isBusy,
          className: "flow-bar__btn--revoke",
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Revoke Approval', 'jumplinks-editorial-workflow')
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_12__.jsx)(_wordpress_components__WEBPACK_IMPORTED_MODULE_1__.Button, {
          variant: "primary",
          onClick: () => doAction('approve', (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('✓ Approval recorded.', 'jumplinks-editorial-workflow'), 'approved'),
          disabled: isBusy,
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_5__.__)('Approve', 'jumplinks-editorial-workflow')
        })]
      }) : null]
    })]
  });
}

/***/ },

/***/ "./src/review-page/hooks/use-confirm-dialog.js"
/*!*****************************************************!*\
  !*** ./src/review-page/hooks/use-confirm-dialog.js ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   useConfirmDialog: () => (/* binding */ useConfirmDialog)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _components_ConfirmDialog__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../components/ConfirmDialog */ "./src/review-page/components/ConfirmDialog.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);



/**
 * Promise-based confirm dialog for destructive actions.
 *
 * @returns {{ confirm: Function, confirmDialog: import('react').ReactNode }}
 */

function useConfirmDialog() {
  const [pending, setPending] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const resolverRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);
  const close = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(result => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setPending(null);
  }, []);
  const confirm = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)(options => {
    return new Promise(resolve => {
      resolverRef.current = resolve;
      setPending(options);
    });
  }, []);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    return () => {
      resolverRef.current?.(false);
      resolverRef.current = null;
    };
  }, []);
  const confirmDialog = pending ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(_components_ConfirmDialog__WEBPACK_IMPORTED_MODULE_1__["default"], {
    ...pending,
    onConfirm: () => close(true),
    onCancel: () => close(false)
  }) : null;
  return {
    confirm,
    confirmDialog
  };
}

/***/ },

/***/ "./src/review-page/icons/alert-error.js"
/*!**********************************************!*\
  !*** ./src/review-page/icons/alert-error.js ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Figma Alert / error icon (Frame 30).
 */

const alertErrorIcon = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    d: "M11 7H13V14H11V7ZM11 15H13V17H11V15Z",
    fill: "currentColor"
  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    d: "M21.707 7.293L16.707 2.293C16.6143 2.19996 16.5041 2.12617 16.3828 2.07589C16.2614 2.0256 16.1313 1.99981 16 2H8C7.86866 1.99981 7.73857 2.0256 7.61724 2.07589C7.4959 2.12617 7.38571 2.19996 7.293 2.293L2.293 7.293C2.19996 7.38571 2.12617 7.4959 2.07589 7.61724C2.0256 7.73857 1.99981 7.86866 2 8V16C2 16.266 2.105 16.52 2.293 16.707L7.293 21.707C7.38571 21.8 7.4959 21.8738 7.61724 21.9241C7.73857 21.9744 7.86866 22.0002 8 22H16C16.266 22 16.52 21.895 16.707 21.707L21.707 16.707C21.8 16.6143 21.8738 16.5041 21.9241 16.3828C21.9744 16.2614 22.0002 16.1313 22 16V8C22.0002 7.86866 21.9744 7.73857 21.9241 7.61724C21.8738 7.4959 21.8 7.38571 21.707 7.293ZM20 15.586L15.586 20H8.414L4 15.586V8.414L8.414 4H15.586L20 8.414V15.586Z",
    fill: "currentColor"
  })]
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (alertErrorIcon);

/***/ },

/***/ "./src/review-page/icons/alert-warning.js"
/*!************************************************!*\
  !*** ./src/review-page/icons/alert-warning.js ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Figma Alert / warning icon (Frame 30).
 */

const alertWarningIcon = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    d: "M12 3.25L20.5 18.75C20.78 19.25 20.41 19.875 19.83 19.875H4.17C3.59 19.875 3.22 19.25 3.5 18.75L12 3.25Z",
    stroke: "currentColor",
    strokeWidth: "1.5",
    fill: "none"
  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    d: "M11 9H13V14H11V9ZM11 15H13V17H11V15Z",
    fill: "currentColor"
  })]
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (alertWarningIcon);

/***/ },

/***/ "./src/review-page/icons/comment-edit.js"
/*!***********************************************!*\
  !*** ./src/review-page/icons/comment-edit.js ***!
  \***********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Pencil-on-page edit icon for comment actions.
 */

const commentEdit = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  width: "24",
  height: "24",
  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    d: "M7 17.013L11.413 16.998L21.045 7.45802C21.423 7.08003 21.631 6.57802 21.631 6.04402C21.631 5.51002 21.423 5.00802 21.045 4.63002L19.459 3.04402C18.703 2.28802 17.384 2.29202 16.634 3.04102L7 12.583V17.013ZM18.045 4.45802L19.634 6.04102L18.037 7.62302L16.451 6.03802L18.045 4.45802ZM9 13.417L15.03 7.44402L16.616 9.03002L10.587 15.001L9 15.006V13.417Z",
    fill: "#3858E2"
  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    d: "M5 21H19C20.103 21 21 20.103 21 19V10.332L19 12.332V19H8.158C8.132 19 8.105 19.01 8.079 19.01C8.046 19.01 8.013 19.001 7.979 19H5V5H11.847L13.847 3H5C3.897 3 3 3.897 3 5V19C3 20.103 3.897 21 5 21Z",
    fill: "#3858E2"
  })]
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (commentEdit);

/***/ },

/***/ "./src/review-page/icons/comment-more.js"
/*!***********************************************!*\
  !*** ./src/review-page/icons/comment-more.js ***!
  \***********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Vertical more (kebab) menu icon for comment actions.
 */

const commentMore = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    d: "M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z",
    fill: "currentColor"
  })
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (commentMore);

/***/ },

/***/ "./src/review-page/icons/comment-reply.js"
/*!************************************************!*\
  !*** ./src/review-page/icons/comment-reply.js ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Stacked speech-bubble icon for Reply / Add Comment actions.
 * Uses `currentColor` so parent CSS (--wp-admin-theme-color, etc.) controls fill.
 */

const commentReply = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    d: "M5 18V21.766L6.515 20.857L11.277 18H16C17.103 18 18 17.103 18 16V8C18 6.897 17.103 6 16 6H4C2.897 6 2 6.897 2 8V16C2 17.103 2.897 18 4 18H5ZM4 8H16V16H10.723L7 18.234V16H4V8Z",
    fill: "currentColor"
  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    d: "M20 2H8C6.897 2 6 2.897 6 4H18C19.103 4 20 4.897 20 6V14C21.103 14 22 13.103 22 12V4C22 2.897 21.103 2 20 2Z",
    fill: "currentColor"
  })]
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (commentReply);

/***/ },

/***/ "./src/review-page/icons/comment-resolve.js"
/*!**************************************************!*\
  !*** ./src/review-page/icons/comment-resolve.js ***!
  \**************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Resolve action — outlined circle + check by default; solid filled
 * circle + check on hover (see sidebar.scss / popover.scss).
 */

const commentResolve = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  width: "24",
  height: "24",
  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    className: "flow-comment-resolve__default",
    d: "M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12C20 16.411 16.411 20 12 20Z",
    fill: "#458037"
  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    className: "flow-comment-resolve__default",
    d: "M9.99896 13.587L7.69996 11.292L6.28796 12.708L10.001 16.413L16.707 9.70697L15.293 8.29297L9.99896 13.587Z",
    fill: "#458037"
  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    className: "flow-comment-resolve__hover",
    d: "M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM10.001 16.413L6.288 12.708L7.7 11.292L9.999 13.587L15.293 8.293L16.707 9.707L10.001 16.413Z",
    fill: "#458037"
  })]
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (commentResolve);

/***/ },

/***/ "./src/review-page/icons/comment-trash.js"
/*!************************************************!*\
  !*** ./src/review-page/icons/comment-trash.js ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Trash can icon for comment delete actions.
 */

const commentTrash = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsxs)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  width: "24",
  height: "24",
  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    d: "M5 20C5 20.5304 5.21071 21.0391 5.58579 21.4142C5.96086 21.7893 6.46957 22 7 22H17C17.5304 22 18.0391 21.7893 18.4142 21.4142C18.7893 21.0391 19 20.5304 19 20V8H21V6H17V4C17 3.46957 16.7893 2.96086 16.4142 2.58579C16.0391 2.21071 15.5304 2 15 2H9C8.46957 2 7.96086 2.21071 7.58579 2.58579C7.21071 2.96086 7 3.46957 7 4V6H3V8H5V20ZM9 4H15V6H9V4ZM8 8H17V20H7V8H8Z",
    fill: "#C92222"
  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, {
    d: "M9 10H11V18H9V10ZM13 10H15V18H13V10Z",
    fill: "#C92222"
  })]
});
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (commentTrash);

/***/ },

/***/ "./src/review-page/index.js"
/*!**********************************!*\
  !*** ./src/review-page/index.js ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_dom_ready__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/dom-ready */ "@wordpress/dom-ready");
/* harmony import */ var _wordpress_dom_ready__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_dom_ready__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _utils_mount_in_shadow__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/mount-in-shadow */ "./src/review-page/utils/mount-in-shadow.js");
/* harmony import */ var _utils_error_boundary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils/error-boundary */ "./src/review-page/utils/error-boundary.js");
/* harmony import */ var _components_ReviewBar__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./components/ReviewBar */ "./src/review-page/components/ReviewBar.js");
/* harmony import */ var _components_CommentSidebar__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./components/CommentSidebar */ "./src/review-page/components/CommentSidebar.js");
/* harmony import */ var _components_InlineCommentPopover__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./components/InlineCommentPopover */ "./src/review-page/components/InlineCommentPopover.js");
/* harmony import */ var _components_InlineThreadPopover__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./components/InlineThreadPopover */ "./src/review-page/components/InlineThreadPopover.js");
/* harmony import */ var _utils_highlight_manager__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./utils/highlight-manager */ "./src/review-page/utils/highlight-manager.js");
/* harmony import */ var _utils_init_embed_overlays__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./utils/init-embed-overlays */ "./src/review-page/utils/init-embed-overlays.js");
/* harmony import */ var _utils_api__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./utils/api */ "./src/review-page/utils/api.js");
/* harmony import */ var _bar_scss_raw__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./bar.scss?raw */ "./src/review-page/bar.scss?raw");
/* harmony import */ var _sidebar_scss_raw__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./sidebar.scss?raw */ "./src/review-page/sidebar.scss?raw");
/* harmony import */ var _popover_scss_raw__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./popover.scss?raw */ "./src/review-page/popover.scss?raw");
/* harmony import */ var _style_scss__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./style.scss */ "./src/review-page/style.scss");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__);















function BarWithBoundary() {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_utils_error_boundary__WEBPACK_IMPORTED_MODULE_2__["default"], {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_components_ReviewBar__WEBPACK_IMPORTED_MODULE_3__["default"], {})
  });
}
function SidebarWithBoundary() {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_utils_error_boundary__WEBPACK_IMPORTED_MODULE_2__["default"], {
    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_components_CommentSidebar__WEBPACK_IMPORTED_MODULE_4__["default"], {})
  });
}
function PopoverWithBoundary() {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsxs)(_utils_error_boundary__WEBPACK_IMPORTED_MODULE_2__["default"], {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_components_InlineCommentPopover__WEBPACK_IMPORTED_MODULE_5__["default"], {}), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_14__.jsx)(_components_InlineThreadPopover__WEBPACK_IMPORTED_MODULE_6__["default"], {})]
  });
}
_wordpress_dom_ready__WEBPACK_IMPORTED_MODULE_0___default()(() => {
  const barHost = document.getElementById('flow-bar-host');
  const sidebarHost = document.getElementById('flow-sidebar-host');
  if (barHost) (0,_utils_mount_in_shadow__WEBPACK_IMPORTED_MODULE_1__["default"])(barHost, _bar_scss_raw__WEBPACK_IMPORTED_MODULE_10__, BarWithBoundary);
  if (sidebarHost) (0,_utils_mount_in_shadow__WEBPACK_IMPORTED_MODULE_1__["default"])(sidebarHost, _sidebar_scss_raw__WEBPACK_IMPORTED_MODULE_11__, SidebarWithBoundary);
  const popoverHost = document.createElement('div');
  popoverHost.id = 'flow-inline-popover-host';
  document.body.appendChild(popoverHost);
  (0,_utils_mount_in_shadow__WEBPACK_IMPORTED_MODULE_1__["default"])(popoverHost, _popover_scss_raw__WEBPACK_IMPORTED_MODULE_12__, PopoverWithBoundary);
  (0,_utils_highlight_manager__WEBPACK_IMPORTED_MODULE_7__.initHighlights)(_utils_api__WEBPACK_IMPORTED_MODULE_9__.pageData.inlineComments || []);
  (0,_utils_init_embed_overlays__WEBPACK_IMPORTED_MODULE_8__.initEmbedOverlays)();
});

/***/ },

/***/ "./src/review-page/utils/api.js"
/*!**************************************!*\
  !*** ./src/review-page/utils/api.js ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ flowFetch),
/* harmony export */   pageData: () => (/* binding */ pageData)
/* harmony export */ });
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/api-fetch */ "@wordpress/api-fetch");
/* harmony import */ var _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0__);

const pageData = window.flowReviewPage || {};
_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().use(_wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default().createNonceMiddleware(pageData.nonce));

// Build a full URL directly instead of using apiFetch's path/middleware
// machinery — apiFetch resolves `path` against a global default root that
// gets clobbered when multiple bundles register their own root URLs (Free
// page-review + Pro site-review chrome both call `apiFetch.use`, so the
// last-registered root wins for ALL fetches). Building the full URL here
// keeps each adapter's REST calls scoped to its own namespace regardless
// of who else has hooked into apiFetch.
const REST_ROOT = (pageData.restUrl || '').replace(/\/+$/, '') + '/';
function flowFetch(endpoint, options = {}) {
  const url = REST_ROOT + String(endpoint).replace(/^\/+/, '');
  return _wordpress_api_fetch__WEBPACK_IMPORTED_MODULE_0___default()({
    url,
    ...options
  });
}


/***/ },

/***/ "./src/review-page/utils/comment-api.js"
/*!**********************************************!*\
  !*** ./src/review-page/utils/comment-api.js ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   defaultCommentApi: () => (/* binding */ defaultCommentApi)
/* harmony export */ });
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api */ "./src/review-page/utils/api.js");
/* harmony import */ var _invite_comment_identity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./invite-comment-identity */ "./src/review-page/utils/invite-comment-identity.js");
/**
 * Default comment API for the single-post review flow. The popovers
 * (`InlineCommentPopover`, `InlineThreadPopover`) accept this object as the
 * `api` prop with this default so existing call sites keep working unchanged.
 * The site-review chrome (Pro) provides its own implementation that hits the
 * `flow-pro/v1/site-reviews/{id}/comments` namespace with site-review-shaped
 * payloads. Both share the same surface so the popovers stay generic. Surface:
 * postComment( { html, anchorText, blockClientId, parentId } ) → comment row
 * updateComment( id, data ) → comment row
 */


function withInviteIdentity(payload) {
  if (!_api__WEBPACK_IMPORTED_MODULE_0__.pageData?.isEmailInvitee) {
    return payload;
  }
  const email = String(_api__WEBPACK_IMPORTED_MODULE_0__.pageData.inviteEmail || '');
  const name = String(_api__WEBPACK_IMPORTED_MODULE_0__.pageData.inviteDisplayName || '').trim() || email;
  return {
    ...payload,
    authorEmail: email,
    authorName: name
  };
}
const defaultCommentApi = {
  postComment: async payload => {
    await (0,_invite_comment_identity__WEBPACK_IMPORTED_MODULE_1__.ensureInviteCommentIdentity)();
    return (0,_api__WEBPACK_IMPORTED_MODULE_0__["default"])(`reviews/${_api__WEBPACK_IMPORTED_MODULE_0__.pageData.reviewId}/comments`, {
      method: 'POST',
      data: withInviteIdentity(payload)
    });
  },
  updateComment: (id, data) => (0,_api__WEBPACK_IMPORTED_MODULE_0__["default"])(`comments/${id}`, {
    method: 'PATCH',
    data
  }),
  deleteComment: id => (0,_api__WEBPACK_IMPORTED_MODULE_0__["default"])(`comments/${id}`, {
    method: 'DELETE'
  })
};

/***/ },

/***/ "./src/review-page/utils/comment-tree.js"
/*!***********************************************!*\
  !*** ./src/review-page/utils/comment-tree.js ***!
  \***********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildCommentTree: () => (/* binding */ buildCommentTree)
/* harmony export */ });
/**
 * Builds a two-level comment tree from a flat array.
 *
 * Top-level comments (parentId falsy) become roots.
 * Replies (parentId set) are nested under their parent.
 * If a reply references another reply, it is flattened to the nearest root.
 *
 * @param {Array} flatComments - Flat array of comment objects with `id` and `parentId`.
 * @return {Array} Array of root comments, each with a `replies` array.
 */
function buildCommentTree(flatComments) {
  const byId = new Map();
  const roots = [];
  for (const c of flatComments) {
    byId.set(c.id, {
      ...c,
      replies: []
    });
  }
  for (const c of flatComments) {
    const node = byId.get(c.id);
    const parentId = c.parentId || 0;
    if (parentId && byId.has(parentId)) {
      const parent = byId.get(parentId);
      if (parent.parentId && byId.has(parent.parentId)) {
        byId.get(parent.parentId).replies.push(node);
      } else {
        parent.replies.push(node);
      }
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/***/ },

/***/ "./src/review-page/utils/commentable-chrome.js"
/*!*****************************************************!*\
  !*** ./src/review-page/utils/commentable-chrome.js ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   installCommentableChrome: () => (/* binding */ installCommentableChrome),
/* harmony export */   removeCommentableNotice: () => (/* binding */ removeCommentableNotice)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);

const NOTICE_DISMISSED_KEY = 'flow_ew_dismiss_inline_area_hint';
const NOTICE_CLASS = 'flow-review-info-notice';
const INFO_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">' + '<path d="M12 2C6.486 2 2 6.486 2 12C2 17.514 6.486 22 12 22C17.514 22 22 17.514 22 12C22 6.486 17.514 2 12 2ZM12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12C20 16.411 16.411 20 12 20Z" fill="currentColor"/>' + '<path d="M11 11H13V17H11V11ZM11 7H13V9H11V7Z" fill="currentColor"/>' + '</svg>';
const DISMISS_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">' + '<path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95 1.414-1.414 4.95 4.95z"/>' + '</svg>';
function removeCommentableNotice() {
  window.document.querySelector('.' + NOTICE_CLASS)?.remove();
}
function installCommentableChrome(options = {}) {
  const {
    withNotice = true
  } = options;
  if (!withNotice) {
    removeCommentableNotice();
    return;
  }
  const doc = window.document;
  if (!doc?.body) return;
  if (sessionStorage.getItem(NOTICE_DISMISSED_KEY) === '1') return;
  if (doc.querySelector('.' + NOTICE_CLASS)) return;
  const notice = doc.createElement('div');
  notice.className = NOTICE_CLASS + ' is-dismissible';
  notice.setAttribute('role', 'status');
  const icon = doc.createElement('span');
  icon.className = 'flow-review-info-notice__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = INFO_ICON_SVG;
  const content = doc.createElement('div');
  content.className = 'flow-review-info-notice__content';
  const title = doc.createElement('p');
  title.className = 'flow-review-info-notice__title';
  title.textContent = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Add inline comments', 'jumplinks-editorial-workflow');
  const body = doc.createElement('p');
  body.className = 'flow-review-info-notice__text';
  body.textContent = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Highlight text in the content preview, then choose "Add comment".', 'jumplinks-editorial-workflow');
  content.append(title, body);
  const dismiss = doc.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'flow-review-info-notice__dismiss';
  dismiss.setAttribute('aria-label', (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Dismiss', 'jumplinks-editorial-workflow'));
  dismiss.innerHTML = DISMISS_ICON_SVG;
  dismiss.addEventListener('click', () => {
    sessionStorage.setItem(NOTICE_DISMISSED_KEY, '1');
    notice.remove();
  });
  notice.append(icon, content, dismiss);
  doc.body.appendChild(notice);
}

/***/ },

/***/ "./src/review-page/utils/dom-helpers.js"
/*!**********************************************!*\
  !*** ./src/review-page/utils/dom-helpers.js ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   closestFromEventTarget: () => (/* binding */ closestFromEventTarget),
/* harmony export */   eventHitsShadowNode: () => (/* binding */ eventHitsShadowNode),
/* harmony export */   eventInsidePortalUI: () => (/* binding */ eventInsidePortalUI)
/* harmony export */ });
function closestFromEventTarget(target, selector) {
  const el = target?.nodeType === Node.ELEMENT_NODE ? target : target?.parentElement;
  return el?.closest?.(selector) ?? null;
}

/**
 * True when an event originated inside (or on) a node that lives in a Shadow
 * DOM root.
 *
 * Document-level mouse listeners receive `e.target` retargeted to the shadow
 * host element, so a normal `node.contains(e.target)` check would always
 * return false even when the click is on a button rendered inside the
 * shadow. `composedPath()` traverses the shadow boundary correctly, so this
 * helper is the right primitive for "did this event happen inside the
 * popover (or any other shadow-mounted surface)?".
 *
 * Use this anywhere you'd otherwise reach for `popoverRef.current.contains(e.target)`
 * on review-page surfaces (popover, bar, sidebar) — the rule is one place, not
 * scattered across components.
 *
 * @param {Event} event
 * @param {Node|null|undefined} node
 * @return {boolean}
 */
function eventHitsShadowNode(event, node) {
  if (!node || !event) {
    return false;
  }
  const path = typeof event.composedPath === 'function' ? event.composedPath() : null;
  if (!path) {
    return !!node.contains?.(event.target);
  }
  return path.includes(node);
}

/**
 * Was the event triggered from inside a "utility" overlay that's rendered
 * outside the popover's own shadow tree — e.g. a wp-components Popover or
 * DropdownMenu (block-type / alignment / list pickers in the comment editor),
 * an autocomplete suggestion list, or Pro's @mention picker host?
 *
 * The inline-comment popovers register `mousedown` on `document` to close
 * when the user clicks anywhere outside themselves. Without this guard,
 * opening a dropdown inside the comment editor and clicking one of its
 * menu items dismisses the comment popover and the user loses what they
 * were typing, because the menu items live in `document.body` portals
 * outside the shadow root.
 *
 * Add-ons that render their own portal hosts can opt in by setting
 * `data-flow-portal-ui="true"` on the host element.
 *
 * @param {Event} event
 * @return {boolean}
 */
function eventInsidePortalUI(event) {
  if (!event) {
    return false;
  }
  const path = typeof event.composedPath === 'function' ? event.composedPath() : null;
  const probe = path && path.length ? path : event.target ? [event.target] : [];
  for (const node of probe) {
    if (!node || node.nodeType !== 1) continue;
    // `closest` walks ancestors too — works whether `node` is the menu
    // item itself or a child element of it.
    if (node.closest?.('.components-popover, .components-dropdown, [data-flow-portal-ui="true"]')) {
      return true;
    }
  }
  return false;
}

/***/ },

/***/ "./src/review-page/utils/error-boundary.js"
/*!*************************************************!*\
  !*** ./src/review-page/utils/error-boundary.js ***!
  \*************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ErrorBoundary)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);



class ErrorBoundary extends _wordpress_element__WEBPACK_IMPORTED_MODULE_0__.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[Flow Review]', error, info);
  }
  render() {
    if (this.state.error) {
      return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
        style: {
          padding: '12px 16px',
          color: '#8a2424',
          background: '#fbeaea',
          fontSize: '13px'
        },
        children: this.props.fallback || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Something went wrong.', 'jumplinks-editorial-workflow')
      });
    }
    return this.props.children;
  }
}

/***/ },

/***/ "./src/review-page/utils/highlight-manager.js"
/*!****************************************************!*\
  !*** ./src/review-page/utils/highlight-manager.js ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initHighlights: () => (/* binding */ initHighlights)
/* harmony export */ });
/* harmony import */ var _text_anchor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./text-anchor */ "./src/review-page/utils/text-anchor.js");
/* harmony import */ var _dom_helpers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./dom-helpers */ "./src/review-page/utils/dom-helpers.js");
/* harmony import */ var _iframe_bridge__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./iframe-bridge */ "./src/review-page/utils/iframe-bridge.js");
/* harmony import */ var _commentable_chrome__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./commentable-chrome */ "./src/review-page/utils/commentable-chrome.js");
/* harmony import */ var _preview_link_guard__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./preview-link-guard */ "./src/review-page/utils/preview-link-guard.js");





const HIGHLIGHT_CLASS = 'flow-inline-highlight';
const MEDIA_HIGHLIGHT_CLASS = 'flow-inline-highlight-media';
const ACTIVE_CLASS = 'flow-inline-highlight--active';
const RESOLVED_CLASS = 'flow-inline-highlight--resolved';
let allComments = [];
let iframeCleanup = null;
let iframeLinkGuardCleanup = null;
let highlightManagerMode = 'review';
function hasRootInlineComments(comments) {
  return (comments || []).some(c => !c.parentId && c.blockClientId);
}
function onHighlightClick(e) {
  let mark = (0,_dom_helpers__WEBPACK_IMPORTED_MODULE_1__.closestFromEventTarget)(e.target, `.${HIGHLIGHT_CLASS}, .${MEDIA_HIGHLIGHT_CLASS}`);
  if (!mark) {
    const overlay = (0,_dom_helpers__WEBPACK_IMPORTED_MODULE_1__.closestFromEventTarget)(e.target, '.flow-embed-overlay');
    const sibling = overlay?.flowMedia || overlay?.parentElement?.querySelector?.('img, video, iframe') || null;
    if (sibling?.classList?.contains(MEDIA_HIGHLIGHT_CLASS)) {
      mark = sibling;
    }
  }
  if (!mark) {
    return;
  }
  let commentId = Number(mark.dataset.commentId);
  if (!commentId) {
    const ids = (mark.dataset.commentIds || '').split(' ').map(Number).filter(Boolean);
    commentId = ids[ids.length - 1] || 0;
  }
  if (!commentId) {
    return;
  }
  window.dispatchEvent(new CustomEvent('flow:inline-comment-focus', {
    detail: {
      commentId
    }
  }));
}
function queryHighlights(selector) {
  const results = [...document.querySelectorAll(selector)];
  const iframeDoc = (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_2__.getIframeDoc)();
  if (iframeDoc) {
    results.push(...iframeDoc.querySelectorAll(selector));
  }
  return results;
}
function hasCommentId(el, commentId) {
  if (Number(el.dataset.commentId) === commentId) {
    return true;
  }
  const ids = (el.dataset.commentIds || '').split(' ').map(Number).filter(Boolean);
  return ids.includes(commentId);
}
function queryHighlightedByCommentId(commentId) {
  const selector = `.${HIGHLIGHT_CLASS}, .${MEDIA_HIGHLIGHT_CLASS}`;
  const all = queryHighlights(selector);
  return all.filter(el => hasCommentId(el, commentId));
}
function addCommentId(el, commentId) {
  const ids = new Set((el.dataset.commentIds || '').split(' ').map(Number).filter(Boolean));
  ids.add(commentId);
  el.dataset.commentIds = Array.from(ids).join(' ');
}
function removeCommentId(el, commentId) {
  const ids = (el.dataset.commentIds || '').split(' ').map(Number).filter(Boolean).filter(id => id !== commentId);
  if (ids.length) {
    el.dataset.commentIds = ids.join(' ');
  } else {
    delete el.dataset.commentIds;
  }
}
function applyMediaHighlight(commentId, descriptor, optionalRoot) {
  const media = (0,_text_anchor__WEBPACK_IMPORTED_MODULE_0__.resolveMediaNode)(descriptor, optionalRoot);
  if (!media) {
    return null;
  }
  media.classList.add(MEDIA_HIGHLIGHT_CLASS);
  addCommentId(media, commentId);
  return media;
}
function findMark(commentId) {
  const selector = `.${HIGHLIGHT_CLASS}[data-comment-id="${commentId}"], .${MEDIA_HIGHLIGHT_CLASS}`;
  const iframeDoc = (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_2__.getIframeDoc)();
  if (iframeDoc) {
    const inIframe = [...iframeDoc.querySelectorAll(selector)].find(el => hasCommentId(el, commentId));
    if (inIframe) {
      return {
        mark: inIframe,
        inIframe: true
      };
    }
  }
  const inDoc = [...document.querySelectorAll(selector)].find(el => hasCommentId(el, commentId));
  if (inDoc) {
    return {
      mark: inDoc,
      inIframe: false
    };
  }
  return null;
}
function handleAdd(e) {
  const {
    commentId,
    rangeDescriptor
  } = e.detail || {};
  if (!commentId || !rangeDescriptor) {
    return;
  }
  if (['image', 'video', 'embed'].includes(rangeDescriptor?.type)) {
    applyMediaHighlight(commentId, rangeDescriptor);
    return;
  }
  const range = (0,_text_anchor__WEBPACK_IMPORTED_MODULE_0__.deserializeRange)(rangeDescriptor);
  if (range) {
    (0,_text_anchor__WEBPACK_IMPORTED_MODULE_0__.wrapRange)(range, commentId);
  }
}
function handleResolve(e) {
  const {
    commentId
  } = e.detail || {};
  if (!commentId) {
    return;
  }
  queryHighlightedByCommentId(commentId).forEach(mark => mark.classList.add(RESOLVED_CLASS));
}
function handleRemove(e) {
  const {
    commentId
  } = e.detail || {};
  if (!commentId) {
    return;
  }
  (0,_text_anchor__WEBPACK_IMPORTED_MODULE_0__.clearHighlight)(commentId);
  queryHighlights(`.${MEDIA_HIGHLIGHT_CLASS}`).forEach(media => {
    if (!hasCommentId(media, commentId)) {
      return;
    }
    removeCommentId(media, commentId);
    if (!media.dataset.commentIds) {
      media.classList.remove(MEDIA_HIGHLIGHT_CLASS, ACTIVE_CLASS, RESOLVED_CLASS);
    }
  });
}
function handleScrollTo(e) {
  const {
    commentId
  } = e.detail || {};
  if (!commentId) {
    return;
  }
  queryHighlights(`.${ACTIVE_CLASS}`).forEach(el => el.classList.remove(ACTIVE_CLASS));
  const found = findMark(commentId);
  if (!found) {
    return;
  }
  found.mark.classList.add(ACTIVE_CLASS);
  found.mark.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
  setTimeout(() => found.mark.classList.remove(ACTIVE_CLASS), 2000);
}
function wrapCommentsInRoot(contentRoot, comments) {
  if (!contentRoot) {
    return;
  }
  const doc = contentRoot.ownerDocument || document;
  const roots = (comments || []).filter(c => !c.parentId && c.blockClientId);
  for (const c of roots) {
    if (contentRoot.querySelector(`.${HIGHLIGHT_CLASS}[data-comment-id="${c.id}"]`) || doc.body && doc.body.querySelector(`.${HIGHLIGHT_CLASS}[data-comment-id="${c.id}"]`)) {
      continue;
    }
    try {
      const descriptor = JSON.parse(c.blockClientId);
      // Pick the root the descriptor was serialized against. Title /
      // metadata comments live outside `.entry-content` and were
      // anchored to <body> at serialize time — they need the same root
      // at wrap time or path resolution silently fails.
      const effectiveRoot = descriptor?.rootType === 'body' && doc.body ? doc.body : contentRoot;
      if (['image', 'video', 'embed'].includes(descriptor?.type)) {
        const media = applyMediaHighlight(c.id, descriptor, effectiveRoot);
        if (media && c.isResolved) {
          media.classList.add(RESOLVED_CLASS);
        }
        continue;
      }
      const range = (0,_text_anchor__WEBPACK_IMPORTED_MODULE_0__.deserializeRange)(descriptor, effectiveRoot);
      if (range) {
        const mark = (0,_text_anchor__WEBPACK_IMPORTED_MODULE_0__.wrapRange)(range, c.id);
        if (mark && c.isResolved) {
          mark.classList.add(RESOLVED_CLASS);
        }
      }
    } catch {
      // descriptor parse failed
    }
  }
}

/**
 * Attach the highlight manager to a target document — handles style
 * injection, root resolution, initial wrap of existing comments, click
 * delegation, and re-wrap on DOM mutations. Shared between the per-post
 * iframe path (`handleIframeReady`) and the site-review live-document
 * path (`attachManagerToLiveDocument`).
 *
 * @param {Document} doc
 * @param {{ skipLinkGuard?: boolean, withNotice?: boolean }} [options]
 * @returns {() => void} Cleanup function that detaches everything attached here.
 */
function attachManagerToDoc(doc, options = {}) {
  if (!doc) return () => {};
  const {
    skipLinkGuard = false,
    withNotice = true
  } = options;
  (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_2__.injectHighlightStyles)(doc);
  let linkGuardCleanup = null;
  if (!skipLinkGuard) {
    linkGuardCleanup = (0,_preview_link_guard__WEBPACK_IMPORTED_MODULE_4__.installPreviewLinkGuard)(doc);
  } else if (doc.documentElement) {
    doc.documentElement.classList.add('flow-clickable-links');
  }
  const wrapRoot = (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_2__.resolveCommentContentRoot)(doc) || doc.body;
  const clickRoot = doc.body || doc.documentElement;
  if (!wrapRoot || !clickRoot) {
    return () => {
      if (linkGuardCleanup) linkGuardCleanup();
    };
  }
  wrapCommentsInRoot(wrapRoot, allComments);
  if (withNotice) {
    (0,_commentable_chrome__WEBPACK_IMPORTED_MODULE_3__.installCommentableChrome)({
      withNotice: !hasRootInlineComments(allComments)
    });
  }
  let rewrapTimer = null;
  const scheduleRewrap = () => {
    clearTimeout(rewrapTimer);
    rewrapTimer = window.setTimeout(() => {
      wrapCommentsInRoot(wrapRoot, allComments);
    }, 150);
  };
  const mo = new MutationObserver(scheduleRewrap);
  mo.observe(wrapRoot, {
    childList: true,
    subtree: true
  });
  clickRoot.addEventListener('click', onHighlightClick);
  return () => {
    clearTimeout(rewrapTimer);
    mo.disconnect();
    clickRoot.removeEventListener('click', onHighlightClick);
    if (linkGuardCleanup) linkGuardCleanup();
  };
}
function handleIframeReady(e) {
  const iframe = e.detail?.iframe;
  if (!iframe?.contentDocument) {
    return;
  }
  if (iframeLinkGuardCleanup) {
    iframeLinkGuardCleanup();
    iframeLinkGuardCleanup = null;
  }
  if (iframeCleanup) {
    iframeCleanup();
    iframeCleanup = null;
  }
  (0,_commentable_chrome__WEBPACK_IMPORTED_MODULE_3__.removeCommentableNotice)();
  iframeCleanup = attachManagerToDoc(iframe.contentDocument, {
    skipLinkGuard: highlightManagerMode === 'site-review',
    withNotice: highlightManagerMode !== 'site-review'
  });
}
function handleIframeRemoved() {
  if (iframeCleanup) {
    iframeCleanup();
    iframeCleanup = null;
  }
}
function handleCommentAdded(e) {
  const {
    comment
  } = e.detail || {};
  if (comment) {
    allComments = [...allComments, comment];
  }
}
function handleCommentResolved(e) {
  const {
    commentId
  } = e.detail || {};
  if (commentId) {
    allComments = allComments.map(c => Number(c.id) === Number(commentId) ? {
      ...c,
      isResolved: true
    } : c);
  }
}
function handleCommentUpdated(e) {
  const {
    id,
    html
  } = e.detail || {};
  if (!id) {
    return;
  }
  const nid = Number(id);
  allComments = allComments.map(c => Number(c.id) === nid ? {
    ...c,
    html
  } : c);
}
function handleCommentDeleted(e) {
  const {
    id
  } = e.detail || {};
  if (!id) {
    return;
  }
  const nid = Number(id);
  allComments = allComments.filter(c => Number(c.id) !== nid);
}

/**
 * @param {Array} inlineComments
 * @param {object} [options]
 * @param {'review'|'site-review'} [options.mode]
 *   `'review'` (default): per-post chrome — `preview-link-guard` is
 *   installed inside the iframe so reviewers can't navigate away from
 *   the previewed post.
 *   `'site-review'`: skip the link guard so the reviewer can browse the
 *   site inside the iframe via the theme's regular menus. The iframe
 *   keeps firing `flow:iframe-ready` on every navigation, so the manager
 *   re-binds each new page.
 */
function initHighlights(inlineComments, options = {}) {
  allComments = [...(inlineComments || [])];
  highlightManagerMode = options.mode === 'site-review' ? 'site-review' : 'review';
  window.addEventListener('flow:highlight-add', handleAdd);
  window.addEventListener('flow:highlight-resolve', handleResolve);
  window.addEventListener('flow:highlight-remove', handleRemove);
  window.addEventListener('flow:scroll-to-highlight', handleScrollTo);
  window.addEventListener('flow:iframe-ready', handleIframeReady);
  window.addEventListener('flow:iframe-removed', handleIframeRemoved);
  window.addEventListener('flow:inline-comment-added', handleCommentAdded);
  window.addEventListener('flow:inline-comment-resolved', handleCommentResolved);
  window.addEventListener('flow:inline-comment-updated', handleCommentUpdated);
  window.addEventListener('flow:inline-comment-deleted', handleCommentDeleted);
  window.addEventListener('flow:inline-comments-reset', handleCommentsReset);
}
function handleCommentsReset(e) {
  const next = e.detail?.comments;
  if (!Array.isArray(next)) return;
  allComments = [...next];
  const doc = (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_2__.getIframeDoc)();
  if (!doc) return;
  const wrapRoot = (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_2__.resolveCommentContentRoot)(doc) || doc.body;
  if (!wrapRoot) return;
  const existing = wrapRoot.querySelectorAll(`.${HIGHLIGHT_CLASS}[data-comment-id], .${MEDIA_HIGHLIGHT_CLASS}[data-comment-id]`);
  const liveIds = new Set(allComments.map(c => Number(c.id)));
  existing.forEach(el => {
    const id = Number(el.getAttribute('data-comment-id'));
    if (!liveIds.has(id)) {
      (0,_text_anchor__WEBPACK_IMPORTED_MODULE_0__.clearHighlight)(el);
    }
  });
  wrapCommentsInRoot(wrapRoot, allComments);
}

/***/ },

/***/ "./src/review-page/utils/iframe-bridge.js"
/*!************************************************!*\
  !*** ./src/review-page/utils/iframe-bridge.js ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   clearIframe: () => (/* binding */ clearIframe),
/* harmony export */   getActiveContentRoot: () => (/* binding */ getActiveContentRoot),
/* harmony export */   getIframe: () => (/* binding */ getIframe),
/* harmony export */   getIframeDoc: () => (/* binding */ getIframeDoc),
/* harmony export */   getIframeScale: () => (/* binding */ getIframeScale),
/* harmony export */   injectHighlightStyles: () => (/* binding */ injectHighlightStyles),
/* harmony export */   rectToPageCoords: () => (/* binding */ rectToPageCoords),
/* harmony export */   resolveCommentContentRoot: () => (/* binding */ resolveCommentContentRoot),
/* harmony export */   resolveContentRootFor: () => (/* binding */ resolveContentRootFor),
/* harmony export */   setIframe: () => (/* binding */ setIframe)
/* harmony export */ });
let currentIframe = null;
function resolveCommentContentRoot(doc, containedNode = null) {
  if (!doc?.querySelector) {
    return null;
  }
  const preview = doc.querySelector('.flow-preview-content');
  if (preview && (containedNode === null || preview.contains(containedNode))) {
    return preview;
  }
  const pickLongest = scope => {
    if (!scope?.querySelectorAll) {
      return null;
    }
    const candidates = scope.querySelectorAll('.entry-content, .wp-block-post-content, .product.type-product');
    let best = null;
    let bestLen = -1;
    for (const el of candidates) {
      if (containedNode !== null && !el.contains(containedNode)) {
        continue;
      }
      const len = (el.textContent || '').replace(/\s+/g, ' ').trim().length;
      if (len > bestLen) {
        bestLen = len;
        best = el;
      }
    }
    return best;
  };
  return pickLongest(doc.querySelector('main')) || pickLongest(doc.querySelector('article')) || pickLongest(doc.body);
}
function setIframe(iframe) {
  currentIframe = iframe;
}
function clearIframe() {
  currentIframe = null;
}
function getIframe() {
  return currentIframe;
}
function getIframeDoc() {
  try {
    return currentIframe?.contentDocument || null;
  } catch {
    return null;
  }
}
function getActiveContentRoot() {
  const iframeDoc = getIframeDoc();
  if (iframeDoc) {
    const root = resolveCommentContentRoot(iframeDoc);
    if (root) return root;
  }
  return resolveCommentContentRoot(document);
}

// Markup that identifies "this is the post" — title, byline, content, meta,
// everything editorially owned by the post. Combines semantic wrappers
// (`<article>`, `<main>`, WordPress's `post_class()` output, `id="post-N"`)
// with the canonical title/meta classes WP itself emits — those cover block
// themes / classic themes that render the title outside any wrapper.
const POST_WRAPPER_SELECTOR = ['article', 'main', '[class~="type-post"]', '[class~="type-page"]', '[class~="type-product"]', '[class~="type-attachment"]', '[id^="post-"]', '.entry-title', '.entry-header', '.entry-meta', '.wp-block-post-title'].join(',');
const POST_REGION_SELECTOR = '.flow-preview-content, .entry-content, .wp-block-post-content, .product.type-product';
function resolveContentRootFor(doc, node) {
  if (!doc || !node) return null;
  const direct = resolveCommentContentRoot(doc, node);
  if (direct) return direct;
  // Selection is outside the post body. Accept it if it's still inside
  // the post's wrapper — title, byline, categories, etc. — and anchor to
  // `<body>` (rootType: 'body' on the descriptor). Reject otherwise so
  // nav/footer/sidebar selections never become comments.
  const targetEl = node.nodeType === 1 ? node : node.parentElement;
  if (targetEl && targetEl.closest(POST_WRAPPER_SELECTOR) && doc.body) {
    return doc.body;
  }
  const hasAnyRoot = !!doc.querySelector(POST_REGION_SELECTOR);
  if (hasAnyRoot) return null;
  return doc.body || null;
}

/**
 * Current visual scale of the content iframe. ReviewBar applies `transform:
 * scale(s)` so the iframe's CSS width can stay at the full browser width
 * (content renders at a desktop viewport) while visually fitting the area
 * beside the sidebar. Anywhere we map a coordinate from inside the iframe to
 * the parent document needs to multiply by this factor. Derived from
 * `boundingRect.width / offsetWidth` rather than a stored value so we always
 * read the current state — no risk of using a stale scale if resize /
 * sidebar-toggle handlers haven't run yet.
 */
function getIframeScale() {
  if (!currentIframe) return 1;
  const cssW = currentIframe.offsetWidth;
  if (!cssW) return 1;
  const visualW = currentIframe.getBoundingClientRect().width;
  return visualW / cssW;
}
function rectToPageCoords(rect, inIframe) {
  if (!inIframe || !currentIframe) {
    return {
      top: rect.top + window.scrollY,
      bottom: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    };
  }
  const iframeRect = currentIframe.getBoundingClientRect();
  const s = getIframeScale();
  return {
    top: rect.top * s + iframeRect.top + window.scrollY,
    bottom: rect.bottom * s + iframeRect.top + window.scrollY,
    left: rect.left * s + iframeRect.left + window.scrollX,
    width: rect.width * s,
    height: rect.height * s
  };
}
const HIGHLIGHT_CSS = `
.flow-inline-highlight {
	background: rgba(255, 212, 59, 0.35);
	/* box-shadow underline — same visual as border-bottom but doesn't push
	   the line box, so wrapping text doesn't reflow when a highlight lands. */
	box-shadow: inset 0 -2px 0 rgba(255, 183, 0, 0.6);
	cursor: pointer;
	border-radius: 2px;
	transition: background 0.2s ease, box-shadow 0.2s ease;
}
.flow-inline-highlight:hover {
	background: rgba(255, 212, 59, 0.55);
}
.flow-inline-highlight--active {
	background: rgba(255, 183, 0, 0.55);
	box-shadow: inset 0 -2px 0 #e69500;
}
.flow-inline-highlight--resolved {
	background: rgba(130, 214, 142, 0.3);
	box-shadow: inset 0 -2px 0 rgba(130, 214, 142, 0.5);
}
.flow-inline-highlight--resolved:hover {
	background: rgba(130, 214, 142, 0.45);
}
img.flow-inline-highlight-media,
video.flow-inline-highlight-media,
iframe.flow-inline-highlight-media {
	cursor: pointer;
}
.flow-inline-highlight-media ~ .flow-embed-overlay {
	outline: 3px solid rgba(255, 183, 0, 0.75);
	outline-offset: -3px;
}
.flow-inline-highlight-media.flow-inline-highlight--active ~ .flow-embed-overlay {
	outline-color: #e69500;
}
.flow-inline-highlight-media.flow-inline-highlight--resolved ~ .flow-embed-overlay {
	outline-color: rgba(130, 214, 142, 0.8);
}
a[href] {
	cursor: text;
	-webkit-user-select: text;
	user-select: text;
}
html.flow-clickable-links a[href] {
	cursor: pointer;
}
/* Elementor's decorative overlay/shape layers sit absolutely positioned over
 * section content and intercept mouse drags, so text-selection never reaches
 * the heading/paragraphs underneath. Make them inert on the review page —
 * visual rendering is unaffected. */
.elementor-background-overlay,
.elementor-shape {
	pointer-events: none;
}
`;
function injectHighlightStyles(iframeDoc) {
  if (!iframeDoc?.head) return;
  const style = iframeDoc.createElement('style');
  style.textContent = HIGHLIGHT_CSS;
  iframeDoc.head.appendChild(style);
}

/***/ },

/***/ "./src/review-page/utils/init-embed-overlays.js"
/*!******************************************************!*\
  !*** ./src/review-page/utils/init-embed-overlays.js ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   attachToDoc: () => (/* binding */ attachToDoc),
/* harmony export */   initEmbedOverlays: () => (/* binding */ initEmbedOverlays)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _iframe_bridge__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./iframe-bridge */ "./src/review-page/utils/iframe-bridge.js");
/**
 * Add a "Click to comment" / "View comment" overlay over media in the review
 * page (iframes, images, videos). Gives users a consistent hover affordance
 * and, for embed iframes, prevents the cross-origin player from intercepting
 * clicks (which would play the video instead of opening the popover). The
 * review page's post-preview content lives inside a content iframe
 * (`#flow-template-frame`) created by ReviewBar. We scan THAT iframe's
 * contentDocument, not the main document — the only iframe in the main
 * document body is the content iframe itself, which we must never wrap. Each
 * media element gets wrapped in a `<span class="flow-embed-wrap">` that
 * matches its box exactly, plus an absolute-positioned `<span
 * class="flow-embed-overlay">` covering it. Iframes additionally get
 * `pointer-events: none` so YouTube/Vimeo can't capture the click first; for
 * img/video we skip that since their built-in click behavior is benign. The
 * InlineCommentPopover and highlight-manager click handlers resolve the
 * overlay back to its media sibling (img/video/iframe) when handling clicks.
 */


const WRAPPED_FLAG = 'flowEmbedWrapped';

// CSS injected into the content iframe (where embeds live). The outer
// review-page stylesheet doesn't reach into iframe documents.
const OVERLAY_CSS = `
.flow-embed-wrap {
	display: inline-block;
	line-height: 0;
	max-width: 100%;
	position: relative;
	vertical-align: top;
}
.flow-embed-wrap > iframe {
	display: block;
	max-width: 100%;
}
.flow-embed-overlay {
	align-items: center;
	background: transparent;
	border: 0;
	cursor: pointer;
	display: flex;
	inset: 0;
	justify-content: center;
	position: absolute;
	transition: background-color 0.15s ease;
	z-index: 2;
}
.flow-embed-overlay:hover,
.flow-embed-overlay:focus-visible {
	background: rgba(0, 0, 0, 0.25);
}
.flow-embed-overlay:hover .flow-embed-overlay__hint,
.flow-embed-overlay:focus-visible .flow-embed-overlay__hint {
	opacity: 1;
}
.flow-embed-overlay:focus-visible {
	outline: 2px solid #2271b1;
	outline-offset: -2px;
}
.flow-embed-overlay__hint {
	background: rgba(0, 0, 0, 0.7);
	border-radius: 4px;
	color: #ffffff;
	font: 500 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	opacity: 0;
	padding: 8px 14px;
	pointer-events: none;
	transition: opacity 0.15s ease;
}
/* Secondary corner pill — shared style between the "Play" affordance (for
   video media) and the "Go to link" affordance (for images wrapped in a
   link on site review). Sized to roughly match the centered comment hint
   so the two affordances feel like peers. !important on positioning
   properties defends against theme button-styling rules that would
   otherwise override right/top/etc. and yank the pill out of the
   overlay's top-right corner. */
.flow-embed-overlay__play-pill,
.flow-embed-overlay__link-pill {
	align-items: center;
	background: rgba(0, 0, 0, 0.75);
	border: 0;
	border-radius: 4px;
	color: #ffffff;
	cursor: pointer;
	display: inline-flex;
	font: 500 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	gap: 8px;
	opacity: 0;
	padding: 8px 14px;
	pointer-events: auto;
	position: absolute !important;
	right: 8px !important;
	top: 8px !important;
	left: auto !important;
	bottom: auto !important;
	margin: 0 !important;
	transform: none !important;
	transition: background-color 0.15s ease, opacity 0.15s ease;
}
.flow-embed-overlay:hover .flow-embed-overlay__play-pill,
.flow-embed-overlay:focus-within .flow-embed-overlay__play-pill,
.flow-embed-overlay:hover .flow-embed-overlay__link-pill,
.flow-embed-overlay:focus-within .flow-embed-overlay__link-pill {
	opacity: 1;
}
.flow-embed-overlay__play-pill:hover,
.flow-embed-overlay__play-pill:focus-visible,
.flow-embed-overlay__link-pill:hover,
.flow-embed-overlay__link-pill:focus-visible {
	background: rgba(0, 0, 0, 0.92);
	outline: 0;
}
.flow-embed-overlay__play-pill svg,
.flow-embed-overlay__link-pill svg {
	display: block;
}
/* Persistent comment pin shown only after Play has been activated. Sits in
   the top-right so the reviewer can still drop a comment while the native
   player is in charge. */
.flow-embed-overlay__comment-pin {
	align-items: center;
	background: rgba(0, 0, 0, 0.75);
	border-radius: 50%;
	color: #ffffff;
	cursor: pointer;
	display: none;
	height: 36px;
	justify-content: center;
	pointer-events: auto;
	position: absolute;
	right: 8px;
	top: 8px;
	transition: background-color 0.15s ease;
	width: 36px;
}
.flow-embed-overlay__comment-pin:hover,
.flow-embed-overlay__comment-pin:focus-visible {
	background: rgba(0, 0, 0, 0.92);
	outline: 0;
}
.flow-embed-overlay__comment-pin svg {
	display: block;
}
/* Playing state: overlay backs off so the native player takes clicks, but
   the corner comment pin remains interactive. */
.flow-embed-overlay.is-playing {
	pointer-events: none;
}
.flow-embed-overlay.is-playing:hover,
.flow-embed-overlay.is-playing:focus-visible {
	background: transparent;
}
.flow-embed-overlay.is-playing .flow-embed-overlay__hint,
.flow-embed-overlay.is-playing .flow-embed-overlay__play-pill {
	display: none;
}
.flow-embed-overlay.is-playing .flow-embed-overlay__comment-pin {
	display: inline-flex;
}
/* Highlight ring renders as an inset outline on the overlay (sibling of the
   commented media). Same selector for both layouts (wrapped + positioned)
   so every kind of media gets the same look — no parent-overflow clipping
   issues since the outline is inside the overlay's own box. */
.flow-inline-highlight-media ~ .flow-embed-overlay {
	outline: 3px solid rgba(255, 183, 0, 0.75);
	outline-offset: -3px;
}
.flow-inline-highlight-media.flow-inline-highlight--active ~ .flow-embed-overlay {
	outline-color: #e69500;
}
.flow-inline-highlight-media.flow-inline-highlight--resolved ~ .flow-embed-overlay {
	outline-color: rgba(130, 214, 142, 0.8);
}
`;
function injectOverlayStyles(doc) {
  if (!doc?.head) {
    return;
  }
  if (doc.querySelector('#flow-embed-overlay-styles')) {
    return;
  }
  const style = doc.createElement('style');
  style.id = 'flow-embed-overlay-styles';
  style.textContent = OVERLAY_CSS;
  doc.head.appendChild(style);
}

// IDs of iframes the plugin itself injects — never wrap these.
const SKIP_IDS = new Set(['flow-template-frame', 'wp-auth-check-frame']);
const HINT_DEFAULT = 'Click to comment';
const HINT_HAS_COMMENT = 'View comment';
const HIGHLIGHT_CLASS = 'flow-inline-highlight-media';

// Iframe sources we recognise as video players. Matched against the iframe
// `src` to decide whether to render a Play affordance — generic iframes
// (forms, embeds, gists, etc.) get the comment-only overlay as before.
const VIDEO_IFRAME_HOST_RE = /(?:youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com|player\.vimeo\.com|dailymotion\.com|wistia\.com|wistia\.net|fast\.wistia\.net|twitch\.tv|player\.twitch\.tv|video\.wordpress\.com|videopress\.com|loom\.com|brightcove\.net|tiktok\.com|fb\.watch|facebook\.com\/plugins\/video)/i;
function isVideoMedia(media) {
  if (media.tagName === 'VIDEO') {
    return true;
  }
  if (media.tagName === 'IFRAME') {
    const src = media.getAttribute('src') || media.getAttribute('data-src') || '';
    return VIDEO_IFRAME_HOST_RE.test(src);
  }
  return false;
}
const PLAY_SVG = '<svg width="12" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21"/></svg>';
const COMMENT_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
const LINK_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

/**
 * True when the overlay module is running inside the site-review chrome.
 * The chrome's bootstrap localizes `window.flowSiteReview` before any
 * bundle runs; the per-post review path never sets it. Used to decide
 * whether to render the "Go to link" affordance on images wrapped in
 * anchor tags — site-review reviewers browse the live site, so the link
 * guard is off there and a default click on a linked image would
 * otherwise yank them away from the comment they were trying to leave.
 */
function isSiteReviewMode() {
  return typeof window !== 'undefined' && !!(window.flowSiteReview && typeof window.flowSiteReview === 'object');
}

/**
 * Build the "Go to link" pill button. Extracted so we can call it from
 * `createOverlay` at initial render AND from the post-`load` recheck for
 * lazy-loaded images whose `<a>` ancestor wasn't observable at scan time
 * (some lazy-load libraries swap the wrapper element when the image
 * actually loads).
 */
function buildLinkPill(doc, href, target) {
  const link = doc.createElement('button');
  link.type = 'button';
  link.className = 'flow-embed-overlay__link-pill';
  link.setAttribute('aria-label', (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Go to link', 'jumplinks-editorial-workflow'));
  link.innerHTML = LINK_SVG + '<span>' + (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Go to link', 'jumplinks-editorial-workflow') + '</span>';
  link.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const win = doc.defaultView;
    if (!win) {
      return;
    }
    // Respect target="_blank" — open in a new tab — otherwise navigate
    // the iframe in place (the site-review chrome picks up the new
    // page via `flow:iframe-ready`).
    if ('_blank' === target) {
      win.open(href, '_blank');
    } else {
      win.location.assign(href);
    }
  });
  return link;
}

/**
 * Idempotent install of the "swallow the default link follow but let the
 * click bubble so the comment popover still opens" handler. Marked with a
 * dataset flag so re-calling on lazy-loaded images doesn't pile up
 * duplicate listeners.
 *
 * Uses capture + stopPropagation so theme document bubble listeners
 * (custom video lightboxes, etc.) cannot open a popin over the comment UI.
 * InlineCommentPopover listens in capture on `document` and runs first.
 */
function ensureLinkClickBlocker(overlay) {
  if (overlay.dataset.flowLinkBlockerInstalled === '1') {
    return;
  }
  overlay.dataset.flowLinkBlockerInstalled = '1';
  overlay.addEventListener('click', e => {
    if (e.target.closest?.('.flow-embed-overlay__play-pill, .flow-embed-overlay__link-pill')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }, true);
}
function createOverlay(doc, opts = {}) {
  const overlay = doc.createElement('span');
  overlay.className = 'flow-embed-overlay';
  overlay.setAttribute('role', 'button');
  overlay.setAttribute('aria-label', 'Click to leave a comment on this embed');
  overlay.tabIndex = 0;
  const hint = doc.createElement('span');
  hint.className = 'flow-embed-overlay__hint';
  hint.textContent = HINT_DEFAULT;
  overlay.appendChild(hint);
  if (opts.isVideo) {
    const play = doc.createElement('button');
    play.type = 'button';
    play.className = 'flow-embed-overlay__play-pill';
    play.setAttribute('aria-label', (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Play video', 'jumplinks-editorial-workflow'));
    play.innerHTML = PLAY_SVG + '<span>' + (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Play', 'jumplinks-editorial-workflow') + '</span>';
    play.addEventListener('click', e => {
      // Don't let the click bubble to the overlay surface — that would
      // open the comment popover instead of starting playback.
      e.preventDefault();
      e.stopPropagation();
      activatePlayMode(overlay);
    });
    overlay.appendChild(play);

    // Persistent comment affordance for the playing state — the overlay
    // itself becomes non-blocking once Play is hit, so the reviewer needs
    // a dedicated target to re-engage commenting mid-playback. Clicks
    // here bubble normally; the existing document-level handler resolves
    // the click via `closest('.flow-embed-overlay')`.
    const pin = doc.createElement('span');
    pin.className = 'flow-embed-overlay__comment-pin';
    pin.setAttribute('role', 'button');
    pin.setAttribute('aria-label', 'Click to leave a comment on this video');
    pin.tabIndex = 0;
    pin.innerHTML = COMMENT_SVG;
    pin.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pin.click();
      }
    });
    overlay.appendChild(pin);
  }
  if (opts.linkHref) {
    overlay.appendChild(buildLinkPill(doc, opts.linkHref, opts.linkTarget || ''));
  }
  overlay.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      overlay.click();
    }
  });
  return overlay;
}

/**
 * Hand the underlying media over to its native player. For `<video>` we kick
 * playback ourselves; for iframes we drop the pointer-events guard so the
 * embedded player handles clicks, and best-effort add `autoplay=1` for
 * providers that honor it (YouTube/Vimeo/Wistia/Twitch all do). Some hosts
 * will trigger a reload to apply the query param — acceptable trade for a
 * one-click experience on the common case.
 */
function activatePlayMode(overlay) {
  overlay.classList.add('is-playing');
  const media = overlay.flowMedia;
  if (!media) {
    return;
  }
  if (media.tagName === 'VIDEO') {
    try {
      const result = media.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    } catch (_err) {
      // Older browsers may throw synchronously when playback can't
      // start — the native controls remain accessible regardless.
    }
    return;
  }
  if (media.tagName === 'IFRAME') {
    media.style.pointerEvents = '';
    const src = media.getAttribute('src') || '';
    if (src && !/[?&]autoplay=1\b/.test(src)) {
      const sep = src.includes('?') ? '&' : '?';
      media.setAttribute('src', src + sep + 'autoplay=1');
    }
  }
}
function updateHintForIframe(iframe, overlay) {
  const hint = overlay?.querySelector('.flow-embed-overlay__hint');
  if (!hint) {
    return;
  }
  const hasComment = iframe.classList.contains(HIGHLIGHT_CLASS);
  hint.textContent = hasComment ? HINT_HAS_COMMENT : HINT_DEFAULT;
  overlay.setAttribute('aria-label', hasComment ? 'View existing comment on this embed' : 'Click to leave a comment on this embed');
}
function watchHighlightChanges(iframe, overlay) {
  updateHintForIframe(iframe, overlay);
  const obs = new MutationObserver(() => {
    updateHintForIframe(iframe, overlay);
  });
  obs.observe(iframe, {
    attributes: true,
    attributeFilter: ['class']
  });
  return obs;
}
function wrapMedia(media) {
  if (media.dataset[WRAPPED_FLAG]) {
    return;
  }
  if (SKIP_IDS.has(media.id)) {
    return;
  }
  const tag = media.tagName;
  const isIframe = tag === 'IFRAME';
  const w = media.getAttribute('width');
  const h = media.getAttribute('height');
  if (w === '0' || h === '0' || w === '1' || h === '1') {
    return;
  }
  if (tag === 'IMG' && media.classList.contains('emoji')) {
    return;
  }
  if (media.getAttribute('aria-hidden') === 'true') {
    return;
  }
  if (media.hasAttribute('data-no-flow-overlay')) {
    return;
  }
  if (isIframe) {
    const src = media.getAttribute('src') || '';
    if (/\/recaptcha\//i.test(src) || media.title === 'reCAPTCHA') {
      return;
    }
  }
  const doc = media.ownerDocument;
  const view = doc.defaultView;
  const parent = media.parentNode;
  if (!parent || !view) {
    return;
  }
  const cs0 = view.getComputedStyle(media);
  if (cs0.display === 'none' || cs0.visibility === 'hidden') {
    return;
  }
  if (media.offsetWidth === 0 && media.offsetHeight === 0) {
    return;
  }
  media.dataset[WRAPPED_FLAG] = '1';
  const cs = view.getComputedStyle(media);
  const isPositioned = cs.position === 'absolute' || cs.position === 'fixed';

  // Image-in-link detection (site-review only). On the per-post review
  // chrome the link guard intercepts navigation globally, so this is
  // strictly a site-review concern.
  const linkAncestor = tag === 'IMG' && isSiteReviewMode() ? media.closest('a[href]') : null;
  const linkHref = linkAncestor ? (linkAncestor.getAttribute('href') || '').trim() : '';
  const linkTarget = linkAncestor ? linkAncestor.getAttribute('target') || '' : '';
  const overlay = createOverlay(doc, {
    isVideo: isVideoMedia(media),
    linkHref: linkHref || null,
    linkTarget: linkTarget || null
  });
  overlay.flowMedia = media;

  // Always isolate overlay surface clicks from theme lightbox / video-modal
  // scripts. Link pills and play pills opt out inside the handler.
  ensureLinkClickBlocker(overlay);

  // Lazy-loaded images sometimes don't have a usable `<a>` ancestor at
  // scan time: native `loading="lazy"` is OK, but some lazy-load
  // libraries (LiteSpeed, Jetpack image lazy-loader, etc.) swap the
  // surrounding markup when the image actually loads. Re-check on the
  // `load` event and retro-fit the link pill + click blocker if a link
  // ancestor only became visible then. Idempotent — guarded against
  // double-installation via dataset flags.
  if (tag === 'IMG' && isSiteReviewMode() && !media.complete) {
    media.addEventListener('load', () => {
      if (overlay.querySelector('.flow-embed-overlay__link-pill')) {
        return;
      }
      const a = media.closest('a[href]');
      if (!a) {
        return;
      }
      const href = (a.getAttribute('href') || '').trim();
      if (!href) {
        return;
      }
      const target = a.getAttribute('target') || '';
      overlay.appendChild(buildLinkPill(doc, href, target));
      ensureLinkClickBlocker(overlay);
    }, {
      once: true
    });
  }
  if (isIframe) {
    media.style.pointerEvents = 'none';
    if (isPositioned) {
      // E.g. embed blocks place the iframe `position: absolute; inset: 0;`
      overlay.classList.add('flow-embed-overlay--positioned');
      media.dataset.flowPositioned = '1';
      overlay.style.position = cs.position;
      overlay.style.top = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.left = '0';
      parent.appendChild(overlay);
    } else {
      const wrap = doc.createElement('span');
      wrap.className = 'flow-embed-wrap';
      parent.insertBefore(wrap, media);
      wrap.appendChild(media);
      wrap.appendChild(overlay);
    }
  } else if (tag === 'IMG' && parent.children.length === 1 && parent.firstElementChild === media && parent instanceof view.HTMLElement) {
    // Snug parent: the image is the parent's only child (Elementor's
    // `.elementor-post__thumbnail`, theme card thumbnails, image-in-
    // link patterns). The parent's box already matches the image, so
    // no JS positioning is needed — `inset: 0` from the base overlay
    // class does the right thing, and the overlay automatically tracks
    // any layout change the theme applies to the parent. Just ensure
    // the parent is a containing block.
    const parentCs = view.getComputedStyle(parent);
    if (parentCs.position === 'static') {
      parent.style.position = 'relative';
      parent.dataset.flowPositionedByFlow = '1';
    }
    overlay.classList.add('flow-embed-overlay--snug');
    parent.appendChild(overlay);
  } else {
    // img / video in a non-snug parent (paragraph with text siblings,
    // figure with caption, etc.): fall back to JS-driven positioning.
    // Wrapping the image in a span is avoided because page-builders
    // sometimes look for the image as a direct child of their
    // container.
    attachFloatingOverlay(media, overlay, parent, view);
  }
  watchHighlightChanges(media, overlay);
}

/**
 * Drop the overlay as a sibling and dynamically size it to match the media's
 * box. Resilient to layout changes (responsive image resizes, late-loading
 * dimensions, etc.) via ResizeObserver. Sets `position: relative` on the
 * parent if it's static so the overlay's `position: absolute` resolves
 * against the right containing block.
 *
 * @param {HTMLElement} media
 * @param {HTMLElement} overlay
 * @param {Node}        parent
 * @param {Window}      view
 */
function attachFloatingOverlay(media, overlay, parent, view) {
  if (!(parent instanceof view.HTMLElement)) {
    // Document fragment, ShadowRoot, etc — fall back to the previous
    // wrap behaviour rather than try to mutate something we don't own.
    const wrap = media.ownerDocument.createElement('span');
    wrap.className = 'flow-embed-wrap';
    parent.insertBefore(wrap, media);
    wrap.appendChild(media);
    wrap.appendChild(overlay);
    return;
  }
  overlay.classList.add('flow-embed-overlay--floating');
  // !important on the overlay's position so theme rules can't accidentally
  // reset it to `static` — that would knock the pill's containing block
  // up to the next positioned ancestor and yank it out of the corner.
  overlay.style.setProperty('position', 'absolute', 'important');
  const parentCs = view.getComputedStyle(parent);
  if (parentCs.position === 'static') {
    parent.style.position = 'relative';
    parent.dataset.flowPositionedByFlow = '1';
  }

  // getBoundingClientRect is robust where offsetLeft/Top isn't: themes that
  // place images in flex/grid cells, `<picture>` elements, or wrappers with
  // unusual borders all confuse the offset-based math. We compute the
  // media-to-parent delta off bounding rects and then back out parent's
  // border so the result is in the same coordinate system position:absolute
  // uses (i.e. parent's padding edge).
  const reposition = () => {
    const mr = media.getBoundingClientRect();
    const pr = parent.getBoundingClientRect();
    const pcs = view.getComputedStyle(parent);
    const bl = parseFloat(pcs.borderLeftWidth) || 0;
    const bt = parseFloat(pcs.borderTopWidth) || 0;
    overlay.style.left = mr.left - pr.left - bl + 'px';
    overlay.style.top = mr.top - pr.top - bt + 'px';
    overlay.style.width = mr.width + 'px';
    overlay.style.height = mr.height + 'px';
  };
  reposition();
  parent.appendChild(overlay);

  // Hover-time recompute is the primary signal — by the time the
  // reviewer is hovering, layout has fully settled and the user is
  // about to SEE the overlay state, so this is the right moment to
  // reposition. Listening on both media and overlay covers the case
  // where the overlay is misplaced enough that the cursor hits the
  // media first.
  media.addEventListener('pointerenter', reposition);
  overlay.addEventListener('pointerenter', reposition);

  // ResizeObserver as an event-based safety net for the case where the
  // image resizes WITHOUT a hover trigger — e.g. theme grid JS
  // equalising card heights, viewport reflow, late CSS settling.
  // Event-based (not polled), fires only when the box actually changes.
  if (typeof view.ResizeObserver === 'function') {
    const ro = new view.ResizeObserver(reposition);
    ro.observe(media);
    ro.observe(parent);
  }

  // Image hasn't loaded yet — dimensions arrive asynchronously. One
  // reposition on load keeps the overlay aligned even before any hover.
  if (media.tagName === 'IMG') {
    media.addEventListener('load', reposition);
  }
}
const MEDIA_SELECTOR = 'iframe, img, video';
function scanRoot(root) {
  if (!root || !root.querySelectorAll) {
    return;
  }
  root.querySelectorAll(MEDIA_SELECTOR).forEach(wrapMedia);
}
let observer = null;
let lateLoadHandler = null;
let lateLoadRoot = null;
function attachToDoc(doc) {
  if (!doc) {
    return;
  }
  const root = (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_1__.resolveCommentContentRoot)(doc) || doc.body || doc.documentElement;
  if (!root) {
    return;
  }
  injectOverlayStyles(doc);
  scanRoot(root);
  if (observer) {
    observer.disconnect();
  }
  observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        const tag = node.tagName;
        if (tag === 'IFRAME' || tag === 'IMG' || tag === 'VIDEO') {
          wrapMedia(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll(MEDIA_SELECTOR).forEach(wrapMedia);
        }
      }
    }
  });
  observer.observe(root, {
    childList: true,
    subtree: true
  });

  // Lazy-loaded images (native `loading="lazy"` below the fold, or themes
  // that swap `data-src` → `src` via JS) are 0×0 at initial scan and get
  // skipped. Retry wrapping when their `load` event fires — by then they
  // have real dimensions. `load` doesn't bubble, so we listen in the
  // capture phase off the scan root.
  if (lateLoadHandler && lateLoadRoot) {
    lateLoadRoot.removeEventListener('load', lateLoadHandler, true);
  }
  lateLoadHandler = e => {
    const t = e.target;
    if (!t || t.tagName !== 'IMG') {
      return;
    }
    if (t.dataset[WRAPPED_FLAG]) {
      return;
    }
    wrapMedia(t);
  };
  lateLoadRoot = root;
  root.addEventListener('load', lateLoadHandler, true);
}
function initEmbedOverlays() {
  // The post-preview content lives inside #flow-template-frame, which
  // ReviewBar creates asynchronously. Hook the ready event to scan it.
  const onIframeReady = e => {
    const iframe = e?.detail?.iframe;
    if (!iframe) return;
    // Defer until contentDocument is fully populated.
    const handle = () => attachToDoc(iframe.contentDocument);
    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      handle();
    } else {
      iframe.addEventListener('load', handle, {
        once: true
      });
    }
  };
  window.addEventListener('flow:iframe-ready', onIframeReady);

  // If the iframe is already up by the time we run, attach immediately.
  const existing = (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_1__.getIframeDoc)();
  if (existing) {
    attachToDoc(existing);
  }
  const detach = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (lateLoadHandler && lateLoadRoot) {
      lateLoadRoot.removeEventListener('load', lateLoadHandler, true);
      lateLoadHandler = null;
      lateLoadRoot = null;
    }
  };
  window.addEventListener('flow:iframe-removed', detach);
  return () => {
    window.removeEventListener('flow:iframe-ready', onIframeReady);
    window.removeEventListener('flow:iframe-removed', detach);
    detach();
  };
}

/***/ },

/***/ "./src/review-page/utils/invite-comment-identity.js"
/*!**********************************************************!*\
  !*** ./src/review-page/utils/invite-comment-identity.js ***!
  \**********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ensureInviteCommentIdentity: () => (/* binding */ ensureInviteCommentIdentity)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./api */ "./src/review-page/utils/api.js");
/* harmony import */ var _components_AnonymousNamePrompt__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/AnonymousNamePrompt */ "./src/review-page/components/AnonymousNamePrompt.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);
/**
 * Prompt email invitees for a display name on first comment.
 * Runs from Free's comment API so it works whether or not Pro's anonymous
 * middleware is loaded, and whether the visitor is also logged into WP.
 */




const STORAGE_NAME = 'flow_ew_anon_name';
const SHADOW_CSS = `
:host {
	all: initial;
	display: block;
	position: fixed;
	inset: 0;
	z-index: 100002;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans,
		Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
	font-size: 13px;
	line-height: 1.4;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	color: #1e1e1e;
}
*, *::before, *::after { box-sizing: border-box; }

.flow-ew-pro-anon-prompt__overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.4);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16px;
	animation: flow-ew-pro-fade-in 120ms ease-out;
}
@keyframes flow-ew-pro-fade-in {
	from { opacity: 0; }
	to   { opacity: 1; }
}

.flow-ew-pro-anon-prompt__dialog {
	background: #fff;
	border-radius: 4px;
	box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
	width: 100%;
	max-width: 384px;
	max-height: calc(100vh - 32px);
	overflow: auto;
	animation: flow-ew-pro-pop-in 140ms ease-out;
}
@keyframes flow-ew-pro-pop-in {
	from { opacity: 0; transform: translateY(-4px); }
	to   { opacity: 1; transform: translateY(0); }
}

.flow-ew-pro-anon-prompt__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 16px 16px 0;
}
.flow-ew-pro-anon-prompt__title {
	margin: 0;
	font-size: 14px;
	font-weight: 600;
	line-height: 1.4;
	color: #1e1e1e;
}
.flow-ew-pro-anon-prompt__close {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	margin: -8px -8px -8px 0;
	padding: 0;
	background: transparent;
	border: 0;
	border-radius: 2px;
	color: #1e1e1e;
	cursor: pointer;
}
.flow-ew-pro-anon-prompt__close:hover { background: #f0f0f0; }
.flow-ew-pro-anon-prompt__close:focus-visible {
	outline: 2px solid var(--wp-admin-theme-color, #007cba);
	outline-offset: -2px;
}

.flow-ew-pro-anon-prompt__body {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 16px;
}

.flow-ew-pro-anon-prompt__lead {
	margin: 0;
	font-size: 13px;
	line-height: 1.5;
	color: #1e1e1e;
}

.flow-ew-pro-anon-prompt__field {
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.flow-ew-pro-anon-prompt__label {
	font-size: 11px;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0;
	color: #1e1e1e;
}
.flow-ew-pro-anon-prompt__input {
	width: 100%;
	height: 40px;
	padding: 0 12px;
	font-family: inherit;
	font-size: 13px;
	line-height: 40px;
	color: #1e1e1e;
	background: #fff;
	border: 1px solid #949494;
	border-radius: 2px;
	outline: 0;
	box-shadow: none;
	-webkit-appearance: none;
	appearance: none;
}
.flow-ew-pro-anon-prompt__input:focus {
	border-color: var(--wp-admin-theme-color, #007cba);
	box-shadow: 0 0 0 1px var(--wp-admin-theme-color, #007cba);
}
.flow-ew-pro-anon-prompt__input:disabled {
	background: #f0f0f1;
	color: #50575e;
	border-color: #dcdcde;
	box-shadow: none;
}
.flow-ew-pro-anon-prompt__help {
	font-size: 12px;
	line-height: 1.4;
	color: #757575;
}

.flow-ew-pro-anon-prompt__actions {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 4px;
}
.flow-ew-pro-anon-prompt__btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 0;
	height: 40px;
	padding: 0 12px;
	font-family: inherit;
	font-size: 13px;
	font-weight: 500;
	line-height: 1;
	color: #1e1e1e;
	background: transparent;
	border: 1px solid transparent;
	border-radius: 2px;
	cursor: pointer;
	box-shadow: none;
	transition: background 0.1s ease, border-color 0.1s ease, color 0.1s ease;
}
.flow-ew-pro-anon-prompt__btn:focus-visible {
	outline: 2px solid var(--wp-admin-theme-color, #007cba);
	outline-offset: 2px;
}

.flow-ew-pro-anon-prompt__btn--tertiary {
	color: var(--wp-admin-theme-color, #007cba);
}
.flow-ew-pro-anon-prompt__btn--tertiary:hover:not(:disabled) {
	color: var(--wp-admin-theme-color-darker-10, #006ba1);
	box-shadow: inset 0 0 0 1px currentColor;
}

.flow-ew-pro-anon-prompt__btn--primary {
	color: #fff;
	background: var(--wp-admin-theme-color, #007cba);
	border-color: var(--wp-admin-theme-color, #007cba);
}
.flow-ew-pro-anon-prompt__btn--primary:hover:not(:disabled) {
	background: var(--wp-admin-theme-color-darker-10, #006ba1);
	border-color: var(--wp-admin-theme-color-darker-10, #006ba1);
	color: #fff;
}
.flow-ew-pro-anon-prompt__btn--primary:disabled {
	background: #dcdcde;
	border-color: #dcdcde;
	color: #a7aaad;
	cursor: not-allowed;
}
`;
function readStoredName() {
  try {
    return window.localStorage.getItem(STORAGE_NAME) || '';
  } catch (_err) {
    return '';
  }
}
function writeStoredName(name) {
  try {
    window.localStorage.setItem(STORAGE_NAME, name || '');
  } catch (_err) {
    // ignore
  }
}
function needsInviteDisplayName() {
  if (!_api__WEBPACK_IMPORTED_MODULE_1__.pageData?.isEmailInvitee) {
    return false;
  }
  // Only a real display name counts — currentUserName falls back to the email.
  return !String(_api__WEBPACK_IMPORTED_MODULE_1__.pageData.inviteDisplayName || '').trim();
}
function persistInviteDisplayName(name) {
  const email = String(_api__WEBPACK_IMPORTED_MODULE_1__.pageData.inviteEmail || '').trim();
  const reviewId = Number(_api__WEBPACK_IMPORTED_MODULE_1__.pageData.reviewId || 0);
  _api__WEBPACK_IMPORTED_MODULE_1__.pageData.inviteDisplayName = name || '';
  _api__WEBPACK_IMPORTED_MODULE_1__.pageData.currentUserName = name || email;
  writeStoredName(name);
  if (reviewId <= 0) {
    return;
  }
  (0,_api__WEBPACK_IMPORTED_MODULE_1__["default"])(`reviews/${reviewId}/invite-identity`, {
    method: 'POST',
    data: {
      name: name || ''
    }
  }).catch(() => {});
}
function promptForInviteName() {
  const email = String(_api__WEBPACK_IMPORTED_MODULE_1__.pageData.inviteEmail || '').trim();
  const initialName = String(_api__WEBPACK_IMPORTED_MODULE_1__.pageData.inviteDisplayName || readStoredName() || '').trim();
  return new Promise((resolve, reject) => {
    const host = document.createElement('div');
    host.id = 'flow-ew-invite-name-prompt-host';
    document.body.appendChild(host);
    const shadow = host.attachShadow({
      mode: 'open'
    });
    const style = document.createElement('style');
    style.textContent = SHADOW_CSS;
    shadow.appendChild(style);
    const mount = document.createElement('div');
    shadow.appendChild(mount);
    const root = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createRoot)(mount);
    const cleanup = () => {
      try {
        root.unmount();
      } catch (_err) {
        // ignore
      }
      host.remove();
    };
    root.render(/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_components_AnonymousNamePrompt__WEBPACK_IMPORTED_MODULE_2__["default"], {
      initialName: initialName,
      initialEmail: email,
      lockedEmail: email,
      onSubmit: data => {
        persistInviteDisplayName(data.name);
        cleanup();
        resolve(data.name);
      },
      onCancel: () => {
        cleanup();
        reject(new Error('cancelled'));
      }
    }));
  });
}

/**
 * Ensure the email invitee has chosen a display name before posting a comment.
 * Throws if the prompt is cancelled so the comment is not sent.
 */
async function ensureInviteCommentIdentity() {
  if (!needsInviteDisplayName()) {
    return;
  }
  await promptForInviteName();
}

/***/ },

/***/ "./src/review-page/utils/mount-in-shadow.js"
/*!**************************************************!*\
  !*** ./src/review-page/utils/mount-in-shadow.js ***!
  \**************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ mountInShadow)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__);


const WP_STYLE_SELECTOR = 'style[id^="wp-"], link[id^="wp-"]';
function mountInShadow(hostEl, cssText, Tree) {
  const shadow = hostEl.attachShadow({
    mode: 'open'
  });
  const style = document.createElement('style');
  style.textContent = cssText;
  shadow.appendChild(style);
  const cloneNode = node => shadow.appendChild(node.cloneNode(true));
  document.querySelectorAll(WP_STYLE_SELECTOR).forEach(cloneNode);
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        const id = node.id || '';
        if (id.startsWith('wp-') && (node.tagName === 'STYLE' || node.tagName === 'LINK')) {
          cloneNode(node);
        }
      }
    }
  });
  observer.observe(document.head, {
    childList: true
  });
  const mountPoint = document.createElement('div');
  mountPoint.style.cssText = 'display:contents';
  shadow.appendChild(mountPoint);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.render)(/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(Tree, {}), mountPoint);
  window.dispatchEvent(new CustomEvent('flow:shadow-mounted', {
    detail: {
      hostEl,
      shadowRoot: shadow
    }
  }));
}

/***/ },

/***/ "./src/review-page/utils/preview-link-guard.js"
/*!*****************************************************!*\
  !*** ./src/review-page/utils/preview-link-guard.js ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   installPreviewLinkGuard: () => (/* binding */ installPreviewLinkGuard)
/* harmony export */ });
function installPreviewLinkGuard(doc) {
  if (!doc?.documentElement) {
    return () => {};
  }
  const anchorFromEvent = e => {
    const t = e.target;
    if (!t || typeof t.closest !== 'function') {
      return null;
    }
    return t.closest('a[href]');
  };
  const shouldIgnore = e => {
    if (e.ctrlKey || e.metaKey) {
      return true;
    }
    return false;
  };

  // Keep rules aligned with enqueue_link_blocking() in class-flow-review-page.php.
  const isSkippableAnchor = a => {
    if (!a) {
      return true;
    }
    if (a.target === '_blank') {
      return true;
    }
    const href = (a.getAttribute('href') || '').trim();
    if (href === '') {
      return true;
    }
    const h = href.toLowerCase();
    if (h === '#' || href.startsWith('#')) {
      return true;
    }
    if (h.startsWith('javascript:')) {
      return true;
    }
    if (h.startsWith('mailto:') || h.startsWith('tel:') || h.startsWith('sms:')) {
      return true;
    }
    if (h.startsWith('data:')) {
      return true;
    }
    return false;
  };
  const onMouseDown = e => {
    if (e.button !== 0 || shouldIgnore(e)) {
      return;
    }
    const a = anchorFromEvent(e);
    if (isSkippableAnchor(a)) {
      return;
    }
    e.preventDefault();
  };
  const onClick = e => {
    if (e.button !== 0 || shouldIgnore(e)) {
      return;
    }
    const a = anchorFromEvent(e);
    if (isSkippableAnchor(a)) {
      return;
    }
    e.preventDefault();
    const onMedia = typeof e.target?.closest === 'function' && e.target.closest('img, video, iframe, .flow-embed-overlay');
    if (!onMedia) {
      e.stopPropagation();
    }
  };
  const onAuxClick = e => {
    if (e.button !== 1) {
      return;
    }
    const a = anchorFromEvent(e);
    if (isSkippableAnchor(a)) {
      return;
    }
    e.preventDefault();
  };
  doc.addEventListener('mousedown', onMouseDown, true);
  doc.addEventListener('click', onClick, true);
  doc.addEventListener('auxclick', onAuxClick, true);
  const win = doc.defaultView;
  let restoreOpen = null;
  if (win && typeof win.open === 'function') {
    const originalOpen = win.open.bind(win);
    const guardedOpen = function (url, target, features) {
      const t = (target || '').toString().toLowerCase();
      if (t === '_blank') {
        return originalOpen(url, target, features);
      }
      // Swallow; matches the "block top-level navigation" intent.
      return null;
    };
    try {
      win.open = guardedOpen;
      restoreOpen = () => {
        try {
          if (win.open === guardedOpen) {
            win.open = originalOpen;
          }
        } catch {
          // iframe torn down; nothing to restore.
        }
      };
    } catch {
      // Some sandboxed environments make window.open read-only.
      restoreOpen = null;
    }
  }
  return () => {
    doc.removeEventListener('mousedown', onMouseDown, true);
    doc.removeEventListener('click', onClick, true);
    doc.removeEventListener('auxclick', onAuxClick, true);
    if (restoreOpen) {
      restoreOpen();
    }
  };
}

/***/ },

/***/ "./src/review-page/utils/review-comment-totals.js"
/*!********************************************************!*\
  !*** ./src/review-page/utils/review-comment-totals.js ***!
  \********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   countResolvedCommentThreads: () => (/* binding */ countResolvedCommentThreads),
/* harmony export */   countUnresolvedCommentThreads: () => (/* binding */ countUnresolvedCommentThreads),
/* harmony export */   useReviewCommentTotals: () => (/* binding */ useReviewCommentTotals)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./api */ "./src/review-page/utils/api.js");
/* harmony import */ var _comment_tree__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./comment-tree */ "./src/review-page/utils/comment-tree.js");




/**
 * Number of top-level comment threads that are not resolved.
 *
 * @param {Array} flatComments Flat comments list.
 * @return {number} Count of root threads where `isResolved` is false.
 */
function countUnresolvedCommentThreads(flatComments) {
  if (!Array.isArray(flatComments) || flatComments.length === 0) {
    return 0;
  }
  return (0,_comment_tree__WEBPACK_IMPORTED_MODULE_2__.buildCommentTree)(flatComments).filter(thread => !thread.isResolved).length;
}

/**
 * Number of top-level comment threads that are resolved.
 *
 * @param {Array} flatComments Flat comments list.
 * @return {number} Count of root threads where `isResolved` is true.
 */
function countResolvedCommentThreads(flatComments) {
  if (!Array.isArray(flatComments) || flatComments.length === 0) {
    return 0;
  }
  return (0,_comment_tree__WEBPACK_IMPORTED_MODULE_2__.buildCommentTree)(flatComments).filter(thread => thread.isResolved).length;
}

/**
 * General (Review tab) + inline comment counts for "Request changes" eligibility.
 *
 * @param {(e: Event) => void} [onInlineCommentAdded] Runs after count increments (e.g. author resubmit tracking).
 */
function useReviewCommentTotals(onInlineCommentAdded) {
  const onInlineRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useRef)(onInlineCommentAdded);
  onInlineRef.current = onInlineCommentAdded;
  const [generalCount, setGeneralCount] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => (_api__WEBPACK_IMPORTED_MODULE_1__.pageData.comments || []).length);
  const [inlineCount, setInlineCount] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(() => (_api__WEBPACK_IMPORTED_MODULE_1__.pageData.inlineComments || []).length);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    const onCount = e => {
      const d = e.detail;
      const total = typeof d === 'object' && d !== null && 'total' in d ? Number(d.total) || 0 : Number(d) || 0;
      setGeneralCount(total);
    };
    const onInlineAdded = e => {
      setInlineCount(prev => prev + 1);
      onInlineRef.current?.(e);
    };
    window.addEventListener('flow:comment-count', onCount);
    window.addEventListener('flow:inline-comment-added', onInlineAdded);
    return () => {
      window.removeEventListener('flow:comment-count', onCount);
      window.removeEventListener('flow:inline-comment-added', onInlineAdded);
    };
  }, []);
  return generalCount + inlineCount;
}

/***/ },

/***/ "./src/review-page/utils/text-anchor.js"
/*!**********************************************!*\
  !*** ./src/review-page/utils/text-anchor.js ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   clearHighlight: () => (/* binding */ clearHighlight),
/* harmony export */   deserializeRange: () => (/* binding */ deserializeRange),
/* harmony export */   resolveMediaNode: () => (/* binding */ resolveMediaNode),
/* harmony export */   serializeMediaAnchor: () => (/* binding */ serializeMediaAnchor),
/* harmony export */   serializeRange: () => (/* binding */ serializeRange),
/* harmony export */   wrapRange: () => (/* binding */ wrapRange)
/* harmony export */ });
/* harmony import */ var _iframe_bridge__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./iframe-bridge */ "./src/review-page/utils/iframe-bridge.js");

const HIGHLIGHT_CLASS = 'flow-inline-highlight';
function getContentRoot() {
  const root = (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_0__.getActiveContentRoot)();
  if (root) return root;
  const iframeDoc = (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_0__.getIframeDoc)();
  return iframeDoc?.body || document.body;
}
function getContentRootForNode(node) {
  const doc = node.ownerDocument || document;
  return (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_0__.resolveCommentContentRoot)(doc, node) || doc.body;
}
function getContentRootForDocument(doc) {
  return (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_0__.resolveCommentContentRoot)(doc) || doc?.body;
}
function getCssPath(node, root) {
  const parts = [];
  let current = node;
  while (current && current !== root) {
    if (current.nodeType !== Node.ELEMENT_NODE) {
      current = current.parentElement;
      continue;
    }
    const parent = current.parentElement;
    if (!parent) break;
    const siblings = Array.from(parent.children).filter(s => s.tagName === current.tagName);
    const tag = current.tagName.toLowerCase();
    if (siblings.length > 1) {
      const idx = siblings.indexOf(current) + 1;
      parts.unshift(`${tag}:nth-of-type(${idx})`);
    } else {
      parts.unshift(tag);
    }
    current = parent;
  }
  return parts.join(' > ');
}
function resolvePathToNode(path, root) {
  if (!path) return null;
  try {
    return root.querySelector(path);
  } catch {
    return null;
  }
}
function getTextNodeAtOffset(element, charOffset) {
  const doc = element.ownerDocument || document;
  const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  let remaining = charOffset;
  let node = walker.nextNode();
  while (node) {
    if (remaining <= node.textContent.length) {
      return {
        node,
        offset: remaining
      };
    }
    remaining -= node.textContent.length;
    node = walker.nextNode();
  }
  if (element.lastChild && element.lastChild.nodeType === Node.TEXT_NODE) {
    return {
      node: element.lastChild,
      offset: element.lastChild.textContent.length
    };
  }
  return null;
}
function getCharOffset(element, textNode, nodeOffset) {
  const doc = element.ownerDocument || document;
  const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  let offset = 0;
  let node = walker.nextNode();
  while (node) {
    if (node === textNode) {
      return offset + nodeOffset;
    }
    offset += node.textContent.length;
    node = walker.nextNode();
  }
  return offset;
}
function serializeRange(range) {
  const root = getContentRootForNode(range.startContainer);
  if (!root || !root.contains(range.startContainer)) return null;
  const startEl = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer;
  const endEl = range.endContainer.nodeType === Node.TEXT_NODE ? range.endContainer.parentElement : range.endContainer;
  const doc = range.startContainer.ownerDocument || document;
  return {
    startPath: getCssPath(startEl, root),
    startOffset: getCharOffset(startEl, range.startContainer, range.startOffset),
    endPath: getCssPath(endEl, root),
    endOffset: getCharOffset(endEl, range.endContainer, range.endOffset),
    text: range.toString(),
    // Tells the wrap-time code which root to resolve paths against. 'body'
    // is the fallback used when the selection lives outside the standard
    // content roots (title, post meta, etc.); 'content' is the default
    // `.entry-content` / `.wp-block-post-content` family.
    rootType: root === doc.body ? 'body' : 'content'
  };
}
function serializeMediaAnchor(mediaEl, labelText = '') {
  if (!mediaEl || mediaEl.nodeType !== Node.ELEMENT_NODE) return null;
  const tag = mediaEl.tagName || '';
  if (!['IMG', 'VIDEO', 'IFRAME'].includes(tag)) return null;
  const root = getContentRootForNode(mediaEl);
  if (!root || !root.contains(mediaEl)) return null;
  const text = labelText || mediaEl.getAttribute('alt') || mediaEl.getAttribute('title') || '';
  const typeMap = {
    IMG: 'image',
    VIDEO: 'video',
    IFRAME: 'embed'
  };
  const doc = mediaEl.ownerDocument || document;
  return {
    type: typeMap[tag],
    nodePath: getCssPath(mediaEl, root),
    src: mediaEl.getAttribute('src') || '',
    text,
    rootType: root === doc.body ? 'body' : 'content'
  };
}
function tryDeserializeFromPaths(descriptor, root) {
  const startEl = resolvePathToNode(descriptor.startPath, root);
  const endEl = resolvePathToNode(descriptor.endPath, root);
  if (!startEl || !endEl) return null;
  const start = getTextNodeAtOffset(startEl, descriptor.startOffset);
  const end = getTextNodeAtOffset(endEl, descriptor.endOffset);
  if (!start || !end) return null;
  try {
    const doc = root.ownerDocument || document;
    const range = doc.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    return range;
  } catch {
    return null;
  }
}

/**
 * Locate `descriptor.text` somewhere under `root` when path-based resolution
 * failed (DOM was edited, descriptor paths drifted, etc). Previously this
 * returned the FIRST text-node match anywhere in the root — which silently
 * anchored every comment on the same word to its first occurrence when
 * path-based fell through. We now iterate ALL matches across all descendant
 * text nodes, track each match's cumulative character offset from the root,
 * and return the match whose absolute offset is closest to the saved
 * `descriptor.startOffset`. A nice property: an exact offset hit returns
 * immediately. If `startOffset` is missing (older descriptors) we still return
 * the first match — same behaviour as before for that legacy case.
 */
function tryFuzzyTextSearch(descriptor, root) {
  const text = descriptor?.text;
  if (!text) return null;
  const doc = root.ownerDocument || document;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const needle = text.trim();
  const target = Number.isFinite(descriptor?.startOffset) ? Number(descriptor.startOffset) : null;
  let cumulative = 0;
  let bestRange = null;
  let bestDistance = Infinity;
  let node = walker.nextNode();
  while (node) {
    const content = node.textContent;
    let searchFrom = 0;
    while (true) {
      const idx = content.indexOf(needle, searchFrom);
      if (idx === -1) break;
      const absOffset = cumulative + idx;
      const distance = target === null ? 0 : Math.abs(absOffset - target);
      if (distance < bestDistance) {
        const range = doc.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + needle.length);
        bestRange = range;
        bestDistance = distance;
        if (distance === 0) return bestRange;
      }
      if (target === null) {
        // No offset → first-match wins, original behaviour.
        return bestRange;
      }
      searchFrom = idx + 1;
    }
    cumulative += content.length;
    node = walker.nextNode();
  }
  return bestRange;
}
const MEDIA_TYPES = ['image', 'video', 'embed'];
function selectorForMediaType(type) {
  if (type === 'video') return 'video';
  if (type === 'embed') return 'iframe';
  return 'img';
}
function tryDeserializeMedia(descriptor, root) {
  if (!descriptor?.nodePath) return null;
  const selector = selectorForMediaType(descriptor.type);
  let media = resolvePathToNode(descriptor.nodePath, root);
  if (!media && descriptor.src) {
    const mediaNodes = root.querySelectorAll(selector);
    media = Array.from(mediaNodes).find(node => (node.getAttribute('src') || '') === descriptor.src);
  }
  if (!media) return null;
  const doc = root.ownerDocument || document;
  const range = doc.createRange();
  range.selectNode(media);
  return range;
}
function resolveMediaNode(descriptor, optionalRoot) {
  if (!MEDIA_TYPES.includes(descriptor?.type)) return null;
  const root = optionalRoot || getContentRootForDocument((0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_0__.getIframeDoc)() || document);
  if (!root) return null;
  const selector = selectorForMediaType(descriptor.type);
  let media = resolvePathToNode(descriptor.nodePath, root);
  if (media?.tagName?.toLowerCase() !== selector) {
    media = null;
  }
  if (!media && descriptor.src) {
    const mediaNodes = root.querySelectorAll(selector);
    media = Array.from(mediaNodes).find(node => (node.getAttribute('src') || '') === descriptor.src);
  }
  return media || null;
}
function deserializeRange(descriptor, optionalRoot) {
  const isMedia = MEDIA_TYPES.includes(descriptor?.type);
  let root = optionalRoot || (isMedia ? getContentRootForDocument((0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_0__.getIframeDoc)() || document) : getContentRoot());
  if (descriptor?.rootType === 'body') {
    const doc = root?.ownerDocument || (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_0__.getIframeDoc)() || document;
    root = doc?.body || root;
  }
  if (!root) return null;
  if (isMedia) {
    return tryDeserializeMedia(descriptor, root);
  }
  const range = tryDeserializeFromPaths(descriptor, root);
  if (range && range.toString() === descriptor.text) return range;
  return tryFuzzyTextSearch(descriptor, root);
}
function wrapRange(range, commentId) {
  if (!range) return null;
  const doc = range.startContainer.ownerDocument || document;
  const mark = doc.createElement('mark');
  mark.className = HIGHLIGHT_CLASS;
  mark.dataset.commentId = String(commentId);
  try {
    range.surroundContents(mark);
    return mark;
  } catch {
    const marks = wrapRangeAcrossNodes(range, commentId);
    return marks.length ? marks[0] : null;
  }
}

/**
 * Wrap each text node's portion of the range with its own <mark>. Used when
 * the range spans element boundaries (multiple block-level elements or mixed
 * inline + block). Returns the array of created marks.
 */
function wrapRangeAcrossNodes(range, commentId) {
  const doc = range.startContainer.ownerDocument || document;
  const root = range.commonAncestorContainer;
  const created = [];

  // Collect text nodes that intersect the range, snapshot up front so DOM
  // mutations during wrapping don't invalidate the iteration.
  const textNodes = [];
  const walker = doc.createTreeWalker(root.nodeType === Node.TEXT_NODE ? root.parentNode || root : root, NodeFilter.SHOW_TEXT, null);
  let node = walker.nextNode();
  while (node) {
    if (range.intersectsNode && range.intersectsNode(node)) {
      textNodes.push(node);
    }
    node = walker.nextNode();
  }
  if (root.nodeType === Node.TEXT_NODE && range.intersectsNode(root)) {
    textNodes.push(root);
  }
  for (const textNode of textNodes) {
    const startOffset = textNode === range.startContainer ? range.startOffset : 0;
    const endOffset = textNode === range.endContainer ? range.endOffset : textNode.textContent.length;
    if (startOffset >= endOffset) {
      continue;
    }
    const subRange = doc.createRange();
    try {
      subRange.setStart(textNode, startOffset);
      subRange.setEnd(textNode, endOffset);
      const mark = doc.createElement('mark');
      mark.className = HIGHLIGHT_CLASS;
      mark.dataset.commentId = String(commentId);
      subRange.surroundContents(mark);
      created.push(mark);
    } catch {
      // Skip nodes that can't be wrapped (e.g. detached during wrapping)
    }
  }
  return created;
}
function clearHighlight(commentId) {
  const selector = `.${HIGHLIGHT_CLASS}[data-comment-id="${commentId}"]`;
  const marks = [...document.querySelectorAll(selector)];
  const iframeDoc = (0,_iframe_bridge__WEBPACK_IMPORTED_MODULE_0__.getIframeDoc)();
  if (iframeDoc) {
    marks.push(...iframeDoc.querySelectorAll(selector));
  }
  marks.forEach(mark => {
    const parent = mark.parentNode;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
    parent.normalize();
  });
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

/***/ "./src/review-page/style.scss"
/*!************************************!*\
  !*** ./src/review-page/style.scss ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "./src/review-page/bar.scss?raw"
/*!**************************************!*\
  !*** ./src/review-page/bar.scss?raw ***!
  \**************************************/
(module) {

module.exports = "@charset \"UTF-8\";\n/*\n * Flow Review — Top Bar styles.\n * Injected into Shadow root #1. Fully isolated from theme CSS.\n * wp-components styles are cloned in from document.head at mount time.\n */\n*,\n*::before,\n*::after {\n  box-sizing: border-box;\n}\n\n:host {\n  display: block;\n  position: fixed;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 64px;\n  z-index: 999999;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen-Sans, Ubuntu, Cantarell, \"Helvetica Neue\", sans-serif;\n  font-size: 13px;\n  line-height: 1.4;\n  color: #1e1e1e;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\nbutton,\ninput,\nselect,\ntextarea {\n  font-family: inherit;\n  font-size: inherit;\n  line-height: inherit;\n  color: inherit;\n}\n\n.components-button {\n  font-weight: 600;\n}\n\n.flow-bar {\n  height: 64px;\n  background: #fff;\n  border-bottom: 1px solid #e0e0e0;\n  display: flex;\n  align-items: center;\n  padding: 0 16px 0 0;\n  position: relative;\n}\n.flow-bar__left {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  min-width: 0;\n  flex: 1;\n}\n.flow-bar__right {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-shrink: 0;\n}\n.flow-bar__wp-logo {\n  position: relative;\n  flex-shrink: 0;\n  width: 64px;\n  height: 64px;\n  overflow: hidden;\n}\n.flow-bar__wp-logo-link {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 100%;\n  color: #fff;\n  text-decoration: none;\n}\n.flow-bar__wp-logo-link:hover, .flow-bar__wp-logo-link:active {\n  color: #fff;\n}\n.flow-bar__wp-logo-link:focus {\n  box-shadow: none;\n  outline: none;\n}\n.flow-bar__wp-logo-icon {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 100%;\n  clip-path: inset(0% round 0px);\n  transition: clip-path 0.2s ease;\n}\n.flow-bar__wp-logo-icon svg {\n  fill: currentColor;\n  display: block;\n  background: #1e1e1e;\n  padding: 12px;\n  width: 100%;\n  height: 100%;\n}\n.flow-bar__wp-logo-back {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 64px;\n  height: 64px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background-color: #ccc;\n  color: #1e1e1e;\n  pointer-events: none;\n  opacity: 0;\n  transform: scale(0.2);\n  clip-path: inset(0% round 0px);\n  transition: opacity 0.2s ease, transform 0.2s ease, clip-path 0.2s ease;\n}\n.flow-bar__wp-logo-back svg {\n  fill: currentColor;\n}\n.flow-bar__wp-logo:hover .flow-bar__wp-logo-icon, .flow-bar__wp-logo:focus-within .flow-bar__wp-logo-icon {\n  clip-path: inset(22% round 2px);\n}\n.flow-bar__wp-logo:hover .flow-bar__wp-logo-back, .flow-bar__wp-logo:focus-within .flow-bar__wp-logo-back {\n  opacity: 1;\n  transform: scale(1);\n  clip-path: inset(22% round 2px);\n}\n.flow-bar__sidebar-toggle.components-button, .flow-bar__comments-toggle.components-button, .flow-bar__edit-post.components-button {\n  height: 32px;\n  min-width: 32px;\n  padding: 4px;\n  flex-shrink: 0;\n  border-radius: 2px;\n  color: #1e1e1e;\n}\n.flow-bar__sidebar-toggle.components-button svg, .flow-bar__comments-toggle.components-button svg, .flow-bar__edit-post.components-button svg {\n  fill: currentColor;\n}\n.flow-bar__sidebar-toggle.components-button:focus:not(:disabled), .flow-bar__comments-toggle.components-button:focus:not(:disabled), .flow-bar__edit-post.components-button:focus:not(:disabled) {\n  box-shadow: 0 0 0 var(--wp-admin-border-width-focus, 2px) var(--wp-admin-theme-color, #007cba), inset 0 0 0 1px #fff;\n  outline: 1px solid transparent;\n}\n.flow-bar__edit-post.components-button {\n  text-decoration: none;\n  border: 1px solid #1e1e1e;\n  box-shadow: none;\n}\n.flow-bar__edit-post.components-button:hover:not(:disabled), .flow-bar__edit-post.components-button:active:not(:disabled), .flow-bar__edit-post.components-button:visited {\n  color: #1e1e1e;\n}\n.flow-bar__edit-post.components-button:hover:not(:disabled) {\n  background: #f6f7f7;\n}\n.flow-bar__sidebar-toggle.components-button.is-pressed, .flow-bar__comments-toggle.components-button.is-pressed {\n  background: #1e1e1e;\n  color: #fff;\n}\n.flow-bar__badge {\n  display: inline-flex;\n  align-items: center;\n  flex-shrink: 0;\n  gap: 4px;\n  font-size: 11px;\n  font-weight: 500;\n  line-height: 1.4;\n  padding: 2px 8px;\n  border-radius: 10px;\n  white-space: nowrap;\n  color: #5e777b;\n  background: #e6f3f5;\n  border: 1px solid #cde3e7;\n}\n.flow-bar__badge__dot {\n  width: 5px;\n  height: 5px;\n  border-radius: 50%;\n  background: currentColor;\n  flex-shrink: 0;\n}\n.flow-bar__badge--in_review {\n  color: #957500;\n  background: #fcf0ce;\n  border-color: #f2dda4;\n}\n.flow-bar__badge--approved {\n  color: #458037;\n  background: #e7f5e4;\n  border-color: #cae8c4;\n}\n.flow-bar__badge--changes_requested {\n  color: #c92122;\n  background: #ffebea;\n  border-color: #ffd1d0;\n}\n.flow-bar__badge--open_review {\n  color: #1579a5;\n  background: #dff4ff;\n  border-color: #b6e6ff;\n}\n.flow-bar__title {\n  display: flex;\n  align-items: baseline;\n  gap: 0.35em;\n  min-width: 0;\n  font-size: 14px;\n  line-height: 1.35;\n  white-space: nowrap;\n  overflow: hidden;\n}\n.flow-bar__title-prefix {\n  flex-shrink: 0;\n  color: #757575;\n  font-weight: 400;\n}\n.flow-bar__title-name, .flow-bar__title-type {\n  font-weight: 600;\n  color: #1e1e1e;\n}\n.flow-bar__title-name {\n  flex: 0 1 auto;\n  min-width: 0;\n  max-width: min(22ch, 18vw);\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n.flow-bar__title-type {\n  flex-shrink: 0;\n}\n.flow-bar__title-suffix {\n  flex-shrink: 0;\n  display: inline-flex;\n  align-items: baseline;\n  gap: 0.35em;\n}\n.flow-bar__title-dot {\n  color: #757575;\n  font-weight: 400;\n}\n.flow-bar__title--simple {\n  display: block;\n  font-weight: 500;\n  color: #1e1e1e;\n  text-overflow: ellipsis;\n}\n.flow-bar__meta {\n  position: absolute;\n  left: 50%;\n  transform: translateX(-50%);\n  max-width: 42%;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 3px;\n  text-align: center;\n  pointer-events: none;\n}\n.flow-bar__freshness-row {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  flex-wrap: nowrap;\n  gap: 6px;\n  max-width: 100%;\n}\n.flow-bar__freshness {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  font-size: 11px;\n  font-weight: 500;\n  padding: 2px 8px;\n  border-radius: 10px;\n  white-space: nowrap;\n}\n.flow-bar__freshness--latest {\n  color: #458037;\n  background: #e7f5e4;\n}\n.flow-bar__freshness--outdated {\n  color: #957500;\n  background: #fcf0ce;\n}\n.flow-bar__freshness--debug {\n  color: #957500;\n  background: #fcf0ce;\n}\n.flow-bar__freshness-icon {\n  display: inline-flex;\n  flex-shrink: 0;\n  width: 14px;\n  height: 14px;\n}\n.flow-bar__freshness-icon svg {\n  display: block;\n  width: 14px;\n  height: 14px;\n}\n.flow-bar__freshness-link {\n  color: var(--wp-admin-theme-color, #2271b1);\n  text-decoration: underline;\n  cursor: pointer;\n  pointer-events: auto;\n}\n.flow-bar__freshness-link:hover, .flow-bar__freshness-link:focus {\n  color: var(--wp-admin-theme-color-darker-10, #135e96);\n}\n.flow-bar__freshness-snapshot {\n  font-size: 10px;\n  color: #757575;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  max-width: 100%;\n}\n.flow-bar__actions {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-shrink: 0;\n}\n.flow-bar__btn--request-changes.components-button {\n  background: transparent !important;\n  border: 1px solid #1e1e1e !important;\n  color: #1e1e1e !important;\n  box-shadow: none !important;\n}\n.flow-bar__btn--request-changes.components-button:hover:not(:disabled), .flow-bar__btn--request-changes.components-button:active:not(:disabled) {\n  background: #f6f7f7 !important;\n  border-color: #1e1e1e !important;\n  color: #1e1e1e !important;\n}\n.flow-bar__btn--request-changes.components-button:focus:not(:disabled) {\n  box-shadow: 0 0 0 var(--wp-admin-border-width-focus, 2px) #fff, 0 0 0 calc(var(--wp-admin-border-width-focus, 2px) + 1px) #1e1e1e !important;\n  outline: 1px solid transparent;\n}\n.flow-bar__btn--request-changes.components-button:disabled, .flow-bar__btn--request-changes.components-button[aria-disabled=true] {\n  background: #f6f7f7 !important;\n  border-color: #ddd !important;\n  color: #8c8f94 !important;\n  opacity: 1 !important;\n}\n.flow-bar__btn--revoke.components-button {\n  background: #d63638 !important;\n  border-color: #d63638 !important;\n  color: #fff !important;\n  box-shadow: none !important;\n}\n.flow-bar__btn--revoke.components-button:hover:not(:disabled), .flow-bar__btn--revoke.components-button:active:not(:disabled) {\n  background: #b32d2e !important;\n  border-color: #b32d2e !important;\n  color: #fff !important;\n}\n.flow-bar__btn--revoke.components-button:focus:not(:disabled) {\n  box-shadow: 0 0 0 var(--wp-admin-border-width-focus, 2px) #fff, 0 0 0 calc(var(--wp-admin-border-width-focus, 2px) + 1px) #d63638 !important;\n  outline: 1px solid transparent;\n}\n.flow-bar__btn--revoke.components-button:disabled, .flow-bar__btn--revoke.components-button[aria-disabled=true] {\n  background: #f6f7f7 !important;\n  border-color: #ddd !important;\n  color: #8c8f94 !important;\n  opacity: 1 !important;\n  cursor: not-allowed;\n}\n\n.flow-bar__view-dropdown {\n  margin: 0;\n}\n\n@media (max-width: 782px) {\n  .flow-bar__view-dropdown-wrap {\n    display: none !important;\n  }\n}\n@media (max-width: 1600px) {\n  .flow-bar__meta {\n    position: static;\n    transform: none;\n    max-width: none;\n    flex-direction: row;\n    align-items: center;\n    gap: 6px;\n    text-align: right;\n    pointer-events: auto;\n  }\n  .flow-bar__freshness-snapshot {\n    display: none;\n  }\n}\n@media (max-width: 1400px) {\n  .flow-bar__title-prefix,\n  .flow-bar__title-suffix {\n    display: none;\n  }\n  .flow-bar__edit-post.components-button {\n    display: none !important;\n  }\n}\n.flow-bar__snackbar-list.components-snackbar-list {\n  position: fixed;\n  left: 16px;\n  bottom: calc(16px + var(--flow-ew-upsell-bar-height, 0px));\n  width: auto;\n  max-width: min(420px, 100vw - 32px);\n  pointer-events: none;\n  z-index: 1000000;\n}\n\n.flow-bar__snackbar-list .components-snackbar-list__notice-container {\n  padding-top: 0;\n  pointer-events: auto;\n}\n\n.flow-bar__snackbar.components-snackbar {\n  cursor: default;\n  min-height: 32px;\n  max-width: 360px;\n}\n\n@media (max-width: 782px) {\n  .flow-bar {\n    padding: 0 8px 0 0;\n    gap: 4px;\n  }\n  .flow-bar__wp-logo, .flow-bar__wp-logo-back {\n    width: 48px;\n  }\n  .flow-bar__edit-post.components-button, .flow-bar__title, .flow-bar__meta, .flow-bar__badge {\n    display: none !important;\n  }\n  .flow-bar__right {\n    gap: 6px;\n  }\n  .flow-bar__actions {\n    gap: 6px;\n  }\n  .flow-bar__btn--request-changes.components-button, .flow-bar__btn--revoke.components-button {\n    padding-left: 10px !important;\n    padding-right: 10px !important;\n  }\n}";

/***/ },

/***/ "./src/review-page/popover.scss?raw"
/*!******************************************!*\
  !*** ./src/review-page/popover.scss?raw ***!
  \******************************************/
(module) {

module.exports = "@charset \"UTF-8\";\n/**\n * Flow Editorial Workflow — Inline comment popover styles.\n * Mounted into a Shadow DOM root (see src/review-page/index.js → mountInShadow),\n * so theme / page-builder CSS in the parent document cannot leak in.\n */\n.flow-confirm-dialog {\n  position: fixed;\n  inset: 0;\n  z-index: 1000003;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 16px;\n}\n\n.flow-confirm-dialog__backdrop {\n  position: absolute;\n  inset: 0;\n  margin: 0;\n  padding: 0;\n  border: 0;\n  background: rgba(0, 0, 0, 0.45);\n  cursor: default;\n}\n\n.flow-confirm-dialog__panel {\n  position: relative;\n  width: 100%;\n  max-width: min(420px, 100% - 32px);\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen-Sans, Ubuntu, Cantarell, \"Helvetica Neue\", sans-serif;\n  font-size: 13px;\n  line-height: 1.4;\n  color: #c92122;\n  background: #ffebea;\n  border: 1px solid #ffd1d0;\n  border-left-width: 4px;\n  border-left-color: #c92122;\n  border-radius: 2px;\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);\n}\n\n.flow-confirm-dialog__alert {\n  display: flex;\n  align-items: flex-start;\n  gap: 12px;\n  padding: 12px 16px;\n}\n\n.flow-confirm-dialog__icon {\n  display: flex;\n  flex-shrink: 0;\n  align-items: center;\n  justify-content: center;\n  width: 24px;\n  height: 24px;\n  color: #c92122;\n}\n.flow-confirm-dialog__icon svg {\n  display: block;\n  width: 24px;\n  height: 24px;\n}\n\n.flow-confirm-dialog__content {\n  flex: 1 1 auto;\n  min-width: 0;\n}\n\n.flow-confirm-dialog__title {\n  margin: 0 0 2px;\n  font-size: inherit;\n  font-weight: 600;\n  line-height: inherit;\n  color: inherit;\n}\n\n.flow-confirm-dialog__message {\n  margin: 0;\n  font-size: inherit;\n  font-weight: 400;\n  line-height: inherit;\n  color: inherit;\n}\n\n.flow-confirm-dialog__actions {\n  display: flex;\n  justify-content: flex-end;\n  gap: 8px;\n  padding: 0 16px 12px;\n}\n\n.flow-confirm-dialog__confirm.components-button {\n  min-width: 80px;\n  justify-content: center;\n  background: #c92122 !important;\n  border: 1px solid #c92122 !important;\n  color: #fff !important;\n  box-shadow: none !important;\n}\n.flow-confirm-dialog__confirm.components-button:hover:not(:disabled), .flow-confirm-dialog__confirm.components-button:active:not(:disabled) {\n  background: #b32d2e !important;\n  border-color: #b32d2e !important;\n  color: #fff !important;\n}\n.flow-confirm-dialog__confirm.components-button:focus:not(:disabled) {\n  box-shadow: 0 0 0 var(--wp-admin-border-width-focus, 2px) #fff, 0 0 0 calc(var(--wp-admin-border-width-focus, 2px) + 1px) #c92122 !important;\n  outline: 1px solid transparent;\n}\n\n.flow-btn--text.components-button {\n  background: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  color: var(--wp-admin-theme-color, #007cba);\n}\n.flow-btn--text.components-button:hover:not(:disabled), .flow-btn--text.components-button:active:not(:disabled) {\n  color: var(--wp-admin-theme-color, #007cba);\n  background: #f0f6fc !important;\n}\n.flow-btn--text.components-button:focus:not(:disabled) {\n  box-shadow: 0 0 0 var(--wp-admin-border-width-focus, 2px) #fff, 0 0 0 calc(var(--wp-admin-border-width-focus, 2px) + 1px) var(--wp-admin-theme-color, #007cba) !important;\n  outline: 1px solid transparent;\n}\n.flow-btn--text.components-button:disabled, .flow-btn--text.components-button[aria-disabled=true] {\n  background: transparent !important;\n  border: none !important;\n  color: #8c8f94 !important;\n  opacity: 1 !important;\n}\n\n.flow-btn--cancel.components-button {\n  min-width: 80px !important;\n  text-decoration: underline;\n  text-underline-offset: 2px;\n}\n.flow-btn--cancel.components-button:hover:not(:disabled), .flow-btn--cancel.components-button:active:not(:disabled) {\n  text-decoration: none;\n}\n\n.flow-comment-editor__submit-btn.components-button {\n  background: transparent !important;\n  border: 1px solid var(--wp-admin-theme-color, #007cba) !important;\n  color: var(--wp-admin-theme-color, #007cba) !important;\n  box-shadow: none !important;\n}\n.flow-comment-editor__submit-btn.components-button:hover:not(:disabled), .flow-comment-editor__submit-btn.components-button:active:not(:disabled) {\n  background: #f0f6fc !important;\n  border-color: var(--wp-admin-theme-color, #007cba) !important;\n  color: var(--wp-admin-theme-color, #007cba) !important;\n}\n.flow-comment-editor__submit-btn.components-button:focus:not(:disabled) {\n  box-shadow: 0 0 0 var(--wp-admin-border-width-focus, 2px) #fff, 0 0 0 calc(var(--wp-admin-border-width-focus, 2px) + 1px) var(--wp-admin-theme-color, #007cba) !important;\n  outline: 1px solid transparent;\n}\n.flow-comment-editor__submit-btn.components-button:disabled, .flow-comment-editor__submit-btn.components-button[aria-disabled=true] {\n  background: transparent !important;\n  border-color: #dcdcde !important;\n  color: #757575 !important;\n  opacity: 1 !important;\n}\n\n.flow-inline-popover {\n  pointer-events: auto;\n}\n.flow-inline-popover__btn {\n  --popover-btn-bg: #fff;\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  min-height: 44px;\n  padding: 10px 16px;\n  background: var(--popover-btn-bg);\n  color: var(--wp-admin-theme-color, #007cba);\n  border: 1px solid var(--wp-admin-theme-color, #007cba);\n  border-radius: 2px;\n  font-size: 18px;\n  font-weight: 400;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n  cursor: pointer;\n  position: relative;\n  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.06);\n  white-space: nowrap;\n  overflow: visible;\n  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;\n}\n.flow-inline-popover__btn:hover {\n  --popover-btn-bg: #f0f6fc;\n  background: var(--popover-btn-bg);\n  border-color: var(--wp-admin-theme-color, #007cba);\n  color: var(--wp-admin-theme-color, #007cba);\n}\n.flow-inline-popover__btn:focus-visible {\n  outline: 2px solid var(--wp-admin-theme-color, #007cba);\n  outline-offset: 2px;\n}\n.flow-inline-popover__btn::before {\n  content: \"\";\n  position: absolute;\n  top: 50%;\n  left: -6px;\n  z-index: 1;\n  width: 10px;\n  height: 10px;\n  box-sizing: border-box;\n  background: var(--popover-btn-bg);\n  border-left: 1px solid var(--wp-admin-theme-color, #007cba);\n  border-bottom: 1px solid var(--wp-admin-theme-color, #007cba);\n  transform: translateY(-50%) rotate(45deg);\n  transition: background 0.15s ease, border-color 0.15s ease;\n  pointer-events: none;\n}\n.flow-inline-popover__btn::after {\n  content: \"\";\n  position: absolute;\n  top: 50%;\n  left: 0;\n  z-index: 2;\n  width: 1px;\n  height: 14px;\n  background: var(--popover-btn-bg);\n  transform: translateY(-50%);\n  pointer-events: none;\n}\n.flow-inline-popover__btn-label {\n  font-size: 18px;\n  line-height: 1.2;\n}\n.flow-inline-popover__btn-icon {\n  width: 22px;\n  height: 22px;\n  color: var(--wp-admin-theme-color, #007cba);\n  flex: 0 0 auto;\n}\n.flow-inline-popover__btn-icon svg {\n  fill: currentColor;\n}\n.flow-inline-popover--editor {\n  width: min(380px, 100vw - 24px);\n}\n.flow-inline-popover__editor-wrap {\n  background: #fff;\n  border: 1px solid #e0e0e0;\n  border-radius: 4px;\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);\n  padding: 12px;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n  font-size: 13px;\n  line-height: 1.4;\n  color: #1e1e1e;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor {\n  display: flex;\n  flex-direction: column;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__toolbar {\n  display: flex;\n  align-items: stretch;\n  gap: 0;\n  padding: 0;\n  background: #fff;\n  border: 1px solid #1d2327;\n  border-bottom: 0;\n  border-radius: 2px 2px 0 0;\n  overflow-x: auto;\n  overflow-y: hidden;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__toolbar .components-button {\n  min-width: 32px !important;\n  width: auto !important;\n  height: 36px !important;\n  padding: 0 6px !important;\n  border-radius: 0;\n  border-left: 1px solid #1d2327;\n  color: #1e1e1e;\n  box-shadow: none;\n  flex-shrink: 0;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__toolbar .components-button:hover:not(:disabled) {\n  background: #f0f0f0;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__toolbar .components-button.is-pressed:not(:disabled) {\n  background: #f0f6fc;\n  color: var(--wp-admin-theme-color, #007cba);\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__toolbar .components-button.is-small,\n.flow-inline-popover__editor-wrap .flow-comment-editor__toolbar .components-button[data-size=small] {\n  min-width: 32px !important;\n  width: auto !important;\n  height: 36px !important;\n  padding: 0 6px !important;\n  border-radius: 0;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__toolbar-group {\n  display: flex;\n  align-items: stretch;\n  flex-shrink: 0;\n  border-left: 1px solid #1d2327;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__toolbar-group .components-button {\n  border-left: 0;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__block-select {\n  height: 36px;\n  padding: 0 10px;\n  border: 0;\n  border-radius: 0;\n  background: #fff;\n  font-size: 12px;\n  cursor: pointer;\n  flex-shrink: 0;\n  min-width: 84px;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__block-select:hover {\n  background: #f0f0f0;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__block-select:focus {\n  outline: none;\n  box-shadow: inset 0 0 0 2px var(--wp-admin-theme-color, #007cba);\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__toolbar-sep {\n  display: none;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__content {\n  border: 1px solid #1d2327;\n  border-radius: 0 0 2px 2px;\n  background: #fff;\n  cursor: text;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__content:focus-within {\n  border-color: var(--wp-admin-theme-color, #007cba);\n  box-shadow: 0 0 0 1px var(--wp-admin-theme-color, #007cba);\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__content .ProseMirror {\n  position: relative;\n  min-height: 75px;\n  max-height: 200px;\n  overflow-y: auto;\n  padding: 8px 10px;\n  line-height: 1.6;\n  outline: none;\n  word-break: break-word;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__content .ProseMirror p.is-editor-empty:first-child::before {\n  content: attr(data-placeholder);\n  color: #949494;\n  pointer-events: none;\n  float: left;\n  height: 0;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__content .ProseMirror ul, .flow-inline-popover__editor-wrap .flow-comment-editor__content .ProseMirror ol {\n  padding-left: 1.5em;\n  margin: 0.3em 0;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__content .ProseMirror li {\n  margin: 0.1em 0;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__content .ProseMirror a {\n  color: var(--wp-admin-theme-color, #007cba);\n  text-decoration: underline;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__content .ProseMirror strong {\n  font-weight: 600;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__content .ProseMirror em {\n  font-style: italic;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor--basic .flow-comment-editor__content {\n  border-radius: 2px;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__textarea {\n  display: block;\n  width: 100%;\n  min-height: 75px;\n  max-height: 200px;\n  margin: 0;\n  padding: 8px 10px;\n  border: 0;\n  border-radius: inherit;\n  background: #fff;\n  font-family: inherit;\n  font-size: 13px;\n  line-height: 1.6;\n  resize: vertical;\n  box-sizing: border-box;\n  outline: none;\n  color: #1e1e1e;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__textarea::placeholder {\n  color: #949494;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__link-row {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  padding: 4px 6px;\n  background: #f6f7f7;\n  border: 1px solid #1d2327;\n  border-top: none;\n  border-bottom: none;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__link-input {\n  flex: 1;\n  height: 28px;\n  padding: 0 6px;\n  border: 1px solid #949494;\n  border-radius: 2px;\n  background: #fff;\n  font-size: 12px;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__link-input:focus {\n  outline: none;\n  border-color: var(--wp-admin-theme-color, #007cba);\n  box-shadow: 0 0 0 1px var(--wp-admin-theme-color, #007cba);\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__submit-row {\n  display: flex;\n  gap: 8px;\n  margin-top: 10px;\n  justify-content: flex-start;\n  flex-wrap: wrap;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__submit-row .flow-comment-editor__submit-btn.components-button {\n  flex: 0 0 auto;\n  min-width: 100px;\n  justify-content: center;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__submit-row .flow-btn--cancel.components-button {\n  flex: 0 0 auto;\n  min-width: 80px !important;\n  justify-content: center;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__submit-row .flow-comment-editor__submit-btn:disabled,\n.flow-inline-popover__editor-wrap .flow-comment-editor__submit-row .flow-comment-editor__submit-btn[aria-disabled=true] {\n  background: transparent !important;\n  border-color: #dcdcde !important;\n  color: #757575 !important;\n  opacity: 1 !important;\n}\n.flow-inline-popover__editor-wrap .flow-comment-editor__error {\n  margin: 8px 0 0;\n  padding: 6px 10px;\n  background: #fcf0f1;\n  border: 1px solid #cc1818;\n  border-radius: 2px;\n  color: #cc1818;\n  font-size: 12px;\n}\n.flow-inline-popover__anchor-label {\n  font-size: 12px;\n  font-style: italic;\n  color: #757575;\n  margin-bottom: 8px;\n  padding: 6px 10px;\n  background: #f6f7f7;\n  border-radius: 2px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.flow-thread-popover {\n  pointer-events: auto;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n}\n@media (max-width: 600px) {\n  .flow-thread-popover {\n    left: 16px !important;\n    right: 16px !important;\n    transform: none !important;\n    align-items: stretch;\n  }\n  .flow-thread-popover .flow-thread-popover__caret {\n    display: none;\n  }\n}\n.flow-thread-popover__caret {\n  position: relative;\n  width: 16px;\n  height: 8px;\n  flex: 0 0 auto;\n  margin-bottom: -1px;\n  z-index: 2;\n  pointer-events: none;\n}\n.flow-thread-popover__caret::before {\n  content: \"\";\n  position: absolute;\n  left: 50%;\n  top: 0;\n  transform: translateX(-50%);\n  border-left: 8px solid transparent;\n  border-right: 8px solid transparent;\n  border-bottom: 8px solid #e0e0e0;\n}\n.flow-thread-popover__caret::after {\n  content: \"\";\n  position: absolute;\n  left: 50%;\n  top: 1px;\n  transform: translateX(-50%);\n  border-left: 7px solid transparent;\n  border-right: 7px solid transparent;\n  border-bottom: 7px solid #fff;\n}\n.flow-thread-popover--above {\n  flex-direction: column-reverse;\n}\n.flow-thread-popover--above .flow-thread-popover__caret {\n  margin-bottom: 0;\n  margin-top: -1px;\n}\n.flow-thread-popover--above .flow-thread-popover__caret::before {\n  top: auto;\n  bottom: 0;\n  border-bottom: 0;\n  border-top: 8px solid #e0e0e0;\n}\n.flow-thread-popover--above .flow-thread-popover__caret::after {\n  top: auto;\n  bottom: 1px;\n  border-bottom: 0;\n  border-top: 7px solid #fff;\n}\n.flow-thread-popover__card {\n  width: 360px;\n  max-width: calc(100vw - 32px);\n}\n@media (max-width: 600px) {\n  .flow-thread-popover__card {\n    width: auto;\n    max-width: 100%;\n  }\n}\n.flow-thread-popover__card {\n  background: #fff;\n  border: 1px solid #e0e0e0;\n  border-radius: 6px;\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);\n  padding: 14px;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n  font-size: 13px;\n  line-height: 1.5;\n  color: #1e1e1e;\n  position: relative;\n  z-index: 1;\n}\n.flow-thread-popover__header, .flow-thread-popover__reply-header {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr);\n  grid-template-rows: auto auto;\n  column-gap: 8px;\n  row-gap: 1px;\n  align-items: center;\n}\n.flow-thread-popover__header {\n  margin-bottom: 6px;\n  padding-right: 56px;\n}\n.flow-thread-popover__header-actions {\n  position: absolute;\n  top: 8px;\n  right: 8px;\n  z-index: 2;\n  display: flex;\n  align-items: center;\n  gap: 4px;\n}\n.flow-thread-popover__close.components-button {\n  position: static;\n  min-width: 0 !important;\n  width: 32px !important;\n  height: 32px !important;\n  padding: 4px !important;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #1e1e1e !important;\n  background: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  border-radius: 2px;\n  transition: background-color 0.15s ease;\n}\n.flow-thread-popover__close.components-button .components-button__icon,\n.flow-thread-popover__close.components-button svg {\n  margin: 0;\n  fill: currentColor;\n  width: 20px;\n  height: 20px;\n}\n.flow-thread-popover__close.components-button:hover:not(:disabled), .flow-thread-popover__close.components-button:focus-visible:not(:disabled), .flow-thread-popover__close.components-button:active:not(:disabled) {\n  color: #1e1e1e !important;\n  background: #ebebeb !important;\n  box-shadow: none !important;\n}\n.flow-thread-popover__resolve-icon.components-button {\n  min-width: 0 !important;\n  width: 32px !important;\n  height: 32px !important;\n  padding: 4px !important;\n  background: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  border-radius: 2px !important;\n  transition: background-color 0.15s ease;\n}\n.flow-thread-popover__resolve-icon.components-button svg {\n  width: 20px;\n  height: 20px;\n}\n.flow-thread-popover__resolve-icon.components-button svg .flow-comment-resolve__default,\n.flow-thread-popover__resolve-icon.components-button svg .flow-comment-resolve__hover {\n  transition: opacity 0.15s ease;\n}\n.flow-thread-popover__resolve-icon.components-button svg .flow-comment-resolve__hover {\n  opacity: 0;\n}\n.flow-thread-popover__resolve-icon.components-button:hover:not(:disabled), .flow-thread-popover__resolve-icon.components-button:focus-visible:not(:disabled) {\n  background: #e7f5e4 !important;\n}\n.flow-thread-popover__resolve-icon.components-button:hover:not(:disabled) svg .flow-comment-resolve__default, .flow-thread-popover__resolve-icon.components-button:focus-visible:not(:disabled) svg .flow-comment-resolve__default {\n  opacity: 0;\n}\n.flow-thread-popover__resolve-icon.components-button:hover:not(:disabled) svg .flow-comment-resolve__hover, .flow-thread-popover__resolve-icon.components-button:focus-visible:not(:disabled) svg .flow-comment-resolve__hover {\n  opacity: 1;\n}\n.flow-thread-popover__reply-header {\n  margin-bottom: 4px;\n}\n.flow-thread-popover__avatar {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 28px;\n  height: 28px;\n  border-radius: 50%;\n  font-size: 11px;\n  font-weight: 600;\n  line-height: 1;\n  flex-shrink: 0;\n  user-select: none;\n  grid-column: 1;\n  grid-row: 1/span 2;\n  align-self: center;\n}\n.flow-thread-popover__avatar--fallback {\n  background: #dcdcde;\n  color: #757575;\n}\n.flow-thread-popover__avatar--img {\n  display: block;\n  object-fit: cover;\n  background: transparent;\n}\n.flow-thread-popover__author {\n  font-weight: 600;\n  font-size: 12px;\n  color: #1e1e1e;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  grid-column: 2;\n  grid-row: 1;\n}\n.flow-thread-popover__date {\n  font-size: 11px;\n  color: #757575;\n  line-height: 1.2;\n  white-space: nowrap;\n  grid-column: 2;\n  grid-row: 2;\n}\n.flow-thread-popover__body {\n  font-size: 13px;\n  line-height: 1.6;\n  word-break: break-word;\n}\n.flow-thread-popover__body > * {\n  margin: 0;\n}\n.flow-thread-popover__body > * + * {\n  margin-top: 0.3em;\n}\n.flow-thread-popover__body strong {\n  font-weight: 600;\n}\n.flow-thread-popover__body em {\n  font-style: italic;\n}\n.flow-thread-popover__body a {\n  color: var(--wp-admin-theme-color, #007cba);\n  text-decoration: underline;\n}\n.flow-thread-popover__body ul, .flow-thread-popover__body ol {\n  padding-left: 1.4em;\n  margin: 0.3em 0;\n}\n.flow-thread-popover__replies {\n  margin-top: 10px;\n  padding-top: 10px;\n  border-top: 1px solid #e0e0e0;\n}\n.flow-thread-popover__reply {\n  padding: 8px 0 4px;\n}\n.flow-thread-popover__reply:last-child {\n  margin-bottom: 0;\n}\n.flow-thread-popover__reply-body {\n  font-size: 13px;\n  line-height: 1.6;\n  color: #1e1e1e;\n  word-break: break-word;\n}\n.flow-thread-popover__reply-body > * {\n  margin: 0;\n}\n.flow-thread-popover__reply-body > * + * {\n  margin-top: 0.4em;\n}\n.flow-thread-popover__reply-editor {\n  margin-top: 10px;\n  padding-top: 10px;\n  border-top: 1px solid #e0e0e0;\n}\n.flow-thread-popover__actions {\n  display: flex;\n  gap: 8px;\n  margin-top: 12px;\n  padding-top: 10px;\n  justify-content: flex-start;\n}\n.flow-thread-popover__actions .components-button {\n  min-height: 30px;\n}\n.flow-thread-popover__reply-btn.components-button.has-icon.has-text {\n  margin-left: 0;\n  margin-right: 12px;\n  gap: 8px !important;\n  text-decoration: underline;\n  text-underline-offset: 2px;\n}\n.flow-thread-popover__reply-btn.components-button.has-icon.has-text:hover:not(:disabled), .flow-thread-popover__reply-btn.components-button.has-icon.has-text:focus-visible:not(:disabled) {\n  text-decoration: none;\n}\n.flow-thread-popover__reply-btn.components-button.has-icon.has-text svg,\n.flow-thread-popover__reply-btn.components-button.has-icon.has-text .components-button__icon {\n  margin-right: 0 !important;\n}\n.flow-thread-popover__resolved-badge {\n  margin-top: 10px;\n  padding: 0 8px;\n  height: 26px;\n  background: #edfaee;\n  border: 1px solid #82d68e;\n  border-radius: 3px;\n  color: #1a6b28;\n  font-size: 11px;\n  font-weight: 600;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  white-space: nowrap;\n  margin-left: auto;\n}\n.flow-thread-popover .flow-comment-editor {\n  display: flex;\n  flex-direction: column;\n}\n.flow-thread-popover .flow-comment-editor__toolbar {\n  display: flex;\n  align-items: stretch;\n  gap: 0;\n  padding: 0;\n  background: #fff;\n  border: 1px solid #1d2327;\n  border-bottom: 0;\n  border-radius: 2px 2px 0 0;\n  overflow-x: auto;\n  overflow-y: hidden;\n}\n.flow-thread-popover .flow-comment-editor__toolbar .components-button {\n  min-width: 32px !important;\n  width: auto !important;\n  height: 36px !important;\n  padding: 0 6px !important;\n  border-radius: 0;\n  border-left: 1px solid #1d2327;\n  color: #1e1e1e;\n  box-shadow: none;\n  flex-shrink: 0;\n}\n.flow-thread-popover .flow-comment-editor__toolbar .components-button:hover:not(:disabled) {\n  background: #f0f0f0;\n}\n.flow-thread-popover .flow-comment-editor__toolbar .components-button.is-pressed:not(:disabled) {\n  background: #f0f6fc;\n  color: var(--wp-admin-theme-color, #007cba);\n}\n.flow-thread-popover .flow-comment-editor__toolbar .components-button.is-small,\n.flow-thread-popover .flow-comment-editor__toolbar .components-button[data-size=small] {\n  min-width: 32px !important;\n  width: auto !important;\n  height: 36px !important;\n  padding: 0 6px !important;\n  border-radius: 0;\n}\n.flow-thread-popover .flow-comment-editor__toolbar-group {\n  display: flex;\n  align-items: stretch;\n  flex-shrink: 0;\n  border-left: 1px solid #1d2327;\n}\n.flow-thread-popover .flow-comment-editor__toolbar-group .components-button {\n  border-left: 0;\n}\n.flow-thread-popover .flow-comment-editor__block-select {\n  height: 36px;\n  padding: 0 10px;\n  border: 0;\n  border-radius: 0;\n  background: #fff;\n  font-size: 12px;\n  cursor: pointer;\n  flex-shrink: 0;\n  min-width: 84px;\n}\n.flow-thread-popover .flow-comment-editor__block-select:hover {\n  background: #f0f0f0;\n}\n.flow-thread-popover .flow-comment-editor__block-select:focus {\n  outline: none;\n  box-shadow: inset 0 0 0 2px var(--wp-admin-theme-color, #007cba);\n}\n.flow-thread-popover .flow-comment-editor__toolbar-sep {\n  display: none;\n}\n.flow-thread-popover .flow-comment-editor__content {\n  border: 1px solid #1d2327;\n  border-radius: 0 0 2px 2px;\n  background: #fff;\n  cursor: text;\n}\n.flow-thread-popover .flow-comment-editor__content:focus-within {\n  border-color: var(--wp-admin-theme-color, #007cba);\n  box-shadow: 0 0 0 1px var(--wp-admin-theme-color, #007cba);\n}\n.flow-thread-popover .flow-comment-editor__content .ProseMirror {\n  position: relative;\n  min-height: 75px;\n  max-height: 150px;\n  overflow-y: auto;\n  padding: 8px 10px;\n  line-height: 1.6;\n  outline: none;\n  word-break: break-word;\n}\n.flow-thread-popover .flow-comment-editor__content .ProseMirror p.is-editor-empty:first-child::before {\n  content: attr(data-placeholder);\n  color: #949494;\n  pointer-events: none;\n  float: left;\n  height: 0;\n}\n.flow-thread-popover .flow-comment-editor__content .ProseMirror ul, .flow-thread-popover .flow-comment-editor__content .ProseMirror ol {\n  padding-left: 1.5em;\n  margin: 0.3em 0;\n}\n.flow-thread-popover .flow-comment-editor__content .ProseMirror li {\n  margin: 0.1em 0;\n}\n.flow-thread-popover .flow-comment-editor__content .ProseMirror a {\n  color: var(--wp-admin-theme-color, #007cba);\n  text-decoration: underline;\n}\n.flow-thread-popover .flow-comment-editor__content .ProseMirror strong {\n  font-weight: 600;\n}\n.flow-thread-popover .flow-comment-editor__content .ProseMirror em {\n  font-style: italic;\n}\n.flow-thread-popover .flow-comment-editor--basic .flow-comment-editor__content {\n  border-radius: 2px;\n}\n.flow-thread-popover .flow-comment-editor__textarea {\n  display: block;\n  width: 100%;\n  min-height: 75px;\n  max-height: 150px;\n  margin: 0;\n  padding: 8px 10px;\n  border: 0;\n  border-radius: inherit;\n  background: #fff;\n  font-family: inherit;\n  font-size: 13px;\n  line-height: 1.6;\n  resize: vertical;\n  box-sizing: border-box;\n  outline: none;\n  color: #1e1e1e;\n}\n.flow-thread-popover .flow-comment-editor__textarea::placeholder {\n  color: #949494;\n}\n.flow-thread-popover .flow-comment-editor__link-row {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  padding: 4px 6px;\n  background: #f6f7f7;\n  border: 1px solid #1d2327;\n  border-top: none;\n  border-bottom: none;\n}\n.flow-thread-popover .flow-comment-editor__link-input {\n  flex: 1;\n  height: 28px;\n  padding: 0 6px;\n  border: 1px solid #949494;\n  border-radius: 2px;\n  background: #fff;\n  font-size: 12px;\n}\n.flow-thread-popover .flow-comment-editor__link-input:focus {\n  outline: none;\n  border-color: var(--wp-admin-theme-color, #007cba);\n  box-shadow: 0 0 0 1px var(--wp-admin-theme-color, #007cba);\n}\n.flow-thread-popover .flow-comment-editor__submit-row {\n  display: flex;\n  gap: 8px;\n  margin-top: 10px;\n  justify-content: flex-start;\n}\n.flow-thread-popover .flow-comment-editor__submit-row .flow-comment-editor__submit-btn.components-button {\n  flex: 0 0 auto;\n  min-width: 80px;\n  justify-content: center;\n}\n.flow-thread-popover .flow-comment-editor__submit-row .flow-btn--cancel.components-button {\n  flex: 0 0 auto;\n  min-width: 80px !important;\n  justify-content: center;\n}\n.flow-thread-popover .flow-comment-editor__submit-row .flow-comment-editor__submit-btn:disabled,\n.flow-thread-popover .flow-comment-editor__submit-row .flow-comment-editor__submit-btn[aria-disabled=true] {\n  background: transparent !important;\n  border-color: #dcdcde !important;\n  color: #757575 !important;\n  opacity: 1 !important;\n}\n.flow-thread-popover .flow-comment-editor__error {\n  margin: 8px 0 0;\n  padding: 6px 10px;\n  background: #fcf0f1;\n  border: 1px solid #cc1818;\n  border-radius: 2px;\n  color: #cc1818;\n  font-size: 12px;\n}";

/***/ },

/***/ "./src/review-page/sidebar.scss?raw"
/*!******************************************!*\
  !*** ./src/review-page/sidebar.scss?raw ***!
  \******************************************/
(module) {

module.exports = ".flow-confirm-dialog {\n  position: fixed;\n  inset: 0;\n  z-index: 1000003;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 16px;\n}\n\n.flow-confirm-dialog__backdrop {\n  position: absolute;\n  inset: 0;\n  margin: 0;\n  padding: 0;\n  border: 0;\n  background: rgba(0, 0, 0, 0.45);\n  cursor: default;\n}\n\n.flow-confirm-dialog__panel {\n  position: relative;\n  width: 100%;\n  max-width: min(420px, 100% - 32px);\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen-Sans, Ubuntu, Cantarell, \"Helvetica Neue\", sans-serif;\n  font-size: 13px;\n  line-height: 1.4;\n  color: #c92122;\n  background: #ffebea;\n  border: 1px solid #ffd1d0;\n  border-left-width: 4px;\n  border-left-color: #c92122;\n  border-radius: 2px;\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);\n}\n\n.flow-confirm-dialog__alert {\n  display: flex;\n  align-items: flex-start;\n  gap: 12px;\n  padding: 12px 16px;\n}\n\n.flow-confirm-dialog__icon {\n  display: flex;\n  flex-shrink: 0;\n  align-items: center;\n  justify-content: center;\n  width: 24px;\n  height: 24px;\n  color: #c92122;\n}\n.flow-confirm-dialog__icon svg {\n  display: block;\n  width: 24px;\n  height: 24px;\n}\n\n.flow-confirm-dialog__content {\n  flex: 1 1 auto;\n  min-width: 0;\n}\n\n.flow-confirm-dialog__title {\n  margin: 0 0 2px;\n  font-size: inherit;\n  font-weight: 600;\n  line-height: inherit;\n  color: inherit;\n}\n\n.flow-confirm-dialog__message {\n  margin: 0;\n  font-size: inherit;\n  font-weight: 400;\n  line-height: inherit;\n  color: inherit;\n}\n\n.flow-confirm-dialog__actions {\n  display: flex;\n  justify-content: flex-end;\n  gap: 8px;\n  padding: 0 16px 12px;\n}\n\n.flow-confirm-dialog__confirm.components-button {\n  min-width: 80px;\n  justify-content: center;\n  background: #c92122 !important;\n  border: 1px solid #c92122 !important;\n  color: #fff !important;\n  box-shadow: none !important;\n}\n.flow-confirm-dialog__confirm.components-button:hover:not(:disabled), .flow-confirm-dialog__confirm.components-button:active:not(:disabled) {\n  background: #b32d2e !important;\n  border-color: #b32d2e !important;\n  color: #fff !important;\n}\n.flow-confirm-dialog__confirm.components-button:focus:not(:disabled) {\n  box-shadow: 0 0 0 var(--wp-admin-border-width-focus, 2px) #fff, 0 0 0 calc(var(--wp-admin-border-width-focus, 2px) + 1px) #c92122 !important;\n  outline: 1px solid transparent;\n}\n\n*,\n*::before,\n*::after {\n  box-sizing: border-box;\n}\n\n:host {\n  display: block;\n  position: fixed;\n  top: 64px;\n  right: 0;\n  width: 360px;\n  height: calc(100vh - 64px - var(--flow-ew-upsell-bar-height, 0px));\n  z-index: 999998;\n  overflow: hidden;\n  background: #fff;\n  border-left: 1px solid #e0e0e0;\n  box-shadow: -1px 0 0 0 rgba(0, 0, 0, 0.05);\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Oxygen-Sans, Ubuntu, Cantarell, \"Helvetica Neue\", sans-serif;\n  font-size: 13px;\n  line-height: 1.4;\n  color: #1e1e1e;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  transform: translateX(0);\n  opacity: 1;\n  transition: transform 180ms ease, opacity 180ms ease;\n  will-change: transform, opacity;\n}\n\n@media (max-width: 782px) {\n  :host {\n    width: 100vw;\n    max-width: 100vw;\n    border-left: 0;\n  }\n}\n:host([data-open=false]) {\n  transform: translateX(100%);\n  opacity: 0;\n  pointer-events: none;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  :host {\n    transition: none;\n  }\n}\nbutton,\ninput,\nselect,\ntextarea {\n  font-family: inherit;\n  font-size: inherit;\n  line-height: inherit;\n  color: inherit;\n}\n\n.components-button {\n  font-weight: 600;\n}\n\n.flow-sidebar {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  background: #fff;\n}\n.flow-sidebar__tablist-and-close {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  position: relative;\n}\n.flow-sidebar__header {\n  flex: 0 0 auto;\n  display: flex;\n  align-items: stretch;\n  gap: 0;\n  height: 48px;\n  padding: 0 8px 0 0;\n  border-bottom: 1px solid #e0e0e0;\n  background: #fff;\n}\n.flow-sidebar__header-close.components-button {\n  flex: 0 0 auto;\n  align-self: center;\n  width: 36px;\n  min-width: 36px;\n  height: 36px;\n  padding: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #1e1e1e;\n}\n.flow-sidebar__header-close.components-button .components-button__icon,\n.flow-sidebar__header-close.components-button svg {\n  margin: 0;\n  fill: currentColor;\n}\n.flow-sidebar__tab-panel {\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 auto;\n  min-height: 0;\n}\n.flow-sidebar__tabs {\n  flex: 1 1 auto;\n  display: flex;\n  align-items: stretch;\n}\n.flow-sidebar__tab {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 144px;\n  padding: 10px 16px;\n  background: none;\n  border: 0;\n  border-bottom: 2px solid transparent;\n  font-family: inherit;\n  font-size: 13px;\n  font-weight: 500;\n  color: #757575;\n  cursor: pointer;\n  white-space: nowrap;\n  transition: color 0.1s ease, border-color 0.1s ease;\n}\n.flow-sidebar__tab:hover {\n  color: #1e1e1e;\n}\n.flow-sidebar__tab--active {\n  color: #1e1e1e;\n  font-weight: 600;\n  border-bottom-color: var(--wp-admin-theme-color, #007cba);\n}\n.flow-sidebar__tab-label {\n  vertical-align: middle;\n}\n.flow-sidebar__tab-count {\n  box-sizing: border-box;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  margin-left: 6px;\n  min-width: 18px;\n  height: 18px;\n  padding: 0 6px;\n  border-radius: 999px;\n  font-size: 10px;\n  font-weight: 700;\n  line-height: 1;\n  font-variant-numeric: tabular-nums;\n  color: #fff;\n  background: #cc1818;\n  border: 0;\n}\n.flow-sidebar__tab-count--comments {\n  background: var(--wp-admin-theme-color, var(--wp-admin-theme-color, #007cba));\n}\n.flow-sidebar__tab-count--resolved {\n  background: #458037;\n}\n.flow-sidebar__tab:not(.flow-sidebar__tab--active) .flow-sidebar__tab-count {\n  background: #e0e0e0;\n  color: #757575;\n}\n.flow-sidebar__section-divider {\n  flex-shrink: 0;\n  border-top: 2px solid #e0e0e0;\n}\n.flow-sidebar__tab-scroll {\n  display: flex;\n  flex-direction: column;\n  flex-grow: 1;\n  overflow-y: auto;\n  scrollbar-gutter: auto;\n  background: #fff;\n}\n.flow-sidebar__tab-content {\n  display: flex;\n  flex-direction: column;\n  flex-grow: 1;\n  min-height: 0;\n}\n.flow-sidebar__body {\n  padding: 12px;\n  flex-shrink: 0;\n}\n.flow-sidebar__placeholder {\n  padding: 24px 16px;\n  color: #757575;\n  font-size: 13px;\n  text-align: center;\n}\n\n.flow-inline-comments-empty {\n  padding: 20px 16px 24px;\n  text-align: left;\n  color: #1e1e1e;\n  border-top: 1px solid #e0e0e0;\n}\n.flow-inline-comments-empty__icon-wrap {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 48px;\n  height: 48px;\n  margin: 0 auto 14px;\n  border-radius: 50%;\n  background: #f0f6fc;\n  color: var(--wp-admin-theme-color, #007cba);\n}\n.flow-inline-comments-empty__icon-wrap svg {\n  fill: currentColor;\n}\n.flow-inline-comments-empty__title {\n  margin: 0 0 8px;\n  font-size: 15px;\n  font-weight: 600;\n  line-height: 1.3;\n  text-align: center;\n  color: #1e1e1e;\n}\n.flow-inline-comments-empty__lead {\n  margin: 0 0 14px;\n  font-size: 13px;\n  line-height: 1.4;\n  color: #1e1e1e;\n  text-align: center;\n}\n.flow-inline-comments-empty__list {\n  margin: 0;\n  padding: 0 0 0 1.1em;\n  font-size: 12px;\n  line-height: 1.5;\n  color: #757575;\n}\n.flow-inline-comments-empty__list li {\n  margin-bottom: 8px;\n}\n.flow-inline-comments-empty__list li:last-child {\n  margin-bottom: 0;\n}\n\n.flow-btn--text.components-button {\n  background: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  color: var(--wp-admin-theme-color, #007cba);\n}\n.flow-btn--text.components-button:hover:not(:disabled), .flow-btn--text.components-button:active:not(:disabled) {\n  color: var(--wp-admin-theme-color, #007cba);\n  background: #f0f6fc !important;\n}\n.flow-btn--text.components-button:focus:not(:disabled) {\n  box-shadow: 0 0 0 var(--wp-admin-border-width-focus, 2px) #fff, 0 0 0 calc(var(--wp-admin-border-width-focus, 2px) + 1px) var(--wp-admin-theme-color, #007cba) !important;\n  outline: 1px solid transparent;\n}\n.flow-btn--text.components-button:disabled, .flow-btn--text.components-button[aria-disabled=true] {\n  background: transparent !important;\n  border: none !important;\n  color: #8c8f94 !important;\n  opacity: 1 !important;\n}\n\n.flow-btn--cancel.components-button {\n  min-width: 80px !important;\n  text-decoration: underline;\n  text-underline-offset: 2px;\n}\n.flow-btn--cancel.components-button:hover:not(:disabled), .flow-btn--cancel.components-button:active:not(:disabled) {\n  text-decoration: none;\n}\n\n.flow-comment-editor__submit-btn.components-button {\n  background: transparent !important;\n  border: 1px solid var(--wp-admin-theme-color, #007cba) !important;\n  color: var(--wp-admin-theme-color, #007cba) !important;\n  box-shadow: none !important;\n}\n.flow-comment-editor__submit-btn.components-button:hover:not(:disabled), .flow-comment-editor__submit-btn.components-button:active:not(:disabled) {\n  background: #f0f6fc !important;\n  border-color: var(--wp-admin-theme-color, #007cba) !important;\n  color: var(--wp-admin-theme-color, #007cba) !important;\n}\n.flow-comment-editor__submit-btn.components-button:focus:not(:disabled) {\n  box-shadow: 0 0 0 var(--wp-admin-border-width-focus, 2px) #fff, 0 0 0 calc(var(--wp-admin-border-width-focus, 2px) + 1px) var(--wp-admin-theme-color, #007cba) !important;\n  outline: 1px solid transparent;\n}\n.flow-comment-editor__submit-btn.components-button:disabled, .flow-comment-editor__submit-btn.components-button[aria-disabled=true] {\n  background: transparent !important;\n  border-color: #dcdcde !important;\n  color: #757575 !important;\n  opacity: 1 !important;\n}\n\n.flow-comment-threads {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  padding: 12px;\n}\n\n.flow-comment-threads > .flow-comment-thread:hover {\n  border-color: #666a70;\n}\n\n.flow-comment-thread {\n  border: 1px solid #e0e0e0;\n  border-radius: 4px;\n  background: #fff;\n  overflow: hidden;\n  transition: border-color 0.1s ease;\n  --flow-comment-fade-bg: #fff;\n}\n.flow-comment-thread__replies {\n  padding: 0 12px 4px 12px;\n  margin: 0 0 0 6px;\n  border-left: 1px solid #e0e0e0;\n}\n.flow-comment-thread__toggle {\n  display: block;\n  padding: 4px 0 8px;\n  background: none;\n  border: 0;\n  color: var(--wp-admin-theme-color, #007cba);\n  font-size: 12px;\n  font-weight: 400;\n  cursor: pointer;\n  text-decoration: underline;\n  text-underline-offset: 2px;\n}\n.flow-comment-thread__toggle:hover {\n  text-decoration: underline;\n}\n.flow-comment-thread__reply-editor {\n  padding: 0 12px 12px;\n}\n.flow-comment-thread__resolve-row {\n  padding: 12px 0;\n  display: flex;\n  justify-content: flex-start;\n}\n.flow-comment-thread__resolve-row .components-button {\n  min-height: 30px;\n  margin-left: 0;\n}\n.flow-comment-thread__reply-btn.components-button.has-icon.has-text {\n  margin-left: 12px;\n  margin-right: 12px;\n  gap: 8px !important;\n  border-radius: 2px;\n  text-decoration: underline;\n  text-underline-offset: 2px;\n  transition: background-color 0.15s ease;\n}\n.flow-comment-thread__reply-btn.components-button.has-icon.has-text:hover:not(:disabled), .flow-comment-thread__reply-btn.components-button.has-icon.has-text:focus-visible:not(:disabled) {\n  background: #e8edfc !important;\n  text-decoration: none;\n}\n.flow-comment-thread__reply-btn.components-button.has-icon.has-text svg,\n.flow-comment-thread__reply-btn.components-button.has-icon.has-text .components-button__icon {\n  margin-right: 0 !important;\n}\n\n.flow-comment-card {\n  padding: 12px;\n}\n.flow-comment-card__header {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr) auto;\n  grid-template-rows: auto auto;\n  column-gap: 8px;\n  row-gap: 1px;\n  align-items: center;\n  margin-bottom: 6px;\n}\n.flow-comment-card__avatar {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 28px;\n  height: 28px;\n  border-radius: 50%;\n  font-size: 11px;\n  font-weight: 600;\n  line-height: 1;\n  user-select: none;\n  grid-column: 1;\n  grid-row: 1/span 2;\n  align-self: center;\n}\n.flow-comment-card__avatar--fallback {\n  background: #dcdcde;\n  color: #757575;\n}\n.flow-comment-card__avatar--img {\n  display: block;\n  object-fit: cover;\n  background: transparent;\n}\n.flow-comment-card__author {\n  font-weight: 600;\n  font-size: 12px;\n  color: #1e1e1e;\n  white-space: nowrap;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  grid-column: 2;\n  grid-row: 1;\n}\n.flow-comment-card__date {\n  font-size: 11px;\n  color: #757575;\n  white-space: nowrap;\n  line-height: 1.2;\n  grid-column: 2;\n  grid-row: 2;\n}\n.flow-comment-card__actions {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  grid-column: 3;\n  grid-row: 1/span 2;\n  align-self: center;\n}\n.flow-comment-card__action-btn.components-button {\n  min-width: 0 !important;\n  width: 28px !important;\n  height: 28px !important;\n  padding: 0 !important;\n  color: #757575;\n  border-radius: 2px;\n}\n.flow-comment-card__action-btn.components-button:hover:not(:disabled) {\n  color: #1e1e1e;\n  background: #f0f0f0;\n}\n.flow-comment-card__action-btn.components-button.flow-comment-card__action-btn--destructive {\n  color: #d63638;\n}\n.flow-comment-card__action-btn.components-button.flow-comment-card__action-btn--destructive:hover:not(:disabled) {\n  color: #b32d2e;\n  background: #fcf0f1;\n}\n.flow-comment-card__action-btn.components-button svg {\n  width: 20px;\n  height: 20px;\n}\n.flow-comment-card__menu {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n}\n.flow-comment-card__action-icon.components-button {\n  min-width: 0 !important;\n  width: 24px !important;\n  height: 24px !important;\n  padding: 0 !important;\n  color: #1e1e1e !important;\n  background: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  border-radius: 2px;\n  transition: background-color 0.15s ease;\n}\n.flow-comment-card__action-icon.components-button svg {\n  width: 24px;\n  height: 24px;\n}\n.flow-comment-card__action-icon.components-button:hover:not(:disabled), .flow-comment-card__action-icon.components-button:focus-visible:not(:disabled), .flow-comment-card__action-icon.components-button:active:not(:disabled) {\n  color: #1e1e1e !important;\n  box-shadow: none !important;\n}\n.flow-comment-card__action-icon--edit.components-button, .flow-comment-card__action-icon--destructive.components-button, .flow-comment-card__action-icon--close.components-button, .flow-comment-card__menu-trigger.components-button {\n  width: 32px !important;\n  height: 32px !important;\n  padding: 4px !important;\n}\n.flow-comment-card__action-icon--edit.components-button svg, .flow-comment-card__action-icon--destructive.components-button svg, .flow-comment-card__action-icon--close.components-button svg, .flow-comment-card__menu-trigger.components-button svg {\n  width: 20px;\n  height: 20px;\n}\n.flow-comment-card__action-icon--edit.components-button:hover:not(:disabled), .flow-comment-card__action-icon--edit.components-button:focus-visible:not(:disabled) {\n  background: #e8edfc !important;\n}\n.flow-comment-card__action-icon--destructive.components-button {\n  color: #c92222 !important;\n}\n.flow-comment-card__action-icon--destructive.components-button:hover:not(:disabled), .flow-comment-card__action-icon--destructive.components-button:focus-visible:not(:disabled), .flow-comment-card__action-icon--destructive.components-button:active:not(:disabled) {\n  color: #c92222 !important;\n  background: #ffeaea !important;\n}\n.flow-comment-card__action-icon--close.components-button:hover:not(:disabled), .flow-comment-card__action-icon--close.components-button:focus-visible:not(:disabled) {\n  background: #ebebeb !important;\n}\n.flow-comment-card__menu-trigger.components-button:hover:not(:disabled), .flow-comment-card__menu-trigger.components-button:focus-visible:not(:disabled), .flow-comment-card__menu-trigger.components-button:active:not(:disabled) {\n  color: #1e1e1e !important;\n  background: #ebebeb !important;\n  box-shadow: none !important;\n}\n.flow-comment-card__resolve-icon.components-button {\n  min-width: 0 !important;\n  width: 32px !important;\n  height: 32px !important;\n  padding: 4px !important;\n  color: #458037 !important;\n  background: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  border-radius: 2px !important;\n  transition: background-color 0.15s ease;\n}\n.flow-comment-card__resolve-icon.components-button svg {\n  width: 20px;\n  height: 20px;\n}\n.flow-comment-card__resolve-icon.components-button svg .flow-comment-resolve__default,\n.flow-comment-card__resolve-icon.components-button svg .flow-comment-resolve__hover {\n  transition: opacity 0.15s ease;\n}\n.flow-comment-card__resolve-icon.components-button svg .flow-comment-resolve__hover {\n  opacity: 0;\n}\n.flow-comment-card__resolve-icon.components-button:hover:not(:disabled), .flow-comment-card__resolve-icon.components-button:focus-visible:not(:disabled), .flow-comment-card__resolve-icon.components-button:active:not(:disabled) {\n  color: #458037 !important;\n  background: #e7f5e4 !important;\n  box-shadow: none !important;\n}\n.flow-comment-card__resolve-icon.components-button:hover:not(:disabled) svg .flow-comment-resolve__default, .flow-comment-card__resolve-icon.components-button:focus-visible:not(:disabled) svg .flow-comment-resolve__default, .flow-comment-card__resolve-icon.components-button:active:not(:disabled) svg .flow-comment-resolve__default {\n  opacity: 0;\n}\n.flow-comment-card__resolve-icon.components-button:hover:not(:disabled) svg .flow-comment-resolve__hover, .flow-comment-card__resolve-icon.components-button:focus-visible:not(:disabled) svg .flow-comment-resolve__hover, .flow-comment-card__resolve-icon.components-button:active:not(:disabled) svg .flow-comment-resolve__hover {\n  opacity: 1;\n}\n.flow-comment-card__action-btn--collapse.components-button {\n  min-width: 0 !important;\n  width: 32px !important;\n  height: 32px !important;\n  padding: 4px !important;\n  color: #1e1e1e;\n  border-radius: 2px;\n  transition: background-color 0.15s ease;\n}\n.flow-comment-card__action-btn--collapse.components-button:hover:not(:disabled), .flow-comment-card__action-btn--collapse.components-button:focus-visible:not(:disabled) {\n  color: #1e1e1e;\n  background: #ebebeb !important;\n}\n.flow-comment-card__action-btn--collapse.components-button svg {\n  width: 20px;\n  height: 20px;\n}\n.flow-comment-card__action-btn--reply.components-button {\n  opacity: 1;\n  color: var(--wp-admin-theme-color, #007cba);\n}\n.flow-comment-card__action-btn--reply.components-button:hover:not(:disabled) {\n  color: var(--wp-admin-theme-color, #007cba);\n  background: #f0f6fc;\n}\n.flow-comment-card__resolved-icon {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 24px;\n  height: 24px;\n  flex-shrink: 0;\n}\n.flow-comment-card__resolved-icon svg {\n  width: 24px;\n  height: 24px;\n}\n.flow-comment-card__body {\n  font-size: 13px;\n  line-height: 1.6;\n  color: #1e1e1e;\n  word-break: break-word;\n}\n.flow-comment-card__body > * {\n  margin: 0;\n}\n.flow-comment-card__body > * + * {\n  margin-top: 0.4em;\n}\n.flow-comment-card__body strong {\n  font-weight: 600;\n}\n.flow-comment-card__body em {\n  font-style: italic;\n}\n.flow-comment-card__body ul,\n.flow-comment-card__body ol {\n  padding-left: 1.4em;\n  margin: 0.3em 0;\n}\n.flow-comment-card__body a {\n  color: var(--wp-admin-theme-color, #007cba);\n  text-decoration: underline;\n}\n.flow-comment-card__body h1 {\n  font-size: 1.3em;\n  font-weight: 600;\n}\n.flow-comment-card__body h2 {\n  font-size: 1.1em;\n  font-weight: 600;\n}\n.flow-comment-card__body h3 {\n  font-size: 1em;\n  font-weight: 600;\n}\n.flow-comment-card__body--truncated {\n  max-height: 80px;\n  overflow: hidden;\n  position: relative;\n  cursor: pointer;\n}\n.flow-comment-card__body--truncated::after {\n  content: \"\";\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  height: 24px;\n  background: linear-gradient(transparent, var(--flow-comment-fade-bg));\n  pointer-events: none;\n}\n.flow-comment-card--reply {\n  padding: 8px 0 4px;\n}\n\n.flow-inline-anchor {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 2px;\n  width: 100%;\n  padding: 10px 16px;\n  margin: 0;\n  background: #f6f7f7;\n  border: 0;\n  color: var(--wp-admin-theme-color, #007cba);\n  font-size: 12px;\n  font-style: normal;\n  line-height: 1.5;\n  text-align: left;\n  overflow: hidden;\n  font-family: inherit;\n  text-decoration: underline;\n  text-underline-offset: 2px;\n  pointer-events: none;\n}\n.flow-inline-anchor__text {\n  display: block;\n  width: 100%;\n  overflow: hidden;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n}\n.flow-inline-anchor__hint {\n  display: inline-block;\n  font-size: 11px;\n  font-style: normal;\n  font-weight: 600;\n  color: #7a5a00;\n}\n.flow-inline-anchor--outdated {\n  background: #fff6cc;\n  color: #7a5a00;\n}\n\n.flow-inline-thread--navigable:hover .flow-inline-anchor {\n  background: #eef3f8;\n}\n.flow-inline-thread--navigable:hover .flow-inline-anchor--outdated {\n  background: #ffefb3;\n}\n\n.flow-inline-thread {\n  border: 1px solid #e0e0e0;\n  border-radius: 4px;\n  background: #fff;\n  overflow: hidden;\n  transition: border-color 0.1s ease;\n}\n.flow-inline-thread--navigable {\n  cursor: pointer;\n}\n.flow-inline-thread--navigable:hover {\n  border-color: #666a70;\n}\n.flow-inline-thread .flow-comment-thread {\n  border: none;\n  border-radius: 0;\n  background: transparent;\n}\n.flow-inline-thread--outdated {\n  border-color: #e5c453;\n  background: #fff6cc;\n}\n.flow-inline-thread--outdated.flow-inline-thread--navigable:hover {\n  border-color: #666a70;\n}\n.flow-inline-thread--outdated .flow-comment-thread__replies {\n  border-left-color: #e5c453;\n}\n\n.flow-comment-editor {\n  display: flex;\n  flex-direction: column;\n}\n.flow-comment-editor__toolbar {\n  display: flex;\n  align-items: stretch;\n  gap: 0;\n  padding: 0;\n  background: #fff;\n  border: 1px solid #1d2327;\n  border-bottom: 0;\n  border-radius: 2px 2px 0 0;\n  overflow-x: auto;\n  overflow-y: hidden;\n  scrollbar-gutter: stable;\n}\n.flow-comment-editor__toolbar .components-button {\n  min-width: 32px !important;\n  width: auto !important;\n  height: 36px !important;\n  padding: 0 6px !important;\n  border-radius: 0;\n  border-left: 1px solid #1d2327;\n  color: #1e1e1e;\n  box-shadow: none;\n  flex-shrink: 0;\n}\n.flow-comment-editor__toolbar .components-button:hover:not(:disabled) {\n  background: #f0f0f0;\n}\n.flow-comment-editor__toolbar .components-button.is-pressed:not(:disabled) {\n  background: #f0f6fc;\n  color: var(--wp-admin-theme-color, #007cba);\n}\n.flow-comment-editor__toolbar .components-button.is-small,\n.flow-comment-editor__toolbar .components-button[data-size=small] {\n  min-width: 32px !important;\n  width: auto !important;\n  height: 36px !important;\n  padding: 0 6px !important;\n  border-radius: 0;\n}\n.flow-comment-editor__toolbar-group {\n  display: flex;\n  align-items: stretch;\n  flex-shrink: 0;\n  border-left: 1px solid #1d2327;\n}\n.flow-comment-editor__toolbar-group .components-button {\n  border-left: 0;\n}\n.flow-comment-editor__block-select {\n  height: 36px;\n  padding: 0 10px;\n  border: 0;\n  border-right: 0;\n  border-radius: 0;\n  background: #fff;\n  font-size: 12px;\n  cursor: pointer;\n  flex-shrink: 0;\n  min-width: 84px;\n}\n.flow-comment-editor__block-select:hover {\n  background: #f0f0f0;\n}\n.flow-comment-editor__block-select:focus {\n  outline: none;\n  box-shadow: inset 0 0 0 2px var(--wp-admin-theme-color, #007cba);\n}\n.flow-comment-editor__toolbar-sep {\n  display: none;\n}\n.flow-comment-editor__content {\n  border: 1px solid #1d2327;\n  border-radius: 0 0 2px 2px;\n  background: #fff;\n  cursor: text;\n}\n.flow-comment-editor__content:focus-within {\n  border-color: var(--wp-admin-theme-color, #007cba);\n  box-shadow: 0 0 0 1px var(--wp-admin-theme-color, #007cba);\n}\n.flow-comment-editor__content .ProseMirror {\n  position: relative;\n  min-height: 75px;\n  max-height: 280px;\n  overflow-y: auto;\n  padding: 8px 10px;\n  line-height: 1.6;\n  outline: none;\n  word-break: break-word;\n}\n.flow-comment-editor__content .ProseMirror p.is-editor-empty:first-child::before {\n  content: attr(data-placeholder);\n  color: #949494;\n  pointer-events: none;\n  float: left;\n  height: 0;\n}\n.flow-comment-editor__content .ProseMirror ul,\n.flow-comment-editor__content .ProseMirror ol {\n  padding-left: 1.5em;\n  margin: 0.3em 0;\n}\n.flow-comment-editor__content .ProseMirror li {\n  margin: 0.1em 0;\n}\n.flow-comment-editor__content .ProseMirror a {\n  color: var(--wp-admin-theme-color, #007cba);\n  text-decoration: underline;\n}\n.flow-comment-editor__content .ProseMirror strong {\n  font-weight: 600;\n}\n.flow-comment-editor__content .ProseMirror em {\n  font-style: italic;\n}\n.flow-comment-editor__content .ProseMirror h1,\n.flow-comment-editor__content .ProseMirror h2,\n.flow-comment-editor__content .ProseMirror h3 {\n  font-weight: 600;\n  line-height: 1.3;\n  margin: 0.5em 0 0.25em;\n}\n.flow-comment-editor__content .ProseMirror h1 {\n  font-size: 1.4em;\n}\n.flow-comment-editor__content .ProseMirror h2 {\n  font-size: 1.2em;\n}\n.flow-comment-editor__content .ProseMirror h3 {\n  font-size: 1.05em;\n}\n.flow-comment-editor--basic .flow-comment-editor__content {\n  border-radius: 2px;\n}\n.flow-comment-editor__textarea {\n  display: block;\n  width: 100%;\n  min-height: 75px;\n  max-height: 280px;\n  margin: 0;\n  padding: 8px 10px;\n  border: 0;\n  border-radius: inherit;\n  background: #fff;\n  font-family: inherit;\n  font-size: 13px;\n  line-height: 1.6;\n  resize: vertical;\n  box-sizing: border-box;\n  outline: none;\n  color: #1e1e1e;\n}\n.flow-comment-editor__textarea::placeholder {\n  color: #949494;\n}\n.flow-comment-editor__link-row {\n  display: flex;\n  align-items: center;\n  gap: 4px;\n  padding: 4px 6px;\n  background: #f6f7f7;\n  border: 1px solid #1d2327;\n  border-top: none;\n  border-bottom: none;\n}\n.flow-comment-editor__link-input {\n  flex: 1;\n  height: 28px;\n  padding: 0 6px;\n  border: 1px solid #949494;\n  border-radius: 2px;\n  background: #fff;\n  font-size: 12px;\n}\n.flow-comment-editor__link-input:focus {\n  outline: none;\n  border-color: var(--wp-admin-theme-color, #007cba);\n  box-shadow: 0 0 0 1px var(--wp-admin-theme-color, #007cba);\n}\n.flow-comment-editor__submit-row {\n  display: flex;\n  gap: 8px;\n  margin-top: 10px;\n  justify-content: flex-start;\n  flex-wrap: wrap;\n}\n.flow-comment-editor__submit-row .flow-comment-editor__submit-btn.components-button {\n  flex: 0 0 auto;\n  min-width: 120px;\n  justify-content: center;\n}\n.flow-comment-editor__submit-row .flow-btn--cancel.components-button {\n  flex: 0 0 auto;\n  min-width: 80px !important;\n  justify-content: center;\n}\n.flow-comment-editor__submit-row .flow-comment-editor__submit-btn:disabled,\n.flow-comment-editor__submit-row .flow-comment-editor__submit-btn[aria-disabled=true] {\n  background: transparent !important;\n  border-color: #dcdcde !important;\n  color: #757575 !important;\n  opacity: 1 !important;\n}\n.flow-comment-editor__error {\n  margin: 8px 0 0;\n  padding: 6px 10px;\n  background: #fcf0f1;\n  border: 1px solid #cc1818;\n  border-radius: 2px;\n  color: #cc1818;\n  font-size: 12px;\n}";

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

/***/ "@wordpress/primitives"
/*!************************************!*\
  !*** external ["wp","primitives"] ***!
  \************************************/
(module) {

module.exports = window["wp"]["primitives"];

/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/arrow-left.mjs"
/*!***************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/arrow-left.mjs ***!
  \***************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ arrow_left_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/arrow-left.tsx


var arrow_left_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M20 11.2H6.8l3.7-3.7-1-1L3.9 12l5.6 5.5 1-1-3.7-3.7H20z" }) });

//# sourceMappingURL=arrow-left.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/chevron-up.mjs"
/*!***************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/chevron-up.mjs ***!
  \***************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ chevron_up_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/chevron-up.tsx


var chevron_up_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M6.5 12.4L12 8l5.5 4.4-.9 1.2L12 10l-4.5 3.6-1-1.2z" }) });

//# sourceMappingURL=chevron-up.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/close-small.mjs"
/*!****************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/close-small.mjs ***!
  \****************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ close_small_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/close-small.tsx


var close_small_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z" }) });

//# sourceMappingURL=close-small.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/comment.mjs"
/*!************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/comment.mjs ***!
  \************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ comment_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/comment.tsx


var comment_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M18 4H6c-1.1 0-2 .9-2 2v12.9c0 .6.5 1.1 1.1 1.1.3 0 .5-.1.8-.3L8.5 17H18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm.5 11c0 .3-.2.5-.5.5H7.9l-2.4 2.4V6c0-.3.2-.5.5-.5h12c.3 0 .5.2.5.5v9z" }) });

//# sourceMappingURL=comment.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/desktop.mjs"
/*!************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/desktop.mjs ***!
  \************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ desktop_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/desktop.tsx


var desktop_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M20.5 16h-.7V8c0-1.1-.9-2-2-2H6.2c-1.1 0-2 .9-2 2v8h-.7c-.8 0-1.5.7-1.5 1.5h20c0-.8-.7-1.5-1.5-1.5zM5.7 8c0-.3.2-.5.5-.5h11.6c.3 0 .5.2.5.5v7.6H5.7V8z" }) });

//# sourceMappingURL=desktop.mjs.map


/***/ },

/***/ "./node_modules/@wordpress/icons/build-module/library/external.mjs"
/*!*************************************************************************!*\
  !*** ./node_modules/@wordpress/icons/build-module/library/external.mjs ***!
  \*************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ external_default)
/* harmony export */ });
/* harmony import */ var _wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/primitives */ "@wordpress/primitives");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
// packages/icons/src/library/external.tsx


var external_default = /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", children: /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_1__.jsx)(_wordpress_primitives__WEBPACK_IMPORTED_MODULE_0__.Path, { d: "M19.5 4.5h-7V6h4.44l-5.97 5.97 1.06 1.06L18 7.06v4.44h1.5v-7Zm-13 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3H17v3a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h3V5.5h-3Z" }) });

//# sourceMappingURL=external.mjs.map


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
/******/ 			"review-page/index": 0,
/******/ 			"review-page/style-index": 0
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["review-page/style-index"], () => (__webpack_require__("./src/review-page/index.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map