const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const key = 'leadership-wa-drafts-v3';
async function details(page) {
  await page.locator('#yourDetails').evaluate(el => el.open = true);
  for (const [id, value] of [['detailName','Jane Smith'],['detailCity','Centralia'],['detailCounty','Lewis County'],['detailZip','98531']]) await page.locator('#'+id).fill(value);
}
test('private details personalize copy and calls without persisting identity into edited prose', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']); await page.goto('/'); await details(page);
  await expect(page.locator('#message')).toHaveValue(/Jane Smith\nCentralia, Lewis County, WA 98531/);
  const text = await page.locator('#message').inputValue();
  await page.locator('#message').fill(text.replace('Democrats have won', 'My neighbors and I know Democrats have won'));
  await page.locator('#detailName').fill('Alex Smith');
  await expect(page.locator('#message')).toHaveValue(/My neighbors[\s\S]*Alex Smith/);
  const raw = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).personal.murray.message, key);
  expect(raw).toContain('[Your name]'); expect(raw).not.toContain('Jane Smith');
  await page.locator('#copyMessage').click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g,'\n')).toBe(await page.locator('#message').inputValue());
  const manual = (await page.locator('#message').inputValue()).replace('Alex Smith','Manual signature'); await page.locator('#message').fill(manual);
  await page.locator('#detailName').fill('Someone else'); await expect(page.locator('#message')).toHaveValue(/Manual signature/);
  await page.locator('#channel').selectOption('call'); await expect(page.locator('#callScript')).toHaveValue(/Someone else[\s\S]*Centralia/);
  await page.locator('#channel').selectOption('social'); await expect(page.locator('#socialText')).not.toHaveValue(/Someone else|Centralia|98531/);
  await page.reload(); await page.locator('#yourDetails').evaluate(el => el.open = true); await expect(page.locator('#detailCounty')).toHaveValue('Lewis County');
  await page.locator('#channel').selectOption('letter'); await expect(page.locator('#message')).toHaveValue(/Manual signature/);
});
test('only Democratic targets act while all districts and inactive saved history survive', async ({ page }) => {
  await page.addInitScript(() => { if(!localStorage.getItem('seeded')) {localStorage.setItem('seeded','yes'); localStorage.setItem('leadership-wa-drafts-v3',JSON.stringify({ selected:'newhouse',personal:{ newhouse:{message:'Saved Republican draft',call:'Old call',social:'Old post'},baumgartner:{conciseMessage:'Old concise'} } }));localStorage.setItem('leadership-wa-actions-v3',JSON.stringify({'newhouse:letter':true,'baumgartner:call':true,'murray:letter':true}));} });
  await page.goto('/'); await expect(page.locator('#official option')).toHaveCount(12); await expect(page.locator('#official')).toHaveValue('murray');
  await expect(page.locator('#progressText')).toHaveText('1 / 36 actions');
  await page.locator('#districtDetails').evaluate(el => el.open = true); await expect(page.locator('#district option')).toHaveCount(11);
  await page.locator('#district').selectOption('WA-04'); await expect(page.locator('#districtNotice')).toContainText('Dan Newhouse'); await expect(page.locator('#districtNotice')).toContainText('cannot vote'); await expect(page.locator('#official')).toHaveValue('murray');
  await page.locator('#district').selectOption('WA-05'); await expect(page.locator('#districtNotice')).toContainText('Michael Baumgartner');
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key); expect(saved.personal.newhouse.message).toBe('Saved Republican draft'); expect(saved.personal.baumgartner.conciseMessage).toBe('Old concise');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('leadership-wa-actions-v3')))).toMatchObject({'newhouse:letter':true,'baumgartner:call':true});
});
test('details survive write failure in memory and stale tabs cannot overwrite identity or drafts', async ({ page, context }) => {
  await page.goto('/'); await details(page);
  const other=await context.newPage(); await other.goto('/'); await other.locator('#yourDetails').evaluate(el=>el.open=true);
  await page.locator('#detailCounty').fill('Thurston'); await other.locator('#detailName').fill('Stale identity');
  await expect(other.locator('#saveStatus')).toContainText('Another tab');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).details.county,key)).toBe('Thurston');
  await page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('denied')};});
  await page.locator('#detailName').fill('Memory name'); await expect(page.locator('#saveStatus')).toContainText('Not saved'); await expect(page.locator('#message')).toHaveValue(/Memory name/);
  await page.evaluate(()=>Storage.prototype.setItem=window.originalSet); await page.locator('#detailName').fill('Recovered name'); await page.locator('#detailCity').fill('Olympia'); await expect(page.locator('#saveStatus')).toHaveText('Saved on this device');
});
test('erase removes details and inactive history without erasing unrelated storage', async ({ page }) => {
  await page.goto('/'); await details(page); await page.locator('#message').fill('My draft');
  await page.evaluate(()=>localStorage.setItem('unrelated','keep'));
  await page.locator('.about').evaluate(el=>el.open=true); await page.getByText('Erase saved data',{exact:true}).click(); await page.locator('#erase').click(); await page.locator('#confirmErase').click();
  expect(await page.evaluate(()=>localStorage.getItem('leadership-wa-drafts-v3'))).toBeNull(); expect(await page.evaluate(()=>localStorage.getItem('unrelated'))).toBe('keep');
  await expect(page.locator('#message')).toHaveValue(/\[Your name\]/); await expect(page.locator('#detailName')).toHaveValue('');
});
for(const width of [320,375,430,1440]) test(`details keyboard and accessibility at ${width}`, async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/');await details(page);
  await page.locator('#detailCity').focus();await page.keyboard.press('Tab');await expect(page.locator('#detailCounty')).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});
