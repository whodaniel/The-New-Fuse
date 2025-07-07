#!/bin/bash

echo "🧹 Comprehensive Workspace Cleanup"
echo "=================================="

# Clean Turbo cache
echo "Cleaning Turbo cache..."
turbo run clean
rm -rf .turbo

# Clean node_modules in all packages
echo "Cleaning node_modules..."
find . -name "node_modules" -type d -prune -exec rm -rf {} \; 2>/dev/null || true

# Clean build artifacts
echo "Cleaning build artifacts..."
find . -name "dist" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name "build" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name ".next" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
find . -name "coverage" -type d -prune -exec rm -rf {} \; 2>/dev/null || true

# Clean lock files
echo "Cleaning lock files..."
rm -f bun.lockb package-lock.json bun.lockb

echo "✅ Workspace cleaned! Run 'bun install' to reinstall dependencies."
