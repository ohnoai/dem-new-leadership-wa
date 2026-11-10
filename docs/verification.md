# Verification and remaining release checks

## Executed locally

Environment: Windows 11, Node.js 24.22.1, Playwright Chromium. No public deployment, calls, form submissions, or social publication were performed.

`npm run check` runs Node state tests and browser tests at 375×812, 430×932, and 1440×1000. The suite verifies:
Latest completed run: **4 Node tests and 45 Playwright cases passed**. `npm audit` reported zero vulnerabilities, and JavaScript syntax plus whitespace checks passed.

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

Mobile and desktop screenshots were inspected locally. Main controls are 44–48px or taller; compact progress remains in the sticky header. Substantive letters remain intact inside a scrollable, resizable editor, rather than expanding the entire page to letter length. The mobile workflow is stacked and the desktop workflow uses a recipient sidebar.

Additional checks: `git diff --check`; dependency audit; JavaScript syntax checks through file tooling and Node/browser execution. The original prototype had no automated test framework; no existing test suite was removed. MIT license preserved.

## Source verification

Contact routes, office numbers, published social identities, and district references are documented with primary-source evidence in [sources.md](sources.md). The old Murray `/contact/` link was a 404 and is replaced with the actual message form. Directory and contact-page retrieval is not proof of successful form submission. Published social links are evidence of office identity, not a guarantee of platform access or monitoring.

## Outstanding before public launch

1. Test physical iPhone Safari and Android Chrome, including the native picker, clipboard permission UI, app switching, dialing and real native share sheet. Desktop/mobile-emulated Chromium does not establish those behaviors.
2. Perform a manual NVDA or VoiceOver pass. Automated axe checks and keyboard checks are not equivalent to a human screen-reader session. Test browser zoom, large system fonts and OS high-contrast mode manually.
3. Complete an address-to-congressional-boundary validation in the official state finder. Its live page and map loaded in a browser, and the public Capitol address `416 Sid Snyder Ave SW, Olympia, WA 98504` returned a location and Legislative District 22. Switching to Congressional displayed the ten congressional polygons, but the results panel retained legislative officials; a congressional result was not verified. The app also offers the official House finder as a fallback and links the official map set. No private residential address was entered; this app does not geocode or guess from ZIP codes.
4. Recheck live congressional and party membership immediately before launch and after the next Congress takes office. No 2026 election outcome or leadership-election date is asserted by this revision.
5. Manually inspect each live external form in a regular browser for constituency gates, CAPTCHA and current field limits. Do not submit test advocacy to offices. Rate limits and anti-bot responses may prevent automated verification; those are recorded in the source audit.
6. Multi-tab draft edits are conflict-detected, not merged. A blocked stale tab asks the user to copy local edits and reload. Truly simultaneous writes remain subject to localStorage's lack of transactions; use one editing tab at a time.

This is a PR-ready implementation with the above release checks disclosed, not a claim that physical-device, assistive-technology or external-service testing has been completed.
