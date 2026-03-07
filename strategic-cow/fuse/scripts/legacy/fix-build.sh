#!/bin/bash

echo "🔧 Fixing build issues..."

# Remove the postgres-migrations dependency from package.json
echo "Removing postgres-migrations dependency..."
sed -i '' '/postgres-migrations/d' package.json

# Run pnpm build
echo "Running pnpm build..."
pnpm build

echo "✅ Build process completed."
