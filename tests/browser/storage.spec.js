const { test, expect } = require('@playwright/test');
const { toConsole, preview, channel, goTo, edit, erase, stored, draftKey, actionKey, legacyKey } = require('./helpers');

// Storage that can be made to fail on demand, while tests read and write the real thing underneath.
async function faults(page) {
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    window.storageFaults = { read: false, write: false, actionWrite: false, actionRead: false };
    window.rawGet = key => get.call(localStorage, key);
    window.rawSet = (key, value) => set.call(localStorage, key, value);
    Storage.prototype.getItem = function (key) { if (window.storageFaults.read || (window.storageFaults.actionRead && key.endsWith('-actions-v3'))) throw new Error('read disabled'); return get.call(this, key); };
    Storage.prototype.setItem = function (key, value) { if (window.storageFaults.write || (window.storageFaults.actionWrite && key.endsWith('-actions-v3'))) throw new Error('write disabled'); return set.call(this, key, value); };
  });
}
const fault = (page, values) => page.evaluate(v => Object.assign(window.storageFaults, v), values);
const raw = (page, key) => page.evaluate(k => JSON.parse(window.rawGet(k)), key);
const murray = async page => (await raw(page, draftKey)).personal.murray.message;
// A district already chosen, so the page opens on step 3.
const seeded = (page, extra = {}) => page.addInitScript(e => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('leadership-wa-drafts-v3', JSON.stringify({ district: 'WA-01', ...e })); } }, extra);

test('a working save shows nothing; a failed save says so, keeps the text, and recovers without reload', async ({ page }) => {
  await faults(page); await seeded(page); await page.goto('/');
  await edit(page, { body: 'Initial saved draft' });
  await expect(page.locator('#saveStatus')).toBeHidden();
  await fault(page, { write: true });
  await edit(page, { body: 'Unsaved draft' });
  await expect(page.locator('#saveStatus')).toHaveText('Not saved. Copy your work.');
  await expect(preview(page)).toHaveText('Unsaved draft');
  expect(await murray(page)).toBe('Initial saved draft');
  await fault(page, { write: false });
  await edit(page, { body: 'Recovered draft' });
  await expect(page.locator('#saveStatus')).toBeHidden();
  expect(await murray(page)).toBe('Recovered draft');
});

test('a failed progress save does not stop later draft saves', async ({ page }) => {
  await faults(page); await seeded(page); await page.goto('/');
  await fault(page, { actionWrite: true });
  await page.click('#sent');
  await expect(page.locator('#saveStatus')).toContainText('Not saved');
  await goTo(page, 'Patty Murray');
  await edit(page, { body: 'Saved after action failure' });
  expect(await murray(page)).toBe('Saved after action failure');
  await fault(page, { actionWrite: false });
  await edit(page, { body: 'Saved again' });
  expect(await raw(page, actionKey)).toEqual({ 'murray:letter': true });
  await expect(page.locator('#saveStatus')).toBeHidden();
});

test('a read failure never overwrites saved text and recovers without reload', async ({ page }) => {
  await faults(page); await seeded(page); await page.goto('/');
  await edit(page, { body: 'Saved before read failure' });
  await fault(page, { read: true });
  await edit(page, { body: 'In memory during read failure' });
  await expect(page.locator('#saveStatus')).toContainText('Not saved');
  expect(await murray(page)).toBe('Saved before read failure');
  await fault(page, { read: false });
  await edit(page, { body: 'Next edit after read recovery' });
  await expect(page.locator('#saveStatus')).toBeHidden();
  expect(await murray(page)).toBe('Next edit after read recovery');
});

test('storage unreadable at startup: work continues, and an empty store is filled once it recovers', async ({ page }) => {
  await faults(page);
  await page.addInitScript(() => { window.storageFaults.read = true; });
  await page.goto('/'); await toConsole(page);
  await edit(page, { body: 'Kept while storage unavailable' });
  await fault(page, { read: false });
  await edit(page, { body: 'Saved after startup recovery' });
  await expect(page.locator('#saveStatus')).toBeHidden();
  expect(await murray(page)).toBe('Saved after startup recovery');
});

