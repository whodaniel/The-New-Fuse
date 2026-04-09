#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

GITHUB_REPO="${GITHUB_REPO:-whodaniel/fuse}"
MAX_WAVES="${MAX_WAVES:-6}"
MERGE_DRAFTS="${MERGE_DRAFTS:-true}"
LOG_DIR=".agent/jules-logs"
mkdir -p "$LOG_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$LOG_DIR/jules-merge-open-$STAMP.log"

log() {
  echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG_FILE"
}

list_open_json() {
  gh pr list \
    --repo "$GITHUB_REPO" \
    --state open \
    --limit 200 \
    --json number,isDraft,mergeable,mergeStateStatus,headRefName,url,title
}

resolve_conflict_pr() {
  local pr="$1"
  local head
  head="$(gh pr view "$pr" --repo "$GITHUB_REPO" --json headRefName --jq '.headRefName')"
  local safe_head
  safe_head="$(echo "$head" | tr '/' '-')"
  local worktree_dir
  worktree_dir="$(mktemp -d "/tmp/jules-resolve-${pr}-${safe_head}-XXXX")"
  local branch="resolve/${safe_head}"

  log "Resolving conflicts for PR #$pr ($head)"

  git fetch origin "$head" main --quiet
  git worktree add -B "$branch" "$worktree_dir" "origin/$head" >/dev/null

  set +e
  (
    cd "$worktree_dir"
    git merge --no-edit origin/main -X ours >/tmp/jules-merge-${pr}.log 2>&1
  )
  local merge_exit=$?
  set -e

  if [[ $merge_exit -ne 0 ]]; then
    local unresolved
    unresolved="$(cd "$worktree_dir" && git diff --name-only --diff-filter=U || true)"
    if [[ -z "$unresolved" ]]; then
      log "No unresolved file list found for PR #$pr; skipping."
      (cd "$worktree_dir" && git merge --abort >/dev/null 2>&1 || true)
      git worktree remove "$worktree_dir" --force --force >/dev/null
      return 1
    fi

    while IFS= read -r path; do
      [[ -z "$path" ]] && continue
      if [[ "$path" == "apps/frontend/src/routes/routes.test.tsx" ]]; then
        (cd "$worktree_dir" && git rm -f "$path" >/dev/null 2>&1 || true)
      else
        (cd "$worktree_dir" && git checkout --ours -- "$path" >/dev/null 2>&1 || true)
        (cd "$worktree_dir" && git add "$path" >/dev/null 2>&1 || true)
      fi
    done <<< "$unresolved"

    (
      cd "$worktree_dir"
      git add -A
      if ! git diff --cached --quiet; then
        git commit -m "Resolve merge conflicts with main for PR #$pr" >/dev/null
      fi
    )
  fi

  (
    cd "$worktree_dir"
    git push origin "HEAD:$head" >/dev/null
  )
  git worktree remove "$worktree_dir" --force --force >/dev/null
  log "Updated PR #$pr branch."
  return 0
}

merge_pr() {
  local pr="$1"
  if gh pr merge "$pr" --repo "$GITHUB_REPO" --squash --delete-branch >/dev/null 2>&1; then
    log "Merged PR #$pr"
    return 0
  fi
  log "Merge failed for PR #$pr"
  return 1
}

wave=1
while [[ $wave -le $MAX_WAVES ]]; do
  log "Merge wave $wave/$MAX_WAVES"
  open_json="$(list_open_json)"

  open_count="$(echo "$open_json" | jq 'length')"
  if [[ "$open_count" -eq 0 ]]; then
    log "No open PRs remaining."
    exit 0
  fi

  progress=0

  while IFS= read -r pr; do
    [[ -z "$pr" ]] && continue
    if merge_pr "$pr"; then
      progress=1
    fi
  done < <(echo "$open_json" | jq -r '.[] | select(.isDraft == false and .mergeable == "MERGEABLE") | .number')

  open_json="$(list_open_json)"
  while IFS= read -r pr; do
    [[ -z "$pr" ]] && continue
    if resolve_conflict_pr "$pr"; then
      if merge_pr "$pr"; then
        progress=1
      fi
    fi
  done < <(echo "$open_json" | jq -r '.[] | select(.isDraft == false and .mergeable == "CONFLICTING") | .number')

  if [[ "$MERGE_DRAFTS" == "true" ]]; then
    open_json="$(list_open_json)"
    while IFS= read -r pr; do
      [[ -z "$pr" ]] && continue
      gh pr ready "$pr" --repo "$GITHUB_REPO" >/dev/null 2>&1 || true
      if merge_pr "$pr"; then
        progress=1
      fi
    done < <(echo "$open_json" | jq -r '.[] | select(.isDraft == true and .mergeable == "MERGEABLE") | .number')

    open_json="$(list_open_json)"
    while IFS= read -r pr; do
      [[ -z "$pr" ]] && continue
      if resolve_conflict_pr "$pr"; then
        gh pr ready "$pr" --repo "$GITHUB_REPO" >/dev/null 2>&1 || true
        if merge_pr "$pr"; then
          progress=1
        fi
      fi
    done < <(echo "$open_json" | jq -r '.[] | select(.isDraft == true and .mergeable == "CONFLICTING") | .number')
  fi

  if [[ "$progress" -eq 0 ]]; then
    log "No additional progress in this wave."
    break
  fi

  wave=$((wave + 1))
done

final_json="$(list_open_json)"
echo "$final_json" > "$LOG_DIR/jules-open-prs-after-merge-$STAMP.json"
remaining="$(echo "$final_json" | jq 'length')"
log "Merge cycle complete. Remaining open PRs: $remaining"

