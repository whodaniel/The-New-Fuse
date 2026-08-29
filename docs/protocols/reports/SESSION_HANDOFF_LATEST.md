# SESSION_HANDOFF_LATEST

Protocol ACK: `TNF_PROTOCOL_ACK` Spec: `tnf/session-handoff/0.2` Created At:
`2026-08-27T20:45:56.693Z` Handoff ID: `e85d971f-770d-4cfe-98f6-4cd46280f557`

## Scope

- Repository: `whodaniel/tnf-monorepo`
- Canonical Source: `whodaniel/tnf-monorepo`
- Branch: `wip/resource-governance-20260827-163959`
- Head SHA: `f328e16919f8d96429f961040f2f59d7fd397b41`
- Sensitive Scope: `internal`

## Classification

- Work Domain: `unknown`
- Artifact Destination: `unknown`
- Data Residency: `unknown`
- Sensitivity: `unknown`

## Work Summary

- Built fleet-wide TNF resource governance (tnf-resource-guard.cjs preflight
  module, tnf-launchd-guard.sh wrapper routing all launchd jobs,
  tnf-resource-watchdog.cjs runtime SIGTERM/SIGKILL enforcement daemon) after an
  unguarded qa-swarm launchd job drove load to 84-88 and crashed shells
  fleet-wide; validated live in production (watchdog caught and corrected a real
  breach + a class miscalibration).
- Diagnosed and partially fixed the TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL
  enforcement gap: implemented scripts/harness/resolve-workspace-tier.cjs (the
  previously-"proposed" Turn Zero task-class->tier resolver), after a concurrent
  agent process force-switched this shared checkout's branch mid-session and
  discarded uncommitted edits (recovered from conversation memory, not git;
  second occurrence of the 2026-08-09 incident this protocol was written for).

## Changed Paths

