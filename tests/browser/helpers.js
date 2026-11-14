const { expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const draftKey = 'leadership-wa-drafts-v3', actionKey = 'leadership-wa-actions-v3', legacyKey = 'new-leadership-wa-v2';

// From step 1 or 2, finish the steps and land on step 3 for a district (WA-01 by default: Murray, Cantwell, DelBene, Conrad, Ferguson).
async function toConsole(page, district = 'WA-01') {
  if (await page.locator('#s3').getAttribute('data-state') === 'active') return;
  if (await page.locator('#s1').getAttribute('data-state') === 'active') await page.locator('#done1').click();
  if (await page.locator('#pickOther').isVisible()) await page.locator('#pickOther').click();
  await page.locator(`#districtChoices [data-district="${district}"]`).click();
  await expect(page.locator('#s3')).toHaveAttribute('data-state', 'active');
}
const preview = page => page.locator('#preview');
async function channel(page, name) { await page.locator(`[data-channel="${name}"]`).click(); }
async function version(page, name) { await page.locator(`[data-version="${name}"]`).click(); }
// Move through your officials with the arrows until the named one is on screen.
async function goTo(page, name) {
  for (let i = 0; i < 8 && (await page.locator('#officialName').textContent()) !== name; i++) {
    const forward = await page.evaluate(n => { const names = [...document.querySelectorAll('#officialList li')].map(li => li.textContent.replace('✓ ', '')); return names.indexOf(n) > names.indexOf(document.getElementById('officialName').textContent); }, name);
    await page.locator(forward ? '#nextOfficial' : '#previousOfficial').click();
  }
  await expect(page.locator('#officialName')).toHaveText(name);
}
async function edit(page, { subject, body, reset } = {}) {
  await page.locator('#editText').click();
  await expect(page.locator('#editor')).toBeVisible();
  if (reset) await page.locator('#resetText').click();
  if (subject !== undefined) await page.locator('#editSubject').fill(subject);
  if (body !== undefined) await page.locator('#editBody').fill(body);
  await page.locator('#saveText').click();
  await expect(page.locator('#editor')).toBeHidden();
}
// Do what a visitor does before "I sent it!": open the official's form, phone or profile (the navigation itself is
// cancelled, so tests never reach an outside site), or copy when there is nothing to open. Then tap the button.
async function send(page) {
  if (await page.locator('#sent').getAttribute('aria-disabled') === 'true') {
    if (await page.locator('#contactLink').isVisible()) await page.locator('#contactLink').evaluate(a => { a.addEventListener('click', e => e.preventDefault(), { once: true }); a.click(); });
    else await page.locator('#copyText').click();
  }
  await page.locator('#sent').click();
}
async function erase(page) {
  await page.locator('#aboutLink').click();
  await page.locator('#erase').click();
  await page.locator('#confirmErase').click();
}
const stored = (page, key) => page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
const fits = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
async function axe(page) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
}
// The tip jar shows only on the hosts in campaign.js. Tests serve from 127.0.0.1, so list it for this page only.
async function allowTipsHere(page) {
  await page.route('**/campaign.js', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace("hosts: ['demreset.com'", "hosts: ['127.0.0.1', 'demreset.com'") });
  });
}

module.exports = { draftKey, actionKey, legacyKey, toConsole, send, preview, channel, version, goTo, edit, erase, stored, fits, axe, allowTipsHere };
