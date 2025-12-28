# TNF Codebase Audit - Agentic Architecture (2025 Refactor Analysis)

**Date**: 2025-12-28 **Scope**: Comprehensive analysis of orchestration, Redis
usage, Cron/Scheduling, and agent management systems to inform the integration
of the new "Big Brother" architecture.

## 1. Executive Summary

The codebase contains a sophisticated, high-density infrastructure with
significant overlap in orchestration and messaging capabilities.

**Key Findings:**

1.  **Dual Task Systems**: We have a heavy reliance on **Bull/NestJS Queues**
    (`apps/backend`) for system tasks, alongside the new **TNF Router** for
    agentic tasks.
2.  **Dual Orchestration**: The `orchestrator.module` (NestJS) exposes HTTP
    endpoints, while the new architecture uses Redis Pub/Sub (`tnf:bus`).
3.  **Rich Scheduling**: Strong usage of `@nestjs/schedule` and `cron` for
    business logic, distinct from the `HeartbeatMonitoringService` in Relay.
4.  **Fragmented Identity**: `MasterAgentRegistry` (Prisma/SQL) vs
    `RedisAgentRegistry` (Runtime).

## 2. Component Analysis

### A. Orchestration & Routing

| Component                | Location                                    | Role                                | Architecture Status      |
| ------------------------ | ------------------------------------------- | ----------------------------------- | ------------------------ |
| **TNF Router**           | `packages/workflow-engine/src/orchestrator` | High-speed Agent Traffic Controller | **New Core (Fast Path)** |
| **Backend Orchestrator** | `apps/backend/src/modules/orchestrator`     | API-driven Service Orchestration    | **Legacy/Stable**        |
| **Director Service**     | `src/services/DirectorService.ts`           | Specialized Agent Direction         | **Legacy**               |
| **Doc Orchestrator**     | `src/services/DocumentationOrchestrator.ts` | Domain-specific Logic               | **Legacy**               |

**Consolidation Strategy:** The **TNF Router** becomes the "Big Brother".
Existing orchestrators (`backend`, `director`) should be refactored to
**subscribe** to the `tnf:bus` rather than acting as standalone HTTP servers for
agents. They become "Super Agents" on the bus.

### B. Task Delegation & Queues

**Existing:**

- **Bull (Redis Queues)**: Found in `apps/backend/package.json`. Used for
  durable, asynchronous system jobs (e.g., "Process Upload", "Send Email").
- **NestJS Schedule**: Used for Cron jobs.

**New:**

- **TNF Envelopes (Task Type)**: Real-time, interactive agent instructions.

**Recommendation:**

- Use **Bull** for _System Tasks_ (Headless, long-running).
- Use **TNF Router** for _Agent Tasks_ (Interactive, conversational, requires
  LLM).

### C. Agent Registry

| Registry                | Backing           | Purpose                               |
| ----------------------- | ----------------- | ------------------------------------- |
| **MasterAgentRegistry** | Prisma (Postgres) | Compliance, NFTs, History, Governance |
| **RedisAgentRegistry**  | Redis Hash        | Real-time Routing, Presence, TTL      |

**Integration Plan:**

- **Sync**: `MasterAgentRegistry` writes to DB _and_ publishes "Agent Approved"
  events to the Bus.
- **Cache**: `RedisAgentRegistry` listens to approval events to warm the cache.

### D. Handoffs

- **Handoff Flywheel**: `packages/sync-core/src/handoff` contains sophisticated
  logic (`PromptHandoffFlywheel`).
- **Refactor**: Wrap the "Flywheel" logic into a generic **Workflow Step** that
  can be triggered by the `tnf-router`.

## 3. "Big Brother" Implementation Plan

To enable the "Big Brother" system (Broker Delegation over Redis):

1.  **The Bridge**: `RedisRelayBridge` (Done) connects the WebSocket world
    (Frontend/Extension) to the Redis world (Backend/Orchestrator).
2.  **The Brain**: The `tnf-router` listens to _everything_.
3.  **The Refactor**:
    - Modify `apps/backend` to mount the `RedisRelayBridge`.
    - Expose `bull` queues as "Tools" to the Agent Network via the Router.
    - Deprecate direct HTTP calls between agents; force everything through the
      `tnf:bus`.

## 4. Key Term Usage Count

| Term              | Occurrences     | Context                                                    |
| ----------------- | --------------- | ---------------------------------------------------------- |
| **Redis**         | >800            | Critical dependency. Used for Bull, Cache, Pub/Sub, Store. |
| **Bull/Queue**    | High in Backend | Heavy job processing system.                               |
| **Cron/Schedule** | High in Backend | `@nestjs/schedule` is standard.                            |
| **Orchestrator**  | ~20 files       | Fragmented.                                                |
| **Handoff**       | ~15 files       | `sync-core` owns this.                                     |

## 5. Next Steps

1.  **Unify Redis Config**: Create a shared `RedisConfig` package to prevent
    connection pool exhaustion from `bull`, `ioredis`, and `connect-redis`
    clients all running separately.
2.  **Bridge the Backend**: Import `RedisRelayBridge` into `apps/backend` so it
    can talk to the Extension effortlessly.
