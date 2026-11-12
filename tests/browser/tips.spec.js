const { test, expect } = require('@playwright/test');
const { allowTipsHere, axe, fits } = require('./helpers');

// Every outside service is mocked: tests never reach the real Ko-fi or Lightning servers. Addresses come from
// campaign.js at run time so no file but campaign.js names them (tests/fork-safety.test.js).
async function mockServices(page, { price = 100000, fail = false } = {}) {
  const tips = await page.evaluate(() => window.CAMPAIGN_CONTENT.tips);
  const [user, domain] = tips.lightning.split('@');
  const calls = { lookup: 0, price: 0, invoices: [], kofi: 0 };
  await page.context().route(url => url.hostname === domain || url.href === tips.priceUrl || url.hostname.endsWith('ko-fi.com'), async route => {
    const url = new URL(route.request().url()), cors = { 'Access-Control-Allow-Origin': '*' };
    if (url.hostname.endsWith('ko-fi.com')) { calls.kofi++; return route.fulfill({ contentType: 'text/html', body: '<title>Ko-fi stand-in</title>Tip form' }); }
    if (url.href === tips.priceUrl) { calls.price++; return route.fulfill({ headers: cors, json: { rate: 1e8 / price / 1e3, price } }); }
    if (fail) return route.fulfill({ status: 500, headers: cors, body: 'down' });
    if (url.pathname === `/.well-known/lnurlp/${user}`) { calls.lookup++; return route.fulfill({ headers: cors, json: { tag: 'payRequest', callback: `https://${domain}/cb/abc`, minSendable: 1000, maxSendable: 2000000000, commentAllowed: 250, metadata: '[]' } }); }
    if (url.pathname === '/cb/abc') { calls.invoices.push(Object.fromEntries(url.searchParams)); return route.fulfill({ headers: cors, json: { pr: 'lnbc' + url.searchParams.get('amount') + 'test', routes: [] } }); }
    return route.fulfill({ status: 404 });
  });
  return { tips, calls };
}
async function openLightning(page) {
  await page.click('#tipjarBtn');
  await page.click('#tipDialog [aria-controls$="-ln"]');
  await expect(page.locator('#tipDialog [data-ln-qr] svg')).toBeVisible();
}
const status = page => page.locator('#tipDialog [data-ln-status]');

test('on any host not listed in campaign.js there is no tip jar and nothing else is contacted', async ({ page }) => {
  const outside = [];
  page.on('request', r => { if (new URL(r.url()).hostname !== '127.0.0.1') outside.push(r.url()); });
  await page.goto('/');
  await expect(page.locator('#tipjarBtn')).toBeHidden();
  await expect(page.locator('#finishTips')).toBeEmpty();
  await expect(page.locator('#tipPrivacy')).toBeHidden();
  await page.evaluate(() => { localStorage.setItem('leadership-wa-drafts-v3', JSON.stringify({ district: 'WA-01' })); localStorage.setItem('leadership-wa-actions-v3', JSON.stringify({ 'murray:letter': true, 'cantwell:letter': true, 'delbene:letter': true, 'conrad:letter': true, 'ferguson:letter': true })); });
  await page.reload();
  await expect(page.locator('#finish')).toBeVisible();
  await expect(page.locator('#finishTips')).toBeEmpty();
  expect(outside).toEqual([]);
});

test('on a listed host the tip jar appears, says what it contacts, and contacts nothing until used', async ({ page }) => {
  await allowTipsHere(page);
  const outside = [];
  page.on('request', r => { if (new URL(r.url()).hostname !== '127.0.0.1') outside.push(r.url()); });
  await page.goto('/');
  const { tips } = await mockServices(page);
  await expect(page.locator('#tipjarBtn')).toBeVisible();
  await expect(page.locator('#tipPrivacy')).toContainText(tips.lightning.split('@')[1]);
  await expect(page.locator('#tipPrivacy')).toContainText("Ko-fi's payment form loads only if you tap Ko-fi");
  await page.click('#tipjarBtn');
  await expect(page.locator('#tipDialog')).toBeVisible();
  await expect(page.locator('#tipDialog .third')).toHaveText('Ko-fi is a separate company. Tapping it loads their payment form, and their privacy policy applies.');
  await axe(page);
  expect(outside).toEqual([]);
});

test('Ko-fi loads only when tapped, and only one payment option is open at a time', async ({ page }) => {
  await allowTipsHere(page); await page.goto('/');
  const { tips, calls } = await mockServices(page);
  await page.click('#tipjarBtn');
  const frame = page.locator('#tipDialog .kofi iframe');
  await expect(frame).not.toHaveAttribute('src', /./);
  await page.click('#tipDialog [aria-controls$="-ln"]');
  await page.click('#tipDialog [aria-controls$="-kofi"]');
  await expect(page.locator('#tipDialog .ln')).toBeHidden();
  await expect(frame).toHaveAttribute('src', tips.kofi + '/?hidefeed=true&widget=true&embed=true&preview=true');
  await expect.poll(() => calls.kofi).toBe(1);
  await expect(page.locator('#tipDialog .kofi a')).toHaveAttribute('href', tips.kofi);
  await page.click('#tipDialog [aria-controls$="-kofi"]');
  await expect(page.locator('#tipDialog .kofi')).toBeHidden();
});

