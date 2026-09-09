/**
 * Wizard unit tests — catalog loading, handle sanitization, and non-TTY safety
 * (audit-loop Gates 2/3/4). Run via: npx tsx src/boot/wizard.test.ts
 */
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  EMBEDDED_STEP_CATALOG,
  applyStorageStrategy,
  loadUserFacingCatalog,
  resolveSubdirectorChoice,
  sanitizeHandle,
  type UserProfileConfig,
} from './wizard.js';

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.log(`  ✅ ${name}`);
}

test('sanitizeHandle strips path traversal', () => {
  assert.strictEqual(sanitizeHandle('../../evil'), 'evil');
  assert.ok(
    !sanitizeHandle('../../evil').includes('/') && !sanitizeHandle('../../evil').includes('.')
  );
});

test('sanitizeHandle enforces safe charset and length', () => {
  assert.strictEqual(sanitizeHandle('a/b:c*d'), 'a-b-c-d');
  assert.strictEqual(sanitizeHandle(''), 'operator');
  assert.ok(sanitizeHandle('x'.repeat(100)).length <= 64);
});

test('loadUserFacingCatalog reads contract with embedded fallback', () => {
  // Repo root (four levels up from packages/tnf-cli/src/boot).
  const repoRoot = path.resolve(import.meta.dirname, '../../../..');
  const fromContract = loadUserFacingCatalog(repoRoot);
  assert.strictEqual(fromContract.source, 'contract');
  assert.ok(fromContract.steps.length >= EMBEDDED_STEP_CATALOG.length);
  for (const id of [
    'identity',
    'swarm-topology',
    'workspace-ingestion',
    'context-storage',
    'first-goal',
  ]) {
    assert.ok(
      fromContract.steps.some((s) => s.id === id),
      `catalog contains ${id}`
    );
  }

  const bogusRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-wizard-'));
  const fallback = loadUserFacingCatalog(bogusRoot);
  assert.strictEqual(fallback.source, 'embedded');
  assert.strictEqual(fallback.steps.length, EMBEDDED_STEP_CATALOG.length);
  fs.rmSync(bogusRoot, { recursive: true, force: true });
});

test('every contract CLI step keeps the sovereign write-in (Gate 2)', () => {
  const repoRoot = path.resolve(import.meta.dirname, '../../../..');
  const { steps } = loadUserFacingCatalog(repoRoot);
  for (const step of steps.filter((s) => !s.surfaces || s.surfaces.includes('cli-wizard'))) {
    assert.strictEqual(
      step.writeIn,
      true,
      `catalog step '${step.id}' must allow sovereign write-in`
    );
  }
});

test('resolveSubdirectorChoice parses write-in authority', () => {
  assert.deepStrictEqual(resolveSubdirectorChoice('disabled'), {
    autonomyEnabled: false,
    capabilities: [],
  });
  assert.deepStrictEqual(resolveSubdirectorChoice('read_file, web_search'), {
    autonomyEnabled: true,
    capabilities: ['read_file', 'web_search'],
  });
  // Empty write-in fails closed — absence is not consent.
  assert.deepStrictEqual(resolveSubdirectorChoice(''), {
    autonomyEnabled: false,
    capabilities: [],
  });
});

function makeProfile(strategy: string, profileName = 'operator'): UserProfileConfig {
  return {
    profileName,
    identityMode: 'local',
    agentTopology: 'solo',
    workspacePath: '/tmp/tnf-wizard-save-test',
    ingestionMode: 'current-repo',
    contextStorage: {
      strategy: strategy as UserProfileConfig['contextStorage']['strategy'],
      local: { root: '~/.tnf/user-context/data/operator' },
      googleDrive: { enabled: false, folderId: null, folderUrl: null, folderName: 'TNF User Context' },
      inheritance: { coreFleet: 'inherit-user-profile', swarm: 'inherit-parent', agent: 'inherit-parent' },
    },
    initialGoal: 'test',
    createdAt: '2026-09-05T00:00:00.000Z',
    updatedAt: '2026-09-05T00:00:00.000Z',
  };
}

test('applyStorageStrategy: local-only and local-primary keep a single canonical save', () => {
  const tnfHome = fs.mkdtempSync('/tmp/tnf-wizard-save-');
  for (const strategy of ['local-only', 'local-primary']) {
    const report = applyStorageStrategy(makeProfile(strategy), tnfHome);
    assert.deepStrictEqual(report.saved, [], `${strategy}: no extra copies`);
    assert.deepStrictEqual(report.notices, [], `${strategy}: no notices`);
  }
  fs.rmSync(tnfHome, { recursive: true, force: true });
});

test('applyStorageStrategy: mirrored writes a second independent local save', () => {
  const tnfHome = fs.mkdtempSync('/tmp/tnf-wizard-save-');
  const report = applyStorageStrategy(makeProfile('mirrored'), tnfHome);
  assert.strictEqual(report.saved.length, 1, 'exactly one mirror copy');
  const mirrorPath = report.saved[0];
  assert.ok(mirrorPath.includes(path.join('user-context', 'data', 'operator', 'profile.json')));
  const mirrored = JSON.parse(fs.readFileSync(mirrorPath, 'utf8'));
  assert.strictEqual(mirrored.profileName, 'operator');
  assert.ok(report.notices.some((n) => n.includes('Mirrored profile copy saved')));
  fs.rmSync(tnfHome, { recursive: true, force: true });
});

test('applyStorageStrategy: drive strategies degrade honestly, never fake a sync', () => {
  const tnfHome = fs.mkdtempSync('/tmp/tnf-wizard-save-');
  const report = applyStorageStrategy(makeProfile('google-drive-primary'), tnfHome);
  assert.deepStrictEqual(report.saved, [], 'no local mirror is presented as Drive');
  assert.ok(report.notices.some((n) => n.includes('not available in this build')));
  fs.rmSync(tnfHome, { recursive: true, force: true });
});

test('applyStorageStrategy: mirror failure is reported, not thrown', () => {
  const tnfHome = fs.mkdtempSync('/tmp/tnf-wizard-save-');
  // Block the mirror root: a FILE where the mirror directory must be created.
  fs.writeFileSync(path.join(tnfHome, 'user-context'), 'not a directory');
  const report = applyStorageStrategy(makeProfile('mirrored'), tnfHome);
  assert.deepStrictEqual(report.saved, [], 'failed mirror reports no saved path');
  assert.ok(report.notices.some((n) => n.includes('Mirror copy failed')));
  fs.rmSync(tnfHome, { recursive: true, force: true });
});

console.log(`\nwizard.test.ts: ${passed} assertions passed`);
