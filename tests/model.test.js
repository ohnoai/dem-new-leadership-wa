const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const load = () => { const context = { window: {} }; if (fs.existsSync('model.js')) vm.runInNewContext(fs.readFileSync('model.js', 'utf8'), context); return context.window.ActionModel; };
const murray = { id: 'murray', name: 'Patty Murray', group: 'senate', vote: 'senate' };
const cantwell = { id: 'cantwell', name: 'Maria Cantwell', group: 'senate', vote: 'senate' };
test('shared edits follow recipients without overwriting personal letters', () => {
  const M = load();
  assert.ok(M, 'ActionModel is available');
  const state = M.create();
  state.shared.message = 'My shared priorities.';
  assert.match(M.draft(state, murray).message, /Dear Senator Murray,/);
  assert.match(M.draft(state, cantwell).message, /My shared priorities/);
  M.edit(state, murray, 'message', 'A personal Murray letter');
  state.shared.message = 'Changed shared priorities.';
  assert.equal(M.draft(state, murray).message, 'A personal Murray letter');
  assert.match(M.draft(state, cantwell).message, /Changed shared priorities/);
});
test('restores valid saved fields and rejects malformed storage shapes', () => {
  const M = load();
  assert.equal(typeof M.restore, 'function');
  const state = M.restore({ shared: { message: 'Saved' }, personal: { murray: { message: 'Custom' } }, selected: 'murray', channel: 'call' });
  assert.equal(state.shared.message, 'Saved');
  assert.equal(M.draft(state, murray).message, 'Custom');
  assert.equal(M.restore({ shared: null, personal: [], channel: 'evil' }).channel, 'letter');
});
test('appropriate request and greeting for officials without a Democratic ballot', () => {
  const M = load();
  const content = { requests: { senate: 'Use your vote', influence: 'Use your influence, not a caucus vote' } };
  const state = M.create();
  assert.match(M.draft(state, { id: 'g', name: 'Bob Ferguson', group: 'influence', greeting: 'Dear Governor Ferguson,', vote: null }, content).message, /^Dear Governor Ferguson,\n\nUse your influence/);
  assert.match(M.draft(state, murray, content).message, /Use your vote/);
});
