# Agent Network Scope

Generated: 2026-03-26 Repository:
`/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse`

## Executive Summary

The TNF agent network has a large inventory footprint with high duplication and
taxonomy entropy, but now has materially improved orchestration visibility.

- Registry baseline: `178` unique agents, `290` variants, `111` collision
  groups.
- Typed relationship graph (expanded this run): `120` nodes, `401` edges,
  `67.42%` registry coverage.
- Prior graph baseline (2026-03-26T05:02:45Z snapshot): `49` nodes, `43` edges.
- Expanded graph centrality still concentrates around `task-agent-router` and
  `orchestrator-agent`.

## Scope Inventory

### Definition Surfaces

- Codex skills root: `67` skill directories in
  `/Users/<owner>/.codex/skills`.
- Imported Claude-agent skills: `113` in
  `/Users/<owner>/.codex/skills/imported-claude-agents`.
- Claude agent markdown files: `111` in `/Users/<owner>/.claude/agents`.
- TNF discovered agent files: `292` raw definitions, `180` unique names in
  `apps/frontend/public/visualizations/data/dashboard-metrics.json`.

### Registry Scope (Canonical TNF Snapshot)

Source: `data/agent-registry/registry_summary.json`

- Agents: `178`
- Variants: `290`
- Capabilities: `1377`
- Relationships: `532`
- Tags: `1803`
- Collisions: `111`
- Parse errors: `0`
- By source:
  - `tnf_agents_md`: `166`
  - `claude_agents_md`: `114`
  - `tnf_ai_agents_json`: `5`
  - `legacy_agents_json`: `5`

## Relationship Topology Scope

### Core Orchestration Graph (Current)

Source: `tools/agent-relationship-graph/agent-relationship-graph.json`

- Nodes: `120`
- Edges: `401`
- Coverage vs registry: `67.42%`
- Registry agents not yet mapped into full graph: `59`
- Cluster distribution:
  - funnel: `22`
  - orchestration: `17`
  - podcast: `17`
  - brand: `17`
  - social: `15`
  - content: `14`
  - ops: `11`
  - seo: `7`

### Typed Edge Distribution

- `depends_on`: `155`
- `fallback`: `137`
- `delegates`: `53`
- `feeds`: `24`
- Other typed edges (handoff/governs/orchestrates/etc): `32`

### Connectivity and Concentration

Source:
`tools/agent-relationship-graph/reports/agent-relationship-centrality-report.json`

- Communities: `3`
- Singleton communities: `0`
- Top degree hubs:
  - `task-agent-router` (`25`)
  - `orchestrator-agent` (`19`)
  - `seo-optimizer-agent` (`13`)

### Delta + Alert State

Sources:

- `tools/agent-relationship-graph/snapshots/latest-delta.md`
- `tools/agent-relationship-graph/snapshots/latest-alert.md`

Latest run status is `ALERT` due intentional structural expansion between
snapshots:

- Full graph: `49 -> 120` nodes, `43 -> 401` edges.
- Aggregate change: `+141` nodes, `+536` edges across full + domain subgraphs.
- This alert is expected for the expansion event and should be re-baselined
  after governance sign-off.

## Governance Checkpoints

### Checkpoint 1: Canonical Source of Truth

- Current risk: `111` collision groups from mirrored definitions
  (`.agent/agents` vs `.claude/agents`).
- Control: enforce a canonical source policy at import (primary + mirrored
  secondary markers).
- Exit criterion: collision groups reduced to only intentional mirrors or alias
  records.

### Checkpoint 2: Taxonomy Hygiene

- Current risk: `1119` distinct unknown tags (`1385` occurrences).
- Control: introduce tag normalization map (tool aliases, capability classes,
  naming conventions).
- Exit criterion: unknown-tag volume reduced below agreed threshold (see Phase 1
  plan).

### Checkpoint 3: Relationship Semantics

- Current risk: registry relationships are still `similar`-only (`532/532`),
  while graph is typed by heuristics.
- Control: extend registry relationship schema to include authoritative typed
  edges.
- Exit criterion: typed relationship coverage in registry > 60% of active edges.

### Checkpoint 4: Orchestration Concentration

- Current risk: centrality concentration on `task-agent-router` and
  `orchestrator-agent`.
- Control: add domain fallback delegates and load-shed routes per cluster.
- Exit criterion: non-core hubs carry measurable betweenness share without
  reliability loss.

### Checkpoint 5: Temporal Guardrails

- Current risk: delta thresholds tuned for small diffs, causing alert floods
  during planned migrations.
- Control: dual-mode alerting (`change window` vs `steady-state`).
- Exit criterion: migration windows are informational; steady-state alerting
  remains strict.

## Implemented in This Run (Option 2)

### Pipeline and Builder Changes

- Added registry-driven graph builder:
  - `tools/agent-relationship-graph/build_agent_relationship_graph.py`
- Wired builder into rebuild pipeline:
  - `tools/agent-relationship-graph/rebuild_agent_relationship_artifacts.sh`
- Added Make target:
  - `tools/agent-relationship-graph/Makefile` (`graph`)
- Updated graph tooling docs:
  - `tools/agent-relationship-graph/README.md`

### Generated Artifacts Refreshed

- Base graph + cypher:
  - `tools/agent-relationship-graph/agent-relationship-graph.json`
  - `tools/agent-relationship-graph/agent-relationship-graph.md`
  - `tools/agent-relationship-graph/agent-relationship-graph.cypher`
  - `tools/agent-relationship-graph/agent-relationship-graph.noapoc.cypher`
- Subgraphs, reports, snapshots, Neo4j package, and published frontend graph
  artifacts refreshed by `pnpm graph:all`.

## Immediate Decision Points

1. Approve this 120-node typed graph as the new baseline and reset temporal
   thresholds for one migration window.
2. Keep the graph at 120 nodes for operational focus, or push to 150 after
   taxonomy normalization.
3. Choose canonical registry source policy (`.agent/agents` primary vs another
   source) before collision cleanup automation.
