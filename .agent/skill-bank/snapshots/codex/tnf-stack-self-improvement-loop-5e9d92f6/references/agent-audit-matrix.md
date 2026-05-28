# Agent Audit Matrix

## Objective
Coordinate specialist agents for continuous TNF quality and reliability.

## Mapping

- `frontend-debugger-agent`
  - Scope: navigation/render/runtime failures
  - Inputs: route audit + browser traces
  - Outputs: concrete frontend defect list with file refs

- `codebase-pathway-tracer`
  - Scope: route-to-handler-to-storage pathways
  - Inputs: router files, Nest controllers, workflow handlers
  - Outputs: pathway inventory for graph tools

- `graph-writer`
  - Scope: architecture visualization
  - Inputs: pathway inventory
  - Outputs: Mermaid/graph exports for docs

- `agent-relationship-grapher`
  - Scope: agent ecosystem relationships
  - Inputs: agent registry and orchestration artifacts
  - Outputs: relationship maps and drift flags

- `tnf-task-production-pipeline`
  - Scope: execution lifecycle reliability
  - Inputs: task API, worker logs, timeline mirroring
  - Outputs: production readiness checks and stuck-task alerts

- `tnf-execution-audit-trail`
  - Scope: execution observability
  - Inputs: execution events and task detail logs
  - Outputs: shareable timeline evidence and missing-log detection
