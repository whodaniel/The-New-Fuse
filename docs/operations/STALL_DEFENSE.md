# Stall Defense — Recurring Operational Patterns

**Consolidated from:** OpenClaw maintenance notes (2026-04 through 2026-05)  
**Status:** Historical patterns; cross-check against current `LIVING_STATE.md`
before acting.

---

## Recurring failure modes

| Pattern                        | Symptom                                | Probe                                          |
| ------------------------------ | -------------------------------------- | ---------------------------------------------- |
| Handoff matrix under-populated | Fewer than ~10 recent handoff files    | Check `SESSION_HANDOFF_LATEST.*` freshness     |
| Cycle enforcement stale        | Last run >48h                          | Cron / `tnf master-clock status`               |
| Pre-gen validation skipped     | Packets lack pre-generation validation | `grep -R pre_gen_missing .agent/runtime-logs/` |
| Cloudflare health stale        | Health state >24h old                  | `curl -sI https://thenewfuse.com`              |
| Stale AGENTS.md proposals      | Task cards >30 days open               | Review and archive resolved cards              |

## Source archive

`docs/consolidation/archived-from-home/openclaw-workspace/maintenance-notes/`

See also: `docs/operations/POST_IMPLEMENTATION_VALIDATION.md`,
`docs/protocols/HANDOFF_VALIDATION_PIPELINE.md`
