# Run Log - 2026-02-17 - Autonomy Control Plane Wiring

## Scope Completed

- Added autonomous service wiring in extension background for:
  - relay monitor startup
  - master clock startup
  - stall watchdog wake-ping loop
  - onboarding context frontload for newly registered page agents
  - activity event emission to `fuse-activity-log`
- Extended native host service catalog with:
  - `monitor` -> `pnpm run relay:monitor`
  - `masterClock` -> `pnpm run master-clock`
  - stop logic for non-port services via `pkill -f ...`

## Files Updated

- `apps/chrome-extension/src/v6/background/index.ts`
- `apps/chrome-extension/src/v6/native-host/tnf-native-host.js`
- `apps/chrome-extension/src/v6/popup/index.html`
- `apps/chrome-extension/src/v6/popup/popup.js`
- `apps/chrome-extension/src/v6/popup/docs-index.html`
- `apps/chrome-extension/src/v6/popup/docs/architecture-pattern-index.html`
- `apps/chrome-extension/dist-v7/native-host/tnf-native-host.js` (synced from
  source)
- `apps/chrome-extension/dist-v7/background/index.js` (runtime hot patch for
  auto-start)
- `apps/chrome-extension/dist-v7/popup/index.html` (synced for immediate runtime
  use)
- `apps/chrome-extension/dist-v7/popup/popup.js` (synced for immediate runtime
  use)
- `apps/chrome-extension/dist-v7/popup/docs-index.html` (runtime docs hub)
- `apps/chrome-extension/dist-v7/popup/docs/architecture-pattern-index.html`
  (runtime architecture quick-view)

## Behavior Added

- On relay connect/start, extension now attempts to start monitor + master
  clock.
- When relay is unavailable during boot, extension attempts autonomous relay
  start.
- Watchdog sends periodic `WAKE_PING` events to joined channels when stalled.
- New page agents receive a `FUSE_ONBOARDING_CONTEXT` payload with channels,
  known agents, policy.
- Activity events are published over relay to `fuse-activity-log`.
- Main popup now includes autonomy controls and live status:
  - `Auto Monitor`
  - `Auto Master Clock`
  - `Auto Wake Ping`
  - `Start Autonomy Now`
- Services tab now includes dedicated cards for:
  - `Relay Monitor`
  - `Master Clock`
- Popup footer `Docs` now opens an extension-hosted docs hub page with a direct
  architecture link.

## Validation Performed

- Syntax checks passed:
  - `node --check apps/chrome-extension/dist-v7/background/index.js`
  - `node --check apps/chrome-extension/src/v6/native-host/tnf-native-host.js`
  - `node --check apps/chrome-extension/dist-v7/native-host/tnf-native-host.js`
  - `node --check apps/chrome-extension/src/v6/popup/popup.js`
  - `node --check apps/chrome-extension/dist-v7/popup/popup.js`
- Note: package-wide typecheck currently fails on pre-existing legacy issues
  unrelated to this run.
