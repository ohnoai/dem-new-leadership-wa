# Code map

The public application is a static site.

| Path | Role |
| --- | --- |
| `index.html` | Page structure and interface |
| `app.js` | Client-side behavior, drafts, and progress |
| `model.js` | Pure draft state, restoration, and recipient overrides |
| `data.js` | Washington officials and reference data |
| `campaign.js` | Editable campaign language and role-specific requests |
| `styles.css` | Mobile-first presentation and Washington visual identity |
| `presentation.js` | Full-letter expansion without changing draft state |
| `assets/` | Original evergreen, self-hosted headline font and font license |
| `scripts/serve.js` | Local-only development preview server |
| `tests/` | Node model tests and Playwright browser/accessibility tests |
| `playwright.config.js` | Mobile and desktop browser test configurations |
| `docs/sources.md` | Primary-source contact and district research |
| `docs/verification.md` | Executed verification and outstanding checks |
| `README.md` | Setup and state-forking instructions |
| `LICENSE` | MIT license |

Update this map when the public application structure changes.
