#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="com.thenewfuse.qa-swarm"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG_DIR="$ROOT_DIR/.agent/runtime-logs/qa-swarm-service"
STDOUT_LOG="$LOG_DIR/stdout.log"
STDERR_LOG="$LOG_DIR/stderr.log"
PID_FILE="$LOG_DIR/qa-loop-service.pid"
HEARTBEAT_FILE="$LOG_DIR/heartbeat.json"
RUNTIME_STATUS_FILE="$ROOT_DIR/.agent/testing-status.json"
RUNNER_SCRIPT="$ROOT_DIR/scripts/swarm/run-qa-loop-service.sh"
UID_VALUE="$(id -u)"
if launchctl print "gui/${UID_VALUE}" >/dev/null 2>&1; then
  DOMAIN="gui/${UID_VALUE}"
else
  DOMAIN="user/${UID_VALUE}"
fi
SERVICE_TARGET="${DOMAIN}/${LABEL}"

TEST_ENABLE_IMPROVER_VALUE="${TEST_ENABLE_IMPROVER:-0}"
TEST_LOOP_INTERVAL_VALUE="${TEST_LOOP_INTERVAL:-300000}"
TEST_TARGET_SCORE_VALUE="${TEST_TARGET_SCORE:-95}"
TEST_CONTINUE_AFTER_TARGET_VALUE="${TEST_CONTINUE_AFTER_TARGET:-1}"
TEST_AGENT_TIMEOUT_MS_VALUE="${TEST_AGENT_TIMEOUT_MS:-900000}"
TEST_STRICT_TYPECHECK_VALUE="${TEST_STRICT_TYPECHECK:-0}"
TEST_TIMEOUT_TYPECHECK_MS_VALUE="${TEST_TIMEOUT_TYPECHECK_MS:-180000}"
TEST_TIMEOUT_LINT_MS_VALUE="${TEST_TIMEOUT_LINT_MS:-180000}"
TEST_TIMEOUT_BUILD_MS_VALUE="${TEST_TIMEOUT_BUILD_MS:-300000}"
TEST_TIMEOUT_UNIT_MS_VALUE="${TEST_TIMEOUT_UNIT_MS:-180000}"
TEST_HEARTBEAT_INTERVAL_SEC_VALUE="${TEST_HEARTBEAT_INTERVAL_SEC:-15}"

ensure_dirs() {
  mkdir -p "$HOME/Library/LaunchAgents"
  mkdir -p "$LOG_DIR"
}

render_plist() {
  ensure_dirs

  cat >"$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>

  <key>ProgramArguments</key>
  <array>
    <string>${RUNNER_SCRIPT}</string>
  </array>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>TEST_ENABLE_IMPROVER</key>
    <string>${TEST_ENABLE_IMPROVER_VALUE}</string>
    <key>TEST_LOOP_INTERVAL</key>
    <string>${TEST_LOOP_INTERVAL_VALUE}</string>
    <key>TEST_TARGET_SCORE</key>
    <string>${TEST_TARGET_SCORE_VALUE}</string>
    <key>TEST_CONTINUE_AFTER_TARGET</key>
    <string>${TEST_CONTINUE_AFTER_TARGET_VALUE}</string>
    <key>TEST_AGENT_TIMEOUT_MS</key>
    <string>${TEST_AGENT_TIMEOUT_MS_VALUE}</string>
    <key>TEST_STRICT_TYPECHECK</key>
    <string>${TEST_STRICT_TYPECHECK_VALUE}</string>
    <key>TEST_TIMEOUT_TYPECHECK_MS</key>
    <string>${TEST_TIMEOUT_TYPECHECK_MS_VALUE}</string>
    <key>TEST_TIMEOUT_LINT_MS</key>
    <string>${TEST_TIMEOUT_LINT_MS_VALUE}</string>
    <key>TEST_TIMEOUT_BUILD_MS</key>
    <string>${TEST_TIMEOUT_BUILD_MS_VALUE}</string>
    <key>TEST_TIMEOUT_UNIT_MS</key>
    <string>${TEST_TIMEOUT_UNIT_MS_VALUE}</string>
    <key>TEST_HEARTBEAT_INTERVAL_SEC</key>
    <string>${TEST_HEARTBEAT_INTERVAL_SEC_VALUE}</string>
  </dict>

  <key>WorkingDirectory</key>
  <string>${ROOT_DIR}</string>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>StandardOutPath</key>
  <string>${STDOUT_LOG}</string>

  <key>StandardErrorPath</key>
  <string>${STDERR_LOG}</string>
</dict>
</plist>
EOF
}

is_loaded() {
  launchctl print "$SERVICE_TARGET" >/dev/null 2>&1
}

