#!/bin/bash
#
# TNF Codebase Map Generator — Fallback CI Script
# Usage: ./scripts/ci-fallback-codegen.sh [--check-only]
#
# This script runs locally or via cron to ensure the codebase_map.json
# stays in sync with the monorepo source files.
#
# WHY: GitHub Actions monthly quota may be exhausted.
# FALLBACK: Run this script locally, or set up a cron job:
#   crontab -e
#   */5 * * * * cd <tnf-root> && ./scripts/ci-fallback-codegen.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MONOREPO_ROOT="$REPO_ROOT"

echo "🔧 TNF Codebase Map — Fallback CI"
echo "===================================="

# ---------------------------------------------------------------------------
# 1. Check for changes in tracked source files
# ---------------------------------------------------------------------------
SOURCE_FILES=(
  "$MONOREPO_ROOT/TNF_EXHAUSTIVE_AST_MAP.md"
  "$MONOREPO_ROOT/AGENTS.md"
  "$MONOREPO_ROOT/scripts/parsers/mermaid_to_reactflow.mjs"
)
PROTO_DIR="$MONOREPO_ROOT/docs/protocols"

# Create a marker file to track last run
MARKER_FILE="$MONOREPO_ROOT/.codebase-map-last-run"

check_changes() {
  local changed=0
  for file in "${SOURCE_FILES[@]}"; do
    if [ ! -f "$file" ]; then
      echo "⚠️  Missing source file: $file" >&2
      continue
    fi
    if [ ! -f "$MARKER_FILE" ] || [ "$file" -nt "$MARKER_FILE" ]; then
      echo "  📝 Changed: $file" >&2
      changed=1
    fi
  done
  
  # Also check protocols directory
  if [ -d "$PROTO_DIR" ]; then
    if [ ! -f "$MARKER_FILE" ] || [ -n "$(find "$PROTO_DIR" -name '*.md' -newer "$MARKER_FILE" 2>/dev/null)" ]; then
      echo "  📝 Changed: docs/protocols/*.md" >&2
      changed=1
    fi
  fi
  
  echo "$changed"
}

# ---------------------------------------------------------------------------
# 2. Run the parser if anything changed
# ---------------------------------------------------------------------------
CHANGED=$(check_changes)

if [ "$CHANGED" -eq 0 ]; then
  echo "✅ Source files unchanged. Skipping regeneration."
  exit 0
fi

echo ""
echo "🚀 Source changes detected. Regenerating Codebase Map..."

# Run the parser (assumes Node.js is available)
node "$MONOREPO_ROOT/scripts/parsers/mermaid_to_reactflow.mjs"

# Verify the output was generated
OUTPUT_FILE="$MONOREPO_ROOT/apps/frontend/src/data/codebase_map.json"
if [ ! -f "$OUTPUT_FILE" ]; then
  echo "❌ Parser did not produce $OUTPUT_FILE"
  exit 1
fi

NODE_COUNT=$(node -e "const d=require('$OUTPUT_FILE'); console.log(d.nodes?.length || 0)")
EDGE_COUNT=$(node -e "const d=require('$OUTPUT_FILE'); console.log(d.edges?.length || 0)")

echo ""
echo "📊 Generated map:"
echo "   Nodes: $NODE_COUNT"
echo "   Edges: $EDGE_COUNT"

# ---------------------------------------------------------------------------
# 3. Optional: auto-commit if --auto-commit flag is passed
# ---------------------------------------------------------------------------
if [ "${1:-}" == "--auto-commit" ]; then
  cd "$MONOREPO_ROOT"
  if git diff --quiet -- "$OUTPUT_FILE" 2>/dev/null; then
    echo "✅ No changes to commit."
  else
    git add "$OUTPUT_FILE"
    git commit -m "chore(codebase-map): auto-regenerate from source [$(date -Iseconds)]" || true
    echo "📝 Committed changes."
  fi
fi

# Update marker
touch "$MARKER_FILE"

echo ""
echo "✅ Fallback CI complete."
