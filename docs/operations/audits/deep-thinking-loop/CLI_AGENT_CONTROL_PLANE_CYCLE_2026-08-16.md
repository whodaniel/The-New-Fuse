# CLI Agent Control-Plane Cycle Rollup — 2026-08-16

[CLASS:PRIME] [STATUS:COMPLETE] [DOC_TYPE:SESSION_ROLLUP] [OWNER:tnf-cli-agent]
[AUTHORITY:local_subdirector]

## Objective

Improve the TNF CLI agent as a working local control plane: drain Redis black
holes, route local watchdogs to Local Subdirector (`tnf-cli-agent`), and consume
those reports.

## Completed Work Units

### 1. Pending → realtime drain (queue black hole)

- **Root cause:** `chronological-dispatch.cjs` dual-wrote every dispatch into
  `tnf:master:tasks:pending` while the broker only `BRPOP`s
  `tnf:master:tasks:realtime`.
- **Fix:** Lane-aware realtime routing; stop dual-writing realtime targets into
  pending.
- **Tool:** `scripts/protocols/promote-pending-to-realtime.cjs`
- **Verify:** Promoted 48 eligible tasks; broker drained realtime **50 → 0**;
  pending retained **6** (analytics + maintenance only).
- **Audit:**
  `docs/operations/audits/deep-thinking-loop/deep-thought-cycle-2026-08-16T21-36-cli-agent-drain.md`

### 2. Local Subdirector routing (not Super Director)

- **Root cause:** Critical priority always escalated with
  `Critical task requires Director review` → `tnf:director:review:pending`.
- **Fix:** Detect local tenant/watchdog tasks; escalate with
  `reviewAuthority: local_subdirector` to:
  - `tnf:subdirector:review:pending`
  - `tnf:direct:sub-director:tnf-cli-agent` (+ `tnf-local-subdirector`,
    `sub-director`)
- **Stamp:** chronological-dispatch now sets local tenant scope, cumulativeId,
  allow gateDecisions, `reportTo: tnf-cli-agent`.
- **Files:** `packages/relay-core/src/broker-agent.ts`,
  `scripts/protocols/chronological-dispatch.cjs`
- **Audit:**
  `docs/operations/audits/deep-thinking-loop/deep-thought-cycle-2026-08-16T21-46-local-subdirector-routing.md`

### 3. Local Subdirector consumer (drain cycle)

- **Tool:** `scripts/sub-director/drain_local_subdirector.py`
- **Cycle:** `scripts/agents/subdirector-local-cli-agent-cycle.sh`
- **Runtime sync:** `~/.tnf/sub-director/drain_local_subdirector.py`
- **Cron:** `*/5` → poll-job `~/.tnf/poll-jobs/tnf-subdirector-local-cli-agent/`
- **Verify E2E:** critical watchdog → broker Local Subdirector escalate → drain
  → queues 0 → ack artifacts under
  `~/.tnf/sub-director/run-artifacts/subdirector-ack-*`
- **Audit:**
  `docs/operations/audits/deep-thinking-loop/deep-thought-cycle-2026-08-16T22-01-local-subdirector-drain.md`

## Durable Artifacts (this cycle)

| Artifact              | Path                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------- |
| Rollup (this file)    | `docs/operations/audits/deep-thinking-loop/CLI_AGENT_CONTROL_PLANE_CYCLE_2026-08-16.md` |
| Promote script        | `scripts/protocols/promote-pending-to-realtime.cjs`                                     |
| Drain script          | `scripts/sub-director/drain_local_subdirector.py`                                       |
| Cycle wrapper         | `scripts/agents/subdirector-local-cli-agent-cycle.sh`                                   |
| Broker routing        | `packages/relay-core/src/broker-agent.ts`                                               |
| Dispatch stamp        | `scripts/protocols/chronological-dispatch.cjs`                                          |
| Session log           | `docs/protocols/reports/SESSION_LOG.md`                                                 |
| Fresh handoff pointer | `docs/protocols/reports/FRESH_HANDOFF_2026-08-16.md`                                    |

## Explicitly Not Done (operator-gated / next)

1. Commit this cycle’s code + docs (dirty tree still large; authority gates
   apply).
2. Specialty queue consumers for remaining analytics/maintenance pending (6).
3. Dedupe alias fan-out (one report currently acks across three direct alias
   queues).
4. Optional `tnf subdirector drain` CLI alias.
5. Full registry rebuild (`pnpm agents:registry:build`) + broader cohesion sync.
6. Behavioral CLI parity adapters (beyond flag hints) for top cursor/agent gaps.

## Verification Snapshot (post-cycle)

- Redis: pending specialty-only; realtime drained when broker live
- Broker log contains: `Escalated … to Local Subdirector (tnf-cli-agent)`
- Cron: `subdirector-local-cli-agent-cycle.sh` every 5 minutes
- No Super Director escalation for stamped local critical watchdogs
