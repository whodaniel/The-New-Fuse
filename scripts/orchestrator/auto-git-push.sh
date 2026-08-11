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

# --- REPORT ONLY. Does not stage, commit, or push. -------------------------
#
# This cycle previously ran `git add -A` + `git commit` + `git push origin HEAD`.
# That path is currently unreachable — the opt-in guard above exits early while
# ~/.tnf/flags/auto-git-push-confirmed is absent — so this is removing dormant
# code, not fixing an active incident. It is removed anyway because it cannot
# ever be correct if the flag is created:
#
#   1. Directive D1 requires explicit per-action operator confirmation for
#      commits. This script has no operator and sets no TNF_OPERATOR_CONFIRM
#      (correctly — that variable is not a script's to assert), so
#      .husky/pre-commit would reject every commit it attempted.
#   2. `git commit ... 2>/dev/null` swallowed that rejection, and the failure
#      branch logged "nothing to commit or commit error" — conflating "the tree
#      is clean" with "the authority gate refused me". Two opposite conditions,
#      one message.
#   3. `git add -A` ran BEFORE that doomed commit and its effect would persist,
#      leaving the whole working tree staged for whoever committed next.
#
# That third point is the structural hazard, and it is not unique to this file:
# several autonomous agents share this working tree (local-subdirector,
# director-agent, cron cycles). Any `git add -A` races with any commit being
# composed, capturing another actor's in-progress work under the wrong message
# and the wrong authority — and it silently defeats the operator gate, which
# reports `staged=N` at confirm time while the index can change before the
# commit lands. On 2026-08-06 a 4-file commit landed carrying ~150 unrelated
# files; the cause was never traced to a specific writer, which is precisely why
# no agent should stage broadly on a shared tree.
#
# Reporting is the part that was ever useful. Keep that; drop the rest.
DIRTY_COUNT=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
FILES=$(git status --porcelain 2>/dev/null | awk '{print $NF}' | head -15)

log "Uncommitted changes detected: ${DIRTY_COUNT} path(s). NOT staging or committing."
log "Commits require live operator confirmation (D1); see docs/core/AGENTS.md."
log "Files (first 15):"
while IFS= read -r f; do
    [ -n "$f" ] && log "  ${f}"
done <<< "${FILES}"

log "Auto git push cycle complete."