# Agent Relationship Graph Tools

Interactive visualization and analytics tools for the TNF agent relationship
graph — a 113-node graph modeling orchestration hierarchies, cross-domain
collaboration, and temporal evolution of the agent ecosystem.

## Quick Start

```bash
# From the project root:
pnpm run graph:all        # Full pipeline: subgraphs → analytics → neo4j → temporal → alerts
pnpm run graph:help       # Show all available targets

# Or from this directory:
make all                  # Same as above
make help                 # Show all targets
```

## Available Commands

| Command           | Description                                                           |
| ----------------- | --------------------------------------------------------------------- |
| `graph:all`       | Run the full rebuild pipeline                                         |
| `graph:subgraphs` | Generate domain subgraph JSON, Markdown, Cypher, and HTML             |
| `graph:analytics` | Compute centrality, betweenness, eigenvector, and community detection |
| `graph:neo4j`     | Build Neo4j CSV + Cypher import package                               |
| `graph:temporal`  | Create timestamped snapshot and diff against previous                 |
| `graph:alerts`    | Check latest delta against configurable thresholds                    |
| `graph:html`      | Regenerate interactive force-directed HTML views                      |

## Directory Structure

```
tools/agent-relationship-graph/
├── Makefile                          # Build targets
├── README.md                         # This file
├── agent-relationship-graph.json     # Master graph (113 nodes)
├── agent-relationship-graph.md       # Mermaid documentation
├── agent-relationship-graph.cypher   # Full-graph Neo4j import
├── agent-relationship-subgraphs-index.md
│
├── subgraphs/                        # Domain-specific subgraphs
│   ├── *-brand-subgraph.{json,md,html,cypher}
│   ├── *-content-subgraph.{json,md,html,cypher}
│   ├── *-funnel-subgraph.{json,md,html,cypher}
│   ├── *-ops-subgraph.{json,md,html,cypher}
│   ├── *-podcast-subgraph.{json,md,html,cypher}
│   ├── *-seo-subgraph.{json,md,html,cypher}
│   └── *-social-subgraph.{json,md,html,cypher}
│
├── reports/                          # Generated analytics
│   ├── agent-relationship-centrality-report.json
│   ├── agent-relationship-centrality-report.md
│   └── agent-relationship-subgraph-hubs.md
│
├── neo4j-package/                    # Neo4j import bundle
│   ├── nodes.csv
│   ├── edges.csv
│   ├── domain_membership.csv
│   ├── load.noapoc.cypher
│   ├── load.apoc.cypher
│   └── README.md
│
├── snapshots/                        # Temporal tracking
│   ├── snapshot-*.json
│   ├── delta-*-to-*.{json,md}
│   ├── latest-snapshot.json
│   ├── latest-delta.{json,md}
│   └── latest-alert.{json,md}
│
├── build_agent_graph_analytics.py    # Centrality + community detection
├── build_agent_html_views.py         # Interactive HTML generator
├── build_agent_neo4j_package.py      # CSV + Cypher exporter
├── build_agent_temporal_diffs.py     # Snapshot & diff engine
├── check_agent_graph_delta_alerts.py # Threshold alerting
├── generate_agent_subgraphs.sh       # Domain subgraph extractor
├── rebuild_agent_relationship_artifacts.sh  # Full pipeline
├── setup_graph_snapshot_cron.sh      # Cron autopilot
├── setup_graph_snapshot_launchd.sh   # macOS launchd autopilot
└── requirements.txt                  # Python dependencies
```

## Interactive HTML Views

Open any `.html` file in `subgraphs/` in a browser to explore the interactive
force-directed graph:

- **Drag** nodes to reposition
- **Hover** for agent details (id, kind, cluster)
- Node size indicates primary vs. secondary agents
- Edge width indicates relationship strength

## Autopilot (Scheduled Snapshots)

### macOS launchd (recommended)

```bash
pnpm run graph:launchd        # Install, default 1h interval
# Custom interval:
cd tools/agent-relationship-graph && ./setup_graph_snapshot_launchd.sh install 1800
```

### cron

```bash
pnpm run graph:cron            # Install hourly cron job
```

## Neo4j Import

1. Run `pnpm run graph:neo4j` to generate the package
2. Copy CSVs from `neo4j-package/` to your Neo4j import directory
3. Run `:source load.noapoc.cypher` (or `load.apoc.cypher` for dynamic
   relationship types)

## Dependencies

- **Python 3.8+** (standard library only — no pip install needed)
- **jq** (for subgraph generation shell script)
- **make** (optional — can run scripts directly)
