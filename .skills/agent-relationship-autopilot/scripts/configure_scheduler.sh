#!/usr/bin/env bash
set -euo pipefail

BASE="/Users/<owner>"
KIND="${1:-cron}"
ACTION="${2:-install}"
VALUE="${3:-}"

cd "$BASE"

case "$KIND" in
  cron)
    if [[ -n "$VALUE" ]]; then
      ./setup_graph_snapshot_cron.sh "$ACTION" "$VALUE"
    else
      ./setup_graph_snapshot_cron.sh "$ACTION"
    fi
    ;;
  launchd)
    if [[ -n "$VALUE" ]]; then
      ./setup_graph_snapshot_launchd.sh "$ACTION" "$VALUE"
    else
      ./setup_graph_snapshot_launchd.sh "$ACTION"
    fi
    ;;
  *)
    echo "Usage: $0 [cron|launchd] [install|remove|show|status] [schedule_or_seconds]"
    exit 1
    ;;
esac
