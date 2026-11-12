const { test, expect } = require('@playwright/test');
const { send, toConsole, channel, axe, fits } = require('./helpers');

test('production metadata and icon sizes are complete', async ({ page, request }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('DEM RESET · Washington State');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://demreset.com/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://demreset.com/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://demreset.com/assets/social-preview.png');
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /New majority\. New leadership\./);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', 'https://demreset.com/assets/social-preview.png');
  for (const [name, size] of [['favicon-16.png', 16], ['favicon-32.png', 32], ['apple-touch-icon.png', 180]]) {
    const response = await request.get('/assets/' + name); expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toBe('image/png');
    const bytes = await response.body(); expect(bytes.readUInt32BE(16)).toBe(size); expect(bytes.readUInt32BE(20)).toBe(size);
  }
});

test('the approved hero and how-it-works copy lead into step 1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#headline')).toHaveText('DEMOCRATS NEED A RESET.');
  await expect(page.locator('.dek')).toHaveText('New majority.New leadership.');
  const intro = page.getByRole('heading', { level: 2, name: /Replace Chuck Schumer and Hakeem Jeffries/ });
  expect(await intro.evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(24);
  await expect(page.locator('.edition-mark img')).toHaveAttribute('src', 'assets/evergreen.svg');
  await expect(page.locator('#howTitle')).toHaveText('Put your voice behind the reset.');
  await expect(page.locator('#howLine')).toHaveText('Add your details, find your representatives, and send the ready-to-use letters through their contact forms. Just a few minutes to make your voice heard.');
  await expect(page.locator('#forkLink')).toHaveAttribute('href', 'https://github.com/ohnoai/demreset');
  await page.getByRole('link', { name: 'Demand new leadership' }).click();
  await expect(page.locator('#steps')).toBeFocused();
  expect(await page.locator('#detailName').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(60);
});

test('keyboard: skip link, details in order, and focus moves to each new step', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to the steps' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#steps')).toBeFocused();
  await page.locator('#detailName').focus();
  for (const id of ['detailCity', 'detailCounty', 'detailZip', 'done1']) { await page.keyboard.press('Tab'); await expect(page.locator('#' + id)).toBeFocused(); }
  await page.keyboard.press('Enter');
  await expect(page.locator('#h2t')).toBeFocused();
  await page.locator('#districtChoices button').first().focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#h3t')).toBeFocused();
  expect(await page.evaluate(() => document.getElementById('h3t').getBoundingClientRect().top >= document.querySelector('.masthead').getBoundingClientRect().bottom - 1)).toBe(true);
});

test('focus is visible and reduced motion turns transitions off', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/'); await toConsole(page);
  for (const id of ['copyText', 'sent', 'nextOfficial']) {
    // Reach it by keyboard: browsers show focus rings for keyboard focus, not after a mouse click.
    await page.locator('#' + id).focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
    await expect(page.locator('#' + id)).toBeFocused();
    expect(await page.locator('#' + id).evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe('none');
  }
  expect(await page.locator('#progressBar').evaluate(e => getComputedStyle(e).transitionDuration)).toBe('0s');
});

test('the headline reflows at 320 CSS pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto('/'); await page.evaluate(async () => { await document.fonts.load('800 76px "Barlow Condensed"'); await document.fonts.ready; });
  expect(await fits(page)).toBe(true);
});

test('every step fits and passes accessibility checks at all review widths', async ({ page }) => {
  test.setTimeout(120000);
  for (const width of [320, 375, 430, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await page.goto('/'); await page.evaluate(() => document.fonts.ready);
    await page.fill('#detailName', 'Alexandra Gluesenkamp-Smithers'); await page.fill('#detailZip', '98589');
    expect(await fits(page)).toBe(true); await axe(page);
    await page.click('#done1');
    expect(await fits(page)).toBe(true); await axe(page);
    await page.click('#districtChoices [data-district="WA-03"]');
    for (const c of ['letter', 'call', 'social']) { await channel(page, c); expect(await fits(page)).toBe(true); }
    await axe(page);
    for (let i = 0; i < 5; i++) await send(page);
    await expect(page.locator('#finish')).toBeVisible();
    expect(await fits(page)).toBe(true); await axe(page);
    await page.click('#aboutLink'); await axe(page); await page.click('#closeAbout');
  }
});
