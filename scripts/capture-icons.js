/* Rasterize the approved geometric evergreen without external image services. */
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch();
  try {
    const svg = fs.readFileSync(path.join(__dirname, '../assets/favicon.svg'), 'utf8');
    for (const [file, size] of [['favicon-16.png', 16], ['favicon-32.png', 32], ['apple-touch-icon.png', 180]]) {
      const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
      await page.setContent(`<style>html,body{margin:0;background:#191a17}svg{display:block;width:100vw;height:100vh}</style>${svg}`);
      await page.screenshot({ path: path.join(__dirname, '../assets', file) });
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
