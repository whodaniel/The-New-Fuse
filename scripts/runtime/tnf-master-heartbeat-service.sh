#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="com.tnf.master-heartbeat"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
LAUNCH_DOMAIN="gui/$(id -u)"
NODE_BIN="${TNF_MASTER_HEARTBEAT_NODE_BIN:-$(command -v node)}"
SCRIPT_PATH="$HOME/.tnf/master-heartbeat/bin/tnf-master-heartbeat-loop.cjs"
CANONICAL_SCRIPT="${REPO_DIR}/scripts/runtime/tnf-master-heartbeat-loop.cjs"
WORK_DIR="$HOME/.tnf/master-heartbeat"
LOG_DIR="$WORK_DIR/logs"
STATE_DIR="$WORK_DIR/state"
LIB_DIR="$WORK_DIR/lib"
# Prefer the live repo as master-heartbeat root so cycleCommands can invoke
# scripts/runtime/*; fall back to ~/.tnf only when repo is unavailable.
ROOT_DIR="${TNF_MASTER_HEARTBEAT_ROOT_DIR:-$REPO_DIR}"
ALLOW_PROMPT_INJECTION="${TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION:-false}"
INTERACTIVE_SAFE_MODE="${TNF_INTERACTIVE_SAFE_MODE:-true}"
INTERACTIVE_SAFE_MODE_FILE="${TNF_INTERACTIVE_SAFE_MODE_FILE:-$HOME/.tnf/flags/interactive-safe-mode}"
RUNTIME_PATH="$(dirname "$NODE_BIN"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

ensure_dirs() {
  mkdir -p "$LOG_DIR" "$STATE_DIR" "$LIB_DIR" "$(dirname "$SCRIPT_PATH")"
}

sync_runtime() {
  ensure_dirs
  if [[ -f "$CANONICAL_SCRIPT" ]]; then
    cp -f "$CANONICAL_SCRIPT" "$SCRIPT_PATH"
    chmod +x "$SCRIPT_PATH"
  fi
  local repo_lib="${REPO_DIR}/scripts/lib"
  if [[ -d "$repo_lib" ]]; then
    for f in "$repo_lib"/*.cjs "$repo_lib"/*.js "$repo_lib"/*.sh; do
      [[ -e "$f" ]] || continue
      cp -f "$f" "$LIB_DIR/"
      mkdir -p "$HOME/.tnf/lib"
      cp -f "$f" "$HOME/.tnf/lib/"
    done
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
  <key>StartInterval</key>
  <integer>300</integer>
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
  sync_runtime
  create_plist
  start
  echo "installed: $LABEL"
}

start() {
  sync_runtime
  # Drop stale directory locks left by SIGTERM/kickstart races.
  if [[ -d "$STATE_DIR/loop.lock" ]]; then
    owner_pid="$(python3 -c "import json,sys;print(json.load(open(sys.argv[1])).get('pid') or '')" "$STATE_DIR/loop.lock/owner.json" 2>/dev/null || true)"
    if [[ -n "${owner_pid}" ]] && kill -0 "${owner_pid}" 2>/dev/null; then
      :
    else
      rm -rf "$STATE_DIR/loop.lock"
    fi
  fi
  create_plist
  if launchctl print "${LAUNCH_DOMAIN}/${LABEL}" 2>/dev/null | grep -q 'state = running'; then
    echo "already-running: $LABEL"
    return 0
  fi
  launchctl bootout "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
  launchctl bootstrap "$LAUNCH_DOMAIN" "$PLIST_PATH" >/dev/null 2>&1 || launchctl load -w "$PLIST_PATH"
  # Do not use kickstart -k here: forced SIGTERM makes launchctl last-exit=-15
  # even when launchd later schedules a healthy interval run.
  launchctl kickstart "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
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
  if launchctl print "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1; then
    echo "running: $LABEL"
  else
    echo "not-running: $LABEL"
  fi
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
