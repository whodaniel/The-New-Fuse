#!/usr/bin/env bash
# Requires bash 3+ (macOS compatible)
# jules-publish-via-cli.sh
# Uses `jules remote pull` to extract patches and `gh pr create` to publish PRs.
# No browser interaction required.
#
# Usage:
#   ./scripts/jules-publish-via-cli.sh [--dry-run] [--limit N]
#
# Requirements:
#   - jules CLI authenticated (jules login)
#   - gh CLI authenticated (gh auth login)
#   - git with push access to whodaniel/fuse

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
SESSION_IDS_FILE="${REPO_ROOT}/.agent/jules-logs/jules-15-session-ids.txt"
LOG_DIR="${REPO_ROOT}/.agent/jules-logs"
RESULTS_FILE="${LOG_DIR}/jules-publish-results-$(date -u +%Y-%m-%dT%H-%M-%S)Z.md"
BASE_BRANCH="main"
BRANCH_PREFIX="jules-auto"
DRY_RUN=false
LIMIT=15
SKIP_EXISTING=true

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --limit) LIMIT="$2"; shift 2 ;;
    --sessions-file) SESSION_IDS_FILE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

echo "=== Jules Publish via CLI ==="
echo "Repo root:    $REPO_ROOT"
echo "Sessions file: $SESSION_IDS_FILE"
echo "Dry run:      $DRY_RUN"
echo "Limit:        $LIMIT"
echo ""

# Verify tools
for tool in jules gh git; do
  if ! command -v "$tool" &>/dev/null; then
    echo "ERROR: '$tool' not found in PATH"
    exit 1
  fi
done

# Verify gh auth
if ! gh auth status &>/dev/null; then
  echo "ERROR: gh CLI not authenticated. Run: gh auth login"
  exit 1
fi

# Read session IDs
SESSION_IDS=()
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  SESSION_IDS+=("$line")
done < <(grep -v '^[[:space:]]*$' "$SESSION_IDS_FILE" | head -n "$LIMIT")
echo "Found ${#SESSION_IDS[@]} sessions to process."
echo ""

# Initialize results file
mkdir -p "$LOG_DIR"
cat > "$RESULTS_FILE" <<EOF
# Jules Publish Results
Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Dry run: $DRY_RUN

| Session ID | Branch | PR URL | Status | Notes |
|---|---|---|---|---|
EOF

SUCCESS=0
SKIPPED=0
FAILED=0
FAILED_IDS=()

cd "$REPO_ROOT"

# Ensure we're on main and up to date
echo "Fetching latest origin/$BASE_BRANCH..."
git fetch origin "$BASE_BRANCH" --quiet

for SESSION_ID in "${SESSION_IDS[@]}"; do
  echo "──────────────────────────────────────────"
  echo "Processing session: $SESSION_ID"

  BRANCH_NAME="${BRANCH_PREFIX}-${SESSION_ID}"
  PR_URL=""
  STATUS=""
  NOTES=""

  # Check if branch already exists on remote
  if git ls-remote --exit-code --heads origin "$BRANCH_NAME" &>/dev/null; then
    echo "  Branch $BRANCH_NAME already exists on remote."
    # Check if PR already exists
    EXISTING_PR=$(gh pr list --repo whodaniel/fuse --head "$BRANCH_NAME" --json url --jq '.[0].url' 2>/dev/null || echo "")
    if [[ -n "$EXISTING_PR" ]]; then
      echo "  PR already exists: $EXISTING_PR"
      echo "| $SESSION_ID | \`$BRANCH_NAME\` | $EXISTING_PR | ✅ Already exists | PR was already open |" >> "$RESULTS_FILE"
      ((SKIPPED++)) || true
      continue
    fi
  fi

  # Pull the patch from Jules
  echo "  Pulling patch from Jules..."
  PATCH_FILE=$(mktemp /tmp/jules-patch.XXXXXX)

  if ! jules remote pull --session "$SESSION_ID" > "$PATCH_FILE" 2>&1; then
    echo "  ERROR: jules remote pull failed for session $SESSION_ID"
    cat "$PATCH_FILE"
    NOTES="jules pull failed"
    echo "| $SESSION_ID | - | - | ❌ Failed | $NOTES |" >> "$RESULTS_FILE"
    ((FAILED++)) || true
    FAILED_IDS+=("$SESSION_ID")
    rm -f "$PATCH_FILE"
    continue
  fi

  PATCH_SIZE=$(wc -c < "$PATCH_FILE")
  echo "  Patch size: ${PATCH_SIZE} bytes"

  if [[ "$PATCH_SIZE" -lt 50 ]]; then
    echo "  WARNING: Patch is empty or too small (${PATCH_SIZE} bytes). Skipping."
    cat "$PATCH_FILE"
    NOTES="Empty patch (${PATCH_SIZE} bytes)"
    echo "| $SESSION_ID | - | - | ⚠️ Skipped | $NOTES |" >> "$RESULTS_FILE"
    ((SKIPPED++)) || true
    rm -f "$PATCH_FILE"
    continue
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  [DRY RUN] Would create branch $BRANCH_NAME and apply patch"
    echo "  Patch preview (first 5 lines):"
    head -5 "$PATCH_FILE"
    echo "| $SESSION_ID | \`$BRANCH_NAME\` | (dry run) | 🔵 Dry run | Would apply ${PATCH_SIZE}b patch |" >> "$RESULTS_FILE"
    rm -f "$PATCH_FILE"
    continue
  fi

  # Create branch from origin/main
  echo "  Creating branch $BRANCH_NAME from origin/$BASE_BRANCH..."
  git checkout -B "$BRANCH_NAME" "origin/$BASE_BRANCH" --quiet

  # Apply the patch
  echo "  Applying patch..."
  if ! git apply --whitespace=fix "$PATCH_FILE" 2>&1; then
    echo "  WARNING: git apply failed, trying with --reject..."
    if ! git apply --whitespace=fix --reject "$PATCH_FILE" 2>&1; then
      echo "  ERROR: Patch application failed entirely for session $SESSION_ID"
      git checkout "$BASE_BRANCH" --quiet 2>/dev/null || git checkout -B "$BASE_BRANCH" "origin/$BASE_BRANCH" --quiet
      NOTES="Patch apply failed"
      echo "| $SESSION_ID | \`$BRANCH_NAME\` | - | ❌ Failed | $NOTES |" >> "$RESULTS_FILE"
      ((FAILED++)) || true
      FAILED_IDS+=("$SESSION_ID")
      rm -f "$PATCH_FILE"
      continue
    fi
    NOTES="Applied with --reject (some hunks may have failed)"
  fi

  # Check if there are actual changes
  if git diff --cached --quiet && git diff --quiet; then
    echo "  No changes after applying patch. Skipping."
    git checkout "$BASE_BRANCH" --quiet 2>/dev/null || true
    NOTES="No changes after patch apply"
    echo "| $SESSION_ID | \`$BRANCH_NAME\` | - | ⚠️ Skipped | $NOTES |" >> "$RESULTS_FILE"
    ((SKIPPED++)) || true
    rm -f "$PATCH_FILE"
    continue
  fi

  # Stage all changes
  git add -A

  # Commit
  COMMIT_MSG="feat: Jules session ${SESSION_ID} - auto-published changes

