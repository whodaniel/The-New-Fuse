#!/usr/bin/env node
/**
 * Contract guard for scripts/protocols/agent-self-edit-gate.cjs.
 *
 * The gate shipped with 197 lines of authorization logic and ZERO call sites,
 * because the registry it reads
 * (data/protocols/agent-owned-docs.registry.json) did not exist — it was
 * swept up in a gitignore of data/protocols/*.json. A gate that cannot run is
 * indistinguishable from a gate that always allows.
 *
 * These tests prove the gate actually denies. The case that matters most is
 * authority self-edit: TURN_ZERO_MANDATE.md records an agent editing that very
 * file to assert operator authorization it did not have. The registry-wide
 * approval list exists to make that structurally impossible, and test 4 proves
 * it holds even for the Director, whose own allowlist would otherwise permit it.
 *
 * Run: node scripts/protocols/agent-self-edit-gate.test.cjs
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..', '..');
const GATE = path.join(REPO, 'scripts', 'protocols', 'agent-self-edit-gate.cjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-self-edit-'));

let pass = 0;
let fail = 0;

function check(name, cond, detail = '') {
  if (cond) {
    console.log(`  PASS  ${name}`);
    pass += 1;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    fail += 1;
  }
}

const GATES = [
  'TENANT_SCOPE_GATE',
  'TRACE_CONTINUITY_GATE',
  'CHANNEL_MEMBERSHIP_GATE',
  'OWNERSHIP_GATE',
  'PATH_SCOPE_GATE',
  'CONTENT_POLICY_GATE',
];

function request({ agentId, ownerId = agentId, targetPath, approved = null, tenant = 'tnf-local' }) {
  const req = {
    spec: 'tnf/agent-self-edit/0.1',
    action_id: '11111111-2222-4333-8444-555555555555',
    tenant_id: tenant,
    agent: { agent_id: agentId },
    target: {
      path: targetPath,
      owner_agent_id: ownerId,
      doc_kind: 'NOTES',
      ownership_scope: 'agent_private',
    },
    operation: {
      mode: 'append',
      summary: 'test operation',
      justification: 'contract test for the self-edit gate',
    },
    cumulative_id: {
      spec: 'tnf/mcid/0.1',
      id: '66666666-7777-4888-8999-aaaaaaaaaaaa',
      scope: { tenant_id: tenant },
      lineage: { correlation_id: '77777777-8888-4999-8aaa-bbbbbbbbbbbb', causation_id: null },
    },
    gate_decisions: GATES.map((g) => ({ gate: g, decision: 'allow', reason: 'test', at: '2026-08-05T00:00:00Z' })),
    created_at: '2026-08-05T00:00:00Z',
  };
  if (approved !== null) req.approval = { required: true, approved };
  return req;
}

function run(req) {
  const p = path.join(tmp, `req-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(p, JSON.stringify(req, null, 2));
  const r = spawnSync('node', [GATE, '--request', p, '--json'], { encoding: 'utf8', cwd: REPO });
  let parsed = null;
  try {
    parsed = JSON.parse(r.stdout);
  } catch {
    /* leave null */
  }
  return { status: r.status, out: parsed, raw: `${r.stdout}${r.stderr}` };
}

// 1. Registry must exist — its absence is what disabled the gate for months.
const registryPath = path.join(REPO, 'data', 'protocols', 'agent-owned-docs.registry.json');
check('authorization registry exists', fs.existsSync(registryPath), registryPath);

// 2. In-scope self-edit is allowed.
const ok = run(request({ agentId: 'tnf-agent-director', targetPath: 'docs/protocols/reports/x.md' }));
check('allows an in-allowlist self-edit', ok.out?.decision === 'allow', ok.raw.slice(0, 140));

// 3. Out-of-scope path is denied.
const oos = run(request({ agentId: 'tnf-agent-director', targetPath: 'packages/tnf-cli/src/cli.ts' }));
check('denies a path outside the owner allowlist', oos.out?.decision === 'deny');
check('denial is non-zero exit', oos.status !== 0, `status=${oos.status}`);

// 4. THE one that matters: authority documents are approval-gated for everyone,
//    including an owner whose allowlist would otherwise cover them.
const authority = run(request({ agentId: 'tnf-agent-director', targetPath: 'docs/protocols/TURN_ZERO_MANDATE.md' }));
check('denies unapproved edit of TURN_ZERO_MANDATE.md', authority.out?.decision === 'deny');
check(
  'denial cites the registry-wide authority rule',
  (authority.out?.reasons || []).some((r) => /approval-required \(authority surface\)/.test(r)),
  JSON.stringify(authority.out?.reasons || [])
);

// 5. Self-approval must not be a bypass: approval must be present AND approved.
const selfApproved = run(
  request({ agentId: 'tnf-agent-director', targetPath: 'docs/protocols/TURN_ZERO_MANDATE.md', approved: false })
);
check('approval.approved=false still denies', selfApproved.out?.decision === 'deny');

// 6. Unknown agents get nothing (default deny).
const unknown = run(request({ agentId: 'not-a-registered-agent', targetPath: 'docs/protocols/reports/x.md' }));
check('denies an agent with no registry profile', unknown.out?.decision === 'deny');

// 7. Cross-agent edits are not self-edits.
const cross = run(
  request({ agentId: 'tnf-agent-director', ownerId: 'master-clock', targetPath: 'docs/protocols/reports/x.md' })
);
check('denies editing another agent\'s document', cross.out?.decision === 'deny');

// 8. Path traversal is rejected. The schema pattern catches this before a
//    decision is produced, so rejection surfaces as a non-zero exit rather
//    than decision:"deny" — either is a refusal, neither is an allow.
const trav = run(request({ agentId: 'tnf-agent-director', targetPath: 'docs/protocols/reports/../../../etc/passwd' }));
check(
  'refuses path traversal',
  trav.status !== 0 && trav.out?.decision !== 'allow',
  `status=${trav.status} ${trav.raw.slice(0, 90)}`
);

// 9. CI workflows are authority surfaces too.
const wf = run(request({ agentId: 'tnf-agent-director', targetPath: '.github/workflows/honest-failure-gate.yml' }));
check('denies unapproved edit of a CI workflow', wf.out?.decision === 'deny');

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
