#!/usr/bin/env bash
set -euo pipefail

LABEL="com.tnf.master-heartbeat"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
NODE_BIN="${TNF_MASTER_HEARTBEAT_NODE_BIN:-$(command -v node)}"
SCRIPT_PATH="$HOME/.tnf/master-heartbeat/bin/tnf-master-heartbeat-loop.cjs"
WORK_DIR="$HOME/.tnf/master-heartbeat"
LOG_DIR="$WORK_DIR/logs"
STATE_DIR="$WORK_DIR/state"
ROOT_DIR="${TNF_MASTER_HEARTBEAT_ROOT_DIR:-$HOME/.tnf}"
ALLOW_PROMPT_INJECTION="${TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION:-false}"
INTERACTIVE_SAFE_MODE="${TNF_INTERACTIVE_SAFE_MODE:-true}"
INTERACTIVE_SAFE_MODE_FILE="${TNF_INTERACTIVE_SAFE_MODE_FILE:-$HOME/.tnf/flags/interactive-safe-mode}"
RUNTIME_PATH="$(dirname "$NODE_BIN"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

ensure_dirs() {
  mkdir -p "$LOG_DIR" "$STATE_DIR"
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
    <key>TNF_MASTER_HEARTBEAT_ROOT_DIR</key>
    <string>${ROOT_DIR}</string>
    <key>TNF_MASTER_HEARTBEAT_STATE_DIR</key>
    <string>${STATE_DIR}</string>
    <key>TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION</key>
    <string>${ALLOW_PROMPT_INJECTION}</string>
    <key>TNF_INTERACTIVE_SAFE_MODE</key>
    <string>${INTERACTIVE_SAFE_MODE}</string>
    <key>TNF_INTERACTIVE_SAFE_MODE_FILE</key>
    <string>${INTERACTIVE_SAFE_MODE_FILE}</string>
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
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  launchctl load -w "$PLIST_PATH"
  echo "installed: $LABEL"
}

start() {
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  launchctl load -w "$PLIST_PATH"
  echo "started: $LABEL"
}

stop() {
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  echo "stopped: $LABEL"
}

restart() {
  stop
  start
}

run_once() {
  ensure_dirs
  TNF_MASTER_HEARTBEAT_ROOT_DIR="$ROOT_DIR" \
  TNF_MASTER_HEARTBEAT_STATE_DIR="$STATE_DIR" \
  TNF_MASTER_HEARTBEAT_ONCE=true \
  "$NODE_BIN" "$SCRIPT_PATH"
}

uninstall() {
  stop
  rm -f "$PLIST_PATH"
  echo "removed: $LABEL"
}

status() {
  launchctl list | grep "$LABEL" || echo "not-running: $LABEL"
  [[ -f "$STATE_DIR/master-heartbeat-latest.json" ]] && stat -f '%Sm %N' "$STATE_DIR/master-heartbeat-latest.json"
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
