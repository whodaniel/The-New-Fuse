# SESSION_HANDOFF_LATEST

Protocol ACK: `TNF_PROTOCOL_ACK` Spec: `tnf/session-handoff/0.2` Created At:
`2026-09-05T00:59:47.244Z` Handoff ID: `d73e7a3e-268a-4448-9fcf-92045fdeab35`

## Scope

- Repository: `whodaniel/tnf-monorepo`
- Canonical Source: `whodaniel/tnf-monorepo`
- Branch: `main`
- Head SHA: `b0ae1dd278d0d47c84e75fa8074241f2d7698c5a`
- Sensitive Scope: `internal`

## Classification

- Work Domain: `unknown`
- Artifact Destination: `unknown`
- Data Residency: `unknown`
- Sensitivity: `unknown`

## Work Summary

- Execute the Platform Reconciliation Program
  (docs/operations/PLATFORM_RECONCILIATION_PROGRAM_2026-09-05.md) under the
  Sub-Director Directive
  (docs/operations/SUBDIRECTOR_DIRECTIVE_PLATFORM_RECONCILIATION_2026-09-05.md);
  the local sub-director orchestrates the fleet by capability
- Ground truth 2026-09-05: app.thenewfuse.com (Production/main, deploy 195e7d31,
  commit 05e1189) and production.thenewfuse-main.pages.dev (Preview alias
  'production', deploy 209ff5a6, commit 9ac13b2) are the same apps/frontend
  build; bundles byte-equivalent apart from 7 chunks under 151 bytes.
  Reconciliation = promote one verified build to main, not merge two UIs
- Drag-and-drop workflow builder works at /workflows/builder (verified live); it
  was hidden by #278 folding Forge into the collapsed Advanced Controls toggle.
  Fixed on feat/platform-reconciliation-20260905 (commit b8366d440, worktree
  .claude/worktrees/platform-reconciliation): Forge first-class section,
  Workflows children Builder/Templates/Executions, regression test; tsc clean,
  sidebar tests 7/7
- Cloud fleet gap: /api/harness/status reads ~/.tnf files + local Redis, empty
  on Cloud Run; local relay :3007 has 6 agents, Redis registry ~20,
  relay.thenewfuse.com/agents 0; openclaw-runtime /v1/agents/invoke live but
  uncalled by the frontend; no local-to-cloud uplink exists
- Prior session 5a0b2f7a (Tauri Settings provider persistence) was accidentally
  overwritten by a probe emit 24a9e7f9; its summary is preserved in LIVING_STATE
  history

## Changed Paths

- apps/frontend/src/data/codebase_map.json
- apps/tauri-desktop/src/config/llmProviders.test.ts
- apps/tauri-desktop/src/config/llmProviders.ts
- apps/tauri-desktop/src/pages/Settings.tsx
- apps/tauri-desktop/src/stores/settingsStore.ts
- data/agent-registry/onboarding-agent.json
- data/llm-provider-status.json
- docs/operations/PLATFORM_RECONCILIATION_PROGRAM_2026-09-05.md
- docs/operations/SUBDIRECTOR_DIRECTIVE_PLATFORM_RECONCILIATION_2026-09-05.md
- docs/protocols/AGENT_STATUS_LEDGER.md
- docs/protocols/LIVING_STATE.md
- docs/protocols/reports/FEDERATED_WS_CHANNEL_CHECK_LATEST.json
- docs/protocols/reports/SESSION_HANDOFF_LATEST.json
- docs/protocols/reports/SESSION_HANDOFF_LATEST.md
- packages/tnf-cli/src/utils/llm-client.ts

## Verification

- privacy_guard: `na`
- secret_sweep: `na`
- docs_pii_guard: `na`
- supabase_rls_audit: `na`

## Continuation

- Owner: `tnf-local-subdirector`
- Targets: `tnf-local-subdirector`, `frontend`, `api`, `relay`, `cloudflare`,
  `tnf-cli`, `qa`
- Priority: `high`

### Resume Checklist

- Read docs/protocols/reports/SESSION_HANDOFF_LATEST.md
- Validate SESSION_HANDOFF_LATEST.json against
  docs/protocols/schemas/tnf-session-handoff.schema.json
- Execute listed next actions in order and preserve privacy/security gates

## Next Actions

- Sub-director: run Turn Zero, re-probe the program doc section 4, set fleet
  autonomy, enqueue lanes A-E and assign by capability
- Lane A: land feat/platform-reconciliation-20260905, build apps/frontend,
  deploy preview, verify Forge + drag-drop + /api/agents, then wrangler pages
  deploy dist --project-name=thenewfuse-main --branch=main and verify on
  app.thenewfuse.com
- Lane B: land fix/workflow-execution-engine via real worktree merge; triage
  feat/workflow-builder-tauri-migration vs main since #272; verify drag-drop
  save run round trip on the public site
- Lane C: C1 cloud fleet source for harness/status and /api/agents on Cloud Run;
  C2 local-to-cloud roster uplink (relay REGISTER on
  wss://relay.thenewfuse.com/ws or SharedState deposit, operator login custody
  auth); C3 origin badges local/cloud; C4 Run -> POST /v1/agents/invoke with
  tenant + budgetCap, receipt visible in Audit Channels
- Lane D: PR the 4 commits on chore/worktree-consolidation-20260904; re-verify
  retire-openclaw carries; fresh branch per PR
- Lane E: every full-auto cycle fixes the highest-leverage measurable gap
  end-to-end with evidence and records a ledger row
