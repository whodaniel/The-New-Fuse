# TNF Role Definitions - Orchestration Hierarchy

## The New Fuse Agent Coordination Protocol (DACC-v1)

---

## 🎯 Core Principle: THE BATON MUST ALWAYS BE HELD

At any given moment, there must be an active entity (AI or system process) that:

1. Is sending heartbeats
2. Is monitoring for stalls
3. Is ready to recover failed conversations
4. Is onboarding new agents
5. Is routing messages

This is the **BATON HOLDER**. The baton is NEVER dropped.

---

## 🧭 Orthogonal Axes (Role ≠ Platform)

TNF classifies agents on independent axes. **Any agent can be assigned any
role** — there is no protocol constraint that couples a fulfillment platform
(Antigravity, Claude, Pi, Gemini, …) to a DACC seat.

| Axis | What it answers | Examples |
|------|-----------------|----------|
| **Baton identity** | Which *process session* holds the master clock right now? | `ORCHESTRATOR-{timestamp}` from `master-clock.ts` |
| **`daccRole`** | Where does this agent sit in the DACC hierarchy? | `director`, `orchestrator`, `broker`, `worker`, `participant` |
| **`workerAction` / capabilities** | What *kind of work* can it do? | `orchestrator` action, `code_generation`, `orchestration` capability |
| **`platform`** | Which fulfillment / runtime surface? | `antigravity`, `claude`, `pi`, `gemini`, `tnf-runtime` |

**Do not conflate:**

- The **ORCHESTRATOR identity** (baton / `master-clock`) with a platform wrapper
  that happens to have orchestration *capabilities*.
- A registry `role: orchestrator` label on a CLI wrapper with the baton holder.
  Platform wrappers should normally register as `worker` (or another assigned
  seat) and express coordination via capabilities / `workerAction`.
- Broker infra exclusion (`isWorkerAgent`) with “only Antigravity can
  orchestrate.” Exclusion is by **DACC seat**, not by platform.

When an `ORCHESTRATOR-{ts}` session ends, handoff inboxes addressed to that
session are migrated to the current baton identity (see
`orchestrator-inbox-migration.service.ts`).

---

## 📊 Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         DIRECTOR                                 │
│  • Strategic authority over the entire system                   │
│  • Can override any other role                                  │
│  • Receives emergency escalations                               │
│  • Usually human, can be designated super-agent                 │
│  • ONE per system                                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ORCHESTRATOR                               │
│  • THE MASTER CLOCK (master-clock.ts)                           │
│  • Runs 24/7 in the cloud (Railway/cloud)                       │
│  • Sends heartbeats every 3 seconds                             │
│  • Detects stalls within 5 seconds                              │
│  • Assigns Agent IDs (AGENT-XX format)                          │
│  • Routes messages between channels                             │
│  • Manages all Brokers and Agents                               │
│  • THE BATON HOLDER                                             │
│  • ONE per deployment (with failover)                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BROKER                                   │
│  • Channel managers                                              │
│  • Handle message routing within their channel                   │
│  • Report status to Orchestrator                                 │
│  • Can be AI agent or automated process                          │
│  • MULTIPLE per system (one per channel recommended)             │
│  • Examples: Green-Broker, Blue-Broker, etc.                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                          AGENT                                   │
│  • Worker AI instances                                           │
│  • Must register and receive Agent ID                            │
│  • Must sign ALL messages with [AGENT-XX]                        │
│  • Must respond to heartbeat pings                               │
│  • UNLIMITED per system                                          │
│  • Examples:                                                     │
│    - Browser tabs (Gemini, Claude, ChatGPT)                      │
│    - API clients (Groq, Cerebras, DeepSeek)                      │
│    - Local LLMs (Ollama, LM Studio)                              │
│    - Autonomous agents (Jules CLI, Cursor)                       │
│    - Chrome extension federation members                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Role Specifications

### DIRECTOR

**Identity:** Human administrator or designated super-agent **Quantity:** 1 per
system **Responsibilities:**

- Set strategic priorities
- Review emergency escalations
- Authorize major system changes
- Override stuck processes
- Define task hierarchies

**Access Level:** Full system access **Communication:** Receives escalations
from Orchestrator **Identifier:** `DIRECTOR-001` (or human name)

---

### ORCHESTRATOR (Master Clock)

