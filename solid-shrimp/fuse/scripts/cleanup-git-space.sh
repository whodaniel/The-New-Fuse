#!/bin/bash

# Git Repository Cleanup Script
# Safely reduces Git repository size

set -e

echo "🗂️  Git Repository Cleanup"
echo "Current .git directory size: $(du -sh .git | cut -f1)"
echo ""

# Function to run git command with error handling
safe_git() {
    local cmd="$1"
    local description="$2"
    
    echo "  $description..."
    if git $cmd; then
        echo "    ✅ Success"
    else
        echo "    ⚠️  Warning: Command failed, continuing..."
    fi
}

echo "🧹 Cleaning Git repository..."

# Clean up loose objects and pack files
safe_git "gc --aggressive --prune=now" "Running aggressive garbage collection"

# Remove unreachable objects
safe_git "prune --expire=now" "Pruning unreachable objects"

# Clean up reflog
safe_git "reflog expire --expire=now --all" "Cleaning reflog"

# Remove stale remote tracking branches
safe_git "remote prune origin" "Pruning stale remote branches"

# Clean up worktree references
safe_git "worktree prune" "Cleaning worktree references"

echo ""
echo "📊 Git cleanup results:"
echo "New .git directory size: $(du -sh .git | cut -f1)"

echo ""
echo "💡 Additional Git space-saving options (use with caution):"
echo "  - Remove large files from history: git filter-branch or BFG Repo-Cleaner"
echo "  - Shallow clone: git clone --depth 1 <repo>"
echo "  - Remove unused branches: git branch -d <branch-name>"
echo "  - Clean up LFS objects: git lfs prune"