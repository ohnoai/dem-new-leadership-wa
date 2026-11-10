# Bring DEM RESET to another state

Fork the repository and replace Washington's information with your own. The application is static and does not need a map service, API key or backend. Keep addresses on official district-finder sites rather than collecting them here.

## Contacts and district discovery

Start with `data.js`. Replace the state name and code, kickoff line, repository URL, official district finder and map links, official roster and primary sources. Use stable, unique recipient IDs. Include every House district, regardless of party, so nobody gets a misleading missing-district result.

Each official supplies `id`, `name`, `office`, `group` (`senate`, `house`, `influence`), `district`, `party`, `vote` (`senate`, `house`, or explicit `null`), `greeting`, `phone`, `website` and `social`. An explicit greeting handles compound surnames and titles. Leave unavailable phone/social values empty. A Republican House member has `vote: null` for Democratic caucus elections and `active: false` for this campaign. The Washington configuration derives activity from party. Retain inactive officials for district discovery and saved history without presenting advocacy actions. State and party officials likewise have influence, not a congressional caucus ballot.

Verify numbers, contact URLs and social identities against official pages. Use an official full-address geographic boundary finder, not a guessed ZIP-to-district map. Record source URLs, dates and blocked checks in your source documentation. Washington's evidence is in [sources.md](sources.md); do not present it as evidence for a different state.

Audit each contact form before assigning a limit. The current `forms` metadata maps recipient IDs to notes and optional subject/message rules. Numeric rules carry a `status`, `limit`, date and source. Independently observed caps use `verified`; firsthand reports use `user-reported` and display as advisories. Missing or unknown limits must not be invented. Subject controls may be verified `category` or `absent`; that is different from an unknown free-text cap. Include helpful external-form instructions. See [the form audit](contact-forms.md) for the evidence standard and counting limitations.

## Campaign and presentation

Edit `campaign.js` for headings, category-specific `letters`, `concise.letters`, `calls` and `posts`. The old shared/request fields remain as compatibility content for retained v3 drafts, not the new editorial defaults. Keep campaign language out of reusable `app.js` and `model.js`. A message to an indirect-influence official must not imply that official casts a caucus leadership vote. See [editorial verification](editorial-verification.md) for dated election evidence; reverify it for any new campaign.

Update `index.html`'s fallback title, description, noscript and state-finder text for non-JavaScript visitors. Replace the original Washington evergreen in `assets/evergreen.svg` if another mark suits your state. The Pressure palette and typography live in `styles.css`. Retain the bundled font's license if you use it.

Adapt Washington-specific test fixtures and use the [development commands](development.md). Check every role, district, greeting and contact route. Preserve draft storage, independent completions, accessible controls and the distinction between preparing a message and sending it. Keep the MIT license and the footer: "Want this for your state? Fork it."