- CLAUDE.md
- docs/protocols/TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md
- docs/protocols/TNF_RESOURCE_GOVERNANCE_MANDATE.md
- scripts/harness/resolve-workspace-tier.cjs
- scripts/lib/tnf-resource-guard.cjs
- scripts/protocols/run-chronological-process.cjs
- scripts/runtime/local-subdirector-service.sh
- scripts/runtime/tnf-launchd-guard.sh
- scripts/runtime/tnf-resource-watchdog.cjs
- .agent/META_SKILLS_GUIDE.md
- .agent/agents/agy.md
- .agent/context/agent-onboarding.md
- .agent/context/resource-map.md
- .agent/fleet/agent-pathway-matrix.json
- .agent/skill-bank/resource-registry-import.json
- .agent/skill-bank/skills-index.json
- .agent/skill-bank/skills-summary.md
- .agent/skill-bank/snapshots/project-agent/competitor-alternatives-50d9b99a/SKILL.md
- .agent/skills/context-frontloader/SKILL.md
- .agent/skills/framework-consciousness/SKILL.md
- .agent/skills/library-of-living-knowledge/SKILL.md
- .agent/skills/skill-builder/SKILL.md
- .agent/skills/tnf-engineering-context/SKILL.md
- .antigravity/skills/context-frontloader/SKILL.md
- .antigravity/skills/framework-consciousness/SKILL.md
- .antigravity/skills/library-of-living-knowledge/SKILL.md
- .antigravity/skills/skill-builder/SKILL.md
- .claude/agents/pi-coding-agent.md
- .claude/skills/context-frontloader.md
- .claude/skills/framework-consciousness.md
- .claude/skills/library-of-living-knowledge.md
- .claude/skills/skill-builder.md
- .jules/.Jules/skills/context-frontloader/SKILL.md
- .jules/.Jules/skills/framework-consciousness/SKILL.md
- .jules/.Jules/skills/library-of-living-knowledge/SKILL.md
- .jules/.Jules/skills/skill-builder/SKILL.md
- .skills/context-frontloader/SKILL.md
- .skills/framework-consciousness/SKILL.md
- .skills/library-of-living-knowledge/SKILL.md
- .skills/skill-builder/SKILL.md
- .skills/tnf-engineering-context/SKILL.md
- AGENTS.md
- apps/api/logs/.76e5aaeb28e010d4c3e49a6218291a322552cba3-audit.json
- apps/chrome-extension/dist-v7/content/index.js
- apps/chrome-extension/dist-v7/manifest.json
- apps/chrome-extension/dist-v7/native-host/tnf-native-host.cjs
- apps/chrome-extension/dist-v7/popup/index.html
- apps/chrome-extension/dist-v7/popup/popup.css
- apps/chrome-extension/dist-v7/popup/popup.js
- apps/chrome-extension/scripts/verify-extension-dist.cjs
- apps/chrome-extension/src/v6/background/index.ts
- apps/chrome-extension/src/v6/manifest.json
- apps/chrome-extension/src/v6/native-host/tnf-native-host.cjs
- apps/chrome-extension/src/v6/native-host/tnf-native-host.test.cjs
- apps/chrome-extension/src/v6/popup/index.html
- apps/chrome-extension/src/v6/popup/popup.css
- apps/chrome-extension/src/v6/popup/popup.js
- apps/chrome-extension/src/v6/shared/**tests**/channel-neutrality.test.ts
- apps/chrome-extension/src/v6/shared/**tests**/federation-identity.test.ts
- apps/chrome-extension/src/v6/shared/**tests**/standard-channels.test.ts
- apps/chrome-extension/src/v6/shared/constants.ts
- apps/chrome-extension/src/v6/shared/federation-identity.ts
- apps/chrome-extension/src/v6/shared/types.ts
- apps/chrome-extension/webpack.v7.config.cjs
- apps/frontend/docs/audits/live-link-crawl.json
- apps/frontend/docs/audits/live-link-crawl.md
- apps/frontend/public/visualizations/terminals/data/twip-terminal-macro-board-latest.md
- apps/frontend/public/visualizations/terminals/data/twip-terminal-macro-board.state.json
- apps/frontend/src/components/A2AMultiAgentChat.tsx
- apps/frontend/src/components/ChatRoom.tsx
- apps/frontend/src/components/chat-interface.tsx
- apps/frontend/src/components/chat/chat-interface.tsx
- apps/frontend/src/components/ui/scroll-area.tsx
- apps/frontend/src/data/codebase_map.json
- apps/frontend/src/pages/WorkspaceChatPage.tsx
- apps/frontend/src/pages/chat/ChatPage.tsx
- apps/tauri-desktop/src/components/chat/AgentSelectorPanel.tsx
- apps/tauri-desktop/src/components/chat/ChatCodeBlock.tsx
- apps/tauri-desktop/src/components/chat/ChatMessageItem.tsx
- apps/tauri-desktop/src/components/layout/SynergyStatusBar.tsx
- apps/tauri-desktop/src/hooks/useAuth.tsx
- apps/tauri-desktop/src/lib/supabase.ts
- apps/tauri-desktop/src/services/api.ts
- apps/tauri-desktop/src/stores/agentStore.ts
- data/agent-registry/agent_capabilities.json
- data/agent-registry/agent_relationships.json
- data/agent-registry/agent_tags.json
- data/agent-registry/agents.json
- data/agent-registry/onboarding-agent.json
- data/agent-registry/registry_summary.json
- data/harness/onboarding-contract.json
- data/llm-intel/arena-intel-latest.json
- data/llm-intel/arena-intel.json
- data/llm-intel/history/intel_2026-08-26.json
- data/llm-intel/ranking-recommendations.json
- data/llm-intel/ranking-report-latest.md
- data/llm-provider-status.json
- data/marketplace/catalog-items.json
- data/providers/catalog.json
- data/providers/nvidia-models.json
- docs/architecture/tnf-master-framework.md
- docs/architecture/tnf-master-framework.mmd
- docs/core/FRONTLOAD_MANIFEST.md
- docs/operations/TNF_STAFF_MASTER_CALENDAR_AND_SCHEDULE.md
- docs/operations/tnf-master-reconciliation-report-latest.json
- docs/operations/tnf-master-reconciliation-report-latest.md
- docs/operations/tnf-substrate-seal.json
- docs/protocols/AGENT_STATUS_LEDGER.md
- docs/protocols/LIVING_STATE.md
- docs/protocols/reports/FEDERATED_WS_CHANNEL_CHECK_LATEST.json
- docs/protocols/reports/SESSION_HANDOFF_LATEST.json
- docs/protocols/reports/SESSION_HANDOFF_LATEST.md
- docs/protocols/reports/agent-pathway-matrix.latest.json
- docs/protocols/reports/twip-terminal-macro-board-latest.md
- package.json
- packages/claw-skills/context-frontloader/SKILL.md
- packages/claw-skills/framework-consciousness/SKILL.md
- packages/claw-skills/library-of-living-knowledge/SKILL.md
- packages/claw-skills/skill-builder/SKILL.md
- packages/port-management/src/services/port-registry.service.ts
- packages/relay-core/scripts/run-relay.cjs
- packages/relay-core/src/http/RelayHttpHandler.ts
- packages/relay-core/src/standalone-relay.ts
- packages/tnf-cli/src/cli.ts
- packages/tnf-cli/src/command-surface.snapshot.json
- packages/tnf-cli/src/commands/catalog.ts
- packages/tnf-cli/src/services/ModelsService.ts
- packages/tnf-cli/src/utils/llm-client.ts
- packages/ui-consolidated/package.json
- packages/ui-consolidated/src/components/MultiAgentChat.tsx
- packages/ui-consolidated/src/utils/index.ts
- packages/ui-consolidated/vite.config.ts
- pnpm-lock.yaml
- scripts/agents/reconcile-agent-banks.cjs
- scripts/install-agent-frontload.cjs
- scripts/lib/tnf-port-reaper.cjs
- scripts/orchestrator/factory-boot.sh
- scripts/skills/skill-bank-sync.cjs
- scripts/tnf-metaskills-audit.cjs
- scripts/tnf-ports.cjs
- scripts/verify-repo-frontload.cjs
- apps/chrome-extension/src/v6/content/injectable/FloatingPanel.ts
- apps/tauri-desktop/src/ComprehensiveRouter.tsx
- apps/tauri-desktop/src/config/routeComponents.tsx
- apps/tauri-desktop/src/config/routes.ts
- apps/tauri-desktop/src/pages/A2AControl.tsx
- apps/tauri-desktop/src/pages/AgentHub.tsx
- apps/tauri-desktop/src/pages/Dashboard.tsx
- apps/tauri-desktop/src/pages/MultiAgentChat.tsx
- apps/tauri-desktop/src/pages/Settings.tsx
- .agent/skills/imported-claude-agents/opencode-cli-agent/
- .agent/skills/meta-skill-meta-skill/
- .agent/skills/tnf-chat-surface-quality/
- .agent/skills/tnf-continuous-correction-flywheel/
- .claude/agents/opencode-cli-agent.md
- .cursor/skills/
- .skills/imported-claude-agents/opencode-cli-agent/
- .skills/meta-skill-meta-skill/
- apps/chrome-extension/src/v6/sidepanel/
- data/llm-intel/history/intel_2026-08-27.json
- data/providers/catalog.json.bak-20260827T170616Z
- data/providers/catalog.json.bak-20260827T170851Z
- data/providers/catalog.json.bak-20260827T171352Z
- data/providers/nvidia-models.json.bak-20260827T170616Z
- data/providers/nvidia-models.json.bak-20260827T170851Z
- data/providers/nvidia-models.json.bak-20260827T171352Z
- packages/tnf-cli/src/utils/load-home-credentials.ts
- packages/ui-consolidated/src/utils/scrollViewportToEnd.ts
- scripts/lib/tnf-relay-port-catalog.cjs
- scripts/quality/
- scripts/skills/tnf-meta-skill-meta-skill.cjs
- scripts/skills/tnf-meta-skill-meta-skill.test.cjs

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

- Read docs/protocols/TNF_RESOURCE_GOVERNANCE_MANDATE.md and
  docs/protocols/TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md's updated Enforcement
  table.
- Check ~/.tnf/alerts.json for any resource-watchdog actions since this handoff.
- Check AGENTS.md diff (git show <this-branch>:AGENTS.md vs HEAD) for the
  still-pending, operator-approval-required cross-link.

## Next Actions

- Wire resolve-workspace-tier.cjs into the onboarder's automatic Turn Zero flow
  (currently advisory/manual-invoke only) — deferred because that flow is
  complex enough that changing it blind risks more than the current gap costs.
- Get operator approval for the AGENTS.md cross-link change (blocked by the
  agent-self-edit authority gate; not committed).
- Decide whether/how to merge wip/resource-governance-\* into main; it currently
  sits on top of the sentinel-fix-marketplace-cmd-injection branch's tip, not
  main.