Session URL: https://jules.google.com/session/${SESSION_ID}
Published by TNF automation via jules remote pull + gh pr create"

  git commit -m "$COMMIT_MSG" --quiet

  # Push branch
  echo "  Pushing branch $BRANCH_NAME..."
  if ! git push origin "$BRANCH_NAME" --force-with-lease --quiet 2>&1; then
    echo "  ERROR: Push failed for $BRANCH_NAME"
    git checkout "$BASE_BRANCH" --quiet 2>/dev/null || true
    NOTES="Push failed"
    echo "| $SESSION_ID | \`$BRANCH_NAME\` | - | ❌ Failed | $NOTES |" >> "$RESULTS_FILE"
    ((FAILED++)) || true
    FAILED_IDS+=("$SESSION_ID")
    rm -f "$PATCH_FILE"
    continue
  fi

  # Create PR
  echo "  Creating GitHub PR..."
  PR_BODY="## Jules Session Auto-Publish

**Session ID:** \`${SESSION_ID}\`
**Session URL:** https://jules.google.com/session/${SESSION_ID}

This PR was automatically published by TNF automation using \`jules remote pull\` + \`gh pr create\`.

### Changes
$(git log --oneline "origin/${BASE_BRANCH}..HEAD" 2>/dev/null | head -10)

---
*Published by jules-publish-via-cli.sh*"

  if PR_URL=$(gh pr create \
    --repo whodaniel/fuse \
    --base "$BASE_BRANCH" \
    --head "$BRANCH_NAME" \
    --title "Jules: Session ${SESSION_ID}" \
    --body "$PR_BODY" \
    --draft \
    2>&1); then
    echo "  ✅ PR created: $PR_URL"
    echo "| $SESSION_ID | \`$BRANCH_NAME\` | $PR_URL | ✅ Published | |" >> "$RESULTS_FILE"
    ((SUCCESS++)) || true
  else
    echo "  ERROR: gh pr create failed: $PR_URL"
    NOTES="PR creation failed: ${PR_URL:0:100}"
    echo "| $SESSION_ID | \`$BRANCH_NAME\` | - | ❌ Failed | $NOTES |" >> "$RESULTS_FILE"
    ((FAILED++)) || true
    FAILED_IDS+=("$SESSION_ID")
  fi

  # Return to main
  git checkout "$BASE_BRANCH" --quiet 2>/dev/null || git checkout -B "$BASE_BRANCH" "origin/$BASE_BRANCH" --quiet

  rm -f "$PATCH_FILE"
  echo ""
done

# Final summary
echo ""
echo "══════════════════════════════════════════"
echo "=== RESULTS ==="
echo "  ✅ Published:  $SUCCESS"
echo "  ⚠️  Skipped:   $SKIPPED"
echo "  ❌ Failed:     $FAILED"
if [[ ${#FAILED_IDS[@]} -gt 0 ]]; then
  echo "  Failed IDs:  ${FAILED_IDS[*]}"
fi
echo ""
echo "Results written to: $RESULTS_FILE"
echo "══════════════════════════════════════════"

# Append summary to results file
cat >> "$RESULTS_FILE" <<EOF

## Summary
- ✅ Published: $SUCCESS
- ⚠️ Skipped: $SKIPPED
- ❌ Failed: $FAILED
$(if [[ ${#FAILED_IDS[@]} -gt 0 ]]; then echo "- Failed IDs: ${FAILED_IDS[*]}"; fi)
EOF
