#!/usr/bin/env node
'use strict';

/**
 * 08 runtime_state_never_centralized
 *
 * SUBJECT_UNDER_TEST: scripts/harness/agent-resource-converge.cjs (classifyEligibility + planConvergence)
 * INVARIANT: Secret/stateful host paths are not eligible for fabric centralization.
 * SETUP: Disposable inventory including .env and state.db-like surfaces.
 * ACTION_BY_REAL_SUBJECT: classifyEligibility / planConvergence
 * PASS_PREDICATE: secret-excluded / stateful reasons; secrets not in eligible import set.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  classifyEligibility,
  scanInventory,
  planConvergence,
} = require('../../../scripts/harness/agent-resource-converge.cjs');

test('08 runtime_state_never_centralized — .env classified secret-excluded', () => {
  const result = classifyEligibility(
    {
      sensitivity: 'internal',
      centralization: 'shared-copy',
      mutability: 'read-only',
      resourceKind: 'config',
    },
    '/tmp/host/.env',
    { size: 32 }
  );
  assert.equal(result.eligible, false);
  assert.equal(result.secret, true);
  assert.ok(result.reasons.includes('secret-excluded'));
});

test('08b state-export surfaces never eligible', () => {
  const result = classifyEligibility(
    {
      sensitivity: 'internal',
      centralization: 'state-export',
      mutability: 'read-mostly',
      resourceKind: 'stateful-memory',
    },
    '/tmp/host/state.db',
    { size: 64 }
  );
  assert.equal(result.eligible, false);
  assert.equal(result.stateful, true);
  assert.ok(result.reasons.includes('stateful-export-policy'));
});

test('08c planConvergence keeps secrets out of shared plan', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-hlc-state-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const home = path.join(root, 'home');
  const fabric = path.join(root, 'fabric');
  fs.mkdirSync(path.join(home, 'sec'), { recursive: true });
  fs.writeFileSync(path.join(home, 'sec', '.env'), 'SECRET=do-not-centralize\n');
  fs.writeFileSync(path.join(home, 'sec', 'skill.md'), 'ok\n');

  const config = {
    spec: 'tnf/agent-resource-fabric/0.1',
    version: '0.1.0',
    centralRoot: fabric,
    objectStore: 'objects/sha256',
    indexPath: 'index/resources.json',
    receiptPath: 'receipts',
    backupPath: 'backups',
    hosts: [
      {
        id: 'h',
        runtime: 'h',
        discoveryState: 'fixture',
        surfaces: [
          {
            id: 'env',
            path: '~/sec/.env',
            resourceKind: 'config',
            publisher: 'fixture',
            mutability: 'read-only',
            sensitivity: 'secret',
            centralization: 'shared-copy',
            redirectStrategy: 'observe',
            redirectVerified: false,
            consumerTags: ['fixture'],
          },
          {
            id: 'skill',
            path: '~/sec/skill.md',
            resourceKind: 'skill',
            publisher: 'fixture',
            mutability: 'read-mostly',
            sensitivity: 'internal',
            centralization: 'shared-copy',
            redirectStrategy: 'observe',
            redirectVerified: false,
            consumerTags: ['fixture'],
          },
        ],
      },
    ],
  };

  const scan = scanInventory(config, { home, root: fabric });
  const plan = planConvergence(config, scan, { home, root: fabric });
  const secretRows = scan.rows.filter((r) => String(r.sourcePath || '').endsWith('.env'));
  assert.equal(secretRows.length, 1);
  assert.equal(secretRows[0].eligible, false);
  assert.equal(secretRows[0].secretExcluded, true);
  assert.ok((secretRows[0].reasons || []).includes('secret-excluded'));
  const eligible = scan.rows.filter((r) => r.eligible);
  assert.ok(eligible.every((r) => !String(r.sourcePath || '').endsWith('.env')));
  assert.ok(plan);
});
