import domReady from '@wordpress/dom-ready';

import mountInShadow from './utils/mount-in-shadow';
import ErrorBoundary from './utils/error-boundary';
import ReviewBar from './components/ReviewBar';
import CommentSidebar from './components/CommentSidebar';
import InlineCommentPopover from './components/InlineCommentPopover';
import InlineThreadPopover from './components/InlineThreadPopover';
import { initHighlights } from './utils/highlight-manager';
import { initEmbedOverlays } from './utils/init-embed-overlays';
import { pageData } from './utils/api';

import barCss from './bar.scss?raw';
import sidebarCss from './sidebar.scss?raw';
import popoverCss from './popover.scss?raw';
import './style.scss';

function BarWithBoundary() {
  return (
    <ErrorBoundary>
      <ReviewBar />
    </ErrorBoundary>
  );
}

function SidebarWithBoundary() {
  return (
    <ErrorBoundary>
      <CommentSidebar />
    </ErrorBoundary>
  );
}

function PopoverWithBoundary() {
  return (
    <ErrorBoundary>
      <InlineCommentPopover />
      <InlineThreadPopover />
    </ErrorBoundary>
  );
}

domReady(() => {
  const barHost = document.getElementById('flow-bar-host');
  const sidebarHost = document.getElementById('flow-sidebar-host');

  if (barHost) mountInShadow(barHost, barCss, BarWithBoundary);
  if (sidebarHost) mountInShadow(sidebarHost, sidebarCss, SidebarWithBoundary);

  const popoverHost = document.createElement('div');
  popoverHost.id = 'flow-inline-popover-host';
  document.body.appendChild(popoverHost);
  mountInShadow(popoverHost, popoverCss, PopoverWithBoundary);

  initHighlights(pageData.inlineComments || []);
  initEmbedOverlays();
});
