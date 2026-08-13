# TNF Local Director Resilience and CLI Review (2026-05-28)

Status: Applied and verified  
Owner: Local Director / Codex runtime  
Scope: TNF local autonomy protocols, local subdirector visibility, stall
defense, chronological process catalog, and TNF CLI command surface

## Protocol Followed

This work followed the TNF operating loop: inspect, act, verify.

- Inspect: read live state from local heartbeat JSON, director health JSON, cron
  entries, logs, CLI source, command help output, and master-clock audit
  artifacts.
- Act: patched runtime code and documentation only after confirming the failure
  mode.
- Verify: reran syntax checks, command help probes, command inventory export,
  chronological tests, master-clock audit, and heartbeat state checks.

No secret values are recorded in this note.

## Runtime Changes

### Local subdirector process fallback

Files updated:

- `scripts/runtime/local-subdirector-runtime.cjs`
- `~/.tnf/local-subdirector/bin/local-subdirector-runtime.cjs`

Changes:

- Expanded local agent command detection to include `agy`, `tnf`, `jules`,
  `openclaw`, `opencode`, `kilo`, `hermes`, `aider`, `claude`, `codex`,
  `gemini`, and `goose`.
- Added process-table fallback terminal discovery when AppleScript Terminal
  polling is blocked or returns no windows.
- Added `source` to session records so fallback sessions are distinguishable
  from AppleScript-derived sessions.
- Added summary fields:
  - `processFallbackActive`
  - `processFallbackSessions`
- Classified live process-table fallback sessions as `active` instead of
  `stalled`; process fallback proves process liveness but does not provide a
  Terminal buffer diff suitable for stall detection.
- Kept AppleScript automation hold visible as a degraded condition rather than
  hiding it.
- Added explicit `ws` fallback for WebSocket publishing so wake/stall-defense
  does not depend on `globalThis.WebSocket`.

### Live service recovery

`launchctl` restart was blocked in this harness with an I/O error, so the
patched local subdirector was restored through a detached `screen` session:

```bash
screen -dmS tnf-local-subdirector env \
  LOCAL_SUBDIRECTOR_STATE_DIR="$HOME/.tnf/local-subdirector/state" \
  node "$HOME/.tnf/local-subdirector/bin/local-subdirector-runtime.cjs"
```

Operator checks:

```bash
screen -ls
screen -r tnf-local-subdirector
```

Normal launchd reattachment, when macOS permits it:

```bash
scripts/runtime/local-subdirector-service.sh restart
scripts/runtime/local-subdirector-service.sh status
```

## Current Runtime Verification

Latest verified local state during this run:

- Director health: `healthy`
- Director source: `local-subdirector`
- Director observed sessions: 18
- Local subdirector status: `degraded-automation-hold`
- Local subdirector process fallback: active
- Local subdirector observed sessions: 17-20 across checks
- Local subdirector stalled sessions after fallback classification fix: 0
- AppleScript hold: active until `2026-05-28T19:48:26.811Z`
- Stall defense: wake events written to
  `~/.tnf/local-subdirector/state/local-subdirector-wake-events.jsonl`

The degraded status is expected while macOS Terminal Automation/TCC access is
held. The important protocol improvement is that session visibility and
stall-defense no longer depend only on AppleScript.

Note: running `scripts/runtime/tnf-director-loop.cjs` inside this harness can
still exit nonzero after writing health state because Redis fanout attempts are
blocked by sandbox socket permissions. The state artifact was verified directly
after that run and reported `healthy` from `local-subdirector`.

## Chronological Process Catalog Repair

Files updated:

- `data/protocols/chronological-process-catalog.json`
- `data/protocols/chronological-dispatch-profiles.json`

Catalog/profile coverage was added for:

- `tenant-continuous-qa-loop`
- `tenant-knowledge-scout-sprint`
- `tenant-orchestrator-pulse`
- `tenant-loop-watchdog`
- `tenant-self-improvement-loop`

Master-clock sync audit result:

- Total processes: 16
- With catalog: 16
- Missing catalog: 0
- Escalations: 0

## TNF CLI Review

Files updated:

- `packages/tnf-cli/src/cli.ts`
- `packages/tnf-cli/package.json`
- `packages/tnf-cli/tsconfig.json`
- `packages/tnf-note-taking/tsconfig.json`
- `packages/tnf-cli/README.md`
- `docs/protocols/reports/tnf-cli-command-paths-2026-05-28.json`

CLI command surface reviewed:

- Top-level help: verified
- Menu command: verified
- HookChain command family: verified
- Self-improvement command family: verified
- Full-auto command family: verified
- Command path inventory: 237 CLI paths
- TNF root package scripts shown by menu: 61

Bug fixed:

