/**
 * Tests for scripts/protocols/twip-sign-envelope.cjs
 *
 * This is the canonical HMAC-SHA256 envelope signer for TNF-Wide Information
 * Protocol (TWIP) hand-offs. Every signed packet that crosses between agents
 * flows through this script, so the canonicalization + signature machinery is
 * high-blast-radius if it drifts. Run via:
 *
 *   node --test scripts/protocols/twip-sign-envelope.test.cjs
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, 'twip-sign-envelope.cjs');
const KEY = 'test-key-do-not-use-in-prod';

function runCli(args, env = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    input: undefined,
    env: { ...process.env, TWIP_SIGNING_KEY: '', ...env },
  });
}

function writeEnvelope(dir, envelope) {
  const file = path.join(dir, 'in.json');
  fs.writeFileSync(file, JSON.stringify(envelope, null, 2));
  return file;
}

function tmpDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `twip-sign-${name}-`));
}

test('signs an envelope deterministically regardless of key order', () => {
  const dir = tmpDir('deterministic');
  const input = writeEnvelope(dir, {
    spec: 'twip/0.1',
    id: 'evt-001',
    type: 'task',
    payload: { z: 1, a: 2, m: { y: 3, b: 4 } },
  });

  const r1 = runCli(['--in', input, '--key', KEY]);
  const r2 = runCli(['--in', input, '--key', KEY]);
  assert.equal(r1.status, 0, r1.stderr);
  assert.equal(r2.status, 0, r2.stderr);

  const out1 = JSON.parse(r1.stdout);
  const out2 = JSON.parse(r2.stdout);
  assert.match(out1.sig, /^hmac-sha256:[0-9a-f]{64}$/);
  assert.equal(out1.sig, out2.sig, 'signatures should be identical for identical input');
});

test('--verify accepts a freshly signed envelope', () => {
  const dir = tmpDir('verify-ok');
  const input = writeEnvelope(dir, {
    spec: 'twip/0.1',
    id: 'evt-002',
    type: 'response',
    payload: { answer: 42 },
  });

  const signed = runCli(['--in', input, '--key', KEY]);
  assert.equal(signed.status, 0, signed.stderr);
  const signedEnvelope = JSON.parse(signed.stdout);

  const signedFile = path.join(dir, 'signed.json');
  fs.writeFileSync(signedFile, JSON.stringify(signedEnvelope, null, 2));

  const v = runCli(['--verify', '--in', signedFile, '--key', KEY]);
  assert.equal(v.status, 0, v.stderr);
  const result = JSON.parse(v.stdout);
  assert.equal(result.verified, true);
  assert.equal(result.algorithm, 'hmac-sha256');
});

test('--verify rejects a tampered envelope', () => {
  const dir = tmpDir('verify-tamper');
  const input = writeEnvelope(dir, {
    spec: 'twip/0.1',
    id: 'evt-003',
    type: 'task',
    payload: { answer: 42 },
  });

  const signed = runCli(['--in', input, '--key', KEY]);
  assert.equal(signed.status, 0);
  const signedEnvelope = JSON.parse(signed.stdout);

  // Tamper with payload after signing
  signedEnvelope.payload.answer = 99;
  const tamperedFile = path.join(dir, 'tampered.json');
  fs.writeFileSync(tamperedFile, JSON.stringify(signedEnvelope, null, 2));

  const v = runCli(['--verify', '--in', tamperedFile, '--key', KEY]);
  assert.notEqual(v.status, 0, 'tampered envelope must fail verification');
  assert.match(v.stderr, /Signature verification failed/);
});

test('--verify rejects unsigned envelopes', () => {
  const dir = tmpDir('verify-missing-sig');
  const input = writeEnvelope(dir, {
    spec: 'twip/0.1',
    id: 'evt-004',
    type: 'event',
  });
  const v = runCli(['--verify', '--in', input, '--key', KEY]);
  assert.notEqual(v.status, 0);
  assert.match(v.stderr, /Envelope has no signature/);
});

test('--verify rejects envelopes signed with the wrong key', () => {
  const dir = tmpDir('verify-wrong-key');
  const input = writeEnvelope(dir, {
    spec: 'twip/0.1',
    id: 'evt-005',
    type: 'state_sync',
  });
  const signed = runCli(['--in', input, '--key', KEY]);
  assert.equal(signed.status, 0);
  const signedFile = path.join(dir, 'signed.json');
  fs.writeFileSync(signedFile, signed.stdout);

  const v = runCli(['--verify', '--in', signedFile, '--key', 'wrong-key']);
  assert.notEqual(v.status, 0);
  assert.match(v.stderr, /Signature verification failed/);
});

test('accepts both hmac-sha256 prefix and bare hex signatures on verify', () => {
  const dir = tmpDir('prefix-strip');
  const input = writeEnvelope(dir, {
    spec: 'twip/0.1',
    id: 'evt-006',
    type: 'response',
  });
  const signed = runCli(['--in', input, '--key', KEY]);
  const envelope = JSON.parse(signed.stdout);
  // Strip the prefix and rewrite
  const bare = { ...envelope, sig: envelope.sig.replace(/^hmac-sha256:/, '') };
  const file = path.join(dir, 'bare.json');
  fs.writeFileSync(file, JSON.stringify(bare, null, 2));

  const v = runCli(['--verify', '--in', file, '--key', KEY]);
  assert.equal(v.status, 0, v.stderr);
});

test('rejects envelopes missing required spec/id/type fields', () => {
  const dir = tmpDir('shape-check');
  for (const bad of [
    { spec: 'twip/0.1', id: 'no-type' },
    { spec: 'twip/0.1', type: 'task' },
    { id: 'no-spec', type: 'task' },
  ]) {
    const file = path.join(dir, `bad-${Math.random()}.json`);
    fs.writeFileSync(file, JSON.stringify(bad, null, 2));
    const r = runCli(['--in', file, '--key', KEY]);
    assert.notEqual(r.status, 0, `should reject envelope ${JSON.stringify(bad)}`);
    assert.match(r.stderr, /required|spec must be/);
  }
});

test('writes signed envelope to --out when provided', () => {
  const dir = tmpDir('out-file');
  const input = writeEnvelope(dir, {
    spec: 'twip/0.1',
    id: 'evt-007',
    type: 'task',
  });
  const outFile = path.join(dir, 'out.json');
  const r = runCli(['--in', input, '--out', outFile, '--key', KEY]);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(outFile), '--out should produce a file');
  const onDisk = JSON.parse(fs.readFileSync(outFile, 'utf8'));
  assert.match(onDisk.sig, /^hmac-sha256:[0-9a-f]{64}$/);
});

test('TWIP_SIGNING_KEY env var is honored when --key is absent', () => {
  const dir = tmpDir('env-key');
  const input = writeEnvelope(dir, {
    spec: 'twip/0.1',
    id: 'evt-008',
    type: 'event',
  });

  // sign path
  const signed = runCli(['--in', input], { TWIP_SIGNING_KEY: KEY });
  assert.equal(signed.status, 0, signed.stderr);

  // verify path
  const signedFile = path.join(dir, 'signed.json');
  fs.writeFileSync(signedFile, signed.stdout);
  const v = runCli(['--verify', '--in', signedFile], { TWIP_SIGNING_KEY: KEY });
  assert.equal(v.status, 0, v.stderr);
});

test('sign output is byte-equal to a hand-computed HMAC over the canonical form', () => {
  const dir = tmpDir('cross-check');
  const env = { payload: { z: 1, a: 2 }, id: 'evt-009', type: 'task', spec: 'twip/0.1' };
  const input = writeEnvelope(dir, env);

  const r = runCli(['--in', input, '--key', KEY]);
  assert.equal(r.status, 0, r.stderr);
  const signedEnvelope = JSON.parse(r.stdout);

  // Hand-compute: canonical JSON with stable key order, omit sig.
  function stable(v) {
    if (Array.isArray(v)) return v.map(stable);
    if (v && typeof v === 'object') {
      return Object.keys(v)
        .sort()
        .reduce((acc, k) => {
          acc[k] = stable(v[k]);
          return acc;
        }, {});
    }
    return v;
  }
  const canonical = JSON.stringify(stable(env));
  const expected = crypto.createHmac('sha256', KEY).update(canonical).digest('hex');
  assert.equal(signedEnvelope.sig.replace(/^hmac-sha256:/, ''), expected);
});
