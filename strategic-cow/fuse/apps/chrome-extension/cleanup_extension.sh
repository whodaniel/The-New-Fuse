#!/bin/bash

# Chrome Extension Cleanup Script
# Executes the cleanup plan from the analysis document

set -e  # Exit on any error

echo "🧹 Starting Chrome Extension Cleanup..."
echo "⚠️  This script will delete redundant files based on your analysis document"

# Get the directory where the script is located
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
        echo "ℹ️  Not found (skipping): $file"
        return 1
    fi
}

# Function to count files before cleanup
echo "📊 Pre-cleanup file count:"
total_files_before=$(find . -type f | wc -l | tr -d ' ')
echo "Total files: $total_files_before"

# Phase 1: Safe Deletions - Build Scripts, Logs, Archives
echo ""
echo "📋 PHASE 1: Safe Deletions (Build Scripts, Logs, Archives)"
echo "========================================================"

# Delete files that already have .DELETE_ prefix
safe_delete ".DELETE_build-compatible.sh"
safe_delete ".DELETE_build-esm.sh"
safe_delete ".DELETE_build-fix.sh"
safe_delete ".DELETE_build-with-npm-fixed.sh"
safe_delete ".DELETE_build-with-npm.sh"
safe_delete ".DELETE_build-workspace.sh"
safe_delete ".DELETE_simple-build.sh"

# Delete remaining duplicate build scripts (keep build.sh)
safe_delete "quick-build.sh"
safe_delete "rebuild.sh"
safe_delete "install.sh"
safe_delete "start-extension-dev.sh"

# Delete test/debug files
safe_delete "test-extension.html"
safe_delete "test-page.html"
safe_delete "test-syntax.ts"
safe_delete "test-websocket-server.js"
safe_delete "test-enhancements.sh"
safe_delete "test-extension.sh"
safe_delete "debug-tools.js"
safe_delete "detached-popup.js"
safe_delete "convert-svg-to-png.js"
safe_delete "validate-build.sh"
safe_delete "check-status.sh"
safe_delete "dev.sh"

# Delete build artifacts
safe_delete "build.log"
safe_delete "build_log.txt"
safe_delete "build_output.txt"
safe_delete ".turbo/turbo-build.log"
safe_delete "tsconfig.tsbuildinfo"

# Delete legacy/archive files
safe_delete "src/content.js.backup"
safe_delete "src/background/background.js.backup"
safe_delete "src/popup/element-selection-manager.ts.backup"
safe_delete "src/popup/element-selection-manager.ts.corrupted"
safe_delete "the-new-fuse-chrome-extension-v2.0.0.zip"
safe_delete "packages/the-new-fuse-chrome-extension-20250602-172905.zip"

echo "✅ Phase 1 complete"

# Phase 2: Config Consolidation
echo ""
echo "📋 PHASE 2: Config Consolidation"
echo "================================"

# Delete redundant package files (keep package.json)
safe_delete "package.json.npm"
safe_delete "bunfig.toml"

# Delete multiple webpack configs (keep webpack.config.cjs)
safe_delete "webpack.config.js"
safe_delete "webpack.config.mjs"
safe_delete "webpack.simple.js"
safe_delete "webpack.temp.cjs"

echo "✅ Phase 2 complete"

# Phase 3: Structure Cleanup
echo ""
echo "📋 PHASE 3: Structure Cleanup"
echo "============================="

# Delete duplicate CSS files (keep src/styles/ organized versions)
safe_delete "popup.css"        # root level duplicate
safe_delete "options.css"      # root level duplicate  
safe_delete "styles.css"       # root level generic
safe_delete "vendor.css"       # root level duplicate

# Delete duplicate icon directory (keep src/icons/ and dist/icons/)
safe_delete "icons"

# Delete unused integration files
safe_delete "integrations/code-editor.js"
safe_delete "integrations/qwen.js"

# Clean up duplicate logger (keep TypeScript version)
safe_delete "src/utils/logger.js"
safe_delete "logger.js"  # root level duplicate

