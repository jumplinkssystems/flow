=== Jumplinks Flow – Client Feedback & Editorial Workflow ===
Contributors: jumplinks, alincozari
Tags: client feedback, website feedback, content approval, site review, editorial workflow
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 2.7.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Client feedback on the live page with inline comments and content approval editorial workflow. Magic links for clients, no signup, no SaaS subscriptions, no external services. MCP AI-ready. Works with your builder.

== Description ==

Send your client one link. They open the page exactly as visitors will see it, highlight the sentence or image they mean, type the comment right there, and click Approve when it's ready. No WordPress account, no screenshots in email, nothing stored outside your own site.

Try it without installing: open the Live Preview above and you're already logged in as a reviewer. The demo page itself walks you through what Flow does, with screenshots and a short video, and you can comment on all of it.

Turn on Mandatory review and WordPress will not publish until a reviewer approves. Works in Gutenberg, Classic, Elementor, Bricks, Breakdance, Beaver Builder, Divi, Avada and Oxygen 6 — and the review link keeps working behind your cache plugin or maintenance mode.

https://www.youtube.com/watch?v=6g9QunaILLc

Flow takes the GitHub pull request review process with inline comments and approve or request changes workflow and builds it into WordPress. It runs entirely on your site, and your clients never need to create a WordPress account.

If your current process depends on long comment threads, scattered docs and email, or third-party review tools, Flow gives you a cleaner path without complex setup or heavyweight workflow tools. If AI or automation is writing the first draft, Flow is the human checkpoint between that draft and Publish.

= ⚙️ How it works =

1. Assign a reviewer to a page or post: a WordPress user, or just your client's email address.
2. Your client gets a private magic link straight to the review page. No account, no signup, no login.
3. They pin comments to the exact text or image on the rendered page.
4. They approve or request changes. You fix, resubmit, and repeat until it's approved.
5. You publish once it's approved, knowing exactly who signed off.

= 🎯 Why agencies and freelancers use Flow =

* **One link, no login.** Your client clicks and is in. No "how do I log in" call, no password reset at 11pm. Email invite links stop working the moment you remove the reviewer or cancel the review, and a cancelled review stays readable for your team.
* **They review the real page.** Mobile, menus, fonts — what they see is what visitors get, so "the blue box on the phone" never needs a screenshot. They never touch the editor.
* **Comments sit where the problem is.** Every comment is pinned to the exact words or image, with threaded replies, so nothing has to be described twice.
* **A yes you can point to.** With Mandatory review on, WordPress will not publish until a reviewer clicks Approve, and the review records who did.
* **Nothing leaves your site.** Comments, approvals and links live in your own database. No third party sees the draft, no per-seat bill.
* **Works where you build.** Gutenberg, Classic Editor, Elementor, Bricks, Beaver Builder, Divi, Avada, Breakdance and Oxygen 6 — and the review link keeps working behind your cache plugin or your builder's maintenance mode.
* **Three decisions at setup, then one screen.** Optional or mandatory review, which content types, who can review — under Flow → Settings. A Review column on your post lists shows where every piece of content stands, a dedicated Reviewer role is created for you, and the interface ships in 86 languages.

= 📝 Also works for editorial teams =

Writers send drafts to an editor, the editor comments in context and approves, and the post goes live. No custom statuses to design, no workflow builder to configure. Flow works on posts, pages, WooCommerce products, and custom post types. It can assign a default reviewer automatically and show a "Reviewed by" credit on published content.

= ✨ Human approval for AI and automated drafts =

Flow doesn't generate text or detect AI content. It's the checkpoint between a draft and Publish, whoever or whatever wrote the draft.

* Drafts created by ChatGPT, Claude, n8n, Make, Zapier, or the REST API can get a reviewer assigned automatically the moment the post is created.
* With mandatory review on, the first Publish or Schedule stays blocked until a person approves, including attempts through the REST API.
* AI agents connected through WordPress Agent Connector or MCP can send content for review, read comments, resolve threads, and resubmit. Only a human can approve or request changes.
* Optionally let an agent reply to a comment to ask what you meant, and make it say what it changed when it resolves one. Off by default; you choose which user those comments are posted as.

= 🤖 What makes Flow different =

