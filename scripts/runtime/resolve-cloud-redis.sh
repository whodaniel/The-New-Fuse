#!/usr/bin/env bash
set -euo pipefail

# Resolve a Redis URL with production-first precedence:
# 1) Explicit env vars (REDIS_URL, CloudRuntime-provided aliases)
# 2) CloudRuntime service vars for Redis (if cloud_runtime CLI is linked/authenticated)
# 3) Optional local fallback (only when explicitly allowed)

ALLOW_LOCAL_REDIS="${ALLOW_LOCAL_REDIS:-false}"
CLOUD_RUNTIME_ENVIRONMENT_NAME="${CLOUD_RUNTIME_ENVIRONMENT_NAME:-production}"

is_local_url() {
  local url="${1:-}"
  [[ "${url}" == *"localhost"* ]] || [[ "${url}" == *"127.0.0.1"* ]]
}

is_internal_cloud_runtime_url() {
  local url="${1:-}"
  [[ "${url}" == *"cloud_runtime.internal"* ]]
}

running_inside_cloud_runtime() {
  [[ -n "${CLOUD_RUNTIME_SERVICE_ID:-}" ]] || [[ -n "${CLOUD_RUNTIME_PRIVATE_DOMAIN:-}" ]] || [[ -n "${CLOUD_RUNTIME_ENVIRONMENT_ID:-}" ]]
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
  if is_internal_cloud_runtime_url "${url}" && ! running_inside_cloud_runtime; then
    return 1
  fi
  printf "%s\n" "${url}"
  echo "[resolve-cloud-redis] source=${source}" >&2
  return 0
}

try_env_sources() {
  local keys=()
  if running_inside_cloud_runtime; then
    keys=(
      REDIS_URL
      CLOUD_RUNTIME_REDIS_URL
      LIVE_REDIS_URL
      REDIS_PRIVATE_URL
      REDIS_TLS_URL
      REDIS_PUBLIC_URL
    )
  else
    keys=(
      REDIS_PUBLIC_URL
      REDIS_URL
      CLOUD_RUNTIME_REDIS_URL
      LIVE_REDIS_URL
      REDIS_PRIVATE_URL
      REDIS_TLS_URL
    )
  fi
  local key
  for key in "${keys[@]}"; do
    local value="${!key:-}"
    if emit_if_valid "${value}" "env:${key}"; then
      return 0
    fi
  done
  return 1
}

try_cloud_runtime_sources() {
  # Legacy Railway/cloud_runtime Redis discovery retired.
  # Prefer REDIS_URL / Upstash env vars (see try_env_sources).
  return 1
}

main() {
  if try_env_sources; then
    exit 0
  fi

  if try_cloud_runtime_sources; then
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
