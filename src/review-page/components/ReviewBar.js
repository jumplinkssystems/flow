import { useState, useCallback, useEffect, useRef } from '@wordpress/element';
import { Button, Tooltip, DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { arrowLeft, desktop, external } from '@wordpress/icons';

/**
 * Gutenberg Settings sidebar icon — a rectangle with a vertical divider
 * representing content + sidebar. Lifted from the block editor so the
 * Review-sidebar toggle reads as the same affordance.
 */
const sidebarIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-4 14.5H6c-.3 0-.5-.2-.5-.5V6c0-.3.2-.5.5-.5h8v13zm4.5-.5c0 .3-.2.5-.5.5h-2.5v-13H18c.3 0 .5.2.5.5v12z"
    />
  </svg>
);
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import flowFetch, { pageData } from '../utils/api';
import { setIframe, clearIframe } from '../utils/iframe-bridge';
import { useReviewCommentTotals } from '../utils/review-comment-totals';
import { STATUS_LABELS } from '../../shared/status-labels';
import alertWarningIcon from '../icons/alert-warning';

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
    if ( ! url.searchParams.has( CANVAS_MARKER ) ) {
      url.searchParams.set( CANVAS_MARKER, '1' );
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
function ViewDropdown({ postUrl, device }) {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let wasOpenOnPointerDown = false;
    const onPointerDown = (e) => {
      const toggle = wrapper.querySelector('.components-dropdown-menu__toggle');
      wasOpenOnPointerDown =
        !!toggle &&
        toggle.getAttribute('aria-expanded') === 'true' &&
        (toggle === e.target || toggle.contains(e.target));
    };
    const onClick = (e) => {
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

  const triggerIcon = applyFilters('flow_ew_view_dropdown_icon', desktop, { device });

  return (
    <div ref={wrapperRef} className="flow-bar__view-dropdown-wrap">
      <DropdownMenu
        icon={triggerIcon}
        label={__('View', 'jumplinks-editorial-workflow')}
        className="flow-bar__view-dropdown"
        popoverProps={{ placement: 'bottom-end' }}
        toggleProps={{ size: 'compact' }}
      >
        {({ onClose }) => (
          <>
            {applyFilters('flow_ew_view_dropdown_extras', null, { onClose, device })}
            {postUrl ? (
              <MenuGroup>
                <MenuItem
                  href={postUrl}
                  target="_blank"
                  rel="noreferrer"
                  icon={external}
                  iconPosition="right"
                >
                  {__('Preview in new tab', 'jumplinks-editorial-workflow')}
                </MenuItem>
              </MenuGroup>
            ) : null}
          </>
        )}
      </DropdownMenu>
    </div>
  );
}

function WpLogoButton({ wpLogoUrl, isLoggedIn }) {
  const label = isLoggedIn
    ? __('Review dashboard', 'jumplinks-editorial-workflow')
    : __('Find out more on jumplinks.net', 'jumplinks-editorial-workflow');
  return (
    <Tooltip text={label} placement="right" fixed>
      <div className="flow-bar__wp-logo" tabIndex="0">
        <a
          href={wpLogoUrl}
          className="flow-bar__wp-logo-link"
          aria-label={label}
          target={isLoggedIn ? undefined : '_blank'}
          rel={isLoggedIn ? undefined : 'noopener noreferrer'}
        >
          <div className="flow-bar__wp-logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor" aria-hidden="true" focusable="false">
              <path d="M15.56,7.62c.65-.11,1.07-.19,1.07-.19.19-.03.37-.14.49-.32l1.53-2.17c.25-.36.16-.86-.21-1.11-.13-.09-.28-.13-.43-.13-.25,0-.5.12-.66.35l-1.3,1.95-1.22.21c-.25.04-.32.37-.1.51.6.4.8.83.83.88Z" />
              <path d="M6.01,11.32c.24,0,.48-.11.66-.37l1.28-2.01c.26-.04.67-.11,1.16-.2l.07-.41c.04-.26.11-.51.2-.73.08-.2-.1-.41-.31-.38l-1.7.29c-.19.03-.37.14-.49.31,0,.01-1.54,2.22-1.55,2.23-.42.64.12,1.27.68,1.27Z" />
              <path d="M9.73,17.56l-2.21,1.63c-1.02-.82-3.25-2.6-3.25-2.6-.18-.13-.35-.19-.52-.19-.68,0-1.19.92-.52,1.49l3.75,3c.15.12.34.19.52.19.18,0,.35-.06.5-.17l3.24-2.47c.2-.15.12-.46-.13-.5-.04,0-.09-.01-.13-.02-.47-.08-.89-.2-1.25-.37Z" />
              <path d="M20.77,15.85s-3.8-2.94-3.8-2.94c-.13-.1-.3-.16-.46-.16s-.31.05-.45.15l-.88.65h0s-.14.85-.25,1.49c-.04.25.25.42.45.27l1.11-.85c.99.82,3.26,2.7,3.27,2.71.17.12.35.18.51.18.68,0,1.18-.93.5-1.49Z" />
              <path d="M15.1,9.4c.05-.31.06-.63-.01-.94-.03-.12-.07-.24-.12-.36-.06-.12-.13-.23-.22-.34-.34-.42-.94-.76-1.91-.93-.28-.05-.55-.07-.81-.07-1.06,0-1.9.44-2.11,1.69l-.25,1.51c.43-.3.97-.46,1.61-.49l.06-.36.04-.22c.01-.06.02-.12.04-.17.11-.33.37-.49.8-.49.12,0,.26.01.41.04.21.03.38.08.52.15.17.08.3.19.38.32.09.15.11.32.08.53l-.1.59-.06.38-.06.38h0s-.19,1.12-.19,1.12c-.03.19-.1.34-.21.44-.08.08-.2.14-.33.18-.1.02-.2.04-.32.04h0c-.14,0-.31-.02-.45-.05s-.31.07-.33.23l-.18,1.09c.17.04.74.12.74.12.13.01.26.02.38.02,0,0,.24,0,.38-.02,1.02-.11,1.51-.68,1.72-1.34h0c.04-.13.07-.27.09-.4l.1-.59h0s.1-.59.1-.59l.25-1.47Z" />
              <path d="M12.67,5.46l.41.07.41.07c.34.06.62.02.84-.12.21-.14.35-.36.4-.68l.08-.5.08-.5c.05-.31,0-.57-.16-.77-.16-.2-.41-.33-.75-.39l-.41-.07-.41-.07c-.72-.12-1.13.15-1.24.8l-.08.5-.08.5c-.11.65.19,1.04.91,1.16Z" />
              <path d="M13.28,14.48c-.18.04-.37.06-.56.07l-.07.39-.03.2c-.03.19-.1.33-.21.44,0,0,0,0,0,0,0,0,0,0,0,0-.04.04-.08.07-.13.1h0c-.13.07-.3.11-.51.11-.08,0-.16,0-.25-.02-.04,0-.09-.01-.13-.02-.13-.02-.25-.05-.36-.08-.5-.16-.69-.45-.62-.91l.41-2.48c.03-.19.1-.34.2-.44.08-.09.19-.15.33-.19.09-.02.19-.03.31-.03h.03c.14,0,.31.02.46.05s.3-.07.33-.23l.18-1.09c-.12-.03-.25-.06-.39-.08-.12-.02-.23-.04-.35-.05,0,0,0,0,0,0-.13-.01-.25-.02-.38-.02-.03,0-.05,0-.08,0-.1,0-.2,0-.3.01-.83.07-1.48.46-1.74,1.36h0c-.03.1-.05.2-.07.31l-.47,2.81c-.16.95.17,1.57.79,1.97.11.07.23.14.36.2.13.06.27.11.42.16.21.06.43.11.66.15.29.05.56.07.8.07.61,0,1.05-.14,1.38-.37.03-.02.06-.04.08-.06h0c.42-.34.62-.82.71-1.32l.25-1.48c-.3.22-.65.37-1.05.45h0Z" />
            </svg>
          </div>
          <div className="flow-bar__wp-logo-back">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
              <path d="M14 6H6v8h1.5V8.5L17 18l1-1-9.5-9.5H14V6Z" />
            </svg>
          </div>
        </a>
      </div>
    </Tooltip>
  );
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
export default function ReviewBar({ mode = 'review', actionsSlot = null } = {}) {
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
    inviteSyntheticId = 0,
  } = pageData;

  const effectiveUserId = isEmailInvitee
    ? Number( inviteSyntheticId || 0 )
    : Number( currentUserId );

  const [actionStatus, setActionStatus] = useState(null);
  useEffect(() => {
    if (!actionStatus) return undefined;
    const t = setTimeout(() => setActionStatus(null), 10_000);
    return () => clearTimeout(t);
  }, [actionStatus]);
  const [isBusy, setIsBusy] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(displayStatus || status);
  // Two independent panels: comments (right, default open on desktop) and
  // activity (left, default closed).
  const [commentsOpen, setCommentsOpen] = useState(() => !isMobileViewport());
  const [activityOpen, setActivityOpen] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [hasAuthorResubmitActivity, setHasAuthorResubmitActivity] = useState(() => {
    const hasNewerRevision = revisionStatus === 'outdated';
    const hasOwnComment = [...comments, ...inlineComments].some(
      (comment) => Number(comment?.authorId || 0) === Number(currentUserId)
    );
    return hasNewerRevision || hasOwnComment;
  });
  const iframeRef = useRef(null);
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  const onInlineCommentForResubmit = useCallback((e) => {
    const authorId = Number(e?.detail?.comment?.authorId || 0);
    if (authorId > 0 && authorId === Number(currentUserIdRef.current)) {
      setHasAuthorResubmitActivity(true);
    }
  }, []);

  const totalCommentCount = useReviewCommentTotals(onInlineCommentForResubmit);

  useEffect(() => {
    if (iframeRef.current) return;

    const iframe = document.createElement('iframe');
    iframe.id = 'flow-template-frame';
    iframe.src = sameOriginIframeSrc(pageData.contentOnlyUrl || '');
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    // Site-review iframes get a load handler too — same `flow:iframe-ready`
    iframe.addEventListener('load', () => {
      setIframe(iframe);
      try {
        stampCanvasMarkerOnLinks(iframe.contentDocument);
      } catch {
        // cross-origin transient or contentDocument null — non-fatal
      }
      window.dispatchEvent(
        new CustomEvent('flow:iframe-ready', { detail: { iframe } })
      );
    });

    return () => {
      if (iframeRef.current) {
        window.dispatchEvent(new CustomEvent('flow:iframe-removed'));
        clearIframe();
        iframeRef.current.remove();
        iframeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
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
      const designedWidth = isDeviceMode
        ? (device === 'tablet' ? 780 : 360)
        : window.innerWidth;

      // Desktop: scale to fill the area between the two sidebars.
      const rawScale = designedWidth > 0 ? visualWidth / designedWidth : 1;
      const scale = isDeviceMode ? Math.min(1, rawScale) : rawScale;
      const designedHeight = scale > 0 ? visualHeight / scale : visualHeight;
      const visualDesignedWidth = designedWidth * scale;
      const leftOffset = isDeviceMode
        ? leftSidebar + Math.max(0, (visualWidth - visualDesignedWidth) / 2)
        : leftSidebar;

      iframe.style.cssText =
        `position:fixed;top:${barHeight}px;left:${leftOffset}px;` +
        `width:${designedWidth}px;height:${designedHeight}px;` +
        `transform:scale(${scale});transform-origin:top left;` +
        `border:none;z-index:0;background:#fff;` +
        `box-shadow:${isDeviceMode ? '0 0 0 1px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)' : 'none'};` +
        `transition:left 180ms ease,transform 180ms ease,width 180ms ease;`;

      document.body.classList.toggle('flow-device-preview', isDeviceMode);
    };

    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [commentsOpen, activityOpen, device]);

  const isExternalCommentsToggleRef = useRef(false);

  const toggleComments = useCallback(() => {
    setCommentsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isExternalCommentsToggleRef.current) {
      isExternalCommentsToggleRef.current = false;
      return;
    }
    window.dispatchEvent(
      new CustomEvent('flow:comments-sidebar-toggle', { detail: { open: commentsOpen } })
    );
    // Our own listener runs synchronously during dispatch and sets the ref
    // to skip a redundant setState. Clear it again so the next bar-toggle
    // still broadcasts to CommentSidebar (which drives data-open / body class).
    isExternalCommentsToggleRef.current = false;
  }, [commentsOpen]);

  useEffect(() => {
    const onCommentsToggle = (e) => {
      if (typeof e.detail?.open !== 'boolean') {
        return;
      }
      isExternalCommentsToggleRef.current = true;
      setCommentsOpen(e.detail.open);
    };
    const onActivityToggle = (e) => setActivityOpen(e.detail.open);
    const onStatusChange = (e) => {
      setCurrentStatus(e.detail.status || '');
      if (Object.prototype.hasOwnProperty.call(e.detail, 'myVote')) {
        setMyVoteState(e.detail.myVote);
      }
      if (e.detail.message) {
        setActionStatus({
          type: e.detail.type || 'success',
          message: e.detail.message,
        });
      }
    };
    const onSetSrc = (e) => {
      if (iframeRef.current && e.detail?.src) {
        const next = sameOriginIframeSrc(e.detail.src);
        if (iframeRef.current.src !== next) {
          window.dispatchEvent(new CustomEvent('flow:iframe-removed'));
          clearIframe();
          iframeRef.current.src = next;
        }
      }
    };
    const onAuthorResubmitActivity = () => {
      setHasAuthorResubmitActivity(true);
    };
    const onSetDevice = (e) => {
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

  const statusLabel = STATUS_LABELS[currentStatus] || __('Review', 'jumplinks-editorial-workflow');
  const isChangesRequested = currentStatus === 'changes_requested';

  const [myVoteState, setMyVoteState] = useState(() => {
    if (Array.isArray(reviewers) && reviewers.length) {
      const me = reviewers.find(
        (r) => Number(r.id) === effectiveUserId
      );
      if (me && me.status) return me.status;
    }
    return null;
  });
  const myVote = myVoteState !== null ? myVoteState : currentStatus;
  const isApproved = myVote === 'approved';
  const canAuthorResubmit =
    currentStatus === 'changes_requested' &&
    currentUserIsPostAuthor &&
    Number(reviewId) > 0;

  const canAdminOverride = debugMode && currentUserIsAdmin;
  const isOpenReview = currentStatus === 'open_review';
  // Email invitees act anonymously with a cookie session; WP users need login.
  const canActFinal =
    !isOpenReview &&
    (canAct || canAdminOverride) &&
    (isEmailInvitee || Number(currentUserId) > 0);

  const resolvedTitle =
    postTitle && String(postTitle).trim()
      ? postTitle
      : __('(No title)', 'jumplinks-editorial-workflow');

  const doAction = useCallback(async (endpoint, successMsg, nextStatus) => {
    setIsBusy(true);
    setActionStatus(null);
    try {
      const data = await flowFetch(`reviews/${reviewId}/${endpoint}`, { method: 'POST' });
      const resolved = (data && (data.display_status || data.status)) || nextStatus;
      setCurrentStatus(resolved);
      let nextMyVote = null;
      if (data && Array.isArray(data.reviewers)) {
        const mine = data.reviewers.find(
          (r) => Number(r.id) === effectiveUserId
        );
        nextMyVote = mine ? mine.status : null;
        setMyVoteState(nextMyVote);
      }
      window.dispatchEvent(
        new CustomEvent('flow:status-changed', {
          detail: { status: resolved, myVote: nextMyVote },
        })
      );
      setActionStatus({ type: 'success', message: successMsg });
    } catch (err) {
      setActionStatus({ type: 'error', message: err.message });
    } finally {
      setIsBusy(false);
    }
  }, [reviewId, effectiveUserId]);


  return (
    <div className="flow-bar">
      <div className="flow-bar__left">
        <WpLogoButton wpLogoUrl={wpLogoUrl} isLoggedIn={currentUserId > 0} />
        {applyFilters('flow_ew_review_bar_left_extras', null, {
          activityOpen,
        })}
        {postEditUrl ? (
          <Tooltip text={__('Edit content', 'jumplinks-editorial-workflow')} placement="bottom" fixed>
            <Button
              href={postEditUrl}
              className="flow-bar__edit-post"
              icon={arrowLeft}
              aria-label={__('Edit content', 'jumplinks-editorial-workflow')}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                  return;
                }
                e.preventDefault();
                window.location.assign(postEditUrl);
              }}
            />
          </Tooltip>
        ) : null}
        <span
          className={
            ( isSiteReview || postTypeLabel )
              ? 'flow-bar__title'
              : 'flow-bar__title flow-bar__title--simple'
          }
        >
          {( isSiteReview || postTypeLabel ) ? (
            <>
              {/* In site-review mode the prefix renders regardless of
                  `postTypeLabel` \u2014 we want "Reviewing [title]" even when
                  there's no suffix to show. Per-post review keeps the
                  old behaviour: prefix only when postTypeLabel is set. */}
              <span className="flow-bar__title-prefix">{__('Reviewing', 'jumplinks-editorial-workflow')}</span>
              <span className="flow-bar__title-name">{resolvedTitle}</span>
              {postTypeLabel ? (
                <span className="flow-bar__title-suffix">
                  <span className="flow-bar__title-dot" aria-hidden="true">
                    {'\u00b7'}
                  </span>
                  <span className="flow-bar__title-type">{postTypeLabel}</span>
                </span>
              ) : null}
            </>
          ) : (
            postTitle
          )}
        </span>
        {isSiteReview ? null : (
          <span className={`flow-bar__badge flow-bar__badge--${currentStatus}`}>
            <span className="flow-bar__badge__dot" aria-hidden="true" />
            {statusLabel}
          </span>
        )}
      </div>

      {(revisionStatus || snapshotLabel || ( debugMode && revisionStatus === 'latest' )) ? (
        <div className="flow-bar__meta">
          <div className="flow-bar__freshness-row">
            {revisionStatus ? (
              <span className={`flow-bar__freshness flow-bar__freshness--${revisionStatus}`}>
                {revisionStatus === 'latest'
                  ? __('You are viewing the latest content', 'jumplinks-editorial-workflow')
                  : (
                    <>
                      {__('Content may be outdated.', 'jumplinks-editorial-workflow')}
                      {latestRevisionUrl && (
                        <> <a href={latestRevisionUrl} className="flow-bar__freshness-link">{__('View the latest version', 'jumplinks-editorial-workflow')}</a></>
                      )}
                    </>
                  )
                }
              </span>
            ) : null}
            {debugMode && revisionStatus === 'latest' ? (
              <span className="flow-bar__freshness flow-bar__freshness--debug" role="status">
                <span className="flow-bar__freshness-icon" aria-hidden="true">
                  { alertWarningIcon }
                </span>
                { __( 'Debug mode', 'jumplinks-editorial-workflow' ) }
              </span>
            ) : null}
          </div>
          {snapshotLabel ? (
            <span className="flow-bar__freshness-snapshot">{snapshotLabel}</span>
          ) : null}
        </div>
      ) : null}

      <div className="flow-bar__right">
        {isSiteReview ? null : applyFilters('flow_ew_review_participants_display', null, { pageData })}
        {isSiteReview ? null : <ViewDropdown postUrl={postUrl} device={device} />}
        <Tooltip text={__('Review', 'jumplinks-editorial-workflow')} placement="bottom" fixed>
          <Button
            icon={sidebarIcon}
            className={`flow-bar__comments-toggle${commentsOpen ? ' is-pressed' : ''}`}
            aria-pressed={commentsOpen}
            aria-label={__('Review', 'jumplinks-editorial-workflow')}
            onClick={toggleComments}
          />
        </Tooltip>
        {actionsSlot ? (
          <div className="flow-bar__actions">{actionsSlot}</div>
        ) : null}
        {actionsSlot ? null : canAuthorResubmit ? (
          <div className="flow-bar__actions">
            <Button
              variant="primary"
              onClick={() => doAction('resubmit', __('✓ Resubmitted for review.', 'jumplinks-editorial-workflow'), 'in_review')}
              disabled={isBusy || !hasAuthorResubmitActivity}
            >
              {__('Resubmit for review', 'jumplinks-editorial-workflow')}
            </Button>
          </div>
        ) : null}

        {actionsSlot ? null : canActFinal ? (
          <div className="flow-bar__actions">
            {actionStatus && (
              <div className="components-snackbar-list flow-bar__snackbar-list" aria-live="polite">
                <div className="components-snackbar-list__notice-container">
                  <div
                    className="components-snackbar flow-bar__snackbar"
                    role={actionStatus.type === 'error' ? 'alert' : 'status'}
                  >
                    <div className="components-snackbar__content">
                      {actionStatus.message}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!isApproved ? (
              <Button
                className="flow-bar__btn--request-changes"
                onClick={() => doAction('request-changes', __('\u2713 Changes requested \u2014 author notified.', 'jumplinks-editorial-workflow'), 'changes_requested')}
                disabled={isBusy || totalCommentCount === 0 || myVote === 'changes_requested'}
              >
                {__('Request Changes', 'jumplinks-editorial-workflow')}
              </Button>
            ) : null}
            {isApproved ? (
              <Button
                variant="secondary"
                onClick={() => doAction('revoke-approval', __('Approval revoked.', 'jumplinks-editorial-workflow'), 'in_review')}
                disabled={isBusy}
                className="flow-bar__btn--revoke"
              >
                {__('Revoke Approval', 'jumplinks-editorial-workflow')}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => doAction('approve', __('\u2713 Approval recorded.', 'jumplinks-editorial-workflow'), 'approved')}
                disabled={isBusy}
              >
                {__('Approve', 'jumplinks-editorial-workflow')}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
