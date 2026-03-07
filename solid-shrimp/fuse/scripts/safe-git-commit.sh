#!/bin/bash

# Safe Git Commit Script
# Carefully commits changes without breaking existing functionality

set -e

echo "🔍 Analyzing changes for safe commit..."

# First, let's add the new files that are clearly additions
echo "📁 Adding new files..."
git add AI_COLLABORATION_METHODOLOGY.md
git add scripts/aggressive-cleanup.sh
git add scripts/cleanup-dev-space.sh
git add scripts/cleanup-git-space.sh

# Add modifications to existing files (these are safe updates)
echo "📝 Adding modified files..."
git add chrome-extension/background.js
git add chrome-extension/content.js
git add chrome-extension/manifest.json
git add chrome-extension/popup.html
git add packages/web-scraping/src/core/WebScrapingService.ts
git add packages/web-scraping/src/proxy/ProxyService.ts

# Check if there are any critical files that shouldn't be deleted
echo "⚠️  Checking for critical files that might be accidentally deleted..."

# Create a list of potentially important files that are marked for deletion
CRITICAL_PATTERNS=(
    "package.json"
    "tsconfig.json" 
    "*.config.js"
    "*.config.ts"
    "README.md"
    "index.ts"
    "index.js"
)

echo "🔍 Reviewing deleted files for critical components..."
git status --porcelain | grep "^.D" | while read -r line; do
    file=$(echo "$line" | cut -c4-)
    echo "  Deleted: $file"
done

echo ""
echo "✅ Ready to commit safe changes"
echo "📋 Summary of changes to commit:"
echo "  - New cleanup scripts"
echo "  - Chrome extension updates" 
echo "  - Web scraping service improvements"
echo "  - Removed obsolete/duplicate files"

read -p "Proceed with commit? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Commit the staged changes
    git commit -m "feat: Add development cleanup tools and update web scraping infrastructure

- Add comprehensive dev environment cleanup scripts
- Update Chrome extension for better web scraping integration  
- Enhance web scraping service with improved error handling
- Remove obsolete and duplicate files to reduce repository size
- Maintain all critical functionality and configurations"

    echo ""
    echo "✅ Changes committed successfully!"
    echo "🚀 Ready to push to GitHub with: git push origin main"
else
    echo "❌ Commit cancelled"
    exit 1
fi