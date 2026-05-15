#!/usr/bin/env bash
set -euo pipefail

# Process Monitor and Auto-Restart System
# This script monitors critical processes and restarts them if they fail

LOG_DIR="${HOME}/.tnf/process-monitor/logs"
STATE_DIR="${HOME}/.tnf/process-monitor/state"
mkdir -p "$LOG_DIR" "$STATE_DIR"

LOG_FILE="${LOG_DIR}/process-monitor.log"
STATE_FILE="${STATE_DIR}/process-state.json"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE_BIN="${NODE_BIN:-$(command -v node)}"

log() {
  echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") [PROCESS-MONITOR] $*" | tee -a "$LOG_FILE"
}

# Define processes to monitor
declare -a PROCESS_NAMES=(
  "jules-loop"
  "director-agent" 
  "factory-supervisor"
  "qa-swarm"
  "swarm-supercycle"
  "relay-monitor"
)

declare -a PROCESS_COMMANDS=(
  "pnpm run jules:loop"
  "pnpm run director-agent:dev"
  "bash scripts/orchestrator/factory-supervisor.sh"
  "bash scripts/autonomous-qa-swarm-loop.sh"
  "bash scripts/swarm/run-cloud_runtime-supercycle.sh"
  "${NODE_BIN} ${ROOT_DIR}/scripts/relay-channel-monitor.cjs"
)

# Initialize state file if it doesn't exist
if [[ ! -f "$STATE_FILE" ]]; then
  echo '{}' > "$STATE_FILE"
fi

# Function to check if a process is running
is_running() {
  local process_name="$1"
  local pattern="$2"
  if pgrep -f "$pattern" >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Function to start a process
start_process() {
  local process_name="$1"
  local command="$2"
  log "Starting $process_name: $command"
  nohup bash -c "$command" > "/tmp/${process_name}.log" 2>&1 &
  sleep 2  # Give it a moment to start
}

# Function to update state using a temporary file to avoid quoting issues
update_state() {
  local process_name="$1"
  local status="$2"
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # Use jq with proper escaping
  TMP_FILE=$(mktemp)
  jq --arg name "$process_name" --arg status "$status" --arg timestamp "$timestamp" \
     '.[$name] = {status: $status, timestamp: $timestamp}' "$STATE_FILE" > "$TMP_FILE" && \
  mv "$TMP_FILE" "$STATE_FILE"
}

# Main monitoring loop
log "Starting process monitor"

while true; do
  for i in "${!PROCESS_NAMES[@]}"; do
    process_name="${PROCESS_NAMES[$i]}"
    command="${PROCESS_COMMANDS[$i]}"
    
    if is_running "$process_name" "$command"; then
      if [[ "$(jq -r ".[\"$process_name\"].status // \"unknown\"" "$STATE_FILE")" != "running" ]]; then
        log "$process_name is now running"
        update_state "$process_name" "running"
      fi
    else
      log "$process_name is NOT running - attempting restart"
      update_state "$process_name" "failed"
      start_process "$process_name" "$command"
      update_state "$process_name" "restarted"
    fi
  done
  
  # Sleep for 30 seconds before next check
  sleep 30
done
