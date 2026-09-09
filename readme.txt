=== Jumplinks Flow - Editorial Feedback, Review & Approval Workflow ===
Contributors: jumplinks, alincozari
Tags: client feedback, website feedback, workflow, editorial, collaboration
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 2.4.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Client feedback and editorial workflow with inline comments and a familiar WordPress style review experience.

== Description ==

https://www.youtube.com/watch?v=6g9QunaILLc

Frustrated with client feedback chaos, multiple staging environments, endless meetings that could have been an email, hundreds of Jira tickets and lost Slack discussions?

Jumplinks Flow was inspired by the GitHub pull request review experience with inline comments and approval or change requests workflow that developers love, brought natively into WordPress for content and site reviews. No SaaS subscription, no external tools, just a familiar, focused review experience your team will pick up from day one.

If your current process depends on long comment threads, scattered docs and email, or third-party review tools, Flow gives you a cleaner path without complex setup or heavyweight workflow tools.

= ⚙️ How it works =

1. You assign a reviewer to the content — a WordPress user, or just an email address for people outside your site.
2. The reviewer opens the review page and sends feedback via inline comments anchored to the content.
3. The reviewer requests changes or approves.
4. If changes are requested, repeat 2–3 until approval is received.
5. You publish with confidence once the content is approved.

= 🎯 Best for =

* Agencies and developers who present in-progress work to clients for feedback and signoff
* Editorial teams that need a clear draft-to-publish workflow
* Website owners that want structure without heavy workflow configuration

= 💡 Why teams choose Flow =

* **GitHub-style workflow:** Leave feedback exactly where it matters via inline comments so edits are clearer and faster.
* **Review directly on rendered page:** Reviewers don't need access to the content editor; they review the rendered output.
* **No WordPress account needed:** Send a review to any email address and Flow mails that person a private magic link straight to the review page — no user account, no signup, no login.
* **Works with any editor:** Dedicated integration with Gutenberg, Classic Editor, Elementor, Bricks Builder, Beaver Builder, Divi, Avada, Breakdance, and Oxygen Builder, but all editors are supported.
* **Simple review and approval:** Move content through practical statuses such as in review, changes requested, and approved.
* **Familiar Gutenberg-style review page:** Dedicated review UI that feels native to WordPress.
* **Fast team onboarding:** Minimal setup and intuitive UI for writers, editors, and reviewers.
* **Status-change notifications:** Keep everyone aligned with timely workflow updates.
* **Lightweight by design:** Built with native WordPress APIs and UI libraries.

= 🧩 Built for your content stack =

* **Editor support:** Dedicated integration with Gutenberg, Classic Editor, Elementor, Bricks Builder, Beaver Builder, Divi, Avada, Breakdance, and Oxygen Builder workflows.
* **Content type flexibility:** Use Flow for posts, pages, products, and custom post types.
* **WooCommerce friendly:** Works smoothly with WooCommerce-based editorial setups.

= ✨ What makes Flow different =

Most feedback tools are paid-only SaaS subscriptions that charge per reviewer and require clients to sign up for separate accounts. Flow runs entirely inside your WordPress site, and lets you invite reviewers with a single link — no signup, no monthly fee, no third-party service collecting your content.

Editorial workflow plugins optimize for maximum configuration. Flow optimizes for feedback momentum. You get a clear approval process and contextual collaboration without overwhelming your team or clients with complexity.

If you want an editorial workflow that is modern, focused, and easy to use from day one, Flow is built for you.

== Screenshots ==