test('Lightning shows the address, then dollar invoices at the live price with an optional note', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await allowTipsHere(page); await page.goto('/');
  const { tips, calls } = await mockServices(page, { price: 100000 });
  await openLightning(page);
  await expect(page.locator('#tipDialog [data-ln-open]')).toHaveAttribute('href', 'lightning:' + tips.lightning);
  await page.click('#tipDialog [data-ln-copy="addr"]');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(tips.lightning);
  expect(calls.lookup + calls.price).toBe(0);
  await expect(page.locator('#tipDialog [data-usd]')).toHaveText(['$5', '$10', '$25']);
  await page.fill('#tipDialog [data-ln-note]', 'Keep going');
  await page.click('#tipDialog [data-usd="5"]');
  await expect(status(page)).toHaveText('Invoice for $5 (5,000 sats) is ready. Scan it or open your wallet.');
  expect(calls.invoices.at(-1)).toEqual({ amount: '5000000', comment: 'Keep going' });
  await expect(page.locator('#tipDialog [data-ln-open]')).toHaveAttribute('href', 'lightning:lnbc5000000test');
  await expect(page.locator('#tipDialog [data-ln-qr]')).toHaveAttribute('aria-label', 'QR code for a $5 Lightning invoice');
  await page.click('#tipDialog [data-ln-copy="pr"]');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('lnbc5000000test');
  // Tapping the chosen amount again goes back to the address.
  await page.click('#tipDialog [data-usd="5"]');
  await expect(page.locator('#tipDialog [data-ln-open]')).toHaveAttribute('href', 'lightning:' + tips.lightning);
  await page.click('#tipDialog [data-ln-other]');
  await expect(page.locator('#tipDialog [data-ln-usd]')).toBeFocused();
  await page.fill('#tipDialog [data-ln-usd]', '$12.50'); await page.keyboard.press('Enter');
  await expect(status(page)).toHaveText('Invoice for $12.50 (12,500 sats) is ready. Scan it or open your wallet.');
  await page.fill('#tipDialog [data-ln-usd]', '5000'); await page.keyboard.press('Enter');
  await expect(status(page)).toHaveText('Pick an amount between $0.01 and $2,000.');
  await page.fill('#tipDialog [data-ln-usd]', 'abc'); await page.keyboard.press('Enter');
  await expect(status(page)).toHaveText('Enter a dollar amount, like 15.');
  expect(calls.lookup).toBe(1); expect(calls.price).toBe(1);
  expect(await fits(page)).toBe(true);
  await axe(page);
});

test('a browser wallet can pay the invoice directly', async ({ page }) => {
  await page.addInitScript(() => { window.webln = { enable: async () => {}, sendPayment: async pr => { window.paid = pr; return { preimage: 'x' }; } }; });
  await allowTipsHere(page); await page.goto('/');
  await mockServices(page);
  await page.evaluate(() => { window.celebrated = 0; const c = window.celebrate; window.celebrate = () => { window.celebrated++; c(); }; });
  await openLightning(page);
  await page.click('#tipDialog [data-usd="10"]');
  await page.click('#tipDialog [data-ln-webln]');
  await expect(status(page)).toHaveText('Paid. Thank you!');
  expect(await page.evaluate(() => [window.paid, window.celebrated])).toEqual(['lnbc10000000test', 1]);
});

test('when the Lightning server is down, the address still works and the visitor is told plainly', async ({ page }) => {
  await allowTipsHere(page); await page.goto('/');
  const { tips } = await mockServices(page, { fail: true });
  await openLightning(page);
  await page.click('#tipDialog [data-usd="5"]');
  await expect(status(page)).toHaveText("Couldn't make an invoice just now. The address above still works.");
  await expect(page.locator('#tipDialog [data-ln-open]')).toHaveAttribute('href', 'lightning:' + tips.lightning);
  await expect(page.locator('#tipDialog [data-ln-copy="pr"]')).toBeHidden();
});

test('the finish screen carries the same tip jar', async ({ page }) => {
  await allowTipsHere(page);
  await page.addInitScript(() => { localStorage.setItem('leadership-wa-drafts-v3', JSON.stringify({ district: 'WA-01' })); localStorage.setItem('leadership-wa-actions-v3', JSON.stringify({ 'murray:letter': true, 'cantwell:letter': true, 'delbene:letter': true, 'conrad:letter': true, 'ferguson:letter': true })); });
  await page.goto('/');
  await expect(page.locator('#finishTips h2')).toHaveText('Keep the pressure on.');
  await page.click('#finishTips [aria-controls$="-ln"]');
  await expect(page.locator('#finishTips .ln')).toBeVisible();
  await expect(page.locator('#tipDialog .ln')).toBeHidden();
});