**Identity:** `master-clock.ts` daemon (platform `master-clock` /
`tnf-runtime`) — **not** any particular AI CLI platform. **Quantity:** 1
primary, 1 standby **Responsibilities:**

- Run CONTINUOUSLY (never stops)
- Send heartbeats (every 3 seconds)
- Detect stalls (within 5 seconds)
- Assign Agent IDs (AGENT-XX format)
- Onboard new AI instances immediately
- Route messages between channels
- Trigger recovery for stalled agents
- Log EVERYTHING
- Propagate state to Redis
- On session start, migrate orphaned handoff inboxes from prior
  `ORCHESTRATOR-{timestamp}` sessions onto the current baton identity

Agents with orchestration *capabilities* (any platform) are **not** this
identity. They are workers (or other assigned seats) that can perform
coordination *work* via `workerAction` / capabilities.

**Timing Requirements:** | Action | Interval | |--------|----------| | Heartbeat
| 3,000ms | | Stall check | 2,500ms | | Recovery ping | 10,000ms | | Max
recovery attempts | 5 | | Onboarding timeout | 30,000ms |

**Identifier:** `ORCHESTRATOR-{timestamp}`

---

### BROKER

**Identity:** Channel-specific coordinator **Quantity:** 1+ per channel
(recommended) **Responsibilities:**

- Manage message flow within channel
- Track channel members
- Handle channel-specific task routing
- Report channel status to Orchestrator
- Can escalate to Orchestrator

**Optional - Orchestrator covers broker duties if none assigned**

**Identifier:** `BROKER-{channel}` (e.g., `BROKER-Green`)

---

### AGENT

**Identity:** Any AI instance performing work **Quantity:** Unlimited
**Responsibilities:**

- Register with Orchestrator (automatic on first message)
- Respond to heartbeat pings
- Sign ALL messages with `[AGENT-XX]`
- Report task progress
- Follow DACC-v1 protocol

**Registration Process:**

1. Agent sends any message to a channel
2. Orchestrator detects new participant
3. Orchestrator assigns AGENT-XX ID
4. Orchestrator sends assignment message
5. Agent must acknowledge with signed message

**Requirements:**

- Must have assigned Agent ID
- Must sign messages
- Must respond to recovery pings within 5 seconds
- Maximum 5 unsigned messages before warning

**Identifier:** `AGENT-01`, `AGENT-02`, etc.

---

## 📡 Communication Flow

```
        ┌─────────────┐
        │  DIRECTOR   │
        └──────┬──────┘
               │ Escalations
               ▼
        ┌─────────────┐
        │ORCHESTRATOR │ ←── Heartbeat every 3s ──┐
        │ (Master     │                          │
        │  Clock)     │ ←── Stall check 2.5s ────┤
        └──────┬──────┘                          │
               │                                  │
    ┌──────────┼──────────┐                      │
    │          │          │                      │
    ▼          ▼          ▼                      │
┌────────┐ ┌────────┐ ┌────────┐                │
│BROKER-G│ │BROKER-B│ │BROKER-R│                │
│(Green) │ │(Blue)  │ │(Red)   │                │
└────┬───┘ └────┬───┘ └────┬───┘                │
     │          │          │                    │
     ▼          ▼          ▼                    │
┌─────────────────────────────────┐             │
│           AGENTS                │             │
│ AGENT-01, AGENT-02, AGENT-03... │ ◄───────────┘
│ (Must heartbeat back)           │  Recovery pings
└─────────────────────────────────┘
```

---

## 🔄 Failover Protocol

If the Orchestrator goes down:

1. **Redis detects missing heartbeat** (after 10 seconds)
2. **Standby Orchestrator activates** (if configured)
3. **All agents receive new session ID**
4. **Agent IDs are preserved** (stored in Redis)
5. **Channels continue operating**

If no standby:

- Agents continue operating with last known state
- New agents cannot be onboarded
- Stall detection stops
- Manual intervention required

---

## 🌐 Mass Scale Strategy

For internet-wide proliferation:

1. **Cloud Orchestrator** on Railway/Render/Fly.io
   - Always-on Master Clock
   - Redis-backed state
   - Exposed WebSocket endpoint

2. **Chrome Extension Federation**
   - Any browser tab becomes an agent
   - Connect to cloud Orchestrator via extension
   - Auto-onboarding within seconds

