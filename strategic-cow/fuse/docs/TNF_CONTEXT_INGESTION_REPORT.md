# TNF Context Ingestion Report

**Generated**: 2025-12-18 **Status**: In Progress

## 📊 Ingestion Statistics

| Category            | Total Available | Currently Ingested | Coverage % |
| ------------------- | --------------- | ------------------ | ---------- |
| **Total Doc Files** | **1,177**       | **~25**            | **2.1%**   |
| Root Docs (`/docs`) | ~150            | 9                  | 6.0%       |
| Package READMEs     | ~67             | 7                  | 10.4%      |
| App READMEs         | ~12             | 4                  | 33%        |

> **Critical Note**: As of generation, the AI Assistant contains < 0.1% of the
> project context. Decisions made without increasing this coverage may be based
> on hallucinations or incomplete assumptions.

> **Update (03:25)**: Completed Deep Dive into **Protocols & Coordination**.
> Ingested `AGENT_COMMUNICATION_GUIDE` and source code for `relay-core` and
> `agent-coordination`. Verified "Legacy" vs "Core" coordinator split.
> Identified **Critical Mismatch**: Docs claim `scripts/tnf-agent-relay` exists,
> but it is missing from the file system. **Verification (03:30)**: Confirmed
> `scripts/tnf-agent-relay` and `apps/electron-desktop/extensions` are
> definitively MISSING. Valid code found in `packages/relay-core`.
> `apps/relay-server` is a stub.

---

## 🛑 Missing Critical Context (Prioritized for Immediate Ingestion)

The following files have been identified as **High Priority** for immediate
reading to establish baseline architectural competence:

### 1. System Architecture (ROOT)

- [ ] `docs/ARCHITECTURE.md`
- [ ] `docs/TNF_AGENT_THREE_PILLARS.md`
- [ ] `docs/TNF_AGENTIC_INFRASTRUCTURE_VISION.md`
- [ ] `docs/MASTER_ORCHESTRATOR_COORDINATION_PROTOCOLS.md`

### 2. Core Protocols

- [ ] `docs/AGENT_COMMUNICATION_GUIDE.md`
- [ ] `packages/a2a-core/README.md`
- [ ] `packages/mcp-core/README.md` (or docs structure)
- [ ] `packages/relay-core/README.md`

### 3. Application State

- [ ] `apps/frontend/README.md`
- [ ] `apps/backend/README.md`
- [ ] `apps/tauri-desktop/README.md`
- [ ] `apps/chrome-extension/README.md`

---

## 📝 Ingestion Log

| Timestamp | File Path                                                | Type     | Key Insights Grabbed                                                          |
| --------- | -------------------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| Initial   | `docs/TNF_CODEBASE_ANALYSIS.md`                          | Audit    | Topology: 67 pkgs, 12 apps.                                                   |
| 20:51     | `docs/TNF_AGENT_THREE_PILLARS.md`                        | Arch     | Orchestrator (Redis/BullMQ), Heartbeat (30s), A2A Broker.                     |
| 20:51     | `docs/TNF_AGENTIC_INFRASTRUCTURE_VISION.md`              | Vision   | "Living System" concept. Self-improvement loops.                              |
| 20:51     | `docs/MASTER_ORCHESTRATOR_COORDINATION_PROTOCOLS.md`     | Ops      | **Jules Coordination** is critical. Branch naming: `jules/`.                  |
| 20:52     | `packages/a2a-core/README.md`                            | Code     | A2A Protocol v0.3.0. JSON-RPC transport. Zod schemas.                         |
| 20:52     | `packages/agent-coordination/README.md`                  | Code     | Redis Pub/Sub channels (`agent-tasks`, `agent-broadast`).                     |
| 20:53     | `docs/AGENT-COMMUNICATION-GUIDE.md`                      | Redirect | Pointed to new location in `agents-and-protocols`.                            |
| 21:00     | `apps/frontend/README.md`                                | App      | Standard atomic design. `tauri-desktop` README is a clone.                    |
| 21:00     | `apps/chrome-extension/README.md`                        | App      | **Bridge** concept: Injecting into Gemini/ChatGPT DOM.                        |
| 21:00     | `apps/api/src/README.md`                                 | App      | Backend/API split structure.                                                  |
| 21:02     | `packages/mcp-core/docs/BEST_PRACTICES.md`               | Code     | Standard Enterprise patterns (Circuit Breaker, Pooling).                      |
| 21:02     | `packages/workflow-engine/README.md`                     | Code     | **Web3 Support** discovered. "Smart Accounts".                                |
| 21:04     | `docs/API_USAGE_GUIDE.md`                                | Guide    | `/wallets` and `/smart-accounts` endpoints confirmed.                         |
| 03:23     | `docs/agents-and-protocols/AGENT_COMMUNICATION_GUIDE.md` | Guide    | **A2A Bible**. Defines `BaseMessage`, Swarm Orchestration, and MCP Transport. |
| 03:23     | `packages/agent-coordination/src/index.ts`               | Code     | Confirmed split between `redis-coordinator` (Legacy) and `core` components.   |
| 03:23     | `packages/relay-core/src/index.ts`                       | Code     | TypeScript implementation of Relay Server.                                    |
| 03:25     | `scripts/` (Directory Listing)                           | Audit    | **MISSING**: `tnf-agent-relay` folder referenced in docs is NOT present.      |
