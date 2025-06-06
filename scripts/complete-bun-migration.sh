#!/bin/bash

# Complete Bun Migration Script
# This script finishes the migration from Yarn to Bun

echo "🔄 Completing Bun migration..."

# Update packageManager in all package.json files
echo "📦 Updating packageManager fields..."
find . -name "package.json" -not -path "./node_modules/*" -not -path "./*/node_modules/*" -not -path "./node-v22.16.0-linux-x64/*" -exec sed -i.bak 's/"packageManager": "yarn@[^"]*"/"packageManager": "bun@1.0.0"/g' {} \;

# Remove backup files
find . -name "package.json.bak" -delete

# Update any remaining yarn commands in scripts
echo "🔧 Updating yarn commands in scripts..."
find . -name "package.json" -not -path "./node_modules/*" -not -path "./*/node_modules/*" -not -path "./node-v22.16.0-linux-x64/*" -exec sed -i.bak 's/"yarn /"bun /g' {} \;
find . -name "package.json" -not -path "./node_modules/*" -not -path "./*/node_modules/*" -not -path "./node-v22.16.0-linux-x64/*" -exec sed -i.bak 's/"yarn"/"bun"/g' {} \;

# Remove backup files again
find . -name "package.json.bak" -delete

echo "✅ Bun migration completed!"
echo "📋 Next: Check Dockerfiles and CI/CD scripts for any remaining yarn references"