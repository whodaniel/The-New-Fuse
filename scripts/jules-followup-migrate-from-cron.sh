#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

TMP_CRON="$(mktemp)"
crontab -l 2>/dev/null | grep -v "scripts/jules-autonomous-loop.sh" > "$TMP_CRON" || true
crontab "$TMP_CRON"
rm -f "$TMP_CRON"

echo "Removed cron entries for scripts/jules-autonomous-loop.sh (if any)."
echo "Starting Jules follow-up supervisor..."
bash scripts/jules-followup-start.sh
