#!/usr/bin/env bash
set -euo pipefail

LABEL="com.tnf.voice-bridge-server"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
LAUNCH_DOMAIN="gui/$(id -u)"
PYTHON_BIN="${TNF_VOICE_BRIDGE_PYTHON_BIN:-$(command -v python3)}"
SCRIPT_PATH="${TNF_VOICE_BRIDGE_SCRIPT_PATH:-$HOME/bin/voice_server.py}"
WORK_DIR="${TNF_VOICE_BRIDGE_WORK_DIR:-$HOME}"
LOG_PATH="${TNF_VOICE_BRIDGE_LOG_PATH:-/tmp/voice_server.log}"

require_binaries() {
  if [[ -z "$PYTHON_BIN" || ! -x "$PYTHON_BIN" ]]; then
    echo "python3 not found"
    exit 1
  fi
  if [[ ! -f "$SCRIPT_PATH" ]]; then
    echo "missing script: $SCRIPT_PATH"
    exit 1
  fi
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
    <string>${PYTHON_BIN}</string>
    <string>-u</string>
    <string>${SCRIPT_PATH}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>HOME</key>
    <string>${HOME}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>WorkingDirectory</key>
  <string>${WORK_DIR}</string>
  <key>StandardOutPath</key>
  <string>${LOG_PATH}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_PATH}</string>
</dict>
</plist>
PLIST
}

install() {
  require_binaries
  create_plist
  start
  echo "installed: $LABEL"
}

start() {
  require_binaries
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
  curl -fsS http://127.0.0.1:50005/mic_state >/dev/null 2>&1 && echo "http-ok: 127.0.0.1:50005" || echo "http-down: 127.0.0.1:50005"
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
