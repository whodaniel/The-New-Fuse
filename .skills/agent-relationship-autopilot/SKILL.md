---
name: agent-relationship-autopilot
description: Build, refresh, and monitor agent relationship graph artifacts for the local workspace, including subgraph exports, centrality/community analytics, Neo4j package generation, temporal snapshots/deltas, and drift alert checks. Use when requests involve relationship graph regeneration, domain subgraph updates, temporal graph change tracking, scheduling recurring graph rebuilds, or validating relationship drift thresholds.
---

# Agent Relationship Autopilot

## Overview

Run the local agent-relationship pipeline in `/Users/<owner>` end-to-end, then verify outputs, deltas, and alerts.
Use this skill for graph maintenance tasks, not for generic code changes.

## Quick Start

1. Run full pipeline:
```bash
cd /Users/<owner>
make graph-all
```

2. Inspect latest temporal outputs:
```bash
ls -1 /Users/<owner>/agent-relationship-snapshots
sed -n '1,80p' /Users/<owner>/agent-relationship-snapshots/latest-delta.md
sed -n '1,80p' /Users/<owner>/agent-relationship-snapshots/latest-alert.md
```

3. Validate key artifact counts:
```bash
jq '{nodes:(.nodes|length),edges:(.edges|length)}' /Users/<owner>/agent-relationship-graph.json
wc -l /Users/<owner>/agent-relationship-neo4j-package/nodes.csv /Users/<owner>/agent-relationship-neo4j-package/edges.csv
```

## Core Workflow

1. Regenerate domain subgraphs and HTML views via `generate_agent_subgraphs.sh`.
2. Recompute analytics via `build_agent_graph_analytics.py`.
3. Rebuild Neo4j package via `build_agent_neo4j_package.py`.
4. Create temporal snapshot/delta via `build_agent_temporal_diffs.py`.
5. Evaluate thresholds via `check_agent_graph_delta_alerts.py`.
6. Confirm index links in `agent-relationship-subgraphs-index.md` still point to existing files.

## Task Routing

- Rebuild everything: run `make graph-all`.
- Only temporal checks: run `make graph-temporal` and `make graph-alerts`.
- Only subgraphs: run `make graph-subgraphs`.
- Only Neo4j package: run `make graph-neo4j`.
- Configure recurring execution: use `setup_graph_snapshot_cron.sh` or `setup_graph_snapshot_launchd.sh`.

## Validation Rules

1. Keep JSON outputs parseable with `jq`.
2. Keep Python scripts syntax-valid with `python3 -m py_compile`.
3. Keep no-APOC Cypher output working without APOC-specific procedures.
4. If graph counts change unexpectedly, report exact node/edge deltas from `latest-delta.json`.
5. If threshold breaches occur, report breached metrics and current threshold values.

## Resources

- Script wrappers: see `scripts/run_pipeline.sh` and `scripts/configure_scheduler.sh`.
- Operational details and expected outputs: see `references/pipeline-reference.md`.
