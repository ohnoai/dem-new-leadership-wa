const { chromium } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const url = process.env.PREVIEW_URL || 'http://127.0.0.1:4188';
  const directory = path.resolve('tmp/review/three-step-workflow');
  fs.mkdirSync(directory, { recursive: true });
  const browser = await chromium.launch();
  const entries = [], checks = [];
  try {
    for (const width of [320, 375, 430, 768, 1440, 1920]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(directory, `after-${width}-page.png`), fullPage: true });
      await page.locator('.start-action').click();
      await page.locator('#action').evaluate(el => el.blur());
      await page.screenshot({ path: path.join(directory, `after-${width}-action.png`) });
      entries.push({ width, file: `after-${width}-action.png`, title: `After: ${width}px action workspace` });
      entries.push({ width, file: `after-${width}-page.png`, title: `After: ${width}px full page` });
      checks.push({ width, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), errors });
      if ([375, 1440].includes(width)) {
        for (const channel of ['call', 'social']) {
          await page.locator(`input[name="channel"][value="${channel}"]`).check();
          await page.locator('.editor').scrollIntoViewIfNeeded();
          await page.screenshot({ path: path.join(directory, `after-${width}-${channel}.png`) });
          entries.push({ width, file: `after-${width}-${channel}.png`, title: `After: ${width}px ${channel}` });
        }
        const beforeContext = await browser.newContext({ viewport: { width, height: 1000 } });
        const before = await beforeContext.newPage();
        for (const file of ['index.html', 'styles.css', 'app.js', 'presentation.js']) {
          const body = execFileSync('git', ['show', `origin/main:${file}`], { encoding: 'utf8' });
          await before.route(file === 'index.html' ? url + '/' : `${url}/${file}`, route => route.fulfill({ body, contentType: file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : 'text/javascript' }));
        }
        await before.goto(url);
        await before.evaluate(() => document.fonts.ready);
        await before.locator('.start-action').click();
        await before.locator('#action').evaluate(el => el.blur());
        await before.screenshot({ path: path.join(directory, `before-${width}-action.png`) });
        entries.push({ width, file: `before-${width}-action.png`, title: `Before (origin/main): ${width}px action workspace` });
        await beforeContext.close();
      }
      await context.close();
    }
    fs.writeFileSync(path.join(directory, 'checks.json'), JSON.stringify(checks, null, 2));
    fs.writeFileSync(path.join(directory, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><title>DEM RESET workflow review</title><style>body{margin:24px;background:#191a17;color:#f2f0e8;font:16px Arial}section{margin:32px 0}img{max-width:100%;height:auto;border:1px solid #63655b}a{color:#d6fb35}</style><h1>DEM RESET workflow review</h1><p>Local browser-emulated evidence, not human usability validation.</p>${entries.map(entry => `<section><h2>${entry.title}</h2><a href="${entry.file}">Open original</a><br><img loading="lazy" src="${entry.file}" alt="${entry.title}" style="width:${Math.min(entry.width, 1184)}px"></section>`).join('')}</html>`);
    console.log(JSON.stringify({ directory, screenshots: entries.length, checks }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
