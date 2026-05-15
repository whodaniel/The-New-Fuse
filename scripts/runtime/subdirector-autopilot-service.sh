#!/usr/bin/env bash
set -euo pipefail

LABEL="com.tnf.subdirector-autopilot"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
LAUNCH_DOMAIN="gui/$(id -u)"
NODE_BIN="${TNF_SUBDIRECTOR_AUTOPILOT_NODE_BIN:-$(command -v node)}"
SCRIPT_PATH="$HOME/.tnf/bin/subdirector-autopilot-loop.cjs"
WORK_DIR="$HOME/.tnf/subdirector-autopilot"
LOG_DIR="$WORK_DIR/logs"
STATE_DIR="$WORK_DIR/state"
ROOT_DIR_DEFAULT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ROOT_DIR="${TNF_SUBDIRECTOR_AUTOPILOT_ROOT_DIR:-$ROOT_DIR_DEFAULT}"
CHECK_SCRIPT="${TNF_SUBDIRECTOR_AUTOPILOT_CHECK_SCRIPT:-$ROOT_DIR/.skills/tnf-sub-director-autopilot/scripts/subdirector-cycle-check.sh}"
LOOP_LOG_FILE="${TNF_SUBDIRECTOR_AUTOPILOT_LOOP_LOG_FILE:-$ROOT_DIR/logs/sub-director-autopilot-loop.jsonl}"
INTERVAL_MS="${TNF_SUBDIRECTOR_AUTOPILOT_INTERVAL_MS:-30000}"
COMMAND_TIMEOUT_MS="${TNF_SUBDIRECTOR_AUTOPILOT_COMMAND_TIMEOUT_MS:-45000}"
RUNTIME_PATH="$(dirname "$NODE_BIN"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

ensure_dirs() {
  mkdir -p "$LOG_DIR" "$STATE_DIR" "$(dirname "$LOOP_LOG_FILE")"
}

create_plist() {
  cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_BIN}</string>
    <string>${SCRIPT_PATH}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${RUNTIME_PATH}</string>
    <key>TNF_SUBDIRECTOR_AUTOPILOT_STATE_DIR</key>
    <string>${STATE_DIR}</string>
    <key>TNF_SUBDIRECTOR_AUTOPILOT_ROOT_DIR</key>
    <string>${ROOT_DIR}</string>
    <key>TNF_SUBDIRECTOR_AUTOPILOT_CHECK_SCRIPT</key>
    <string>${CHECK_SCRIPT}</string>
    <key>TNF_SUBDIRECTOR_AUTOPILOT_LOOP_LOG_FILE</key>
    <string>${LOOP_LOG_FILE}</string>
    <key>TNF_SUBDIRECTOR_AUTOPILOT_INTERVAL_MS</key>
    <string>${INTERVAL_MS}</string>
    <key>TNF_SUBDIRECTOR_AUTOPILOT_COMMAND_TIMEOUT_MS</key>
    <string>${COMMAND_TIMEOUT_MS}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>WorkingDirectory</key>
  <string>${WORK_DIR}</string>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/stderr.log</string>
</dict>
</plist>
PLIST
}

install() {
  ensure_dirs
  create_plist
  start
  echo "installed: $LABEL"
}

start() {
  ensure_dirs
  if [[ ! -f "$PLIST_PATH" ]]; then
    create_plist
  fi
  launchctl bootout "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
  launchctl bootstrap "$LAUNCH_DOMAIN" "$PLIST_PATH" >/dev/null 2>&1 || launchctl load -w "$PLIST_PATH"
  launchctl kickstart -k "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
  echo "started: $LABEL"
}

stop() {
  launchctl bootout "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || launchctl unload "$PLIST_PATH" 2>/dev/null || true
  echo "stopped: $LABEL"
}

restart() {
  stop
  start
}

run_once() {
  ensure_dirs
  TNF_SUBDIRECTOR_AUTOPILOT_STATE_DIR="$STATE_DIR" \
  TNF_SUBDIRECTOR_AUTOPILOT_ROOT_DIR="$ROOT_DIR" \
  TNF_SUBDIRECTOR_AUTOPILOT_CHECK_SCRIPT="$CHECK_SCRIPT" \
  TNF_SUBDIRECTOR_AUTOPILOT_LOOP_LOG_FILE="$LOOP_LOG_FILE" \
  TNF_SUBDIRECTOR_AUTOPILOT_INTERVAL_MS="$INTERVAL_MS" \
  TNF_SUBDIRECTOR_AUTOPILOT_COMMAND_TIMEOUT_MS="$COMMAND_TIMEOUT_MS" \
  TNF_SUBDIRECTOR_AUTOPILOT_ONCE=true \
  "$NODE_BIN" "$SCRIPT_PATH"
}

uninstall() {
  stop
  rm -f "$PLIST_PATH"
  echo "removed: $LABEL"
}

status() {
  if launchctl print "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1; then
    echo "running: $LABEL"
  else
    echo "not-running: $LABEL"
  fi
  [[ -f "$STATE_DIR/subdirector-autopilot-latest.json" ]] && \
    stat -f '%Sm %N' "$STATE_DIR/subdirector-autopilot-latest.json"
}

case "${1:-}" in
  install) install ;;
  start) start ;;
  stop) stop ;;
  restart) restart ;;
  run-once) run_once ;;
  uninstall|remove) uninstall ;;
  status) status ;;
  *) echo "Usage: $0 <install|start|stop|restart|run-once|status|uninstall>"; exit 1 ;;
esac
