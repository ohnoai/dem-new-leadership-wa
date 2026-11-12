const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const load = files => { const context = { window: {} }; for (const f of files) vm.runInNewContext(fs.readFileSync(path.join(root, f), 'utf8'), context); return context.window; };

// This repository is meant to be forked. The campaign's own payment details live only in campaign.js, so a fork
// changes one file, and the tip jar shows only on campaign.js's hosts, so a fork never shows them by accident.
test('payment details appear in no tracked file except campaign.js', () => {
  const { tips } = load(['campaign.js']).CAMPAIGN_CONTENT;
  const needles = [tips.lightning, tips.lightning.split('@')[1], new URL(tips.priceUrl).hostname, new URL(tips.kofi).href.replace(/\/$/, '')];
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: root }).toString().split('\0').filter(Boolean)
    .filter(f => f !== 'campaign.js' && !/\.(png|woff2|ico)$/.test(f));
  const hits = [];
  for (const f of files) {
    const text = fs.readFileSync(path.join(root, f), 'utf8').toLowerCase();
    for (const n of needles) if (text.includes(n.toLowerCase())) hits.push(`${f}: ${n}`);
  }
  assert.deepEqual(hits, []);
});

test('the tip jar is limited to listed hosts and every setting it needs is present', () => {
  const { tips } = load(['campaign.js']).CAMPAIGN_CONTENT;
  assert.ok(Array.isArray(tips.hosts) && tips.hosts.length > 0);
  assert.match(tips.lightning, /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]+$/i);
  assert.equal(new URL(tips.kofi).protocol, 'https:');
  assert.equal(new URL(tips.priceUrl).protocol, 'https:');
  const source = fs.readFileSync(path.join(root, 'tips.js'), 'utf8');
  assert.match(source, /\(tips\.hosts \|\| \[\]\)\.includes\(location\.hostname\)/);
});

test('every ZIP code maps to real House districts, and every district is reachable', () => {
  const w = load(['data.js', 'districts.js']);
  const districts = new Set(w.CAMPAIGN.officials.filter(o => o.group === 'house').map(o => o.district));
  const seen = new Set();
  for (const [zip, list] of Object.entries(w.CAMPAIGN_ZIPS.zips)) {
    assert.match(zip, /^\d{5}$/);
    assert.ok(list.length >= 1);
    for (const n of list) { const d = `${w.CAMPAIGN_ZIPS.state}-${String(n).padStart(2, '0')}`; assert.ok(districts.has(d), `${zip} -> ${d}`); seen.add(d); }
  }
  assert.deepEqual([...seen].sort(), [...districts].sort());
});
