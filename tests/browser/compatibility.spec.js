const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('letter counters stay visible and never truncate text', async ({ page }) => {
  await page.goto('/');
  const original = await page.locator('#message').inputValue();
  await expect(page.locator('#messageCount')).toHaveText(`${original.length.toLocaleString('en-US')} characters`);
  const long = 'A'.repeat(12000);
  await page.locator('#message').fill(long);
  await expect(page.locator('#messageCount')).toContainText('12,000');
  await expect(page.locator('#message')).toHaveValue(long);
  await expect(page.locator('#message')).not.toHaveAttribute('maxlength', /./);
  await page.locator('#subject').fill('My edited subject');
  await expect(page.locator('#subjectCount')).toContainText('17');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('full and concise edits survive version changes, recipient changes, refresh and copy', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.locator('#message').fill('Full Murray personal letter');
  await page.locator('#subject').fill('Full subject');
  await page.locator('#letterVersion').selectOption('concise');
  await expect(page.locator('#message')).toHaveValue(/Dear Senator Murray,/);
  await expect(page.locator('#message')).not.toHaveValue('Full Murray personal letter');
  await page.locator('#message').fill('Concise Murray personal letter');
  await page.locator('#subject').fill('Concise subject');
  await page.locator('#copyMessage').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Concise Murray personal letter');
  await page.locator('#official').selectOption('cantwell');
  await expect(page.locator('#message')).toHaveValue(/Dear Senator Cantwell,/);
  await page.locator('#official').selectOption('murray');
  await page.reload();
  await expect(page.locator('#letterVersion')).toHaveValue('concise');
  await expect(page.locator('#message')).toHaveValue('Concise Murray personal letter');
  await page.locator('#letterVersion').selectOption('full');
  await expect(page.locator('#message')).toHaveValue('Full Murray personal letter');
  await expect(page.locator('#subject')).toHaveValue('Full subject');
  await page.locator('#letterVersion').selectOption('concise');
  await expect(page.locator('#subject')).toHaveValue('Concise subject');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.locator('#useShared').click();
  await expect(page.locator('#message')).toHaveValue(/Dear Senator Murray,/);
  await page.locator('#letterVersion').selectOption('full');
  await expect(page.locator('#message')).toHaveValue('Full Murray personal letter');
});

test('only verified recipient limits warn, including exact and exceeded boundaries', async ({ page }) => {
  await page.route('**/data.js', async route => {
    const response = await route.fetch();
    const source = await response.text();
    await route.fulfill({ response, body: source + `\nwindow.CAMPAIGN.officials[0].form = { message: { status: 'verified', limit: 20 }, subject: { status: 'unverified', limit: 3 } };` });
  });
  await page.goto('/');
  await page.locator('#message').fill('x'.repeat(20));
  await expect(page.locator('#messageCount')).toHaveText('20 / 20 characters');
  await expect(page.locator('#limitWarning')).toBeHidden();
  await page.locator('#message').fill('x'.repeat(21));
  await expect(page.locator('#limitWarning')).toContainText('Message exceeds');
  await expect(page.locator('#message')).toHaveValue('x'.repeat(21));
  await expect(page.locator('#subjectCount')).not.toContainText('/ 3');
  await page.locator('#official').selectOption('cantwell');
  await expect(page.locator('#limitWarning')).toBeHidden();
});

test('version switching keeps imported full text and completion independent', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('new-leadership-wa-v2', JSON.stringify({ drafts: { senate: { message: 'Dear wrong recipient, preserve original', subject: 'Imported subject' } } })));
  await page.goto('/');
  await expect(page.locator('#message')).toHaveValue('Dear wrong recipient, preserve original');
  await page.locator('#completed').check();
  await page.locator('#letterVersion').selectOption('concise');
  await expect(page.locator('#message')).toHaveValue(/Dear Senator Murray,/);
  await expect(page.locator('#completed')).toBeChecked();
  await page.locator('#letterVersion').selectOption('full');
  await expect(page.locator('#message')).toHaveValue('Dear wrong recipient, preserve original');
  await expect(page.locator('#reviewedRecipient')).not.toBeChecked();
});

test('verified live limits match newline conventions without modifying drafts', async ({ page }) => {
  await page.goto('/');
  await page.locator('#official').selectOption('baumgartner');
  await page.locator('#message').fill('a\nb😀');
  await expect(page.locator('#messageCount')).toHaveText('6 / 2,000 characters');
  await page.locator('#official').selectOption('jayapal');
  await page.locator('#message').fill('a\nb😀');
  await expect(page.locator('#messageCount')).toHaveText('5 / 2,000 characters');
  await page.locator('#subject').fill('s'.repeat(401));
  await expect(page.locator('#limitWarning')).toContainText('Subject exceeds');
  await page.reload();
  await expect(page.locator('#subject')).toHaveValue('s'.repeat(401));
});

test('shared editing follows the selected version without changing full priorities', async ({ page }) => {
  await page.goto('/');
  const full = await page.locator('#message').inputValue();
  await page.locator('#letterVersion').selectOption('concise');
  await page.getByText('Shared message', { exact: true }).click();
  await page.locator('#sharedMessage').fill('Concise shared edit');
  await expect(page.locator('#message')).toHaveValue(/Concise shared edit/);
  await page.locator('#official').selectOption('cantwell');
  await expect(page.locator('#message')).toHaveValue(/Concise shared edit/);
  await page.locator('#official').selectOption('murray');
  await page.locator('#letterVersion').selectOption('full');
  await expect(page.locator('#message')).toHaveValue(full);
});

test('switching versions in a stale tab preserves the actionable conflict warning', async ({ page, context }) => {
  await page.goto('/');
  await page.locator('#message').fill('Saved baseline');
  const other = await context.newPage(); await other.goto('/');
  await page.locator('#message').fill('Newer saved letter');
  await other.locator('#letterVersion').selectOption('concise');
  await expect(other.locator('#feedback')).toContainText('Copy any edits');
  await expect(other.locator('#feedback')).not.toContainText('kept on this device');
});
