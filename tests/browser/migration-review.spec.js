const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const key = 'leadership-wa-drafts-v3';
test('migrated text is preserved but requires recipient review before copying or opening', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const original = 'Dear Senator Cantwell,\n\nMy exact older message.';
  await page.addInitScript(text => {
    if (!localStorage.getItem('new-leadership-wa-v2')) localStorage.setItem('new-leadership-wa-v2', JSON.stringify({ drafts: { senate: { subject: 'Original subject', message: text } } }));
  }, original);
  await page.goto('/');
  await expect(page.locator('#message')).toHaveValue(original);
  await expect(page.locator('#recipientReview')).toContainText('Patty Murray');
  await page.locator('#copyMessage').click();
  await expect(page.locator('#feedback')).toContainText('Review');
  expect(await page.locator('#contactLink').evaluate(el => !el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))).toBe(true);
  await page.locator('#reviewedRecipient').check();
  await page.locator('#copyMessage').click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(original);
  await page.locator('#official').selectOption('cantwell');
  await expect(page.locator('#reviewedRecipient')).not.toBeChecked();
  await expect(page.locator('#recipientReview')).toContainText('Maria Cantwell');
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.locator('#official').selectOption('murray');
  await expect(page.locator('#reviewedRecipient')).toBeChecked();
  await page.reload();
  await expect(page.locator('#reviewedRecipient')).toBeChecked();
  await page.locator('#message').fill(original + ' Edited');
  await expect(page.locator('#reviewedRecipient')).not.toBeChecked();
});
test('already migrated v3 content is warned without rewriting saved text', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('new-leadership-wa-v2', JSON.stringify({ drafts: { senate: { message: 'Dear Senator Cantwell, old text' } } }));
    localStorage.setItem('leadership-wa-drafts-v3', JSON.stringify({ personal: { murray: { message: 'Dear Senator Cantwell, old text' } }, selected: 'murray' }));
  });
  await page.goto('/');
  await expect(page.locator('#recipientReview')).toBeVisible();
  await expect(page.locator('#message')).toHaveValue('Dear Senator Cantwell, old text');
});
test('imported call and social actions require review for the selected channel', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('new-leadership-wa-v2', JSON.stringify({ callScript: { senate: 'Call for Cantwell' }, social: 'Post for Cantwell' })));
  await page.goto('/'); await page.locator('#channel').selectOption('call');
  await expect(page.locator('#reviewedRecipient')).not.toBeChecked();
  expect(await page.locator('#phoneLink').evaluate(el => !el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))).toBe(true);
  await page.locator('#reviewedRecipient').check();
  await page.locator('#channel').selectOption('social');
  await expect(page.locator('#reviewedRecipient')).not.toBeChecked();
  await page.locator('#sharePost').click();
  await expect(page.locator('#feedback')).toContainText('Review');
  await expect(page.locator('#callScript')).toHaveValue('Call for Cantwell');
  await expect(page.locator('#socialText')).toHaveValue('Post for Cantwell');
});
