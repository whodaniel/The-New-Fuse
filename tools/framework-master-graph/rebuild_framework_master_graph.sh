#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

echo "[1/3] Building master framework graph artifacts..."
node ./tools/framework-master-graph/build_master_framework_graph.mjs

echo "[2/3] Verifying outputs..."
for f in \
  ./tools/framework-master-graph/master-framework-graph.json \
  ./tools/framework-master-graph/master-framework-graph.md \
  ./tools/framework-master-graph/master-framework-graph.mmd \
  ./tools/framework-master-graph/neo4j-package/nodes.csv \
  ./tools/framework-master-graph/neo4j-package/edges.csv \
  ./tools/framework-master-graph/neo4j-package/load.noapoc.cypher; do
  test -f "$f"
  echo "  - ok: $f"
done

echo "[3/3] Done."
