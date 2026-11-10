const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('production metadata and evergreen icon sizes are complete', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://demreset.com/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://demreset.com/');
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', 'https://demreset.com/assets/social-preview.png');
  for (const [name,size] of [['favicon-16.png',16],['favicon-32.png',32],['apple-touch-icon.png',180]]) {
    const response=await request.get('/assets/'+name);expect(response.ok()).toBe(true);expect(response.headers()['content-type']).toBe('image/png');
    const bytes=await response.body();expect(bytes.readUInt32BE(16)).toBe(size);expect(bytes.readUInt32BE(20)).toBe(size);
  }
});
test('desktop personalization gives long names full sidebar width and version label spacing',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/');await page.locator('#yourDetails').evaluate(e=>e.open=true);
  const fields=await page.evaluate(()=>({name:document.querySelector('#detailName').getBoundingClientRect().width,grid:document.querySelector('.details-grid').getBoundingClientRect().width,label:document.querySelector('label[for="letterVersion"]')}));
  expect(fields.name).toBeGreaterThan(200);
  const label=await page.locator('label[for="letterVersion"]').evaluate(e=>({weight:getComputedStyle(e).fontWeight,display:getComputedStyle(e).display,top:parseFloat(getComputedStyle(e).marginTop)}));
  expect(Number(label.weight)).toBeGreaterThanOrEqual(700);expect(label.display).toBe('block');expect(label.top).toBeGreaterThanOrEqual(16);
});
test('interaction styles retain accessible focus and respect reduced motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator('#copyMessage').focus();
  expect(await page.locator('#copyMessage').evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
  expect(await page.locator('#copyMessage').evaluate(e=>getComputedStyle(e).transitionDuration)).toBe('0s');
  await page.locator('#copyMessage').evaluate(e=>e.disabled=true);
  expect(await page.locator('#copyMessage').evaluate(e=>getComputedStyle(e).cursor)).toBe('not-allowed');
});
test('polished expanded workflow fits all review widths with accessible channels', async ({page}) => {
  for (const width of [320,375,430,768,1440,1920]) {
    await page.setViewportSize({width,height:1000});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
    await page.locator('#yourDetails').evaluate(e=>e.open=true);
    for(const channel of ['letter','call','social']) {
      await page.locator('#channel').selectOption(channel);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  }
});
