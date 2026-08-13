#!/bin/bash
# Check open-runtime export tree for full proprietary implementations.
# The combined monorepo is EXPECTED to contain proprietary paths — do not run on monorepo root.
# Usage: ./scripts/check-proprietary-leakage.sh <open-runtime-export-dir>
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# No-arg runs previously defaulted to MONO_ROOT — the one target line 3 forbids —
# so `./scripts/check-proprietary-leakage.sh` always reported a full-tree FAIL.
# A guard whose default invocation cries wolf trains its operators to ignore it,
# which is how the 2026-07-25 boundary leak went unnoticed. Require the target.
if [ $# -lt 1 ]; then
  echo "usage: $0 <open-runtime-export-dir>" >&2
  echo "refusing to default to the monorepo root: it is EXPECTED to contain proprietary paths." >&2
  exit 2
fi
TARGET="$1"

if [ ! -d "$TARGET" ]; then
  echo "FAIL: export dir not found: $TARGET" >&2
  exit 2
fi

if [ "$(cd "$TARGET" && pwd)" = "$MONO_ROOT" ]; then
  echo "FAIL: target is the combined monorepo root; scan an open-runtime export instead." >&2
  exit 2
fi

source_arrays() {
  eval "$(awk '
    /^PROPRIETARY_FILES=\(/,/^\)/ { print }
    /^PROPRIETARY_DIRS=\(/,/^\)/ { print }
    /^PROPRIETARY_SCRIPTS=\(/,/^\)/ { print }
  ' "$MONO_ROOT/scripts/sync-repos.sh")"
}

source_arrays
LEAKS=0

# Unique strings from the real control-plane implementations. A stub comment
# pasted on top of the full source must still fail.
PROPRIETARY_IMPL_MARKERS='Eternal Heartbeat|THE BUTTON IS ALWAYS BEING HELD|ALWAYS-ON orchestration daemon|stringifySignedBusMessage|sweepHandoffPacketLifecycle|createTNFEnvelope'

is_stub_file() {
  local p="$1"
  [ -f "$p" ] || return 1
  if grep -qE "$PROPRIETARY_IMPL_MARKERS" "$p" 2>/dev/null; then
    return 1
  fi
  grep -qE 'stub mode|intentionally minimal|no-op implementation' "$p" 2>/dev/null || return 1
  # Known stub paths are a few hundred bytes. The real master-clock.ts is ~40k.
  case "$p" in
    */master-clock.ts|*/broker-agent.ts|*/orchestrator/index.ts)
      local sz
      sz="$(wc -c < "$p" | tr -d ' ')"
      [ "$sz" -lt 3000 ] || return 1
      ;;
  esac
  return 0
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
#
# Build outputs are the one legitimate exception. Declarations under a dist/
# directory describe generated artifacts, so their presence depends on whether
# the package has been built — on an unbuilt checkout all 8 relay-core dist
# entries report stale, which is a false alarm. They still must be checked for
# leakage in the export (that is the whole point of declaring them); only the
# existence check is build-state dependent. A declaration whose *source*
# counterpart is missing is still a real failure and is caught below.
#
# Crying wolf on every unbuilt checkout is the same defect as the no-arg default
# fixed above: it trains operators to skip the output of the guard that matters.
STALE=0
is_build_output() {
  case "$1" in
    */dist/*) return 0 ;;
    *) return 1 ;;
  esac
}

check_declared() {
  local p="$1"
  [ -e "$MONO_ROOT/$p" ] && return 0
  if is_build_output "$p"; then
    echo "NOTE: $p not present (build output; package unbuilt) — leak check still applies"
    return 0
  fi
  echo "STALE DECLARATION: $p (declared proprietary but not present in monorepo)"
  STALE=$((STALE + 1))
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
