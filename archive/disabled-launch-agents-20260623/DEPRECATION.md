# Disabled OpenClaw LaunchAgents — 2026-06-23

The 7 active `~/Library/LaunchAgents/com.openclaw.*.plist` files were
unloaded via `launchctl unload`, the live `tnf-continuous-test.sh` (PID
37638) was TERMed, and the plist files were archived here so launchd
will not re-register them on next login.

## Why

These plists ran bash scripts living under `~/.openclaw/workspace/`
that depended on Railway / OpenClaw-internal paths. As part of the
TNF-native migration, the capabilities (continuous testing, fleet
health probes, watchdog checks) were re-implemented as native system
cron entries in `scripts/agents/tnf-*-cycle.sh`. The new entries
point at no `~/.openclaw/*` paths.

## Files

- `com.openclaw.jules-monitor.plist` — was already a `.bak` (not loaded)
- `com.openclaw.llm-probe.plist`
- `com.openclaw.mesh-health.plist`
- `com.openclaw.picoclaw-fleet.plist`
- `com.openclaw.telegram-webhook.plist`
- `com.openclaw.tnf-continuous-test.plist`
- `com.openclaw.tnf-heartbeat.plist`
- `com.openclaw.tnf-loop-watchdog.plist`

## Replacements

| Old (OpenClaw launchd)                  | New (TNF native system cron)               | Cadence |
|-----------------------------------------|--------------------------------------------|---------|
| com.openclaw.tnf-continuous-test        | `tnf-thenewfuse-frontend-tester-cycle`     | */5     |
| com.openclaw.tnf-loop-watchdog          | `tnf-continuous-improver-watchdog-cycle`   | */15    |
| com.openclaw.telegram-webhook           | (no replacement needed — daemon detects)   | —       |
| com.openclaw.tnf-heartbeat              | (superseded by `tnf-heartbeat-selfwake.py`)| —       |
| com.openclaw.llm-probe                  | (superseded by `scout-llm-discovery.md`)   | —       |
| com.openclaw.picoclaw-fleet             | `tnf-fleet-health-probe-cycle`             | */15    |
| com.openclaw.mesh-health                | `tnf-fleet-health-probe-cycle`             | */15    |

`debian#hermes claw cleanup` is queued (deferred) — the `.openclaw`
directory rename to `.openclaw.pre-migration` will run when disk
headroom returns (current disk capacity at 100%; 587 Mi free on a
466 Gi volume).

If you ever need to revive any of these, the plist file is here; copy
back to `~/Library/LaunchAgents/`, edit any `~/openclaw/workspace*`
paths in the `ProgramArguments`, and `launchctl load`.
