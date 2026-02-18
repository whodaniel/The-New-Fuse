#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

INTERVAL_MINUTES="${INTERVAL_MINUTES:-15}"
TASK_FILE="${TASK_FILE:-}"

if ! [[ "$INTERVAL_MINUTES" =~ ^[0-9]+$ ]] || [[ "$INTERVAL_MINUTES" -lt 1 ]] || [[ "$INTERVAL_MINUTES" -gt 59 ]]; then
  echo "INTERVAL_MINUTES must be an integer between 1 and 59" >&2
  exit 1
fi

LOOP_CMD="cd \"$REPO_ROOT\" && bash scripts/jules-autonomous-loop.sh"
if [[ -n "$TASK_FILE" ]]; then
  LOOP_CMD="$LOOP_CMD \"$TASK_FILE\""
fi

CRON_LINE="*/$INTERVAL_MINUTES * * * * $LOOP_CMD >> \"$REPO_ROOT/.agent/jules-logs/jules-cron.log\" 2>&1"

TMP_CRON="$(mktemp)"
crontab -l 2>/dev/null | grep -v "scripts/jules-autonomous-loop.sh" > "$TMP_CRON" || true
echo "$CRON_LINE" >> "$TMP_CRON"
crontab "$TMP_CRON"
rm -f "$TMP_CRON"

echo "Installed cron entry:"
echo "$CRON_LINE"

