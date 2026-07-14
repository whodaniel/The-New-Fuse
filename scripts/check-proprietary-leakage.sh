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

for f in "${PROPRIETARY_FILES[@]}"; do check_path "$f"; done
for d in "${PROPRIETARY_DIRS[@]}"; do check_path "$d"; done
for f in "${PROPRIETARY_SCRIPTS[@]}"; do check_path "$f"; done

if [ "$LEAKS" -gt 0 ]; then
  echo "FAIL: $LEAKS proprietary path(s) found under $TARGET"
  exit 1
fi

echo "PASS: No proprietary paths under $TARGET"
