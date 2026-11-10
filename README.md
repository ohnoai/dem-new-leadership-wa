# DEM RESET · Washington

A mobile-first, static civic action site asking for new Democratic congressional leadership. Independent advocacy, not affiliated with government or a political party. MIT licensed. No accounts, analytics, tracking pixels, or application backend.

Want this for your state? Fork it.

## Run locally

Requires Node.js 22 or newer for development and tests.

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173. The preview server binds only to localhost. Opening `index.html` directly is not recommended: browser storage and clipboard behavior under `file:` URLs varies. Clipboard and native sharing require HTTPS or localhost.

## Action workflow

1. Choose an official. To find your House representative, open the state district finder, enter your full address there, choose Congressional, and select the resulting district back here.
2. Edit the recipient's letter, call script, or social post. The greeting and request match the recipient's role.
3. Copy the message and subject, then open the official contact page. Paste and submit on that site yourself. Phone links open the dialer; social sharing opens the device share sheet when available, or copies the post.
4. Mark the action complete yourself and move to the next official.

The Shared message disclosure edits the master for the selected letter version and identifies which master is active. The Letter version picker offers full and concise alternatives. Each version keeps its own shared and recipient-specific subject and message edits across switches and refreshes; switching never shortens or replaces the other version. Use shared draft removes only the current recipient's active-version letter/subject overrides, not the other version, calls, social posts, or completion. Read the full letter expands the entire message without truncation; the compact editor remains available when you want less page scrolling.

Subject and message counters are always shown in the letter editor. Recipient-specific warnings use only verified form limits; they never block editing, copying or opening a form, and never truncate text. Unknown limits are not treated as unlimited. See the dated [contact-form compatibility audit](docs/contact-forms.md) for required fields, address gates, evidence and inaccessible forms.

## State and privacy

Drafts save synchronously on each edit to a state-specific localStorage key. Completed actions use a separate key and are tracked per official and channel. Nothing is transmitted to an application server. Navigating to official sites does not mark an action complete. Progress is self-reported, not a submission counter; the header counts the three supported channels for every listed office, not a required checklist.

Prototype v2 letters and call scripts are migrated verbatim into personal versions for their chamber, shared social text into every recipient's social draft, and old completions into letter actions. Original browser data remains until explicitly erased. Migrated greetings are not rewritten: review them before sending. Migration is only for the Washington prototype.

Storage is device/browser/origin-local, may be unavailable, and can be cleared by the browser. The editor reports save failures and remains usable in memory. There is no cross-device sync. An older browser tab detects newer stored drafts and refuses to overwrite them; copy any unsaved changes, then reload to use the newer version. Concurrent edits are not merged automatically. Avoid editing in two tabs at once.

## Fork for another state

1. Replace `data.js`: state name/code, kickoff line, official district finder and map links, repository URL, officials, and primary sources. Keep stable unique official IDs. Include every House district so residents are never given a misleading missing-district result.
2. Each official supplies `id`, `name`, `office`, `group` (`senate`, `house`, `influence`), `district`, `party`, `vote` (`senate`, `house`, or explicit `null`), `greeting`, `phone`, `website`, and `social`. Leave unavailable phone/social values empty. A Republican House member has `vote: null` for Democratic caucus elections. State/party officials likewise have no caucus ballot.
3. Verify contact details and social identities against official pages. Use an official full-address geographic boundary finder, not a guessed ZIP mapping. Document evidence and any blocked verification in `docs/sources.md`.
4. Edit campaign language in `campaign.js`. This is the authoritative home for headings, draft priorities, role-specific requests, phone scripts and social templates. Do not put campaign-specific language into `app.js` or `model.js`.
5. Update the fallback title, description, noscript and state-finder text in `index.html` for non-JavaScript visitors. Replace the original geometric Washington evergreen in `assets/evergreen.svg` if your state calls for another signature detail. The Pressure palette and typography live in `styles.css`.
6. Adapt the Washington-specific test fixtures and run the verification commands below. Check all official roles and district entries. Keep the MIT license and the footer invitation.

No map/geocoder package or API key is needed. The user enters their address only on the official state site; this site does not collect it.

## Test

```sh
npx playwright install chromium
npm run check
git diff --check
```

Node tests cover the state model. Playwright tests cover the actual browser workflow at 375px, 430px and desktop widths, including clipboard, persistence, role-specific messages, and axe accessibility checks. Browser tests emulate mobile Chromium, not physical devices. See [verification and outstanding checks](docs/verification.md) for exact coverage and release limitations, and [source evidence](docs/sources.md) for contact research.

## Static hosting

No production build is needed. When deployment is authorized, publish only `index.html`, `styles.css`, `data.js`, `campaign.js`, `model.js`, `app.js`, `presentation.js`, the `assets/` directory, `LICENSE`, `README.md`, and the public `docs/` files together on an HTTPS static host. Do not publish the entire development checkout, local tooling configuration, `node_modules`, test results, or credentials. This revision does not deploy automatically. The prospective `demreset.com` domain is not assumed to be purchased or configured.

Barlow Condensed ExtraBold is self-hosted under the SIL Open Font License, retained in `assets/OFL-Barlow.txt`. The original evergreen artwork and application code retain this project's MIT license. No font service or third-party asset request is needed at runtime.

## Documentation

See [documentation index](docs/README.md) and [code map](docs/code-map.md).

## License

MIT. See [LICENSE](LICENSE).