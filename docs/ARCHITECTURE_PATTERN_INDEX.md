# Architecture Pattern Index

## Purpose

This index maps core TNF coordination patterns to code locations and
distinguishes active runtime paths from legacy/archive artifacts.

## Active Runtime Paths

### Orchestrator / Director / Broker Patterns

- `apps/chrome-extension/src/v6/background/index.ts`
  - Browser orchestration loop, relay coordination, page-agent onboarding,
    wake/stall signaling.
- `apps/chrome-extension/src/v6/native-host/tnf-native-host.js`
  - Service broker for relay, monitor, master clock, backend/frontend control.
- `apps/chrome-extension/src/v6/popup/popup.js`
  - Main popup control plane for autonomy toggles and service orchestration
    actions.
- `scripts/relay-channel-monitor.cjs`
  - Channel monitor, wake ACK handling, heartbeat, idle/stall signaling.
- `packages/relay-core/src/standalone-relay.ts`
  - Relay runtime and channel message distribution.
- `packages/relay-core/dist/master-clock.js`
  - Master clock scheduler runtime.

### A2A / Agent-to-Agent Patterns

- `src/services/MessageRouter.ts`
  - Protocol routing for MCP vs A2A flows.
- `src/services/A2AMessageQueue.ts`
- `src/services/A2ALoadBalancer.ts`
- `src/services/A2ATaskPrioritizer.ts`
- `src/services/A2ATracer.ts`
- `src/services/A2AWorkflowScheduler.ts`
- `src/services/A2AServiceDiscovery.ts`
- `src/ai-communication.js`
  - A2A protocol framing + broker abstraction.

### Handoff / Context Transfer Patterns

- `src/services/AgentHandoffTemplateService.ts`
  - Structured handoff templates for orchestrated continuity.
- `apps/chrome-extension/src/v6/background/index.ts`
  - Page-agent onboarding context push (`FUSE_ONBOARDING_CONTEXT`).

### Operator UI / Docs Access

- `apps/chrome-extension/src/v6/popup/index.html`
  - Services tab cards for `relay`, `monitor`, `masterClock` and autonomy
    status.
  - Settings tab toggles for `autoMonitor`, `autoMasterClock`, `autoWakePing`.
- `apps/chrome-extension/src/v6/popup/docs-index.html`
  - Extension-hosted docs hub opened from popup footer `Docs` link.
- `apps/chrome-extension/src/v6/popup/docs/architecture-pattern-index.html`
  - Runtime quick-view of the architecture map.
- Canonical source remains:
  - `docs/ARCHITECTURE_PATTERN_INDEX.md`

### Continuous Self-Improvement / Self-Prompting

- `tnf-master-orchestrator.ts`
  - Continuous self-improvement loop orchestration.
- `docs/RAILWAY_CRON_SETUP.md`
  - Cron-driven self-improvement cycle and endpoints.
- `docs/TNF_AGENTIC_INFRASTRUCTURE_VISION.md`
  - Target operating model for self-improving autonomous network.
- `docs/implementation-plan-orchestration.md`
  - Self-prompting mechanism plan references.

### Meta-Skills

- `.claude/skills/framework-consciousness.md`
  - Meta-skill orchestration framing.
- `.claude/commands/self-improve.md`
  - Self-improve command workflow.
- `docs/CLAUDE_SKILLS.md`
  - Skill and meta-skill inventory references.

## Supporting / Operational Tools (Non-primary runtime)

- `tools/orchestrator-client.js`
- `tools/orchestrator-red-channel.js`
- `tools/authenticated-orchestrator-client.js`
- `tools/test-files/test-a2a-api.mjs`
- `tools/test-files/test-a2a-implementation.mjs`
- `tools/test-files/test-a2a-redis.mjs`

These are useful for validation and experiments but are not the core
extension+relay runtime path.

## Legacy / Archive Patterns (Use with caution)

### File-based handoff / queue patterns (legacy)

- `tools/legacy-files/relay-adapter.js`
- `tools/legacy-files/simple-adapter.js`
- `tools/legacy-files/copilot_agent_handler.js`
- `tools/legacy-files/autonomous-communication-monitor.js`

### Legacy handoff docs and snapshots

- `docs/archive/HANDOFF_NEXT_SESSION.md`
- `.agent/handoff_notes.txt`
- `cli-relay-queue/instance_A/outbox/*.json`

These paths document earlier file-queue and manual handoff approaches; current
direction is relay-driven, channel-native orchestration with persisted activity
logs.

## Recommended Canonical Execution Path

1. Chrome extension background orchestrates browser/page agents.
2. Native host starts/stops relay + monitor + master clock.
3. Relay carries channel traffic and activity events.
4. Monitor + watchdog keep channels alive (heartbeat, wake ping/ack).
5. Activity logs persist off-device via relay/backend storage pipeline.
