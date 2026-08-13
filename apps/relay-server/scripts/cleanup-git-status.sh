#!/bin/bash

echo "🧹 Cleaning up duplicate and incorrectly named files..."

# Remove files with incorrect extensions
echo "Removing .d.d.ts files..."
find . -name "*.d.d.ts" -type f -delete

echo "Removing .ts-e files..."
find . -name "*.ts-e" -type f -delete

echo "Removing duplicate .tsx files in types package..."
find packages/types -name "*.tsx" -type f -delete

echo "Removing other problematic extensions..."
find . -name "*.d.tsx" -type f -delete 2>/dev/null || true

echo "✅ Cleanup complete"

# Show what's left
echo "📊 Remaining modified files:"
git status --porcelain | wc -l
echo "files still modified"
