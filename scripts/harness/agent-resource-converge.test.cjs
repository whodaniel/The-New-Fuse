#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  scanInventory,
  importInventory,
  planConvergence,
  redirectRow,
  resolveFabricPaths,
  objectPath,
  sha256Bytes,
  verifyFabric,
} = require('./agent-resource-converge.cjs');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-resource-fabric-'));
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

function addHost(config, id, surfaces) {
  config.hosts.push({ id, runtime: id, discoveryState: 'fixture', surfaces });
}

function write(home, rel, text) {
  const file = path.join(home, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
  return file;
}

const shared = (id, rel, extra = {}) => ({
  id,
  path: `~/${rel}`,
  resourceKind: 'skill',
  publisher: 'fixture',
  mutability: 'read-mostly',
  sensitivity: 'internal',
  centralization: 'shared-copy',
  redirectStrategy: 'observe',
  redirectVerified: false,
  consumerTags: ['fixture'],
  ...extra,
});

test('scan deduplicates identical bytes across hosts and computes reclaimable bytes', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  write(f.home, 'a/skill.md', 'same bytes\n');
  write(f.home, 'b/skill.md', 'same bytes\n');
  addHost(f.config, 'a', [shared('a-skill', 'a/skill.md')]);
  addHost(f.config, 'b', [shared('b-skill', 'b/skill.md')]);
  const scan = scanInventory(f.config, { home: f.home, root: f.fabric });
  assert.equal(scan.summary.eligibleFiles, 2);
  assert.equal(scan.summary.uniqueEligibleObjects, 1);
  assert.equal(scan.summary.duplicateGroups, 1);
  assert.equal(scan.summary.reclaimableBytes, Buffer.byteLength('same bytes\n'));
  assert.deepEqual(scan.duplicates[0].hosts, ['a', 'b']);
});

test('import stores one object per hash and preserves multi-host provenance', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const a = write(f.home, 'a/skill.md', 'same bytes\n');
  const b = write(f.home, 'b/skill.md', 'same bytes\n');
  addHost(f.config, 'a', [shared('a-skill', 'a/skill.md')]);
  addHost(f.config, 'b', [shared('b-skill', 'b/skill.md')]);
  const scan = scanInventory(f.config, { home: f.home, root: f.fabric });
  const result = importInventory(f.config, scan, { home: f.home, root: f.fabric });
  assert.equal(result.createdObjects, 1);
  assert.equal(result.importedSources, 2);
  const index = JSON.parse(fs.readFileSync(path.join(f.fabric, 'index/resources.json'), 'utf8'));
  const hash = sha256Bytes(fs.readFileSync(a));
  assert.equal(Object.keys(index.objects).length, 1);
  assert.deepEqual(index.objects[hash].sourceHosts, ['a', 'b']);
  assert.deepEqual(index.objects[hash].sourcePaths.sort(), [a, b].sort());
  assert.equal(verifyFabric(f.config, { root: f.fabric, home: f.home }).ok, true);
});

test('secrets and stateful stores are excluded from content hashing/import', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  write(f.home, 'agent/credentials.json', '{"token":"secret"}\n');
  write(f.home, 'agent/history.db', 'opaque state\n');
  addHost(f.config, 'agent', [
    shared('creds', 'agent/credentials.json'),
    shared('history', 'agent/history.db', {
      resourceKind: 'stateful-memory',
      mutability: 'stateful',
      centralization: 'state-export',
      statePolicy: 'memory-compaction-adapter',
    }),
  ]);
  const scan = scanInventory(f.config, { home: f.home, root: f.fabric });
  assert.equal(scan.summary.secretExcluded, 1);
  assert.equal(scan.summary.statefulExcluded, 1);
  assert.equal(scan.summary.eligibleFiles, 0);
  const imported = importInventory(f.config, scan, { home: f.home, root: f.fabric });
  assert.equal(imported.objectCount, 0);
  const plan = planConvergence(f.config, scan, { home: f.home, root: f.fabric });
  assert.equal(plan.excludedSecrets.length, 1);
  assert.equal(plan.stateful.length, 1);
});

test('redirect fails closed for an unverified host surface', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const source = write(f.home, 'a/skill.md', 'safe\n');
  addHost(f.config, 'a', [shared('a-skill', 'a/skill.md')]);
  const scan = scanInventory(f.config, { home: f.home, root: f.fabric });
  importInventory(f.config, scan, { home: f.home, root: f.fabric });
  assert.throws(() => redirectRow(f.config, scan.rows[0], { home: f.home, root: f.fabric }), /Redirect not verified/);
  assert.equal(fs.lstatSync(source).isFile(), true);
});

test('verified symlink redirect backs up, redirects, and preserves content hash', (t) => {
  const f = fixture();
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const source = write(f.home, 'a/skill.md', 'shared immutable resource\n');
  addHost(f.config, 'a', [shared('a-skill', 'a/skill.md', { redirectStrategy: 'symlink', redirectVerified: true })]);
  const scan = scanInventory(f.config, { home: f.home, root: f.fabric });
  importInventory(f.config, scan, { home: f.home, root: f.fabric });
  const row = scan.rows[0];
  const redirected = redirectRow(f.config, row, { home: f.home, root: f.fabric });
  assert.equal(redirected.ok, true);
  assert.equal(fs.lstatSync(source).isSymbolicLink(), true);
  assert.equal(fs.readFileSync(source, 'utf8'), 'shared immutable resource\n');
  assert.equal(fs.readFileSync(redirected.backupPath, 'utf8'), 'shared immutable resource\n');
  const paths = resolveFabricPaths(f.config, { home: f.home, root: f.fabric });
  assert.equal(fs.realpathSync(source), fs.realpathSync(objectPath(paths, row.sha256)));
});
