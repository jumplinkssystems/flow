=== Jumplinks Flow – Client Feedback & Editorial Workflow ===
Contributors: jumplinks, alincozari
Tags: client feedback, website feedback, content approval, site review, editorial workflow
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 2.5.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Client feedback on the live page with inline comments and content approval editorial workflow. Magic links for clients, no signup, no SaaS subscriptions, no external services. MCP AI-ready. Works with your builder.

== Description ==

Frustrated with client feedback chaos, multiple staging environments, endless meetings that could have been an email, hundreds of Jira tickets and lost Slack discussions?

Send your clients a review magic link. They see the page exactly as visitors will see it, highlight the text or media and leave inline comments. No page is published until approved by a reviewer.

https://www.youtube.com/watch?v=6g9QunaILLc

Flow takes the GitHub pull request review process with inline comments and approve or request changes workflow and builds it into WordPress. It runs entirely on your site, and your clients never needs to create a Wordpress account.

If your current process depends on long comment threads, scattered docs and email, or third-party review tools, Flow gives you a cleaner path without complex setup or heavyweight workflow tools. If AI or automation is writing the first draft, Flow is the human checkpoint between that draft and Publish.

= ⚙️ How it works =

1. Assign a reviewer to a page or post: a WordPress user, or just your client's email address.
2. Your client gets a private magic link straight to the review page. No account, no signup, no login.
3. They pin comments to the exact text or image on the rendered page.
4. They approve or request changes. You fix, resubmit, and repeat until it's approved.
5. You publish once it's approved, knowing exactly who signed off.

= 🎯 Why agencies and freelancers use Flow =

* **Clients don't need an account.** Enter an email address and Flow sends a signed magic link tied to that address. It stops working the moment you remove the reviewer or cancel the review.
* **Feedback on the real page.** Reviewers see your theme, layout, and images as visitors will, so they catch spacing and typography problems the editor view hides. They never touch the editor.
* **Comments where the problem is.** Select text or an image to pin a comment to it. Threaded replies keep the back-and-forth in one place.
* **A clear yes before launch.** Approve and request changes are explicit steps. Turn on mandatory review and Publish stays blocked until a reviewer approves.
* **Nothing hosted elsewhere.** Flow runs inside your WordPress install. There's no separate SaaS account, and comments and approvals stay on your site.
* **Works with your builder.** Dedicated integrations for Gutenberg, Classic Editor, Elementor, Bricks, Beaver Builder, Divi, Avada, Breakdance, and Oxygen.
* **One settings screen.** Choose content types, reviewer roles, and an optional default reviewer under Settings → Flow.

= 📝 Also works for editorial teams =

Writers send drafts to an editor, the editor comments in context and approves, and the post goes live. No custom statuses to design, no workflow builder to configure. Flow works on posts, pages, WooCommerce products, and custom post types. It can assign a default reviewer automatically and show a "Reviewed by" credit on published content.

= ✨ Human approval for AI and automated drafts =

Flow doesn't generate text or detect AI content. It's the checkpoint between a draft and Publish, whoever or whatever wrote the draft.

* Drafts created by ChatGPT, Claude, n8n, Make, Zapier, or the REST API can get a reviewer assigned automatically the moment the post is created.
* With mandatory review on, the first Publish or Schedule stays blocked until a person approves, including attempts through the REST API.
* AI agents connected through WordPress Agent Connector or MCP can send content for review, read comments, resolve threads, and resubmit. Only a human can approve or request changes.

= 🤖 What makes Flow different =

Most feedback tools are paid-only SaaS subscriptions that charge per reviewer and require clients to sign up for separate accounts. Flow runs entirely inside your WordPress site, and lets you invite reviewers with a single link — no signup, no monthly fee, no third-party service collecting your content.

Editorial workflow plugins optimize for maximum configuration. Flow optimizes for feedback momentum. You get a clear approval process and contextual collaboration without overwhelming your team or clients with complexity.

If you want an editorial workflow that is modern, focused, and easy to use from day one, Flow is built for you.

