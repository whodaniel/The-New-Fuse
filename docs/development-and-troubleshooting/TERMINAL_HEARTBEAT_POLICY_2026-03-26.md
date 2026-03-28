# Terminal Heartbeat Policy (2026-03-26)

## Scope

This document records the live heartbeat policy for local TNF terminal agents,
including Local Sub-Director identity, forced sidecar routing, skip safeguards,
and current runtime evidence.

## Effective Behavior

1. Local Sub-Director owner routing:
   - Owner terminal is assigned by role map/identity registry and force-routed
     each pulse.
   - Current owner: `tnf-local-terminal-ttys007` (`/dev/ttys007`).
2. Forced-target prioritization:
   - Forced sidecar owners are selected before `maxTargets` throttling and are
     never dropped by ordering.
3. Non-sidecar trigger mode:
   - Default is `stalled-only`.
   - Non-sidecar terminals do not inject just because they share cwd with active
     peers.
4. Typing and draft-input guard:
   - If a terminal shows active draft input (`tab to queue message`, typed
     prompt line, or pause/resume prompt), heartbeat skips injection.
5. Slash-command guard:
   - Any in-progress `/...` command line is protected from heartbeat injection.
6. Sidecar failsafe:
   - Sidecar hold telemetry is tracked.
   - If sidecar stays in `sidecar-typing-hold` for >= 120s, one failsafe
     injection may bypass typing hold to recover from stale draft text.
   - `sidecar-user-active-hold` (active user interaction) does not bypass until
     user activity quiets.

## Identity + Role Assignment

- Role map:
  `/Users/<owner>/.tnf/session-discovery/terminal-role-map.json`
- Identity registry:
  `/Users/<owner>/.tnf/session-discovery/terminal-identity-registry.json`
- Temp IDs are persisted as `tnf-temp-####` per stable `agentId`.
- Current owner alias/tag:
  - `roleAlias=local-subdirector-owner`
  - `roleTags=["local-subdirector-owner","coordination","heartbeat-sidecar"]`

## Federation Gate Clarification

- Local Sub-Director handles local terminal discovery/liveness and identity
  artifacts.
- Relay federation gate control remains in broker policy layer:
  - `packages/relay-core/src/broker-agent.ts`
  - `BROKER_FEDERATION_GATE_MODE`
  - `BROKER_GATE_POLICY_ENDPOINT`
  - `BROKER_GATE_POLICY_TOKEN`

## Runtime Signals

- `sidecarHoldSince`
- `sidecarHoldElapsedSeconds`
- `sidecarBreakthroughEligible`
- `skippedReason=sidecar-user-active-hold`
- `skippedReason=sidecar-typing-hold`
- `skippedReason=sidecar-slash-command-hold`
- `skippedReason=slash-command-in-progress`
- `skippedReason=not-triggered`

## Current Config

- `TNF_TERMINAL_HEARTBEAT_FORCE_INJECT_WHILE_TYPING=false`
- `TNF_TERMINAL_HEARTBEAT_FORCE_INJECT_MIN_IDLE_SECONDS=12`
- `TNF_TERMINAL_HEARTBEAT_FORCE_INJECT_MAX_HOLD_SECONDS=120`
- `TNF_TERMINAL_HEARTBEAT_NON_SIDECAR_TRIGGER_MODE=stalled-only` (default if
  unset)

## Validation Snapshot

- Live pulse after hardening (`2026-03-26T19:16:10.222Z`):
  - `forcedTargets=1` and target included `tnf-local-terminal-ttys007`.
  - `ttys007` was skipped as `sidecar-user-active-hold` while user was active
    (`systemIdleSeconds=0.412...`).
  - Non-sidecar sessions were `routeMode=no-trigger` with
    `skippedReason=not-triggered`.
  - No unintended prompt injection occurred in that pulse (`injections=0`).

## Runtime Files Updated

- `/Users/<owner>/.tnf/bin/terminal-heartbeat-pulse.cjs`
- `/Users/<owner>/.tnf/local-subdirector/bin/local-subdirector-runtime.cjs`
- `/Users/<owner>/.tnf/scripts/runtime/local-subdirector-service.sh`
- `/Users/<owner>/.tnf/session-discovery/terminal-role-map.json`
