#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="tnf-terminal-heartbeat-pulse"
TAG="# ${LABEL}"
SERVICE_HOME="$HOME/.tnf/terminal-heartbeat"
BIN_DIR="$SERVICE_HOME/bin"
LOG_DIR="$SERVICE_HOME/logs"
STATE_DIR="$SERVICE_HOME/state"
SOURCE_SCRIPT="$HOME/.tnf/bin/terminal-heartbeat-pulse.cjs"
MIRRORED_SCRIPT="$BIN_DIR/terminal-heartbeat-pulse.cjs"
LOG_FILE="$LOG_DIR/cron.log"
NODE_BIN_VALUE="${TNF_TERMINAL_HEARTBEAT_NODE_BIN:-$(command -v node)}"
SCHEDULE_VALUE="${TNF_TERMINAL_HEARTBEAT_CRON_SCHEDULE:-* * * * *}"

ensure_dirs() {
  mkdir -p "$BIN_DIR"
  mkdir -p "$LOG_DIR"
  mkdir -p "$STATE_DIR"
}

sync_script() {
  ensure_dirs
  cp "$SOURCE_SCRIPT" "$MIRRORED_SCRIPT"
  chmod +x "$MIRRORED_SCRIPT"
}

cron_line() {
  printf '%s cd "%s" && PATH="%s:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" TNF_TERMINAL_HEARTBEAT_STATE_DIR="%s" "%s" "%s" >> "%s" 2>&1 %s\n' \
    "$SCHEDULE_VALUE" \
    "$SERVICE_HOME" \
    "$(dirname "$NODE_BIN_VALUE")" \
    "$STATE_DIR" \
    "$NODE_BIN_VALUE" \
    "$MIRRORED_SCRIPT" \
    "$LOG_FILE" \
    "$TAG"
}

install_cron() {
  sync_script
  local tmp_cron
  tmp_cron="$(mktemp)"
  crontab -l 2>/dev/null | grep -v "$LABEL" >"$tmp_cron" || true
  cron_line >>"$tmp_cron"
  crontab "$tmp_cron"
  rm -f "$tmp_cron"
  echo "✅ Installed cron entry for ${LABEL}"
}

remove_cron() {
  local tmp_cron
  tmp_cron="$(mktemp)"
  crontab -l 2>/dev/null | grep -v "$LABEL" >"$tmp_cron" || true
  crontab "$tmp_cron"
  rm -f "$tmp_cron"
  echo "Removed cron entry for ${LABEL}"
}

case "${1:-}" in
  install)
    install_cron
    ;;
  uninstall|remove)
    remove_cron
    ;;
  *)
    cat <<EOF
Usage: $0 <install|uninstall>
EOF
    ;;
esac
