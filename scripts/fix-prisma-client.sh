#!/bin/bash

# Fix Drizzle Client Issues
set -e

echo "🔧 Fixing Drizzle Client configuration..."

# Step 1: Update Drizzle client to latest version
echo "📦 Updating Drizzle client..."
pnpm add @drizzle/client@latest drizzle@latest --dev

# Step 2: Generate Drizzle client
echo "🔨 Generating Drizzle client..."
pnpm dlx drizzle generate --schema=drizzle/schema.drizzle

# Step 3: Ensure the generated client is accessible
echo "🔗 Creating symlink for generated client..."
if [ ! -L "node_modules/@drizzle/client" ]; then
    rm -rf node_modules/@drizzle/client
    ln -sf "../../packages/database/generated/drizzle" node_modules/@drizzle/client
fi

echo "✅ Drizzle client fixed successfully!"