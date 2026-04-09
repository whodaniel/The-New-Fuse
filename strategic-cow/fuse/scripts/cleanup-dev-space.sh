#!/bin/bash

# Dev Environment Cleanup Script
# Safely removes development artifacts to free up hard drive space

set -e

echo "🧹 Starting development environment cleanup..."

# Function to safely remove directories with size reporting
safe_remove() {
    local path="$1"
    local description="$2"
    
    if [ -d "$path" ]; then
        local size=$(du -sh "$path" 2>/dev/null | cut -f1 || echo "unknown")
        echo "  Removing $description ($size): $path"
        rm -rf "$path"
    fi
}

# Function to remove files matching pattern
remove_files() {
    local pattern="$1"
    local description="$2"
    
    echo "  Removing $description..."
    find . -name "$pattern" -type f -delete 2>/dev/null || true
}

# Function to remove directories matching pattern
remove_dirs() {
    local pattern="$1"
    local description="$2"
    
    echo "  Removing $description..."
    find . -name "$pattern" -type d -exec rm -rf {} + 2>/dev/null || true
}

echo "📊 Current space usage:"
du -sh . 2>/dev/null || echo "Could not calculate current size"

echo ""
echo "🗑️  Cleaning build artifacts..."

# Remove Turbo cache
safe_remove ".turbo" "Turbo cache"
remove_dirs ".turbo" "nested Turbo caches"

# Remove TypeScript build outputs
remove_dirs "dist" "TypeScript dist folders"
remove_dirs "build" "build folders"
remove_dirs "lib" "lib folders (excluding essential ones)"

# Remove test coverage
remove_dirs "coverage" "test coverage reports"
remove_dirs ".nyc_output" "NYC coverage output"

echo ""
echo "📝 Cleaning logs and temporary files..."

# Remove log files
remove_files "*.log" "log files"
remove_files "npm-debug.log*" "npm debug logs"
remove_files "yarn-debug.log*" "yarn debug logs"
remove_files "yarn-error.log*" "yarn error logs"

# Remove temporary files
remove_files "*.tmp" "temporary files"
remove_files "*.temp" "temp files"
remove_files ".DS_Store" "macOS .DS_Store files"

echo ""
echo "🧪 Cleaning test artifacts..."

# Remove Jest cache
remove_dirs ".jest" "Jest cache"
remove_dirs "__tests__/__snapshots__" "Jest snapshots (if not needed)"

# Remove Vitest cache
remove_dirs "node_modules/.vitest" "Vitest cache"

echo ""
echo "🔧 Cleaning development caches..."

# Remove various cache directories
remove_dirs ".cache" "cache directories"
remove_dirs ".parcel-cache" "Parcel cache"
remove_dirs ".next" "Next.js cache"
remove_dirs ".nuxt" "Nuxt cache"
remove_dirs ".vite" "Vite cache"

# Remove ESLint cache
remove_files ".eslintcache" "ESLint cache"

# Remove Prettier cache
remove_files ".prettiercache" "Prettier cache"

echo ""
echo "📦 Cleaning package manager artifacts..."

# Remove yarn cache (but keep yarn.lock)
safe_remove ".yarn/cache" "Yarn cache"
safe_remove ".yarn/install-state.gz" "Yarn install state"

# Remove npm cache artifacts
remove_dirs ".npm" "npm cache"
remove_files "package-lock.json.bak" "package-lock backups"

echo ""
echo "🏗️  Cleaning build system artifacts..."

# Remove Webpack artifacts
remove_dirs ".webpack" "Webpack cache"

# Remove Rollup artifacts
remove_dirs ".rollup.cache" "Rollup cache"

# Remove Babel cache
remove_dirs ".babel-cache" "Babel cache"

# Remove SWC cache
remove_dirs ".swc" "SWC cache"

echo ""
echo "🐳 Cleaning Docker artifacts (if any)..."

# Remove Docker build context artifacts
remove_files "Dockerfile.tmp" "temporary Dockerfiles"
remove_dirs ".docker" "Docker build cache"

echo ""
echo "🎯 Cleaning IDE and editor artifacts..."

# Remove IDE artifacts
remove_dirs ".vscode/settings.json.bak" "VS Code backup settings"
remove_dirs ".idea" "IntelliJ IDEA files"
remove_files "*.swp" "Vim swap files"
remove_files "*.swo" "Vim swap files"
remove_files "*~" "editor backup files"

echo ""
echo "🔍 Final cleanup - removing empty directories..."

# Remove empty directories
find . -type d -empty -delete 2>/dev/null || true

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📊 New space usage:"
du -sh . 2>/dev/null || echo "Could not calculate new size"

echo ""
echo "💡 Additional space-saving tips:"
echo "  - Run 'npm prune' to remove unused dependencies"
echo "  - Run 'yarn cache clean' to clear yarn global cache"
echo "  - Consider removing old node_modules: rm -rf node_modules && npm install"
echo "  - Check for large files: find . -size +100M -type f"