= 🚀 Flow Pro =

Everything above is free. [Flow Pro](https://jumplinks.net/pro) adds:

* **Public review:** share one review link that anyone can open and comment on, with no WordPress account and no email invite needed.
* **Site-wide review:** send the whole site. Reviewers browse in review mode and comment on any page.
* **Unlimited external reviewers:** Free includes one external email reviewer per post. Pro removes the limit.
* **Multiple reviewers:** set a minimum number of approvals, with each reviewer's vote tracked separately.
* **Device switcher:** reviewers check desktop, tablet, and mobile widths without leaving the page.
* **Rich comments and @mentions:** formatting, links, and code blocks, plus mentions for reviewers, authors, and external invitees.
* **Slack notifications:** DMs for assignments, mentions, approvals, change requests, and site review invites.
* **Webhooks for n8n, Zapier, and Make:** signed JSON payloads when a review is sent, approved, or sent back for changes. Deliveries are queued and retried with a full log. Payloads include the exact passage each inline comment points at, formatted for a prompt, so a writing agent can apply the fixes and resubmit.
* **Activity log:** every status change on the review page, with the user who triggered it.

= 🛠️ Development =

**Where is the JavaScript and CSS source?**

Human-editable source for the compiled assets in `build/` lives in the `src/` directory. Files under `build/` are generated by webpack; edit `src/` instead of hand-editing `build/`.

**How do I rebuild the compiled assets?**

From the plugin directory, with a supported Node.js release:

1. Run `npm install` or `npm ci` to install dependencies.
2. Run `npm run build` to regenerate webpack output.

**Third-party JavaScript**

Packages such as `@wordpress/scripts` and `@wordpress/icons` are declared in `package.json`. After `npm install`, see each package under `node_modules/` for license text, or refer to the upstream WordPress repositories.

= 🔌 External services =

This plugin loads avatar images from Gravatar (operated by Automattic), which is a third-party service.

* **What is sent:** an MD5 hash of the user's email address, generated by WordPress core via `get_avatar_url()`. No raw email address leaves the site.
* **When:** whenever the plugin renders a comment author avatar (review page comment cards, inline comment threads) or a reviewer/requester avatar (REST responses for the review sidebar and the Elementor, Bricks, Beaver Builder, Divi, Avada, Breakdance, and Oxygen Builder drawers).
* **Why:** to display each commenter's avatar next to their comment, matching the rest of the WordPress avatar experience.
* **Service URL:** https://gravatar.com/
* **Terms:** https://automattic.com/terms/
* **Privacy:** https://automattic.com/privacy/

This is the same Gravatar integration that ships with WordPress core. The free plugin contacts no other external service.

Flow Pro adds optional integrations that only send data once you configure them:

* **Slack** (https://slack.com/) — when you save a Slack bot token, Flow calls `chat.postMessage` and `users.lookupByEmail` on api.slack.com to deliver direct messages. Sent: the reviewer's WordPress email address (to find their Slack account), reviewer and author display names, content titles, review links, and the text of comments they are mentioned in. Terms: https://slack.com/terms-of-service · Privacy: https://slack.com/privacy-policy
* **Webhooks** — Flow posts signed JSON to the endpoint URLs you enter under Flow → Webhooks. Payloads contain review status, post title and links, reviewer and requester names and email addresses, and comment text including the exact passage a comment points at. Deliveries and their payloads are kept in your database for the retention period you set and pruned by cron.
* **Akismet** — if the Akismet plugin is active and configured, anonymous comments on open-to-public reviews are checked with Akismet's `comment-check` endpoint (comment text, name, email, IP address, user agent and referrer), governed by Akismet's terms and privacy policy: https://akismet.com/privacy/
* **Freemius** (https://freemius.com/) — Pro licences are activated and updates are fetched through Freemius; no usage data is sent unless you explicitly opt in. Privacy: https://freemius.com/privacy/

== Installation ==

1. Install the plugin from Plugins → Add New, or upload the files to `/wp-content/plugins/jumplinks-editorial-workflow`.
2. Activate the plugin through the Plugins screen.
3. Go to Settings → Flow to choose content types, reviewer roles, automatic reviewer assignment, mandatory review, and the optional "Reviewed by" credit.
4. Open a page or post, assign a reviewer (a WordPress user or an email address), and send it for review.

== Frequently Asked Questions ==

= How does the review workflow work? =

Assign a reviewer, collect feedback via inline comments, request changes or approve, and publish when approved.

= What does the reviewer see? =

The actual page exactly as visitors will see it — Flow renders the content through your theme on the frontend. Inline comments anchor to the rendered output, so reviewers catch layout, spacing, and typography issues that the editor view hides. Reviewers also don't need to access the editor to leave feedback.

= Which editors are supported? =

Flow has dedicated integrations for Gutenberg, Classic Editor, Elementor, Bricks Builder, Beaver Builder, Divi, Avada, Breakdance, and Oxygen, plus WooCommerce products. In Gutenberg, Flow is a panel in the document sidebar. In Classic Editor and on WooCommerce products, it's a metabox on the edit screen. In the page builders, it's a control in the builder's top bar or toolbar.

= I use a different editor. What do I do? =

You can still use Flow. Open the post in Gutenberg or Classic Editor (both included with WordPress) to request reviews, manage reviewers, and track status. Your existing editor stays untouched for the actual content work, and reviewers still comment on the rendered page.

= Does Flow support custom content types? =

Yes. You can enable the review workflow for posts, pages, products, and custom post types from the settings screen. We cannot guarantee compatibility with every custom content type, but we are confident most cases are handled.

= Does Flow send notifications? =

Yes. Flow sends email notifications for key review lifecycle events, helping teams stay aligned on status changes. Slack integration is also included in the Pro version.

= Is Flow compatible with WooCommerce? =

Yes. Open Settings → Flow and choose the Product content type. WooCommerce products use the classic editor, so Flow appears as a Review metabox under Publish. Reviewers comment on the live product page.

= Who should use Flow? =

Freelance developers and agencies who want a structured way to share in-progress work with clients for feedback and approval, without sending screenshots or asking clients to navigate the WordPress admin. It also suits content and editorial teams that need a simple review and approval workflow without enterprise-style configuration, and teams that use AI or automation for first drafts and want a named person to approve before publishing.

= Can I use Flow to showcase work to clients? =

Yes. Enter your client's email address as the reviewer and Flow sends them a private magic link to the review page, with no WordPress account needed. They comment on the live page and approve or request changes. If you'd rather give them an account, assign a WordPress user with a reviewer role instead. Flow Pro adds public review links anyone can open, several external reviewers per post, and site-wide review.

= What's the difference between external reviewers, open review, and public review? =

An external reviewer is a named person you invite by email. They get a private magic link tied to their address. Free includes one per post; Pro removes the limit. Open review (Free) is a link any logged-in user on your site can open and comment on. Public review (Pro) is a link anyone can open and comment on, with no WordPress account and no invite. Use an external reviewer when you need a specific person's sign-off, and public review when you want wider feedback.

= Do I or my clients need to sign up for anything? =

No. Flow is a WordPress plugin, not a hosted service. The free version needs no account anywhere, and clients review through a private magic link. Flow Pro is a per-site license you buy through Freemius and activate inside WordPress.

= Does Flow generate or detect AI content? =

No. Flow is the human review and approval layer around content already in WordPress. It does not generate text, detect whether AI was used, or automatically verify factual claims.

= Can Flow stop an AI-generated draft from being published without approval? =

Yes. In Mandatory review mode, Flow blocks the initial Publish or Schedule action for supported content types until the active review is approved.

= Which AI agents work with it? =

Any client that can call WordPress abilities: an MCP client, the WordPress Agent Connector, or your own integration against the REST API. There is no partner list and no approved-vendor gate. If your agent can reach WordPress, it can read the review queue and act on it.

= Can the agent approve its own work? =

No, and this is deliberate rather than an oversight. There is no approve ability and no request-changes ability exposed to agents. With Mandatory review switched on, the publish block is enforced on the server, so an agent cannot ship unreviewed work even through the REST API.

== Screenshots ==

1. Assign reviewer to page in Gutenberg
2. Add inline comment to text
3. Add inline comment to image
4. Reply to comment
5. Settings page
6. Inline comments anchored to content on the review page
7. Assign reviewer to page in Classic Editor
8. Assign reviewer to page in Elementor
9. Assign reviewer to page in Bricks

== Changelog ==

= 2.5.0 =
* New: Live updates on the review page. Comments from another reviewer appear, change and disappear as they happen, and the status badge follows a decision someone else makes. No page refresh needed.
* New: When the author saves a new version while you are reviewing, Flow tells you instead of swapping the page under you. The bar marks the content as outdated and a notification offers the link to the new version, so you choose when to move.
* New: Settings are now split into Workflow, Multiple reviewers and Site Review tabs, so the Pro options no longer crowd one screen.
* Improvement: The Jumplinks icon now sits beside Review in the admin bar, tinted with the review status.
* Improvement: Site review now carries the same desktop, tablet and mobile preview switcher as a single-page review.
* Improvement: A new post now names the auto-assigned reviewer straight away, marked as pending until the first save creates the review.
* Improvement: Page cache compatibility. Reviewer sessions bypass W3 Total Cache, WP Rocket, LiteSpeed, WP Super Cache, Cache Enabler and SiteGround Optimizer, so a share link never shows a stale page.
* Improvement: Personal data export and erase now cover Flow, so review invitations, anonymous comments and Slack details answer the WordPress privacy tools.
* Improvement: Faster admin and review pages, with far fewer database queries per request and a smaller editor bundle.
* Fix: Send for review no longer appears until a reviewer is assigned, so turning on Open Review does not leave a dead button behind.
* Fix: The auto-assign reviewer setting now accepts any WordPress user, as the field describes. Picking someone outside the Review Roles, or yourself, assigns them and lets them approve.
* Fix: Security hardening across review permissions, comment validation and webhook destinations.

= 2.4.3 =
* New (Pro): Webhooks for n8n, Zapier, Make, and any other HTTP endpoint. Flow posts a signed JSON payload when a review is sent, approved, or sent back for changes, so an automated pipeline can pick up where the human left off — publish once it is approved, or hand the reviewer's comments to your writing agent, apply them, and resubmit for another human look. Each payload carries the exact passage every inline comment points at, already formatted for a prompt. Deliveries are queued and retried with a full delivery log, so a short outage at your end never loses an approval.
* New: AI agent capabilities for WordPress Agent Connector and other MCP clients. Connected agents can assign a reviewer, send content for review, read inline and general comments (including the selected text to change), resolve threads, and resubmit after they edit the page with the site's builder. Flow stays the human-in-the-loop gate: agents cannot approve their own work, and mandatory review still blocks Publish until a person approves.
* Improvement: Copy an external reviewer's magic link. Once a post has been sent for review, a copy icon appears beside the external email reviewer so you can pass the link on yourself — over chat, or to someone whose spam filter swallowed the invitation. Only people who can edit the post can see it.

= 2.4.2 =
* New: Optional "Reviewed by" credit on published content. Turn it on under Settings → Flow; after approval it appears below the author and category line, with WordPress reviewer names linked to their author archives. External email reviewers are omitted.
* New: Automatic reviewer assignment. Pick any WordPress user — including yourself, regardless of Review Roles — and Flow assigns them when new supported content is created.

= 2.4.1 =
* New: Add external emails as reviewers. Pick External Email in the reviewer field and Flow emails that person a signed magic link to the review page, where they can comment, approve, or request changes without a WordPress account. Available in every editor integration.
* Fix: Oxygen container design fix.

Earlier versions: https://jumplinks.net/changelog/
