const { test, expect } = require('@playwright/test');
const draftKey = 'leadership-wa-drafts-v3', actionKey = 'leadership-wa-actions-v3', legacyKey = 'new-leadership-wa-v2';

test('cross-tab erase drops failed-write pending completions before the next action', async ({ page, context }) => {
  await page.goto('/');
  await page.locator('#message').fill('Saved letter');
  await page.locator('#completed').check();
  const other = await context.newPage();
  await other.goto('/');
  await other.evaluate(key => {
    window.allowActionWrites = false;
    window.sawActionErase = false;
    window.addEventListener('storage', event => { if (event.key === key && event.newValue === null) window.sawActionErase = true; });
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && !window.allowActionWrites) throw new Error('Action write blocked');
      return original.call(this, name, value);
    };
  }, actionKey);
  await other.getByRole('radio', { name: 'Call', exact: true }).check();
  await other.locator('#completed').check();
  await expect(other.locator('#saveStatus')).toHaveText('Not saved. Copy your work.');
  await confirmErase(page);
  await other.waitForFunction(() => window.sawActionErase);
  await expect(other.locator('#completed')).not.toBeChecked();
  await expect(other.locator('#progressText')).toHaveText(/^0 \/ /);
  await other.evaluate(() => { window.allowActionWrites = true; });
  await other.getByRole('radio', { name: 'Social', exact: true }).check();
  await other.locator('#completed').check();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), actionKey)).toEqual({ 'murray:social': true });
});

test('legacy removal failure preserves v3 records and cannot reimport private legacy text', async ({ page }) => {
  await page.goto('/');
  await page.locator('#message').fill('Current v3 letter');
  await page.locator('#completed').check();
  const before = await page.evaluate(({ draftKey, actionKey, legacyKey }) => {
    localStorage.setItem(legacyKey, JSON.stringify({ drafts: { senate: { message: 'Private legacy letter' } } }));
    const original = Storage.prototype.removeItem;
    window.removalAttempts = [];
    Storage.prototype.removeItem = function (key) {
      window.removalAttempts.push(key);
      if (key === legacyKey) throw new Error('Legacy removal blocked');
      return original.call(this, key);
    };
    return [localStorage.getItem(draftKey), localStorage.getItem(actionKey)];
  }, { draftKey, actionKey, legacyKey });
  await confirmErase(page);
  await expect(page.locator('#feedback')).toHaveText('Unable to erase browser storage. Use browser settings.');
  expect(await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), [draftKey, actionKey])).toEqual(before);
  expect(await page.evaluate(() => window.removalAttempts)).toEqual([legacyKey]);
  await page.reload();
  await expect(page.locator('#message')).toHaveValue('Current v3 letter');
  await expect(page.locator('#completed')).toBeChecked();
});

for (const api of ['clipboard', 'share']) {
  test(`delayed ${api} success does not announce success for a different recipient`, async ({ page }) => {
    await page.addInitScript(api => {
      const deferred = () => new Promise(resolve => { window.finishAction = resolve; });
      if (api === 'share') Object.defineProperty(navigator, 'share', { value: deferred });
      else Object.defineProperty(navigator, 'clipboard', { value: { writeText: deferred } });
    }, api);
    await page.goto('/');
    if (api === 'share') await page.getByRole('radio', { name: 'Social', exact: true }).check();
    await page.locator(api === 'share' ? '#sharePost' : '#copyMessage').click();
    await page.locator('#official').selectOption('cantwell');
    await page.evaluate(async () => { window.finishAction(); await new Promise(resolve => setTimeout(resolve, 0)); });
    await expect(page.locator('#feedback')).toBeEmpty();
    await expect(page.locator('#completed')).not.toBeChecked();
  });
}

async function confirmErase(page) {
  await page.locator('#erase').evaluate(el => { for (let parent = el.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true; });
  await page.locator('#erase').click();
  await page.locator('#confirmErase').click();
}
test('erase invalidates pending completions even when the action key never existed', async ({ page, context }) => {
  await page.goto('/'); await page.locator('#message').fill('Saved draft');
  const other = await context.newPage(); await other.goto('/');
  await other.evaluate(() => {
    const original = Storage.prototype.setItem;
    window.blockActions = true;
    Storage.prototype.setItem = function (key, value) { if (key.endsWith('-actions-v3') && window.blockActions) throw new Error('denied'); return original.call(this, key, value); };
  });
  await other.locator('#completed').check();
  await confirmErase(page);
  await expect(other.locator('#completed')).not.toBeChecked();
  await other.evaluate(() => { window.blockActions = false; });
  await other.locator('#message').fill('New edit after erase');
  expect(await other.evaluate(key => localStorage.getItem(key), actionKey)).toBeNull();
});

test('delayed share rejection copies the original post without stale recipient feedback', async ({ page }) => {
  await page.addInitScript(() => {
    window.copies = [];
    Object.defineProperty(navigator, 'share', { value: data => {
      window.shared = data;
      return new Promise((resolve, reject) => { window.rejectShare = () => reject(new Error('Share failed')); });
    } });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.copies.push(text); } } });
  });
  await page.goto('/');
  await page.getByRole('radio', { name: 'Social', exact: true }).check();
  await page.locator('#socialText').fill('Murray original post');
  await page.locator('#sharePost').click();
  await page.locator('#official').selectOption('cantwell');
  const newPost = await page.locator('#socialText').inputValue();
  await page.evaluate(async () => { window.rejectShare(); await new Promise(resolve => setTimeout(resolve, 0)); });
  expect(await page.evaluate(() => window.shared.text)).toBe('Murray original post');
  expect(await page.evaluate(() => window.copies)).toEqual(['Murray original post']);
  await expect(page.locator('#socialText')).toHaveValue(newPost);
  await expect(page.locator('#feedback')).toBeEmpty();
  await expect(page.locator('#completed')).not.toBeChecked();
});

test('delayed clipboard rejection never selects the newly selected recipient text', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: text => {
    window.copyPayload = text;
    return new Promise((resolve, reject) => { window.rejectCopy = () => reject(new Error('Denied')); });
  } } }));
  await page.goto('/');
  await page.locator('#message').fill('Murray private letter');
  await page.locator('#copyMessage').click();
  await page.locator('#official').selectOption('cantwell');
  const newMessage = await page.locator('#message').inputValue();
  await page.locator('#official').focus();
  await page.evaluate(async () => { window.rejectCopy(); await new Promise(resolve => setTimeout(resolve, 0)); });
  expect(await page.evaluate(() => window.copyPayload)).toBe('Murray private letter');
  await expect(page.locator('#message')).toHaveValue(newMessage);
  await expect(page.locator('#official')).toBeFocused();
  await expect(page.locator('#feedback')).toBeEmpty();
  await expect(page.locator('#completed')).not.toBeChecked();
});
