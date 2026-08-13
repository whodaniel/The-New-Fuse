# TNF Local Runtime Stability Log - 2026-08-08

Status: documented Scope: local open-source runtime startup, launchd services,
Redis/API/gateway/voice/KWS health, and portability carryover.

## Context

The operator reported unusually slow boot after restart and asked whether the
cause was RAM, cron jobs, or TNF agent activity. Investigation found no RAM
failure. The main operational cause was TNF local runtime startup pressure:
launchd and watchdog paths were attempting to heal services too aggressively,
with dependency ordering gaps and interactive-shell assumptions under launchd.

Hardware notes from live checks:

- RAM: two 8 GB DDR3 DIMMs, both `Status: OK`.
- Battery: `Condition: Service Recommended`, cycle count 652. This is separate
  from the TNF boot issue.

## Root Causes Found

1. LaunchAgent service control treated `start` as unload plus reload, disrupting
   healthy jobs and creating avoidable boot churn.
2. Redis startup was not consistently launchd-native during core fleet
   establishment.
3. API gateway could start before the local API was accepting TCP, then defer
   until the next interval.
4. Voice watchdog retried `listen` every eight seconds when optional whisper
   dependencies were absent.
5. KWS boot assumed `pnpm` was discoverable in launchd's environment.
6. `tnf ports preflight` misclassified a healthy local gateway/API listener on
   port 3001 as a conflict.

## Durable Changes

Portable runtime scripts:

- Added `scripts/runtime/tnf-launchd-smart-start.sh`.
- Added `scripts/runtime/tnf-local-launchd-services.sh`.
- Extended `scripts/runtime/redis-local-bootstrap.sh` with macOS launchd
  install/start paths.
- Updated `scripts/runtime/establish-core-federated-fleet.cjs` to use Redis
  launchd startup on Darwin.

Voice and KWS stability:

- Updated `scripts/system/voice-beam-watchdog.sh` with a lock, dependency
  checks, cooldowns, and KWS heal throttling.
- Updated `scripts/system/listen` with `--check-deps`.
- Updated `scripts/system/tnf-voice-kws-boot.sh` to prefer explicit `node` plus
  repo-local `tsx`, with `pnpm` as fallback.
- Kept response audio off by default while preserving KWS always-on behavior.

Port and onboarding behavior:

- Updated `scripts/tnf-ports.cjs` so healthy local runtime listeners are allowed
  by preflight.
- Hid port discovery debug logging behind `TNF_PORTS_DEBUG=1`.
- Updated `scripts/tnf-onboard.cjs` so onboarded KWS does not automatically
  enable response audio.

Reusable knowledge:

- Added `.agent/skills/tnf-local-runtime-stability/` to codify the diagnosis and
  repair workflow for future agents.

## Live Verification

The following checks passed after the repair:

```text
redis-cli -p 6379 ping -> PONG
GET http://127.0.0.1:3002/health -> status healthy, service api
GET http://127.0.0.1:3001/health -> status healthy, gateway services active
GET http://127.0.0.1:43110/healthz -> status ok
GET http://127.0.0.1:50005/mic_state -> paused false
```

LaunchAgents verified running:

- `com.thenewfuse.redis-tnf-bus`
- `com.thenewfuse.api-local`
- `com.thenewfuse.api-gateway`
- `com.tnf.voice-beam-watchdog`

Validation gates passed:

```text
bash -n on changed shell scripts
node --check on changed CJS/JS scripts
git diff --check
pnpm --dir apps/audio-trigger-kws-mvp build
pnpm run validate:session-handoff
node scripts/protocols/validate-local-runtime-boundary.cjs
node scripts/protocols/validate-turn-zero-authority.cjs
node scripts/tnf-onboard.cjs --runtime-timeout-ms 1000
./tnf ports preflight
```

## Portability Rules Confirmed

- Keep machine-specific values in exported environment or `~/.tnf.local.env`.
- Do not commit local secrets or generated user plists.
- Derive repo paths from script location and user paths from `$HOME`.
- Use relay precedence: `TNF_RELAY_URL`, `RELAY_WS_URL`, `RELAY_URL`, then
  localhost fallback.
- Keep LaunchAgent source logic in repo scripts and generated plists in the
  local user profile.
- Preserve feature surface while making unavailable optional dependencies
  degrade quietly.

## Residual Follow-Up

- `validate-substrate-attestation --mode=warn` still reports lockfile seal
  drift, stale full-auto state, and missing `TNF_GATE_POLICY_TOKEN`. These are
  substrate/full-auto maintenance items, not blockers for local boot health.
- App split planning remains open: classify `apps/*` into core open-source
  runtime, optional examples, and repo-split candidates before moving code.
