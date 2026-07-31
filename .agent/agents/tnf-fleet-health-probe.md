---
name: tnf-fleet-health-probe
description:
  Periodic GET on every TNF-managed service endpoint (GCP/Cloudflare/Supabase).
  Replaces legacy OpenClaw agents `com.openclaw.picoclaw-fleet` and
  `com.openclaw.mesh-health`. Reads endpoint list from a config file — never
  hardcodes Railway (Railway is deprecated). Alerts via native Telegram bus
  using credentials sourced at runtime from .env.tnf-telegram.
tags: [health, fleet, probe, tnf-native, native-cron]
schedule: every 15 minutes (system cron)
runtime: system cron `*/15 * * * *` (sidesteps Hermes cron interpreter bug)
supervisor: false
depends_on: []
---

# TNF Fleet Health Probe

## Operational Mandate

Native replacement for the two legacy OpenClaw launchd agents:

- `com.openclaw.picoclaw-fleet` — polled Railway PicoClaw Tester/Subject
  /Perplexity instances every 10 min. Railway is deprecated; never resume.
- `com.openclaw.mesh-health` — polled OpenClaw Railway cloud/primary/sandbox
  every 15 min. Same constraint applies.

The capability survives; only the target set changes. This agent probes the
TNF-native fleet (Cloudflare, GCP, Supabase) and posts to the synaptic bus on
the first observed failure per endpoint.

## Probe Protocol

For every entry in `~/.tnf/config/fleet-endpoints.json`:

1.  `curl -sS -m 10 -o <tmpfile> -w "%{http_code}|%{time_total}" <url>`
2.  Classify response:
    - `healthy` — HTTP 2xx and body matches expected substring (if defined)
    - `degraded` — HTTP 2xx but body mismatch, or HTTP 3xx, or response time >
      3s
    - `unhealthy` — HTTP non-2xx, or non-HTTP 000/timeout, or JSON parse fail
3.  Compare to previous state (`~/.tnf/runtime/fleet-health/state.json`).
4.  If state changed for an endpoint, OR if every 8th cycle (steady-state
    heartbeat), publish to `tnf:bus:ingress` with payload
    `{type: "fleet-health", endpoint: <name>, state: <state>, observed: <code>+<ms>}`.
5.  Telegram fanout is owned by the existing Telegram alert agent (per
    `apps/telegram-mcp/server.py`) — this agent never calls Telegram directly.
    Sends string-summarized alerts to the bus; bus routes them.

## Configuration

- Endpoint list: `~/.tnf/config/fleet-endpoints.json`
- State file: `~/.tnf/runtime/fleet-health/state.json` (rotated daily)
- Log file: `~/.tnf/runtime/fleet-health/cycles-YYYYMMDD.jsonl`
- Token source: `.env.tnf-telegram` — sourced at runtime, never copied into any
  other file (mode 0600 already enforced). This agent does NOT read the token
  itself; it publishes structured events to the bus and lets the alert
  dispatcher consume them.

### Default endpoint list

```json
[
  {
    "name": "thenewfuse-public-frontend",
    "url": "https://thenewfuse.com/api/health",
    "expectInBody": "healthy"
  },
  {
    "name": "thenewfuse-saas-frontend",
    "url": "https://app.thenewfuse.com/",
    "expectInBody": null
  },
  {
    "name": "tnf-concordance-stats",
    "url": "https://wslydgtgindrywldatbv.supabase.co/functions/v1/concordance/stats",
    "expectInBody": null
  },
  {
    "name": "bizsynth-orchestration",
    "url": "https://tnf-agent-orchestration.bizsynth.workers.dev/agent/heartbeat",
    "expectInBody": null
  }
]
```

Whoever owns `~/.tnf/config/fleet-endpoints.json` (default:
`continuous-improver` generated, with operator overrides via `config.yaml`)
keeps this list in sync when new TNF endpoints come online.

## Behavior Rules

✅ Read endpoint list from config; never hardcode URLs in this agent. ✅ One
state.json write per cycle, atomic via `tmp + rename`. ✅ Alert state-change,
not raw noisy failures (debounce via prev-state). ✅ Telegram never touched
directly — bus only. ❌ Never probe Railway endpoints. If one appears in config,
mark as `unknown-target` and surface a config-validation alert. ❌ Never write
to `~/.openclaw/`. Native paths only. ❌ Never invoke an LLM; this is a
probe-class agent.

## Trigger

- System cron `*/15 * * * *`, command:
  `$TNF_ROOT/scripts/agents/tnf-fleet-health-probe-cycle.sh` Cron label in user
  crontab: `tnf-fleet-health-probe-cycle`.
- Manual: invoke the script directly (`bash tnf-fleet-health-probe-cycle.sh`).
- OpenClaw launchd plists `com.openclaw.picoclaw-fleet.plist` and
  `com.openclaw.mesh-health.plist` must be booted out before this is the sole
  owner.

## Provenance

Replaces deprecated OpenClaw agents archived as part of the
`hermes claw cleanup` work on 2026-06-23. See
`archive/picoclaw-deprecated-20260623/DEPRECATION.md` and the upcoming
`scripts/operations/migrate-openclaw-crons.sh` for the launchd bootout record.