Most feedback tools are paid-only SaaS subscriptions that charge per reviewer and require clients to sign up for separate accounts. Flow runs entirely inside your WordPress site, and lets you invite reviewers with a single link — no signup, no monthly fee, no third-party service collecting your content.

Editorial workflow plugins optimize for maximum configuration. Flow optimizes for feedback momentum. You get a clear approval process and contextual collaboration without overwhelming your team or clients with complexity.

If you want an editorial workflow that is modern, focused, and easy to use from day one, Flow is built for you.

= 🚀 Flow Pro =

Everything above is free. [Flow Pro](https://jumplinks.net/pro) adds:

* **Public review:** share one review link that anyone can open and comment on, with no WordPress account and no email invite needed.
* **Site-wide review:** send the whole site. Reviewers browse in review mode and comment on any page.
* **Unlimited reviewers:** Free allows one reviewer per post, a WordPress user or an email invite. Pro removes the limit.
* **Multiple reviewers:** set a minimum number of approvals, with each reviewer's vote tracked separately.
* **Device switcher:** reviewers check desktop, tablet, and mobile widths without leaving the page.
* **Rich comments and @mentions:** formatting, links, and code blocks, plus mentions for reviewers, authors, and external invitees.
* **Slack notifications:** DMs for assignments, mentions, approvals, change requests, and site review invites.
* **Webhooks for n8n, Zapier, and Make:** signed JSON payloads for 17 events across the review lifecycle — sent, approved, changes requested, resubmitted, comments and site reviews. Deliveries are queued and retried with a full log. Payloads include the exact passage each inline comment points at, formatted for a prompt, so a writing agent can apply the fixes and resubmit.
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
3. Go to Flow → Settings to choose content types, reviewer roles, automatic reviewer assignment, mandatory review, and the optional "Reviewed by" credit.
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

Yes. Open Flow → Settings and choose the Product content type. WooCommerce products use the classic editor, so Flow appears as a Review metabox under Publish. Reviewers comment on the live product page.

= Who should use Flow? =

Freelance developers and agencies who want a structured way to share in-progress work with clients for feedback and approval, without sending screenshots or asking clients to navigate the WordPress admin. It also suits content and editorial teams that need a simple review and approval workflow without enterprise-style configuration, and teams that use AI or automation for first drafts and want a named person to approve before publishing.

= Can I use Flow to showcase work to clients? =

Yes. Enter your client's email address as the reviewer and Flow sends them a private magic link to the review page, with no WordPress account needed. They comment on the live page and approve or request changes. If you'd rather give them an account, assign a WordPress user with a reviewer role instead. Flow Pro adds public review links anyone can open, several external reviewers per post, and site-wide review.

= How do I start a new review for a page? =

Cancel the current one: click the × on the reviewer, the Cancel review button in the Current Review row, or the Cancel review button in the review page's top bar (shown to whoever requested the review). The old review becomes read-only, so its comments stay on record, and assigning a reviewer again starts a new review that begins empty. Open review is off on the new review until you turn it on again.

= What's the difference between external reviewers, open review, and public review? =

An external reviewer is a named person you invite by email. They get a private magic link tied to their address. Free includes one per post; Pro removes the limit. Open review (Free) is a link any logged-in user on your site can open and comment on. Public review (Pro) is a link anyone can open and comment on, with no WordPress account and no invite. Use an external reviewer when you need a specific person's sign-off, and public review when you want wider feedback.

= Do I or my clients need to sign up for anything? =

No. Flow is a WordPress plugin, not a hosted service. The free version needs no account anywhere, and clients review through a private magic link. Flow Pro is a per-site license you buy through Freemius and activate inside WordPress.

= Does Flow generate or detect AI content? =

No. Flow is the human review and approval layer around content already in WordPress. It does not generate text, detect whether AI was used, or automatically verify factual claims.

= Can Flow stop an AI-generated draft from being published without approval? =

Yes. In Mandatory review mode, Flow blocks the initial Publish or Schedule action for supported content types until the active review is approved.

= Which AI agents work with it? =

Any client that can call WordPress abilities: an MCP client, the WordPress Agent Connector, or your own integration against the REST API. AI Engine's and Elementor's MCP servers work too — each serves its own list of tools, so Flow adds its review tools to both. There is no partner list and no approved-vendor gate. If your agent can reach WordPress, it can read the review queue and act on it.

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

= 2.7.0 =
* New: Site review links expire after a set number of days (Pro): choose 1 to 999 days under Settings → Site Review (default 30). Seven days before, the review page shows a notice where you can extend by any number of days, and the requester gets an email.
* New: Feedback summary on the site review page (Pro): open any page to see its comments with author, status and replies, filter by status or by reviewer, and jump straight to a comment with Open comment. Each reviewer shows "X comments on Y pages".
* New: Emoji reactions on comments (Pro): react with 👍 👎 ✅ ❤️ 👀 or 🤔 from the button in a comment's corner, like in Slack. Reactions show under the comment with a count and never send an email.
* New: Emoji in the comment editor (Pro): an emoji button after the link button inserts common reactions, and typed smileys such as :) or <3 turn into emoji.
* Improvement: The general comment form in the review sidebar opens from an Add general comment link, and only one comment, reply or edit form is open at a time.
* Improvement: Site review counts are per thread: replies no longer count as open comments, and the summary sidebar shows open and resolved counts for every page, general comments included.
* Improvement: Mobile: on iPhone the comment field no longer zooms the page and stays above the keyboard, the first tap on an image or video shows its overlay and the second opens the comment, and comment dates are shorter.
* Fix: Theme styles no longer leak into Flow's menus and comment editor, the space after a mention is kept, and the link badge fits small images.
* Fix: Updates show up straight away on sites behind Cloudflare or other caches: Flow's script and style files now have the version in their name.

