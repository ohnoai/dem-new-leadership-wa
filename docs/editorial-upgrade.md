# Editorial and personalization upgrade

## Rendered character budgets

Counts include the actual greeting, blank lines, `Thank you,`, and name/location placeholders, with every line break counted as CRLF (two UTF-16 units). Subjects are separate. These are unpersonalized defaults, not caps on user edits. The browser tests render all twelve active recipients through `ActionModel.draft`, not just the source bodies.

| Category | Longest actual greeting | Full | Concise | Remaining before 2,000, full |
|---|---|---:|---:|---:|
| Senate Democrats | Dear Senator Cantwell, | 1,569 | 875 | 431 |
| House Democrats | Dear Representative Gluesenkamp Perez, | 1,587 | 880 | 413 |
| Washington Democratic leadership | Dear Governor Ferguson, | 1,594 | 891 | 406 |

Every full default is between 1,500 and 1,700 CRLF units; every concise default is between 700 and 900. Across actual greetings, full/concise ranges are Senate 1,567-1,569 / 873-875, House 1,575-1,587 / 868-880, and state/party 1,589-1,594 / 886-891. Every full default leaves at least 406 characters before 2,000. Personal details and user edits can increase those counts. Recipient counters retain their observed counting conventions, with verified frontend limits distinct from user-reported advisory thresholds. Nothing truncates typed or copied text. Dated election evidence and contact-report provenance are in [editorial verification](editorial-verification.md).

## Preservation evidence

`tests/browser/editorial-upgrade.spec.js` seeds the previous v3 record with exact full/concise overrides, manual signatures, shared masters, calls, social posts and inactive Republican drafts. It changes personal details, refreshes, and asserts saved personal/shared records remain exact. A separate case seeds v2 House text, calls, social and Republican completions, then confirms those records migrate without becoming selectable targets or entering campaign progress.

The existing migration-review, storage-denial, stale-tab, clipboard, recipient-reset, cross-tab erase and independent-version suites remain in place. Tests that previously selected Republican advocacy targets now exercise inactive preservation and district redirection instead. CRLF counting still has a verified-rule fixture without exposing an inactive office as an advocacy target.

Independent review reproduced three edge cases and prompted regressions: prefix/suffix edits to a managed signature now detach that identity field; shared-subject-only changes leave untouched message identity managed; and the forced cross-tab erase signal clears unsaved identity even when the drafts record never existed. The complete check run after these fixes passed 20 Node tests and 195 browser tests. Dependency audit found zero vulnerabilities.

The template/identity/override strategy is documented once in [development](development.md#drafts-and-progress). Old shared drafts intentionally retain their old arguments and cross-category behavior, rather than being overwritten by the new defaults. Users may keep editing them. A user-written signature is not automatically rewritten when details change.

## Review evidence

Local review screenshots show the optional details disclosure and a personalized letter at 320, 375, 430 and 1440 CSS pixels. Screenshot identities are test fixtures, not real constituent data. Mobile emulation is not physical-device verification. Browser checks include expanded details, keyboard order and axe WCAG A/AA scans. No contact form was submitted, call placed or social post published.

## Before launch

- Human editorial approval of the trimmed full and concise letters, calls and posts.
- Recheck election and caucus schedules immediately before launch; see the dated verification record.
- Physical iOS/Android testing, browser autofill and native keyboards, VoiceOver/TalkBack and desktop screen readers.
- Native share-sheet operation on a real device. Automated tests stub the device API and verify payload/cancellation only.
- Real external-form paste and acceptance, address verification and CAPTCHA behavior. No-limit-observed reports do not establish unlimited or server-accepted input.
- Browser-process restart and private-mode persistence checks. Automated refresh/new-tab tests exercise the same origin, not an actual browser restart.
- Hosting/privacy review when deployment is separately authorized. No domain, deployment or publishing action is part of this change.
