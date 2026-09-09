=== Jumplinks Flow - Editorial Feedback, Review & Approval Workflow ===
Contributors: jumplinks, alincozari
Tags: client feedback, website feedback, workflow, editorial, ai
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 2.4.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

== Description ==

https://www.youtube.com/watch?v=6g9QunaILLc

Frustrated with client feedback chaos, multiple staging environments, endless meetings that could have been an email, hundreds of Jira tickets and lost Slack discussions? Or with AI drafts that look finished until a false claim, off-brand sentence, or broken layout ships?

Jumplinks Flow was inspired by the GitHub pull request review experience with inline comments and approval or change requests workflow that developers love, brought natively into WordPress for content and site reviews. No SaaS subscription, no external tools, just a familiar, focused review experience your team will pick up from day one.

If your current process depends on long comment threads, scattered docs and email, or third-party review tools, Flow gives you a cleaner path without complex setup or heavyweight workflow tools. If AI or automation is writing the first draft, Flow is the human checkpoint between that draft and Publish.

= ⚙️ How it works =

1. You assign a reviewer to the content — automatically from settings, or by picking a WordPress user or an email address for people outside your site.
2. The reviewer opens the review page and sends feedback via inline comments anchored to the content.
3. The reviewer requests changes or approves.
4. If changes are requested, repeat 2–3 until approval is received.
5. You publish with confidence once the content is approved. Optional: show who reviewed it next to the author.

= 🎯 Best for =

* Agencies and developers who present in-progress work to clients for feedback and signoff
* Editorial teams that need a clear draft-to-publish workflow
* Website owners that want structure without heavy workflow configuration
* Teams publishing AI-assisted posts, pages, or products who need a named human to verify facts, voice, and layout before go-live

= ✨ AI-generated content review =

AI speeds up production. It does not take responsibility. Flow does not generate or detect AI content — it starts where your AI workflow ends: with a draft already in WordPress.

1. Draft with ChatGPT, Claude, Gemini, n8n, Make, Zapier, the REST API, or any other tool, then save the result in WordPress.
2. Assign a named reviewer automatically for new content, or pick a WordPress user or external email by hand.
3. The reviewer inspects the rendered page — real theme, links, images, and layout — and pins comments to the exact sentence or media that needs a rewrite.
4. Request changes, resolve threads, and resubmit until someone with a name attached approves.
5. Optional: require approval before Publish, and show a “Reviewed by” credit on the live page after sign-off.

Use any writing assistant or automation you already have. Flow stays source-agnostic and keeps the approval decision in WordPress.

= 💡 Why teams choose Flow =

* **GitHub-style workflow:** Leave feedback exactly where it matters via inline comments so edits are clearer and faster.
* **Review directly on rendered page:** Reviewers don't need access to the content editor; they review the rendered output.
* **No WordPress account needed:** Send a review to any email address and Flow mails that person a private magic link straight to the review page — no user account, no signup, no login.
* **Automatic assignment:** Choose a default reviewer in settings and Flow assigns them as soon as new supported content is created — including drafts from the REST API or an unattended automation.
* **Named credit after approval:** Optionally show “Reviewed by” on published content so the human who signed off is visible next to the author.
* **Works with any editor:** Dedicated integration with Gutenberg, Classic Editor, Elementor, Bricks Builder, Beaver Builder, Divi, Avada, Breakdance, and Oxygen Builder, but all editors are supported.
* **Simple review and approval:** Move content through practical statuses such as in review, changes requested, and approved. Mandatory mode can block Publish until that approval exists.
* **Familiar Gutenberg-style review page:** Dedicated review UI that feels native to WordPress.
* **Fast team onboarding:** Minimal setup and intuitive UI for writers, editors, and reviewers.
* **Status-change notifications:** Keep everyone aligned with timely workflow updates.
* **Lightweight by design:** Built with native WordPress APIs and UI libraries.

= 🧩 Built for your content stack =

* **Editor support:** Dedicated integration with Gutenberg, Classic Editor, Elementor, Bricks Builder, Beaver Builder, Divi, Avada, Breakdance, and Oxygen Builder workflows.
* **Content type flexibility:** Use Flow for posts, pages, products, and custom post types.
* **WooCommerce friendly:** Works smoothly with WooCommerce-based editorial setups.

= 🤖 What makes Flow different =

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
3. Go to **Settings > Flow** to configure review mode, eligible content types, reviewer roles, automatic reviewer assignment, and the optional reviewed-by credit.

== Frequently Asked Questions ==

= How does the review workflow work? =

Assign a reviewer (or let Flow assign one automatically), collect feedback via inline comments, request changes or approve, and publish when approved.

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

= Can I use Flow to review AI-generated content? =

Yes. Flow is the human review layer around a WordPress draft, whether a person wrote it or an AI tool / automation created it. It does not generate text, detect whether AI was used, or automatically fact-check claims. Reviewers read the rendered page, comment in context, and either request changes or approve. Auto-assign can attach a reviewer the moment the post is created, and Mandatory review can block the initial Publish or Schedule action until that person signs off.

= Who should use Flow? =

Flow is ideal for content and editorial teams that need a simple review and approval workflow in WordPress without the overhead of enterprise-style configuration — including teams that use AI or automations to produce first drafts and still want a named person to verify the live page. It also works well for freelance developers and agencies who want a structured way to share in-progress work with clients for feedback and approval, without sending screenshots or asking clients to navigate the WordPress admin.

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

= 2.4.2 =
* New: Optional “Reviewed by” credit on published content. Turn it on under Settings → Flow; after approval it appears below the author and category line, with WordPress reviewer names linked to their author archives. External email reviewers are omitted.
* New: Automatic reviewer assignment. Pick any WordPress user — including yourself, regardless of Review Roles — and Flow assigns them when new supported content is created.

= 2.4.1 =
* New: Add external emails as reviewers. Pick External Email in the reviewer field and Flow emails that person a signed magic link to the review page, where they can comment, approve, or request changes without a WordPress account. Available in every editor integration.
* Fix: Oxygen container design fix.

= 2.4.0 =
* New: Integration with Oxygen.

Earlier versions: https://jumplinks.net/changelog/
