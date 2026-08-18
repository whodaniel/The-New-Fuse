#!/usr/bin/env bash
# Persist TNF local SearXNG (:8080) via docker compose.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.searxng.yml"
BASE_URL="${SEARXNG_BASE_URL:-http://127.0.0.1:8080}"

need_docker() {
  if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Start Docker Desktop, then retry." >&2
    exit 1
  fi
}

wait_health() {
  local i code
  for i in $(seq 1 40); do
    code="$(curl -sS -m 2 -o /dev/null -w '%{http_code}' "${BASE_URL}/" 2>/dev/null || echo 000)"
    if [[ "$code" != "000" && "$code" != "000000" ]]; then
      echo "SearXNG healthy (${BASE_URL} -> HTTP ${code})"
      return 0
    fi
    sleep 2
  done
  echo "WARN: SearXNG not healthy yet — docker compose -f ${COMPOSE_FILE} logs searxng" >&2
  return 1
}

install() {
  need_docker
  # Adopt legacy orphan container if compose wants the same name.
  if docker ps -a --format '{{.Names}}' | grep -qx 'tnf-searxng'; then
    if ! docker compose -f "$COMPOSE_FILE" ps --status running 2>/dev/null | grep -q searxng; then
      echo "Removing legacy tnf-searxng container so compose can own it"
      docker rm -f tnf-searxng >/dev/null 2>&1 || true
    fi
  fi
  docker compose -f "$COMPOSE_FILE" up -d
  wait_health || true
}

start() { install; }

stop() {
  need_docker
  docker compose -f "$COMPOSE_FILE" stop
}

uninstall() {
  need_docker
  docker compose -f "$COMPOSE_FILE" down
}

status() {
  need_docker
  docker compose -f "$COMPOSE_FILE" ps
  echo "-- health"
  curl -sS -m 2 -o /dev/null -w "HTTP %{http_code}\n" "${BASE_URL}/" || echo down
}

case "${1:-}" in
  install|start) start ;;
  stop) stop ;;
  uninstall) uninstall ;;
  status) status ;;
  *)
    echo "Usage: $0 <install|start|stop|uninstall|status>"
    exit 1
    ;;
esac