test('erase in another tab invalidates in-memory personal details before later saves', async({page,context})=>{
  await page.goto('/'); await details(page); const other=await context.newPage();await other.goto('/');
  await page.locator('#erase').evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await page.locator('#erase').click();await page.locator('#confirmErase').click();
  await expect(other.locator('#message')).not.toHaveValue(/Jane Smith/);
  await other.locator('#message').fill('New post-erase prose');
  expect(await other.evaluate(()=>JSON.parse(localStorage.getItem('leadership-wa-drafts-v3')).details)).toEqual({});
});
test('cross-tab erase clears unsaved identity even when the draft key never existed',async({page,context})=>{
  await page.goto('/');const other=await context.newPage();await other.goto('/');
  await other.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='leadership-wa-drafts-v3')throw Error('denied');return window.originalSet.call(this,k,v);};});
  await other.locator('#yourDetails').evaluate(el=>el.open=true);await other.locator('#detailName').fill('Unsaved private identity');
  expect(await page.evaluate(()=>localStorage.getItem('leadership-wa-drafts-v3'))).toBeNull();
  await page.locator('#erase').evaluate(el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await page.locator('#erase').click();await page.locator('#confirmErase').click();
  await expect(other.locator('#detailName')).toHaveValue('');await other.evaluate(()=>Storage.prototype.setItem=window.originalSet);await other.locator('#detailCity').fill('Olympia');
  expect(await other.evaluate(()=>JSON.parse(localStorage.getItem('leadership-wa-drafts-v3')).details.name)).toBeUndefined();
});
test('shared subject-only edits preserve managed signatures in both versions and same category',async({page})=>{
  await page.goto('/');await details(page);await page.locator('.shared').evaluate(el=>el.open=true);
  for(const version of ['full','concise']){
    await page.locator('#letterVersion').selectOption(version);await page.locator('#sharedSubject').fill('My '+version+' subject');
    await expect(page.locator('#message')).toHaveValue(/Jane Smith/);await page.locator('#official').selectOption('cantwell');await expect(page.locator('#subject')).toHaveValue('My '+version+' subject');await expect(page.locator('#message')).toHaveValue(/Jane Smith/);await page.locator('#official').selectOption('murray');
  }
  await page.locator('#detailName').fill('Alex Smith');await expect(page.locator('#message')).toHaveValue(/Alex Smith/);
  const manual=(await page.locator('#message').inputValue()).replace('Alex Smith','Dr. Alex Smith');await page.locator('#message').fill(manual);await page.locator('#detailName').fill('Changed identity');await page.reload();await expect(page.locator('#message')).toHaveValue(/Dr\. Alex Smith/);
});
