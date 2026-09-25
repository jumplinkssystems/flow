=== Jumplinks Flow – Client Feedback & Editorial Workflow ===
Contributors: jumplinks, alincozari
Tags: client feedback, website feedback, content approval, site review, editorial workflow
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 2.5.3
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
* Optionally let an agent reply to a comment to ask what you meant, and make it say what it changed when it resolves one. Off by default; you choose which user those comments are posted as.

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

= 2.5.3 =
* New: Flow now works with Elementor and AI Engine's MCP server.
* Fix: AI agents now post review comments as the account chosen under Settings.
* Improvement: AI agents pick up changes to the AI agent settings without reconnecting.
* Fix: An open review page now tells you when a newer version is saved, including for reviews that were never sent and brand-new posts.
* Fix (Pro): Switching between Desktop, Tablet and Mobile in a review now reloads the page at that width.

= 2.5.2 =
* New: Settings → AI agent now hands you the prompts to give your agent, each with a copy button. An agent only picks up these rules by calling flow/get-instructions, so the first prompt tells it to do that after you change a setting. The rest are short examples for everyday jobs: resolving the comments on a post, getting an overview of the feedback on a page, and sending it back to the reviewer.
* New (Pro): The site review screen now tells you which cookies your page cache has to let through. Reviewers arrive logged out, so a cache can hand them a copy of the site saved before the review existed; the Caching panel lists the exact cookie names to add to a do-not-cache list, names any caching plugin it finds, and links to the setup guide.
* Improvement (Pro): Site review feedback now arrives live. When another reviewer comments while you have the review open, it shows up on its own instead of on your next reload, the way it already worked on a page review. Coming back to the tab or window refreshes it straight away, so you never look at a stale page while catching up.
* Improvement: Anonymous reviewers can leave up to 10 comments a minute from one address, up from 5. The limit counts the address rather than the person, so two people reviewing from the same office or home network were reaching it between them.
* New: Review links get through maintenance and coming-soon modes. Someone holding a valid review link lands on the page and comments as usual while the site is closed to everyone else, and every other visitor still meets the maintenance screen. Works with Bricks, Beaver Builder, Avada, Elementor, Breakdance, Oxygen and WooCommerce, with no setting to turn on.
* New: Turn external reviewers off for page reviews. Under Settings → Workflow, "Disable external reviewers" hides the External Email option in the editor and turns away email invites at the API. It is off by default, and anyone already invited keeps the access they have.
* New (Pro): Site review rounds. Once a reviewer has sent their feedback and you have applied it, send the site back to that reviewer for another look — from the Site Review screen, from the review bar while previewing, or through the flow/resubmit-site-review agent ability. Each reviewer is sent back individually, gets a fresh link, and their earlier comments stay in place. Agents see who to send back in resubmit_to, and a new site_review.resubmitted webhook event fires.
* New (Pro): Add or remove reviewers after a site review has gone out. People you add get their invitation; someone you remove loses access immediately.
* Improvement (Pro): The Site Review screen was rebuilt. The list is now what you land on, with status, how many reviewers have submitted, and the comment counts readable at a glance, plus filters, search, sorting and paging. Creating a review has its own screen, and every review has its own page with the reviewer roster, per-reviewer actions, and the feedback broken down by page.
* Improvement (Pro): External reviewers are invited from the same Reviewers field as everyone else on the Site Review screen. Type an address and pick "Invite", instead of ticking a box and filling a second field. With "Disable external reviews" on, the option is not offered at all.
* Improvement: The welcome popin no longer greets a reviewer who has already been through it. Anyone who gave their name or left feedback goes straight into the review, even on a different browser or device.
* Fix (Pro): Clicking the "Invite {email}" suggestion in the Reviewers field now adds that external reviewer.

= 2.5.1 =
* New: AI agents can now write back. An agent connected over MCP can reply to a review comment to ask a clarifying question when your instruction is ambiguous, instead of guessing or going quiet.
* New: An agent must now say what it changed when it resolves a comment. The explanation is posted into the thread, so every resolved piece of feedback carries its own record.
* New: Two switches under Settings → AI agent control this separately, both on by default. "Resolve comments" decides whether an agent has to explain what it changed before a comment counts as resolved, and "Follow-up comments" decides whether it may ask you a question when your feedback is unclear. Turn either off and that ability disappears from the agent entirely.
* New: "Ask before editing", marked Experimental and off by default. It sits with the other AI agent options, so it needs "Enable AI comments" and a chosen AI user. With it on, the agent works out what it would change and describes the plan in your chat — which page, which wording, and anything it still needs from you — then waits for your go-ahead before touching the site. It is an instruction Flow gives the agent rather than a lock: Flow never edits content itself, so it cannot physically block an edit.
* Improvement: Tightened what agents are told about feedback. A highlighted passage only locates a comment and never states what to change, and a vague or non-actionable comment must be left unresolved and asked about rather than guessed at.
* New: Reopen a resolved comment. Reply to a resolved thread and tick "Reopen this thread" to move it back to active.
* New: Copy a reviewer's link straight from the site review screen.
* Improvement: First-time reviewers now get a short looping clip showing how to highlight text and leave a comment.
* Improvement: The review page hint moved out of the way. It is now a dismissible card in the bottom-left corner.
* Improvement: Long comments are no longer cut off in the sidebar. A "Read more" toggle expands a comment or a reply in place, and collapses it again.
* Improvement: Settings are easier to scan. The AI agent options have their own tab, and the notification settings moved to Extras next to the other occasional options.
* Fix: Saving settings no longer throws you back to the first tab. Whichever tab you were on is carried through the save, so you land where you left off.


Earlier versions: https://jumplinks.net/changelog/
