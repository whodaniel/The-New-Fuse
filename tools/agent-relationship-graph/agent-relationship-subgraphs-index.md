# Agent Relationship Subgraphs Index

Generated: 2026-03-03 10:22:51Z

| Domain | Nodes | Edges | JSON | Mermaid | Cypher (no APOC) | Interactive HTML |
|---|---:|---:|---|---|---|---|
| podcast | 9 | 7 | [agent-relationship-podcast-subgraph.json](./agent-relationship-podcast-subgraph.json) | [agent-relationship-podcast-subgraph.md](./agent-relationship-podcast-subgraph.md) | [agent-relationship-podcast-subgraph.noapoc.cypher](./agent-relationship-podcast-subgraph.noapoc.cypher) | [agent-relationship-podcast-subgraph.html](./agent-relationship-podcast-subgraph.html) |
| seo | 9 | 13 | [agent-relationship-seo-subgraph.json](./agent-relationship-seo-subgraph.json) | [agent-relationship-seo-subgraph.md](./agent-relationship-seo-subgraph.md) | [agent-relationship-seo-subgraph.noapoc.cypher](./agent-relationship-seo-subgraph.noapoc.cypher) | [agent-relationship-seo-subgraph.html](./agent-relationship-seo-subgraph.html) |
| brand | 10 | 8 | [agent-relationship-brand-subgraph.json](./agent-relationship-brand-subgraph.json) | [agent-relationship-brand-subgraph.md](./agent-relationship-brand-subgraph.md) | [agent-relationship-brand-subgraph.noapoc.cypher](./agent-relationship-brand-subgraph.noapoc.cypher) | [agent-relationship-brand-subgraph.html](./agent-relationship-brand-subgraph.html) |
| funnel | 8 | 6 | [agent-relationship-funnel-subgraph.json](./agent-relationship-funnel-subgraph.json) | [agent-relationship-funnel-subgraph.md](./agent-relationship-funnel-subgraph.md) | [agent-relationship-funnel-subgraph.noapoc.cypher](./agent-relationship-funnel-subgraph.noapoc.cypher) | [agent-relationship-funnel-subgraph.html](./agent-relationship-funnel-subgraph.html) |
| social | 8 | 2 | [agent-relationship-social-subgraph.json](./agent-relationship-social-subgraph.json) | [agent-relationship-social-subgraph.md](./agent-relationship-social-subgraph.md) | [agent-relationship-social-subgraph.noapoc.cypher](./agent-relationship-social-subgraph.noapoc.cypher) | [agent-relationship-social-subgraph.html](./agent-relationship-social-subgraph.html) |
| ops | 11 | 5 | [agent-relationship-ops-subgraph.json](./agent-relationship-ops-subgraph.json) | [agent-relationship-ops-subgraph.md](./agent-relationship-ops-subgraph.md) | [agent-relationship-ops-subgraph.noapoc.cypher](./agent-relationship-ops-subgraph.noapoc.cypher) | [agent-relationship-ops-subgraph.html](./agent-relationship-ops-subgraph.html) |
| content | 9 | 10 | [agent-relationship-content-subgraph.json](./agent-relationship-content-subgraph.json) | [agent-relationship-content-subgraph.md](./agent-relationship-content-subgraph.md) | [agent-relationship-content-subgraph.noapoc.cypher](./agent-relationship-content-subgraph.noapoc.cypher) | [agent-relationship-content-subgraph.html](./agent-relationship-content-subgraph.html) |

## Quick Preview

Run a local static server from `/path/to`:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/agent-relationship-subgraphs-index.md` and any HTML file directly.

## Analysis Artifacts

- [agent-relationship-subgraph-hubs.md](./agent-relationship-subgraph-hubs.md)
- [generate_agent_subgraphs.sh](./generate_agent_subgraphs.sh)

## Advanced Analytics

- [agent-relationship-centrality-report.md](./agent-relationship-centrality-report.md)
- [agent-relationship-centrality-report.json](./agent-relationship-centrality-report.json)
- [build_agent_graph_analytics.py](./build_agent_graph_analytics.py)

## Neo4j Package

- [agent-relationship-neo4j-package/README.md](./agent-relationship-neo4j-package/README.md)
- [agent-relationship-neo4j-package/load.noapoc.cypher](./agent-relationship-neo4j-package/load.noapoc.cypher)
- [agent-relationship-neo4j-package/load.apoc.cypher](./agent-relationship-neo4j-package/load.apoc.cypher)
- [build_agent_neo4j_package.py](./build_agent_neo4j_package.py)

## Temporal Tracking

- [agent-relationship-snapshots/latest-snapshot.json](./agent-relationship-snapshots/latest-snapshot.json)
- [agent-relationship-snapshots/latest-delta.json](./agent-relationship-snapshots/latest-delta.json)
- [agent-relationship-snapshots/latest-delta.md](./agent-relationship-snapshots/latest-delta.md)
- [build_agent_temporal_diffs.py](./build_agent_temporal_diffs.py)

## One-Command Pipeline

- [rebuild_agent_relationship_artifacts.sh](./rebuild_agent_relationship_artifacts.sh)
- [Makefile](./Makefile)

## Alerting

- [agent-relationship-snapshots/latest-alert.json](./agent-relationship-snapshots/latest-alert.json)
- [agent-relationship-snapshots/latest-alert.md](./agent-relationship-snapshots/latest-alert.md)
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
