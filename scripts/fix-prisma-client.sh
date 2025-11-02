#!/bin/bash

# Fix Prisma Client Issues
set -e

echo "🔧 Fixing Prisma Client configuration..."

# Step 1: Update Prisma client to latest version
echo "📦 Updating Prisma client..."
pnpm add @prisma/client@latest prisma@latest --dev

# Step 2: Generate Prisma client
echo "🔨 Generating Prisma client..."
pnpm dlx prisma generate --schema=prisma/schema.prisma

# Step 3: Ensure the generated client is accessible
echo "🔗 Creating symlink for generated client..."
if [ ! -L "node_modules/@prisma/client" ]; then
    rm -rf node_modules/@prisma/client
    ln -sf "../../packages/database/generated/prisma" node_modules/@prisma/client
fi

echo "✅ Prisma client fixed successfully!"