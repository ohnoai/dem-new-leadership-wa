const { test, expect } = require('@playwright/test');
const key='leadership-wa-drafts-v3';
test('legacy shared and inactive prototype records remain exact after details and refresh',async({page})=>{
  const old={shared:{subject:'Old subject',message:'My saved shared argument [Your name]',conciseSubject:'Old short',conciseMessage:'My saved short'},personal:{murray:{message:'Dear wrong recipient,\nMy old full.\nMy manual signature',conciseMessage:'Custom concise',call:'Custom call',social:'Custom post'},newhouse:{message:'Saved inactive House',conciseMessage:'Inactive concise',call:'Inactive call',social:'Inactive post'}},selected:'murray'};
  await page.addInitScript(old=>{if(!localStorage.getItem('seeded')){localStorage.setItem('seeded','yes');localStorage.setItem('leadership-wa-drafts-v3',JSON.stringify(old));localStorage.setItem('leadership-wa-actions-v3',JSON.stringify({'newhouse:letter':true,'murray:call':true}));}},old);
  await page.goto('/');await expect(page.locator('#detailName')).toBeVisible();await page.locator('#detailName').fill('New identity');await page.reload();
  await expect(page.locator('#message')).toHaveValue(old.personal.murray.message);
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);expect(saved.personal).toEqual(old.personal);expect(saved.shared).toEqual(old.shared);
  await page.locator('#official').selectOption('cantwell');await expect(page.locator('#message')).toHaveValue(/My saved shared argument \[Your name\]/);
});
test('old prototype inactive drafts and completions migrate without becoming targets',async({page})=>{
  await page.addInitScript(()=>{if(!localStorage.getItem('seeded')){localStorage.setItem('seeded','yes');localStorage.setItem('new-leadership-wa-v2',JSON.stringify({drafts:{house:{message:'Old House text',subject:'Old subject'}},callScript:{house:'Old House call'},social:'Old social',progress:{newhouse:true,baumgartner:true}}));}});
  await page.goto('/');const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);for(const id of ['newhouse','baumgartner'])expect(saved.personal[id]).toMatchObject({message:'Old House text',call:'Old House call',social:'Old social'});
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('leadership-wa-actions-v3')))).toMatchObject({'newhouse:letter':true,'baumgartner:letter':true});await expect(page.locator('#progressText')).toHaveText('0 / 36 actions');
});
test('every active full and concise category renders within conservative budget',async({page})=>{
  await page.goto('/');const rows=await page.evaluate(()=>{const M=window.ActionModel,T=window.CAMPAIGN_CONTENT;return window.CAMPAIGN.officials.filter(o=>o.active).flatMap(o=>['full','concise'].map(version=>{const state=M.create(T.shared,T.concise.shared);state.letterVersion=version;const d=M.draft(state,o,T);return {id:o.id,version,category:o.vote||'influence',message:d.message,count:d.message.replace(/\r?\n/g,'\r\n').length};}));});
  expect(rows).toHaveLength(24);for(const row of rows){expect(row.count).toBeGreaterThanOrEqual(row.version==='full'?1500:700);expect(row.count).toBeLessThanOrEqual(row.version==='full'?1700:900);}
  for(const version of ['full','concise'])for(const cat of ['senate','house','influence'])expect(new Set(rows.filter(r=>r.category===cat&&r.version===version).map(r=>r.message.split('\n\n').slice(1).join('\n\n'))).size).toBe(1);
});
test('reported thresholds and no-limit observations stay honest and never truncate',async({page})=>{
  await page.goto('/');for(const id of ['perez','randall','smith']){await page.locator('#official').selectOption(id);await expect(page.locator('#messageCount')).toContainText('user-reported advisory');await page.locator('#message').fill('x'.repeat(2200));await expect(page.locator('#message')).toHaveValue('x'.repeat(2200));}
  for(const id of ['delbene','schrier','strickland','conrad','ferguson']){await page.locator('#official').selectOption(id);await expect(page.locator('#formCompatibility')).toContainText('not verified unlimited');await expect(page.locator('#messageCount')).not.toContainText('/ 2,000');}
});
