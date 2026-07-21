#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

# --- Singleton lock: prevent duplicate concurrent runs from multiple agents ---
source "${ROOT_DIR}/scripts/lib/tnf-lock.sh"
tnf_acquire_lock "auto-git-push" 600

# --- Fleet-wide pause gate ---
source "${ROOT_DIR}/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi

# --- Operator confirmation gate for autonomous commit/push (2026-07-21) ---
# `git add -A` + autonomous `git commit` + `git push origin HEAD`, hourly,
# with zero human involvement, is exactly the category of action
# docs/core/AGENTS.md ("Commits and Pushes Require Live Operator
# Confirmation") and DIRECTIVES.md D1 say needs live, current-session
# operator confirmation — not a standing cron schedule. This script found
# to be actively doing that; likely a real contributor to the large
# volume of unrelated churn (turbo logs, generated docs, etc.) that had
# to be manually excluded from every commit made by hand tonight.
#
# Disabled by default now. To explicitly opt back in for a given run,
# create ~/.tnf/flags/auto-git-push-confirmed (touch it) immediately
# before this cron fires — a standing "always allow" env var would just
# recreate the same standing-authorization problem this is fixing.
AUTO_GIT_PUSH_CONFIRM_FILE="${HOME}/.tnf/flags/auto-git-push-confirmed"
if [[ ! -f "${AUTO_GIT_PUSH_CONFIRM_FILE}" ]]; then
  echo '{"ok":true,"skipped":"autonomous-commit-push-requires-operator-opt-in","seeAlso":"docs/core/AGENTS.md#commits-and-pushes-require-live-operator-confirmation","confirmFile":"'"${AUTO_GIT_PUSH_CONFIRM_FILE}"'"}'
  exit 0
fi
# Single-use: consume the opt-in so the next hourly run needs a fresh one.
rm -f "${AUTO_GIT_PUSH_CONFIRM_FILE}"

GIT_LOG="${ROOT_DIR}/.agent/runtime-logs/auto-git-push.log"
mkdir -p "$(dirname "${GIT_LOG}")"

stamp() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { echo "[$(stamp)] $*" >> "${GIT_LOG}"; echo "$*"; }

log "Auto git push cycle starting..."

# Check for changes
if [[ -z "$(git status --porcelain 2>/dev/null)" ]]; then
    log "No changes to commit."
    exit 0
fi

# Stage all changes
git add -A 2>/dev/null || true

# Generate commit message from changed files
FILES=$(git diff --cached --name-only 2>/dev/null | head -20)
COMMIT_MSG="auto: marketplace curation + swarm updates [$(stamp)]

Files:
$(echo "${FILES}" | head -15)"

# Commit
if git commit -m "${COMMIT_MSG}" 2>/dev/null; then
    log "Commit created successfully."
    
    # Push if remote exists
    if git remote -v 2>/dev/null | grep -q "origin"; then
        if git push origin HEAD 2>&1; then
            log "Push to origin successful."
        else
            log "Push failed (may need pull/rebase)"
        fi
    fi
else
    log "Commit failed (nothing to commit or commit error)"
fi

log "Auto git push cycle complete."