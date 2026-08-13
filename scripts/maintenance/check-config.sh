#!/bin/bash
TIMESTAMP=$(date -Iseconds)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="${TNF_ROOT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"
cd "$BASE"
DELTAS=$(git diff --name-only | head -20)
UNTRACKED=$(git ls-files --others --exclude-standard | head -20)
if [ -n "$DELTAS" ] || [ -n "$UNTRACKED" ]; then
  echo "[CONFIG-DRIFT][$TIMESTAMP] Detected changes" >> "$BASE/monitor.log"
  [ -n "$DELTAS" ] && echo "  modified: $DELTAS" >> "$BASE/monitor.log"
  [ -n "$UNTRACKED" ] && echo "  untracked: $UNTRACKED" >> "$BASE/monitor.log"
else
  echo "[CONFIG-OK][$TIMESTAMP] No drift detected" >> "$BASE/monitor.log"
fi
# Auto-heal: re-sync tracked files against last known good via stash if drift too large
DRIFT_COUNT=$(git diff --name-only | wc -l)
if [ "$DRIFT_COUNT" -gt 50 ]; then
  echo "[CONFIG-HEAL][$TIMESTAMP] Excessive drift ($DRIFT_COUNT), creating checkpoint stash" >> "$BASE/monitor.log"
  git stash push -m "auto-heal-checkpoint-$(date +%s)" --include-untracked 2>/dev/null
fi
