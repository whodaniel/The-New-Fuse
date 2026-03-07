#!/bin/bash

# Script to merge PRs with conflicts
# Usage: ./merge-prs.sh <pr_number>

PR_NUMBER=$1

if [ -z "$PR_NUMBER" ]; then
  echo "Usage: $0 <pr_number>"
  exit 1
fi

echo "Processing PR #$PR_NUMBER..."

# Checkout the PR
gh pr checkout $PR_NUMBER

# Get the branch name
BRANCH_NAME=$(git branch --show-current)

echo "On branch: $BRANCH_NAME"

# Merge main into the PR branch
git merge main

# Check if there are conflicts
if [ $? -ne 0 ]; then
  echo "Conflicts detected. Resolving..."

  # Check if pnpm-lock.yaml has conflicts
  if git diff --name-only --diff-filter=U | grep -q "pnpm-lock.yaml"; then
    echo "Resolving pnpm-lock.yaml conflict..."
    git checkout --theirs pnpm-lock.yaml
    git add pnpm-lock.yaml
  fi

  # Check if package.json files have conflicts
  for file in $(git diff --name-only --diff-filter=U | grep "package.json"); do
    echo "Conflict in $file - needs manual resolution"
    # For now, just show the conflict
    git diff $file
  done

  # Commit if all conflicts are resolved
  if [ -z "$(git diff --name-only --diff-filter=U)" ]; then
    git commit -m "Resolve merge conflicts for PR #$PR_NUMBER"
    git push -f origin $BRANCH_NAME

    # Merge the PR
    gh pr merge $PR_NUMBER --squash
  else
    echo "Manual conflict resolution required"
    exit 1
  fi
else
  echo "No conflicts, pushing..."
  git push origin $BRANCH_NAME

  # Merge the PR
  gh pr merge $PR_NUMBER --squash
fi

# Go back to main
git checkout main
git pull origin main

echo "PR #$PR_NUMBER processed successfully!"
