#!/usr/bin/env node
'use strict';

/**
 * Pending / architecture-gap conformance stubs.
 * These encode TARGET_NOT_IMPLEMENTED or PARTIAL gaps without manufacturing green.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '../../..');

test(
  '06 stale_repo_pointer_skipped — TARGET_NOT_IMPLEMENTED on origin/main',
  { skip: 'MISSING: scripts/lib/resolve-tnf-repo.cjs not present on origin/main@73cea241; pointer skip cannot be exercised against production subject' },
  () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'scripts/lib/resolve-tnf-repo.cjs')));
  }
);

test(
  '07 host_wrapper_install_idempotent — TARGET_NOT_IMPLEMENTED on origin/main',
  { skip: 'MISSING: scripts/install-tnf-host-wrappers.cjs not present on origin/main@73cea241' },
  () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'scripts/install-tnf-host-wrappers.cjs')));
  }
);

test(
  '09b managed_mcp_restore API — TARGET slice of PARTIAL invariant',
  {
    skip:
      'MISSING: LifecycleGuardian has no MCP registry restore method; only adapter_proof_stale block exists (covered in python 02/09). Restore-under-valid-proof cannot be conformance-green until implemented.',
  },
  () => {
    assert.fail('MCP restore subject not implemented');
  }
);

test(
  '10 rollback_gate_before_destructive_update — TARGET_NOT_IMPLEMENTED',
  {
    skip:
      'MISSING: no rollback_safe / destructive-update gate on LifecycleGuardian; historical test_rollback_proof.py harness shutil restores are non-authoritative',
  },
  () => {
    assert.fail('rollback gate not implemented');
  }
);

test(
  '11 doctor_repair_requires_proof — PARTIAL: doctor does not repair under proof',
  {
    skip:
      'PARTIAL/MISSING: CLI action=doctor is observe-only (native hermes doctor + hashes); it does not require adapter proof nor repair managed consent/MCP. Cannot green "doctor repair requires proof" until repair is proof-gated.',
  },
  () => {
    assert.fail('doctor repair-under-proof not implemented');
  }
);
