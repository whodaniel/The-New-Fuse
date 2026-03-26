#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

PROJECTS_FILE="${HOSTMARIA_PROJECTS_FILE:-$HOME/.tnf/hostmaria/projects.txt}"
REPORT_DIR="${HOSTMARIA_REPORT_DIR:-$HOME/.tnf/hostmaria/reports}"
ARCHIVE_DIR="${HOSTMARIA_ARCHIVE_DIR:-$HOME/.tnf/hostmaria/archive}"

CHECK_SCHEDULE="${HOSTMARIA_CHECK_CRON_SCHEDULE:-*/10 * * * *}"
ARCHIVE_SCHEDULE="${HOSTMARIA_ARCHIVE_CRON_SCHEDULE:-17 2 * * *}"

TLS_WARN_DAYS="${HOSTMARIA_TLS_WARN_DAYS:-21}"
CHECK_TIMEOUT_MS="${HOSTMARIA_HTTP_TIMEOUT_MS:-20000}"
ARCHIVE_TIMEOUT_MS="${HOSTMARIA_ARCHIVE_TIMEOUT_MS:-25000}"

CHECK_JOB="${HOSTMARIA_CHECK_JOB_NAME:-hostmaria-preservation-check}"
ARCHIVE_JOB="${HOSTMARIA_ARCHIVE_JOB_NAME:-hostmaria-daily-archive}"

usage() {
  cat <<'USAGE'
Usage:
  scripts/runtime/hostmaria-autonomous-bootstrap.sh [install|status|uninstall]

Actions:
  install   Create config/bootstrap files, run initial checks, install cron poll jobs
  status    Show current cron jobs and latest report files
  uninstall Remove HostMaria poll cron jobs

Environment overrides:
  HOSTMARIA_PROJECTS_FILE
  HOSTMARIA_REPORT_DIR
  HOSTMARIA_ARCHIVE_DIR
  HOSTMARIA_CHECK_CRON_SCHEDULE
  HOSTMARIA_ARCHIVE_CRON_SCHEDULE
  HOSTMARIA_TLS_WARN_DAYS
USAGE
}

ensure_layout() {
  mkdir -p "$(dirname "$PROJECTS_FILE")" "$REPORT_DIR" "$ARCHIVE_DIR"
  if [[ ! -f "$PROJECTS_FILE" ]]; then
    cat >"$PROJECTS_FILE" <<'EOF'
# HostMaria project targets
# Add one domain or URL per line.
hostmaria.com
EOF
  fi
}

run_initial_checks() {
  node "$ROOT_DIR/scripts/runtime/hostmaria-preservation-check.cjs" \
    --config "$PROJECTS_FILE" \
    --out-dir "$REPORT_DIR" \
    --timeout-ms "$CHECK_TIMEOUT_MS" \
    --tls-warn-days "$TLS_WARN_DAYS" || true

  node "$ROOT_DIR/scripts/runtime/hostmaria-daily-archive.cjs" \
    --config "$PROJECTS_FILE" \
    --out-dir "$ARCHIVE_DIR" \
    --timeout-ms "$ARCHIVE_TIMEOUT_MS" || true
}

install_jobs() {
  local check_cmd archive_cmd

  check_cmd="node \"$ROOT_DIR/scripts/runtime/hostmaria-preservation-check.cjs\" --config \"$PROJECTS_FILE\" --out-dir \"$REPORT_DIR\" --timeout-ms \"$CHECK_TIMEOUT_MS\" --tls-warn-days \"$TLS_WARN_DAYS\""
  archive_cmd="node \"$ROOT_DIR/scripts/runtime/hostmaria-daily-archive.cjs\" --config \"$PROJECTS_FILE\" --out-dir \"$ARCHIVE_DIR\" --timeout-ms \"$ARCHIVE_TIMEOUT_MS\""

  "$ROOT_DIR/scripts/runtime/agent-poll-cron.sh" install \
    --job "$CHECK_JOB" \
    --command "$check_cmd" \
    --schedule "$CHECK_SCHEDULE"

  "$ROOT_DIR/scripts/runtime/agent-poll-cron.sh" install \
    --job "$ARCHIVE_JOB" \
    --command "$archive_cmd" \
    --schedule "$ARCHIVE_SCHEDULE" \
    --base-backoff-sec 300 \
    --max-backoff-sec 7200
}

show_status() {
  echo "Projects file: $PROJECTS_FILE"
  echo "Report dir:    $REPORT_DIR"
  echo "Archive dir:   $ARCHIVE_DIR"
  echo
  echo "Configured targets:"
  sed -n '1,120p' "$PROJECTS_FILE" || true
  echo
  echo "Cron jobs:"
  "$ROOT_DIR/scripts/runtime/agent-poll-cron.sh" status --job "$CHECK_JOB" || true
  "$ROOT_DIR/scripts/runtime/agent-poll-cron.sh" status --job "$ARCHIVE_JOB" || true
  echo
  echo "Latest report files:"
  ls -1 "$REPORT_DIR"/hostmaria-preservation-latest.json "$ARCHIVE_DIR"/latest-archive-summary.json 2>/dev/null || true
}

remove_jobs() {
  "$ROOT_DIR/scripts/runtime/agent-poll-cron.sh" uninstall --job "$CHECK_JOB" || true
  "$ROOT_DIR/scripts/runtime/agent-poll-cron.sh" uninstall --job "$ARCHIVE_JOB" || true
}

ACTION="${1:-install}"
case "$ACTION" in
  install)
    ensure_layout
    run_initial_checks
    install_jobs
    show_status
    ;;
  status)
    ensure_layout
    show_status
    ;;
  uninstall|remove)
    remove_jobs
    ;;
  --help|-h|help)
    usage
    ;;
  *)
    echo "Unknown action: $ACTION" >&2
    usage
    exit 1
    ;;
esac
