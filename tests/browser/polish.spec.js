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
test('desktop personalization spans the workspace with native labelled radio options',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await page.goto('/');
  await expect(page.locator('#detailName')).toBeVisible();
  const fields=await page.evaluate(()=>({name:document.querySelector('#detailName').getBoundingClientRect().width,details:document.querySelector('#yourDetails').getBoundingClientRect(),workspace:document.querySelector('#action').getBoundingClientRect()}));
  expect(fields.name).toBeGreaterThan(200);
  expect(Math.abs(fields.details.left-fields.workspace.left)).toBeLessThanOrEqual(2);
  expect(Math.abs(fields.details.width-fields.workspace.width)).toBeLessThanOrEqual(2);
  for(const [name,labels] of [['channel',['Letter','Call','Social']],['letterVersion',['Full letter','Concise']]]) {
    await expect(page.locator('#'+name)).toHaveJSProperty('tagName','FIELDSET');
    for(const label of labels) {
      const option=page.getByRole('radio',{name:label,exact:true});
      await expect(option).toBeVisible();
      await expect(option).toHaveAttribute('type','radio');
      await expect(option).toHaveAttribute('name',name);
    }
  }
  await expect(page.getByRole('radio',{name:'Letter',exact:true})).toBeChecked();
  await expect(page.getByRole('radio',{name:'Full letter',exact:true})).toBeChecked();
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
    await expect(page.locator('#detailName')).toBeVisible();
    for(const channel of ['letter','call','social']) {
      await page.locator('input[name="channel"][value="'+channel+'"]').check();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  }
});
