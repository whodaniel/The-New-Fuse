# TNF Framework Evolution Audit

## Executive Summary

The current TNF framework provides a functional foundation for agent orchestration and delegation but exhibits significant risks in reliability, type safety, and observability for a production-grade distributed system. The orchestration engine relies on in-memory state and naive polling, creating single points of failure. Delegation protocols lack strict schema validation, introducing runtime fragility. Observability is fragmented, hindering effective debugging. CI gates exist but key components (like `agent-coordination`) bypass them.

This audit proposes high-impact changes to transition the framework from a "prototype-grade" to "production-grade" architecture, focusing on resilience, strict contracts, and deep visibility.

---

## 1. Orchestration Reliability

### Current State
- **In-Memory Queue**: The `UnifiedWorkflowEngine` uses an in-memory array (`executionQueue`) and Map (`activeExecutions`) to manage state. If the process restarts, all queued and running executions are lost from memory, requiring manual intervention or database queries to recover.
- **Naive Polling**: Agent task completion is monitored via `setInterval` polling (every 5s) in `executeAgentTask`. This is inefficient and introduces latency.
- **Limited Error Handling**: Basic try/catch blocks set status to `FAILED`. No built-in exponential backoff or dead letter queue (DLQ) for transient failures.

### Proposed Changes
1.  **Replace In-Memory Queue with BullMQ**:
    -   Migrate `executionQueue` to a persistent Redis-backed queue using `BullMQ`.
    -   Leverage BullMQ's built-in features: persistence, delayed jobs (backoff), concurrency control, and job prioritization.
2.  **Event-Driven Architecture**:
    -   Replace polling with an event-driven model. Agents should publish `TASK_COMPLETED` events to a `Relay` topic or Redis channel that the Orchestrator subscribes to.
3.  **Recovery Service**:
    -   Implement a startup routine that scans the database for `PENDING` or `RUNNING` workflows that are not present in the Redis queue and re-enqueues them.

### KPIs
-   **Recovery Rate**: 100% of interrupted workflows are automatically resumed within 1 minute of service restart.
-   **Task Latency**: Reduce time-to-detect task completion from <5s (polling interval) to <100ms (event-driven).
-   **Uptime**: 99.9% availability for workflow execution service.

---

## 2. Delegation Protocols

### Current State
-   **Loose Typing**: `RelayMessage` defines a generic structure, but the `payload` is typed as `any`. Protocol adapters (`ProtocolAdapter`) rely on runtime checks without strict schema validation at the boundary.
-   **Security Risk**: Agents can inject arbitrary payloads that may cause runtime errors or be exploited if processed blindly.

### Proposed Changes
1.  **Strict Zod Schemas**:
    -   Define rigorous Zod schemas for **every** message type supported by `RelayCore` (e.g., `AgentTask`, `AgentHandoff`, `SystemStatus`).
    -   Enforce validation at the entry and exit points of the Relay. Reject invalid messages immediately with a descriptive error.
2.  **Contract Testing**:
    -   Implement contract tests (e.g., using Pact or a custom schema validator) between the Orchestrator and Agents to ensure they adhere to the protocol.
3.  **Typed SDK**:
    -   Generate a type-safe SDK for agents to use, ensuring they construct valid messages at compile time.

### KPIs
-   **Schema Validation Failure Rate**: <1% of messages rejected due to schema violations in production.
-   **Type Safety Coverage**: 100% of defined protocol message types have corresponding Zod schemas and TypeScript interfaces.

---

## 3. Observability

### Current State
-   **Fragmented Metrics**: `UnifiedWorkflowEngine` maintains internal counters (`metrics` object) that are lost on restart. `apps/backend` uses Prometheus, but the two are not integrated.
-   **No Distributed Tracing**: There is no standard mechanism (like OpenTelemetry) to trace a request as it flows from API -> Orchestrator -> Relay -> Agent -> Database.

### Proposed Changes
1.  **OpenTelemetry Integration**:
    -   Instrument `UnifiedWorkflowEngine`, `RelayCore`, and `Agent` components with OpenTelemetry SDKs.
    -   Create Spans for: `WorkflowExecution`, `NodeExecution`, `AgentTask`, `RelayMessage`.
    -   Propagate Trace Context (Trace ID, Span ID) across boundaries (HTTP headers, Relay metadata).
2.  **Unified Metrics Export**:
    -   Expose workflow metrics (e.g., `workflow_execution_duration_seconds`, `active_workflows`, `failed_workflows`) via the existing Prometheus endpoint in `apps/backend`.
3.  **Grafana Dashboard**:
    -   Create a standard Grafana dashboard definition to visualize these metrics (Latency, Throughput, Error Rate, Saturation).

### KPIs
-   **Trace Coverage**: 100% of workflow executions generate a complete trace spanning all participating services.
-   **Metric Freshness**: Metrics are available for scraping within 15 seconds of an event.
-   **Mean Time To Detect (MTTD)**: <5 minutes for workflow anomalies (based on alert rules).

---

## 4. CI Quality Gates

### Current State
-   **Tests Disabled**: `packages/agent-coordination` has tests explicitly disabled in `package.json`. Core logic is unverified.
-   **Good Foundation**: The `quality.yml` workflow is comprehensive (Coverage, Sonar, Lighthouse), but implementation gaps exist in individual packages.

### Proposed Changes
1.  **Enable & Expand Tests**:
    -   Enable tests for `packages/agent-coordination`.
    -   Mandate unit tests for all new Orchestration logic.
2.  **Mutation Testing**:
    -   Introduce Stryker or similar mutation testing tool for critical paths (e.g., `UnifiedWorkflowEngine` logic) to ensure tests are not just covering lines but asserting behavior.
3.  **Architecture Tests**:
    -   Add dependency rules (e.g., with `dependency-cruiser` or `eslint-plugin-import`) to prevent circular dependencies and enforce strict layering (e.g., Domain layer cannot import Infrastructure layer).

### KPIs
-   **Test Coverage**: Maintain >80% code coverage for `packages/workflow-engine` and `packages/agent-coordination`.
-   **Mutation Score**: Achieve >70% mutation score for core orchestration logic.
-   **Build Stability**: 95% of master builds pass on the first run.
