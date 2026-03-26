#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/7] Building expanded base graph..."
python3 ./build_agent_relationship_graph.py

echo "[2/7] Generating domain subgraphs..."
./generate_agent_subgraphs.sh

echo "[3/7] Building centrality/community analytics..."
python3 ./build_agent_graph_analytics.py

echo "[4/7] Building Neo4j package..."
python3 ./build_agent_neo4j_package.py

echo "[5/7] Building temporal snapshot + delta..."
python3 ./build_agent_temporal_diffs.py

echo "[6/7] Evaluating delta alert thresholds..."
python3 ./check_agent_graph_delta_alerts.py

echo "[7/7] Refreshing summary index sections..."
# Keep this lightweight: update only timestamp marker in index header if present.
if grep -q '^Generated:' ./agent-relationship-subgraphs-index.md 2>/dev/null; then
  stamp="$(date -u '+%Y-%m-%d %H:%M:%SZ')"
  awk -v s="$stamp" 'NR==3 && /^Generated:/ {$0="Generated: " s} {print}' ./agent-relationship-subgraphs-index.md > ./agent-relationship-subgraphs-index.md.tmp && mv ./agent-relationship-subgraphs-index.md.tmp ./agent-relationship-subgraphs-index.md
fi

echo "done — all artifacts rebuilt in $SCRIPT_DIR"
