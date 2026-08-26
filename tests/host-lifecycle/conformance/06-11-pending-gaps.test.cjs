#!/usr/bin/env node
'use strict';
// Conformance pending-gaps oracle (tests 06-11 series).
// Encodes the host-lifecycle requirements that were previously only protocol
// prose / shell fixtures as formal assertions:
//   Test 09b: LifecycleGuardian managed MCP registry restore under adapter proof.
//   Test 10:  rollback_safe gate before destructive config writes.
//   Test 11:  Proof-gated doctor repair flow.
//
// Enforced against scripts/host-lifecycle/host_lifecycle_guardian.py
// (see docs/protocols/HOST_LIFECYCLE/host_lifecycle_protocol.md).

const test = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const GUARDIAN_DIR = path.join(REPO_ROOT, 'scripts', 'host-lifecycle');
const EVIDENCE_DIR = path.join(REPO_ROOT, 'tests', 'host-lifecycle', 'evidence');

// Run a LifecycleGuardian scenario inside an isolated synthetic-host fixture.
function runScenario({ baselineVersion, currentVersion = baselineVersion, body }) {
  const fixture = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'tnf-hlc-'));
  const script = `
import json, sys, pathlib
sys.path.insert(0, ${JSON.stringify(GUARDIAN_DIR)})
from host_lifecycle_guardian import (
    HostIdentity, AdapterStrategy, LifecycleGuardian,
    MANAGED_SURFACES, CANONICAL_CONSENT,
    GuardianGateError, AdapterProofStaleError, RollbackUnsafeError,
)
fixture = pathlib.Path(${JSON.stringify(fixture)})
mcp_registry = fixture / ".agent/mcp/registry.json"
mcp_registry.parent.mkdir(parents=True, exist_ok=True)
mcp_registry.write_text('{"managed": true, "v": 1}')
g = LifecycleGuardian(HostIdentity(host="synthetic", kind="cli", install_method="git", version_str=${JSON.stringify(baselineVersion)}, adapter_strategy=AdapterStrategy.COMMAND_SHADOW), repo_root=fixture)
g.baseline_capture()
import dataclasses
g.host = dataclasses.replace(g.host, version_str=${JSON.stringify(currentVersion)})
result = {}
${body}
print(json.dumps(result))
`;
  const out = execFileSync('python3', ['-c', script], { encoding: 'utf8', cwd: fixture });
  return { fixture, result: JSON.parse(out.trim().split('\n').pop()) };
}

test('09b: stale adapter proof blocks managed MCP registry repair (fail-closed)', () => {
  const { result } = runScenario({
    baselineVersion: 'fixture-v1', currentVersion: 'v0.0.1-drifted',
    body: 'r = g.reconcile(); result.update({"phase": r.phase, "valid": r.adapter_proof_valid, "error": r.error, "actions": r.actions_taken})',
  });
  assert.equal(result.phase, 'reconcile');
  assert.equal(result.valid, false);
  assert.equal(result.error, 'adapter_proof_stale');
  assert.ok(result.actions.some((a) => /BLOCKED/.test(a)));
});

test('09b: managed MCP registry restore under VALID adapter proof repairs from snapshot', () => {
  const { fixture, result } = runScenario({
    baselineVersion: 'fixture-v1',
    body: `
snap = g.snapshot_topology(fixture)
mcp_registry.write_text('{"managed": false, "corrupted": true}')
receipt = g.restore_managed_surface("mcp_registry")
restored_content = mcp_registry.read_text()
result.update({
    "error": receipt.error,
    "actions": receipt.actions_taken,
    "restored": receipt.after_state.get("restored", {}),
    "content_ok": restored_content == '{"managed": true, "v": 1}',
})
`,
  });
  assert.equal(result.error, null);
  assert.ok(result.actions.some((a) => a.startsWith('RESTORED')));
  assert.equal(result.content_ok, true);
});

test('09b: restore is refused when adapter proof went stale after snapshot', () => {
  const { result } = runScenario({
    baselineVersion: 'fixture-v1', currentVersion: 'v9-drifted',
    body: `
g.snapshot_topology(fixture)
before = (fixture / ".agent/mcp/registry.json").read_text()
receipt = g.restore_managed_surface("mcp_registry")
result.update({
    "error": receipt.error,
    "untouched": (fixture / ".agent/mcp/registry.json").read_text() == before,
})
`,
  });
  assert.equal(result.error, 'adapter_proof_stale');
  assert.equal(result.untouched, true);
});

test('10: rollback_safe gate refuses destructive writes without a verified snapshot', () => {
  const { result } = runScenario({
    baselineVersion: 'fixture-v1',
    body: `
try:
    g.assert_rollback_safe("reconcile")
    result["before_snapshot"] = "allowed"
except RollbackUnsafeError as e:
    result["before_snapshot"] = "refused_rollback_unsafe"

g.snapshot_topology(fixture)

try:
    result["after_snapshot"] = g.assert_rollback_safe("reconcile")
except GuardianGateError as e:
    result["after_snapshot"] = f"refused:{e}"
`,
  });
  assert.match(String(result.before_snapshot), /refused_rollback_unsafe/);
  assert.equal(result.after_snapshot, true);
});

test('10: rollback_safe gate fails closed on stale adapter proof even with snapshot', () => {
  const { result } = runScenario({
    baselineVersion: 'fixture-v1', currentVersion: 'v9-drifted',
    body: `
g.snapshot_topology(fixture)
try:
    g.assert_rollback_safe("reconcile")
    result["raised"] = None
except AdapterProofStaleError:
    result["raised"] = "adapter_proof_stale"
`,
  });
  assert.equal(result.raised, 'adapter_proof_stale');
});

test('10: rollback_safe=true remains proven by synthetic update-rollback evidence', () => {
  const ev = JSON.parse(fs.readFileSync(path.join(EVIDENCE_DIR, 'test7_update_rollback.json'), 'utf8'));
  assert.equal(ev.passed, true);
  assert.equal(ev.rollback_safe, true);
  assert.notEqual(ev.restored, ev.fail);
});

test('11: doctor repair is proof-gated and rebuilds consent canonically', () => {
  const { result } = runScenario({
    baselineVersion: 'fixture-v1',
    body: `
g.snapshot_topology(fixture)
consent = fixture / MANAGED_SURFACES["hooks_consent"][0]
consent.parent.mkdir(parents=True, exist_ok=True)
consent.write_text('{"corrupt":')
receipt = g.doctor_repair()
result.update({
    "phase": receipt.phase,
    "error": receipt.error,
    "consent_state": receipt.after_state.get("consent_state"),
    "consent_canonical": json.loads(consent.read_text()) == CANONICAL_CONSENT,
})
`,
  });
  assert.equal(result.phase, 'doctor');
  assert.equal(result.error, null);
  assert.equal(result.consent_state, 'verified');
  assert.equal(result.consent_canonical, true);
});

test('11: doctor repair refuses to touch consent when adapter proof is stale', () => {
  const { fixture, result } = runScenario({
    baselineVersion: 'fixture-v1', currentVersion: 'v9-drifted',
    body: `
g.snapshot_topology(fixture)
consent = fixture / MANAGED_SURFACES["hooks_consent"][0]
consent.parent.mkdir(parents=True, exist_ok=True)
consent.write_text('{"corrupt":')
receipt = g.doctor_repair()
result.update({
    "error": receipt.error,
    "untouched": consent.read_text() == '{"corrupt":',
})
`,
  });
  assert.equal(result.error, 'adapter_proof_stale');
  assert.equal(result.untouched, true);
});
