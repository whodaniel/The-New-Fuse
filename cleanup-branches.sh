#!/bin/bash
# Branch Cleanup Script for The New Fuse Repository
# This script cleans up all stale branches except main and the latest prepare-public-release branch

set -e

echo "🧹 Starting branch cleanup for The New Fuse repository..."
echo ""

# Branches to KEEP (these will NOT be deleted)
KEEP_BRANCHES=(
    "main"
    "claude/prepare-public-release-011CV5qmykNfFy3h3LGLUHo8"
)

echo "📋 Branches that will be KEPT:"
for branch in "${KEEP_BRANCHES[@]}"; do
    echo "  ✓ $branch"
done
echo ""

# Switch to main branch
echo "📍 Switching to main branch..."
git checkout main
echo ""

# Fetch latest from origin
echo "🔄 Fetching latest from origin..."
git fetch origin --prune
echo ""

# Delete local branches (except the ones we want to keep)
echo "🗑️  Deleting local stale branches..."
git branch | grep -v "main" | grep -v "*" | while read branch; do
    # Check if this branch is in the KEEP list
    should_keep=false
    for keep in "${KEEP_BRANCHES[@]}"; do
        if [[ "$branch" == *"$keep"* ]]; then
            should_keep=true
            break
        fi
    done

    if [ "$should_keep" = false ]; then
        echo "  🗑️  Deleting local branch: $branch"
        git branch -D "$branch" 2>/dev/null || echo "    ⚠️  Could not delete $branch"
    else
        echo "  ✓ Keeping: $branch"
    fi
done
echo ""

# Delete remote branches (except the ones we want to keep)
echo "🌐 Deleting remote stale branches on origin..."
git branch -r | grep "origin/" | grep -v "origin/HEAD" | grep -v "origin/main" | while read remote_branch; do
    # Extract branch name without "origin/" prefix
    branch_name="${remote_branch#origin/}"

    # Check if this branch is in the KEEP list
    should_keep=false
    for keep in "${KEEP_BRANCHES[@]}"; do
        if [[ "$branch_name" == *"$keep"* ]]; then
            should_keep=true
            break
        fi
    done

    if [ "$should_keep" = false ]; then
        echo "  🗑️  Deleting remote branch: $branch_name"
        git push origin --delete "$branch_name" 2>/dev/null || echo "    ⚠️  Could not delete remote $branch_name"
    else
        echo "  ✓ Keeping remote: $branch_name"
    fi
done
echo ""

# Remove the recovery remote entirely (this is a duplicate)
echo "🧹 Removing recovery remote..."
git remote remove recovery 2>/dev/null || echo "  ℹ️  Recovery remote not found or already removed"
echo ""

echo "✅ Branch cleanup complete!"
echo ""
echo "📊 Remaining branches:"
echo ""
echo "Local branches:"
git branch
echo ""
echo "Remote branches:"
git branch -r
echo ""
echo "🎉 Repository is now clean and ready for public release!"
