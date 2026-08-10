#!/usr/bin/env bash
# Persist TNF standalone relay (default :3007) via launchd so it survives shell sessions.
set -euo pipefail

LABEL="com.thenewfuse.relay"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SMART_START="$ROOT_DIR/scripts/runtime/tnf-launchd-smart-start.sh"
RELAY_DIR="$ROOT_DIR/packages/relay-core"
RELAY_ENTRY="$RELAY_DIR/dist/standalone-relay.js"
LOG_DIR="$HOME/.tnf/relay/logs"
PORT="${RELAY_PORT:-${PORT:-3007}}"
NODE_BIN="${TNF_NODE_BIN:-$(command -v node)}"
LAUNCH_DOMAIN="gui/$(id -u)"

ensure_dirs() {
  mkdir -p "$LOG_DIR"
}

create_plist() {
  [[ -n "$NODE_BIN" && -x "$NODE_BIN" ]] || {
    echo "node not found" >&2
    exit 1
  }
  [[ -x "$SMART_START" ]] || chmod +x "$SMART_START"
  cat >"$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${LABEL}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${SMART_START}</string>
        <string>${LABEL}</string>
        <string>${RELAY_DIR}</string>
        <string>${NODE_BIN}</string>
        <string>${RELAY_ENTRY}</string>
        <string>--port</string>
        <string>${PORT}</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PORT</key>
        <string>${PORT}</string>
        <key>RELAY_PORT</key>
        <string>${PORT}</string>
        <key>ENABLE_REDIS_BRIDGE</key>
        <string>${ENABLE_REDIS_BRIDGE:-false}</string>
        <key>ENABLE_ACTIVITY_PERSISTENCE</key>
        <string>${ENABLE_ACTIVITY_PERSISTENCE:-false}</string>
        <key>ACTIVITY_PERSISTENCE_REQUIRED</key>
        <string>${ACTIVITY_PERSISTENCE_REQUIRED:-false}</string>
        <key>PATH</key>
        <string>$(dirname "$NODE_BIN"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>${HOME}</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>${RELAY_DIR}</string>
    <key>StandardOutPath</key>
    <string>${LOG_DIR}/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>${LOG_DIR}/stderr.log</string>
</dict>
</plist>
EOF
  plutil -lint "$PLIST_PATH" >/dev/null
}

stop_session_occupants() {
  # Free the bind port from nohup / foreground shells before launchd claims it.
  local pids
  pids="$(lsof -tiTCP:"${PORT}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return 0
  fi
  for pid in $pids; do
    local cmd
    cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
    if [[ "$cmd" == *"standalone-relay"* ]]; then
      echo "Stopping session-backed relay pid ${pid}"
      kill "$pid" 2>/dev/null || true
    fi
  done
  sleep 1
}

wait_health() {
  local i health
  for i in $(seq 1 45); do
    health="$(curl -sS -m 2 "http://127.0.0.1:${PORT}/health" 2>/dev/null || true)"
    if echo "$health" | grep -q '"status"'; then
      echo "Relay healthy on :${PORT}"
      echo "$health" | head -c 240
      echo
      return 0
    fi
    sleep 1
  done
  echo "WARN: relay health not ready yet — tail ${LOG_DIR}/stderr.log" >&2
  tail -40 "${LOG_DIR}/stderr.log" 2>/dev/null || true
  return 1
}

install() {
  ensure_dirs
  if [[ ! -f "$RELAY_ENTRY" ]]; then
    echo "Building packages/relay-core..."
    (cd "$RELAY_DIR" && pnpm run build)
  fi
  create_plist
  start
  echo "Installed and started ${LABEL} via launchd (port ${PORT})"
}

start() {
  ensure_dirs
  if [[ ! -f "$PLIST_PATH" ]]; then
    create_plist
  fi
  stop_session_occupants
  launchctl bootout "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
  launchctl bootstrap "$LAUNCH_DOMAIN" "$PLIST_PATH" >/dev/null 2>&1 || launchctl load -w "$PLIST_PATH"
  launchctl enable "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
  launchctl kickstart -k "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
  wait_health || true
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
  echo "-- ${LABEL}"
  if launchctl print "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1; then
    launchctl print "${LAUNCH_DOMAIN}/${LABEL}" 2>/dev/null | awk '
      /state =|runs =|last exit code|pid =|program =/ {print}
    '
  else
    echo "not-installed"
  fi
  echo "-- health :${PORT}"
  curl -sS -m 2 "http://127.0.0.1:${PORT}/health" 2>/dev/null || echo "down"
  echo
}

case "${1:-}" in
  install) install ;;
  start) start ;;
  stop) stop ;;
  uninstall) uninstall ;;
  status) status ;;
  *)
    echo "Usage: $0 <install|start|stop|uninstall|status>"
    exit 1
    ;;
esac