test('storage unreadable at startup never overwrites text it could not see', async ({ page }) => {
  await faults(page);
  await page.addInitScript(() => { window.rawSet('leadership-wa-drafts-v3', JSON.stringify({ district: 'WA-01', personal: { murray: { message: 'Existing saved work' } } })); window.storageFaults.read = true; });
  await page.goto('/'); await toConsole(page);
  await edit(page, { body: 'New in-memory work' });
  await fault(page, { read: false });
  await edit(page, { body: 'New edit after recovery' });
  expect(await murray(page)).toBe('Existing saved work');
  await expect(preview(page)).toHaveText('New edit after recovery');
  await expect(page.locator('#feedback')).toContainText('will not overwrite');
});

test('an older tab cannot silently overwrite a newer draft, even after its storage recovers', async ({ page, context }) => {
  await faults(page); await seeded(page); await page.goto('/');
  await edit(page, { body: 'Original' });
  await fault(page, { write: true });
  await edit(page, { body: 'Unsaved local edit' });
  const other = await context.newPage(); await other.goto('/'); await edit(other, { body: 'Newer other-tab edit' });
  await fault(page, { write: false });
  await edit(page, { body: 'Still local after recovery' });
  expect(await murray(page)).toBe('Newer other-tab edit');
  await expect(preview(page)).toHaveText('Still local after recovery');
  await expect(page.locator('#feedback')).toContainText('will not overwrite');
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  expect(await murray(page)).toBe('Newer other-tab edit');
  await other.reload(); await expect(preview(other)).toHaveText('Newer other-tab edit');
});

test('a progress read failure saves the pending mark once reads recover', async ({ page }) => {
  await faults(page); await seeded(page); await page.goto('/');
  await fault(page, { actionRead: true });
  await page.click('#sent');
  await expect(page.locator('#saveStatus')).toContainText('Not saved');
  await fault(page, { actionRead: false });
  await edit(page, { body: 'Trigger recovery' });
  await expect(page.locator('#saveStatus')).toBeHidden();
  expect(await raw(page, actionKey)).toEqual({ 'murray:letter': true });
});

test('denied progress writes keep local marks while merging what another tab saved', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('leadership-wa-drafts-v3', JSON.stringify({ district: 'WA-01' }));
    localStorage.setItem('leadership-wa-actions-v3', JSON.stringify({ 'cantwell:letter': true }));
    const original = Storage.prototype.setItem;
    window.allowActionWrites = false;
    window.storeActionMap = value => original.call(localStorage, 'leadership-wa-actions-v3', JSON.stringify(value));
    Storage.prototype.setItem = function (key, value) { if (key === 'leadership-wa-actions-v3' && !window.allowActionWrites) throw new Error('disabled'); return original.call(this, key, value); };
  });
  await page.goto('/');
  await expect(page.locator('#officialName')).toHaveText('Patty Murray');
  await page.click('#sent');
  await expect(page.locator('#progressText')).toHaveText('2 / 5 contacted');
  await page.evaluate(() => { window.storeActionMap({ 'cantwell:letter': true, 'delbene:social': true }); window.dispatchEvent(new StorageEvent('storage', { key: 'leadership-wa-actions-v3' })); });
  await expect(page.locator('#progressText')).toHaveText('3 / 5 contacted');
  await expect(page.locator('#saveStatus')).toContainText('Not saved');
  await page.evaluate(() => { window.allowActionWrites = true; });
  await goTo(page, 'Shasti Conrad'); await channel(page, 'call'); await page.click('#sent');
  expect(await stored(page, actionKey)).toEqual({ 'murray:letter': true, 'cantwell:letter': true, 'delbene:social': true, 'conrad:call': true });
});

test('denied storage keeps everything usable in memory and warns honestly', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('disabled'); }; });
  await page.goto('/');
  await page.fill('#detailName', 'Memory name');
  await toConsole(page);
  await expect(page.locator('#saveStatus')).toContainText('Not saved');
  await edit(page, { body: 'Keep this in memory' });
  await page.click('#nextOfficial'); await page.click('#previousOfficial');
  await expect(preview(page)).toHaveText('Keep this in memory');
});

