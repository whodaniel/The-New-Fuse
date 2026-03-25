#!/usr/bin/env bash
# Run all five documentation-system stages in sequence.
#
# Usage:
#   ./scripts/documentation-system/run-full-pipeline.sh
#   ./scripts/documentation-system/run-full-pipeline.sh --apply-exact-duplicates

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "▶ Stage 1: Discover"
"${SCRIPT_DIR}/01-discover-simple.sh"

echo "▶ Stage 2: Classify"
npx tsx "${SCRIPT_DIR}/02-classify-advanced.ts"

echo "▶ Stage 3: Analyze"
npx tsx "${SCRIPT_DIR}/03-analyze-local.ts"

echo "▶ Stage 4: Consolidate"
npx tsx "${SCRIPT_DIR}/04-consolidate-fast.ts"

echo "▶ Stage 5: Evolve"
npx tsx "${SCRIPT_DIR}/05-evolve.ts" "$@"

echo "✅ Documentation pipeline complete."
