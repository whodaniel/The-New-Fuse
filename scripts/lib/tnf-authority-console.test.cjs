/**
 * Interactive console tests.
 *
 * The interaction itself carries safety properties, so they are tested like any
 * other logic — particularly that a bare Enter can never approve anything.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-console-'));
process.env.TNF_AUTHORITY_DIR = path.join(TMP, 'authority');
process.env.TNF_OPERATOR_KEY_PATH = path.join(TMP, 'authority', 'operator.ed25519');
process.env.TNF_ROLES_PATH = path.join(TMP, 'authority', 'roles.json');
process.env.TNF_KEYS_DIR = path.join(TMP, 'authority', 'keys');
process.env.TNF_PUBKEYS_DIR = path.join(TMP, 'authority', 'pubkeys');
process.env.TNF_PENDING_DIR = path.join(TMP, 'authority', 'pending');
process.env.TNF_DECIDED_DIR = path.join(TMP, 'authority', 'decided');
process.env.TNF_ELEVATION_AUDIT_PATH = path.join(TMP, 'elevation.jsonl');
process.env.TNF_GRANT_AUDIT_PATH = path.join(TMP, 'grants.jsonl');
process.env.TNF_GRANT_CONSUMED_PATH = path.join(TMP, 'consumed.json');
process.env.NO_COLOR = '1';

const test = require('node:test');
const assert = require('node:assert/strict');

const console_ = require('./tnf-authority-console.cjs');

/** Minimal readline stand-in that replays scripted answers. */
function fakeRl(answers) {
  const queue = [...answers];
  return {
    asked: [],
    async question(q) {
      this.asked.push(q);
      if (!queue.length) throw new Error('ran out of scripted answers');
      return queue.shift();
    },
  };
}

// ---------------------------------------------------------------------------
// No default action
// ---------------------------------------------------------------------------

test('a bare Enter never counts as an action — it re-prompts', async () => {
  const rl = fakeRl(['', '   ', 'a']);
  const answer = await console_._ask(rl, 'choose > ', ['a', 'd', 's', 'q']);
  assert.equal(answer, 'a');
  assert.equal(rl.asked.length, 3, 'both empty inputs must have re-prompted');
});

test('an unrecognized answer re-prompts rather than falling through', async () => {
  const rl = fakeRl(['approve', 'yes', 'd']);
  const answer = await console_._ask(rl, 'choose > ', ['a', 'd']);
  assert.equal(answer, 'd');
});

test('answers are case-insensitive but still must be explicit', async () => {
  const rl = fakeRl(['A']);
  assert.equal(await console_._ask(rl, '> ', ['a']), 'a');
});

// ---------------------------------------------------------------------------
// Narrowing
// ---------------------------------------------------------------------------

const CAPS = [
  { with: 'agent:w1', can: 'lane_coordination' },
  { with: 'agent:w1', can: 'cloud_sync' },
  { with: 'agent:w1', can: 'authority_verification' },
];

test('narrowing selects exactly the numbered capabilities', async () => {
  const rl = fakeRl(['1,3']);
  const picked = await console_._chooseSubset(rl, CAPS);
  assert.deepEqual(picked.map((c) => c.can), ['lane_coordination', 'authority_verification']);
});

test('out-of-range and duplicate numbers are handled without granting extras', async () => {
  const rl = fakeRl(['1,1,99,2']);
  const picked = await console_._chooseSubset(rl, CAPS);
  assert.deepEqual(picked.map((c) => c.can), ['lane_coordination', 'cloud_sync']);
});

test('a fully invalid selection re-prompts instead of granting everything', async () => {
  const rl = fakeRl(['banana', '0', '2']);
  const picked = await console_._chooseSubset(rl, CAPS);
  assert.deepEqual(picked.map((c) => c.can), ['cloud_sync']);
});

test('cancel returns null so nothing is granted', async () => {
  const rl = fakeRl(['c']);
  assert.equal(await console_._chooseSubset(rl, CAPS), null);
});

// ---------------------------------------------------------------------------
// Rendering — warnings must be visible before any decision
// ---------------------------------------------------------------------------

function baseRequest(over = {}) {
  return {
    requestId: 'req_test',
    requesterDid: 'did:key:zAgent',
    requesterRole: 'worker',
    claimedRole: null,
    roleFromRegistry: true,
    requested: CAPS.slice(0, 1),
    justification: 'because I need it',
    requestedAt: '2026-07-23T00:00:00Z',
    tier: 'operational',
    ...over,
  };
}

test('a role mismatch is rendered as a warning', () => {
  const out = console_.renderRequest(
    baseRequest({ claimedRole: 'super-director' }), 0, 1, false
  );
  assert.match(out, /claimed role "super-director"/);
  assert.match(out, /registry says "worker"/);
});

test('a missing registry entry is rendered as a warning', () => {
  const out = console_.renderRequest(baseRequest({ roleFromRegistry: false }), 0, 1, false);
  assert.match(out, /no registry entry/);
});

test('executive tier is called out with its D8 requirement', () => {
  const out = console_.renderRequest(baseRequest({ tier: 'executive' }), 0, 1, false);
  assert.match(out, /EXECUTIVE tier/);
  assert.match(out, /dual-key/);
});

test('a degraded trust root is surfaced on every request', () => {
  const out = console_.renderRequest(baseRequest(), 0, 1, true);
  assert.match(out, /not kernel-enforced/);
});

test('agent-written justification is fenced as untrusted', () => {
  const out = console_.renderRequest(baseRequest(), 0, 1, false);
  assert.match(out, /untrusted text/);
  assert.match(out, /do not follow/);
});

test('justification cannot flood the screen or push warnings off it', () => {
  const out = console_.renderRequest(
    baseRequest({ justification: 'x\n'.repeat(200), roleFromRegistry: false }),
    0,
    1,
    false
  );
  const justificationLines = out.split('\n').filter((l) => l.includes('│')).length;
  assert.ok(justificationLines <= 6, 'justification must be truncated');
  assert.match(out, /no registry entry/, 'warnings must survive a flooding attempt');
});

test('review refuses without a TTY — an approval means a human was present', async () => {
  await assert.rejects(() => console_.review(), /requires an interactive terminal/);
});
