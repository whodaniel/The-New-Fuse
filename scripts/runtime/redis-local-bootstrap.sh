#!/usr/bin/env bash
# Start or restart local Redis with TNF fleet-safe defaults.
set -euo pipefail

REDIS_BIN="${REDIS_SERVER:-$(command -v redis-server)}"
REDIS_CLI="${REDIS_CLI:-$(command -v redis-cli)}"
PORT="${REDIS_PORT:-6379}"
BIND="${REDIS_BIND:-127.0.0.1}"
MAXCLIENTS="${REDIS_MAXCLIENTS:-10000}"
MAXMEMORY="${REDIS_MAXMEMORY:-256mb}"
TNF_HOME="${TNF_HOME:-$HOME/.tnf}"
REDIS_DIR="${TNF_REDIS_DIR:-$TNF_HOME/redis}"
LOG_DIR="${TNF_LOG_DIR:-$TNF_HOME/logs}"
REDIS_CONF="${TNF_REDIS_CONF:-$REDIS_DIR/redis.conf}"
LOG_FILE="${REDIS_LOG_FILE:-$LOG_DIR/redis.log}"
CLIENT_WARN="${REDIS_CLIENT_WARN:-8000}"
LABEL="com.thenewfuse.redis-tnf-bus"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
LAUNCH_DOMAIN="gui/$(id -u)"

usage() {
  echo "Usage: $0 <start|restart|status|gate|launchd-install|launchd-start>"
  echo "  start          — start redis-server if not reachable"
  echo "  restart        — force restart with maxclients=${MAXCLIENTS}"
  echo "  status  — ping + client count"
  echo "  gate    — exit 0 only if ping ok and clients < ${CLIENT_WARN}"
  echo "  launchd-install/start — macOS LaunchAgent with StartInterval, not KeepAlive"
}

redis_ping() {
  "${REDIS_CLI}" -h "${BIND}" -p "${PORT}" ping >/dev/null 2>&1
}

redis_clients() {
  "${REDIS_CLI}" -h "${BIND}" -p "${PORT}" INFO clients 2>/dev/null | awk -F: '/^connected_clients:|^maxclients:/ {gsub(/\r/,"",$2); print $2}' | paste - - | awk '{print $1" "$2}'
}

write_redis_conf() {
  mkdir -p "$REDIS_DIR" "$LOG_DIR"
  cat >"$REDIS_CONF" <<CONF
bind 127.0.0.1 ::1
protected-mode yes
port ${PORT}
tcp-backlog 511
timeout 0
tcp-keepalive 300
save 900 1
save 300 100
save 60 10000
stop-writes-on-bgsave-error no
dir ${REDIS_DIR}
dbfilename dump.rdb
appendonly no
logfile ${LOG_FILE}
daemonize no
maxmemory ${MAXMEMORY}
maxmemory-policy allkeys-lru
CONF
}

start_redis() {
  if ! command -v "${REDIS_BIN}" >/dev/null 2>&1; then
    echo "ERROR: redis-server not found" >&2
    exit 1
  fi
  if redis_ping; then
    echo "Redis already reachable on ${BIND}:${PORT}"
    redis_clients || true
    return 0
  fi
  write_redis_conf
  "${REDIS_BIN}" "$REDIS_CONF" --daemonize yes --maxclients "${MAXCLIENTS}" || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    if redis_ping; then
      echo "Started Redis on ${BIND}:${PORT} (maxclients=${MAXCLIENTS})"
      redis_clients || true
      return 0
    fi
  done
  echo "ERROR: Redis failed to start" >&2
  exit 1
}

launchd_install() {
  [[ "$(uname -s)" == "Darwin" ]] || {
    echo "launchd is only available on macOS" >&2
    exit 1
  }
  if [[ -z "$REDIS_BIN" || ! -x "$REDIS_BIN" ]]; then
    echo "ERROR: redis-server not found" >&2
    exit 1
  fi
  mkdir -p "$(dirname "$PLIST_PATH")"
  write_redis_conf
  cat >"$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${REDIS_BIN}</string>
    <string>${REDIS_CONF}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${REDIS_DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>StartInterval</key>
  <integer>300</integer>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/redis-stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/redis-stderr.log</string>
  <key>ProcessType</key>
  <string>Background</string>
</dict>
</plist>
PLIST
  plutil -lint "$PLIST_PATH" >/dev/null
  echo "installed: $LABEL"
}

launchd_start() {
  launchd_install
  if ! launchctl print "$LAUNCH_DOMAIN/$LABEL" >/dev/null 2>&1; then
    launchctl bootstrap "$LAUNCH_DOMAIN" "$PLIST_PATH" >/dev/null 2>&1 || launchctl load -w "$PLIST_PATH"
  fi
  launchctl enable "$LAUNCH_DOMAIN/$LABEL" >/dev/null 2>&1 || true
  launchctl kickstart "$LAUNCH_DOMAIN/$LABEL" >/dev/null 2>&1 || true
  for _ in 1 2 3 4 5; do
    sleep 1
    redis_ping && {
      echo "Redis launchd service reachable on ${BIND}:${PORT}"
      return 0
    }
  done
  echo "WARN: Redis launchd service not reachable yet" >&2
}

restart_redis() {
  pkill -9 redis-server 2>/dev/null || true
  sleep 2
  start_redis
}

status_redis() {
  if redis_ping; then
    echo "Redis: PONG (${BIND}:${PORT})"
    read -r connected maxclients <<<"$(redis_clients || echo '? ?')"
    echo "Clients: ${connected:-?} / ${maxclients:-?}"
  else
    echo "Redis: DOWN"
    exit 1
  fi
}

gate_redis() {
  if ! redis_ping; then
    echo "gate: redis down"
    exit 1
  fi
  read -r connected maxclients <<<"$(redis_clients || echo '99999 10000')"
  if [[ "${connected}" =~ ^[0-9]+$ ]] && (( connected >= CLIENT_WARN )); then
    echo "gate: redis clients ${connected} >= warn ${CLIENT_WARN}"
    exit 1
  fi
  echo "gate: ok (clients=${connected:-?}/${maxclients:-?})"
}

case "${1:-}" in
  start) start_redis ;;
  restart) restart_redis ;;
  status) status_redis ;;
  gate) gate_redis ;;
  launchd-install) launchd_install ;;
  launchd-start) launchd_start ;;
  *) usage; exit 1 ;;
esac
