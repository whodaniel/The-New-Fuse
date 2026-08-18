/**
 * Single-use grant concurrency tests.
 *
 * Origin: 2026-08-16. `verifyGrant` used check-then-consume against a
 * read-modify-write JSON file, and said so in a comment: two concurrent
 * verifications of the same single-use grant could both observe it unconsumed and
 * both pass. Single-use held against sequential reuse but not against a deliberate
 * concurrent double-spend. A capability that can be spent twice is not single-use,
 * so this is tested with real parallel processes rather than simulated interleaving —
 * an in-process test would prove nothing about atomicity.
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-grant-conc-'));
process.env.TNF_AUTHORITY_DIR = path.join(TMP, 'authority');
process.env.TNF_GRANT_AUDIT_PATH = path.join(TMP, 'grants.jsonl');
process.env.TNF_GRANT_CONSUMED_PATH = path.join(TMP, 'consumed.json');

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

const grants = require('./tnf-capability-grant.cjs');

const MODULE_PATH = path.join(__dirname, 'tnf-capability-grant.cjs');

test('a nonce can be claimed exactly once, sequentially', () => {
  const nonce = 'seqnonce0000000000000000000000aa';
  assert.equal(grants._claimNonce(nonce, futureExp()), true, 'first claim must win');
  assert.equal(grants._claimNonce(nonce, futureExp()), false, 'second claim must lose');
  assert.equal(grants._isNonceConsumed(nonce), true);
});

test('exactly one of N concurrent processes claims the same nonce', () => {
  const nonce = 'concnonce000000000000000000000bb';
  const WORKERS = 12;

  // Each worker is a separate OS process racing on the same marker. If the claim
  // were not atomic, more than one would report "won".
  const script = `
    process.env.TNF_AUTHORITY_DIR = ${JSON.stringify(process.env.TNF_AUTHORITY_DIR)};
    process.env.TNF_GRANT_AUDIT_PATH = ${JSON.stringify(process.env.TNF_GRANT_AUDIT_PATH)};
    process.env.TNF_GRANT_CONSUMED_PATH = ${JSON.stringify(process.env.TNF_GRANT_CONSUMED_PATH)};
    const g = require(${JSON.stringify(MODULE_PATH)});
    const target = Number(process.argv[2]);
    // Line the workers up on a shared wall-clock instant to maximise overlap.
    while (Date.now() < target) { /* spin */ }
    process.stdout.write(g._claimNonce(${JSON.stringify(nonce)}, ${futureExp()}) ? 'won' : 'lost');
  `;

  const startAt = Date.now() + 400;
  const results = [];
  const children = [];
  for (let i = 0; i < WORKERS; i += 1) {
    children.push(
      new Promise((resolve) => {
        const child = spawn(process.execPath, ['-e', script, String(startAt)], {
          stdio: ['ignore', 'pipe', 'ignore'],
        });
        let out = '';
        child.stdout.on('data', (d) => {
          out += d.toString();
        });
        child.on('close', () => {
          results.push(out.trim());
          resolve();
        });
      })
    );
  }

  return Promise.all(children).then(() => {
    const won = results.filter((r) => r === 'won').length;
    assert.equal(results.length, WORKERS, 'every worker must report');
    assert.equal(won, 1, `exactly one worker may claim the nonce, got ${won} of ${WORKERS}`);
  });
});

test('a nonce that is not a safe filename is refused rather than path-joined', () => {
  // The nonce arrives inside an unverified grant, so it is attacker-influenced input.
  for (const bad of ['../escape', 'a/b', '', '.', '..']) {
    assert.equal(grants._claimNonce(bad, futureExp()), false, `must refuse ${JSON.stringify(bad)}`);
  }
});

test('nonces consumed under the legacy JSON store stay consumed', () => {
  const nonce = 'legacynonce00000000000000000000cc';
  fs.mkdirSync(path.dirname(process.env.TNF_GRANT_CONSUMED_PATH), { recursive: true });
  fs.writeFileSync(process.env.TNF_GRANT_CONSUMED_PATH, JSON.stringify({ [nonce]: futureExp() }));

  assert.equal(grants._isNonceConsumed(nonce), true, 'legacy entry must still count as spent');
  assert.equal(grants._claimNonce(nonce, futureExp()), false, 'must not be reclaimable');

  fs.writeFileSync(process.env.TNF_GRANT_CONSUMED_PATH, JSON.stringify({}));
});

function futureExp() {
  return Math.floor(Date.now() / 1000) + 900;
}
