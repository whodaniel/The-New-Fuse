#!/usr/bin/env bash
set -euo pipefail

LABEL="com.thenewfuse.relay-monitor"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT_PATH="$ROOT_DIR/scripts/relay-channel-monitor.cjs"
LOG_DIR="$HOME/.tnf/relay-monitor/logs"
NODE_BIN="$(command -v node)"
LAUNCH_DOMAIN="gui/$(id -u)"

ensure_dirs() {
  mkdir -p "$LOG_DIR"
}

create_plist() {
  cat > "$PLIST_PATH" <<EOF
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
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${LOG_DIR}/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${LOG_DIR}/stderr.log</string>
    <key>WorkingDirectory</key>
    <string>${ROOT_DIR}</string>
</dict>
</plist>
EOF
}

install() {
  ensure_dirs
  create_plist
  start
  echo "✅ Installed and started ${LABEL} via launchd"
}

start() {
  ensure_dirs
  if [[ ! -f "$PLIST_PATH" ]]; then
    create_plist
  fi
  launchctl bootout "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
  launchctl bootstrap "$LAUNCH_DOMAIN" "$PLIST_PATH" >/dev/null 2>&1 || launchctl load -w "$PLIST_PATH"
  launchctl kickstart -k "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
  echo "Started ${LABEL}"
}

stop() {
  launchctl bootout "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || launchctl unload "$PLIST_PATH" 2>/dev/null || true
  echo "Stopped ${LABEL}"
}

uninstall() {
  stop
  rm -f "$PLIST_PATH"
  echo "Removed ${LABEL}"
}

status() {
  if launchctl print "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1; then
    echo "Running: ${LABEL}"
  else
    echo "Not running"
  fi
}

case "${1:-}" in
  install)
    install
    ;;
  start)
    start
    ;;
  stop)
    stop
    ;;
  uninstall)
    uninstall
    ;;
  restart)
    stop
    start
    echo "Restarted ${LABEL}"
    ;;
  status)
    status
    ;;
  *)
    echo "Usage: $0 <install|start|stop|uninstall|restart|status>"
    ;;
esac
