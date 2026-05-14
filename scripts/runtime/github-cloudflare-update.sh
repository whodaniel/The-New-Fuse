#!/usr/bin/env bash
set -euo pipefail

# GitHub and Cloudflare Auto-Update Script
# This script commits and pushes changes to GitHub, syncs repos, and deploys to Cloudflare

LOG_DIR="${HOME}/.tnf/github-cloudflare-update/logs"
STATE_DIR="${HOME}/.tnf/github-cloudflare-update/state"
mkdir -p "$LOG_DIR" "$STATE_DIR"

LOG_FILE="${LOG_DIR}/github-cloudflare-update.log"
STATE_FILE="${STATE_DIR}/last-update.json"

log() {
  echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") [GITHUB-CLOUDFLARE-UPDATE] $*" | tee -a "$LOG_FILE"
}

# Initialize state file if it doesn't exist
if [[ ! -f "$STATE_FILE" ]]; then
  echo '{}' > "$STATE_FILE"
fi

# Function to update state
update_state() {
  local key="$1"
  local value="$2"
  local state_data
  state_data=$(jq --arg key "$key" --arg value "$value" '.[$key] = $value' "$STATE_FILE")
  echo "$state_data" > "$STATE_FILE"
}

# Function to check if there are changes in the repo (excluding certain files)
has_changes() {
  # Ignore process monitor logs, runtime state/logs, and other temporary files
  local ignore_pattern=".tnf/process-monitor|\.agent/runtime-logs|\.agent/runtime-state|node_modules|\.tmp|\.cache|dist|\.tsbuildinfo"
  if [[ -n "$(git status --porcelain | grep -vE "$ignore_pattern" | head -n 1)" ]]; then
    return 0
  else
    return 1
  fi
}

# Function to commit and push to GitHub
git_push() {
  local commit_message="$1"
  log "Checking for changes..."
  if has_changes; then
    log "Changes detected. Committing and pushing to GitHub..."
    git add -A
    git commit -m "$commit_message"
    git push origin HEAD
    log "Push to GitHub complete."
    update_state "last_github_push" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  else
    log "No changes to push to GitHub."
  fi
}

# Function to sync repos (using the existing sync-repos.sh)
sync_repos() {
  log "Syncing repositories..."
  ./scripts/sync-repos.sh --force
  log "Repository sync complete."
  update_state "last_repo_sync" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}

# Function to deploy to Cloudflare
deploy_cloudflare() {
  log "Checking for Cloudflare changes..."
  # Check if there are changes in Cloudflare-related directories
  if [[ -n "$(git status --porcelain cloudflare-zeroclaw-relay cloudflare-sharedstate 2>/dev/null | head -n 1)" ]]; then
    log "Cloudflare changes detected. Deploying..."
    # Deploy the zeroclaw-relay worker
    pnpm --dir cloudflare-zeroclaw-relay run deploy
    log "Cloudflare deployment complete."
    update_state "last_cloudflare_deploy" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  else
    log "No Cloudflare changes to deploy."
  fi
}

# Main update cycle
log "Starting GitHub and Cloudflare update cycle"

# Commit and push to GitHub with a message from the AI
git_push "Auto-update: TNF swarm maintenance and improvements $(date -u +"%Y-%m-%d %H:%M:%S UTC")"

# Sync repos
sync_repos

# Deploy to Cloudflare
deploy_cloudflare

log "Update cycle complete."