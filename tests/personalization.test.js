const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function load() { const c = { window: {} }; vm.runInNewContext(fs.readFileSync('model.js', 'utf8'), c); return c.window.ActionModel; }
const o = { id: 'murray', name: 'Patty Murray', group: 'senate', vote: 'senate' };
test('details format optional locations without inferring geography or doubling County', () => {
  const M = load();
  assert.equal(M.location({ city: 'Centralia', county: 'Lewis', zip: '98531' }), 'Centralia, Lewis County, WA 98531');
  assert.equal(M.location({ county: 'lewis county' }), 'Lewis County, WA');
  assert.equal(M.location({ city: 'Centralia' }), 'Centralia, WA');
  assert.equal(M.location({ zip: '98531' }), 'WA 98531');
  assert.equal(M.location({}), '[Your location]');
});
test('managed tokens remain separate from edits and manual signatures win', () => {
  const M = load(), state = M.create();
  const content = { letters: { senate: { subject: 'Subject', message: 'My argument.\n\nSincerely,\n\n[Your name]\n[Your location]' } } };
  state.details = { name: 'Jane Smith', city: 'Centralia', county: 'Lewis', zip: '98531' };
  const original = M.draft(state, o, content).message;
  assert.match(original, /Jane Smith\nCentralia, Lewis County, WA 98531/);
  M.editDisplayed(state, o, 'message', original.replace('My argument.', 'My stronger personal argument.'), content);
  assert.match(state.personal.murray.message, /\[Your name\]/);
  state.details.name = 'Alex Smith';
  assert.match(M.draft(state, o, content).message, /personal argument\.[\s\S]*Alex Smith/);
  const edited = M.draft(state, o, content).message.replace('Alex Smith', 'My manual signature');
  M.editDisplayed(state, o, 'message', edited, content);
  state.details.name = 'Another name';
  assert.match(M.draft(state, o, content).message, /My manual signature/);
  assert.doesNotMatch(M.draft(state, o, content).message, /Another name/);
  const restored = M.restore(JSON.parse(JSON.stringify(state)));
  assert.equal(M.draft(restored, o, content).message, M.draft(state, o, content).message);
});
test('old personal overrides are opaque even when they contain token-like text', () => {
  const M = load(), state = M.restore({ details: { name: 'Jane' }, personal: { murray: { message: 'My exact [Your name] quotation', conciseMessage: 'Short personal', call: 'Call [Your name]' } } });
  assert.equal(M.draft(state, o).message, 'My exact [Your name] quotation');
  state.letterVersion = 'concise'; assert.equal(M.draft(state, o).message, 'Short personal');
  assert.equal(M.call(state, o, { calls: { senate: 'Hello [Your name]' } }), 'Call [Your name]');
});
test('user-authored shared text is opaque and call prose retains only untouched managed fields', () => {
  const M = load(), state = M.create(); state.details = { name: 'Jane', county: 'Lewis' };
  state.categoryShared['senate:full'] = { message: 'My quotation [Your name]', subject: 'Custom' };
  assert.equal(M.draft(state, o).message, 'Dear Senator Murray,\n\nMy quotation [Your name]');
  const content = { calls: { senate: 'I am [Your name] in [Your location]. My demand.' } };
  M.editDisplayed(state, o, 'call', M.call(state, o, content).replace('My demand.', 'My edited demand.'), content);
  state.details.name = 'Alex'; assert.equal(M.call(state, o, content), 'I am Alex in Lewis County, WA. My edited demand.');
});
test('manual prefix and suffix edits detach identity bindings at their boundaries', () => {
  const M = load(), content = { letters: { senate: { message: 'Text\n\n[Your name]\n[Your location]' } }, concise: { letters: { senate: { message: 'Short\n\n[Your name]\n[Your location]' } } }, calls: { senate: '[Your name] from [Your location]' } };
  for (const version of ['full','concise']) for (const field of ['message','call']) for (const manual of ['Janet','Dr. Jane','Jane Doe']) {
    const state = M.create(); state.letterVersion=version; state.details={name:'Jane',county:'Lewis'};
    const text=field==='call'?M.call(state,o,content):M.draft(state,o,content).message;
    M.editDisplayed(state,o,field,text.replace('Jane',manual),content); state.details.name='Alex';
    const restored=M.restore(JSON.parse(JSON.stringify(state)));
    assert.ok((field==='call'?M.call(restored,o,content):M.draft(restored,o,content).message).includes(manual));
  }
});
test('shared subject overrides do not detach untouched message personalization', () => {
  const M=load(),state=M.create();state.details={name:'Jane'};
  state.categoryShared['senate:full']={subject:'My subject'};
  const content={letters:{senate:{subject:'Default',message:'Text\n[Your name]'}}};
  assert.equal(M.draft(state,o,content).message,'Dear Senator Murray,\n\nText\nJane');
  assert.equal(M.location({county:'County'}),'[Your location]');
  assert.equal(M.location({county:'LEWIS COUNTY'}),'Lewis County, WA');
});