1. Assign reviewer to page in Gutenberg
2. Add inline comment to text
3. Add inline comment to image
4. Reply to comment
5. Settings page
6. Inline comments anchored to content on the review page.
7. Assign reviewer to page in Classic Editor
8. Assign reviewer to page in Elementor
9. Assign reviewer to page in Bricks

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/jumplinks-editorial-workflow` directory, or install the plugin through the WordPress plugins screen.
2. Activate the plugin through the "Plugins" screen in WordPress.
3. Go to **Settings > Flow** to configure review mode, eligible content types, and reviewer roles.

== Frequently Asked Questions ==

= How does the review workflow work? =

Assign a reviewer, collect feedback via inline comments, request changes or approve, and publish when approved.

= What does the reviewer see? =

The actual page exactly as visitors will see it — Flow renders the content through your theme on the frontend. Inline comments anchor to the rendered output, so reviewers catch layout, spacing, and typography issues that the editor view hides. Reviewers also don't need to access the editor to leave feedback.

= Can I send a review to someone who has no WordPress account? =

Yes. In the reviewer field pick **External Email**, type the address, and send the review. Flow emails that person a signed magic link that opens the review page directly — they never create an account, register, or log in. From there they do everything a logged-in reviewer does: read the page as visitors see it, leave inline comments (Flow asks for their name the first time), and approve or request changes.

The link is signed and tied to that single email address, so it can't be guessed, and it stops working as soon as you remove that reviewer or cancel the review. Free includes one external reviewer per post; Pro lets you invite several email addresses to the same post review or to a site-wide review.

= Which editors are supported? =

Flow is designed for Gutenberg, Classic Editor, Elementor, Bricks Builder, Beaver Builder, Divi, Avada, Breakdance, and Oxygen Builder publishing workflows.

= I use a different editor. What do I do? =

Flow ships with native integrations for Gutenberg, Classic Editor, Elementor, Bricks Builder, Beaver Builder, Divi, Avada, Breakdance, and Oxygen Builder. If you work in a different editor, you can still use Flow — just open the post in Gutenberg or Classic Editor (both included with WordPress) to request reviews, manage reviewers, and track status. Your existing editor stays untouched for the actual content work.

= Does Flow support custom content types? =

Yes. You can enable the review workflow for posts, pages, products, and custom post types from the settings screen. We cannot guarantee compatibility with all custom content types, but we are confident most cases are handled.

= Does Flow send notifications? =

Yes. Flow sends email notifications for key review lifecycle events, helping teams stay aligned on status changes. Slack integration is also included in the Pro version.

= Is Flow compatible with WooCommerce? =

Yes. Flow is compatible with WooCommerce-powered sites and content workflows.

= Who should use Flow? =

Flow is ideal for content and editorial teams that need a simple review and approval workflow in WordPress without the overhead of enterprise-style configuration. It also works well for freelance developers and agencies who want a structured way to share in-progress work with clients for feedback and approval, without sending screenshots or asking clients to navigate the WordPress admin.

= Can I use Flow to showcase work to clients? =

Yes. Add the client as a user with a reviewer-eligible role, assign them as the reviewer, and send them the review page link. They land on a focused page with the page or post preview, leave inline comments anchored to specific content, and approve or request changes — without ever needing to learn the WordPress editor. If you'd rather not create an account for them at all, assign their email address instead and Flow sends them a magic link into the same review page. In the PRO version you can invite several external email reviewers at once or send the entire site for review!

= Do I need an external account to us Flow? =
No, Flow is a tool dedicated for WordPress and it just needs access to the admin dashboard. No SaaS subscription, no external tools.

== 🚀 Pro features ==

Flow Pro extends the free workflow with the following additions:

= 👥 Multiple reviewers =

Assign any number of reviewers per post and set a minimum approval count. Each vote (approved / changes requested / pending) is tracked independently.

= 🔗 Open to public =

Free covers one external email reviewer per post; Pro removes the limit. Add as many external email addresses as you need to a post review or a site review, and each recipient gets their own signed magic link that drops them straight into the review with their identity bound to that link.

= 🌐 Site-wide review =

Request a site review with one or many reviewers — logged-in users, external email invitees, or both. Reviewers land in a review mode overlaying your site, can navigate freely, and leave anchored comments on any page.

= 💬 Improved comments =

A TipTap-powered editor brings bold, italics, headings, lists, links, quotes, and code blocks to every review comment. Type `@` to mention any reviewer, the author, or external invitees.

= 🔔 Slack integration =

Connect a Slack bot once and Flow DMs reviewers when they're assigned, mentioned, approved, asked for changes, or invited to a site review. Member IDs auto-resolve by email; users can override per-event opt-ins from their profile.

= 📱 Device selector =

A device switcher in the review bar lets reviewers toggle between desktop, tablet, and mobile widths without leaving the page.

= 📊 Activity tracking =

An activity bar on the review page tracks every status change — pending review, in review, changes requested — along with the user who triggered each event.

== Development ==

= Where is the JavaScript and CSS source? =

Human-editable source for the compiled assets in `build/` lives in the `src/` directory. Files under `build/` are generated by webpack; edit `src/` instead of hand-editing `build/`.

= How do I rebuild the compiled assets? =

From the plugin directory, with a supported Node.js release:

1. Run `npm install` or `npm ci` to install dependencies.
2. Run `npm run build` to regenerate webpack output.

= Third-party JavaScript =

Packages such as `@wordpress/scripts` and `@wordpress/icons` are declared in `package.json`. After `npm install`, see each package under `node_modules/` for license text, or refer to the upstream WordPress repositories.

== External services ==

This plugin loads avatar images from Gravatar (operated by Automattic), which is a third-party service.

* **What is sent:** an MD5 hash of the user's email address, generated by WordPress core via `get_avatar_url()`. No raw email address leaves the site.
* **When:** whenever the plugin renders a comment author avatar (review page comment cards, inline comment threads) or a reviewer/requester avatar (REST responses for the review sidebar and the Elementor, Bricks, Beaver Builder, Divi, Avada, Breakdance, and Oxygen Builder drawers).
* **Why:** to display each commenter's avatar next to their comment, matching the rest of the WordPress avatar experience.
* **Service URL:** https://gravatar.com/
* **Terms:** https://automattic.com/terms/
* **Privacy:** https://automattic.com/privacy/

This is the same Gravatar integration that ships with WordPress core; the plugin does not contact any other external services.

== Changelog ==

= 2.4.1 =
* New: Add external emails as reviewers. Pick External Email in the reviewer field and Flow emails that person a signed magic link to the review page, where they can comment, approve, or request changes without a WordPress account. Available in every editor integration.
* Fix: Minor bug fixes.

= 2.4.0 =
* Added Oxygen Builder integration

= 2.3.1 =
* Fix: Automatically focus the comment field after clicking Add Comment.

= 2.3.0 =
* Improvement: Major UI changes thanks to @alincozari.

= 2.2.0 =
* New: Integration with Divi.
* New: Integration with Beaver Builder.
* New: Integration with Avada.
* New: Integration with Breakdance.

= 2.1.0 =
* Improvement: Add jumplinks logo to main admin areas.

= 2.0.1 =
* Improvement: Review page now follows the reviewer's WordPress admin colour scheme — matches WordPress 7's new "Modern" default.
* Improvement: Title and metadata commenting now works on any theme with standard WordPress article markup, instead of a fixed list of theme classes.
* Fix: Comments anchored to the post title were sometimes incorrectly flagged "Potentially outdated" on reload.
* Compatibility: Tested up to WordPress 7.0.

= 2.0.0 =
* Launch Jumplinks Flow PRO

= 1.4.0 =
* New: Top-level "Flow" admin menu with a dedicated Dashboard page.
* New: Site-wide admin notice surfaces in-flight reviews assigned to you, with a link to the dashboard. Dismiss it and it stays hidden until a new review is assigned.
* New: Comments sidebar redesigned to mirror Gutenberg's Settings sidebar — moved to the right edge, open by default on desktop, with a familiar close affordance.
* New: Resolved comments are now grouped in a collapsible "Resolved" disclosure with a count.
* Improvement: Comment date is shown beneath the author name instead of beside it, giving the comment body more room.
* Improvement: Review page top bar trims responsively below 1600px and 1400px so it no longer overlaps on narrow viewports.
* Fix: Published posts are no longer silently downgraded to "Pending" when sent for a follow-up review — the live status is preserved.
* Fix: Adding a new reviewer while a review is in "Changes requested" no longer shows two competing "Send for review" and "Resubmit" buttons.

= 1.3.1 =
* Improvement: WordPress admin bar shows a "Review" shortcut on posts with an active review the current user can access.
* Improvement: Review page bar now ships with a "View" dropdown.
* Improvement: Classic Editor uses autocomplete for reviewer select and better styling.
* Fix: Inline comment popover on mobile now keeps a visible margin from the screen edges instead of touching them.
* Fix: Open reviews with no primary reviewer no longer treat anonymous viewers as eligible reviewers.
* Fix: Every bundled `*.l10n.php` translation file now declares a direct-access guard, resolving a Plugin Checker warning.

= 1.3.0 =
* New: Review page is now usable on mobile — selection-based commenting, approve, and request-changes work on all devices.
* New: Open Review mode lets any logged-in user with the link comment on a post under review, not just assigned reviewers. Available in Gutenberg, Classic Editor, Elementor, and Bricks; surfaces as a virtual status in the post-listing column, listing filter, and dashboard widget.
* Improvement: Redesigned Elementor review section.
* Improvement: Click-to-comment overlay skips emojis, reCAPTCHA iframes, and hidden/decorative media.
* Improvement: Long post titles and comment author names ellipsize so they no longer overlap in the review page chrome.
* Fix: Inline highlight no longer reflows paragraph text when a comment is added.
* Fix: "Highlight text…" hint stays put after the first comment is added.
* Fix: Mandatory review no longer blocks Update on already-published posts.
* Fix: Removed the duplicate "Send for Review" button above the Gutenberg editor.

= 1.2.0 =
* Refactor: Extensive code cleanup, security improvements, guidelines fixes.
* Improvement: Add AI generated translations for all languages.
* Fix: Some background-image cases preventing commenting on text.

= 1.1.8 =
* Improvement: Review iframe now renders content at the user's full browser viewport regardless of sidebar state — visually scaled to fit beside the sidebar.
* Fix: Bricks no longer get the snapshot post title baked into their CSS — `font-family: "<post title>"` instead of the real font name.
* Fix: Images wrapped in `<a>` (gallery markup) no longer collapse to their intrinsic size.
* Fix: Dashboard "Flow Reviews" widget no longer counts reviews whose underlying post was deleted.
* Fix: When a post is permanently deleted, its review and review-comment rows are cascade-deleted. Trashed posts are unaffected.

= 1.1.7 =
* Improvement: Inline comment popover is now mounted into a Shadow DOM root, isolating it from theme / page-builder CSS so button styles, color resets, and similar rules can't bleed in.
* Fix: Gallery and other `<a><img></a>` markup now opens the comment popover when clicked instead of being swallowed by the review-page link guard.
* Fix: Inline `onclick="window.open( '…', '_self' )"` handlers (common in galleries) no longer navigate the review iframe out of the chrome — same `_blank` bypass as `target="_blank"` anchors.
* Fix: WordPress admin-bar "bump" CSS no longer reserves a 32px gap at the top of the review iframe when the admin bar is hidden.
* Fix: Theme front-end scripts and styles are dequeued on the parent review shell, eliminating noisy initializer errors (Google Maps, sliders, etc.) that expected the live page DOM.

= 1.1.6 =
* Fix: Inline "Add Comment" popover sometimes failed to open the editor on production sites in full-page review mode — text-selection commenting now works reliably across page-builder layouts and themes that don't expose `.entry-content` / `.wp-block-post-content`.

= 1.1.5 =
* New: Dedicated "Reviewer" role added on activation. Carries the minimum capabilities to log in and act on the review page.
* New: "Flow Reviews" dashboard widget showing posts you're a participant in.
* New: "Review" column and filters on post / page listings.
* Improvement: Reviewer avatars (Gravatar) shown in comment cards and the inline threads.
* Improvement: Review iframe now renders the snapshot revision through the full singular template (header / footer / sidebar) — matching the front-end exactly.
* Fix: Quick Edit and Bulk Edit now respect Mandatory review mode.
* Fix: All public, REST-enabled, editor-supporting custom post types (JetEngine, ACF, CPT UI, etc.) are now auto-discovered in the Content Types settings form.
* Fix: Resolved comment threads paint green even when the underlying inline anchor is flagged outdated.

= 1.1.4 =
* Fix: Selecting text across multiple blocks (e.g. a heading and a paragraph) and adding a comment no longer breaks the layout or drops the highlight — each block now gets its own highlight mark sharing the comment id.

= 1.1.3 =
* New: Click-to-comment overlay on images, videos, and embed iframes (YouTube, Vimeo, etc.) on the review page. Clicking media opens the comment editor directly; embed videos no longer play on click.
* New: Highlight ring shown on commented media (images, videos, embeds) so reviewers can see at a glance which items already have feedback. Uniform look across wrap, cover, and embed layouts.
* New: Live Preview blueprint at `assets/blueprints/blueprint.json` so the WordPress.org plugin page can spin up a one-click demo of the review experience (logged in as a reviewer with sample image/video content to comment on).
* Improvement: Comment thread popover flips above the highlighted item when there's no room below — keeps it inside the viewport for media at the page bottom.
* Improvement: Add Comment editor opens directly when clicking media (the in-between pill is redundant since the overlay already shows a "Click to comment" hint on hover).

= 1.1.2 =
* Fix: Restore proper styling on the inline "Add Comment" button.

= 1.1.1 =
* New: Subtle "rate this plugin" link on the Plugins screen and a small review prompt on the Flow settings page — never a popup, never a nag.
* Fix: Review template now wins over themes that hijack `template_include` (e.g. Kallyas builder, other site-builder themes), so the dedicated review page renders correctly regardless of the active theme.
* Fix: Inline comment popover buttons no longer inherit theme-injected button styling (border, color, padding, etc.) on themes that style bare `button` / `[type=button]` selectors.

= 1.1.0 =
* New: Bricks Builder integration with a Review toolbar button, themed review drawer, and automatic Publish-button lock when mandatory review isn't approved.
* New: Modal-based first-run setup wizard with three guided steps (review mode, content types, reviewer roles) and a "Run setup again" affordance on the settings page.
* New: Translation template (.pot) shipped under `languages/`, plus `Domain Path` header, so translate.wordpress.org community translations are picked up automatically.
* Improvement: Reviewer can be re-assigned after a post is approved (creates a new review iteration so teams can request another round of review).
* Improvement: Empty content-type and reviewer-role selections are now honored instead of silently reverting to defaults.
* Fix: PHP 7.4 compatibility — removed union return type declarations from REST endpoints that prevented the plugin from loading on PHP 7.4.
* Fix: WordPress 6.5.x compatibility — added a polyfill for the `react-jsx-runtime` script handle that core only registers from 6.6 onwards, restoring the review page chrome and editor sidebars on older WP versions.

= 1.0.0 =
* Initial release.