test('details typed in a stale tab cannot overwrite the newer tab', async ({ page, context }) => {
  await page.goto('/'); await page.fill('#detailName', 'Jane Smith');
  const other = await context.newPage(); await other.goto('/');
  await page.fill('#detailCounty', 'Thurston');
  await other.fill('#detailName', 'Stale identity');
  await expect(other.locator('#saveStatus')).toContainText('Another tab');
  expect((await stored(page, draftKey)).details).toEqual({ name: 'Jane Smith', county: 'Thurston' });
});

test('erase asks first, removes only this campaign, and starts over at step 1', async ({ page }) => {
  await seeded(page); await page.goto('/');
  await edit(page, { body: 'Saved personal text' }); await page.click('#sent');
  await page.evaluate(() => { localStorage.setItem('unrelated-key', 'Keep me'); localStorage.setItem('new-leadership-wa-v2', '{}'); });
  await page.click('#aboutLink'); await page.click('#erase'); await page.click('#cancelErase');
  await page.click('#closeAbout');
  await expect(page.locator('#officialList li').first()).toHaveText('✓ Patty Murray');
  await erase(page);
  await expect(page.locator('#feedback')).toHaveText('Local drafts and actions erased.');
  expect(await page.evaluate(keys => keys.map(k => localStorage.getItem(k)), [draftKey, actionKey, legacyKey])).toEqual([null, null, null]);
  expect(await page.evaluate(() => localStorage.getItem('unrelated-key'))).toBe('Keep me');
  await page.click('#closeAbout');
  await expect(page.locator('#s1')).toHaveAttribute('data-state', 'active');
  await expect(page.locator('#detailName')).toHaveValue('');
  await expect(page.locator('#progress')).toBeHidden();
});

test('a blocked legacy removal leaves every record in place and cannot re-import private text', async ({ page }) => {
  await seeded(page); await page.goto('/');
  await edit(page, { body: 'Current v3 letter' }); await page.click('#sent');
  const before = await page.evaluate(({ draftKey, actionKey, legacyKey }) => {
    localStorage.setItem(legacyKey, JSON.stringify({ drafts: { senate: { message: 'Private legacy letter' } } }));
    const original = Storage.prototype.removeItem; window.removalAttempts = [];
    Storage.prototype.removeItem = function (key) { window.removalAttempts.push(key); if (key === legacyKey) throw new Error('blocked'); return original.call(this, key); };
    return [localStorage.getItem(draftKey), localStorage.getItem(actionKey)];
  }, { draftKey, actionKey, legacyKey });
  await erase(page);
  await expect(page.locator('#feedback')).toHaveText('Unable to erase browser storage. Use browser settings.');
  expect(await page.evaluate(keys => keys.map(k => localStorage.getItem(k)), [draftKey, actionKey])).toEqual(before);
  expect(await page.evaluate(() => window.removalAttempts)).toEqual([legacyKey]);
  await page.reload(); await goTo(page, 'Patty Murray');
  await expect(preview(page)).toHaveText('Current v3 letter');
});

test('erase in another tab clears this tab, including unsaved details and pending marks', async ({ page, context }) => {
  await seeded(page, { details: { name: 'Jane Smith' } }); await page.goto('/');
  await edit(page, { body: 'Saved letter' });
  const other = await context.newPage(); await other.goto('/');
  await other.evaluate(key => {
    window.allowActionWrites = false; window.sawErase = false;
    window.addEventListener('storage', e => { if (e.key === key && e.newValue === null) window.sawErase = true; });
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) { if ((name === key || name.endsWith('-drafts-v3')) && !window.allowActionWrites) throw new Error('blocked'); return original.call(this, name, value); };
  }, actionKey);
  await other.click('#sent');
  await expect(other.locator('#saveStatus')).toHaveText('Not saved. Copy your work.');
  await erase(page);
  await other.waitForFunction(() => window.sawErase);
  await expect(other.locator('#s1')).toHaveAttribute('data-state', 'active');
  await expect(other.locator('#detailName')).toHaveValue('');
  await other.evaluate(() => { window.allowActionWrites = true; });
  await other.fill('#detailCity', 'Olympia');
  expect((await stored(other, draftKey)).details).toEqual({ city: 'Olympia' });
  expect(await other.evaluate(k => localStorage.getItem(k), actionKey)).toBeNull();
});
