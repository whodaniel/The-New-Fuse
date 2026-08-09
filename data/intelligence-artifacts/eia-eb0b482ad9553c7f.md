# Executable Intelligence Artifact

**Artifact ID:** eia-eb0b482ad9553c7f **Spec:** tnf/executable-intelligence/0.2
**Generated:** 2026-08-09T04:36:20+00:00 **Class/Status:** [INTEL] [PENDING]

## Ownership & Release

- Owner Principal: danielgoldberg
- Visibility: private
- Release State: sealed
- Agent Allowlist: (none)
- Release Approved By: (not released)
- Released At: (not released)
- Release Note: (none)

## Source Attribution

- Source ID: apple-notes-new-may-2026-6445
- Type: note
- URI: apple-notes://on-my-mac/NEW-%20May-2026/6445
- Title: Thought: Let me check the current state of the TNF system and
  understand…
- Author:
- Publisher:
- Published At:
- Retrieved At: 2026-08-09T04:36:20+00:00

## Taxonomy of Actionability

### Procedural

- Let me also check the broker agent status and the orchestrator state.
- $ redis-cli HGET tnf:master:state orchestrator 2>/dev/null
- {"sessionId":"ORCHESTRATOR-1784834882339","lastHeartbeat":1784845535908,"stats":{"total":0,"active":0,"stalled":0,"offline":0,"withRole":0,"withFulfillment":0,"withQualities":0,"withIdNumber":0,"withMcid":0},"superCycle":{"total":0,"healthy":0,"stale":0},"isActive":true}
- - The broker agent was restarted with local Redis
- Run the factory-supervisor to monitor and recover agents
- Check and refresh the agent registry
- Run diagnostic checks on the system
- Run a diagnostic check on the TNF system
- Execute an agent registry refresh
- Check specific agent health

### Strategic

- - agent_model-watchdog_1784980734501 - model-watchdog (broker role) - active
- Watchdog: model-watchdog_1784980734501

### Governance

- (none)

## Utility Metrics

- Freshness Decay: Medium
- Implementation Density: 0.196
- Verification Difficulty: Hard

## Synthesis

Artifact captures 10 procedural, 2 strategic, and 0 governance units. Use
procedural units for immediate execution, then vet strategic and governance
units through TNF gates before protocol adoption.