3. **API-Based Agents**
   - Any service can connect via WebSocket
   - Receives Agent ID
   - Participates in task distribution

4. **Local LLM Bridge**
   - Tauri app connects local models
   - Routes through Redis
   - Full participation in orchestration

---

## ⏱️ Timing Constants

| Constant              | Value       | Purpose                     |
| --------------------- | ----------- | --------------------------- |
| HEARTBEAT_INTERVAL    | 3,000ms     | Master clock tick rate      |
| STALL_THRESHOLD       | 5,000ms     | Time before declaring stall |
| RECOVERY_INTERVAL     | 10,000ms    | Time between recovery pings |
| ONBOARDING_TIMEOUT    | 30,000ms    | Max time for onboarding     |
| MAX_RECOVERY_ATTEMPTS | 5           | Attempts before offline     |
| CHANNEL_CLEANUP       | 3,600,000ms | Remove inactive channels    |

---

## 🎫 Message Signing Format

All agent messages MUST be signed:

```
[AGENT-XX] Your message content here
```

Examples:

```
[AGENT-01] Ready for tasks!
[AGENT-02] CLAIM: Task #1 - Database audit
[AGENT-03] COMPLETE: Task #2 - Fixed authentication bug
[AGENT-04] STATUS: Working on feature implementation
```

System messages are prefixed with `[SYSTEM]` or role identifier:

```
[ORCHESTRATOR] Recovery ping for AGENT-05
[BROKER-Green] Task assigned to AGENT-01
[DIRECTOR] Priority override: Stop all non-critical tasks
```

---

## 🧭 Agent Definition Vocabulary (Phase 8, audit 2026-06-14)

Per the agent-classification consistency review
(`docs/protocols/reports/AGENT_DEFINITION_CONSISTENCY_REVIEW_2026-06-14.md`),
TNF canonicalizes agent identity along **five orthogonal axes**:

| Axis              | Vocabulary surface                                                                          | Source of truth                                                              |
| ----------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `dacc_role`       | `director \| orchestrator \| broker \| worker \| participant`                                | DACC-v1 (this document); `AGENT_ROLE_TRAITS` in `packages/tnf-cli/src/cli.ts:2958` |
| `worker_action`   | `code_generation \| code_review \| cli_coder \| orchestrator \| ...` + `unknown`             | `AgentRole` enum (`packages/database/src/drizzle/schema/enums.ts:25-141`)    |
| `fulfillment`     | `{ vendor, model, transport, protocol_version, prompt_doc_uri, tools, endpoint, raw }`      | Agent registry bridge payload                                                |
| `traits`          | `{ observability, subAgent_capable, orchestrates_agents, persona_source, autonomy_level, ... }` | `tnf traits list`; `_buildTraitGroups`                                       |
| `platform`        | Free-form string chosen from `PLATFORM_TAXONOMY`                                            | `PLATFORM_TAXONOMY` in `packages/tnf-cli/src/cli.ts:2966`                    |

### Metadata policy (Phase 8)

`metadata` is a frequently-used but **unstructured jsonb field**. It already
appears on the `agents`, `agents_metadata`, `agent_tracking`,
`agent_sessions`, `agents_profile`, and `users` tables. To prevent the table
from becoming a junk drawer:

1. **Top-level columns beat `metadata`** when the field is read by hot-path
   queries (broker dispatch, registry lists). Example: `agents.dacc_role` is
   top-level because broker dispatch filters on it; `agents.last_seen` is
   top-level because the registry lists order by it.
2. **`agents.metadata` (jsonb)** is reserved for **vendor-specific bag
   fields** that no canonical axis covers. These fields MUST round-trip
   through `infoRecord` (in-memory) and `infoRecord.raw` (DB) without loss.
3. **Adding a top-level column** requires (a) a numbered migration,
   (b) an update to this table's "vocabulary surface" row, and
   (c) a corresponding type in the relevant Drizzle schema.
4. **`agents.traits`** (renamed from Phase 1 `agents.qualities`) is the
   canonical field for agent-feature taxonomies. New feature flags go in
   `traits`, not in `metadata`.

### Cross-references

- Audit report: `docs/protocols/reports/AGENT_CLASSIFICATION_AUDIT_2026-06-14.md`
- Consistency review: `docs/protocols/reports/AGENT_DEFINITION_CONSISTENCY_REVIEW_2026-06-14.md`
- DB migration aligning vocabulary: `packages/database/drizzle/0009_align_agent_definition_vocabulary.sql`
- Runtime trait command: `./tnf traits list [--json]`

