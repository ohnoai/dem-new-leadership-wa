const { test, expect } = require('@playwright/test');
const { send, toConsole, preview, channel, version, goTo, edit, stored, draftKey, axe, fits } = require('./helpers');

async function start(page, district = 'WA-01') { await page.goto('/'); await toConsole(page, district); }
const clip = page => page.evaluate(() => navigator.clipboard.readText()).then(t => t.replace(/\r\n/g, '\n'));

test('full and concise edits survive version changes, official changes, refresh and copy', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await start(page);
  await edit(page, { subject: 'Full subject', body: 'Full Murray personal letter' });
  await version(page, 'concise');
  await expect(preview(page)).toContainText('Dear Senator Murray,');
  await edit(page, { subject: 'Concise subject', body: 'Concise Murray personal letter' });
  await page.click('#copyText');
  expect(await clip(page)).toBe('Concise Murray personal letter');
  await page.click('#copySubject');
  expect(await clip(page)).toBe('Concise subject');
  await goTo(page, 'Maria Cantwell');
  await expect(preview(page)).toContainText('Dear Senator Cantwell,');
  await goTo(page, 'Patty Murray');
  await page.reload();
  await expect(page.locator('[data-version="concise"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(preview(page)).toHaveText('Concise Murray personal letter');
  await version(page, 'full');
  await expect(preview(page)).toHaveText('Full Murray personal letter');
  await expect(page.locator('#subjectText')).toHaveText('Full subject');
  await axe(page);
});

test('reset to original restores this letter only, keeping other channels, officials and progress', async ({ page }) => {
  await start(page);
  await edit(page, { body: 'Custom Murray letter', subject: 'Custom Murray subject' });
  await channel(page, 'call'); await edit(page, { body: 'Custom Murray call' });
  await channel(page, 'letter'); await send(page);
  await expect(page.locator('#officialName')).toHaveText('Maria Cantwell');
  await edit(page, { body: 'Custom Cantwell letter' });
  await goTo(page, 'Patty Murray');
  await page.click('#editText'); await page.click('#resetText');
  await expect(page.locator('#editBody')).toHaveValue(/^Dear Senator Murray,/);
  await page.click('#saveText');
  await expect(preview(page)).toContainText("I'm writing as your constituent");
  await expect(page.locator('#subjectText')).toHaveText('Oppose Chuck Schumer for Democratic leader');
  await expect(page.locator('#officialList li').first()).toHaveText('✓ Patty Murray');
  await channel(page, 'call'); await expect(preview(page)).toHaveText('Custom Murray call');
  await goTo(page, 'Maria Cantwell'); await channel(page, 'letter');
  await expect(preview(page)).toHaveText('Custom Cantwell letter');
  // Cancel leaves the text alone.
  await page.click('#editText'); await page.fill('#editBody', 'Not saved'); await page.click('#cancelEdit');
  await expect(preview(page)).toHaveText('Custom Cantwell letter');
});

test('your details fill the letter and call, follow later changes, and never leak into saved prose', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  for (const [id, v] of [['detailName', 'Jane Smith'], ['detailCity', 'Centralia'], ['detailCounty', 'Lewis County'], ['detailZip', '98531']]) await page.fill('#' + id, v);
  await toConsole(page, 'WA-03');
  await expect(preview(page)).toContainText('Jane Smith\nCentralia, Lewis County, WA 98531');
  const text = await preview(page).textContent();
  await edit(page, { body: text.replace("I'm writing as your constituent", 'My neighbors and I are writing as constituents') });
  await page.click('[data-change="1"]'); await page.fill('#detailName', 'Alex Smith'); await page.click('#done1');
  await expect(preview(page)).toContainText('My neighbors');
  await expect(preview(page)).toContainText('Alex Smith');
  const raw = (await stored(page, draftKey)).personal.murray.message;
  expect(raw).toContain('[Your name]'); expect(raw).not.toContain('Jane Smith');
  await page.click('#copyText');
  expect(await clip(page)).toBe(await preview(page).textContent());
  // A hand-typed signature is kept even when the details change again.
  await edit(page, { body: (await preview(page).textContent()).replace('Alex Smith', 'Manual signature') });
  await page.click('[data-change="1"]'); await page.fill('#detailName', 'Someone else'); await page.click('#done1');
  await expect(preview(page)).toContainText('Manual signature');
  await channel(page, 'call'); await expect(preview(page)).toContainText('Someone else');
  await expect(preview(page)).toContainText('Centralia');
  await channel(page, 'social'); await expect(preview(page)).not.toContainText(/Someone else|Centralia|98531/);
});

