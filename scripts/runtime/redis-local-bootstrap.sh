#!/usr/bin/env bash
# Start or restart local Redis with TNF fleet-safe defaults.
set -euo pipefail

REDIS_BIN="${REDIS_SERVER:-$(command -v redis-server)}"
REDIS_CLI="${REDIS_CLI:-$(command -v redis-cli)}"
PORT="${REDIS_PORT:-6379}"
BIND="${REDIS_BIND:-127.0.0.1}"
MAXCLIENTS="${REDIS_MAXCLIENTS:-10000}"
MAXMEMORY="${REDIS_MAXMEMORY:-256mb}"
LOG_FILE="${REDIS_LOG_FILE:-/tmp/tnf-redis-local.log}"
CLIENT_WARN="${REDIS_CLIENT_WARN:-8000}"

usage() {
  echo "Usage: $0 <start|restart|status|gate>"
  echo "  start   — start redis-server if not reachable"
  echo "  restart — force restart with maxclients=${MAXCLIENTS}"
  echo "  status  — ping + client count"
  echo "  gate    — exit 0 only if ping ok and clients < ${CLIENT_WARN}"
}

redis_ping() {
  "${REDIS_CLI}" -h "${BIND}" -p "${PORT}" ping >/dev/null 2>&1
}

redis_clients() {
  "${REDIS_CLI}" -h "${BIND}" -p "${PORT}" INFO clients 2>/dev/null | awk -F: '/^connected_clients:|^maxclients:/ {gsub(/\r/,"",$2); print $2}' | paste - - | awk '{print $1" "$2}'
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
  "${REDIS_BIN}" --daemonize yes --port "${PORT}" --bind "${BIND}" \
    --maxclients "${MAXCLIENTS}" --maxmemory "${MAXMEMORY}" \
    --maxmemory-policy allkeys-lru --logfile "${LOG_FILE}" || true
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
  *) usage; exit 1 ;;
esac