= 2.6.4 =
* New: Reviewers, including people invited by email, can resolve comment threads. Turn it off under Settings → Workflow → "Disable reviewers resolving comments"; reviewers can always reopen a thread.
* New: The reviewer field suggests the last 5 email addresses you invited.
* Improvement: Mobile interface improvements: panels take 80% of the screen and fit above the browser toolbar, larger bar buttons, review actions at the bottom of the comments panel, the comment box opens under the selected text, and picking a page or comment closes the panel.
* Fix: In site reviews (Pro), menus such as View no longer open on top of their button when the WordPress toolbar is turned on.
* Improvement: Clearer confirmations for Send feedback and Exit review in site reviews (Pro).
* Fix: Clicking a comment inside a closed accordion, toggle or tab opens it and scrolls to the comment, for all supported builders and popular block plugins, and accordion or tab titles that are links (Avada, Bootstrap, Divi) open on the review page.
* Fix: Comment overlays on linked images, logos and Woodmart cards; no overlay on background images.
* Fix: Reviewers who are not logged in see Flow in the site's language.
* Fix: The Flow logo no longer links to jumplinks.net for reviewers who are not logged in.
* Fix: In site reviews (Pro), replies stay in their thread after a reload, and general comments show only on the page they were added on.
* Fix: Email reviewers can reopen a thread when they reply, and the post author can resolve comments on their own post.

= 2.6.3 =
* New: Review history shows each cancelled review's status as a coloured dot, its reviewers, status and comment count on hover, and a Restore button that brings the review back with its comments, reviewers and status. The review that was running is cancelled and kept in the history, so you can switch back. Reviews cancelled before this update come back as pending.
* New: Create the user AI comments are posted as straight from Settings → AI agent or the setup wizard, with a Create user button next to the field. It only needs a username and an email, and is made a Subscriber with a random password.
* Fix: In the builder integrations, the reviewer list opens over the edge of the review panel instead of being cut off by it, and in Gutenberg it opens over Current review instead of pushing it down.
* Fix: Review history in every builder shows the comment count on the right, with date links in each builder's own link colour. Avada's history links are no longer oversized, and in Beaver the Open review note matches Beaver's text colour.
* Fix (Avada): The Self review description sits right under its checkbox, and opening the reviewer field no longer flashes a scrollbar.
* Fix: Administrators and editors (anyone who can manage reviews) can open any review page, not only reviews they requested or were assigned to. Self reviews stay private.
* Improvement: In the builder integrations and the Classic editor, the "Review Mode set to Mandatory" notice can be dismissed. It stays hidden in that browser; publishing is still blocked until approval.
* Tweak: The Breakdance review panel is as tall as Oxygen's, and in Divi the Current review icons are smaller and its link uses Divi's link blue.

Earlier versions: https://jumplinks.net/changelog/
