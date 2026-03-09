# Framework Master Graph

Canonical TNF framework mapping that unifies:

- Agents + relationships
- Frontend routes + all-pages + link audits
- Live crawl domain results
- Railway project/service topology
- Workflow backbone anchors (`AgentsReactFlow`, `NestJS`)

## Build

```bash
./tools/framework-master-graph/rebuild_framework_master_graph.sh
```

## Outputs

- `master-framework-graph.json`: full canonical graph
- `master-framework-graph.md`: master Mermaid chart + summary
- `master-framework-graph.mmd`: Mermaid source only
- `master-framework-graph.noapoc.cypher`: fixed relationship import script
- `master-framework-graph.cypher`: APOC dynamic relationship import script
- `neo4j-package/`: `nodes.csv`, `edges.csv`, load scripts, README

## Continuous Regeneration

Scheduled by `.github/workflows/framework-master-graph-monitor.yml`.
