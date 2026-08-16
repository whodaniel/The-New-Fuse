# Executable Intelligence Artifact

**Artifact ID:** eia-0ae9f2d8dc93dc2b **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-16T19:47:24+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6523
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6523
- Title: Redirected current turn: 'What is "<unk>"?'
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-16T19:47:24+00:00

## Taxonomy of Actionability

### Procedural

- The parent tnf-vocabulary-alignment-audit skill already contains the full
  workflow; this "full sweep" variant would just be a convenience wrapper.
- Since I can't create it due to the description constraint, the reusable
  artifact is the audit report itself
  (FULL_VOCABULARY_ALIGNMENT_AUDIT_2026-08-13.md) plus the updated
  recent-audits.md log
- future sessions can follow that exact command sequence from the report.
- Location: cli.ts:8921,8943,16953
- Location: enums.ts:160-186 (26 values) vs broker-agent.ts lowercase strings
- Gap Area: Agent status enum vs registry
- Location: tnf-cli/src/services/WorkerEnvelope.ts
- Location: tnf-master-cumulative-id.schema.json,

### Strategic

- Gap Area: Capability enum vs broker usage

### Governance

- The parent tnf-vocabulary-alignment-audit skill already contains the full
  workflow; this "full sweep" variant would just be a convenience wrapper.
- Since I can't create it due to the description constraint, the reusable
  artifact is the audit report itself
  (FULL_VOCABULARY_ALIGNMENT_AUDIT_2026-08-13.md) plus the updated
  recent-audits.md log
- Gaps identified during the audit that weren't in the original 11 surfaces:
- Drift Risk: Kind filter inconsistency
- Drift Risk: Enum UPPERCASE vs broker lowercase
- Drift Risk: Registry expects lowercase
- Location: protocol-contracts/src/identity.ts
- Drift Risk: New categories added without audit
- Drift Risk: Version drift risk
- Drift Risk: Undocumented in ROLE_DEFINITIONS
- Drift Risk: New bags added without metadata policy review
- protocol-contracts/src/handoff.ts
- Drift Risk: Separate from federated IDs, often conflated
- Drift Risk: Must import from a2a-core
- Drift Risk: Routing ambiguity
- The audit report already captures them implicitly via INC-5 and INC-7.

## Utility Metrics

- Freshness Decay: Medium
- Implementation Density: 0.133
- Verification Difficulty: Hard

## Synthesis

Artifact captures 8 procedural, 1 strategic, and 16 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.
