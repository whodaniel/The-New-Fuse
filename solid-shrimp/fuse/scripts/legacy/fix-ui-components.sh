#!/bin/bash
set -e

echo "🔧 Fixing UI Components package..."

# Navigate to the UI components package
cd packages/ui-components

# Clean the dist directory
echo "🧹 Cleaning dist directory..."
yarn clean

# Fix import paths in index.ts
echo "🔄 Fixing import paths in index.ts..."
sed -i '' 's/\.js\.js/\.js/g' src/index.ts

# Fix import paths in card/index.tsx
echo "🔄 Fixing import paths in card/index.tsx..."
sed -i '' 's/\.js\.js/\.js/g' src/core/card/index.tsx

# Build the package
echo "🏗️ Building UI Components package..."
yarn build

echo "✅ UI Components package fixed!"
