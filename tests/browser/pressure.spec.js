const { test, expect } = require('@playwright/test');
test('approved campaign copy has a prominent leadership subheading and current repository links', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.dek')).toHaveText('New majority.New leadership.');
  const intro = page.getByRole('heading', { level: 2, name: /Replace Chuck Schumer and Hakeem Jeffries/ });
  await expect(intro).toBeVisible();
  expect(await intro.evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(24);
  expect(await intro.evaluate(el => Number(getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(700);
  await expect(page.locator('#forkLink')).toHaveAttribute('href', 'https://github.com/ohnoai/demreset');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://demreset.com/assets/social-preview.png');
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /New majority\. New leadership\./);
});
test('DEM RESET hero leads into an accessible spacious action workspace', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('DEM RESET · Washington');
  await expect(page.locator('#headline')).toHaveText('DEMOCRATS NEED A RESET.');
  await expect(page.locator('.edition-mark img')).toHaveAttribute('src', 'assets/evergreen.svg');
  await page.getByRole('link', { name: 'Demand new leadership' }).click();
  await expect(page.locator('#action')).toBeFocused();
  expect(await page.locator('#official').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(60);
  await expect(page.locator('#expandLetter')).toHaveAttribute('aria-expanded', 'false');
  const original = await page.locator('#message').inputValue();
  await page.locator('#expandLetter').click();
  await expect(page.locator('#expandLetter')).toHaveAttribute('aria-expanded', 'true');
  expect(await page.locator('#message').evaluate(el => el.clientHeight >= el.scrollHeight - 2)).toBe(true);
  await page.locator('#message').fill(original + '\n\n' + 'A substantive extra paragraph. '.repeat(60));
  expect(await page.locator('#message').evaluate(el => el.clientHeight >= el.scrollHeight - 2)).toBe(true);
  await page.locator('#official').selectOption('cantwell');
  await page.locator('#official').selectOption('murray');
  await expect(page.locator('#message')).toHaveValue(original + '\n\n' + 'A substantive extra paragraph. '.repeat(60));
  await page.locator('#expandLetter').click();
  await expect(page.locator('#expandLetter')).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('headline reflows at 320 CSS pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto('/'); await page.evaluate(async () => { await document.fonts.load('800 76px "Barlow Condensed"'); await document.fonts.ready; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('keyboard collapse keeps the focused toggle below the sticky header', async ({ page }) => {
  await page.goto('/'); await page.locator('#expandLetter').click();
  await page.locator('#message').fill('Long paragraph. '.repeat(300));
  await page.locator('#expandLetter').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#expandLetter')).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.getElementById('expandLetter').getBoundingClientRect().top >= document.querySelector('.masthead').getBoundingClientRect().bottom)).toBe(true);
});
