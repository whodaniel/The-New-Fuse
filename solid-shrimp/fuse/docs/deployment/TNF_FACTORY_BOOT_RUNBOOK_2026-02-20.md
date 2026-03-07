# TNF Factory Boot Runbook (2026-02-20)

## Objective

Run local TNF control plane continuously:

- Redis (already running)
- Relay (`relay-core`)
- Master Clock (orchestrator)
- Super-cycle heartbeat loop
- Blue-lane swarm seeding for federated participants

## One-time Boot

```bash
pnpm run factory:boot
```

## Keep Continuous Self-Improvement Alive

Run in separate terminal/session:

```bash
pnpm run factory:supercycle
```

This keeps `tnf-self-improvement-loop` healthy in `tnf:master:state.superCycle`.

## Seed Blue Channel Mission Playbook

```bash
pnpm run factory:blue:seed
```

Default channel id is `channel-1771603937514` (Blue). Override with:

```bash
BLUE_CHANNEL_ID=<your-blue-channel-id> pnpm run factory:blue:seed
```

## Seed thenewfuse.com Improvement Lanes

This writes concrete high-priority tasks into Redis queue
`tnf:master:tasks:pending` and rebroadcasts Blue-lane kickoff guidance.

```bash
pnpm run factory:website:seed
```

## Health Checks

```bash
curl -sS --max-time 3 http://localhost:3000/health
redis-cli HGET tnf:master:state orchestrator
redis-cli HGET tnf:master:state superCycle
redis-cli LLEN tnf:master:self-prompts
```

## Known Issue (Federated Injectable)

Current behavior indicates channel switching in one tab propagates to all tabs.
This likely means channel selection state is shared globally (extension-level)
rather than scoped per tab/session. Use this runbook with Blue-only focus until
per-tab channel scoping is patched.
