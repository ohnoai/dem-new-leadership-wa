const { test, expect } = require('@playwright/test');
const { toConsole, preview, channel, goTo, stored, draftKey, actionKey } = require('./helpers');

// Owner requirements (2026-11-11). These guard the design itself; change them only with the owner's say-so.
test.describe('requirement guards', () => {
  test('a first visit shows three numbered steps in order with step 1 open and its fields visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.step h2')).toHaveText(['Your details', 'Your district', 'Contact your officials']);
    await expect(page.locator('.step .num')).toHaveText(['1', '2', '3']);
    await expect(page.locator('#s1')).toHaveAttribute('data-state', 'active');
    await expect(page.locator('#s2')).toHaveAttribute('data-state', 'locked');
    await expect(page.locator('#s3')).toHaveAttribute('data-state', 'locked');
    // Never collapse an incomplete step: the details are on screen, not behind an accordion.
    for (const id of ['detailName', 'detailCity', 'detailCounty', 'detailZip']) await expect(page.locator('#' + id)).toBeVisible();
    await expect(page.locator('#s1 details, #s1 summary')).toHaveCount(0);
    await expect(page.locator('#done1')).toBeVisible();
  });

  test('your list is only your own officials, and never a Republican', async ({ page }) => {
    await page.goto('/');
    const all = await page.evaluate(() => window.CAMPAIGN.officials);
    for (const rep of all.filter(o => o.group === 'house')) {
      await page.evaluate(d => localStorage.setItem('leadership-wa-drafts-v3', JSON.stringify({ district: d })), rep.district);
      await page.reload();
      const names = await page.locator('#officialList li').allTextContents();
      const expected = all.filter(o => o.party === 'Democratic' && (o.group !== 'house' || o.id === rep.id)).map(o => o.name);
      expect(names).toEqual(expected);
      for (const r of all.filter(o => o.party === 'Republican')) expect(names).not.toContain(r.name);
    }
  });

  test('letter, call and post text is exactly what the unchanged model produces', async ({ page }) => {
    await page.goto('/');
    await page.fill('#detailName', 'Alex Smith'); await page.fill('#detailCity', 'Olympia'); await page.fill('#detailCounty', 'Thurston'); await page.fill('#detailZip', '98501');
    await toConsole(page, 'WA-10');
    for (const v of ['full', 'concise']) {
      await channel(page, 'letter'); await page.locator(`[data-version="${v}"]`).click();
      for (const name of ['Patty Murray', 'Maria Cantwell', 'Marilyn Strickland', 'Shasti Conrad', 'Bob Ferguson']) {
        await goTo(page, name);
        const expected = await page.evaluate(({ name, v }) => {
          const M = window.ActionModel, T = window.CAMPAIGN_CONTENT, o = window.CAMPAIGN.officials.find(x => x.name === name);
          const st = M.create(T.shared, T.concise.shared); st.letterVersion = v;
          st.details = { name: 'Alex Smith', city: 'Olympia', county: 'Thurston', zip: '98501' };
          const d = M.draft(st, o, T);
          return { subject: d.subject, letter: d.message, call: M.call(st, o, T) };
        }, { name, v });
        // Exact comparison: toHaveText would collapse whitespace and hide a changed blank line.
        await channel(page, 'letter');
        expect(await preview(page).textContent()).toBe(expected.letter);
        expect(await page.locator('#subjectText').textContent()).toBe(expected.subject);
        expect(expected.letter).toContain('Alex Smith');
        await channel(page, 'call');
        expect(await preview(page).textContent()).toBe(expected.call);
      }
    }
  });
});

test('a ZIP inside one district asks to confirm it, with the exact-address finder one tap away', async ({ page }) => {
  await page.goto('/');
  await page.fill('#detailZip', '98501');
  await page.click('#done1');
  await expect(page.locator('#s1')).toHaveAttribute('data-state', 'done');
  await expect(page.locator('#sum1')).toHaveText('✓ 98501');
  await expect(page.locator('#matchLabel')).toHaveText('ZIP 98501 is most likely WA-10. Your representative:');
  await expect(page.locator('#matchName')).toHaveText('Marilyn Strickland');
  await expect(page.locator('#districtFinder')).toHaveAttribute('href', 'https://app.leg.wa.gov/DistrictFinder/');
  await page.click('#confirmDistrict');
  await expect(page.locator('#sum2')).toHaveText('✓ WA-10 · Marilyn Strickland');
  await expect(page.locator('#officialList li')).toHaveText(['Patty Murray', 'Maria Cantwell', 'Marilyn Strickland', 'Shasti Conrad', 'Bob Ferguson']);
});

test('a ZIP across a district line offers only its districts; an unknown ZIP offers every district', async ({ page }) => {
  await page.goto('/');
  await page.fill('#detailZip', '98589'); await page.click('#done1');
  await expect(page.locator('#districtLead')).toHaveText('ZIP 98589 crosses a district line. Which one is yours?');
  await expect(page.locator('#districtChoices button')).toHaveText(['WA-03 · Marie Gluesenkamp Perez', 'WA-10 · Marilyn Strickland']);
  await page.click('[data-change="1"]');
  await page.fill('#detailZip', '00000'); await page.click('#done1');
  await expect(page.locator('#districtLead')).toHaveText("We couldn't match ZIP 00000. Pick your district.");
  await expect(page.locator('#districtChoices button')).toHaveCount(10);
  await page.click('[data-change="1"]');
  await page.fill('#detailZip', '98501'); await page.click('#done1');
  await page.click('#pickOther');
  await expect(page.locator('#districtChoices button')).toHaveCount(10);
});

