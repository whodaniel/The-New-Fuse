# Task Plan: The New Fuse - Functional Overhaul & Backend Integration

## Objective

Fully redo the functional part of The New Fuse frontend to expose all backend
capabilities, replacing "fluff" and placeholders with real, data-driven
features. Ensure every backend module (A2A, MCP, Relay, Workflow Engine, etc.)
has a high-fidelity, functional UI/UX.

## Critical Backend Modules to Expose

1.  **Agent-to-Agent (A2A) Orchestration**: Real-time monitoring and control of
    inter-agent protocols.
2.  **Model Context Protocol (MCP)**: Full tool management, server bridging, and
    service discovery.
3.  **Relay Core**: Visualization and monitoring of the message relay
    architecture.
4.  **Workflow Engine**: Execution, monitoring, and debugging of multi-step AI
    pipelines.
5.  **Knowledge & Vectors**: Management of embedding indices, semantic memory,
    and document ingestion.
6.  **Blockchain/Crypto**: Real integration with agent contracts and revenue
    routers.
7.  **Port & Infrastructure**: Real-time system monitoring and port management.
8.  **Unified Control Center**: Replacing placeholder dashboards with real
    metrics from `core-monitoring`.

## Phases

### Phase 1: Deep Audit & Infrastructure (CURRENT)

- [ ] Map every backend package to its corresponding (or missing) frontend view.
- [ ] Audit `packages/api` to document all available endpoints.
- [ ] Verify `api-client` and `hooks/useApi` have coverage for all functional
      areas.
- [ ] Identify and list every `LazyPage` and "fluff" component.

### Phase 2: Core Functional Redesign

- [ ] **Infrastructure Dashboard**: Rebuild Port Management and System Health
      with real backend feeds.
- [ ] **A2A & Relay Mission Control**: New views to visualize the message bus
      and agent coordination.
- [ ] **MCP Manager**: Replace the marketplace shell with a tool for managing
      active MCP servers.
- [ ] **Knowledge Studio**: Real implementation of vector DB management and
      semantic search testing.

### Phase 3: Workflow & Agent Deep-Link

- [ ] **Active Workflow Engine**: Connect the Builder to the actual
      `workflow-engine` for execution tracking.
- [ ] **Agent Revenue Center**: Real data binding for agent revenue shares and
      crypto contracts.
- [ ] **Autonomous Onboarding**: Full implementation of the AI-Agent
      self-registration flow.

### Phase 4: UX/UI Polish & Performance

- [ ] Ensure "Premium" aesthetics across all new functional views.
- [ ] Optimize state management for high-frequency real-time data (WebSocket
      integration).
- [ ] Final audit against "ULTIMATE_UX_DESIGNER_BRIEF".

## Findings (To be updated)

- `ComprehensiveRouter.tsx` relies heavily on `LazyPage` stubs.
- `AgencyDashboard.tsx` is currently using mock data primarily.
- `a2a-core` and `relay-core` are highly sophisticated but lack deep frontend
  instrumentation.
