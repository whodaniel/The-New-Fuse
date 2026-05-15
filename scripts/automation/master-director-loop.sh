#!/usr/bin/env bash
# TNF Master Director Loop
# Version: 1.0.0-AUTO
# Mandate: Continuous autonomous perfection of The New Fuse platform.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

LOG_DIR=".agent/runtime-logs/master-director"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/master-loop.log"

log() {
  echo "[$(date +%H:%M:%S)] [MASTER-DIRECTOR] $*" | tee -a "$LOG_FILE"
}

# 1. Initialize Sub-Loops
log "🚀 Starting Sub-Loops..."

# QA Swarm Loop (Find/Fix Bugs)
if ! pgrep -f "scripts/autonomous-qa-swarm-loop.sh" > /dev/null; then
  log "Starting QA Swarm Loop..."
  bash scripts/autonomous-qa-swarm-loop.sh &
fi

# Jules Followup Daemon (Auto-Merge)
if ! pgrep -f "scripts/jules-followup-daemon.sh" > /dev/null; then
  log "Starting Jules Followup Daemon..."
  bash scripts/jules-followup-start.sh &
fi

# 2. Main Orchestration Loop
while true; do
  log "--------------------------------------------------------"
  log "🧠 Synchronizing Brain & State..."
  # Replace placeholders in brain_sync.sh if they exist, or just run it
  # Note: brain_sync.sh paths should remain env-driven and portable
  
  log "🔄 Running System Health Check & Deployment Pipe..."
  if pnpm run health-check:full > "$LOG_DIR/health-check.log" 2>&1; then
    log "✅ System Health: PERFECT. Checking for pending deployment..."
    
    # Check if there are changes to push
    if [[ -n "$(git status --porcelain)" ]]; then
      log "📦 Local changes detected. Deploying to Cloudflare & GitHub..."
      # Generate mandatory handoff artifacts
      node scripts/protocols/emit-session-handoff.cjs || log "⚠️ Handoff generation failed"
      
      (cd apps/frontend && pnpm build && npx wrangler pages deploy dist --project-name thenewfuse-main --branch main --commit-dirty=true) || log "⚠️ Cloudflare deploy failed"
      
      git add .
      git commit -m "chore(auto): autonomous platform perfection update [$(date +%Y-%m-%d)]" || true
      git push origin main || log "⚠️ GitHub push failed"
    fi
  else
    log "❌ System Health: DEGRADED. QA Swarm is already addressing issues."
  fi

  log "📡 Dispatching Strategic Batch to Swarm..."
  # Every cycle, we find something new to improve
  # Bolt: Performance
  jules new --repo whodaniel/the-new-fuse-next-gen "You are 'Bolt' ⚡. Find the slowest part of the API or Frontend and optimize it by 10%." || true
  
  # Palette: UI/UX
  jules new --repo whodaniel/the-new-fuse-next-gen "You are 'Palette' 🎨. Identify one component that lacks interactive feedback and add a subtle animation or loading state." || true

  log "💤 Cycle complete. Resting for 10 minutes..."
  sleep 600
done
