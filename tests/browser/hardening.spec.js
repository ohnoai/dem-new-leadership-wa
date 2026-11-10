const { test, expect } = require('@playwright/test');
const draftsKey = 'leadership-wa-drafts-v3';
const actionsKey = 'leadership-wa-actions-v3';
async function injectStorage(page) {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    window.storageFaults = { read: false, write: false, actionWrite: false, actionRead: false };
    window.rawGet = key => get.call(localStorage, key);
    window.rawSet = (key, value) => set.call(localStorage, key, value);
    Storage.prototype.getItem = function (key) { if (window.storageFaults.read || (window.storageFaults.actionRead && key.endsWith('-actions-v3'))) throw new Error('read disabled'); return get.call(this, key); };
    Storage.prototype.setItem = function (key, value) { if (window.storageFaults.write || (window.storageFaults.actionWrite && key.endsWith('-actions-v3'))) throw new Error('write disabled'); return set.call(this, key, value); };
  });
}
test('draft writes recover and keep saving subsequent edits without reload', async ({ page }) => {
  await injectStorage(page); await page.goto('/');
  await page.locator('#message').fill('Initial saved draft');
  await page.evaluate(() => { window.storageFaults.write = true; });
  await page.locator('#message').fill('Unsaved draft');
  await expect(page.locator('#saveStatus')).toContainText('Not saved');
  expect(await page.evaluate(key => JSON.parse(window.rawGet(key)).personal.murray.message, draftsKey)).toBe('Initial saved draft');
  await page.evaluate(() => { window.storageFaults.write = false; });
  await page.locator('#message').fill('Recovered draft');
  await expect(page.locator('#saveStatus')).toHaveText('Saved on this device');
  await page.locator('#message').fill('Subsequent saved draft');
  expect(await page.evaluate(key => JSON.parse(window.rawGet(key)).personal.murray.message, draftsKey)).toBe('Subsequent saved draft');
});
test('an action write failure does not poison subsequent draft saves', async ({ page }) => {
  await injectStorage(page); await page.goto('/');
  await page.evaluate(() => { window.storageFaults.actionWrite = true; });
  await page.locator('#completed').check();
  await page.locator('#message').fill('First saved after action failure');
  await page.locator('#message').fill('Second saved after action failure');
  expect(await page.evaluate(key => JSON.parse(window.rawGet(key)).personal.murray.message, draftsKey)).toBe('Second saved after action failure');
  await expect(page.locator('#saveStatus')).toContainText('Not saved');
  await page.evaluate(() => { window.storageFaults.actionWrite = false; });
  await page.locator('#completed').uncheck();
  await expect(page.locator('#saveStatus')).toHaveText('Saved on this device');
});
test('read failure never overwrites saved content and recovers without reload', async ({ page }) => {
  await injectStorage(page); await page.goto('/');
  await page.locator('#message').fill('Saved before read failure');
  await page.evaluate(() => { window.storageFaults.read = true; });
  await page.locator('#message').fill('In memory during read failure');
  await expect(page.locator('#saveStatus')).toContainText('Not saved');
  expect(await page.evaluate(key => JSON.parse(window.rawGet(key)).personal.murray.message, draftsKey)).toBe('Saved before read failure');
  await page.evaluate(() => { window.storageFaults.read = false; });
  await page.locator('#message').fill('Recovered after read failure');
  await page.locator('#message').fill('Next edit after read recovery');
  await expect(page.locator('#saveStatus')).toHaveText('Saved on this device');
  expect(await page.evaluate(key => JSON.parse(window.rawGet(key)).personal.murray.message, draftsKey)).toBe('Next edit after read recovery');
});
test('failed reads at startup recover missing storage on the next edit', async ({ page }) => {
  await injectStorage(page);
  await page.addInitScript(() => { window.storageFaults.read = true; });
  await page.goto('/');
  await page.locator('#message').fill('Kept while storage unavailable');
  await page.evaluate(() => { window.storageFaults.read = false; });
  await page.locator('#message').fill('Saved after startup recovery');
  await expect(page.locator('#saveStatus')).toHaveText('Saved on this device');
  expect(await page.evaluate(key => JSON.parse(window.rawGet(key)).personal.murray.message, draftsKey)).toBe('Saved after startup recovery');
});
test('startup read recovery retains unknown saved text instead of overwriting it', async ({ page }) => {
  await injectStorage(page);
  await page.addInitScript(() => {
    window.rawSet('leadership-wa-drafts-v3', JSON.stringify({ personal: { murray: { message: 'Existing saved work' } } }));
    window.storageFaults.read = true;
  });
  await page.goto('/'); await page.locator('#message').fill('New in-memory work');
  await page.evaluate(() => { window.storageFaults.read = false; });
  await page.locator('#message').fill('New edit after recovery');
  expect(await page.evaluate(key => JSON.parse(window.rawGet(key)).personal.murray.message, draftsKey)).toBe('Existing saved work');
  await expect(page.locator('#message')).toHaveValue('New edit after recovery');
  await expect(page.locator('#feedback')).toContainText('will not overwrite');
});
test('recovered writes still refuse a newer draft from another tab', async ({ page, context }) => {
  await injectStorage(page); await page.goto('/'); await page.locator('#message').fill('Original');
  await page.evaluate(() => { window.storageFaults.write = true; });
  await page.locator('#message').fill('Unsaved local edit');
  const other = await context.newPage(); await other.goto('/'); await other.locator('#message').fill('Newer other-tab edit');
  await page.evaluate(() => { window.storageFaults.write = false; });
  await page.locator('#message').fill('Still local after recovery');
  expect(await page.evaluate(key => JSON.parse(window.rawGet(key)).personal.murray.message, draftsKey)).toBe('Newer other-tab edit');
  await expect(page.locator('#message')).toHaveValue('Still local after recovery');
  await expect(page.locator('#feedback')).toContainText('will not overwrite');
});
test('recovered action reads save pending completion before claiming recovery', async ({ page }) => {
  await injectStorage(page); await page.goto('/');
  await page.evaluate(() => { window.storageFaults.actionRead = true; });
  await page.locator('#completed').check();
  await expect(page.locator('#saveStatus')).toContainText('Not saved');
  await page.evaluate(() => { window.storageFaults.actionRead = false; });
  await page.locator('#message').fill('Trigger recovery');
  await expect(page.locator('#saveStatus')).toHaveText('Saved on this device');
  expect(await page.evaluate(key => JSON.parse(window.rawGet(key)), actionsKey)).toEqual({ 'murray:letter': true });
});
test('migration never overwrites unreadable existing action history', async ({ page }) => {
  await injectStorage(page);
  await page.addInitScript(() => {
    window.rawSet('new-leadership-wa-v2', JSON.stringify({ drafts: { senate: { message: 'Legacy text' } } }));
    window.rawSet('leadership-wa-actions-v3', JSON.stringify({ 'cantwell:letter': true }));
    window.storageFaults.actionRead = true;
  });
  await page.goto('/');
  expect(await page.evaluate(key => JSON.parse(window.rawGet(key)), actionsKey)).toEqual({ 'cantwell:letter': true });
});
