# Contact form audit

Audit date: **2026-11-10**. Coverage: **14 unique recipients**, programmatically checked against every recipient ID in `data.js` using the browser-audit artifacts `forms-a.json` and `forms-b.json`.

## Scope and status

- **Verified** means observed page text, DOM attributes, or specifically described browser behavior. It does not mean successful delivery.
- **Unverified** means the evidence does not establish the behavior or effective limit. **Inaccessible** means the form itself could not be reached.
- **User-reported** identifies firsthand evidence supplied by the repository owner, not independent browser verification. Report receipt dates are not claimed as dates of the owner's form visit.
- No messages, identity details, addresses, ZIP checks, wizard steps, or CAPTCHA challenges were submitted. **All server acceptance and server-side address verification remain untested.**
- Only Murray and Cantwell have confirmed trusted desktop clipboard paste with exact textarea readback. Other visible forms have synthetic paste probes only; an uncanceled synthetic event does not prove native clipboard paste works.
- An absent `maxlength` is not evidence of unlimited length. A missing separate subject control is different from a subject control with an unknown cap. Required fields below describe frontend markers or labels, not tested server requirements. Separate newsletter forms are excluded.

## Editorial upgrade report

The owner supplied additional observations on 2026-11-10: Randall and Smith also have user-confirmed 2,000-character thresholds. DelBene, Schrier, Strickland, Conrad and Ferguson had no limit observed during manual testing; this is not verified unlimited. Murray, Cantwell and Larsen remain unknown. These reports supplement the audit below, not replace it. Exact provenance is in [editorial verification](editorial-verification.md#contact-limit-provenance-supplied-with-this-request). Newhouse and Baumgartner are retained for district discovery and historical evidence only, not active campaign outreach.

## Recipient findings

### Patty Murray (`murray`)

**Checked: 2026-11-10.** Official form inspected.[1]

- **Limits: unverified.** Visible message and subject controls have no `maxlength`; effective caps unknown. No visible message counter observed.
- **Required fields: verified.** First name, last name, address 1, city, state, ZIP, email, topic, subject, message. Address 2 and phone are optional.
- **Address verification: unverified.** Message visible without a prior address gate; required address fields do not establish residency validation.
- **Paste: verified, desktop only.** Trusted Control+V inserted the multiline clipboard probe with exact readback. Clipboard refresh failed because the document lacked focus, but the existing clipboard pasted successfully.
- **Obstacles:** No additional gate observed on the visible form; submission behavior untested.

### Maria Cantwell (`cantwell`)

**Checked: 2026-11-10.** Contact entry and full form inspected.[2][3]

- **Limits: unverified.** Message and subject have no `maxlength`; effective caps unknown. No visible counter observed.
- **Required fields: verified.** First/last name, street, city, state, ZIP, phone, email, verify email, topic, subject, message, based on labels and validator classes. Military branch/rank and ecclesiastical title are conditionally marked required; these controls were initially hidden.
- **Address verification: unverified.** Message visible without a prior address gate; server checks not exercised.
- **Paste: verified, desktop only.** Trusted Control+V produced exact multiline textarea readback. Clipboard refresh reported lack of document focus; the retained clipboard still pasted.
- **Obstacles: verified.** Delayed initialization and a legacy event implementation interfered with the audit helper. This is not evidence of a user-facing paste block.

### Suzan DelBene (`delbene`)

**Checked: 2026-11-10.** Contact page reached the ZIP gate.[4]

- **Limits: unverified.** Message/subject controls and counters were not reached. The gate's ZIP `maxlength="5"` is not a message limit.
- **Required fields: unverified downstream.** ZIP entry is requested, but the gate input has no native required marker. Newsletter email requirements do not describe this contact form.
- **Address gate: verified.** “I value all feedback from residents of my district. Please enter your zip code below to continue.” No ZIP supplied; actual validation unverified.
- **Paste: unverified.** Message field unavailable before the gate. **Obstacle: verified** ZIP gate prevents downstream inspection.

### Rick Larsen (`larsen`)

**Checked: 2026-11-10.** Contact entry and opinion route inspected.[5][6]

- **Limits: unverified.** Message/subject controls and counters not reached. ZIP inputs have `maxlength="5"` and `maxlength="4"`, not message limits.
- **Required fields: unverified downstream.** ZIP and +4 controls lack native required attributes; whether +4 is mandatory is unverified.
- **Address gate: verified.** “Please enter your zip code below to share your opinion on an issue.” The page directs users to USPS for an unknown +4. No gate submission; actual validation unverified.
- **Paste: unverified.** Message field unavailable. **Obstacle: verified** ZIP/+4 gate.

### Marie Gluesenkamp Perez (`perez`)

**Checked: 2026-11-10.** Address gate and already-present hidden form configuration inspected without revealing or bypassing the gate.[7]

- **Limits: unverified.** Hidden message/subject DOM has no `maxlength`; public message configuration records `maxLength: null`. Neither establishes an effective cap. Counter behavior not reached.
- **Message threshold: user-reported, 2,000 characters.** On 2026-11-10 the repository owner reported personally encountering this limit on the official contact form.[7] Source of the observation: PR #5 review-follow-up instructions, not the DOM audit. Independent verification remains blocked by the address gate; newline/Unicode counting and server enforcement remain unverified. DEM RESET displays a clearly labeled advisory counter and over-threshold warning without limiting input, copying or navigation.
- **Earlier draft decision:** Before the editorial upgrade, the concise/full defaults were 495/976 UTF-16 units. The subsequently approved editorial overhaul replaces new-user defaults with the category budgets in [editorial upgrade](editorial-upgrade.md), while preserving saved text. Both versions remain editable and independently saved.
- **Required fields: verified in DOM/configuration.** District address, topic, subject line, message, prefix, first/last name, email. Downstream controls were hidden; phone and phone type were optional. This does not verify the completed workflow.
- **Address gate: verified.** “House rules say we can only serve our own district's residents.” Full-address autocomplete is required. Actual verification untested.
- **Paste: unverified.** No visible message field to probe. **Obstacles: verified** district gate and a notice directing Pacific County residents with address-verification trouble to call (360) 695-6292.
- **CAPTCHA: unverified.** Artifact notes claim configuration is present, while the captured form configuration says `captchaConfigured: false`; neither proves an active challenge.

### Dan Newhouse (`newhouse`)

**Checked: 2026-11-10.** Contact route redirected to address authentication.[8][9]

- **Limits: unverified.** Message/subject controls and counters unavailable behind the gate. Street/city `maxlength="128"` values are not message limits.
- **Required fields: verified at gate only.** Street and city required; state marked required but initially disabled. Downstream requirements unverified.
- **Address gate: verified.** “Address as entered must be recognized by the United States Postal Service (USPS) as a valid address in their database.” Actual verification untested.
- **Paste: unverified.** Message field unavailable. **Obstacles: verified** residency gate and address-format instructions: “Please do not use special characters such as #, @, or any other non-alphanumeric symbols, except for periods (.), commas (,), dashes (-), and slashes (/).” Instructions recommend unit, apt or apartment for unit numbers; enforcement was not tested.

### Michael Baumgartner (`baumgartner`)

**Checked: 2026-11-10.** Contact entry and message form inspected.[10][11]

- **Message limit: verified, frontend only, 2,000.** DOM `maxlength="2000"`; browser text insertion requesting 2,001 ASCII characters retained 2,000. Server acceptance untested.
- **Counter: verified.** Initially “0 of 2000 max characters”; at the ASCII boundary, “2000 of 2000 max characters”. Observed counting uses UTF-16 units with each newline counted as two, consistent with CRLF: `abc` counted 3, `a\nb` counted 4, and one supplementary-plane emoji counted 2. This does not establish server counting or multiline boundary acceptance.
- **Subject: verified absent as a separate free-text field.** An issue dropdown is present instead; do not interpret this as an unknown free-text subject cap.
- **Required fields: verified via `aria-required`.** First/last name, street, city, state, ZIP, email, phone, issue, message, response preference.
- **Address verification: unverified.** Full message form visible without a prior address gate.
- **Paste: unverified for trusted desktop use in this report.** Synthetic event was not canceled; no inline paste handler observed. Long input can encounter the verified frontend cap. No additional gate observed.

Exact observed opening tag:

```html
<textarea name="input_10" id="input_6_10" class="textarea large" maxlength="2000" aria-required="true" aria-invalid="false" rows="10" cols="50">
```

### Emily Randall (`randall`)

**Checked: 2026-11-10.** Contact entry and address-authentication route inspected.[12][13]

- **Limits: unverified.** Message/subject controls and counters unavailable; address/search length attributes are not message limits.
- **Required fields: verified at gate only.** Street and city required; state marked required but disabled with Washington selected. Address line 2 optional; downstream fields unverified.
- **Address gate: verified.** “Please enter your address to verify residency within the district and click "Go to the Next step" when complete.” Also: “Address as entered must be recognized by the United States Postal Service (USPS) as a valid address in their database.” Actual verification untested.
- **Paste: unverified.** Message field unavailable. **Obstacle: verified** address gate; no next-step submission.

### Pramila Jayapal (`jayapal`)

**Checked: 2026-11-10.** Contact landing page and separate email route inspected.[14][15]

- **Limits: verified, frontend only.** Message `maxlength="2000"`; subject `maxlength="400"`. These are DOM limits, not verified server acceptance. Counter behavior unverified.
- **Required fields: verified via `aria-required` and validation classes.** Prefix, first/last name, street, city, state, ZIP, email, phone, issue, subject, message, response preference. Prefix is marked required despite lacking a visible asterisk.
- **Address gate: verified on the email route.** ZIP required, +4 optional. The contact landing page independently displays a full message form without passing that gate. Server district enforcement unverified.
- **Paste: unverified for native clipboard use.** Synthetic events on message/subject were not canceled; neither had an inline paste handler. **Obstacles: verified** route-dependent ZIP gate and frontend length attributes that can constrain long pasted drafts.

Exact observed limit controls:

```html
<textarea cols="40" rows="10" maxlength="2000" class="wpcf7-form-control wpcf7-textarea wpcf7-validates-as-required form-control" id="message" aria-required="true" aria-invalid="false" name="message"></textarea>
<input size="40" maxlength="400" class="wpcf7-form-control wpcf7-text wpcf7-validates-as-required form-control" id="subject" aria-required="true" aria-invalid="false" value="" type="text" name="subject">
```

### Kim Schrier (`schrier`)

**Checked: 2026-11-10.** Contact entry and address-authentication route inspected.[16][17]

- **Limits: unverified.** Message/subject controls and counters unavailable behind the gate; address/search length attributes are not message limits.
- **Required fields: verified at gate only.** Street and city required; state marked required but disabled with Washington selected. Address line 2 optional; downstream fields unverified.
- **Address gate: verified.** “Please enter your address to verify residency within the district and click "Go to the Next step" when complete.” Also: “Address as entered must be recognized by the United States Postal Service (USPS) as a valid address in their database.” Actual verification untested.
- **Paste: unverified.** Message field unavailable. **Obstacle: verified** address gate; no next-step submission.

### Adam Smith (`smith`)

**Checked: 2026-11-10.** Contact entry and first email-form wizard page inspected.[18][19]

- **Limits: unverified.** Message/subject controls and counters not reached. Name-field length attributes are not message limits.
- **Required fields: verified on page 1 only.** Prefix, first name, last name. Middle initial and suffix optional. Downstream requirements unverified.
- **Address verification: unverified.** Later wizard steps were not reached.
- **Paste: unverified.** No message field on the inspected step. **Obstacles: verified** four-page wizard and CAPTCHA notice: “CAPTCHA: enabled to secure this form.” The “Next Page” control submits a step and was not clicked. Actual CAPTCHA challenge behavior untested.

### Marilyn Strickland (`strickland`)

**Checked: 2026-11-10.** Visible contact form inspected.[20]

- **Message limit: unverified.** Verified absence of a `maxlength` attribute, not unlimited length. Counter behavior unverified.
- **Subject: verified absent as a separate field** on the inspected form; not an unknown cap on an existing subject input.
- **Required fields: verified via `aria-required`.** First/last name, street, city, state/region, ZIP, email, phone, phone type, response preference. Message lacks native/ARIA required markers; server requirement unverified.
- **Address verification: unverified.** Address and message appear together; no prior address gate observed.
- **Paste: unverified for native clipboard use.** Synthetic paste was not canceled; no inline handler, readonly or disabled marker observed. No positive paste-blocking evidence or additional gate observed; server behavior untested.

### Shasti Conrad (`conrad`)

**Checked: 2026-11-10.** Shared Washington Democrats contact URL, not a verified direct personal form.[21]

- **Access: inaccessible.** Cloudflare security interstitial persisted after an ordinary revisit and wait: “Performing security verification”. It also stated: “This website uses a security service to protect against malicious bots. This page is displayed while the website verifies you are not a bot.”
- **Message/subject limits, required fields, address verification, paste and counters: inaccessible.** Contact form DOM not reached; no assumptions from other forms or older snapshots.
- **Obstacle: verified** security interstitial. No challenge interaction or bypass attempted.

### Bob Ferguson (`ferguson`)

**Checked: 2026-11-10.** Official contact entry, e-message page and its linked IQConnect iframe inspected.[22][23][24]

- **Message limit: unverified.** Visible textarea has no `maxlength`; effective cap and counter behavior unknown.
- **Subject control: verified dropdown**, not a free-text subject. A free-text subject length cap is therefore not applicable to the observed control.
- **Required fields: verified via labels and `data-required`.** First/last name, email, phone, street, city, state, ZIP, subject category, message.
- **Address verification: unverified.** Message and address visible together without a prior gate; server checks untested.
- **Paste: unverified for native clipboard use.** Synthetic paste was not canceled; no inline paste handler, readonly or disabled marker observed. Official iframe is a workflow dependency, not evidence of a paste block.
- **Notices: verified.** The official page permits “N/A” or similar when uncomfortable completing a required field, but acceptance was not tested. It warns that correspondence is subject to public disclosure under the Washington State Public Records Act (RCW 42.56).

## Sources

[1] https://www.murray.senate.gov/write-to-patty - murray
[2] https://www.cantwell.senate.gov/contact/email - cantwell
[3] https://www.cantwell.senate.gov/contact/email/form - cantwell
[4] https://delbene.house.gov/contact - delbene
[5] https://larsen.house.gov/contact - larsen
[6] https://larsen.house.gov/contact/opinions.htm - larsen
[7] https://gluesenkampperez.house.gov/contact - perez
[8] https://newhouse.house.gov/contact - newhouse
[9] https://newhouse.house.gov/address_authentication?form=/contact - newhouse
[10] https://baumgartner.house.gov/contact - baumgartner
[11] https://baumgartner.house.gov/contact/email-me - baumgartner
[12] https://randall.house.gov/contact - randall
[13] https://randall.house.gov/address_authentication?form=/contact/email-me - randall
[14] https://jayapal.house.gov/contact - jayapal
[15] https://jayapal.house.gov/contact/email - jayapal
[16] https://schrier.house.gov/contact - schrier
[17] https://schrier.house.gov/address_authentication?form=/contact/email-me - schrier
[18] https://adamsmith.house.gov/contact - smith
[19] https://adamsmith.house.gov/contact/email-me - smith
[20] https://strickland.house.gov/contact - strickland
[21] https://wadems.org/contact - conrad
[22] https://governor.wa.gov/contacting-governor - ferguson
[23] https://governor.wa.gov/contacting-governor/contacting-governors-office/send-gov-ferguson-e-message - ferguson
[24] https://iqconnect.governor.wa.gov/iqextranet/EForm.aspx?__cid=FSL_WA_GOV&__fid=100110&iframe=Y - ferguson
