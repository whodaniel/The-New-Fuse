# TNF Investigation — Protocol Durability, Memory Store, & Federated Task Handling (`/goal` wiring)

`[CLASS:REPORT] [STATUS:FINDINGS] [DOC_TYPE:INVESTIGATION] [DOMAIN_SCOPE:core]`

**Date:** 2026-08-16 **Origin:** Turn Zero session; operator asked to (1) make
the concurrent-handoff-overwrite recovery a durable part of the TNF protocol,
(2) give the persistent-memory store more advanced logic + consistent inner
loops, and (3) investigate federated/multitenant task handling and its wiring to
`/goal`.

---

## 1. Front 1 — Concurrent-handoff-overwrite recovery → durable protocol (DONE)

The recovery procedure was elevated beyond a skill pitfall into the
**canonical** concurrent-agent coordination protocol.

### Added to `docs/protocols/TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL.md`

(`[STATUS:ACTIVE][CLASS:PRIME][TNF_CONCURRENT_AGENT_COORDINATION_CANONICAL]` —
the non-racy canonical home; verified unique base name before writing):

- **§1.3 Canonical incident #2 — shared-report overwrite (2026-08-16):** the
  real `SESSION_HANDOFF_LATEST.json` clobber by
  `source_agent: tnf-interactive-01`, a schema-INVALID payload overriding a
  committed schema-valid `f202ac36`, and the full detection/recovery procedure
  (schema-invariant test + pgrep/cron/mtime no-live-writer check +
  `git checkout HEAD` restore + re-validate).
- **§3.5 Verify — shared canonical report invariant:** before trusting any diff
  to the handoff report, validate the working-tree copy; invalid-on-disk +
  valid-at-HEAD = concurrent emitter overwrote it.
- **§7 Failure Modes — shared-report clobber:** same detection-first rule, never
  commit the clobbered payload.

Also codified as a pitfall in the `tnf-session-handoff-operations` skill
(procedural home). The underlying root cause (`verify-harness-completeness.cjs`
`~`-expansion bug) was fixed, committed (`b4e3627c19`), and pushed earlier this
session.

---

## 2. Front 2 — Persistent-memory store advanced logic (INVESTIGATED, DESIGN PROPOSED, NOT YET IMPLEMENTED)

**Current state** — `scripts/harness/memory-layer.cjs` (TNF dynamic memory,
`data/harness/memory/entries.jsonl`):

- Ops: `retain` / `recall` / `pin` / `status`. Append-only JSONL with tombstone
  delete.
- **Limitations:** recall is substring-token scoring (no recency
  fade/decay/TTL), store grows unbounded (tombstones never compacted), no
  auto-promotion on recall, no task-progress linkage beyond a per-op receipt
  file. No scheduled freshness/"inner loop".
- Mirrors the Hermes persistent-memory cap issue (2,200/2,200) hit earlier this
  session when consolidation was rejected 4×.

**Proposed advanced logic (needs operator sign-off — schema/behavior
tradeoffs):**

- Recency-weighted recall (term-match + age-decay + pinned boost).
- TTL / lazy auto-tombstone sweep in `recall`/`status` (scope-configurable
  horizon; pinned exempt).
- Promotion-on-recall (re-append touched entries to tail to refresh recency —
  preserves append-only audit model via tombstone, never truncate).
- `taskup <taskId>` op tying task/goal → progress (recency, status) → memory,
  feeding "task progress on track".
- A scheduled freshness sweep (cron or LIVING_STATE heartbeat) as the standing
  inner loop.

**Constraint:** obey the Local-Runtime Boundary (no cross-over to Hermes' own
store; this is a TNF memory enhancement) and the append-only/tombstone model.

---

## 3. Front 3 — Federated & multitenant task handling + `/goal` wiring (INVESTIGATED, GAP FOUND, NOT YET FIXED)

Three goal surfaces exist and are only loosely connected:

| Surface                     | Location                                                                         | Multitenant?                       | Executes?         |
| --------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- | ----------------- |
| CLI goals                   | `GoalsService` + `~/.tnf/goals/goals.json` (`tnf goals list/create`)             | No (local file)                    | No — CRUD         |
| Unified Ledger `GoalRecord` | `unified-ledger.service.ts` (`goal` lane, `tenantId`/`workspaceId`/`milestones`) | **Yes** (persisted, tenant-scoped) | No — record model |
| `tnf orchestrate <NL goal>` | `orchestration.ts` → `EnhancedOrchestrator.executeGoal()`                        | No at dispatch                     | **Yes**           |

**Critical finding — the wiring gap:** `tnf orchestrate <goal>` (the goal
execution path) does **NOT** enqueue into the broker's federated queue
(`tnf:master:tasks:realtime`). Instead:

- `executeTask()` code/infra → `WorkerDispatcher.dispatchByCapability()` →
  **hardcoded worker queues**
  (`tnf:direct:sub-director:agent_hermes-codegen-worker_1782364000001`,
  `...infra-worker_...`) — no live broker discovery.
- Skill-bound tasks are **simulated** (`simulateExecution` = 100ms timeout — no
  real work).
- Fallback broadcasts to the agent network.
- **No `tenantId`/`workspaceId` passed** at dispatch — tenant-agnostic.

Meanwhile the **broker-agent** (`broker-agent.ts`, actual `brpop` on
`tnf:master:tasks:realtime`) _does_ implement multitenancy (evaluates
`itinerary.lane` + `tenant.scope`, federation gates, `tenant:{id}` telemetry),
and the **Unified Ledger** is tenant-scoped. The record and dispatcher
understand tenants, but the CLI goal executor bypasses the broker, so
**goal-driven orchestration is the one path that doesn't flow through the
federated broker**.

**Proposed rewire (needs operator sign-off — architectural):** Re-route
`executeTask()`'s capability dispatch to LPUSH a proper `QueueTask` onto
`tnf:master:tasks:realtime` carrying `itinerary.lane: 'goal'` (or
`'realtime_broker_routing'`) + `tenant.scope`, letting the broker do discovery +
policy + federation-gate evaluation. This closes "goals don't reach the fleet"
and routes through the verified `enqueueWorkerTask` → `WorkerEnvelope` chain.

---

## Decision status

- Front 1: **DONE** (protocol append; also skill + root-cause fix
  committed/pushed).
- Front 2: **investigated, proposal ready, awaiting operator sign-off** (memory
  schema/behavior tradeoffs).
- Front 3: **investigated, gap characterized, rewire proposal ready, awaiting
  operator sign-off** (architectural change, tests needed).
