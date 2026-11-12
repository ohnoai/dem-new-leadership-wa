const { test, expect } = require('@playwright/test');
const { toConsole, preview, channel, version, goTo, edit, stored, draftKey, actionKey, axe } = require('./helpers');

// Drafts from the first prototype (new-leadership-wa-v2) and from the previous interface (v3) must survive exactly.
// Seed localStorage once per test (not again on reload). Values are stored as JSON.
const once = (page, items) => page.addInitScript(items => {
  if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
  for (const [key, value] of Object.entries(items)) localStorage.setItem(key, JSON.stringify(value));
}, items);
const LEGACY = 'new-leadership-wa-v2', DRAFTS = 'leadership-wa-drafts-v3', ACTIONS = 'leadership-wa-actions-v3';

test('imported text is kept exactly but must be reviewed before copying or opening the form', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const original = 'Dear Senator Cantwell,\n\nMy exact older message.';
  await once(page, { [LEGACY]: { drafts: { senate: { subject: 'Original subject', message: original } } } });
  await page.goto('/'); await toConsole(page);
  await expect(preview(page)).toHaveText(original);
  await expect(page.locator('#recipientReview')).toContainText('Patty Murray');
  await page.click('#copyText');
  await expect(page.locator('#feedback')).toContainText('Review');
  expect(await page.locator('#contactLink').evaluate(el => !el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))).toBe(true);
  await page.check('#reviewedRecipient');
  await page.click('#copyText');
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(original);
  await goTo(page, 'Maria Cantwell');
  await expect(page.locator('#reviewedRecipient')).not.toBeChecked();
  await expect(page.locator('#recipientReview')).toContainText('Maria Cantwell');
  await axe(page);
  await goTo(page, 'Patty Murray');
  await expect(page.locator('#reviewedRecipient')).toBeChecked();
  await page.reload();
  await expect(page.locator('#reviewedRecipient')).toBeChecked();
  await edit(page, { body: original + ' Edited' });
  await expect(page.locator('#reviewedRecipient')).not.toBeChecked();
});

test('imported call and post need their own review', async ({ page }) => {
  await once(page, { [LEGACY]: { callScript: { senate: 'Call for Cantwell' }, social: 'Post for Cantwell' } });
  await page.goto('/'); await toConsole(page); await channel(page, 'call');
  await expect(preview(page)).toHaveText('Call for Cantwell');
  expect(await page.locator('#contactLink').evaluate(el => !el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))).toBe(true);
  await page.check('#reviewedRecipient');
  await channel(page, 'social');
  await expect(page.locator('#reviewedRecipient')).not.toBeChecked();
  await page.click('#copyText');
  await expect(page.locator('#feedback')).toContainText('Review');
  await expect(preview(page)).toHaveText('Post for Cantwell');
});

test('already migrated v3 text is flagged without being rewritten', async ({ page }) => {
  await once(page, { [LEGACY]: { drafts: { senate: { message: 'Dear Senator Cantwell, old text' } } }, [DRAFTS]: { district: 'WA-01', personal: { murray: { message: 'Dear Senator Cantwell, old text' } }, selected: 'murray' } });
  await page.goto('/');
  await expect(page.locator('#recipientReview')).toBeVisible();
  await expect(preview(page)).toHaveText('Dear Senator Cantwell, old text');
});

