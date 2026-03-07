# TNF Orchestrator Stall Defense + Self-Prompting (2026-02-20)

## Summary

The Chronological orchestrator (`packages/relay-core/src/master-clock.ts`) now
emits autonomous self-prompts when:

- An agent is stalled and recovery attempts are triggered.
- A super-cycle/scheduled process is detected as stale.

This uses both federation relay and Redis:

- Relay broadcast to the relevant channel (existing behavior + explicit
  self-prompt for stale processes).
- Redis ingress publish (`tnf:bus:ingress`) via TNF envelope for control-plane
  observability.
- Redis targeted egress publish (`tnf:bus:egress:{sourceId}`) for direct
  per-agent wake-up tasks.
- Redis persistent prompt log (`tnf:master:self-prompts`) for auditing.

## New Environment Controls

- `SELF_PROMPT_ENABLED` (default: `true`)
- `SELF_PROMPT_COOLDOWN_MS` (default: `30000`)

## New Redis Key

- `tnf:master:self-prompts` (recent self-prompt events, capped at 500 items)

## Inspect Self-Prompt History

```bash
pnpm --filter @the-new-fuse/relay-core run super-cycle:self-prompts
```

Optional limit:

```bash
SELF_PROMPT_STATUS_LIMIT=50 pnpm --filter @the-new-fuse/relay-core run super-cycle:self-prompts
```

## Run Orchestrator with Stall Defense

```bash
pnpm --filter @the-new-fuse/relay-core run master-clock:dev
```

Or production build:

```bash
pnpm --filter @the-new-fuse/relay-core run master-clock
```
