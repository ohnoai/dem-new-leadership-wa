/* Capture the campaign hero without changing the production layout. */
const { chromium } = require('@playwright/test');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 1 });
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.addStyleTag({ content: `
      .skip,.progress-link,.start-action,.hero-note,.workspace,.about,footer,noscript{display:none!important}
      .masthead{position:static}.header-inner{height:76px}
      .hero{padding:24px 0 32px}.hero h1{font-size:128px;line-height:.87;margin:24px 0 28px}
      .hero-bottom{gap:56px}.hero-argument h2{font-size:28px;margin:0}
    ` });
    const bounds = await page.locator('.hero').boundingBox();
    if (bounds.y + bounds.height > 640) throw new Error('Social preview would clip the hero');
    const output = path.resolve(__dirname, '../assets/social-preview.png');
    await page.screenshot({ path: output });
    console.log(output);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
