#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

LOG_DIR=".agent/runtime-logs/antigravity-manager"
mkdir -p "$LOG_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$LOG_DIR/manager-$STAMP.log"

log() {
  echo "[$(date +%H:%M:%S)] [Antigravity-Manager] $*" | tee -a "$LOG_FILE"
}

log "🚨 Antigravity is now in charge!"
log "Executing continuous testing and delegation loop..."
JULES_GUARD_SCRIPT="$ROOT_DIR/scripts/jules-task-guard.sh"

while true; do
  log "--------------------------------------------------------"
  log "🔍 Running the Website Testing Agent..."
  
  # Run the user's testing script
  if node scripts/swarm/website-testing-agent.cjs > "$LOG_DIR/latest-test.log" 2>&1; then
    log "✅ Everything passing perfectly. Resting for 2 minutes."
    sleep 120
  else
    log "❌ Issues detected! Delegating to Jules..."
    REPORT_FILE=$(ls -t .agent/test-reports/*.json | head -n 1 2>/dev/null || echo "")
    
    if [ -n "$REPORT_FILE" ]; then
      log "Report found: $REPORT_FILE"
      
      # Use jules to fix the errors
      if command -v jules >/dev/null 2>&1; then
        JULES_PROMPT="Fix failing tests based on the latest QA swarm report. Please use logs and automated checks only; no manual frontend browser viewing."
        if bash "$JULES_GUARD_SCRIPT" --text "$JULES_PROMPT" --file "$REPORT_FILE"; then
          jules new "$JULES_PROMPT" --file "$REPORT_FILE" || true
        else
          log "⛔ Blocked delegation to Jules: manual frontend/browser task intent detected."
        fi
      else
        log "⚠️ Jules CLI not found. Falling back to simple logging for now."
      fi
    fi
    
    log "⏱️ Waiting for agents to resolve the issue (Sleeping 3 minutes)..."
    sleep 180
  fi
done
