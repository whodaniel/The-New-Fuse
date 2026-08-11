#!/usr/bin/env bash
# Durable local Redis for TNF (:6379). Prefer launchd when it can exec; fall
# back to a nohup pidfile when launchd stalls in xpcproxy (seen on older macOS).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TNF_HOME="${TNF_HOME:-$HOME/.tnf}"
REDIS_BIN="${TNF_REDIS_SERVER_BIN:-$(command -v redis-server || true)}"
CONF="${TNF_HOME}/redis/redis.conf"
PID_FILE="${TNF_HOME}/redis/redis-service.pid"
LOG_FILE="${TNF_HOME}/logs/redis-service.log"
LABEL="com.thenewfuse.redis-tnf-bus"
DOMAIN="gui/$(id -u)"

mkdir -p "${TNF_HOME}/redis" "${TNF_HOME}/logs"

ensure_conf() {
  if [[ ! -f "$CONF" ]]; then
    bash "$ROOT_DIR/scripts/runtime/tnf-local-launchd-services.sh" install >/dev/null
  fi
  if ! grep -q '^pidfile ' "$CONF" 2>/dev/null; then
    printf '\npidfile %s\n' "${TNF_HOME}/redis/redis.pid" >>"$CONF"
  fi
}

is_up() {
  redis-cli -h 127.0.0.1 ping 2>/dev/null | grep -q PONG
}

start_nohup() {
  ensure_conf
  if is_up; then
    echo "redis already accepting connections on 127.0.0.1:6379"
    return 0
  fi
  [[ -n "$REDIS_BIN" && -x "$REDIS_BIN" ]] || {
    echo "redis-server not found" >&2
    return 1
  }
  nohup "$REDIS_BIN" "$CONF" >>"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
  for _ in $(seq 1 20); do
    if is_up; then
      echo "redis started (pid=$(cat "$PID_FILE")) via nohup"
      return 0
    fi
    sleep 0.25
  done
  echo "redis failed to become ready; see $LOG_FILE" >&2
  return 1
}

stop_nohup() {
  if [[ -f "$PID_FILE" ]]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null || true
    rm -f "$PID_FILE"
  fi
  redis-cli -h 127.0.0.1 shutdown nosave 2>/dev/null || true
}

cmd="${1:-status}"
case "$cmd" in
  install)
    bash "$ROOT_DIR/scripts/runtime/tnf-local-launchd-services.sh" install
    ;;
  start)
    if is_up; then
      echo "redis already up"
      exit 0
    fi
    if launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then
      launchctl kickstart "$DOMAIN/$LABEL" >/dev/null 2>&1 || true
      for _ in $(seq 1 10); do
        if is_up; then
          echo "redis up via launchd"
          exit 0
        fi
        sleep 0.5
      done
      echo "launchd redis did not become ready; falling back to nohup" >&2
      launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    fi
    start_nohup
    ;;
  stop)
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    stop_nohup
    echo "redis stop requested"
    ;;
  status)
    if is_up; then
      echo "redis: up"
      redis-cli -h 127.0.0.1 info server 2>/dev/null | grep -E 'redis_version|uptime_in_seconds|tcp_port' || true
      exit 0
    fi
    echo "redis: down"
    exit 1
    ;;
  *)
    echo "usage: $0 {install|start|stop|status}" >&2
    exit 2
    ;;
esac
