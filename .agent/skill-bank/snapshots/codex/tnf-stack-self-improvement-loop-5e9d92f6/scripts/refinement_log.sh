#!/usr/bin/env bash
set -euo pipefail

REPO=""
NOTE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --note) NOTE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$REPO" || -z "$NOTE" ]]; then
  echo "Usage: refinement_log.sh --repo <path> --note <text>" >&2
  exit 2
fi

LOG_FILE="$REPO/docs/operations/tnf-self-improvement-run-log.md"
mkdir -p "$(dirname "$LOG_FILE")"

if [[ ! -f "$LOG_FILE" ]]; then
  cat > "$LOG_FILE" <<'HEADER'
# TNF Self-Improvement Run Log

HEADER
fi

{
  echo "## $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo "- Note: $NOTE"
  echo "- Branch: $(git -C "$REPO" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  echo "- Commit: $(git -C "$REPO" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  echo
} >> "$LOG_FILE"

echo "Appended run note to $LOG_FILE"
