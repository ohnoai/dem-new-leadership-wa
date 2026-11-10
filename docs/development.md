# Working on DEM RESET

## Local preview and tests

Use Node.js 22 or newer:

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173. The preview server binds only to localhost. Avoid opening `index.html` directly: browser storage and clipboard behavior under `file:` URLs varies. Clipboard and native sharing require HTTPS or localhost.

```sh
npx playwright install chromium
npm run check
npm audit
git diff --check
```

Node tests cover the state model and preview server. Playwright covers clipboard, persistence, recipient requests and axe accessibility at 375px, 430px and desktop widths. Mobile emulation is not physical-device testing. The [verification record](verification.md) lists executed checks and outstanding release work. Use an isolated Playwright output directory if another runner is active.

The [code map](code-map.md) explains the application files. Campaign text belongs in `campaign.js`; state-specific contacts and form evidence belong in `data.js`. See [adapting for another state](adapting.md) before changing the roster.

## Drafts and progress

The Shared message disclosure edits the master for the selected full or concise version. Each version has separate shared and recipient-specific subject and message fields. A personal edit leaves the master and other recipients untouched. Use shared draft removes only the active recipient/version's letter and subject overrides, not the other version, calls, social posts or completion. Full-letter expansion changes the editor's height, not its text.

Drafts save synchronously on each edit to a state-specific localStorage key. Completed actions use a separate key, per official and channel. The header counts three supported channels per office; it is not a required checklist. Opening an official page, copying or closing a share dialog does not mark anything complete.

Prototype v2 letters and call scripts migrate verbatim into personal versions for their chamber. Shared social text migrates to every recipient, and old completions become letter actions. Original browser data remains until explicitly erased. Imported greetings are not rewritten; the recipient-review step must be completed before outreach. Migration applies only to the Washington prototype.

Storage is local to the device, browser and origin. It can be unavailable or cleared; there is no cross-device sync. Save failures leave the editor usable in memory, but users must copy their work elsewhere. A stale tab refuses to overwrite newer stored drafts and asks the user to copy local edits before reloading. Concurrent edits are not merged. Use one editing tab at a time; localStorage writes across multiple keys are not transactional.

Subject and message counters never truncate text. Verified caps and user-reported advisories are separate evidence types. Unknown limits do not mean unlimited. Copy subject is hidden for audited absent/category controls without deleting drafts. The user selects any external issue/category themselves. Keep the [contact-form audit](contact-forms.md) current rather than inferring restrictions from other offices.

## Hosting and assets

To regenerate [the social-preview image](../assets/social-preview.png), leave `npm start` running and run `node scripts/capture-social-preview.js` in another terminal. The capture uses the live hero, local font and evergreen at 1280 × 640, with interaction-only controls hidden on the capture page. Review the generated PNG before committing it. The Open Graph image URL targets the intended demreset.com host; preparing the image does not publish the site or update GitHub's social-preview setting.

No production build is needed. When deployment is authorized, publish only `index.html`, `styles.css`, `data.js`, `campaign.js`, `model.js`, `app.js`, `presentation.js`, `assets/`, `LICENSE`, `README.md` and public `docs/` together on an HTTPS static host. Do not publish the development checkout, `node_modules`, test results, credentials or private configuration. No deployment is authorized by these instructions.

The owner has registered demreset.com. It is the intended public address, not a confirmed deployment: a local HTTPS check on 2026-11-10 failed DNS resolution. Recheck before announcing availability.

Barlow Condensed ExtraBold is self-hosted under the SIL Open Font License in [assets/OFL-Barlow.txt](../assets/OFL-Barlow.txt). Keep that license with the font. The original geometric evergreen and application code retain the project's [MIT license](../LICENSE). Runtime font loading does not contact an external service.
