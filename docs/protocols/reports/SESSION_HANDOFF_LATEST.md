# SESSION_HANDOFF_LATEST

Protocol ACK: `TNF_PROTOCOL_ACK`
Spec: `tnf/session-handoff/0.2`
Created At: `2026-09-05T02:11:59.989Z`
Handoff ID: `0c344d99-2cb6-4b9d-b326-c4c937d19992`

## Scope
- Repository: `whodaniel/tnf-monorepo`
- Canonical Source: `whodaniel/tnf-monorepo`
- Branch: `main`
- Head SHA: `a2671b8dd071119bdd7bae9aeb4020ee7449eed7`
- Sensitive Scope: `internal`

## Classification
- Work Domain: `unknown`
- Artifact Destination: `unknown`
- Data Residency: `unknown`
- Sensitivity: `unknown`

## Work Summary
- Registry-driven pattern extended to WorkflowBuilder + verifiedModels offline fallback
- WorkflowBuilder ProviderSelect now renders all 23 canonical LLM_PROVIDERS (id-keyed, was 9 hardcoded incl. registry-inexistent Cerebras); legacy ids (gemini/cerebras/local) kept selectable for saved graphs via resolveProviderId guard
- verifiedModels.ts rebuilt: provider layer derived from data/providers/catalog.json (full registry incl. aihubmix/anthropic/xai/qwen/moonshot etc.), model layer hybrid = catalog inline models verbatim + CURATED_MODEL_FALLBACKS for empty entries (aihubmix coding-glm-5.3 first) + desktop-only chrome-ai/google-gemma/edge-slm; stale Cerebras + gemini-2.x entries dropped; NVIDIA-first default preserved
- AgentHub Create Agent model select shows placeholder when offline fallback has no models for a provider

## Changed Paths
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
- apps/frontend/public/visualizations/terminals/data/twip-terminal-macro-board-latest.md
- apps/frontend/public/visualizations/terminals/data/twip-terminal-macro-board.state.json
- apps/frontend/src/data/codebase_map.json
- apps/tauri-desktop/src/config/verifiedModels.ts
- apps/tauri-desktop/src/pages/AgentHub.tsx
- apps/tauri-desktop/src/pages/WorkflowBuilder.tsx
- docs/protocols/CHALLENGE_RATIONALE_LOG.md
- docs/protocols/reports/twip-terminal-macro-board-latest.md
- packages/tnf-cli/src/cli.ts
- packages/tnf-cli/src/services/DispatchGuard.test.ts
- packages/tnf-cli/src/services/DispatchGuard.ts
- packages/tnf-cli/src/slack/slack.test.ts
- scripts/agent-registry/agent-registry-prune.cjs
- scripts/agents/subdirector-local-cli-agent-cycle.sh
- scripts/lib/tnf-fleet-mode.cjs
- scripts/lib/tnf-fleet-mode.sh
- scripts/lib/tnf-resource-guard.cjs
- scripts/runtime/local-subdirector-runtime.cjs
- scripts/runtime/local-subdirector-service.sh
- scripts/runtime/tnf-launchd-guard.sh
- apps/tauri-desktop/src/config/verifiedModels.test.ts
- scripts/lib/tnf-fleet-mode-priority.test.cjs
- vitest.config.ts

## Verification
- privacy_guard: `na`
- secret_sweep: `na`
- docs_pii_guard: `na`
- supabase_rls_audit: `na`

## Continuation
- Owner: `tnf-orchestrator`
- Targets: `story-architect`, `librarian`
- Priority: `high`

### Resume Checklist
- Read docs/protocols/reports/SESSION_HANDOFF_LATEST.md
- Validate SESSION_HANDOFF_LATEST.json against docs/protocols/schemas/tnf-session-handoff.schema.json
- Execute listed next actions in order and preserve privacy/security gates

## Next Actions
- Optional: commit tauri-desktop changes (5 modified + 1 new test file) and the llm-client.ts loadEnv fix from earlier this session
