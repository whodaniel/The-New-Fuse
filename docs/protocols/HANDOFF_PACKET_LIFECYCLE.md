`[CLASS:PROTOCOL] [STATUS:ACTIVE]` — 2026-07-25

# Handoff Packet Lifecycle Protocol

## Why

`HandoffPacket` delivery is at-least-once. Without a standard post-work
lifecycle, completed work leaves packet IDs in live inboxes (including the
current baton `ORCHESTRATOR-{timestamp}`), which:

- inflate broker/agent inbox scans
- confuse “what still needs action”
- survive baton rotation via orphan migration

This protocol defines **when** a packet may leave the live inbox, **what
evidence** is required, and **how often** the control plane sweeps residue.

Orthogonal axes still apply: lifecycle is about packet state, not `daccRole` or
fulfillment `platform`.

## Authority

1. This document (`docs/protocols/HANDOFF_PACKET_LIFECYCLE.md`)
2. `docs/protocols/AGENT_TARGETED_HANDOFF_V1.md` (packet/ack contract)
3. Implementation:
   - `packages/relay-core/src/services/handoff-packet-lifecycle.service.ts`
   - `packages/relay-core/src/services/HandoffStoreService.ts`

## State Machine

```text
pending
  └─ ack:received ──► received
                         └─ ack:claimed ──► claimed
                                              ├─ ack:completed ──► completed
                                              └─ ack:rejected  ──► rejected

completed | rejected  (terminal per-target acks)
  └─ verification receipt (pass) ──► verified
                                       └─ soft-retire (inbox LREM)
                                            └─ grace ──► archive
                                                           └─ archive TTL ──► purge
```

| Phase                                | Live inbox?                      | Required evidence                        |
| ------------------------------------ | -------------------------------- | ---------------------------------------- |
| `pending` / `received` / `claimed`   | yes                              | none                                     |
| `completed` / `rejected` (acks only) | yes (actionable=no after verify) | terminal ack(s)                          |
| `verified`                           | no (soft-retired)                | verification receipt `result=pass`       |
| `archived`                           | no                               | archive copy under `archive:packet:{id}` |
| `purged`                             | no                               | Redis TTL / explicit purge               |

## Verification Gate (mandatory before retire)

A packet is **verified** only when **all** of the following hold:

1. **Terminal coverage** — every `targets.agentIds` entry has an ack whose
   `status` is `completed` or `rejected`.
2. **Verification receipt** written at `tnf:handoff:v1:verify:{packetId}`:
   - `packetId` (uuid)
   - `verifiedAt` (ISO-8601)
   - `verifiedBy` (agent id, operator id, or `broker-lifecycle`)
   - `result` ∈ {`pass`, `fail`}
   - `evidenceRefs` — non-empty list (test receipt path, Merkle hash, CI run
     URL, ledger event id, etc.)
   - `note` (optional)
3. **`result=pass`** — `fail` keeps the packet live for remediation.

Operators may record verification via CLI after local/CI checks. Agents MUST not
soft-retire on `ack:completed` alone.

## Soft-retire → Archive → Purge

### Soft-retire (immediate after verify)

1. `LREM` packet id from every target inbox key shape:
   - `inbox:{agentId}`
   - `inbox:agent:{agentId}`
2. If `scope.sessionKey` is set, `LREM` from `index:session:{sessionKey}`.
3. Keep live `packet:{id}` and `ack:{id}` until archive (auditability).

### Archive (after grace)

Default grace: **24 hours** after `verifiedAt` (`HANDOFF_ARCHIVE_GRACE_MS`).

1. Copy packet + acks + verification → `archive:packet:{id}` (JSON blob).
2. Push id onto `archive:index` (capped list).
3. Set archive TTL default **90 days** (`HANDOFF_ARCHIVE_TTL_SECONDS`).
4. Delete live `packet:{id}`, `ack:{id}`, `verify:{id}`.

### Purge

Archive keys expire via Redis TTL. No separate job required unless operators
want early purge (`--purge-archived-before`).

## Automatic sweep (regular cadence)

Broker runs `sweepHandoffPacketLifecycle` on an interval
(`BROKER_HANDOFF_LIFECYCLE_MS`, default **15 minutes**).

Each sweep, per scanned inbox (cap configurable):

| Disposition                                   | Action                                     |
| --------------------------------------------- | ------------------------------------------ |
| **dangling** — inbox id, packet key missing   | `LREM` (safe; no verify)                   |
| **expired** — `expiresAt` ≤ now, not verified | `LREM`; optional archive of remaining JSON |
| **verified + past grace**                     | archive + delete live keys                 |
| **verified + inside grace**                   | ensure soft-retired (idempotent `LREM`)    |
| **active / incomplete**                       | leave untouched                            |

Manual / CI:

```bash
pnpm run handoff:lifecycle:sweep
pnpm run handoff:lifecycle:sweep -- --dry-run
pnpm run handoff:lifecycle:verify -- --packet <uuid> --by <agentOrOperator> --evidence <ref>[,ref...]
```

## Operator checklist (work complete)

1. Target agent(s) ack `completed` (or `rejected`) with a short note.
2. Run verification (tests, Merkle, ledger receipt).
3. `handoff:lifecycle:verify` with ≥1 `evidenceRefs`.
4. Confirm packet absent from live inbox (`listForAgent` / Redis `LRANGE`).
5. Leave archive alone unless audit needs early purge.

## Non-goals

- Does not replace session-file handoff (`SESSION_HANDOFF_*`).
- Does not change baton identity rules (`ORCHESTRATOR-{ts}` from master-clock).
- Does not treat Antigravity (or any platform) as lifecycle authority.

## Storage keys (prefix `tnf:handoff:v1`)

| Key                                         | Purpose                 |
| ------------------------------------------- | ----------------------- |
| `packet:{id}`                               | live packet JSON        |
| `ack:{id}`                                  | hash agentId → ack JSON |
| `inbox:{agentId}` / `inbox:agent:{agentId}` | live delivery lists     |
| `verify:{id}`                               | verification receipt    |
| `archive:packet:{id}`                       | archived bundle         |
| `archive:index`                             | recent archive ids      |

## SLA metrics (recommended)

- `pending → claimed` latency
- `claimed → completed` latency
- `completed → verified` latency
- inbox depth (live ids) vs archived count
- dangling LREM rate (should trend to zero after sweeps)

## Revision

- **ID:** `PROT-HANDOFF-LIFECYCLE-2026`
- **Revision:** 1.0.0
- **Date:** 2026-07-25
