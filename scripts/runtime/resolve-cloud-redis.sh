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
  if ! command -v cloud_runtime >/dev/null 2>&1; then
    return 1
  fi

  local kv
  kv="$(cloud_runtime variable list --service Redis -e "${CLOUD_RUNTIME_ENVIRONMENT_NAME}" -k 2>/dev/null || true)"
  if [[ -z "${kv}" ]]; then
    return 1
  fi

  local val
  if running_inside_cloud_runtime; then
    val="$(printf "%s\n" "${kv}" | sed -n 's/^REDIS_URL=//p' | head -n1)"
    if emit_if_valid "${val}" "cloud_runtime:Redis:REDIS_URL"; then
      return 0
    fi
    val="$(printf "%s\n" "${kv}" | sed -n 's/^REDIS_PUBLIC_URL=//p' | head -n1)"
    if emit_if_valid "${val}" "cloud_runtime:Redis:REDIS_PUBLIC_URL"; then
      return 0
    fi
  else
    val="$(printf "%s\n" "${kv}" | sed -n 's/^REDIS_PUBLIC_URL=//p' | head -n1)"
    if emit_if_valid "${val}" "cloud_runtime:Redis:REDIS_PUBLIC_URL"; then
      return 0
    fi
    val="$(printf "%s\n" "${kv}" | sed -n 's/^REDIS_URL=//p' | head -n1)"
    if emit_if_valid "${val}" "cloud_runtime:Redis:REDIS_URL"; then
      return 0
    fi
  fi

  local host port user pass
  host="$(printf "%s\n" "${kv}" | sed -n 's/^REDISHOST=//p' | head -n1)"
  port="$(printf "%s\n" "${kv}" | sed -n 's/^REDISPORT=//p' | head -n1)"
  user="$(printf "%s\n" "${kv}" | sed -n 's/^REDISUSER=//p' | head -n1)"
  pass="$(printf "%s\n" "${kv}" | sed -n 's/^REDISPASSWORD=//p' | head -n1)"
  if [[ -n "${host}" && -n "${port}" && -n "${user}" && -n "${pass}" ]]; then
    val="redis://${user}:${pass}@${host}:${port}"
    if emit_if_valid "${val}" "cloud_runtime:Redis:host-port"; then
      return 0
    fi
  fi

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