- `pnpm run tnf -- --help` previously passed a literal `--` into Commander and
  failed with `unknown command '--help'`.
- `pnpm run tnf -- menu --compact --theme mono --no-splash` previously treated
  valid options as extra arguments.
- `packages/tnf-cli/src/cli.ts` now normalizes a leading package-script
  separator before passthrough routing and Commander parsing.
- `packages/tnf-cli/tsconfig.json` previously mapped workspace package imports
  directly to sibling package source files outside `rootDir`, causing
  TS6059/TS6307 failures. The CLI now references workspace packages as project
  references and consumes package boundaries instead of absorbing foreign source
  files.
- `packages/tnf-cli/package.json` now runs type-check via `tsc --build --noEmit`
  so the package script honors project references during clean checks.
- `packages/tnf-note-taking/tsconfig.json` is now `composite: true`, allowing
  safe TypeScript project references from the CLI.

Verified commands:

```bash
pnpm run tnf -- --help
pnpm run tnf -- menu --compact --theme mono --no-splash
node --import tsx packages/tnf-cli/src/cli.ts paths --json
node --import tsx packages/tnf-cli/src/cli.ts hooks --help
node --import tsx packages/tnf-cli/src/cli.ts self-improvement --help
node --import tsx packages/tnf-cli/src/cli.ts full-auto --help
pnpm --filter @the-new-fuse/tnf-cli type-check
pnpm --filter @the-new-fuse/tnf-cli build
```

## Validation Commands

```bash
node --check scripts/runtime/local-subdirector-runtime.cjs
node --check ~/.tnf/local-subdirector/bin/local-subdirector-runtime.cjs
node --test scripts/protocols/chronological-dispatch.test.cjs scripts/protocols/run-chronological-process.test.cjs
node scripts/protocols/master-clock-sync-audit.cjs --json
```

Results:

- Runtime syntax checks passed.
- Chronological protocol tests passed: 2/2.
- Master-clock audit passed with zero missing catalog entries and zero
  escalations.
- CLI help/menu probes passed after argv normalization.
- TNF CLI package type-check and build passed after TypeScript project-reference
  correction.

## Single-Instance Guard Hardening

Files updated:

- `scripts/lib/tnf-single-instance-guard.cjs`
- `scripts/protocols/run-chronological-process.cjs`
- `scripts/tnf-onboard.cjs`
- `scripts/tnf-seed-control-plane.cjs`

Changes:

- `run-chronological-process.cjs` now invokes the shared `singleInstanceGuard()`
  immediately after argument parsing with a per-process lock name:
  `run-chrono-<process-id>`.
- Concurrent chronological process invocations now return clean JSON with
  `ok: true`, `skipped: "already-running"`, `reason: "already-running"`, and the
  live owner lock instead of racing into duplicate dispatch artifacts.
- `tnf-onboard.cjs` now uses a `tnf-onboard` lock after help parsing and before
  repair/frontload work.
- `tnf-seed-control-plane.cjs` now uses a `tnf-seed-control-plane` lock after
  required environment validation and before database seeding starts.
- The shared guard's `createLock()` path was normalized so it explicitly creates
  the lock directory before the atomic lock `mkdir` while preserving the
  existing PID liveness and stale-lock behavior.
- The shared guard's stale detection now treats a live owner PID as
  authoritative. Lock age alone no longer evicts a still-running owner process,
  which prevents long but healthy routines from being duplicated after
  `staleMs`.

Verification:

```bash
node --check scripts/lib/tnf-single-instance-guard.cjs
node --check scripts/protocols/run-chronological-process.cjs
node --check scripts/tnf-onboard.cjs
node --check scripts/tnf-seed-control-plane.cjs
```

Live-lock duplicate suppression was verified with temporary `TNF_LOCKS_DIR`
directories and live background owner PIDs for:

- `run-chrono-tenant-loop-watchdog`
- `tnf-onboard`
- `tnf-seed-control-plane`

Each second invocation exited zero and emitted `skipped: "already-running"`. A
live-owner lock with an artificially old mtime was also verified to remain held
rather than being recovered as stale. A dead-owner stale lock was verified to
recover and reacquire normally.

Deferred item:

- `scripts/hermes-gateway-bridge.cjs` is currently pre-existing dirty and
  syntactically corrupted around its `redisUrl` config/health handler region. It
  was not modified in this pass because adding a guard to an unparseable file
  would not make the bridge safer. Repair the bridge source first, then add the
  same single-instance guard at process entry.

## Remaining Operator Item

AppleScript Terminal automation remains under macOS hold. To restore
Terminal-window level inventory instead of process-table fallback, resolve
Terminal Automation/TCC permissions for the process identity running the
subdirector, then restart the launchd service or let the hold expire.

Until then, the process-table fallback keeps local director visibility and
stall-defense active.
