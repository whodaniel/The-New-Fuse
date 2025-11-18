#!/bin/bash

# Format and fix the entire codebase
# This script runs prettier and eslint --fix on all files

set -e

echo "🎨 Starting codebase formatting and linting..."
echo ""

# Step 1: Run Prettier on all files
echo "📝 Step 1/3: Running Prettier to format code..."
pnpm run format:root || echo "⚠️  Some Prettier errors occurred, continuing..."
echo ""

# Step 2: Run ESLint --fix on key directories
echo "🔧 Step 2/3: Running ESLint --fix on apps..."
pnpm eslint "apps/**/*.{ts,tsx,js,jsx}" --fix --max-warnings=999999 || echo "⚠️  Some ESLint errors occurred in apps, continuing..."
echo ""

echo "🔧 Running ESLint --fix on packages..."
pnpm eslint "packages/**/*.{ts,tsx,js,jsx}" --fix --max-warnings=999999 || echo "⚠️  Some ESLint errors occurred in packages, continuing..."
echo ""

echo "🔧 Running ESLint --fix on tools..."
pnpm eslint "tools/**/*.{ts,tsx,js,jsx}" --fix --max-warnings=999999 || echo "⚠️  Some ESLint errors occurred in tools, continuing..."
echo ""

# Step 3: Run Prettier again to fix any formatting issues from ESLint
echo "📝 Step 3/3: Running Prettier again to ensure consistent formatting..."
pnpm run format:root || echo "⚠️  Some Prettier errors occurred, continuing..."
echo ""

echo "✅ Codebase formatting and linting complete!"
echo ""
echo "Note: Some errors may remain. Review the output above for details."
echo "You can run 'pnpm run lint' to see remaining issues."
