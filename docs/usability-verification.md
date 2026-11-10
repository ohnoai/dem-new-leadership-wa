# Three-step usability verification

Baseline: `746cf77f12262622e97f262fcbd45a657df63625` from `origin/main`.

## Interface change

The redundant action introduction is replaced by optional details spanning the workspace. Name, city, county and ZIP are visible without disclosure. Desktop places official and district selection on the left and a larger action editor on the right; mobile keeps the same numbered order vertically.

Letter, Call and Social are native radio choices. Full letter and Concise are a separate native radio group using the existing saved values. District discovery is visible, with an explicit statewide-senator starting point. Only alternate district tools remain collapsible. Call and social editors grow to show their complete text.

The category master and recipient reset are in Advanced editing below the workspace. Draft provenance labels and implementation instructions are removed from the basic path. Detailed personalization/privacy behavior remains in About and [development](development.md). Long recipient form evidence is in About this contact form; counters, numeric limits, over-limit warnings and recipient-specific subject restrictions remain visible. Completion is optional recordkeeping rather than another campaign instruction.

## Preservation evidence

`campaign.js`, `data.js` and `model.js` match the baseline after checkout CRLF normalization. The homepage hero markup and evergreen are unchanged after the same normalization. The social preview PNG matches the baseline bytes (SHA-256 `498405d4028af66fd929384d12169f60ca7165396fa93d9e1c59302d18a033c5`). No dependency or persistence-schema changes.

Existing browser regressions retain exact assertions for full/concise recipient edits, shared category drafts, legacy migration, opaque manual signatures, inactive Republican history, local completion, failed storage, cross-tab conflicts and erasure. Only selectors and access to relocated advanced controls were adapted. The Node editorial suite protects all approved category letters, subjects, calls, posts and legacy defaults.

## Executed checks

- `npm test`: 21 passed.
- `npx playwright test -c playwright.usability.config.js --workers=1 --reporter=line`: 237 passed across mobile-375, mobile-430 and desktop projects, including axe WCAG A/AA checks.
- New layout cases cover 320, 375, 430, 768, 1440 and 1920 CSS pixels. Existing six-width accessibility checks and all-channel overflow checks pass. Keyboard tests cover details-to-selector order, arrow-key radio selection, focus indicators and restored concise drafts.
- JavaScript syntax checks passed for root and script JavaScript files.
- `npm audit`: zero vulnerabilities.
- `git diff --check`: passed.

The first baseline browser run reused an older server on port 4173: 204 passed and three PNG MIME assertions failed. A fresh server on port 4187 passed the unchanged PNG test. The dedicated verification config refuses to reuse a server. An initial updated run had three ambiguous test locators and one Chromium axe target crash; the selectors now specify the official combobox, and the complete suite passed with one worker. No assertions were weakened.

Clipboard tests use Chromium's real clipboard. External contact navigation uses a local intercepted stand-in. Share tests exercise stubbed device APIs, not an actual device share sheet. No correspondence was submitted, call placed or post published.

## Local visual evidence

Run `PORT=4188 npm start`, then `node scripts/capture-workflow.js` in another terminal. The gallery is `tmp/review/three-step-workflow/index.html`, outside Playwright's cleaned output. It contains before/after action views at 375 and 1440, finished full-page and action views at all six widths, and call/social views at 375 and 1440. The before view uses a separate empty browser context and baseline HTML/CSS/behavior.

Finished screenshots were visually inspected at all six widths, including call/social views. All six capture probes recorded no horizontal overflow or page errors. The approved hero is intentionally retained; its height is not evidence that the five-second criterion has been met.

## Human acceptance still required

Automated checks and screenshot review do not establish human usability. Ask first-time Washington constituents to identify the starting point within five seconds, optionally add details, select an official or find their district, edit and copy a letter, find the contact page, switch to call/social, and explain that nothing is automatically submitted. Observe without coaching.

Also check physical phones, a screen reader, browser text enlargement and native phone/share-app round trips. No merge, production deployment or DNS change is authorized. Automatic PR preview deployment alone was authorized separately.
