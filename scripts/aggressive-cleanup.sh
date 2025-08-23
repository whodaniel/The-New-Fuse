#!/bin/bash

# Aggressive Dev Environment Cleanup Script
# WARNING: This removes node_modules and requires reinstall
# Use only when you need maximum space and can reinstall dependencies

set -e

echo "⚠️  AGGRESSIVE CLEANUP MODE"
echo "This will remove node_modules and require dependency reinstall"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 1
fi

echo ""
echo "🧹 Starting aggressive cleanup..."

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

echo "📊 Current space usage:"
du -sh . 2>/dev/null || echo "Could not calculate current size"

echo ""
echo "🗑️  Removing node_modules (largest space saver)..."

# Remove all node_modules directories
find . -name "node_modules" -type d -prune -exec rm -rf {} +

echo ""
echo "🗑️  Running standard cleanup..."

# Run the standard cleanup script
if [ -f "scripts/cleanup-dev-space.sh" ]; then
    bash scripts/cleanup-dev-space.sh
else
    echo "Standard cleanup script not found, continuing with aggressive cleanup..."
    
    # Remove build artifacts
    find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "coverage" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Remove logs
    find . -name "*.log" -type f -delete 2>/dev/null || true
    
    # Remove caches
    find . -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name ".eslintcache" -type f -delete 2>/dev/null || true
    find . -name ".prettiercache" -type f -delete 2>/dev/null || true
fi

echo ""
echo "🧹 Additional aggressive cleanup..."

# Remove package manager lock files (will be regenerated)
safe_remove "yarn.lock" "Yarn lock file (will be regenerated)"
safe_remove "package-lock.json" "NPM lock file (will be regenerated)"
safe_remove "pnpm-lock.yaml" "PNPM lock file (will be regenerated)"

# Remove Yarn cache and state
safe_remove ".yarn/cache" "Yarn cache"
safe_remove ".yarn/install-state.gz" "Yarn install state"
safe_remove ".yarn/unplugged" "Yarn unplugged"
safe_remove ".pnp.cjs" "Yarn PnP file"
safe_remove ".pnp.loader.mjs" "Yarn PnP loader"

echo ""
echo "✅ Aggressive cleanup complete!"
echo ""
echo "📊 New space usage:"
du -sh . 2>/dev/null || echo "Could not calculate new size"

echo ""
echo "🔄 To restore your development environment:"
echo "  1. Run: npm install (or yarn install)"
echo "  2. Run: npm run build (or yarn build)"
echo "  3. Run any setup scripts if needed"
echo ""
echo "💡 Consider using 'npm ci' for faster, cleaner installs in CI/production"