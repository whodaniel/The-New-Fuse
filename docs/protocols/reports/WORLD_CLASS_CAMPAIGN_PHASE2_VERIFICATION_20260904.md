# World-Class Campaign — Phase 2 Verification Receipt

**Written**: 2026-09-04 ~01:20 EDT, by Pi (TNF harness session) **Scope**:
Campaign brief `TNF_WORLD_CLASS_CAMPAIGN_BRIEF_20260902.md` § Phase 2 —
independent verification of the open-code agent's live-state claims. Read-only
pass; no fixes applied, no commits (shared checkout, fleet running).

---

## Verdict table

| #   | Claim                                                                                  | Verdict                           | Evidence                                                                       |
| --- | -------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------ |
| a   | Sub-director heartbeat "silently dead" (no Redis write 12+h)                           | **STALE/FALSE** — wrong substrate | Heartbeat is file-based, written **2 minutes before check**                    |
| b   | Orchestrator 0 active / 13 stalled; 28 offline coordinators                            | **PARTIALLY TRUE, drifted**       | Now 11 active / 225 offline; LLM-Orchestrator 28 → **57** entries, all offline |
| c   | 82 dead worker registrations worth purging                                             | **Misframed** — normal churn      | ~14 registrations/hour, entries bounded ~16h, prune tool exists unscheduled    |
| d   | `TNF_GATE_POLICY_TOKEN` unset locally                                                  | **TRUE, low severity**            | env unset, no env file sources it; documented soft degradation                 |
| e   | DACC persona set self-declared vaporware                                               | **TRUE, verbatim**                | Manual's own "Implementation Status (added 2026-07-23)" header                 |
| f   | _(new, found during verification)_ freshness gate reports Redis down while Redis is up | **REAL DEFECT, trivial fix**      | Probe uses GNU `timeout`, absent on macOS; gate contract violated              |

## Detail

### (a) Sub-director heartbeat — claim FALSE, system healthy

The LaunchAgent (`com.tnf.local-subdirector`, plist traces through
`scripts/runtime/tnf-launchd-guard.sh --class probe`) invokes
`~/.tnf/local-subdirector/bin/local-subdirector-runtime.cjs` every 300s. The
heartbeat substrate is the **filesystem** —
`~/.tnf/local-subdirector/state/local-subdirector-heartbeat.{json,md}` (runtime
lines 236–237) — not Redis. The reporting agent pattern-matched Redis
(`*subdirector*`, `*heartbeat*`) and concluded silence; local Redis never
carried this signal.

Live verification: `generatedAt: 2026-09-04T05:06:57Z`, `status: healthy`, 5
sessions observed, 0 stalled, all 5 active.

Residual observations (not defects):

- `local-subdirector-wake-events.jsonl` last written Aug 29 — explained by the
  runtime's own `functionalGaps` note: wake transport migrated to direct TNF
  relay delivery. `wakePings: []` this cycle because no wakes were needed.
- 0-byte `.tmp` orphans in the state dir (Aug 23–Sep 2) from interrupted atomic
  writes — cosmetic.

### (b)+(c) Registry churn — mechanism identified, purge unnecessary

Live census of `tnf:agent-registry` (Redis hash): **236 entries — 11 active, 225
offline**. LLM-Orchestrator: 57 entries, all offline (was 28 at report time —
nearly doubled in ~2 days). Worker entries: 171.

Mechanism: every cron fleet run (News-Scout ~hourly, Continuous-Improver,
LLM-Orchestrator) registers a **fresh instance ID** via
`scripts/tnf-agent-cli.cjs` (HSET at lines 239/816). Graceful deregistration
exists (`hdel`, line 875) but cron-spawned runs that are killed or time out
never reach it. Entries age out around ~16h (max observed age 15.9h), so the
hash is bounded but noisy.

A 1-hour-staleness prune tool already exists — `scripts/prune-all-stale.cjs`
(`pruneStaleAgents({ staleMs: 3600000 })`) — but is evidently not scheduled
against the local hash.

Verdict: not a system failure; registration hygiene. The honest fix is schedule
the existing prune + ensure deregister-on-exit, not one-off purges. The brief's
caution against purging without a baseline was correct.

### (d) TNF_GATE_POLICY_TOKEN — unset, documented soft degradation

`env | grep` → unset. Not in `~/.tnf/*.env` or repo `.env`. Sole code consumer:
`scripts/protocols/synthetic-federation-gate-check.cjs` (optional x-auth-token
for a remote endpoint). Docs are honest about the state: "Broadcast remains
soft-degraded while `TNF_GATE_POLICY_TOKEN` is absent"
(`HARNESS_EFFECTIVENESS_BACKLOG_2026-08-31.md`); the 2026-03-18 runbook marks it
`<optional auth token>`. Operator call: provision it or formally accept.

### (e) DACC vaporware — confirmed verbatim

`docs/protocols/DACC_PROTOCOL_MASTER_MANUAL.md` carries "⚠️ Implementation
Status (added 2026-07-23, do not remove)": _"None of the architecture described
in this document exists as running code in this repository."_ — then itemizes
what's missing (no Genesis Agent, no AgentFactory, Prisma-vs-Drizzle drift). The
documentation sin the campaign exists to prevent ("documented-but-not-said") is
**not** present here. No action.

### (f) NEW DEFECT — state-freshness `runtime.services` probe broken on macOS

Probe (from `docs/protocols/state-freshness.registry.json`):

```
( timeout 5 redis-cli ping 2>/dev/null || echo REDIS_UNREACHABLE ) && ( curl … RELAY_OK )
```

`timeout` (GNU coreutils) **is not installed on this Mac**
(`command -v timeout gtimeout` → nothing). The first clause always fails with
command-not-found (stderr swallowed), so the probe **always** writes
`REDIS_UNREACHABLE` regardless of Redis health. Verified: simulated probe →
`REDIS_UNREACHABLE`; live `redis-cli ping` → `PONG` (server PID 7042, launchd
job `com.thenewfuse.redis-tnf-bus` exit 0).

Contract violation on top: the receipt was written `ok: true` for a value the
domain's own `expect` regex (`PONG[\s\S]*RELAY_OK`) does not match — and the
gate's own comment (state-freshness-gate.cjs:160) says exactly this class of
observation "must not render as a checkmark." The gate has therefore advertised
Redis health it never measured on this host, likely since the probe was
authored.

**Proposed fix (needs go-ahead; protocol infrastructure):**

1. Portable probe: `redis-cli -t 5 ping` (connect-timeout flag, no external
   dependency) or drop `timeout` — redis-cli fails fast on connection refused.
2. Receipt writer derives `ok` from the `expect` regex match, not probe exit
   code.

## Prioritized actions

1. **(f) probe fix** — trivial, high value: gate currently lies about Redis on
   this host. One-line registry change + receipt-writer `ok` derivation.
2. **(b/c) hygiene** — schedule `prune-all-stale.cjs` against the local hash;
   keep `hdel` path honest for killed runs where feasible.
3. **(a) cosmetic** — sweep `.tmp` orphans in `local-subdirector/state/`.
4. **(d) operator decision** — provision `TNF_GATE_POLICY_TOKEN` or accept and
   close as known-soft-degraded.
5. **No action**: (a) heartbeat healthy; (e) DACC manual correctly
   self-documents as unbuilt.
