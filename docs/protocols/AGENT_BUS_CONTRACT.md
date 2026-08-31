# TNF Agent Bus Contract v1

**Status:** Active protocol · **Owner:** TNF CLI agent bus · **Since:** 2026
cycle **Implementation:** `packages/tnf-cli/src/RedisAgentClient.ts`,
`packages/tnf-cli/src/services/DispatchGuard.ts` **Admin surface:**
`tnf dlq list | clear | replay`, `tnf send --await-ack`, `tnf agents match`

This document defines the minimum delivery contract for frames moving over the
TNF agent bus (Redis pub/sub + registry). It exists because the v0 bus had a
measured honesty gap: a sender that published a frame could not distinguish
"received by a live subscriber" from "published into the void", a saturated
agent looked identical to an idle one, and a duplicate delivery could trigger an
action twice. v1 closes those three gaps without breaking v0 frames.

---

## 1. Frames

A frame is the JSON envelope on every channel. v1 adds two optional fields;
everything else is unchanged (v0 producers stay valid):

| Field            | Type   | Required | Meaning                                                                                                                                       |
| ---------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | string | yes      | Frame id (uuid)                                                                                                                               |
| `timestamp`      | string | yes      | ISO timestamp                                                                                                                                 |
| `type`           | string | yes      | `message \| command \| response \| heartbeat \| status \| auction \| bid \| award \| task \| event \| query \| ack`                           |
| `from`           | object | yes      | `{ agentId, agentName, role, platform }`                                                                                                      |
| `to`             | object | —        | `{ agentId }` for direct frames; `{ broadcast: true }` for broadcasts                                                                         |
| `content`        | string | yes      | Human-readable payload summary                                                                                                                |
| `payload`        | any    | —        | Machine payload                                                                                                                               |
| `correlationId`  | string | —        | **v1.** Links a frame to its delivery ack on `tnf:ack`. Senders wanting confirmation MUST set it (or use `sendWithAck`, which generates one). |
| `idempotencyKey` | string | —        | **v1.** Dedup key. Receiving agents skip a frame whose key was already processed (§3).                                                        |

## 2. Channels

| Channel                              | Direction      | Purpose                                                                |
| ------------------------------------ | -------------- | ---------------------------------------------------------------------- |
| `tnf:conversations`                  | pub/sub        | Broadcast conversation frames                                          |
| `tnf:direct:<a>:<b>`                 | pub/sub        | Direct frames a→b                                                      |
| `tnf:heartbeat`                      | pub/sub        | Heartbeat notifications (now carry `status`, `currentLoad`, `maxLoad`) |
| `tnf:agents`                         | pub/sub        | Registry change notifications                                          |
| `tnf:ack`                            | pub/sub        | **v1.** Delivery acknowledgements                                      |
| `tnf:dlq`                            | pub/sub + LIST | **v1.** Dead-letter notice channel + durable `tnf:dlq` LIST store      |
| `tnf:queue:<agentId>` / worker inbox | LIST (LPUSH)   | Durable per-worker lane (not pub/sub)                                  |

An ack frame: `type: 'ack'`, `from` = the receiver, `correlationId` = the
correlated frame's id, optional `duplicate: true` when re-acking a duplicate.

## 3. Delivery semantics

### 3.1 Fire-and-forget (default, v0-compatible)

`send()` / `tnf send` publishes and returns. No ack is expected. Nothing is
dead-lettered. This remains the correct mode for broadcast chatter where loss is
acceptable and for direct sends where the next heartbeat proves life.

### 3.2 Acknowledged delivery (`sendWithAck` / `tnf send --await-ack [s]`)

1. Sender generates a `correlationId` and subscribes to `tnf:ack` **before**
   publishing (so a fast ack cannot slip past).
2. Receiver-side auto-ack: every correlated, non-`ack`, non-self frame is acked
   on receipt, before handler dispatch. Acks mean "received by a live
   subscriber", not "processed" — processing success is a separate concern.
3. Sender waits up to `--await-ack` seconds (default 10).
4. Outcomes:
   - **Ack received** → `delivered: true`, `ackFrom` = receiver agent id.
   - **Timeout, pure PUBLISH lane** → frame is dead-lettered (§5); CLI exits 5.
   - **Timeout, but the frame was also LPUSHed to a durable worker inbox** → NOT
     dead-lettered; the CLI reports _queued durably, ack pending_ and exits 0.
     The durable lane holds the frame; losing the ack does not mean losing the
     message.
5. Ack handlers are removed after the wait; `duplicateAck` reports when the
   receiver re-acked a duplicate.

### 3.3 Dedup / idempotency

- Each registered agent keeps a 24h receipt window in Redis: key
  `tnf:seen:<agentId>`, value = the frame's `idempotencyKey` (else
  `correlationId`, else frame `id`), stored with `SET NX EX 86400`.
- A frame whose key was **already seen** is re-acked (so sender retries still
  get confirmation) but is **not dispatched to handlers** again.
- Dedup never throws and never blocks delivery on Redis errors — availability
  beats exactly-once.
- Senders doing retries SHOULD reuse the same `idempotencyKey`
  (`tnf send --idempotency-key <key>`).

## 4. Capacity vocabulary

Registry rows and heartbeats carry:

- `status`: `'active' | 'busy' | 'idle' | 'offline'`
- `currentLoad`, `maxLoad` (optional; default maxLoad = 1)

Rules:

1. **busy ⇔ declared `status: 'busy'` OR `currentLoad >= maxLoad`.**
2. An agent that declares nothing is treated as **not busy** — backward
   compatible with every pre-v1 row.
3. A **directly-addressed `task` frame** auto-increments the receiver's load and
   marks it busy (broadcast tasks do not). Release paths: an explicit
   `markBusy(false)` by a lifecycle-aware daemon, or the daemon adjusting load
   on `execution.complete`/`execution.fail` events.
4. Dispatch gate: `tnf send --require-capacity` refuses recipients whose
   capacity is declared **and** busy (exit 4; `--force` overrides). Refusing is
   opt-in so existing automation keeps its semantics.
5. The broker (`tnf agents match --require-capacity`) only returns candidates
   that are live, online, and not busy.

## 5. Dead-letter queue

- **What lands there:** only unconfirmed _pure-pub/sub_ frames — a send with an
  ack timeout and no durable LPUSH lane. Durable-lane timeouts are reported as
  queued-durable (§3.2.4) and never dead-lettered.
- **Store:** `tnf:dlq` pub/sub channel (live notice) + `tnf:dlq` Redis LIST
  (durable). Entries carry
  `{ id, deadAt, reason, timeoutMs, channel, to, frame }`.
- **Recovery:** `tnf dlq list [--json] [--limit n]` · `tnf dlq replay <entryId>`
  (re-publishes to the original channel and removes the entry) ·
  `tnf dlq clear`.
- Dead-lettering never throws; it must not break an already-failing caller.

## 6. What v1 deliberately does NOT claim

- Ack = received, not processed. Result reporting is the task lifecycle's job
  (execution events / durable worker queues).
- Dedup is per-receiver and best-effort (24h window), not transactional.
- The DLQ is a recovery surface for observability, not a retry engine.

## 7. Capability broker

`tnf agents match --capabilities "a,b" [--require-capacity] [--include-offline] [--platform p] [--limit n] [--json]`
joins static capability (spec frontmatter in `.agent/agents/` +
`.claude/agents/`: traits, category, dacc_role, name, description) with live
registry state (status, load, heartbeat age). Scoring is token-based and
transparent (traits ×3, category/role ×2, name ×2, description ×1, normalized
0..1); live state filters and displays but never changes the score.
