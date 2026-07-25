#!/bin/bash
# Check open-runtime export tree for full proprietary implementations.
# The combined monorepo is EXPECTED to contain proprietary paths — do not run on monorepo root.
# Usage: ./scripts/check-proprietary-leakage.sh <open-runtime-export-dir>
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET="${1:-$MONO_ROOT}"

source_arrays() {
  eval "$(awk '
    /^PROPRIETARY_FILES=\(/,/^\)/ { print }
    /^PROPRIETARY_DIRS=\(/,/^\)/ { print }
    /^PROPRIETARY_SCRIPTS=\(/,/^\)/ { print }
  ' "$MONO_ROOT/scripts/sync-repos.sh")"
}

source_arrays
LEAKS=0

is_stub_file() {
  local p="$1"
  [ -f "$p" ] || return 1
  grep -qE 'stub mode|intentionally minimal|no-op implementation' "$p" 2>/dev/null
}

check_path() {
  local p="$1"
  if [ -f "$TARGET/$p" ]; then
    if is_stub_file "$TARGET/$p"; then
      return
    fi
    echo "LEAK: $p"
    LEAKS=$((LEAKS + 1))
  elif [ -d "$TARGET/$p" ]; then
    if [ "$p" = "apps/backend/src/modules/orchestrator" ]; then
      local idx="$TARGET/$p/index.ts"
      if [ -f "$idx" ] && is_stub_file "$idx"; then
        local fc
        fc="$(find "$TARGET/$p" -type f | wc -l | tr -d ' ')"
        [ "$fc" -eq 1 ] && return
      fi
    fi
    echo "LEAK: $p/"
    LEAKS=$((LEAKS + 1))
  fi
}

# A declared path that does not exist in the monorepo protects nothing, and the
# leak check below would still pass. That is exactly how PROPRIETARY_SCRIPTS
# published: all 20 entries were bare filenames, so every consumer resolved them
# against the repo root, matched nothing, removed nothing, and reported PASS.
# Treat an unresolvable declaration as a boundary failure, not a silent no-op.
STALE=0
check_declared() {
  local p="$1"
  [ -e "$MONO_ROOT/$p" ] || {
    echo "STALE DECLARATION: $p (declared proprietary but not present in monorepo)"
    STALE=$((STALE + 1))
  }
}

for f in "${PROPRIETARY_FILES[@]}"; do check_declared "$f"; done
for d in "${PROPRIETARY_DIRS[@]}"; do check_declared "$d"; done
for f in "${PROPRIETARY_SCRIPTS[@]}"; do check_declared "$f"; done

for f in "${PROPRIETARY_FILES[@]}"; do check_path "$f"; done
for d in "${PROPRIETARY_DIRS[@]}"; do check_path "$d"; done
for f in "${PROPRIETARY_SCRIPTS[@]}"; do check_path "$f"; done

if [ "$STALE" -gt 0 ]; then
  echo "FAIL: $STALE stale proprietary declaration(s) in scripts/sync-repos.sh"
  echo "      Fix the path or remove the entry — a wrong path silently publishes the file."
  exit 1
fi

if [ "$LEAKS" -gt 0 ]; then
  echo "FAIL: $LEAKS proprietary path(s) found under $TARGET"
  exit 1
fi

echo "PASS: No proprietary paths under $TARGET; all declarations resolve"
