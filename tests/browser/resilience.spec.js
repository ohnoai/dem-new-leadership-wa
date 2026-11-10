const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
test('clipboard failure selects text without claiming success', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } }));
  await page.goto('/'); await page.getByRole('button', { name: 'Copy message', exact: true }).click();
  await expect(page.locator('#feedback')).toContainText('Clipboard unavailable');
  expect(await page.locator('#message').evaluate(el => el.selectionEnd - el.selectionStart)).toBe((await page.locator('#message').inputValue()).length);
});
test('denied storage keeps editor usable and warns honestly', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('disabled'); }; });
  await page.goto('/'); await page.locator('#message').fill('Keep this in memory');
  await expect(page.locator('#saveStatus')).toContainText('Not saved');
  await page.locator('#official').selectOption('cantwell'); await page.locator('#official').selectOption('murray');
  await expect(page.locator('#message')).toHaveValue('Keep this in memory');
});
test('denied completion writes retain local changes while merging latest persisted actions', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('leadership-wa-actions-v3', JSON.stringify({ 'cantwell:letter': true }));
    window.allowActionWrites = false;
    window.storeActionMap = value => original.call(localStorage, 'leadership-wa-actions-v3', JSON.stringify(value));
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'leadership-wa-actions-v3' && !window.allowActionWrites) throw new Error('disabled');
      return original.call(this, key, value);
    };
  });
  await page.goto('/');
  await page.locator('#completed').check();
  await page.locator('#channel').selectOption('call');
  await page.locator('#completed').check();
  await expect(page.locator('#progressText')).toHaveText(/^3 \/ /);
  await page.locator('#channel').selectOption('letter');
  await expect(page.locator('#completed')).toBeChecked();
  await page.locator('#official').selectOption('cantwell');
  await page.locator('#completed').uncheck();
  await page.evaluate(() => {
    window.storeActionMap({ 'cantwell:letter': true, 'delbene:social': true });
    window.dispatchEvent(new StorageEvent('storage', { key: 'leadership-wa-actions-v3' }));
  });
  await expect(page.locator('#completed')).not.toBeChecked();
  await expect(page.locator('#progressText')).toHaveText(/^3 \/ /);
  await expect(page.locator('#saveStatus')).toContainText('Not saved');
  await page.evaluate(() => { window.allowActionWrites = true; });
  await page.locator('#channel').selectOption('social');
  await page.locator('#completed').check();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('leadership-wa-actions-v3')))).toEqual({
    'murray:letter': true, 'murray:call': true, 'cantwell:letter': false, 'cantwell:social': true, 'delbene:social': true
  });
  await page.evaluate(() => {
    window.storeActionMap({ 'murray:letter': false, 'cantwell:letter': true });
    window.dispatchEvent(new StorageEvent('storage', { key: 'leadership-wa-actions-v3' }));
  });
  await page.locator('#channel').selectOption('letter');
  await expect(page.locator('#completed')).toBeChecked();
  await page.locator('#official').selectOption('murray');
  await expect(page.locator('#completed')).not.toBeChecked();
});
test('phone and social are editable, saved separately and never auto-complete', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: async data => { window.sharedPayload = data; } }));
  await page.goto('/'); await page.locator('#channel').selectOption('call');
  await expect(page.locator('#phoneLink')).toHaveAttribute('href', 'tel:+12022242621');
  await page.locator('#callScript').fill('My call'); await page.locator('#completed').check();
  await page.locator('#channel').selectOption('social');
  await expect(page.locator('#completed')).not.toBeChecked();
  await page.locator('#socialText').fill('My social message'); await page.locator('#sharePost').click();
  expect(await page.evaluate(() => window.sharedPayload)).toEqual({ text: 'My social message' });
  await expect(page.locator('#completed')).not.toBeChecked(); await page.reload();
  await expect(page.locator('#socialText')).toHaveValue('My social message');
  await page.locator('#channel').selectOption('call');
  await expect(page.locator('#callScript')).toHaveValue('My call'); await expect(page.locator('#completed')).toBeChecked();
});
test('all officials have a recipient greeting and the correct editable request', async ({ page }) => {
  await page.goto('/');
  const officials = await page.evaluate(() => window.CAMPAIGN.officials);
  for (const o of officials) {
    await page.locator('#official').selectOption(o.id);
    await expect(page.locator('#contactLink')).toHaveAttribute('href', o.website);
    const text = await page.locator('#message').inputValue();
    expect(text).toContain(o.greeting || o.name.split(' ').at(-1));
    expect(text).toContain(o.vote ? 'leadership vote' : 'You do not cast a vote');
    await page.locator('#channel').selectOption('call');
    if (o.phone) await expect(page.locator('#phoneLink')).toHaveAttribute('href', 'tel:+1' + o.phone.replace(/\D/g, ''));
    await page.locator('#channel').selectOption('letter');
  }
});
test('expanded controls have accessible labels and no small screen overflow', async ({ page }) => {
  await page.goto('/');
  await page.locator('#districtDetails').evaluate(el => el.open = true);
  await page.locator('.shared').evaluate(el => el.open = true);
  for (const channel of ['letter', 'call', 'social']) {
    await page.locator('#channel').selectOption(channel);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
test('prototype drafts and progress survive the upgrade', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('new-leadership-wa-v2')) localStorage.setItem('new-leadership-wa-v2', JSON.stringify({ drafts: { senate: { subject: 'My original subject', message: 'My original Senate message' }, house: { subject: 'House subject', message: 'My House message' } }, progress: { murray: true } }));
  });
  await page.goto('/');
  await expect(page.locator('#message')).toHaveValue('My original Senate message');
  await expect(page.locator('#subject')).toHaveValue('My original subject');
  await expect(page.locator('#completed')).toBeChecked();
  await page.locator('#official').selectOption('delbene');
  await expect(page.locator('#message')).toHaveValue('My House message');
});
test('prototype call and shared social drafts migrate exactly for every relevant recipient', async ({ page }) => {
  const legacy = {
    callScript: { senate: 'My Senate call\n[official] - keep this greeting!  ', house: 'My House call\n[request] - unchanged.  ' },
    social: 'My shared post\n[handle] - exact text!  '
  };
  await page.addInitScript(value => {
    if (!localStorage.getItem('new-leadership-wa-v2')) localStorage.setItem('new-leadership-wa-v2', JSON.stringify(value));
  }, legacy);
  await page.goto('/');
  const officials = await page.evaluate(() => window.CAMPAIGN.officials);
  const personal = await page.evaluate(() => JSON.parse(localStorage.getItem('leadership-wa-drafts-v3'))?.personal);
  for (const o of officials) {
    await page.locator('#official').selectOption(o.id);
    if (['senate', 'house'].includes(o.group)) {
      await page.locator('#channel').selectOption('call');
      await expect(page.locator('#callScript')).toHaveValue(legacy.callScript[o.group]);
      expect(personal[o.id].call).toBe(legacy.callScript[o.group]);
    } else {
      expect(personal[o.id]).not.toHaveProperty('call');
    }
    await page.locator('#channel').selectOption('social');
    await expect(page.locator('#socialText')).toHaveValue(legacy.social);
    expect(personal[o.id].social).toBe(legacy.social);
  }
  await page.locator('#official').selectOption('murray');
  await page.locator('#socialText').fill('New personal social version');
  await page.reload();
  await expect(page.locator('#socialText')).toHaveValue('New personal social version');
  await page.locator('#channel').selectOption('call');
  await expect(page.locator('#callScript')).toHaveValue(legacy.callScript.senate);
});
test('an older browser tab cannot silently overwrite a newer draft', async ({ page, context }) => {
  await page.goto('/'); await page.locator('#message').fill('First version');
  const other = await context.newPage(); await other.goto('/');
  await other.locator('#message').fill('Newer version');
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('leadership-wa-drafts-v3')).personal.murray.message)).toBe('Newer version');
  await page.locator('#channel').selectOption('call');
  await other.reload();
  await expect(other.locator('#message')).toHaveValue('Newer version');
});
test('every House district resolves and compound surname greeting is preserved', async ({ page }) => {
  await page.goto('/');
  await page.locator('#districtDetails').evaluate(el => el.open = true);
  await expect(page.locator('#district option')).toHaveCount(11);
  await page.locator('#district').selectOption('WA-04');
  await expect(page.locator('#officialName')).toHaveText('Dan Newhouse');
  await expect(page.locator('#voteBadge')).toHaveText('Indirect influence');
  await expect(page.locator('#message')).toHaveValue(/^Dear Representative Newhouse,/);
  await page.locator('#official').selectOption('perez');
  await expect(page.locator('#message')).toHaveValue(/^Dear Representative Gluesenkamp Perez,/);
});
test('cross-platform social drafts identify people without invented mentions', async ({ page }) => {
  await page.goto('/'); await page.locator('#official').selectOption('larsen');
  await page.locator('#channel').selectOption('social');
  await expect(page.locator('#socialText')).toHaveValue(/^Rick Larsen:/);
});
