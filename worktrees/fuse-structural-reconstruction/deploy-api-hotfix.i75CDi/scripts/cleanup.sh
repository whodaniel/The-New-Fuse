#!/bin/bash

# Cleanup script for The New Fuse
# Removes build artifacts and temporary files

set -e

echo "🧹 Starting cleanup..."

# Remove node_modules
echo "📦 Removing node_modules..."
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# Remove build artifacts
echo "🏗️ Removing build artifacts..."
rm -rf dist
rm -rf build
rm -rf apps/*/dist
rm -rf apps/*/build
rm -rf packages/*/dist
rm -rf packages/*/build

# Remove lock files
echo "🔒 Removing lock files..."
rm -f pnpm-lock.yaml
rm -f package-lock.json

# Remove cache directories
echo "🗑️ Removing cache..."
rm -rf .cache
rm -rf .turbo
rm -rf .next

echo -e "\n${GREEN}Cleanup complete!${NC}"
echo -e "${GREEN}Run 'pnpm install' to reinstall dependencies${NC}"