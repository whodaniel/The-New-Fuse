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

**Identity:** `master-clock.ts` daemon running in cloud **Quantity:** 1 primary,
1 standby **Responsibilities:**

- Run CONTINUOUSLY (never stops)
- Send heartbeats (every 3 seconds)
- Detect stalls (within 5 seconds)
- Assign Agent IDs (AGENT-XX format)
- Onboard new AI instances immediately
- Route messages between channels
- Trigger recovery for stalled agents
- Log EVERYTHING
- Propagate state to Redis

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

## 📊 Monitoring

The Orchestrator exposes the following metrics:

- `heartbeatsSent` - Total heartbeats sent
- `stallsDetected` - Stalls detected
- `recoveryAttempts` - Recovery attempts made
- `messagesProcessed` - Messages processed
- `agentsOnboarded` - Agents onboarded
- `activeAgents` - Currently active agents
- `offlineAgents` - Offline agents
- `channelActivity` - Per-channel message counts

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
