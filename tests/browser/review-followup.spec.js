const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('audited non-text subjects hide copy without deleting either subject version', async ({ page }) => {
  await page.goto('/');
  for (const [id, explanation] of [['strickland', /No separate subject/], ['ferguson', /Select a subject category/]]) {
    await page.locator('#official').selectOption(id);
    await expect(page.locator('#copySubject')).toBeHidden();
    await expect(page.locator('#subjectHelp')).toContainText(explanation);
    await page.locator('#subject').fill(`${id} full subject retained`);
    await page.getByRole('radio', { name: 'Concise', exact: true }).check();
    await page.locator('#subject').fill(`${id} concise subject retained`);
    await page.locator('#official').selectOption('murray');
    await expect(page.locator('#copySubject')).toBeVisible();
    await page.locator('#official').selectOption(id);
    await page.reload();
    await expect(page.locator('#subject')).toHaveValue(`${id} concise subject retained`);
    await page.getByRole('radio', { name: 'Full letter', exact: true }).check();
    await expect(page.locator('#subject')).toHaveValue(`${id} full subject retained`);
  }
  for (const id of ['murray', 'cantwell', 'delbene', 'jayapal']) {
    await page.locator('#official').selectOption(id);
    await expect(page.locator('#copySubject')).toBeVisible();
    await expect(page.locator('#subjectHelp')).toBeHidden();
  }
});

test('Perez advisory is reported not verified and retains over-limit full and concise drafts', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.locator('#official').selectOption('perez');
  await expect(page.locator('#messageCount')).toContainText('/ 2,000 characters (user-reported advisory)');
  await page.locator('#message').fill('x'.repeat(2000));
  await expect(page.locator('#limitWarning')).toBeHidden();
  const full = 'x'.repeat(2001);
  await page.locator('#message').fill(full);
  await expect(page.locator('#limitWarning')).toContainText('user-reported advisory');
  await expect(page.locator('#limitWarning')).toContainText('not independently verified');
  await expect(page.locator('#limitWarning')).not.toContainText('verified form limit');
  await page.locator('#copyMessage').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(full);
  await page.locator('#completed').check();
  await page.getByRole('radio', { name: 'Concise', exact: true }).check();
  const concise = await page.locator('#message').inputValue();
  expect(concise.replace(/\r?\n/g, '\r\n').length).toBeGreaterThanOrEqual(700);
  expect(concise.replace(/\r?\n/g, '\r\n').length).toBeLessThanOrEqual(900);
  await page.locator('#message').fill('c'.repeat(2100));
  await page.reload();
  await expect(page.locator('#message')).toHaveValue('c'.repeat(2100));
  await expect(page.locator('#limitWarning')).toContainText('user-reported advisory');
  await expect(page.locator('#completed')).toBeChecked();
  await page.locator('#official').selectOption('murray');
  await expect(page.locator('#messageCount')).not.toContainText('/ 2,000');
  await page.locator('#official').selectOption('perez');
  await page.getByRole('radio', { name: 'Full letter', exact: true }).check();
  await expect(page.locator('#message')).toHaveValue(full);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.locator('#official').selectOption('jayapal');
  await page.locator('#message').fill(full);
  await expect(page.locator('#limitWarning')).toContainText('verified form limit');
  await expect(page.locator('#messageCount')).not.toContainText('user-reported');
});
