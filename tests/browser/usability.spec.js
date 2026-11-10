const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

for (const width of [320, 375, 430, 768, 1440, 1920]) test(`three clear steps and visible optional details at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('/');
  await expect(page.locator('#yourDetailsHeading')).toHaveText('1. Your details (optional)');
  await expect(page.locator('.chooser h2').first()).toHaveText('2. Choose an official');
  await expect(page.locator('.editor-heading h2')).toHaveText('3. Take action');
  for (const id of ['detailName', 'detailCity', 'detailCounty', 'detailZip']) {
    await expect(page.locator('#' + id)).toBeVisible();
    expect(await page.locator('#' + id).evaluate(el => !!el.closest('details'))).toBe(false);
  }
  const layout = await page.evaluate(() => {
    const box = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
    return { details: box('#yourDetails'), chooser: box('.chooser'), editor: box('.editor'), workspace: box('#action') };
  });
  expect(layout.details.y).toBeLessThan(layout.chooser.y);
  if (width >= 800) {
    expect(layout.details.width).toBe(layout.workspace.width);
    expect(layout.editor.x).toBeGreaterThan(layout.chooser.x);
    expect(layout.editor.width).toBeGreaterThan(layout.chooser.width);
  } else expect(layout.chooser.y).toBeLessThan(layout.editor.y);
});

test('district lookup is optional and visible, selects a Democrat and explains Republican districts', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#districtFinder')).toBeVisible();
  await expect(page.locator('#district')).toBeVisible();
  await expect(page.locator('#districtDetails')).toContainText('either senator');
  await page.locator('#district').selectOption('WA-07');
  await expect(page.locator('#official')).toHaveValue('jayapal');
  await expect(page.locator('#officialName')).toHaveText('Pramila Jayapal');
  await expect(page.locator('#message')).toHaveValue(/^Dear Representative Jayapal,/);
  await page.locator('#district').selectOption('WA-04');
  await expect(page.locator('#districtNotice')).toContainText('cannot vote');
  await expect(page.locator('#official')).toHaveValue('murray');
  await expect(page.locator('#official option[value="newhouse"]')).toHaveCount(0);
});

test('native choices support keyboard navigation, persistence and visible focus', async ({ page }) => {
  await page.goto('/');
  await page.locator('#detailName').focus();
  for (const id of ['detailCity', 'detailCounty', 'detailZip', 'official']) {
    await page.keyboard.press('Tab');
    await expect(page.locator('#' + id)).toBeFocused();
  }
  await page.getByRole('radio', { name: 'Letter', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Call', exact: true })).toBeChecked();
  await expect(page.locator('#callPanel')).toBeVisible();
  expect(await page.getByRole('radio', { name: 'Call', exact: true }).evaluate(el => getComputedStyle(el.nextElementSibling).outlineStyle)).toBe('solid');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#socialPanel')).toBeVisible();
  await page.getByRole('radio', { name: 'Letter', exact: true }).check();
  await page.getByRole('radio', { name: 'Full letter', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Concise', exact: true })).toBeChecked();
  await page.locator('#message').fill('Keyboard concise draft');
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Concise', exact: true })).toBeChecked();
  await expect(page.locator('#message')).toHaveValue('Keyboard concise draft');
});

test('the complete call script is readable without an inner scroll area', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.goto('/');
  await page.getByRole('radio', { name: 'Call', exact: true }).check();
  expect(await page.locator('#callScript').evaluate(el => el.clientHeight >= el.scrollHeight)).toBe(true);
  await page.locator('#callScript').fill('A longer personal call script. '.repeat(80));
  expect(await page.locator('#callScript').evaluate(el => el.clientHeight >= el.scrollHeight)).toBe(true);
});

test('advanced editing is separate, while limits and primary actions stay visible', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('.shared').evaluate(el => !!el.closest('#action'))).toBe(false);
  await expect(page.locator('#sharedMessage')).toBeHidden();
  await expect(page.locator('.action-assurance')).toHaveText('Nothing is sent or posted automatically.');
  await page.locator('#official').selectOption('jayapal');
  await page.locator('#message').fill('x'.repeat(2001));
  await expect(page.locator('#limitWarning')).toBeVisible();
  await expect(page.locator('#limitWarning')).toContainText('verified form limit');
  await expect(page.locator('#copyMessage')).toBeVisible();
  await expect(page.locator('#contactLink')).toBeVisible();
  await expect(page.locator('#formCompatibility')).toBeHidden();
  await page.getByText('About this contact form', { exact: true }).click();
  await expect(page.locator('#formCompatibility')).toBeVisible();
  await page.getByText('Advanced editing', { exact: true }).click();
  await expect(page.locator('#sharedMessage')).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});