test('a Republican district is explained and leaves the list to senators and state leaders', async ({ page }) => {
  await page.goto('/');
  await page.click('#done1');
  await expect(page.locator('#districtChoices [data-district="WA-04"]')).toContainText('Republican');
  await page.click('#districtChoices [data-district="WA-04"]');
  await expect(page.locator('#sum2')).toHaveText('✓ WA-04 · Dan Newhouse, a Republican, so not on your list');
  await expect(page.locator('#officialList li')).toHaveText(['Patty Murray', 'Maria Cantwell', 'Shasti Conrad', 'Bob Ferguson']);
  await expect(page.locator('#progressText')).toHaveText('0 / 4 contacted');
});

test('skipping details still works and says the letters will be unsigned', async ({ page }) => {
  await page.goto('/');
  await page.click('#done1');
  await expect(page.locator('#sum1')).toHaveText('Skipped. Letters will end with [Your name].');
  await page.click('#districtChoices [data-district="WA-01"]');
  await expect(preview(page)).toContainText('[Your name]');
});

test('changing the ZIP to one outside your district asks for the district again; a fitting ZIP does not', async ({ page }) => {
  await page.goto('/');
  await page.fill('#detailZip', '98501'); await page.click('#done1'); await page.click('#confirmDistrict');
  await page.click('[data-change="1"]');
  await expect(page.locator('#s1')).toHaveAttribute('data-state', 'active');
  await expect(page.locator('#s2')).toHaveAttribute('data-state', 'done');
  await page.fill('#detailName', 'Alex Smith'); await page.click('#done1');
  await expect(page.locator('#s3')).toHaveAttribute('data-state', 'active');
  await page.click('[data-change="1"]');
  await page.fill('#detailZip', '98004'); await page.click('#done1');
  await expect(page.locator('#s2')).toHaveAttribute('data-state', 'active');
  await expect(page.locator('#districtChoices button')).toHaveText(['WA-01 · Suzan DelBene', 'WA-09 · Adam Smith']);
});

test('I sent it marks the official, moves to the next one, and the finish survives a reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await toConsole(page);
  await expect(page.locator('#position')).toHaveText('Contacting 1 of 5');
  await expect(page.locator('#sent')).toHaveText('I sent it! Next official →');
  await page.click('#sent');
  await expect(page.locator('#officialName')).toHaveText('Maria Cantwell');
  await expect(page.locator('#officialList li').first()).toHaveText('✓ Patty Murray');
  await expect(page.locator('#progressText')).toHaveText('1 / 5 contacted');
  expect(await stored(page, actionKey)).toEqual({ 'murray:letter': true });
  await goTo(page, 'Bob Ferguson'); await channel(page, 'call'); await page.click('#sent');
  await expect(page.locator('#officialName')).toHaveText('Maria Cantwell');
  for (let i = 0; i < 3; i++) await page.click('#sent');
  await expect(page.locator('#finish')).toBeVisible();
  await expect(page.locator('#finishTitle')).toHaveText('You made a difference.');
  await expect(page.locator('#console')).toBeHidden();
  // Reduced motion: no confetti is drawn.
  expect(await page.evaluate(() => { const c = document.getElementById('confetti'); return c.width > 0 && c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some(Boolean); })).toBe(false);
  await page.reload();
  await expect(page.locator('#finish')).toBeVisible();
  await expect(page.locator('#progressText')).toHaveText('5 / 5 contacted');
  await page.click('#reviewMessages');
  await expect(page.locator('#console')).toBeVisible();
});

test('the finish shares the campaign text exactly and links every network', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => localStorage.setItem('leadership-wa-actions-v3', JSON.stringify({ 'murray:letter': true, 'cantwell:letter': true, 'delbene:letter': true, 'conrad:letter': true, 'ferguson:letter': true })));
  await page.addInitScript(() => localStorage.setItem('leadership-wa-drafts-v3', JSON.stringify({ district: 'WA-01' })));
  await page.goto('/');
  const share = await page.evaluate(() => window.CAMPAIGN_CONTENT.share);
  await page.click('#copyShare');
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(share.text);
  const links = await page.locator('#shareRow a').evaluateAll(as => as.map(a => [a.textContent, a.getAttribute('href')]));
  expect(links.map(l => l[0])).toEqual(['X', 'Bluesky', 'Threads', 'Facebook', 'Snapchat', 'Reddit', 'WhatsApp', 'Text', 'Email']);
  const text = encodeURIComponent(share.text);
  expect(Object.fromEntries(links)).toMatchObject({
    X: `https://twitter.com/intent/tweet?text=${text}`, Bluesky: `https://bsky.app/intent/compose?text=${text}`,
    Threads: `https://www.threads.com/intent/post?text=${text}&tag=DEMRESET`, WhatsApp: `https://wa.me/?text=${text}`,
    Email: `mailto:?subject=${encodeURIComponent(share.emailSubject)}&body=${text}`
  });
});

test('progress and drafts from before this design still count', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('leadership-wa-drafts-v3', JSON.stringify({ district: 'WA-07', selected: 'jayapal', channel: 'call', personal: { jayapal: { call: 'My saved Jayapal call' } } }));
    localStorage.setItem('leadership-wa-actions-v3', JSON.stringify({ 'murray:social': true, 'smith:letter': true }));
  });
  await page.goto('/');
  await expect(page.locator('#s3')).toHaveAttribute('data-state', 'active');
  await expect(page.locator('#officialName')).toHaveText('Pramila Jayapal');
  await expect(preview(page)).toHaveText('My saved Jayapal call');
  await expect(page.locator('#progressText')).toHaveText('1 / 5 contacted');
  // Another district's action stays saved even though that official is not on this list.
  expect(await stored(page, actionKey)).toEqual({ 'murray:social': true, 'smith:letter': true });
  expect((await stored(page, draftKey)).personal.jayapal.call).toBe('My saved Jayapal call');
});
