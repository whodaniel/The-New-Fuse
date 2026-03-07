#!/bin/bash

# Script to resolve PR conflicts by merging main and regenerating pnpm-lock.yaml
# Usage: ./scripts/resolve-pr-conflicts.sh <pr_number>

set -e

PR_NUMBER=$1

if [ -z "$PR_NUMBER" ]; then
  echo "Usage: $0 <pr_number>"
  exit 1
fi

echo "=== Processing PR #$PR_NUMBER ==="

# Make sure we're on main first and up to date
echo "1. Updating main branch..."
git checkout main
git pull origin main

# Checkout the PR branch
echo "2. Checking out PR #$PR_NUMBER..."
gh pr checkout $PR_NUMBER

BRANCH_NAME=$(git branch --show-current)
echo "   On branch: $BRANCH_NAME"

# Merge main into the PR branch
echo "3. Merging main into PR branch..."
git merge main --no-edit || {
  echo "   Conflicts detected!"
  
  # List conflicting files
  echo "4. Conflicting files:"
  git diff --name-only --diff-filter=U
  
  # Handle pnpm-lock.yaml specifically - just accept theirs and regenerate
  if git diff --name-only --diff-filter=U | grep -q "pnpm-lock.yaml"; then
    echo "5. Resolving pnpm-lock.yaml by accepting main's version..."
    git checkout --theirs pnpm-lock.yaml
    git add pnpm-lock.yaml
  fi
  
  # For core TypeScript files, try to use ours (the PR changes)
  for file in $(git diff --name-only --diff-filter=U | grep "\.ts$"); do
    echo "   TypeScript conflict in: $file"
    # Show the conflict for reference
    echo "   Showing conflict markers..."
    grep -n "<<<<<<< HEAD\|=======\|>>>>>>>" "$file" || true
  done
  
  # Check if there are remaining conflicts
  REMAINING=$(git diff --name-only --diff-filter=U)
  if [ -n "$REMAINING" ]; then
    echo ""
    echo "=== Remaining conflicts need manual resolution: ==="
    echo "$REMAINING"
    echo ""
    echo "Please resolve these files manually, then run:"
    echo "  git add <files>"
    echo "  git commit"
    echo "  git push origin $BRANCH_NAME"
    echo "  gh pr merge $PR_NUMBER --squash"
    exit 1
  fi
  
  # Commit the resolved conflicts
  echo "6. Committing resolved conflicts..."
  git commit -m "Resolve merge conflicts for PR #$PR_NUMBER"
}

# Regenerate pnpm-lock.yaml
echo "7. Regenerating pnpm-lock.yaml..."
pnpm install --no-frozen-lockfile

# Add and commit the regenerated lockfile
echo "8. Committing updated lockfile..."
git add pnpm-lock.yaml
git commit -m "chore: regenerate pnpm-lock.yaml after merge" || echo "   No changes to commit"

# Push the changes
echo "9. Pushing changes..."
git push origin $BRANCH_NAME

# Merge the PR
echo "10. Merging PR #$PR_NUMBER..."
gh pr merge $PR_NUMBER --squash --delete-branch

echo "=== PR #$PR_NUMBER processed successfully! ==="

# Go back to main
git checkout main
git pull origin main
