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
  loadUserFacingCatalog,
  resolveSubdirectorChoice,
  sanitizeHandle,
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

console.log(`\nwizard.test.ts: ${passed} assertions passed`);