bootstrap_service() {
  if launchctl bootstrap "$DOMAIN" "$PLIST_PATH" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

fallback_is_running() {
  if [[ ! -f "$PID_FILE" ]]; then
    return 1
  fi
  local pid
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    return 0
  fi
  rm -f "$PID_FILE"
  return 1
}

fallback_start() {
  if fallback_is_running; then
    echo "Fallback runner already running (pid=$(cat "$PID_FILE"))."
    return 0
  fi
  nohup "$RUNNER_SCRIPT" >>"$STDOUT_LOG" 2>>"$STDERR_LOG" &
  local pid=$!
  sleep 1
  if kill -0 "$pid" 2>/dev/null; then
    echo "$pid" >"$PID_FILE"
    echo "Started fallback background runner (pid=$pid)."
    return 0
  fi
  echo "Failed to start fallback background runner." >&2
  return 1
}

fallback_stop() {
  if ! fallback_is_running; then
    rm -f "$PID_FILE"
    return 0
  fi
  local pid
  pid="$(cat "$PID_FILE")"
  kill "$pid" >/dev/null 2>&1 || true
  sleep 1
  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" >/dev/null 2>&1 || true
  fi
  rm -f "$PID_FILE"
}

install_service() {
  render_plist
  if is_loaded; then
    launchctl bootout "$SERVICE_TARGET" >/dev/null 2>&1 || true
  fi
  if bootstrap_service; then
    launchctl kickstart -k "$SERVICE_TARGET" >/dev/null 2>&1 || true
    echo "Installed and started ${LABEL} via launchd (${DOMAIN})"
  else
    echo "launchd bootstrap failed for ${DOMAIN}; using fallback runner."
    fallback_start
  fi
  echo "plist: $PLIST_PATH"
  echo "stdout: $STDOUT_LOG"
  echo "stderr: $STDERR_LOG"
}

start_service() {
  if [[ ! -f "$PLIST_PATH" ]]; then
    echo "Service is not installed. Run: $0 install" >&2
    exit 1
  fi
  if is_loaded || bootstrap_service; then
    launchctl kickstart -k "$SERVICE_TARGET" >/dev/null 2>&1 || true
    echo "Started ${LABEL} via launchd (${DOMAIN})"
    return 0
  fi
  echo "launchd start failed; using fallback runner."
  fallback_start
}

stop_service() {
  if is_loaded; then
    launchctl bootout "$SERVICE_TARGET"
    echo "Stopped ${LABEL} (launchd)"
  else
    fallback_stop
    echo "Stopped ${LABEL} (fallback/nohup)"
  fi
}

uninstall_service() {
  if is_loaded; then
    launchctl bootout "$SERVICE_TARGET" >/dev/null 2>&1 || true
  fi
  fallback_stop
  rm -f "$PLIST_PATH"
  echo "Uninstalled ${LABEL}"
}

status_service() {
  echo "label: $LABEL"
  echo "plist: $PLIST_PATH"
  if is_loaded; then
    echo "status: loaded"
    echo "mode: launchd (${DOMAIN})"
  elif fallback_is_running; then
    echo "status: loaded"
    echo "mode: fallback-nohup pid=$(cat "$PID_FILE")"
  else
    echo "status: not-loaded"
  fi

  if [[ -f "$RUNTIME_STATUS_FILE" ]]; then
    echo "runtime:"
    jq '{iteration, currentScore, bestScore, status, lastRun}' "$RUNTIME_STATUS_FILE" 2>/dev/null || cat "$RUNTIME_STATUS_FILE"
  else
    echo "runtime: missing ($RUNTIME_STATUS_FILE)"
  fi

  if [[ -f "$HEARTBEAT_FILE" ]]; then
    echo "heartbeat:"
    jq '{timestamp, status, supervisorPid, childPid, exitCode, testLoopInterval, targetScore, continueAfterTarget, enableImprover}' "$HEARTBEAT_FILE" 2>/dev/null || cat "$HEARTBEAT_FILE"
  else
    echo "heartbeat: missing ($HEARTBEAT_FILE)"
  fi

  if [[ -f "$STDOUT_LOG" ]]; then
    echo "stdout_tail:"
    tail -n 20 "$STDOUT_LOG"
  else
    echo "stdout_tail: missing"
  fi

  if [[ -f "$STDERR_LOG" ]]; then
    echo "stderr_tail:"
    tail -n 20 "$STDERR_LOG"
  else
    echo "stderr_tail: missing"
  fi
}

usage() {
  cat <<EOF
Usage: $0 {install|start|stop|restart|status|uninstall}

Environment overrides (optional):
  TEST_ENABLE_IMPROVER      default: 0
  TEST_LOOP_INTERVAL        default: 300000
  TEST_TARGET_SCORE         default: 95
  TEST_CONTINUE_AFTER_TARGET default: 1
  TEST_AGENT_TIMEOUT_MS     default: 900000
  TEST_STRICT_TYPECHECK     default: 0
  TEST_TIMEOUT_TYPECHECK_MS default: 180000
  TEST_TIMEOUT_LINT_MS      default: 180000
  TEST_TIMEOUT_BUILD_MS     default: 300000
  TEST_TIMEOUT_UNIT_MS      default: 180000
  TEST_HEARTBEAT_INTERVAL_SEC default: 15
EOF
}

cmd="${1:-status}"
case "$cmd" in
  install) install_service ;;
  start) start_service ;;
  stop) stop_service ;;
  restart)
    stop_service || true
    start_service
    ;;
  status) status_service ;;
  uninstall) uninstall_service ;;
  *)
    usage
    exit 1
    ;;
esac
