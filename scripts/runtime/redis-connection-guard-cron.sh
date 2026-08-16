#!/usr/bin/env bash
# Install / run TNF Redis connection-guard cron (prevents maxclients saturation).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="tnf-redis-connection-guard"
TAG="# ${LABEL}"
SERVICE_HOME="$HOME/.tnf/redis-guard"
BIN_DIR="$SERVICE_HOME/bin"
LOG_DIR="$SERVICE_HOME/logs"
STATE_DIR="$SERVICE_HOME/state"
CANONICAL_SCRIPT="${ROOT_DIR}/scripts/runtime/redis-connection-guard.cjs"
MIRRORED_SCRIPT="$BIN_DIR/redis-connection-guard.cjs"
HOME_BIN_SCRIPT="$HOME/.tnf/bin/redis-connection-guard.cjs"
LOG_FILE="$LOG_DIR/cron.log"
NODE_BIN_VALUE="${TNF_REDIS_GUARD_NODE_BIN:-$(command -v node)}"
# Every 5 minutes — enough to catch reconnect leaks before maxclients.
SCHEDULE_VALUE="${TNF_REDIS_GUARD_CRON_SCHEDULE:-*/5 * * * *}"

usage() {
  echo "Usage: $0 <install|uninstall|status|run-once|run-once-dry>"
}

ensure_dirs() {
  mkdir -p "$BIN_DIR" "$LOG_DIR" "$STATE_DIR" "$HOME/.tnf/bin" "$HOME/.tnf/fleet/state"
}

sync_script() {
  ensure_dirs
  if [[ ! -f "$CANONICAL_SCRIPT" ]]; then
    echo "[redis-connection-guard] missing $CANONICAL_SCRIPT" >&2
    return 1
  fi
  cp -f "$CANONICAL_SCRIPT" "$MIRRORED_SCRIPT"
  chmod +x "$MIRRORED_SCRIPT"
  cp -f "$CANONICAL_SCRIPT" "$HOME_BIN_SCRIPT"
  chmod +x "$HOME_BIN_SCRIPT"
}

cron_line() {
  echo "${SCHEDULE_VALUE} ${NODE_BIN_VALUE} ${MIRRORED_SCRIPT} --apply >> ${LOG_FILE} 2>&1 ${TAG}"
}

install_cron() {
  sync_script
  local tmp
  tmp="$(mktemp)"
  crontab -l 2>/dev/null | grep -v "${TAG}" >"$tmp" || true
  cron_line >>"$tmp"
  crontab "$tmp"
  rm -f "$tmp"
  echo "installed: ${LABEL} (${SCHEDULE_VALUE})"
  echo "script: ${MIRRORED_SCRIPT}"
  echo "log: ${LOG_FILE}"
}

uninstall_cron() {
  local tmp
  tmp="$(mktemp)"
  crontab -l 2>/dev/null | grep -v "${TAG}" >"$tmp" || true
  crontab "$tmp"
  rm -f "$tmp"
  echo "uninstalled: ${LABEL}"
}

status_cron() {
  echo "label: ${LABEL}"
  if crontab -l 2>/dev/null | grep -F "${TAG}" >/dev/null; then
    echo "cron: present"
    crontab -l 2>/dev/null | grep -F "${TAG}" || true
  else
    echo "cron: absent"
  fi
  if [[ -f "$HOME/.tnf/fleet/state/redis-guard-latest.json" ]]; then
    echo "latest: $HOME/.tnf/fleet/state/redis-guard-latest.json"
  fi
}

run_once() {
  sync_script
  "${NODE_BIN_VALUE}" "$MIRRORED_SCRIPT" --apply "$@"
}

run_once_dry() {
  sync_script
  "${NODE_BIN_VALUE}" "$MIRRORED_SCRIPT" --dry-run --json
}

case "${1:-}" in
  install) install_cron ;;
  uninstall) uninstall_cron ;;
  status) status_cron ;;
  run-once) shift; run_once "$@" ;;
  run-once-dry) run_once_dry ;;
  *) usage; exit 1 ;;
esac
