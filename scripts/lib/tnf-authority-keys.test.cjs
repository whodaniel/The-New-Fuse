/**
 * Authority keypair reconciler tests.
 *
 * The property that matters: an identity that still means something must never be
 * classified as an orphan. Getting that wrong archives a live agent's private key.
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const keys = require('./tnf-authority-keys.cjs');

const DAY_MS = 24 * 60 * 60 * 1000;

function makeAuthorityDir({ roles = {}, identities = [] } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-authkeys-'));
  fs.mkdirSync(path.join(dir, 'keys'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'pubkeys'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'roles.json'), JSON.stringify(roles));

  for (const { id, ageDays = 0 } of identities) {
    const mtime = new Date(Date.now() - ageDays * DAY_MS);
    for (const [sub, name] of [
      ['keys', id],
      ['keys', `${id}.ed25519`],
      ['pubkeys', `${id}.pub`],
    ]) {
      const p = path.join(dir, sub, name);
      fs.writeFileSync(p, 'x');
      fs.utimesSync(p, mtime, mtime);
    }
  }
  return dir;
}

test('a legacy timestamped identity with no role and no recent use is an orphan', () => {
  const dir = makeAuthorityDir({
    identities: [{ id: 'agent_BROKER-Green_1786237317362', ageDays: 30 }],
  });
  const { keep, orphan } = keys.classifyIdentities({ authorityDir: dir, keepDays: 7 });
  assert.equal(keep.length, 0);
  assert.equal(orphan.length, 1);
  assert.equal(orphan[0].files.length, 3, 'both key files and the pubkey fold into one identity');
});

test('an identity holding a role is never an orphan, however old', () => {
  const dir = makeAuthorityDir({
    roles: { 'agent_BROKER-Green_1786237317362': { role: 'sub-director' } },
    identities: [{ id: 'agent_BROKER-Green_1786237317362', ageDays: 900 }],
  });
  const { keep, orphan } = keys.classifyIdentities({ authorityDir: dir, keepDays: 7 });
  assert.equal(orphan.length, 0);
  assert.equal(keep[0].reason, 'holds-role');
});

test('a stable (non-timestamped) identity is never an orphan', () => {
  const dir = makeAuthorityDir({
    identities: [
      { id: 'agent_broker-green_a1b2c3d4e5f6', ageDays: 900 },
      { id: 'tnf-local-subdirector', ageDays: 900 },
    ],
  });
  const { keep, orphan } = keys.classifyIdentities({ authorityDir: dir, keepDays: 7 });
  assert.equal(orphan.length, 0, 'the new stable id shape must survive reconciliation');
  assert.deepEqual(
    keep.map((k) => k.reason),
    ['stable-identity', 'stable-identity']
  );
});

test('a recently active legacy identity is kept', () => {
  const dir = makeAuthorityDir({
    identities: [{ id: 'agent_BROKER-Green_1786237317362', ageDays: 1 }],
  });
  const { keep, orphan } = keys.classifyIdentities({ authorityDir: dir, keepDays: 7 });
  assert.equal(orphan.length, 0);
  assert.equal(keep[0].reason, 'recently-active');
});

test('archiving moves files without deleting them, preserving the keys/pubkeys split', () => {
  const dir = makeAuthorityDir({
    identities: [{ id: 'agent_BROKER-Green_1786237317362', ageDays: 30 }],
  });
  const { orphan } = keys.classifyIdentities({ authorityDir: dir, keepDays: 7 });
  const { archiveDir, moved } = keys.archiveOrphans(orphan, { authorityDir: dir });

  assert.equal(moved, 3);
  assert.equal(fs.readdirSync(path.join(dir, 'keys')).length, 0, 'originals are gone from keys/');
  assert.equal(fs.readdirSync(path.join(archiveDir, 'keys')).length, 2);
  assert.equal(fs.readdirSync(path.join(archiveDir, 'pubkeys')).length, 1);

  // Recoverability is the whole point of archiving rather than deleting.
  const restored = path.join(archiveDir, 'pubkeys', 'agent_BROKER-Green_1786237317362.pub');
  assert.ok(fs.existsSync(restored), 'archived file must still exist on disk');
});

test('a missing authority directory yields nothing rather than throwing', () => {
  const { keep, orphan } = keys.classifyIdentities({
    authorityDir: path.join(os.tmpdir(), 'tnf-authkeys-does-not-exist'),
  });
  assert.deepEqual(keep, []);
  assert.deepEqual(orphan, []);
});
