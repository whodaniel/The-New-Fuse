---
name: tnf-sub-director-autopilot
description:
  Use when operating as the Local Sub-Director or hardening Sub-Director
  autonomy. Enforces deterministic startup checks, owner verification, heartbeat
  routing guarantees, and a fixed self-prompt loop tied to runtime state.
---

# TNF Sub-Director Autopilot

Use this skill when you are acting as the Local Sub-Director and need reliable,
repeatable control loops instead of ad hoc prompting.

## Goals

1. Tie Sub-Director decisions to deterministic runtime checks.
2. Keep a continuous self-prompt loop grounded in observed state.
3. Preserve task continuity: no silent task switching, no ambiguous ownership.

## Immediate Boot Sequence

Run these in order at session start:

1. `~/.tnf/scripts/runtime/local-subdirector-service.sh status`
2. `~/.tnf/scripts/runtime/tnf-master-heartbeat-service.sh status`
3. `~/.tnf/scripts/runtime/terminal-heartbeat-cron.sh status`
4. `scripts/subdirector-cycle-check.sh`

If any required service is down, start it before continuing:

1. `~/.tnf/scripts/runtime/local-subdirector-service.sh install`
2. `~/.tnf/scripts/runtime/tnf-master-heartbeat-service.sh install`
3. `~/.tnf/scripts/runtime/tnf-master-heartbeat-service.sh restart`

Frontload/onboarding is part of this same startup check.
`subdirector-cycle-check.sh` verifies:

1. frontload hook integrity (`~/.zshrc` markers),
2. frontload executables (`~/.tnf/tnf-status`, `~/.tnf/update-from-latest.sh`),
3. cache freshness (`~/.tnf/handoff-current.json`),
4. handoff source freshness (`~/.openclaw/workspace/handoff/LATEST.md`).

## Deterministic Loop Contract

Run one cycle before any coordination decision and then each heartbeat interval:

1. `scripts/subdirector-cycle-check.sh --one-line`
2. `scripts/subdirector-cycle-check.sh --self-prompt`
3. Post one-line status in-thread.
4. Stay on the current coordination task unless the cycle state is `blocked`.
5. If frontload/cache checks degrade, repair hooks/cache before continuing lane
   coordination.

## Action Matrix

1. `state=healthy`: continue current lane coordination task, post one-line
   status.
2. `state=degraded`: execute listed actions, re-run cycle check, then continue.
3. `state=blocked`: do not switch to unrelated work; request targeted help with
   the explicit blocker and required owner/action.

## Required Outputs Per Cycle

1. One-line status: `scripts/subdirector-cycle-check.sh --one-line`
2. Deterministic self-prompt: `scripts/subdirector-cycle-check.sh --self-prompt`
3. Durable loop log entry:
   - `scripts/subdirector-cycle-check.sh --log-file /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/logs/sub-director-autopilot-loop.jsonl`

## Guardrails

1. Do not infer ownership from prompt text alone; use role-map/identity-registry
   checks.
2. Forced sidecar owner must appear in heartbeat targeting each cycle.
3. Do not inject into terminals with active typing or in-progress slash
   commands.
4. Non-sidecar heartbeat triggers remain deterministic policy, not
   conversational guesswork.
