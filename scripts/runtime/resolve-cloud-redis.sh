#!/usr/bin/env bash
set -euo pipefail

# Resolve a Redis URL with production-first precedence:
# 1) Explicit env vars (REDIS_URL and the aliases relay-core also honours)
# 2) Optional local fallback (only when explicitly allowed)
#
# History: this script used to probe Railway service vars and the `cloud_runtime`
# CLI. Railway is retired and `cloud_runtime` is not a real binary (it is the
# artifact of a blind railway -> cloud_runtime string-replace in 62b2a3e2f), so
# every CLOUD_RUNTIME_* branch here was permanently unreachable and has been
# removed. TNF now runs local Redis + a WebSocket bus per node, with Upstash
# Cloud Redis for hosted (paid-tier) deployments on GCP Cloud Run.
#
# Note: Upstash's REST interface (UPSTASH_REDIS_REST_URL / _REST_TOKEN, used by
# packages/infrastructure/src/redis/RedisConfig.ts and cloudflare-sharedstate)
# is an https:// endpoint, not a redis:// URL, so it is deliberately NOT part of
# the resolution list below. Set REDIS_URL (rediss://) for TCP clients.

ALLOW_LOCAL_REDIS="${ALLOW_LOCAL_REDIS:-false}"

is_local_url() {
  local url="${1:-}"
  [[ "${url}" == *"localhost"* ]] || [[ "${url}" == *"127.0.0.1"* ]]
}

emit_if_valid() {
  local url="${1:-}"
  local source="${2:-unknown}"
  if [[ -z "${url}" ]]; then
    return 1
  fi
  if is_local_url "${url}" && [[ "${ALLOW_LOCAL_REDIS}" != "true" ]]; then
    return 1
  fi
  printf "%s\n" "${url}"
  echo "[resolve-cloud-redis] source=${source}" >&2
  return 0
}

try_env_sources() {
  # Same precedence in cloud and locally: the old split existed only to prefer
  # Railway's REDIS_PUBLIC_URL outside the platform, and nothing sets that now.
  local keys=(
    REDIS_URL
    LIVE_REDIS_URL
    REDIS_PRIVATE_URL
    REDIS_TLS_URL
  )
  local key
  for key in "${keys[@]}"; do
    local value="${!key:-}"
    if emit_if_valid "${value}" "env:${key}"; then
      return 0
    fi
  done
  return 1
}

main() {
  if try_env_sources; then
    exit 0
  fi

  if [[ "${ALLOW_LOCAL_REDIS}" == "true" ]]; then
    echo "redis://localhost:6379"
    echo "[resolve-cloud-redis] source=local:fallback" >&2
    exit 0
  fi

  echo "[resolve-cloud-redis] failed: no production Redis URL resolved" >&2
  exit 1
}

main "$@"
