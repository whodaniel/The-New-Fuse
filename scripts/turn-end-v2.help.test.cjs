const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts/turn-end-v2.cjs');

/**
 * `turn-end-v2.cjs` delegates to the legacy `turn-end.cjs`, which prints its own
 * usage and exits 0 — but the wrapper used to carry on afterwards and emit a
 * real handoff. `--help` therefore rewrote SESSION_HANDOFF_LATEST.{json,md},
 * appended a status-ledger entry, and staged all three. Observed 2026-09-06
 * while trying to read the options.
 */
const PROTECTED = [
  'docs/protocols/reports/SESSION_HANDOFF_LATEST.json',
  'docs/protocols/reports/SESSION_HANDOFF_LATEST.md',
  'docs/protocols/AGENT_STATUS_LEDGER.md',
];

function digests() {
  return PROTECTED.map((rel) => {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) return `${rel}:absent`;
    return `${rel}:${crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}`;
  });
}

for (const flag of ['--help', '-h']) {
  test(`${flag} prints usage and mutates no protocol state`, () => {
    const before = digests();
    const result = spawnSync(process.execPath, [SCRIPT, flag], {
      cwd: ROOT,
      encoding: 'utf8',
      env: { ...process.env },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Usage: node scripts\/turn-end-v2\.cjs/);
    assert.doesNotMatch(
      result.stdout,
      /Turn End V2 complete/,
      'help must not run the turn',
    );
    assert.deepEqual(digests(), before, 'help must not rewrite handoff or ledger files');
  });
}

test('usage documents the flags that change what the turn writes', () => {
  const result = spawnSync(process.execPath, [SCRIPT, '--help'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.match(result.stdout, /--no-stage/);
  assert.match(result.stdout, /--summary/);
  // The classification env vars are recorded into the handoff, so a reader of
  // the usage needs to know they exist.
  assert.match(result.stdout, /TNF_WORK_DOMAIN/);
});
