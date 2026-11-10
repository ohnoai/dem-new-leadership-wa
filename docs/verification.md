# Verification and remaining release checks

## Executed locally

Environment: Windows 11, Node.js 24.22.1, Playwright Chromium. No public deployment, calls, form submissions, or social publication were performed.

`npm run check` runs Node state tests and browser tests at 375×812, 430×932, and 1440×1000. The suite verifies:
Latest completed run (2026-11-10, PR #5 review follow-up): **11 Node tests and 147 Playwright cases passed**. `npm audit` reported zero vulnerabilities, and JavaScript syntax plus whitespace checks passed.

- Recipient-first editing, next-official navigation, correct greetings and role-specific requests for every listed official.
- Shared priorities following recipients; personal letters remaining independent of the master.
- Personal drafts surviving refresh and an external-contact tab round trip. The round-trip test deliberately uses a local intercepted stand-in for the congressional page; it does not claim a live form was submitted or completed.
- Real Chromium clipboard read/write for message and subject. Windows CRLF clipboard normalization is normalized in the assertion, not in the message.
- Clipboard denial selects the existing text for manual copying without claiming success.
- Separate, persistent official/channel completion. Opening contact pages, copying, and sharing do not automatically check completion.
- Phone URI formatting and editable, saved call/social text. Native-share payload tested with a stub; no real device share sheet was exercised.
- Disabled storage warning, with the editor still usable in memory. Pending completion checks and unchecks survive failed writes, merge newer persisted actions, and can be saved after storage recovers.
- Prototype v2 letter, call, social and completion migration, preserving old text verbatim.
- Malformed URL escapes return HTTP 400 from the localhost preview server without terminating it.
- A stale browser tab refusing to overwrite newer saved drafts, including pagehide.
- All ten House districts in the picker; Republican representatives correctly shown as indirect influence rather than Democratic caucus voters.
- Cross-platform social text uses the person's name rather than inventing a universal social mention. Published profile links remain available separately.
- No horizontal document overflow at tested widths, including expanded controls and each channel.
- Keyboard skip-link entry and focus movement. Axe WCAG 2 A/AA and 2.1 AA checks on the main editor and all channel panels, with disclosures open.

Mobile and desktop screenshots were inspected locally. Main controls are 44px or taller; compact progress remains in the sticky header. Substantive letters remain intact inside a spacious, resizable editor, with an explicit full-letter expansion to avoid mandatory nested scrolling. The mobile workflow is stacked and the desktop workflow uses a recipient sidebar.

## Approved Pressure visual implementation

The owner selected concept A. Production now uses DEM RESET branding, near-black/warm-paper surfaces, self-hosted Barlow Condensed headlines and citron reserved for brand emphasis, primary actions and focus/progress. A small original geometric evergreen sits beside the Washington edition label at 16px on mobile and 20px on desktop; no scenic imagery or mountain artwork remains.

Browser screenshots were rendered and inspected at 375px, 430px and 1440px, including hero, action viewport and full workflow. No page errors, missing headline font or document overflow were observed. A new regression checks the hero CTA's focus destination, long-letter expansion through typing and recipient switches, compact mode and the evergreen asset. Expansion is presentation-only in `presentation.js`; hardened `app.js` and `model.js` remain unchanged. Existing regression cases were retained without weakening assertions.
Independent review identified a 320 CSS-pixel headline overflow and a keyboard-collapse focus target partly hidden by the sticky header. Both were reproduced and corrected with regressions. The preview server now serves the local WOFF2 font with its proper MIME type. One verification run overlapped another Playwright runner and failed during artifact cleanup with missing trace files; the complete suite was rerun successfully using an isolated output directory.

The letter body and role-specific requests remain unchanged. The campaign identity, introduction and social hashtag were updated in configuration; a separate editorial review of campaign content remains outstanding. Visual inspection is recorded separately from automated accessibility/test results and is not a substitute for owner review.

Additional checks: `git diff --check`; dependency audit; JavaScript syntax checks through file tooling and Node/browser execution. The original prototype had no automated test framework; no existing test suite was removed. MIT license preserved.

## Functional hardening findings

The storage recovery defect was reproduced before changing application code. After an injected write failure, the first recovered write reached localStorage but the global failure flag remained set. The successful write did not advance the stale-tab baseline, so the following edit was rejected as another tab's change. An action-only failure also poisoned draft saves. A read failure was incorrectly classified as a stale-tab conflict.

Storage now tracks failed reads and writes per key. Each successful operation clears only its own error, and each successful draft write advances its baseline regardless of unrelated failures. Failed reads never authorize overwriting an unknown stored draft. Once an initially inaccessible empty store becomes readable, editing resumes without reload. Existing stored content discovered after an unreadable startup is retained and treated as a conflict, not replaced with the in-memory default.
Independent review also reproduced an action-only read failure that cleared its warning before pending completion was saved, and migration overwriting unreadable action history. Pending actions now retry their merge/write during draft save; migration writes action history only after confirming that its destination is absent. Regression tests inspect the actual stored action map, not just the checkbox or status.

Migrated letters, call scripts and social posts keep exact text. A visible imported-draft warning names the current recipient and requires explicit review before the copy, share, contact-page or phone actions. Review is recipient/text-specific, survives refresh, and is invalidated by edits or channel changes. Older v3 imports are identified by comparison with the retained v2 source where available. This does not infer that a greeting is correct or rewrite it for the user.

Added audit cases cover recipient-only reset, a second page reopening saved work, erase cancellation and scoped deletion, social-share cancellation/unsupported fallback, and subject clipboard denial. These passing audit cases did not require application changes. No styling overhaul, dependency, service, analytics or account system was added.

The audit reproduced delayed clipboard rejection selecting a newly chosen recipient's text and delayed share rejection copying the wrong post. Async actions now retain their original payload and context; stale callbacks cannot focus/select replacement text or announce success for a different recipient.

Erase now removes the legacy migration source first, stopping if that fails instead of deleting v3 replacements and reimporting old private text on reload. It emits action removal even when no action record existed, so other open tabs discard pre-erase pending completions rather than restoring them. This requires writable localStorage for the notification; a denied erase reports failure and directs the user to browser settings. Storage deletion across multiple keys is not transactional.

## Contact-form compatibility revision

All 14 listed contact routes were inspected in actual Chromium browser sessions on 2026-11-10, including linked forms, the governor's official embedded form and available DOM requirements. Findings, source URLs, exact field evidence and per-finding verified/unverified/inaccessible labels live in [contact-forms.md](contact-forms.md). No constituent identities, address submissions, message submissions or CAPTCHA bypass were used. Address gates, multi-page identity steps and the party site's security check prevented complete downstream inspection. Missing maxlength attributes are not evidence of unlimited length; server acceptance is untested for every form.

The editor shows subject and message counters, verified recipient caps and explicitly labeled user-reported advisories, with non-destructive over-limit warnings. Baumgartner's observed counter counts line breaks as two UTF-16 units; other counts use textarea UTF-16 length, including two units per emoji. Copy/open remain user-controlled even over the limit. No maxlength is applied in DEM RESET and text is never truncated. Concise and full drafts retain separate recipient overrides in the existing local draft key; completion remains independent. Full campaign defaults and imported full drafts remain intact.

New failing-first regressions cover counter updates, verified-only boundaries, newline counting, 12,000-character retention, full/concise subject and message independence through refresh and recipient switches, exact concise clipboard content, active-version reset, legacy text retention and independent completion. Axe ran on the concise editor as well as the existing full/channel coverage. The complete preexisting regression suite was retained.
Independent review found two reproducible issues before delivery: shared editing targeted the full master while concise was active, and a version-switch assurance replaced a stale-tab copy/reload warning. Both failed in real browser regressions, then were corrected. Shared fields now edit and identify the selected version's master, and version switches leave save/conflict feedback intact. Subject is associated with the shared over-limit warning for assistive technology. The full suite was rerun after these fixes.

## Source verification

PR #5 follow-up regressions hide Copy subject only for audited absent/category controls, retain both subject versions across recipient switches and refresh, and leave copying available for unknown-cap or uninspected subjects. Perez's user-reported advisory is tested at 2,000 and 2,001 characters, including exact over-limit clipboard copying, full/concise persistence, unchanged default copy and independent completion. Axe includes the advisory warning state. Local Squelch lock-status reports 1 of 1 fully locked after fast-forwarding the clean local Squelch checkout to the human-merged comment-normalization fix; no rules or protection files changed.

Contact routes, office numbers, published social identities, and district references are documented with primary-source evidence in [sources.md](sources.md). The old Murray `/contact/` link was a 404 and is replaced with the actual message form. Directory and contact-page retrieval is not proof of successful form submission. Published social links are evidence of office identity, not a guarantee of platform access or monitoring.

## Outstanding before public launch

1. Test physical iPhone Safari and Android Chrome, including the native picker, clipboard permission UI, app switching, dialing and real native share sheet. Desktop/mobile-emulated Chromium does not establish those behaviors.
2. Perform a manual NVDA or VoiceOver pass. Automated axe checks and keyboard checks are not equivalent to a human screen-reader session. Test browser zoom, large system fonts and OS high-contrast mode manually.
3. Complete an address-to-congressional-boundary validation in the official state finder. Its live page and map loaded in a browser, and the public Capitol address `416 Sid Snyder Ave SW, Olympia, WA 98504` returned a location and Legislative District 22. Switching to Congressional displayed the ten congressional polygons, but the results panel retained legislative officials; a congressional result was not verified. The app also offers the official House finder as a fallback and links the official map set. No private residential address was entered; this app does not geocode or guess from ZIP codes.
4. Recheck live congressional and party membership immediately before launch and after the next Congress takes office. No 2026 election outcome or leadership-election date is asserted by this revision.
5. Complete the unresolved external-form checks in [contact-forms.md](contact-forms.md), particularly downstream address-gated fields, native mobile paste, the party site's security interstitial and server-side limits. Do not submit test advocacy to offices. The dated audit covers observed DOM and safe browser interaction, not successful delivery.
6. Multi-tab draft edits are conflict-detected, not merged. A blocked stale tab asks the user to copy local edits and reload. Truly simultaneous writes remain subject to localStorage's lack of transactions; use one editing tab at a time.
7. The new-page reopening test uses the same browser context, not an actual browser-process restart. Physical browser shutdown/reopening remains a manual check. Imported text can only be identified retrospectively when its retained legacy source or provenance marker exists; this is not automatic detection of every incorrectly addressed user-written letter.

This is a PR-ready implementation with the above release checks disclosed, not a claim that physical-device, assistive-technology or external-service testing has been completed.