test('every official has the right greeting, request, contact form and phone', async ({ page }) => {
  await page.goto('/');
  const officials = await page.evaluate(() => window.CAMPAIGN.officials.filter(o => o.active !== false));
  for (const o of officials) {
    await page.evaluate(d => localStorage.setItem('leadership-wa-drafts-v3', JSON.stringify({ district: d, selected: '' })), o.group === 'house' ? o.district : 'WA-01');
    await page.reload(); await goTo(page, o.name); await channel(page, 'letter');
    await expect(page.locator('#contactLink')).toHaveAttribute('href', o.website);
    const text = await preview(page).textContent();
    expect(text).toContain(o.greeting || o.name.split(' ').at(-1));
    expect(text).toMatch(o.vote === 'senate' ? /oppose Chuck Schumer/ : o.vote === 'house' ? /oppose Hakeem Jeffries/ : /(?:do not|don't) vote in either (?:congressional )?caucus/);
    await channel(page, 'call');
    await expect(page.locator('#contactLink')).toHaveAttribute('href', 'tel:+1' + o.phone.replace(/\D/g, ''));
    await expect(page.locator('#contactLink')).toHaveText('Call ' + o.phone);
    await channel(page, 'social');
    await expect(preview(page)).toHaveText(new RegExp('^' + o.name + ':'));
    if (o.social) await expect(page.locator('#contactLink')).toHaveAttribute('href', o.social);
    else await expect(page.locator('#contactLink')).toBeHidden();
  }
});

test('the Gluesenkamp Perez greeting keeps the compound surname', async ({ page }) => {
  await start(page, 'WA-03'); await goTo(page, 'Marie Gluesenkamp Perez');
  await expect(preview(page)).toHaveText(/^Dear Representative Gluesenkamp Perez,/);
});

test('offices without a subject box explain what to do instead and keep both saved subjects', async ({ page }) => {
  await start(page, 'WA-10');
  for (const [name, explanation] of [['Marilyn Strickland', /No separate subject/], ['Bob Ferguson', /Select a subject category/]]) {
    await goTo(page, name);
    await expect(page.locator('#copySubject')).toBeHidden();
    await expect(page.locator('#subjectHelp')).toContainText(explanation);
    await version(page, 'full'); await edit(page, { subject: `${name} full subject` });
    await version(page, 'concise'); await edit(page, { subject: `${name} concise subject` });
    await page.reload();
    await expect(page.locator('#subjectText')).toHaveText(`${name} concise subject`);
    await version(page, 'full'); await expect(page.locator('#subjectText')).toHaveText(`${name} full subject`);
  }
  for (const name of ['Patty Murray', 'Maria Cantwell']) {
    await goTo(page, name);
    await expect(page.locator('#copySubject')).toBeVisible(); await expect(page.locator('#subjectHelp')).toBeHidden();
  }
});

test('a form limit warns only when edited text passes it, says whether it is verified, and never shortens', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await start(page, 'WA-03'); await goTo(page, 'Marie Gluesenkamp Perez');
  await expect(page.locator('#limitWarning')).toBeHidden();
  await edit(page, { body: 'x'.repeat(2000) });
  await expect(page.locator('#limitWarning')).toBeHidden();
  const long = 'x'.repeat(2001);
  await edit(page, { body: long });
  await expect(page.locator('#limitWarning')).toContainText('2,001 characters');
  await expect(page.locator('#limitWarning')).toContainText('reported by a user, not verified');
  await page.click('#copyText'); expect(await clip(page)).toBe(long);
  await page.reload(); await expect(preview(page)).toHaveText(long);
  await expect(page.locator('#limitWarning')).toBeVisible();
  await goTo(page, 'Patty Murray'); await expect(page.locator('#limitWarning')).toBeHidden();
  await page.evaluate(() => localStorage.setItem('leadership-wa-drafts-v3', JSON.stringify({ ...JSON.parse(localStorage.getItem('leadership-wa-drafts-v3')), district: 'WA-07' })));
  await page.reload(); await goTo(page, 'Pramila Jayapal');
  await edit(page, { body: long });
  await expect(page.locator('#limitWarning')).not.toContainText('not verified');
  await edit(page, { subject: 's'.repeat(401) });
  await expect(page.locator('#limitWarning')).toContainText('This subject is 401 characters');
});

test('a verified line-break rule counts each line break as two characters', async ({ page }) => {
  await page.route('**/data.js', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + "\nwindow.CAMPAIGN.officials.find(o => o.id === 'murray').form = { message: { status: 'verified', limit: 5, newlines: 'crlf' } };" });
  });
  await start(page);
  await edit(page, { body: 'a\nbc' }); // 5 characters with a two-character line break: at the limit
  await expect(page.locator('#limitWarning')).toBeHidden();
  await edit(page, { body: 'a\nbcd' });
  await expect(page.locator('#limitWarning')).toContainText('6 characters');
});

test('clipboard failure selects the text for a manual copy without claiming success', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } });
    document.execCommand = () => false;
  });
  await start(page);
  const original = await preview(page).textContent();
  await page.click('#copyText');
  await expect(page.locator('#feedback')).toContainText('Clipboard unavailable');
  await expect(page.locator('#editBody')).toBeFocused();
  expect(await page.locator('#editBody').evaluate(el => el.selectionEnd - el.selectionStart)).toBe(original.length);
  await page.click('#cancelEdit');
  await page.click('#copySubject');
  await expect(page.locator('#editSubject')).toBeFocused();
  expect(await page.locator('#editSubject').evaluate(el => el.selectionEnd - el.selectionStart)).toBe((await page.locator('#editSubject').inputValue()).length);
  await page.click('#cancelEdit');
  await expect(preview(page)).toHaveText(original);
});

test('a slow copy never reports success after you move to another official', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: text => { window.copyPayload = text; return new Promise(resolve => { window.finishCopy = resolve; }); } } }));
  await start(page);
  await edit(page, { body: 'Murray private letter' });
  await page.click('#copyText');
  await page.click('#nextOfficial');
  await page.evaluate(async () => { window.finishCopy(); await new Promise(r => setTimeout(r, 0)); });
  expect(await page.evaluate(() => window.copyPayload)).toBe('Murray private letter');
  await expect(page.locator('#feedback')).toBeEmpty();
  await expect(page.locator('#officialList li').first()).toHaveText('Patty Murray');
});

test('the edit dialog and every channel are accessible and fit small screens', async ({ page }) => {
  await start(page);
  for (const c of ['letter', 'call', 'social']) { await channel(page, c); await axe(page); expect(await fits(page)).toBe(true); }
  await page.click('#editText'); await axe(page);
  await expect(page.locator('#editBody')).toHaveAccessibleName(/Post/);
});