---

## 🌐 Federated ID Encoding (Phase 9, audit 2026-06-14)

TNF carries **three distinct federated ID namespaces**, each with a different
purpose. All three are first-class columns on the `agents` table (migration
`0010`) and live in the `agents.federation` jsonb as a bundle:

| Namespace            | Column              | Format                                         | Source of truth                                                                                  | Used for                                                            |
| -------------------- | ------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `canonicalEntityId`  | `canonical_entity_id` | `TNF:[scope:]CATEGORY:PROVIDER:NAME:INSTANCE`  | `buildCanonicalEntityId()` in `packages/relay-core/src/contracts/identity.ts:38`                | Hierarchical identity, agent registry, master-clock, broker dispatch |
| `idNumber`           | `id_number`         | `ID#:<Base58>` (sequential int → Base58)        | `FederatedIdentityService` in `packages/a2a-core/src/federated-identity.service.ts:22`           | Crypto-attribution of AI Wiki entries, compounding memory, transcripts |
| `mcid`               | `federation->>'mcid'` | UUID (correlation_id, causation_id, trace_id)  | `docs/protocols/schemas/tnf-master-cumulative-id.schema.json` (`tnf/mcid/0.1`)                   | Cross-protocol lineage envelope (TWIP, handoff, relay, workflow)     |

### Encoding rules

- **`canonicalEntityId`** — built from parts `{category, provider, name, instance}`.
  `category` MUST be one of the `TnfIdentityCategory` enum values
  (`AGENT | SESSION | CHANNEL | WORKFLOW | TASK | SCHEDULE | HARNESS | MCP | LLM | USER | SYSTEM`).
  Validation: `normalizeCanonicalEntityId()` rejects anything not matching
  `TNF:[scope:]CATEGORY:PROVIDER:NAME:INSTANCE`.
- **`idNumber`** — assigned sequentially via Redis `INCR` per agent ID
  (`tnf:identity:seq:<agentId>`), encoded as Bitcoin-style Base58
  (`123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`).
  Verification is HMAC-SHA256 over `${agentId}|${idNumber}|${sha256(content)}`.
- **`mcid`** — UUID v4 assigned by the relay envelope (`trace_id`); `mcid` itself
  is the cumulative event id with `correlation_id` and `causation_id` pointers.

### Relationship to other identifiers in the repo

- `MASTER_LIBRARY_ID` / `KNOWLEDGE_TREE.json` `vector_id` (`ID#:Base58x`) is the
  **intelligence-indexer namespace** — generated by `scripts/autonomy/generate_merkle_tree.py`
  from hash bytes. Do not confuse with `idNumber` (sequential int) — they share
  the `ID#:` prefix but encode different data.
- `ID#:PROT-HANDOFF-V1-2026` etc. are **literal protocol-version handoff IDs**,
  not federated identifiers.
- `AGENT-XX` is the DACC-v1 runtime-handle format (`[AGENT-01] message [...]`),
  not a federated ID — but `agents.operationalHandle` is the canonical
  storage for it.

### Cross-references

- Audit: `docs/protocols/reports/FEDERATED_ID_ENCODING_AUDIT_2026-06-14.md`
- DB migration: `packages/database/drizzle/0010_add_federated_ids.sql`
- Protocol contract: `packages/protocol-contracts/src/identity.ts`
  (`TnfIdentityCategorySchema`)
- Canonical encoder: `packages/a2a-core/src/federated-identity.service.ts`
- Bridge: `packages/relay-core/src/agent-registry-bridge.ts` (must use
  `buildCanonicalEntityId()` to emit conformant `canonicalEntityId`)
- Transcript processor mirror: `packages/gemini-browser-skill/src/TranscriptProcessorV2.ts`
  (`generateFederatedIdNumber()` helper for V2/V3/V4)

---

## 🚀 Starting the System

```bash
# Start Master Clock (the baton holder)
cd packages/relay-core
REDIS_URL=redis://... node src/master-clock.ts

# Or with environment variables
HEARTBEAT_INTERVAL=3000 \
STALL_THRESHOLD=5000 \
REDIS_URL=redis://your-redis-url \
node src/master-clock.ts
```

**THE BUTTON IS NOW BEING HELD.**
