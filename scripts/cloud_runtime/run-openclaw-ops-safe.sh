#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SYNC_SCRIPT="$ROOT_DIR/scripts/cloud_runtime/sync-openclaw-codex-tenants.sh"
VERIFY_SCRIPT="$ROOT_DIR/scripts/cloud_runtime/verify-adaptive-routing.sh"
CONFIG_FILE="${OPENCLAW_CODEX_TENANTS_CONFIG:-$ROOT_DIR/scripts/cloud_runtime/openclaw-codex-tenants.json}"
MAX_ATTEMPTS="${OPENCLAW_OPS_MAX_ATTEMPTS:-6}"
SLEEP_SECONDS="${OPENCLAW_OPS_SLEEP_SECONDS:-8}"
LOG_DIR="${OPENCLAW_OPS_LOG_DIR:-$ROOT_DIR/.agent/logs/openclaw-ops}"
STAMP="$(date -u +"%Y%m%d-%H%M%S")"
LOG_FILE="$LOG_DIR/run-$STAMP.log"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $1"
    exit 1
  fi
}

need_cmd bash
need_cmd tee
need_cmd date

if [ ! -f "$CONFIG_FILE" ]; then
  echo "ERROR: config file not found: $CONFIG_FILE"
  exit 1
fi

mkdir -p "$LOG_DIR"

run_with_retries() {
  local name="$1"
  shift
  local attempt
  for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $name attempt $attempt/$MAX_ATTEMPTS"
    if "$@"; then
      echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $name success"
      return 0
    fi
    if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
      echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $name failed; sleeping ${SLEEP_SECONDS}s"
      sleep "$SLEEP_SECONDS"
    fi
  done
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $name failed after $MAX_ATTEMPTS attempts"
  return 1
}

{
  echo "OpenClaw safe ops run"
  echo "timestamp_utc=$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "config=$CONFIG_FILE"
  echo "max_attempts=$MAX_ATTEMPTS"
  echo "sleep_seconds=$SLEEP_SECONDS"
  echo

  run_with_retries "tenant-sync" bash "$SYNC_SCRIPT" --config "$CONFIG_FILE" --no-wait
  run_with_retries "adaptive-verify" bash "$VERIFY_SCRIPT"

  echo
  echo "All operations completed successfully."
} | tee "$LOG_FILE"

echo "Log: $LOG_FILE"
