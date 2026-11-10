# DEM RESET

Democrats need a reset. Replace Chuck Schumer and Hakeem Jeffries as Democratic congressional leaders, and ask Washington's delegation to back the change.

Working people deserve leaders willing to defend public services and civil rights, challenge wealthy donors, and answer to the people they represent. DEM RESET helps Washington residents make that demand directly to elected officials.

[demreset.com](https://demreset.com) is the campaign's intended home. The domain is registered, but the site is not confirmed live yet. You can run it locally with the instructions below.

## Make your case

Choose an official, or find your House representative through the official district finder. Review the prepared letter and make it yours. Copy the message, open the official contact page, and send it there yourself. You can also use the call script or prepare a social post.

The site distinguishes officials who vote in Democratic leadership elections from those who can use their influence. Full and concise letters keep separate edits. Your drafts survive recipient changes, and you mark completed actions yourself. Opening a contact page never counts as sending a message.

Some offices require address checks or limit message length. The [contact-form audit](docs/contact-forms.md) records what was observed, what was reported by a user, and what remains unknown.

## Independence and privacy

DEM RESET is independent advocacy, not a government website or a political party project. You do not need an account. The site has no analytics or tracking pixels, and your drafts and action history stay in this browser.

Browser storage is not a backup: clearing it can erase your work, and drafts do not sync between devices. Official contact forms and social platforms have their own privacy rules. Nothing is sent or published without your action.

## Want this for your state? Fork it.

The campaign copy and Washington contacts are separate from the application logic. Replace them with your state's officials and verified contact information, keep the distinction between votes and influence, and make the campaign your own. The [state adaptation guide](docs/adapting.md) explains what to change and check.

## Work on the site

Use Node.js 22 or newer, then run:

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173. The [development guide](docs/development.md) covers tests, draft storage and hosting. The [documentation index](docs/README.md) links to the code map, source research and [remaining release checks](docs/verification.md).

## License

[MIT](LICENSE). The bundled Barlow Condensed font uses the [SIL Open Font License](assets/OFL-Barlow.txt).