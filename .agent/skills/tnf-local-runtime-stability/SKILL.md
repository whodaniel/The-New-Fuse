---
name: tnf-local-runtime-stability
description:
  Diagnose, repair, and harden TNF local runtime startup behavior. Use when TNF
  boot/login is slow, launchd or cron jobs appear to restart aggressively,
  Redis/API/gateway/voice/KWS health is unstable, local runtime fixes must carry
  over to other open-source installs, or an agent needs to verify macOS
  LaunchAgent service health without machine-specific assumptions.
---

# TNF Local Runtime Stability

Use this skill to convert a local startup problem into durable TNF runtime
improvements. Prefer repo-owned scripts, portable defaults, and explicit
verification over one-machine fixes.

## Operating Loop

1. Inspect live state first.
2. Act with the smallest durable change.
3. Verify with launchd state, process state, endpoint health, and repo
   validation.
4. Codify reusable recovery patterns in scripts, docs, skills, or tests.

Do not kill processes, hard-delete files, commit, push, or handle credentials
unless the operator explicitly authorizes that action. Local secrets belong in
`~/.tnf.local.env`, never in source.

## Startup Triage

Run from the TNF repository root:

```bash
node scripts/tnf-onboard.cjs --runtime-timeout-ms 1000
pnpm run -s tnf:local:services:status
./tnf ports preflight
```

Then prove each core local endpoint independently:

```bash
redis-cli -p 6379 ping
curl -fsS -m 3 http://127.0.0.1:3002/health
curl -fsS -m 3 http://127.0.0.1:3001/health
curl -fsS -m 3 http://127.0.0.1:43110/healthz
curl -fsS -m 3 http://127.0.0.1:50005/mic_state
```

If startup is slow, inspect launchd and logs before changing anything:

```bash
launchctl print "gui/$(id -u)/com.thenewfuse.redis-tnf-bus"
launchctl print "gui/$(id -u)/com.thenewfuse.api-local"
launchctl print "gui/$(id -u)/com.thenewfuse.api-gateway"
launchctl print "gui/$(id -u)/com.tnf.voice-beam-watchdog"
tail -120 /tmp/voice_beam_watchdog.launchd.log
tail -120 /tmp/tnf_voice_kws_boot.log
tail -120 /tmp/tnf_kws_mvp.log
```

## Durable Repair Rules

- Use `StartInterval`, not unconditional `KeepAlive`, for optional local
  services.
- Make `start` idempotent. It should not unload healthy services.
- Reserve `bootout` for explicit `stop` or `restart`.
- Start dependencies in order: Redis, local API, gateway, voice watchdog, KWS.
- Make launchd entrypoints defer with exit 0 when a build artifact, dependency,
  or TCP prerequisite is absent.
- Resolve paths from the repo root or `$HOME`, not a personal absolute path.
- Resolve relay URLs by precedence: `TNF_RELAY_URL`, then `RELAY_WS_URL`, then
  `RELAY_URL`, then local fallback.
- Prefer explicit binaries under launchd. Do not assume interactive shell `PATH`
  includes `pnpm`, Homebrew, or custom node shims.
- Treat optional voice transcription dependencies as optional. Missing
  `whisper-cpp` should log a throttled warning, not create a restart loop.

## Known Healthy Local Shape

The portable local service scripts should be the first repair surface:

```bash
pnpm run -s tnf:local:services:install
pnpm run -s tnf:local:services:start
pnpm run -s tnf:local:services:status
```

Expected local ports:

- Redis: `127.0.0.1:6379`
- API local: `http://127.0.0.1:3002/health`
- API gateway: `http://127.0.0.1:3001/health`
- KWS MVP: `http://127.0.0.1:43110/healthz`
- Voice server: `http://127.0.0.1:50005/mic_state`

## Verification Gates

Run the narrow gates for runtime edits:

```bash
bash -n scripts/runtime/tnf-local-launchd-services.sh scripts/runtime/tnf-launchd-smart-start.sh scripts/runtime/redis-local-bootstrap.sh scripts/system/voice-beam-watchdog.sh scripts/system/tnf-voice-kws-boot.sh scripts/system/listen
node --check scripts/runtime/establish-core-federated-fleet.cjs
node --check scripts/tnf-onboard.cjs
node --check scripts/tnf-ports.cjs
node scripts/protocols/validate-local-runtime-boundary.cjs
node scripts/protocols/validate-turn-zero-authority.cjs
pnpm --dir apps/audio-trigger-kws-mvp build
./tnf ports preflight
node scripts/tnf-onboard.cjs --runtime-timeout-ms 1000
```

For macOS hardware concerns, check RAM separately from TNF runtime pressure:

```bash
system_profiler SPMemoryDataType
system_profiler SPPowerDataType | rg -n "Condition|Cycle Count|Full Charge Capacity|State of Charge" -C 2
```

RAM status `OK` on each DIMM points away from memory failure. Battery
`Service Recommended` is a separate hardware maintenance signal.
