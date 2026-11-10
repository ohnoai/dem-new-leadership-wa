const { test, expect } = require('@playwright/test');
const draftKey = 'leadership-wa-drafts-v3', actionKey = 'leadership-wa-actions-v3';
async function openErase(page) {
  await page.locator('.about').evaluate(el => el.open = true);
  await page.locator('#erase').evaluate(el => el.closest('details').open = true);
  await page.locator('#erase').click();
}
test('resetting a recipient letter preserves master, other recipients, channels and completion', async ({ page, context }) => {
  await page.goto('/');
  await page.locator('#message').fill('Custom Murray letter');
  await page.locator('#subject').fill('Custom Murray subject');
  await page.locator('#completed').check();
  await page.locator('#channel').selectOption('call'); await page.locator('#callScript').fill('Custom Murray call');
  await page.locator('#channel').selectOption('social'); await page.locator('#socialText').fill('Custom Murray social');
  await page.locator('#official').selectOption('cantwell');
  await page.locator('#channel').selectOption('letter'); await page.locator('#message').fill('Custom Cantwell letter');
  await page.locator('#official').selectOption('murray'); await page.locator('#useShared').click();
  await expect(page.locator('#message')).toHaveValue(/^Dear Senator Murray,/);
  await expect(page.locator('#completed')).toBeChecked();
  await page.locator('#channel').selectOption('call'); await expect(page.locator('#callScript')).toHaveValue('Custom Murray call');
  await page.locator('#channel').selectOption('social'); await expect(page.locator('#socialText')).toHaveValue('Custom Murray social');
  const reopened = await context.newPage(); await reopened.goto('/');
  await reopened.locator('#official').selectOption('cantwell'); await reopened.locator('#channel').selectOption('letter');
  await expect(reopened.locator('#message')).toHaveValue('Custom Cantwell letter');
});
test('erase cancellation keeps data and confirmed erase removes only campaign data', async ({ page }) => {
  await page.goto('/'); await page.locator('#message').fill('Saved personal text'); await page.locator('#completed').check();
  await page.evaluate(() => { localStorage.setItem('unrelated-key', 'Keep me'); localStorage.setItem('new-leadership-wa-v2', '{}'); });
  await openErase(page); await page.locator('#cancelErase').click();
  await expect(page.locator('#message')).toHaveValue('Saved personal text');
  await page.locator('#erase').click(); await page.locator('#confirmErase').click();
  expect(await page.evaluate(keys => keys.map(k => localStorage.getItem(k)), [draftKey, actionKey, 'new-leadership-wa-v2'])).toEqual([null, null, null]);
  expect(await page.evaluate(() => localStorage.getItem('unrelated-key'))).toBe('Keep me');
  await page.reload(); await expect(page.locator('#message')).toHaveValue(/^Dear Senator Murray,/);
  await expect(page.locator('#completed')).not.toBeChecked();
});
test('share cancellation preserves text and unsupported share copies the post', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => Object.defineProperty(navigator, 'share', { configurable: true, value: () => Promise.reject(new DOMException('Cancelled', 'AbortError')) }));
  await page.goto('/'); await page.locator('#channel').selectOption('social'); await page.locator('#socialText').fill('Social text to preserve');
  await page.locator('#sharePost').click(); await expect(page.locator('#completed')).not.toBeChecked();
  await expect(page.locator('#socialText')).toHaveValue('Social text to preserve');
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { value: undefined }));
  await page.locator('#sharePost').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Social text to preserve');
});
test('subject clipboard denial selects subject without mutating the message', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } }));
  await page.goto('/'); const original = await page.locator('#message').inputValue();
  await page.locator('#copySubject').click(); await expect(page.locator('#subject')).toBeFocused();
  expect(await page.locator('#subject').evaluate(el => el.selectionEnd - el.selectionStart)).toBe((await page.locator('#subject').inputValue()).length);
  await expect(page.locator('#message')).toHaveValue(original);
});
