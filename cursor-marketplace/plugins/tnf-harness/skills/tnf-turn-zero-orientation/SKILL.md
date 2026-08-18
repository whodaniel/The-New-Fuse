---
name: tnf-turn-zero-orientation
description:
  Produce a Turn Zero orientation briefing from TNF state, ledger, and handoff
  artifacts before acting. Use at session start in a TNF-governed repo or when
  asked to orient.
---

# TNF Turn Zero Orientation

Deterministically orient at the start of a session so you act from ground truth,
not assumptions.

## Steps

1. **Locate artifacts.** Look for `docs/protocols/` in the repo root. If absent,
   check `~/.tnf/handoff-current.json` for a `SOURCE` path that points to the
   TNF repository.
2. **Read state files** (skip gracefully if missing):
   - `docs/protocols/TURN_ZERO_MANDATE.md` — authority and operating loop
   - `docs/protocols/LIVING_STATE.md` — current directive, active steps
   - `docs/protocols/AGENT_STATUS_LEDGER.md` — roster, next focus, P0 items
3. **Read the handoff:**
   - `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` (preferred)
   - `.md` fallback
4. **Check repo state:** current branch, ahead/behind origin, dirty file count.
5. **Emit a briefing** (compact table + short prose):
   - Handoff id + timestamp, branch, head SHA
   - Current directive
   - Open / operator-gated tasks
   - Any P0 or `session-stale` flags
6. **Stop and await confirmation** before code changes unless implementation was
   already requested.

## Output shape

A short "orientation" section the operator can scan in seconds. Do not dump full
file contents; synthesize. Surface only what changes the next decision.

## Guardrails

- Read-only. This skill never edits, commits, or kills processes.
- Note but do not act on gated items; hand them to the operator.
