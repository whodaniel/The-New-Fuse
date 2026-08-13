#!/usr/bin/env bash
# tnf-single-instance-guard.sh — Bash sourceable single-instance guard
# Usage: source scripts/lib/tnf-single-instance-guard.sh
#        tnf_single_instance_guard <lock-name> [stale-seconds]
#        if [[ $? -ne 0 ]]; then exit 0; fi

tnf_single_instance_guard() {
  local lock_name="${1:?lock-name required}"
  local stale_seconds="${2:-120}"
  local lock_dir="${TMPDIR:-/tmp}/tnf-instance-locks"
  local lock_file="${lock_dir}/${lock_name}.lock"

  mkdir -p "${lock_dir}"

  # Check for existing lock
  if [[ -f "${lock_file}" ]]; then
    local lock_mtime lock_age
    lock_mtime="$(stat -f '%m' "${lock_file}" 2>/dev/null || stat -c '%Y' "${lock_file}" 2>/dev/null || echo 0)"
    lock_age=$(( $(date +%s) - lock_mtime ))
    if (( lock_age < stale_seconds )); then
      local existing_pid
      existing_pid="$(cat "${lock_file}" 2>/dev/null || echo '?')"
      echo "{\"ok\":true,\"skipped\":\"already-running\",\"lock\":{\"name\":\"${lock_name}\",\"pid\":${existing_pid},\"age_sec\":${lock_age}}}"
      return 1
    fi
    # Stale — reclaim
    rm -f "${lock_file}"
  fi

  # Write our PID
  echo "$$" > "${lock_file}"
  # Set up exit trap to clean up
  trap 'rm -f "${lock_file}"' EXIT

  return 0
}
