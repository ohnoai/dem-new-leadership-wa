/* Render the approved campaign poster independently of the website. */
const { chromium } = require('@playwright/test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.join(__dirname, 'social-preview.html')).href);
    await page.evaluate(async () => { await document.fonts.ready; });
    const clipped = await page.locator('.poster').evaluate(poster => {
      const bounds = poster.getBoundingClientRect();
      return [...poster.querySelectorAll('.brand,.washington,.headline span,.tagline,.ask span')].some(el => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const r = range.getBoundingClientRect();
        return r.left < bounds.left || r.right > bounds.right || r.top < bounds.top || r.bottom > bounds.bottom;
      });
    });
    if (clipped) throw new Error('Social preview would clip text');
    const output = path.resolve(__dirname, '../assets/social-preview.png');
    await page.screenshot({ path: output });
    console.log(output);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
