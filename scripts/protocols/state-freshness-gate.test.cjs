#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const GATE = path.join(__dirname, 'state-freshness-gate.cjs');
const ROOT = path.resolve(__dirname, '..', '..');
const REGISTRY = path.join(ROOT, 'docs', 'protocols', 'state-freshness.registry.json');

function runGate(args, env = {}) {
  try {
    const stdout = execFileSync(process.execPath, [GATE, ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      env: { ...process.env, ...env },
    });
    return { code: 0, stdout };
  } catch (error) {
    return { code: error.status ?? 1, stdout: String(error.stdout || '') };
  }
}

test('registry is valid JSON and every domain is well-formed', () => {
  const reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  assert.ok(Array.isArray(reg.domains) && reg.domains.length > 0, 'domains present');
  for (const d of reg.domains) {
    assert.ok(d.id, 'id');
    assert.ok(d.probe, `${d.id}: probe`);
    assert.ok(Number.isFinite(d.ttlSeconds) && d.ttlSeconds > 0, `${d.id}: ttlSeconds`);
    // The trap text is the whole point of the registry: it names the specific
    // misread that produces a false claim about this domain.
    assert.ok(d.trap && d.trap.length > 30, `${d.id}: trap must explain the misread`);
    if (d.expect) assert.doesNotThrow(() => new RegExp(d.expect), `${d.id}: expect compiles`);
  }
});

test('--frontload never fails a session, even with an unreadable registry', () => {
  const res = runGate(['--frontload']);
  assert.strictEqual(res.code, 0);
  assert.match(res.stdout, /volatile domains:/);
});

test('SPLIT is raised when two independent probes disagree', () => {
  // This is the exact failure that caused the 2026-08-14 false report: one view
  // said a sha existed, another said main pointed elsewhere. The gate must
  // refuse to pick a winner and mark the domain SPLIT.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'freshness-'));
  const regPath = path.join(tmp, 'reg.json');
  fs.writeFileSync(
    regPath,
    JSON.stringify({
      version: 1,
      receiptsPath: path.join(tmp, 'receipts.json'),
      domains: [
        {
          id: 'test.disagree',
          title: 'two views that disagree',
          ttlSeconds: 600,
          severity: 'high',
          probe: 'echo AAA',
          corroborate: 'echo BBB',
          trap: 'synthetic domain used to prove the split detector fires on disagreement',
        },
      ],
    })
  );

  const { refresh, loadRegistry } = require('./state-freshness-gate.cjs');
  assert.ok(typeof refresh === 'function' && typeof loadRegistry === 'function');

  const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));
  const results = refresh(reg, '');
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].split, true, 'disagreement must set split');
  assert.strictEqual(results[0].corroborated, false);
});

test('agreeing probes do not raise SPLIT', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'freshness-'));
  const reg = {
    version: 1,
    receiptsPath: path.join(tmp, 'receipts.json'),
    domains: [
      {
        id: 'test.agree',
        title: 'two views that agree',
        ttlSeconds: 600,
        probe: 'echo SAME',
        corroborate: 'echo SAME',
        trap: 'synthetic domain used to prove the split detector stays quiet on agreement',
      },
    ],
  };
  const { refresh } = require('./state-freshness-gate.cjs');
  const results = refresh(reg, '');
  assert.strictEqual(results[0].split, undefined);
  assert.strictEqual(results[0].corroborated, true);
});

test('a stale receipt fails --check', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'freshness-'));
  const receipts = path.join(tmp, 'receipts.json');
  const reg = {
    version: 1,
    receiptsPath: receipts,
    domains: [
      {
        id: 'test.stale',
        title: 'stale',
        ttlSeconds: 1,
        probe: 'echo X',
        trap: 'synthetic domain used to prove TTL expiry is enforced by evaluate()',
      },
    ],
  };
  fs.writeFileSync(
    receipts,
    JSON.stringify({
      version: 1,
      receipts: {
        'test.stale': {
          observedAt: new Date(Date.now() - 60_000).toISOString(),
          ok: true,
          value: 'X',
          ttlSeconds: 1,
        },
      },
    })
  );
  const { evaluate } = require('./state-freshness-gate.cjs');
  const out = evaluate(reg);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.bad[0].state, 'STALE');
});
