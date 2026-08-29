#!/usr/bin/env node
'use strict';

/**
 * 04 unverified_symlink_not_promoted
 *
 * SUBJECT_UNDER_TEST: scripts/harness/agent-resource-converge.cjs (redirectRow)
 * INVARIANT: Unverified redirectStrategy/symlink must fail closed; source stays a regular file.
 * SETUP: Disposable fabric config + host surface with redirectVerified:false.
 * ACTION_BY_REAL_SUBJECT: redirectRow(...)
 * OBSERVED_EFFECT: throws /Redirect not verified/; lstat remains file.
 * PASS_PREDICATE: throw + still file; harness did not unlink/re-symlink.
 * EVIDENCE: error message + lstat.isFile().
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  scanInventory,
  importInventory,
  redirectRow,
} = require('../../../scripts/harness/agent-resource-converge.cjs');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-hlc-symlink-'));
  const home = path.join(root, 'home');
  const fabric = path.join(root, 'fabric');
  fs.mkdirSync(home, { recursive: true });
  const config = {
    spec: 'tnf/agent-resource-fabric/0.1',
    version: '0.1.0',
    centralRoot: fabric,
    objectStore: 'objects/sha256',
    indexPath: 'index/resources.json',
    receiptPath: 'receipts',
    backupPath: 'backups',
    hosts: [],
  };
  return { root, home, fabric, config };
}

test('04 unverified_symlink_not_promoted — redirectRow fails closed', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));

  const source = path.join(f.home, 'a/skill.md');
  fs.mkdirSync(path.dirname(source), { recursive: true });
  fs.writeFileSync(source, 'safe-shared\n', 'utf8');

  f.config.hosts.push({
    id: 'a',
    runtime: 'a',
    discoveryState: 'fixture',
    surfaces: [
      {
        id: 'a-skill',
        path: '~/a/skill.md',
        resourceKind: 'skill',
        publisher: 'fixture',
        mutability: 'read-mostly',
        sensitivity: 'internal',
        centralization: 'shared-copy',
        redirectStrategy: 'symlink',
        redirectVerified: false,
        consumerTags: ['fixture'],
      },
    ],
  });

  const scan = scanInventory(f.config, { home: f.home, root: f.fabric });
  importInventory(f.config, scan, { home: f.home, root: f.fabric });

  assert.throws(
    () => redirectRow(f.config, scan.rows[0], { home: f.home, root: f.fabric }),
    /Redirect not verified/
  );
  assert.equal(fs.lstatSync(source).isFile(), true);
  assert.equal(fs.lstatSync(source).isSymbolicLink(), false);
});

test('04b verified symlink path still exercised by subject (positive control)', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const source = path.join(f.home, 'a/skill.md');
  fs.mkdirSync(path.dirname(source), { recursive: true });
  fs.writeFileSync(source, 'immutable\n', 'utf8');
  f.config.hosts.push({
    id: 'a',
    runtime: 'a',
    discoveryState: 'fixture',
    surfaces: [
      {
        id: 'a-skill',
        path: '~/a/skill.md',
        resourceKind: 'skill',
        publisher: 'fixture',
        mutability: 'read-mostly',
        sensitivity: 'internal',
        centralization: 'shared-copy',
        redirectStrategy: 'symlink',
        redirectVerified: true,
        consumerTags: ['fixture'],
      },
    ],
  });
  const scan = scanInventory(f.config, { home: f.home, root: f.fabric });
  importInventory(f.config, scan, { home: f.home, root: f.fabric });
  const redirected = redirectRow(f.config, scan.rows[0], { home: f.home, root: f.fabric });
  assert.equal(redirected.ok, true);
  assert.equal(fs.lstatSync(source).isSymbolicLink(), true);
});
