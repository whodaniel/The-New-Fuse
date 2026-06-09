# TNF Boot Resilience Repair - 2026-06-03

## Summary

Codex repaired the TNF boot path after `tnf boot` aborted during the agent swarm
startup step. The failure was caused by permissive port assumptions and brittle
wrapper launch detection: port 3005 was accepted purely because it was occupied,
and Antigravity was treated as failed even when the wrapper was already running.

## Changes

- `scripts/start-agent-network.sh`
  - Validates the WebSocket bridge via `http://127.0.0.1:3005/health`.
  - Treats already-running Antigravity and agent wrappers as success.
  - Waits for wrapper processes after Terminal launch instead of using fixed sleeps.
  - Reports wrapper status through shared liveness helpers.

- `scripts/tnf-ports.cjs`
  - Restored health-aware port preflight.
  - Classifies occupied `3000` as valid only when it matches known TNF runtime
    contracts such as `relay-core` or `hermes/whatsapp-bridge`.
  - Classifies occupied `3005` as valid only when the API gateway/WebSocket
    bridge health endpoint reports `status: ok`.
  - Keeps unknown listeners visible and strict-mode blocking.

- `packages/tnf-cli/src/cli.ts`
  - Adds port preflight as an explicit boot step.
  - Removes blanket numeric allow-listing for `3005`; occupied ports must prove
    their runtime identity by health check.

- `scripts/orchestrator/factory-boot.sh`
  - Runs the same health-aware port preflight before platform gateway startup.

- `scripts/protocols/whatsapp-bridge-health-check.cjs`
  - Reads only a bounded tail from the WhatsApp bridge log instead of loading
    the full log into memory.
  - Emits lifecycle states such as `reachable-not-connected` and
    `pairing-or-startup-pending`.

- `scripts/tnf-doctor.cjs`
  - Prints the WhatsApp bridge lifecycle so optional pairing states are clear.

- `~/.tnf/tnf-status`
  - Shows the raw AI CLI Turn Zero prompt with repo-relative
    `./docs/protocols/TURN_ZERO_MANDATE.md`, avoiding literal `$TNF_ROOT`
    leakage into model prompts.

## Verification

- `node --check scripts/tnf-ports.cjs`
- `node --check scripts/protocols/whatsapp-bridge-health-check.cjs`
- `node --check scripts/tnf-doctor.cjs`
- `bash -n scripts/start-agent-network.sh`
- `bash -n scripts/orchestrator/factory-boot.sh`
- `pnpm --filter @the-new-fuse/tnf-cli exec tsc --noEmit --pretty false`
- `pnpm run -s local-runtime:guard`
- `pnpm run -s cleanroom:guard`
- `node scripts/tnf-ports.cjs preflight --strict`
- `./tnf boot --non-interactive`

Final boot result:

```text
TNF System Health: PASS (cloud services operational)
TNF Stack "goldberg" is now operational
```

## Remaining Non-Fatal Conditions

- Docker Desktop daemon is still unavailable locally, so Docker clean-room build
  execution remains blocked by host daemon state.
- WhatsApp bridge is reachable but not connected; this is an optional pairing
  state and no longer blocks TNF boot.
- Local backend `3004`, Wrangler auth, OpenClaw CLI, and `stripe.json`
  `env_mapping` remain warning-only conditions.