# Clean up duplicate options/popup files (keep src/ versions)
safe_delete "options.js"   # root level duplicate
safe_delete "popup.html"   # root level duplicate (keep src/popup/popup.html)

echo "✅ Phase 3 complete"

# Phase 4: Additional Cleanup
echo ""
echo "📋 PHASE 4: Additional Cleanup"
echo "=============================="

# Remove any remaining test artifacts
safe_delete "src/popup/vendor.css"  # duplicate in popup directory

# Clean up any empty directories that might be left
find . -type d -empty -delete 2>/dev/null || true

echo "✅ Phase 4 complete"

# Phase 5: File Count Summary
echo ""
echo "📊 POST-CLEANUP SUMMARY"
echo "======================="

# Count remaining files
total_files_after=$(find . -type f | wc -l | tr -d ' ')
files_deleted=$((total_files_before - total_files_after))

echo "📁 Files before cleanup: $total_files_before"
echo "📁 Files after cleanup: $total_files_after"
echo "🗑️  Files deleted: $files_deleted"

# List key directories
echo ""
echo "📂 Key directories structure:"
[ -d "src" ] && echo "   ✅ src/ ($(find src -type f | wc -l | tr -d ' ') files)"
[ -d "dist" ] && echo "   ✅ dist/ ($(find dist -type f | wc -l | tr -d ' ') files)"
[ -d "docs" ] && echo "   ✅ docs/ ($(find docs -type f | wc -l | tr -d ' ') files)"

# List remaining important files
echo ""
echo "🔧 Key files preserved:"
[ -f "manifest.json" ] && echo "   ✅ manifest.json"
[ -f "package.json" ] && echo "   ✅ package.json"
[ -f "webpack.config.cjs" ] && echo "   ✅ webpack.config.cjs"
[ -f "tsconfig.json" ] && echo "   ✅ tsconfig.json"
[ -f "build.sh" ] && echo "   ✅ build.sh"
[ -f "README.md" ] && echo "   ✅ README.md"

# Core functionality files
echo ""
echo "💻 Core functionality preserved:"
[ -f "src/background.ts" ] && echo "   ✅ src/background.ts"
[ -f "src/content/index.ts" ] && echo "   ✅ src/content/index.ts"  
[ -f "src/content/element-selector.ts" ] && echo "   ✅ src/content/element-selector.ts"
[ -f "src/popup/index.ts" ] && echo "   ✅ src/popup/index.ts"
[ -f "src/services/ApiClient.ts" ] && echo "   ✅ src/services/ApiClient.ts"
[ -f "src/utils/websocket-manager.ts" ] && echo "   ✅ src/utils/websocket-manager.ts"
[ -f "src/utils/logger.ts" ] && echo "   ✅ src/utils/logger.ts"

echo ""
echo "🎉 Cleanup completed successfully!"
echo ""
echo "🔍 NEXT STEPS:"
echo "1. Test the build: pnpm run build (or npm run build)"
echo "2. Verify extension loads in Chrome"
echo "3. Test core functionality:"
echo "   - Element selection"
echo "   - WebSocket connection"
echo "   - Popup interface"
echo "   - TNF Relay integration"
echo "4. Update documentation if needed"

# Optional: Run build test
echo ""
read -p "🚀 Would you like to test the build now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Testing build..."
    if [ -f "package.json" ]; then
        if command -v pnpm &> /dev/null; then
            echo "Using pnpm to build..."
            pnpm run build
            echo "✅ Build test completed with pnpm!"
        elif command -v npm &> /dev/null; then
            echo "Using npm to build..."
            npm run build
            echo "✅ Build test completed with npm!"
        else
            echo "⚠️  No package manager found. Please run 'pnpm run build' or 'npm run build' manually."
        fi
    else
        echo "⚠️  No package.json found. Please verify your project structure."
    fi
fi

echo ""
echo "🎯 Cleanup script finished!"
echo "📦 Your Chrome extension is now optimized and ready for development!"
