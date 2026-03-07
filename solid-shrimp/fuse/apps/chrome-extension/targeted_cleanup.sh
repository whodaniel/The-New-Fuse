#!/bin/bash

# Targeted Chrome Extension Cleanup Script
# Only cleans up files that actually exist in the directory

set -e  # Exit on any error

echo "🧹 Starting Targeted Chrome Extension Cleanup..."
echo "⚠️  This script will only delete files that actually exist"

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Function to safely delete files if they exist
safe_delete() {
    local file="$1"
    if [ -e "$file" ]; then
        echo "🗑️  Deleting: $file"
        rm -rf "$file"
        return 0
    else
        echo "ℹ️  Not found: $file"
        return 1
    fi
}

# Count files before cleanup
echo "📊 Pre-cleanup file count:"
total_files_before=$(find . -type f | wc -l | tr -d ' ')
echo "Total files: $total_files_before"

echo ""
echo "📋 CLEANING UP EXISTING REDUNDANT FILES"
echo "======================================="

# Phase 1: Delete redundant package files (keep package.json)
echo "🔧 Removing redundant package files..."
safe_delete "package.json.npm"
safe_delete "bunfig.toml"

# Phase 2: Delete multiple webpack configs (keep webpack.config.cjs)
echo "🔧 Removing redundant webpack configs..."
safe_delete "webpack.config.js"
safe_delete "webpack.config.mjs"
safe_delete "webpack.simple.js"
safe_delete "webpack.temp.cjs"

# Phase 3: Delete duplicate CSS files (keep src/styles/ organized versions)
echo "🔧 Removing duplicate CSS files..."
safe_delete "popup.css"        # root level duplicate
safe_delete "options.css"      # root level duplicate  
safe_delete "styles.css"       # root level generic
safe_delete "vendor.css"       # root level duplicate

# Phase 4: Delete archive files
echo "🔧 Removing archive files..."
safe_delete "the-new-fuse-chrome-extension-v2.0.0.zip"

# Phase 5: Delete duplicate icon directory (keep src/icons/ and dist/icons/)
echo "🔧 Removing duplicate icon directory..."
safe_delete "icons"

# Phase 6: Delete unused integration files
echo "🔧 Checking integration files..."
safe_delete "integrations/code-editor.js"
safe_delete "integrations/qwen.js"
# If integrations directory is now empty, remove it
if [ -d "integrations" ] && [ -z "$(ls -A integrations)" ]; then
    echo "🗑️  Removing empty integrations directory"
    rmdir "integrations"
fi

# Phase 7: Delete duplicate logger (keep TypeScript version in src/utils/)
echo "🔧 Removing duplicate logger..."
safe_delete "logger.js"  # root level duplicate

# Phase 8: Delete duplicate options/popup files (keep src/ versions)
echo "🔧 Removing duplicate HTML/JS files..."
safe_delete "options.js"   # root level duplicate
safe_delete "popup.html"   # root level duplicate

# Phase 9: Check for archives in packages directory
echo "🔧 Checking packages directory..."
if [ -d "packages" ]; then
    safe_delete "packages/the-new-fuse-chrome-extension-20250602-172905.zip"
    # If packages directory is now empty, remove it
    if [ -z "$(ls -A packages)" ]; then
        echo "🗑️  Removing empty packages directory"
        rmdir "packages"
    fi
fi

# Phase 10: Check src directory for backup files
echo "🔧 Checking for backup files in src..."
safe_delete "src/content.js.backup"
safe_delete "src/background/background.js.backup"
safe_delete "src/popup/element-selection-manager.ts.backup"
safe_delete "src/popup/element-selection-manager.ts.corrupted"
safe_delete "src/utils/logger.js"  # Keep only TypeScript version

# Phase 11: Clean up any empty directories
echo "🔧 Removing empty directories..."
find . -type d -empty -delete 2>/dev/null || true

echo ""
echo "📊 CLEANUP SUMMARY"
echo "=================="

# Count remaining files
total_files_after=$(find . -type f | wc -l | tr -d ' ')
files_deleted=$((total_files_before - total_files_after))

echo "📁 Files before cleanup: $total_files_before"
echo "📁 Files after cleanup: $total_files_after"
echo "🗑️  Files deleted: $files_deleted"

# List key directories
echo ""
echo "📂 Remaining structure:"
[ -d "src" ] && echo "   ✅ src/ ($(find src -type f | wc -l | tr -d ' ') files)"
[ -d "dist" ] && echo "   ✅ dist/ ($(find dist -type f | wc -l | tr -d ' ') files)"
[ -d "docs" ] && echo "   ✅ docs/ ($(find docs -type f | wc -l | tr -d ' ') files)"
[ -d "public" ] && echo "   ✅ public/ ($(find public -type f | wc -l | tr -d ' ') files)"

# List remaining important files
echo ""
echo "🔧 Key files preserved:"
[ -f "manifest.json" ] && echo "   ✅ manifest.json"
[ -f "package.json" ] && echo "   ✅ package.json"
[ -f "webpack.config.cjs" ] && echo "   ✅ webpack.config.cjs"
[ -f "tsconfig.json" ] && echo "   ✅ tsconfig.json"
[ -f "build.sh" ] && echo "   ✅ build.sh"
[ -f "README.md" ] && echo "   ✅ README.md"

echo ""
echo "🎉 Targeted cleanup completed successfully!"
echo ""
echo "🔍 NEXT STEPS:"
echo "1. Test the build: pnpm run build (or npm run build)"
echo "2. Verify extension loads in Chrome"
echo "3. Test core functionality"

echo ""
echo "🎯 Cleanup finished! Your extension is now optimized."
