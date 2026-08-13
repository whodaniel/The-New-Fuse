# TNF Master Clock Sync and Automation Hold (2026-03-28)

Status: Active hardening note  
Owner: TNF-DOC runtime operations

## 1) Chain of Command and Runtime Order

### Top-level owner

- `com.tnf.master-heartbeat` (`scripts/runtime/tnf-master-heartbeat-service.sh`)
  runs `~/.tnf/master-heartbeat/bin/tnf-master-heartbeat-loop.cjs` as a
  persistent launchd service.

### Per-cycle order (default every 15s)

- Step A: `terminal-heartbeat-pulse` via
  `scripts/runtime/terminal-heartbeat-cron.sh run-once`
- Step B: `director-cycle` via `scripts/runtime/tnf-director-cron.sh run-once`
- Step C (every 3 cycles): `watchdog-cycle`
- Step D (every 4 cycles): ensure services are running:
  - local sub-director
  - subdirector autopilot
  - relay monitor
- Step E (cycle 1 and every 20 cycles): enforce cron installs:
  - terminal heartbeat cron
  - director cron

### Independent loops (also active)

- `com.tnf.local-subdirector` launchd service runs continuously and scans at
  `LOCAL_SUBDIRECTOR_INTERVAL_MS` (default 30000 ms).
- `tnf-terminal-heartbeat-pulse` cron defaults to `*/30 * * * *`.
- `tnf-director-loop` cron defaults to `*/5 * * * *`.

## 2) Why macOS Admin Prompts Repeated

Repeated Terminal automation attempts come from both:

- `terminal-heartbeat-pulse.cjs` Terminal polling/injection path (`osascript`)
- `local-subdirector-runtime.cjs` Terminal polling path (`osascript`)

When macOS denies or re-prompts automation, these loops previously retried on
each cycle and could prompt every few minutes.

## 3) Trigger/Artifact Contract

Each cycle writes artifacts:

- Master clock:
  - `~/.tnf/master-heartbeat/state/master-heartbeat-latest.json`
  - `~/.tnf/master-heartbeat/state/master-heartbeat-history.jsonl`
- Terminal heartbeat:
  - `~/.tnf/terminal-heartbeat/state/terminal-heartbeat-latest.json`
  - `~/.tnf/terminal-heartbeat/state/terminal-heartbeat-history.jsonl`
  - `~/.tnf/terminal-heartbeat/state/terminal-heartbeat-applescript-guard.json`
- Local sub-director:
  - `~/.tnf/local-subdirector/state/local-subdirector-heartbeat.json`
  - `~/.tnf/local-subdirector/state/local-subdirector-applescript-guard.json`

Output contract:

- run status
- step success/failure
- automation guard status (`active`, `holdUntil`, failure metadata)

## 4) Idempotency and Lock Behavior

- Master clock loop lock:
  - `~/.tnf/master-heartbeat/state/loop.lock`
  - stale/owner-dead recovery with `TNF_MASTER_HEARTBEAT_LOCK_STALE_MS`.
- Terminal heartbeat pulse lock:
  - lock directory in heartbeat state path; stale lock recovery.
- Cron installers are idempotent:
  - existing tagged lines are replaced, not duplicated.

## 5) Hardening Applied (2026-03-28)

Source of truth updates:

- `scripts/runtime/local-subdirector-runtime.cjs`
- `scripts/runtime/terminal-heartbeat-pulse.cjs`

Changes:

- AppleScript guard/backoff state persisted to disk.
- On AppleScript failure, set hold (`default 21600000 ms`, 6 hours).
- While hold is active, skip further AppleScript calls and return degraded/safe
  status instead of retry storms.
- Local sub-director quota handoff wrapped to avoid fatal crash propagation.

## 6) Verification and Alert Thresholds

### Health checks

- Master clock should remain `healthy` with `failedSteps = 0`.
- Terminal heartbeat should be one of:
  - `healthy`
  - `safe-no-injection`
  - `safe-automation-hold` (acceptable while macOS access unresolved)
- Local sub-director may show:
  - `healthy`
  - `degraded-automation-hold` (acceptable while macOS access unresolved)

### Escalation thresholds

- `failedSteps > 0` for 3 consecutive master cycles: escalate.
- `appleScriptHoldActive = 1` for >24h: investigate macOS Automation/TCC policy
  and service identity.
- Missing heartbeat artifact updates for >2 intervals: treat as runtime outage.

### Quick operator checks

```bash
jq '{generatedAt,status,summary}' ~/.tnf/master-heartbeat/state/master-heartbeat-latest.json
jq '{generatedAt,status,automationGuard}' ~/.tnf/terminal-heartbeat/state/terminal-heartbeat-latest.json
jq '{generatedAt,status,automationGuard}' ~/.tnf/local-subdirector/state/local-subdirector-heartbeat.json
```

## 7) Manual Recovery Controls

- After fixing macOS Automation permissions, clear holds by waiting for expiry
  or resetting guard files:
  - `~/.tnf/terminal-heartbeat/state/terminal-heartbeat-applescript-guard.json`
  - `~/.tnf/local-subdirector/state/local-subdirector-applescript-guard.json`
- Restart services:
  - `~/.tnf/scripts/runtime/local-subdirector-service.sh restart`
  - `~/.tnf/scripts/runtime/tnf-master-heartbeat-service.sh restart`

## 8) 2026-05-28 Local Director Fallback Addendum

The local subdirector now has a process-table fallback for AppleScript Terminal
inventory failures. When AppleScript is in hold, the runtime can still discover
agent-like processes, mark sessions with `source: process-table-fallback`, and
continue stall-defense wake event accounting.

Detailed implementation and verification notes:

- `docs/operations/TNF_LOCAL_DIRECTOR_AND_CLI_REVIEW_2026-05-28.md`
