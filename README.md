# New Leadership Now - Washington edition

> Want this for your state? Fork it.

A small, static, MIT-licensed civic advocacy website for the 2026 Democratic congressional leadership elections. Not affiliated with Congress or any political party. No accounts, analytics, tracking pixels, or backend.

## Run

For a quick local check, open `index.html` in a browser. To host it, publish the folder to any static host (GitHub Pages, Vercel, Netlify, etc.) and keep `index.html`, `app.js`, `data.js`, and `LICENSE` together.

## Fork for your state

1. Update the `state`, `code`, `updated`, `officials`, and `sources` fields in `data.js`.
2. Verify each official's current term, direct phone number, official website/contact form, and public social handle against primary sources.
3. Update the Washington language in `index.html` and the sample drafts in `app.js`.
4. Do not portray officials who lack leadership ballots as voting members of a congressional caucus.
5. Test on a mobile browser and check the entire contact flow before sharing.

## Important limitations

- Contact forms generally cannot accept externally prefilled messages; the user must copy and submit the message on the official site.
- Clicking a contact link or copying text does not submit a message; completion is self-reported.
- Public social handles and directory URLs may change; verify before public launch.
- LocalStorage is browser/device-local and may be deleted by clearing site data. No sync across devices.
- Office contact forms often only accept constituents from within their district.
- The House caucus leadership election and the House-wide Speaker election are distinct votes.
- Election dates are subject to change. Roster researched November 9, 2026.

## Sources

See primary source links in `data.js`; the official Senate Washington page, House Democratic caucus membership page, Washington Democrats' executive committee page, and the governor's official contact site are linked there.

## License

MIT. See `LICENSE`.
