#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

# --- Singleton lock: prevent duplicate concurrent runs from multiple agents ---
source "${ROOT_DIR}/scripts/lib/tnf-lock.sh"
tnf_acquire_lock "auto-git-push" 600

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