#!/usr/bin/env node
'use strict';

const assert = require('node:assert');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const MODULE = path.join(__dirname, 'enforcement-mode.cjs');

/**
 * Each case runs in a child process: the module reads env at call time, and a
 * stale require cache across cases would make mode resolution untestable.
 */
function runCase(body, env = {}) {
  const script = `
    const m = require(${JSON.stringify(MODULE)});
    const out = (() => { ${body} })();
    process.stdout.write(JSON.stringify(out));
  `;
  const stdout = execFileSync(process.execPath, ['-e', script], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return JSON.parse(stdout);
}

function tempLedger() {
  return path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-enforce-')),
    'ENFORCEMENT_OBSERVATIONS.jsonl',
  );
}

function readRows(ledger) {
  if (!fs.existsSync(ledger)) return [];
  return fs
    .readFileSync(ledger, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

test('defaults to observe so a new gate never blocks until promoted', () => {
  assert.equal(runCase("return m.modeFor('some-gate');", { TNF_ENFORCE_MODE: '' }), 'observe');
});

test('global TNF_ENFORCE_MODE is honoured', () => {
  assert.equal(runCase("return m.modeFor('some-gate');", { TNF_ENFORCE_MODE: 'block' }), 'block');
});

test('per-gate override beats the global mode', () => {
  const mode = runCase("return m.modeFor('agent-identity');", {
    TNF_ENFORCE_MODE: 'observe',
    TNF_ENFORCE_MODE_AGENT_IDENTITY: 'block',
  });
  assert.equal(mode, 'block');
});

test('an unrecognised mode falls back rather than failing open to block', () => {
  assert.equal(runCase("return m.modeFor('g');", { TNF_ENFORCE_MODE: 'banana' }), 'observe');
});

test('observe mode records the violation but does not block', () => {
  const ledger = tempLedger();
  const result = runCase(
    "return m.decide({gate:'demo', verdict:'violation', subject:'a/b.ts', detail:{why:'test'}});",
    { TNF_ENFORCE_MODE: 'observe', TNF_ENFORCEMENT_LEDGER: ledger },
  );
  assert.equal(result.blocked, false);
  assert.equal(result.mode, 'observe');

  const rows = readRows(ledger);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].gate, 'demo');
  assert.equal(rows[0].verdict, 'violation');
  assert.equal(rows[0].enforced, false, 'observe-mode rows must be marked unenforced');
  assert.equal(rows[0].subject, 'a/b.ts');
});

test('block mode blocks and marks the row enforced', () => {
  const ledger = tempLedger();
  const result = runCase(
    "return m.decide({gate:'demo', verdict:'violation', subject:'a/b.ts'});",
    { TNF_ENFORCE_MODE: 'block', TNF_ENFORCEMENT_LEDGER: ledger },
  );
  assert.equal(result.blocked, true);
  assert.equal(readRows(ledger)[0].enforced, true);
});

test('a passing verdict never blocks and writes no row', () => {
  const ledger = tempLedger();
  const result = runCase("return m.decide({gate:'demo', verdict:'pass'});", {
    TNF_ENFORCE_MODE: 'block',
    TNF_ENFORCEMENT_LEDGER: ledger,
  });
  assert.equal(result.blocked, false);
  assert.equal(readRows(ledger).length, 0, 'the ledger records violations, not every check');
});

test('an unwritable ledger does not throw and still returns the decision', () => {
  // Parent is a regular file, so mkdirSync fails with ENOTDIR. A gate must not
  // stop enforcing merely because its audit trail is unwritable.
  const blocker = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-enforce-')), 'not-a-dir');
  fs.writeFileSync(blocker, 'x');
  const result = runCase("return m.decide({gate:'demo', verdict:'violation'});", {
    TNF_ENFORCE_MODE: 'block',
    TNF_ENFORCEMENT_LEDGER: path.join(blocker, 'x.jsonl'),
  });
  assert.equal(result.blocked, true, 'audit failure must not silently disable enforcement');
});

test('appends rather than rewrites, so concurrent gates cannot clobber each other', () => {
  const ledger = tempLedger();
  for (const subject of ['one', 'two', 'three']) {
    runCase(`return m.decide({gate:'demo', verdict:'violation', subject:'${subject}'});`, {
      TNF_ENFORCE_MODE: 'observe',
      TNF_ENFORCEMENT_LEDGER: ledger,
    });
  }
  assert.deepEqual(
    readRows(ledger).map((r) => r.subject),
    ['one', 'two', 'three'],
  );
});
