#!/bin/bash

echo "🧹 Cleaning up development artifacts to free disk space..."

# Kill any running processes first
pkill -f "theia build" 2>/dev/null || true
pkill -f "memory-optimized-build" 2>/dev/null || true
pkill -f "npx theia" 2>/dev/null || true

# Function to show disk usage before and after
show_disk_usage() {
    echo "💾 Current disk usage:"
    df -h . | tail -1
    echo ""
}

show_disk_usage

# Clean node_modules caches
echo "🗑️  Cleaning node_modules caches..."
find . -name "node_modules" -type d -exec du -sh {} \; 2>/dev/null | head -10
echo ""

# Clean build artifacts
echo "🗑️  Cleaning build artifacts..."
rm -rf apps/*/dist apps/*/lib apps/*/build 2>/dev/null || true
rm -rf packages/*/dist packages/*/lib packages/*/build 2>/dev/null || true

# Clean TypeScript build info
echo "🗑️  Cleaning TypeScript build info..."
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
find . -name "tsconfig.tsbuildinfo" -delete 2>/dev/null || true

# Clean test coverage
echo "🗑️  Cleaning test coverage..."
rm -rf coverage .nyc_output 2>/dev/null || true

# Clean logs
echo "🗑️  Cleaning logs..."
rm -rf logs *.log 2>/dev/null || true
find . -name "*.log" -delete 2>/dev/null || true

# Clean temp files
echo "🗑️  Cleaning temp files..."
rm -rf .tmp tmp temp 2>/dev/null || true

# Clean Bun cache (but keep node_modules)
echo "🗑️  Cleaning Bun cache..."
bun pm cache rm 2>/dev/null || true

# Clean pnpm store if it exists
echo "🗑️  Cleaning pnpm store..."
pnpm store clean --force 2>/dev/null || true

# Clean Turbo cache
echo "🗑️  Cleaning Turbo cache..."
rm -rf .turbo 2>/dev/null || true

# Clean specific large directories that might exist
echo "🗑️  Cleaning other artifacts..."
rm -rf .next .nuxt .vite dist build out 2>/dev/null || true

# Show largest remaining directories
echo "📊 Largest remaining directories:"
du -sh * 2>/dev/null | sort -hr | head -10
echo ""

show_disk_usage

echo "✅ Cleanup completed!"
echo ""
echo "💡 If you need more space, you can also run:"
echo "   - rm -rf node_modules && pnpm install (to clean and reinstall dependencies)"
echo "   - docker system prune -a (if you use Docker)"
echo "   - brew cleanup (if you use Homebrew)"