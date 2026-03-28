#!/usr/bin/env bash
set -euo pipefail

LABEL="tnf-terminal-heartbeat-pulse"
TAG="# ${LABEL}"
SERVICE_HOME="$HOME/.tnf/terminal-heartbeat"
BIN_SCRIPT="$HOME/.tnf/bin/terminal-heartbeat-pulse.cjs"
STATE_DIR="$SERVICE_HOME/state"
LOG_DIR="$SERVICE_HOME/logs"
LOG_FILE="$LOG_DIR/cron.log"
NODE_BIN="${TNF_TERMINAL_HEARTBEAT_NODE_BIN:-$(command -v node)}"
SCHEDULE="${TNF_TERMINAL_HEARTBEAT_CRON_SCHEDULE:-*/30 * * * *}"
ALLOW_PROMPT_INJECTION="${TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION:-false}"
INTERACTIVE_SAFE_MODE="${TNF_INTERACTIVE_SAFE_MODE:-true}"
INTERACTIVE_SAFE_MODE_FILE="${TNF_INTERACTIVE_SAFE_MODE_FILE:-$HOME/.tnf/flags/interactive-safe-mode}"
MAX_TARGETS="${TNF_TERMINAL_HEARTBEAT_MAX_TARGETS:-3}"
APPLESCRIPT_TIMEOUT_MS="${TNF_TERMINAL_HEARTBEAT_APPLESCRIPT_TIMEOUT_MS:-3000}"

ensure_dirs() {
  mkdir -p "$STATE_DIR" "$LOG_DIR"
}

cron_line() {
  printf '%s cd "%s" && PATH="%s:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" TNF_TERMINAL_HEARTBEAT_STATE_DIR="%s" TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION="%s" TNF_INTERACTIVE_SAFE_MODE="%s" TNF_INTERACTIVE_SAFE_MODE_FILE="%s" TNF_TERMINAL_HEARTBEAT_MAX_TARGETS="%s" TNF_TERMINAL_HEARTBEAT_APPLESCRIPT_TIMEOUT_MS="%s" "%s" "%s" >> "%s" 2>&1 %s\n' \
    "$SCHEDULE" \
    "$SERVICE_HOME" \
    "$(dirname "$NODE_BIN")" \
    "$STATE_DIR" \
    "$ALLOW_PROMPT_INJECTION" \
    "$INTERACTIVE_SAFE_MODE" \
    "$INTERACTIVE_SAFE_MODE_FILE" \
    "$MAX_TARGETS" \
    "$APPLESCRIPT_TIMEOUT_MS" \
    "$NODE_BIN" \
    "$BIN_SCRIPT" \
    "$LOG_FILE" \
    "$TAG"
}

install_cron() {
  ensure_dirs
  local tmp
  tmp="$(mktemp)"
  crontab -l 2>/dev/null | grep -v "$LABEL" > "$tmp" || true
  cron_line >> "$tmp"
  crontab "$tmp"
  rm -f "$tmp"
  echo "installed: $LABEL"
}

remove_cron() {
  local tmp
  tmp="$(mktemp)"
  crontab -l 2>/dev/null | grep -v "$LABEL" > "$tmp" || true
  crontab "$tmp"
  rm -f "$tmp"
  echo "removed: $LABEL"
}

run_once() {
  ensure_dirs
  TNF_TERMINAL_HEARTBEAT_STATE_DIR="$STATE_DIR" \
  TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION="$ALLOW_PROMPT_INJECTION" \
  TNF_INTERACTIVE_SAFE_MODE="$INTERACTIVE_SAFE_MODE" \
  TNF_INTERACTIVE_SAFE_MODE_FILE="$INTERACTIVE_SAFE_MODE_FILE" \
  TNF_TERMINAL_HEARTBEAT_MAX_TARGETS="$MAX_TARGETS" \
  TNF_TERMINAL_HEARTBEAT_APPLESCRIPT_TIMEOUT_MS="$APPLESCRIPT_TIMEOUT_MS" \
  "$NODE_BIN" "$BIN_SCRIPT"
}

status() {
  crontab -l 2>/dev/null | rg "$LABEL" || true
  [[ -f "$HOME/.tnf/terminal-heartbeat/state/terminal-heartbeat-latest.json" ]] && \
    stat -f '%Sm %N' "$HOME/.tnf/terminal-heartbeat/state/terminal-heartbeat-latest.json"
}

case "${1:-}" in
  install) install_cron ;;
  uninstall|remove) remove_cron ;;
  run-once) run_once ;;
  status) status ;;
  *) echo "Usage: $0 <install|uninstall|run-once|status>"; exit 1 ;;
esac
