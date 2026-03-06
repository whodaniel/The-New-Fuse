#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SNAP_DIR="$SCRIPT_DIR/snapshots"
JOB_CMD="cd '$SCRIPT_DIR' && ./rebuild_agent_relationship_artifacts.sh > '$SNAP_DIR/cron.log' 2>&1"
DEFAULT_SCHEDULE="0 * * * *"
TAG="# AGENT_RELATIONSHIP_AUTOPILOT"

usage() {
  cat <<EOF
Usage: $0 [install|remove|show] [schedule]

Commands:
  install [schedule]  Install cron job. Default: "$DEFAULT_SCHEDULE"
  remove              Remove cron job.
  show                Show current cron entries tagged for graph autopilot.

Example:
  $0 install "*/30 * * * *"
EOF
}

cmd="${1:-install}"
schedule="${2:-$DEFAULT_SCHEDULE}"

case "$cmd" in
  install)
    (crontab -l 2>/dev/null | grep -v "$TAG" || true; echo "$schedule $JOB_CMD $TAG") | crontab -
    echo "Installed cron schedule: $schedule"
    echo "Working directory: $SCRIPT_DIR"
    ;;
  remove)
    (crontab -l 2>/dev/null | grep -v "$TAG" || true) | crontab -
    echo "Removed tagged cron entries."
    ;;
  show)
    crontab -l 2>/dev/null | grep "$TAG" || echo "No tagged entries found."
    ;;
  *)
    usage
    exit 1
    ;;
esac
