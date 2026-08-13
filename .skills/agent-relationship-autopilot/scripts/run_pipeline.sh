#!/usr/bin/env bash
set -euo pipefail

BASE="/Users/<owner>"
MODE="${1:-all}"

cd "$BASE"

case "$MODE" in
  all)
    make graph-all
    ;;
  subgraphs)
    make graph-subgraphs
    ;;
  analytics)
    make graph-analytics
    ;;
  neo4j)
    make graph-neo4j
    ;;
  temporal)
    make graph-temporal
    make graph-alerts
    ;;
  alerts)
    make graph-alerts
    ;;
  *)
    echo "Usage: $0 [all|subgraphs|analytics|neo4j|temporal|alerts]"
    exit 1
    ;;
esac
