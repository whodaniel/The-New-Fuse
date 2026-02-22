#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

LOG_DIR=".agent/runtime-logs/qa-swarm"
mkdir -p "$LOG_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$LOG_DIR/qa-loop-$STAMP.log"

log() {
  echo "[$(date +%H:%M:%S)] [QA-SWARM] $*" | tee -a "$LOG_FILE"
}

log "🚨 Initiating CONSTANT QA Swarm Loop."
log "Specialty agents will continuously test Frontend & Backend until fully production ready."
JULES_GUARD_SCRIPT="$ROOT_DIR/scripts/jules-task-guard.sh"

# Infinite loop
while true; do
  log "--------------------------------------------------------"
  log "🔍 Running comprehensive system health-check (Build, Lint, Tests, Types)..."
  
  if pnpm run health-check:full > "$LOG_DIR/last-health-check.log" 2>&1; then
    log "✅ All tests passed! The system is solid."
    log "💤 Resting for 5 minutes before next swarm testing cycle..."
    sleep 300
  else
    log "❌ Issues detected! Delegating fixes to specialized agents..."
    
    # Extract the tail of the error for context
    ERROR_TAIL="$(tail -n 50 "$LOG_DIR/last-health-check.log")"
    
    # Generate a dynamic task file for Jules/TNF Agent
    TASK_FILE="$LOG_DIR/fix-task-$(date +%s).md"
    cat <<TASK > "$TASK_FILE"
# Swarm QA Task: Fix System Health Check Failure

The autonomous QA swarm detected a failure during 'pnpm run health-check:full'. 
Please analyze the logs and fix the underlying issue in the frontend or backend.

## Error Logs:
\`\`\`text
${ERROR_TAIL}
\`\`\`

## Instructions:
1. Identify if this is a frontend, backend, or shared module issue.
2. Fix the typing, testing, or build errors.
3. Validate locally before completing.
TASK
    
    log "🤖 Delegating to Jules (Backend/Core Agent)..."
    if command -v jules >/dev/null 2>&1; then
      JULES_PROMPT="Fix system failure from automated health-check logs only. Do not perform manual frontend/browser viewing."
      if bash "$JULES_GUARD_SCRIPT" --text "$JULES_PROMPT" --file "$TASK_FILE"; then
        jules new "$JULES_PROMPT" --file "$TASK_FILE" || log "Jules invocation failed, continuing..."
      else
        log "⛔ Blocked delegation to Jules: manual frontend/browser task intent detected."
      fi
      
      # Run the autonomous loop to auto-approve & merge
      log "🔄 Running Jules autonomous PR lifecycle..."
      pnpm run jules:loop || true
    else
      log "⚠️ Jules CLI not found. Falling back to simple Orchestrator task..."
    fi
    
    # Publish to Redis Queue if Improver/Swarm is running
    export QUEUE_KEY="tnf:master:tasks:pending"
    if command -v redis-cli >/dev/null 2>&1; then
      log "📡 Broadcasting task to active swarm nodes via Redis."
      PAYLOAD="{\"id\":\"qa-task-$(date +%s)\",\"title\":\"Autonomous QA Fix\",\"description\":\"Fix health-check failure\",\"priority\":\"high\",\"status\":\"pending\"}"
      redis-cli LPUSH "$QUEUE_KEY" "$PAYLOAD" >/dev/null || true
    fi

    log "⏱️ Waiting for agents to resolve the issue (Sleeping 3 minutes)..."
    sleep 180
  fi
done
