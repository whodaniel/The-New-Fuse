#!/bin/bash

echo "📋 Organizing Git Changes for Systematic Commits"
echo "=============================================="

# Create logical groups for commits
echo "🔍 Analyzing changed files by category..."

echo "1. Configuration & Build Files:"
git status --porcelain | grep -E '\.(yml|yaml|json|js|sh|Dockerfile|env)$' | head -10

echo ""
echo "2. Documentation Files:"
git status --porcelain | grep -E '\.md$' | head -10

echo ""
echo "3. TypeScript/Source Files:"
git status --porcelain | grep -E '\.(ts|tsx)$' | head -10

echo ""
echo "4. New Feature Directories:"
git status --porcelain | grep -E '^(\?\?|A )' | grep -E '(a2a|mass|chrome-extension)' | head -10

echo ""
echo "📊 Summary:"
echo "Total files: $(git status --porcelain | wc -l)"
echo "Modified: $(git status --porcelain | grep '^M' | wc -l)"
echo "Deleted: $(git status --porcelain | grep '^D' | wc -l)"
echo "New: $(git status --porcelain | grep '^??' | wc -l)"

echo ""
echo "💡 Recommended commit strategy:"
echo "1. Commit documentation updates first"
echo "2. Commit configuration changes"
echo "3. Commit core functionality updates"
echo "4. Commit new features separately"
echo "5. Then proceed with reorganization"
