# Cross-Agent Capability & Activity Ledger

**Status:** active protocol draft for implementation  
**Updated:** 2026-08-20  
**Related:** #113, #118, #119

## Purpose

TNF must let heterogeneous agent systems understand one another without pretending that all platforms expose the same APIs or that one provider owns the user's operational history.

The protocol separates three kinds of truth:

1. **Platform truth** — what a product publicly supports now, recorded in `data/agent-ecosystem/platform-capabilities.json` with source and verification date.
2. **Instance truth** — what is actually enabled/connected for one permissioned provider instance, represented by `AgentInstanceSnapshot`.
3. **Activity truth** — what that instance actually attempted or completed, represented by `AgentActivityReceipt`.

Existing `data/agent-registry/*` remains the canonical TNF persona/agent registry. This protocol does not replace it. It adds platform/runtime awareness around the agents that may execute those roles.

## Core rule

> No TNF agent should need to guess what another agent platform can do, what connectors it currently has, or what work it recently completed when a permissioned adapter can provide a current receipt.

## Privacy and authority boundary

Cross-agent interoperability is **not** a license to synchronize complete private chat histories, passwords, session cookies, API keys, OAuth refresh tokens, or unrestricted account data.

Adapters must:

- expose only scopes authorized by the user/workspace;
- use stable pseudonymous `subjectRef`, `workspaceRef`, and `instanceRef` values where possible;
- publish references/digests instead of entire sensitive artifacts when full content is unnecessary;
- omit raw secrets unconditionally;
- make provenance attributable to an adapter and observation time;
- preserve platform-native approval/permission semantics rather than bypassing them;
- let a user disconnect/revoke an adapter without corrupting historic receipts.

## Protocol objects

Public TypeScript contracts live in `packages/control-plane-contracts/src/agent-interop.ts`.

### AgentInstanceSnapshot

A point-in-time view of a connected provider instance:

- platform/product;
- instance/workspace/subject references;
- capabilities and their status;
- connectors/apps/plugins/MCP endpoints by safe identifier;
- schedules/monitors/tasks;
- active task references;
- provenance and optional evidence references;
- expiry/staleness boundary.

A platform marketing claim does not imply `status: enabled`. Only a runtime observation, adapter observation, or explicit user assertion should do that.

### AgentActivityReceipt

A normalized record of work:

- task identity and parent task when delegated;
- platform/instance;
- capability IDs used;
- start/completion timestamps;
- outcome;
- concise summary;
- artifact references;
- provider operation references;
- cost-authorization/usage references when applicable;
- provenance.

Receipts should be idempotent. `receiptId` or a stable provider operation/task ID must prevent duplicate ingestion.

## Adapter lifecycle

A provider bridge SHOULD implement:

1. **Discover** — identify platform instance and available integration surface.
2. **Consent** — obtain only the permissions needed for the selected scopes.
3. **Snapshot** — emit current capability/connector/schedule state.
4. **Observe** — emit normalized activity receipts for completed/in-progress work.
5. **Hydrate** — TNF stores/updates the snapshot and appends deduplicated receipts.
6. **Project** — other authorized TNF agents receive a compact orientation projection.
7. **Refresh** — stale snapshots are refreshed on demand or by low-cost local scheduling.
8. **Revoke** — stop future reads/actions while preserving auditable historic receipts unless deletion policy requires otherwise.

## Orientation projection

A receiving agent generally does **not** need raw histories. TNF should project a compact packet such as:

```json
{
  "platform": "google-gemini-spark",
  "instanceRef": "gemini:personal:primary",
  "snapshotAgeMinutes": 18,
  "enabledCapabilities": ["scheduled-tasks", "gmail-actions", "calendar-actions", "mcp-custom-apps"],
  "connectedTools": ["gmail", "calendar", "drive", "tnf-mcp"],
  "activeSchedules": 6,
  "activeTasks": 2,
  "recentReceipts": ["activity:...", "activity:..."],
  "stale": false
}
```

The receiving agent can request deeper hydration only when its task requires it.

## Gemini Spark priority adapter

Gemini Spark is a high-priority integration because current Google documentation exposes:

- persistent tasks;
- time schedules;
- Gmail-filter monitors;
- topic monitors;
- reusable skills;
- Google Workspace actions;
- custom Connected Apps via MCP server URLs.

TNF should therefore expose a permissioned MCP surface usable by Spark and define an ingestion route for Spark task/schedule/run observations. Where Google does not expose a programmatic read API for Spark state, TNF must not fabricate one: the adapter may begin as user-authorized export/receipt capture and upgrade when official APIs become available.

## Claude Cowork / Claude Code

Claude's connector model and MCP support make the same contract applicable. The adapter should capture enabled connectors/MCP servers, current task/result references where available, and receipts emitted by TNF-facing tool calls. It must not scrape inaccessible private Claude state to simulate integration.

## OpenAI ChatGPT / Codex

Codex can be represented as projects/threads/worktrees/skills/plugins plus task receipts and repository outcomes. ChatGPT Work can expose app/workspace/task/artifact references through whichever connected-app or platform APIs are legitimately available. TNF should ingest provider-native events where possible rather than polling expensive cloud agents.

## Cursor

Cursor foreground/CLI/background agents can map repository, branch, task, model, MCP integrations, spend-limit state, and PR/result references into the common snapshot/receipt model. Remote agent API usage must also pass TNF metered-cost authority when TNF is the payer.

## Cost relationship

Cross-agent visibility must not become an excuse for background cloud polling.

Preferred refresh order:

1. provider webhook/event when available and included;
2. provider-local/desktop adapter callback;
3. TNF local/self-hosted scheduled refresh;
4. free/included provider API quota;
5. metered polling only if explicitly budgeted and economically justified.

Any paid adapter operation initiated by TNF must coordinate with `MeteredExecutionCostAuthority`.

## Evidence quality

Each capability/activity observation SHOULD have one of:

- provider runtime proof;
- adapter observation;
- official platform documentation;
- explicit user assertion.

Claims without evidence are `unknown`, not `available`.

## Initial implementation milestones

- [x] public interop contract types;
- [x] source-attributed platform capability ledger;
- [ ] local durable receipt ledger implementation;
- [ ] TNF MCP endpoints for snapshot/receipt publish/query;
- [ ] Gemini Spark adapter/projection;
- [ ] Claude/Cowork adapter/projection;
- [ ] Codex/ChatGPT adapter/projection;
- [ ] Cursor adapter/projection;
- [ ] optional Supabase durable hosted ledger with RLS;
- [ ] Turn Zero orientation projection from latest authorized cross-agent state.
