#!/usr/bin/env bash
# Launchd-safe Node entrypoint for optional local TNF services.
# Missing build artifacts, optional env files, or delayed TCP dependencies defer
# cleanly with exit 0 so launchd does not create a boot-time restart storm.
set -euo pipefail

label="${1:?missing launchd label}"
work_dir="${2:?missing working directory}"
node_bin="${3:?missing node binary}"
entrypoint="${4:?missing node entrypoint}"
shift 4

log() {
  printf '[%s] [%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$label" "$*" >&2
}

defer() {
  log "deferred: $*"
  exit 0
}

[[ -x "$node_bin" ]] || defer "node binary not executable: $node_bin"
[[ -d "$work_dir" ]] || defer "working directory missing: $work_dir"
[[ -f "$entrypoint" ]] || defer "entrypoint missing: $entrypoint"

if [[ -n "${TNF_LAUNCHD_REQUIRED_FILES:-}" ]]; then
  IFS=':' read -r -a required_files <<<"$TNF_LAUNCHD_REQUIRED_FILES"
  for required_file in "${required_files[@]}"; do
    [[ -z "$required_file" || -f "$required_file" ]] && continue
    defer "required file missing: $required_file"
  done
fi

env_args=()
if [[ -n "${TNF_LAUNCHD_ENV_FILES:-}" ]]; then
  IFS=':' read -r -a env_files <<<"$TNF_LAUNCHD_ENV_FILES"
  for env_file in "${env_files[@]}"; do
    [[ -z "$env_file" ]] && continue
    if [[ -f "$env_file" ]]; then
      env_args+=("--env-file=$env_file")
    else
      log "optional env file absent: $env_file"
    fi
  done
fi

if [[ -n "${TNF_LAUNCHD_WAIT_TCP:-}" ]]; then
  host="${TNF_LAUNCHD_WAIT_TCP%:*}"
  port="${TNF_LAUNCHD_WAIT_TCP##*:}"
  if [[ -z "$host" || -z "$port" || "$host" == "$port" ]]; then
    defer "invalid TNF_LAUNCHD_WAIT_TCP=$TNF_LAUNCHD_WAIT_TCP"
  fi
  if ! nc -z -G "${TNF_LAUNCHD_WAIT_SECONDS:-2}" "$host" "$port" >/dev/null 2>&1; then
    defer "TCP dependency unavailable: $host:$port"
  fi
fi

cd "$work_dir"
if ((${#env_args[@]} > 0)); then
  exec "$node_bin" "${env_args[@]}" "$entrypoint" "$@"
fi
exec "$node_bin" "$entrypoint" "$@"
