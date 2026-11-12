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

Node tests cover the state model, preview server and fork safety (payment details only in `campaign.js`, ZIP data integrity). Playwright covers the three steps, clipboard, persistence, storage failures, migration, the tip jar (with every outside service mocked) and axe accessibility at 375px, 430px and desktop widths, plus 320 to 1920px in `layout.spec.js`. The owner's design requirements are pinned in the `requirement guards` group of `flow.spec.js`. Mobile emulation is not physical-device testing. The [verification record](verification.md) lists executed checks and outstanding release work. Use an isolated Playwright output directory if another runner is active.

The [code map](code-map.md) explains the application files. Campaign text belongs in `campaign.js`; state-specific contacts and form evidence belong in `data.js`. See [adapting for another state](adapting.md) before changing the roster.

## Drafts and progress

The page is three steps. Step 1 holds the optional details. Step 2 suggests a district from the ZIP code (`districts.js`) and always links the official full-address finder. Step 3 shows one official at a time from the visitor's own list: both senators, their House member if a Democrat, then state leadership. A saved district opens the page at step 3. Edits happen in a dialog. Each version (full or concise) keeps separate recipient-specific subject and message fields; a personal edit leaves other recipients untouched. Reset to original removes only the active recipient's overrides for the active channel and version, not the other version, other channels or progress. Shared drafts saved by the previous interface still apply to letters (with their old cross-category behavior and exact strings) but can no longer be edited.

Optional name, city, county and ZIP live in `state.details` inside the existing drafts record, sharing its stale-tab guard and erase boundary. Generated templates substitute only managed identity tokens. After a recipient edit, `state.bindings` records positions of untouched managed tokens in the stored template, not identity values. Edits overlapping a managed span detach it so manual signatures win. Unchanged spans move with surrounding prose. Old personal overrides and user-authored shared text are opaque: token-like quotations are not searched and replaced. A whole-field paste can detach several spans; it never authorizes rewriting user prose. Social defaults do not use personal details. A successful erase in another tab clears in-memory identity and drafts before later saves can resurrect them.

Drafts save synchronously on each edit to a state-specific localStorage key. Completed actions use a separate key, per official and channel; "I sent it" records the channel on screen. The header counts officials on the visitor's list with at least one completed channel. Inactive Republican recipients remain in district choices and retained storage, but never on the list or in progress. Opening an official page or copying does not mark anything complete. A save message appears only when saving fails or another tab has newer drafts.

Prototype v2 letters and call scripts migrate verbatim into personal versions for their chamber. Shared social text migrates to every recipient, and old completions become letter actions. Original browser data remains until explicitly erased. Imported greetings are not rewritten; the recipient-review step must be completed before outreach. Migration applies only to the Washington prototype.

Storage is local to the device, browser and origin. It can be unavailable or cleared; there is no cross-device sync. Save failures leave the editor usable in memory, but users must copy their work elsewhere. A stale tab refuses to overwrite newer stored drafts and asks the user to copy local edits before reloading. Concurrent edits are not merged. Use one editing tab at a time; localStorage writes across multiple keys are not transactional.

Text is never truncated. A warning appears only when edited text passes a verified cap or a user-reported advisory, and says which it is. Unknown limits do not mean unlimited. Copy subject is hidden for audited absent/category controls without deleting drafts. The user selects any external issue/category themselves. Keep the [contact-form audit](contact-forms.md) current rather than inferring restrictions from other offices.

## Share links and tip jar

Share links use each network's public web-intent format, checked 2026-11-11: Bluesky (docs.bsky.app intent links), Threads (Meta web intents, including `tag`), X, Facebook and WhatsApp (endpoints resolve with parameters intact). Reddit and Snapchat's plain scan link are unverified; Snapchat's official button needs Snap's third-party script and was rejected for privacy. Instagram and TikTok have no web share link and are left out.

The tip jar (`tips.js`) does nothing unless `campaign.js` has `tips` and the page is on one of `tips.hosts`. It contacts no outside site until a visitor opens a payment option: the Ko-fi form loads in a frame only after the Ko-fi button is tapped, and the Lightning address lookup, invoices and BTC/USD price are requested only after the Lightning button is tapped. Invoices are made from the chosen dollar amount at the price of the moment. The page cannot tell when a scanned invoice is paid; only a browser-wallet (WebLN) payment is confirmed on screen.

## Hosting and assets

To regenerate [the social-preview image](../assets/social-preview.png), run `node scripts/capture-social-preview.js`. It renders the approved split-field placard in `scripts/social-preview.html`, independently of the website, using the local font and evergreen at 1280 × 640. No preview server is required. Review the generated PNG at full and 50% scale before committing it. The Open Graph image URL targets the intended demreset.com host; preparing the image does not publish the site or update GitHub's social-preview setting.

No production build is needed. When deployment is authorized, publish only `index.html`, `styles.css`, `data.js`, `campaign.js`, `districts.js`, `icons.js`, `model.js`, `app.js`, `tips.js`, `confetti.js`, `vendor/`, `assets/`, `LICENSE`, `README.md` and public `docs/` together on an HTTPS static host. Do not publish the development checkout, `node_modules`, test results, credentials or private configuration. No deployment is authorized by these instructions.

The owner has registered demreset.com. It is the intended public address, not a confirmed deployment: a local HTTPS check on 2026-11-10 failed DNS resolution. Recheck before announcing availability.

Barlow Condensed ExtraBold is self-hosted under the SIL Open Font License in [assets/OFL-Barlow.txt](../assets/OFL-Barlow.txt). Keep that license with the font. The original geometric evergreen and application code retain the project's [MIT license](../LICENSE). Runtime font loading does not contact an external service.