test('prototype drafts, calls, posts and progress carry over for every relevant official', async ({ page }) => {
  const legacy = {
    drafts: { senate: { subject: 'My original subject', message: 'My original Senate message' }, house: { subject: 'House subject', message: 'My House message' } },
    callScript: { senate: 'My Senate call\n[official] - keep this greeting!  ', house: 'My House call\n[request] - unchanged.  ' },
    social: 'My shared post\n[handle] - exact text!  ', progress: { murray: true, newhouse: true }
  };
  await once(page, { [LEGACY]: legacy });
  await page.goto('/');
  const personal = (await stored(page, draftKey)).personal;
  for (const o of await page.evaluate(() => window.CAMPAIGN.officials)) {
    if (o.group === 'influence') { expect(personal[o.id]).not.toHaveProperty('call'); expect(personal[o.id].social).toBe(legacy.social); continue; }
    expect(personal[o.id]).toMatchObject({ message: legacy.drafts[o.group].message, call: legacy.callScript[o.group], social: legacy.social });
  }
  // Republican offices keep their history but never become targets.
  expect(await stored(page, actionKey)).toMatchObject({ 'murray:letter': true, 'newhouse:letter': true });
  await toConsole(page);
  await expect(preview(page)).toHaveText('My original Senate message');
  await expect(page.locator('#subjectText')).toHaveText('My original subject');
  await expect(page.locator('#officialList li').first()).toHaveText('✓ Patty Murray');
  await channel(page, 'call'); await expect(preview(page)).toHaveText(legacy.callScript.senate);
  await goTo(page, 'Suzan DelBene'); await channel(page, 'letter'); await expect(preview(page)).toHaveText('My House message');
  await channel(page, 'social'); await expect(preview(page)).toHaveText(legacy.social);
  await edit(page, { body: 'New personal post' });
  await page.reload(); await expect(preview(page)).toHaveText('New personal post');
});

test('older shared drafts and inactive records stay exact after new details and a reload', async ({ page }) => {
  const old = { district: 'WA-01', shared: { subject: 'Old subject', message: 'My saved shared argument [Your name]', conciseSubject: 'Old short', conciseMessage: 'My saved short' }, personal: { murray: { message: 'Dear wrong recipient,\nMy old full.\nMy manual signature', conciseMessage: 'Custom concise', call: 'Custom call', social: 'Custom post' }, newhouse: { message: 'Saved inactive House', conciseMessage: 'Inactive concise', call: 'Inactive call', social: 'Inactive post' } }, selected: 'murray' };
  await once(page, { [DRAFTS]: old, [ACTIONS]: { 'newhouse:letter': true, 'murray:call': true } });
  await page.goto('/');
  await page.click('[data-change="1"]'); await page.fill('#detailName', 'New identity'); await page.click('#done1');
  await page.reload();
  await expect(preview(page)).toHaveText(old.personal.murray.message);
  const saved = await stored(page, draftKey);
  expect(saved.personal).toEqual(old.personal); expect(saved.shared).toEqual(old.shared);
  await goTo(page, 'Maria Cantwell');
  await expect(preview(page)).toContainText('My saved shared argument [Your name]');
  await version(page, 'concise'); await goTo(page, 'Patty Murray');
  await expect(preview(page)).toHaveText('Custom concise');
  await expect(page.locator('#progressText')).toHaveText('1 / 5 contacted');
});

test('every active official renders full and concise letters within the conservative length budget', async ({ page }) => {
  await page.goto('/');
  const rows = await page.evaluate(() => {
    const M = window.ActionModel, T = window.CAMPAIGN_CONTENT;
    return window.CAMPAIGN.officials.filter(o => o.active).flatMap(o => ['full', 'concise'].map(version => {
      const st = M.create(T.shared, T.concise.shared); st.letterVersion = version;
      const d = M.draft(st, o, T); return { version, category: o.vote || 'influence', message: d.message, count: d.message.replace(/\r?\n/g, '\r\n').length };
    }));
  });
  expect(rows).toHaveLength(24);
  for (const row of rows) { expect(row.count).toBeGreaterThanOrEqual(row.version === 'full' ? 1500 : 700); expect(row.count).toBeLessThanOrEqual(row.version === 'full' ? 1700 : 900); }
  for (const version of ['full', 'concise']) for (const cat of ['senate', 'house', 'influence'])
    expect(new Set(rows.filter(r => r.category === cat && r.version === version).map(r => r.message.split('\n\n').slice(1).join('\n\n'))).size).toBe(1);
});
