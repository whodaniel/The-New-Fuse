const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  acquireServiceStartLock,
  isProcessRunning,
  RELAY_START_PORTS,
  RELAY_DISCOVERY_PORTS,
} = require('./tnf-native-host.cjs');

test('process inspection distinguishes running, absent, and unknown states', async () => {
  const running = await isProcessRunning('relay', (_file, _args, callback) =>
    callback(null, '42\n'),
  );
  assert.deepEqual(running, { running: true, unknown: false });

  const absent = await isProcessRunning('relay', (_file, _args, callback) => {
    const error = new Error('no process');
    error.code = 1;
    callback(error, '');
  });
  assert.deepEqual(absent, { running: false, unknown: false });

  const unknown = await isProcessRunning('relay', (_file, _args, callback) => {
    const error = new Error('pgrep unavailable');
    error.code = 'ENOENT';
    callback(error, '');
  });
  assert.equal(unknown.running, false);
  assert.equal(unknown.unknown, true);
  assert.match(unknown.error, /pgrep unavailable/);
});

test('service start lock excludes concurrent starters and releases cleanly', () => {
  const lockDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-native-host-lock-'));
  const first = acquireServiceStartLock('relay', { lockDir });
  assert.equal(first.acquired, true);

  const concurrent = acquireServiceStartLock('relay', { lockDir });
  assert.equal(concurrent.acquired, false);
  assert.equal(concurrent.busy, true);

  first.release();
  const afterRelease = acquireServiceStartLock('relay', { lockDir });
  assert.equal(afterRelease.acquired, true);
  afterRelease.release();
});

test('service start lock recovers an expired owner file', () => {
  const lockDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-native-host-stale-'));
  const first = acquireServiceStartLock('monitor', { lockDir });
  assert.equal(first.acquired, true);
  fs.closeSync(fs.openSync(first.lockPath, 'r'));
  fs.utimesSync(first.lockPath, new Date(0), new Date(0));

  const recovered = acquireServiceStartLock('monitor', { lockDir, staleMs: 1 });
  assert.equal(recovered.acquired, true);
  recovered.release();
});

test('relay start catalog never treats api/backend port 3001 as a relay', () => {
  assert.ok(RELAY_START_PORTS.includes(3000));
  assert.ok(RELAY_START_PORTS.includes(3010));
  assert.equal(RELAY_START_PORTS.includes(3001), false);
  assert.equal(RELAY_DISCOVERY_PORTS.includes(3001), false);
});
