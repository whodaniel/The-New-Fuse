#!/usr/bin/env bash
set -euo pipefail

LABEL="com.tnf.local-subdirector"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
NODE_BIN="${TNF_LOCAL_SUBDIRECTOR_NODE_BIN:-$(command -v node)}"
SCRIPT_PATH="$HOME/.tnf/local-subdirector/bin/local-subdirector-runtime.cjs"
WORK_DIR="$HOME/.tnf/local-subdirector"
LOG_DIR="$WORK_DIR/logs"
STATE_DIR="$WORK_DIR/state"
INTERACTIVE_SAFE_MODE="${TNF_INTERACTIVE_SAFE_MODE:-true}"
INTERACTIVE_SAFE_MODE_FILE="${TNF_INTERACTIVE_SAFE_MODE_FILE:-$HOME/.tnf/flags/interactive-safe-mode}"

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
    <key>LOCAL_SUBDIRECTOR_STATE_DIR</key>
    <string>${STATE_DIR}</string>
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

uninstall() {
  stop
  rm -f "$PLIST_PATH"
  echo "removed: $LABEL"
}

status() {
  launchctl list | grep "$LABEL" || echo "not-running: $LABEL"
  [[ -f "$STATE_DIR/local-subdirector-heartbeat.json" ]] && stat -f '%Sm %N' "$STATE_DIR/local-subdirector-heartbeat.json"
}

case "${1:-}" in
  install) install ;;
  start) start ;;
  stop) stop ;;
  restart) restart ;;
  uninstall|remove) uninstall ;;
  status) status ;;
  *) echo "Usage: $0 <install|start|stop|restart|status|uninstall>"; exit 1 ;;
esac
