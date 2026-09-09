# SESSION_HANDOFF (codex-artifact-retention)

Protocol ACK: `TNF_PROTOCOL_ACK` Spec: `tnf/session-handoff/0.3` Created At:
`2026-09-08T06:03:12.668Z` Handoff ID: `943d8743-b758-425b-9f65-c2ab6e9bdf4c`

## Scope

- Repository: `whodaniel/tnf-monorepo`
- Canonical Source: `whodaniel/tnf-monorepo`
- Branch: `fix/artifact-retention-20260908`
- Head SHA: `befa5338cb4b8fa77677dc12ee1a4fe1d65d4ea8`
- Sensitive Scope: `internal`

## Classification

- Work Domain: `core`
- Artifact Destination: `private_control_plane`
- Data Residency: `product_state`
- Sensitivity: `internal`

## Work Summary

- Bounded lossless artifact retention with verified restore and daily
  installation procedure

## Changed Paths

- .agent/skills/tnf-engineering-context/SKILL.md
- docs/protocols/AGENT_STATUS_LEDGER.md
- docs/protocols/AI_AGENT_ARTIFACT_RETENTION_PROTOCOL.md
- docs/protocols/LIVING_STATE.md
- docs/protocols/TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md
- docs/protocols/handoff-registry.json
- docs/protocols/reports/SESSION_HANDOFF_LATEST.json
- docs/protocols/reports/SESSION_HANDOFF_LATEST.md
- docs/protocols/reports/handoffs/2026/f9e1fcbd-ad54-47e1-be97-6056d1a445ce.json
- docs/protocols/reports/session_handoff_codex-artifact-retention-20260908T060056-f9e1fcbd.json
- docs/protocols/reports/session_handoff_codex-artifact-retention-20260908T060056-f9e1fcbd.md
- docs/protocols/workspace-leases.json
- scripts/operations/artifact-retention.py
- scripts/operations/install-artifact-retention.py
- scripts/operations/swarm-disk-retention.sh
- scripts/operations/test_artifact_retention.py
- scripts/operations/tnf-growth-audit.cjs
- apps/api/src/controllers/workspace.controller.ts
- apps/api/src/modules/unified-ledger/ledger-scope.interceptor.ts
- apps/api/src/modules/unified-ledger/tenant-ledger-store.ts
- apps/api/src/modules/unified-ledger/unified-ledger.controller.spec.ts
- apps/api/src/modules/unified-ledger/unified-ledger.controller.ts
- apps/api/src/modules/unified-ledger/unified-ledger.module.ts
- apps/api/src/modules/unified-ledger/unified-ledger.service.spec.ts
- apps/api/src/modules/unified-ledger/unified-ledger.service.ts
- apps/api/src/modules/unified-ledger/unified-ledger.types.ts
- apps/api/src/services/agent-handoff.service.ts
- apps/api/test/ledger-tenancy.node.ts
- docs/operations/LEDGER_TENANCY.md
- docs/protocols/reports/SESSION_HANDOFF_LEDGER_TENANCY_20260907.json
- docs/protocols/reports/SESSION_HANDOFF_LEDGER_TENANCY_20260907.md
- packages/api/src/modules/unified-ledger/unified-ledger.module.ts
- packages/tnf-cli/src/services/GoalsService.ts
- packages/tnf-cli/src/services/KanbanService.ts
- packages/tnf-cli/src/services/UnifiedLedgerClient.ts
- docs/protocols/reports/session_handoff_codex-artifact-retention-20260908T060312-943d8743.json
- docs/protocols/reports/session_handoff_codex-artifact-retention-20260908T060312-943d8743.md

## Verification

- privacy_guard: `pass`
- secret_sweep: `pass`
- docs_pii_guard: `pass`
- supabase_rls_audit: `na`

## Continuation

- Owner: `codex-artifact-retention`
- Targets: `story-architect`, `librarian`
- Priority: `high`

### Resume Checklist

- Read docs/protocols/reports/SESSION_HANDOFF_LATEST.md
- Validate SESSION_HANDOFF_LATEST.json against
  docs/protocols/schemas/tnf-session-handoff.schema.json
- Execute listed next actions in order and preserve privacy/security gates

## Next Actions

- Merge and verify main then install daily bounded archival
- Retain active and unmerged worktrees
