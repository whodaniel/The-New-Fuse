#!/bin/bash

set -e

echo "🔧 Fixing dependency issues..."

# Remove problematic GraphQL dependencies and clean cache
echo "Cleaning cache and lock files..."
rm -rf node_modules/.cache
rm -rf .turbo
rm -f bun.lockb

# Find and remove any GraphQL references
echo "Checking for GraphQL dependencies..."
grep -r "@nestjs/graphql" . --include="*.json" || echo "No GraphQL dependencies found"

# Clean install
echo "Clean installing dependencies..."
pnpm install --no-cache

echo "✅ Dependencies fixed!"