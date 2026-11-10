const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

test('preview returns 400 for malformed URL escapes and keeps serving', { timeout: 10000 }, async t => {
  const reservation = net.createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, [path.resolve(__dirname, '../scripts/serve.js')], {
    env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(() => child.kill());
  await Promise.race([
    once(child.stdout, 'data'),
    once(child, 'exit').then(([code]) => { throw new Error(`Preview exited with ${code}`); })
  ]);
  const status = pathname => new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path: pathname }, res => {
      res.resume(); res.on('end', () => resolve(res.statusCode));
    }).on('error', reject);
  });
  assert.equal(await status('/%E0%A4%A'), 400);
  assert.equal(await status('/%'), 400);
  assert.equal(await status('/'), 200);
  const fontType = await new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path: '/assets/barlow-condensed-800.woff2' }, res => {
      res.resume(); res.on('end', () => resolve(res.headers['content-type']));
    }).on('error', reject);
  });
  assert.equal(fontType, 'font/woff2');
  const imageType = await new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path: '/assets/social-preview.png' }, res => {
      res.resume(); res.on('end', () => resolve(res.headers['content-type']));
    }).on('error', reject);
  });
  assert.equal(imageType, 'image/png');
});