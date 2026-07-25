# Agent Relationship Graph

Generated: 2026-07-25 Updated: taxonomy alignment (role ⊥ platform)

## Taxonomy

{ "note": "Cluster labels are work-domain affinity, NOT DACC baton seats. Role
and platform are orthogonal axes.", "axes": { "baton_identity":
"ORCHESTRATOR-{timestamp} from master-clock only", "daccRole": [ "director",
"orchestrator", "broker", "worker", "participant", "coordinator", "bridge" ],
"workerAction_capabilities": "What work an agent can perform (may include
orchestration without holding the baton)", "platform": [ "antigravity",
"claude", "gemini", "jules", "pi", "vscode", "browser", "tnf-runtime",
"master-clock" ] }, "anti_patterns": [ "Do not treat cluster=orchestration as
master-clock baton ownership", "Do not treat platform ids (e.g. gemini,
antigravity) as hierarchy seats", "orchestrator-agent node is a skill/persona
primary, not ORCHESTRATOR-{ts}" ], "canonical_viz":
"/visualizations/graphs/dacc-role-platform-axes.html" }

- **Baton**: `master-clock-baton` / `ORCHESTRATOR-{timestamp}` only
- **Cluster labels** (e.g. `orchestration`) are work-domain affinity, not DACC
  seats
- Canonical viz: `/visualizations/graphs/dacc-role-platform-axes.html`

## Snapshot

- Nodes: 122
- Edges: 440

### Cluster Distribution

- funnel: 22
- orchestration: 17
- podcast: 17
- brand: 17
- social: 15
- content: 14
- ops: 11
- seo: 7
- runtime-infra: 1
- fulfillment: 1

### Relationship Type Distribution

- fallback: 172
- depends_on: 155
- delegates: 54
- feeds: 24
- routes_to: 10
- handoff: 5
- governs: 5
- measured_by: 3
- orchestrates: 2
- indexes_for: 1
- analyzes: 1
- enriches: 1
- supplies: 1
- overlaps_with: 1
- gates: 1
- requires: 1
- enables: 1
- validated_by: 1
- feedback: 1

## Neo4j

See `neo4j-package/README.md` for axis-aware CSV columns and load scripts.
