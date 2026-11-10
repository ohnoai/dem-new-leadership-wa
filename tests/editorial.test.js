const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function load() {
  const context = { window: {} };
  for (const file of ['campaign.js', 'data.js']) vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  return { content: context.window.CAMPAIGN_CONTENT, officials: context.window.CAMPAIGN.officials.filter(o => o.party === 'Democratic') };
}
const subjects = {
  senate: 'A Democratic majority is not a mandate for Chuck Schumer',
  house: 'New majority. New leadership. Not Hakeem Jeffries.',
  influence: 'Silence is a choice. Demand new Democratic leadership.'
};
const greeting = o => o.greeting || `Dear ${o.group === 'senate' ? 'Senator' : 'Representative'} ${o.name.split(' ').at(-1)},`;
const crlfLength = text => text.replace(/\r?\n/g, '\r\n').length;

test('category letters meet full and concise CRLF budgets for every active greeting', () => {
  const { content, officials } = load();
  assert.deepEqual(Array.from(officials, o => o.id), ['murray', 'cantwell', 'delbene', 'larsen', 'perez', 'randall', 'jayapal', 'schrier', 'smith', 'strickland', 'conrad', 'ferguson']);
  for (const [version, source, minimum, maximum] of [['full', content, 1500, 1700], ['concise', content.concise, 700, 900]]) {
    assert.ok(source.letters, `${version} category letters exist`);
    assert.deepEqual(Object.keys(source.letters).sort(), ['house', 'influence', 'senate']);
    for (const official of officials) {
      const letter = source.letters[official.vote || 'influence'];
      assert.equal(letter.subject, subjects[official.vote || 'influence']);
      assert.doesNotMatch(letter.message, /^Dear /);
      assert.match(letter.message, /Sincerely,\n\n\[Your name\]\n\[Your location\]$/);
      const count = crlfLength(`${greeting(official)}\n\n${letter.message}`);
      assert.ok(count >= minimum && count <= maximum, `${version} ${official.id}: ${count}, expected ${minimum}-${maximum}`);
      assert.doesNotMatch(letter.message, /\u2014|already control|November|January|2026|2027/i);
    }
    assert.match(source.letters.senate.message, /oppose Chuck Schumer/);
    assert.match(source.letters.house.message, /oppose Hakeem Jeffries/);
    for (const category of ['senate', 'house', 'influence']) {
      assert.match(source.letters[category].message, /competitive/);
      assert.match(source.letters[category].message, /public/);
    }
    assert.match(source.letters.influence.message, /I know you do not cast a ballot in either caucus election/);
    assert.match(source.letters.influence.message, /Chuck Schumer/);
    assert.match(source.letters.influence.message, /Hakeem Jeffries/);
  }
});

test('category calls demand a public position and posts contain no personal identity tokens', () => {
  const { content } = load();
  assert.ok(content.calls, 'category calls exist');
  assert.ok(content.posts, 'category posts exist');
  for (const category of ['senate', 'house', 'influence']) {
    const call = content.calls[category];
    const post = content.posts[category];
    for (const token of ['[Your name]', '[Your location]', '[official]']) assert.ok(call.includes(token), `${category} call includes ${token}`);
    assert.match(call, /public/);
    assert.ok(call.length <= 650, `${category} call is short`);
    assert.ok(post.includes('[official]'));
    assert.doesNotMatch(post, /\[Your |\[your |name is|I live in|ZIP/i);
    assert.ok(post.length <= 280, `${category} post fits a short social post`);
    assert.doesNotMatch(call + post, /\u2014/);
  }
  for (const channel of [content.calls, content.posts]) {
    assert.match(channel.senate, /oppose Chuck Schumer/);
    assert.match(channel.house, /oppose Hakeem Jeffries/);
    assert.match(channel.influence, /Chuck Schumer/);
    assert.match(channel.influence, /Hakeem Jeffries/);
  }
  assert.match(content.calls.influence, /do not vote in either caucus election/);
});

test('legacy defaults remain byte-for-byte available for saved draft migration', () => {
  const { content: x } = load();
  const legacy = { shared: x.shared, requests: x.requests, concise: { shared: x.concise.shared, requests: x.concise.requests }, call: x.call, social: x.social };
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(legacy)).digest('hex'), '4e39e1e1275f90142f6e76bc7e584f43c6bd46c4cce552267b8b47b1dadd035d');
});
