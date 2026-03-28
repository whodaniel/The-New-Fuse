# Agent Relationship Subgraphs Index

Generated: 2026-03-26 09:23:35Z

| Domain  | Nodes | Edges | JSON                                                                                             | Mermaid                                                                                      | Cypher (no APOC)                                                                                                   | Interactive HTML                                                                                 |
| ------- | ----: | ----: | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| podcast |     9 |     7 | [agent-relationship-podcast-subgraph.json](./subgraphs/agent-relationship-podcast-subgraph.json) | [agent-relationship-podcast-subgraph.md](./subgraphs/agent-relationship-podcast-subgraph.md) | [agent-relationship-podcast-subgraph.noapoc.cypher](./subgraphs/agent-relationship-podcast-subgraph.noapoc.cypher) | [agent-relationship-podcast-subgraph.html](./subgraphs/agent-relationship-podcast-subgraph.html) |
| seo     |     9 |    13 | [agent-relationship-seo-subgraph.json](./subgraphs/agent-relationship-seo-subgraph.json)         | [agent-relationship-seo-subgraph.md](./subgraphs/agent-relationship-seo-subgraph.md)         | [agent-relationship-seo-subgraph.noapoc.cypher](./subgraphs/agent-relationship-seo-subgraph.noapoc.cypher)         | [agent-relationship-seo-subgraph.html](./subgraphs/agent-relationship-seo-subgraph.html)         |
| brand   |    10 |     8 | [agent-relationship-brand-subgraph.json](./subgraphs/agent-relationship-brand-subgraph.json)     | [agent-relationship-brand-subgraph.md](./subgraphs/agent-relationship-brand-subgraph.md)     | [agent-relationship-brand-subgraph.noapoc.cypher](./subgraphs/agent-relationship-brand-subgraph.noapoc.cypher)     | [agent-relationship-brand-subgraph.html](./subgraphs/agent-relationship-brand-subgraph.html)     |
| funnel  |     8 |     6 | [agent-relationship-funnel-subgraph.json](./subgraphs/agent-relationship-funnel-subgraph.json)   | [agent-relationship-funnel-subgraph.md](./subgraphs/agent-relationship-funnel-subgraph.md)   | [agent-relationship-funnel-subgraph.noapoc.cypher](./subgraphs/agent-relationship-funnel-subgraph.noapoc.cypher)   | [agent-relationship-funnel-subgraph.html](./subgraphs/agent-relationship-funnel-subgraph.html)   |
| social  |     8 |     2 | [agent-relationship-social-subgraph.json](./subgraphs/agent-relationship-social-subgraph.json)   | [agent-relationship-social-subgraph.md](./subgraphs/agent-relationship-social-subgraph.md)   | [agent-relationship-social-subgraph.noapoc.cypher](./subgraphs/agent-relationship-social-subgraph.noapoc.cypher)   | [agent-relationship-social-subgraph.html](./subgraphs/agent-relationship-social-subgraph.html)   |
| ops     |    11 |     5 | [agent-relationship-ops-subgraph.json](./subgraphs/agent-relationship-ops-subgraph.json)         | [agent-relationship-ops-subgraph.md](./subgraphs/agent-relationship-ops-subgraph.md)         | [agent-relationship-ops-subgraph.noapoc.cypher](./subgraphs/agent-relationship-ops-subgraph.noapoc.cypher)         | [agent-relationship-ops-subgraph.html](./subgraphs/agent-relationship-ops-subgraph.html)         |
| content |     9 |    10 | [agent-relationship-content-subgraph.json](./subgraphs/agent-relationship-content-subgraph.json) | [agent-relationship-content-subgraph.md](./subgraphs/agent-relationship-content-subgraph.md) | [agent-relationship-content-subgraph.noapoc.cypher](./subgraphs/agent-relationship-content-subgraph.noapoc.cypher) | [agent-relationship-content-subgraph.html](./subgraphs/agent-relationship-content-subgraph.html) |

## Quick Preview

Run a local static server from `/path/to`:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/agent-relationship-subgraphs-index.md` and any
HTML file directly.

## Analysis Artifacts

- [agent-relationship-subgraph-hubs.md](./reports/agent-relationship-subgraph-hubs.md)
- [generate_agent_subgraphs.sh](./generate_agent_subgraphs.sh)

## Advanced Analytics

- [agent-relationship-centrality-report.md](./reports/agent-relationship-centrality-report.md)
- [agent-relationship-centrality-report.json](./reports/agent-relationship-centrality-report.json)
- [build_agent_graph_analytics.py](./build_agent_graph_analytics.py)

## Neo4j Package

- [neo4j-package/README.md](./neo4j-package/README.md)
- [neo4j-package/load.noapoc.cypher](./neo4j-package/load.noapoc.cypher)
- [neo4j-package/load.apoc.cypher](./neo4j-package/load.apoc.cypher)
- [build_agent_neo4j_package.py](./build_agent_neo4j_package.py)

## Temporal Tracking

- [snapshots/latest-snapshot.json](./snapshots/latest-snapshot.json)
- [snapshots/latest-delta.json](./snapshots/latest-delta.json)
- [snapshots/latest-delta.md](./snapshots/latest-delta.md)
- [build_agent_temporal_diffs.py](./build_agent_temporal_diffs.py)

## One-Command Pipeline

- [rebuild_agent_relationship_artifacts.sh](./rebuild_agent_relationship_artifacts.sh)
- [Makefile](./Makefile)

## Alerting

- [snapshots/latest-alert.json](./snapshots/latest-alert.json)
- [snapshots/latest-alert.md](./snapshots/latest-alert.md)
- [check_agent_graph_delta_alerts.py](./check_agent_graph_delta_alerts.py)

## Scheduling

- [setup_graph_snapshot_cron.sh](./setup_graph_snapshot_cron.sh)
- [setup_graph_snapshot_launchd.sh](./setup_graph_snapshot_launchd.sh)

Examples:

```bash
# hourly via cron
./setup_graph_snapshot_cron.sh install "0 * * * *"

# hourly via launchd
./setup_graph_snapshot_launchd.sh install 3600
```
