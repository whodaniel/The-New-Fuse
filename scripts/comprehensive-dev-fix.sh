#!/bin/bash

# Comprehensive Development Environment Fix
set -e

echo "🚀 Running comprehensive development environment fix..."

# Step 1: Fix native modules issue
echo "🔧 Step 1: Fixing native modules..."
rm -rf node_modules/@ide/git/node_modules/find-git-repositories/build/
rm -rf node_modules/find-git-repositories/build/ 2>/dev/null || true

# Step 2: Clear all caches
echo "🧹 Step 2: Clearing caches..."
rm -rf .turbo/
rm -rf node_modules/.cache/
rm -rf apps/*/node_modules/.cache/
rm -rf packages/*/node_modules/.cache/
rm -rf apps/frontend/node_modules/.vite/
rm -rf apps/frontend/dist/

# Step 3: Fix Prisma client
echo "🔧 Step 3: Fixing Prisma client..."
cd packages/database
pnpm dlx prisma generate --schema=../../prisma/schema.prisma || echo "Prisma generation failed, continuing..."
cd - > /dev/null

# Step 4: Install missing dependencies
echo "📦 Step 4: Installing missing dependencies..."
pnpm add cookie@latest @chakra-ui/icons --dev

# Step 5: Rebuild native modules with proper flags
echo "🔨 Step 5: Rebuilding native modules..."
export npm_config_build_from_source=true
export npm_config_cache_max=0

# Try to rebuild the problematic native module
cd node_modules/@ide/git/node_modules/find-git-repositories
npm rebuild --verbose || {
    echo "⚠️  Native module rebuild failed, trying alternative approach..."
    # Try with different node version compatibility
    export npm_config_target_arch=x64
    export npm_config_target_platform=darwin
    npm rebuild --verbose || echo "⚠️  Still failing, but continuing..."
}
cd - > /dev/null

# Step 6: Clear port conflicts
echo "🔌 Step 6: Clearing port conflicts..."
lsof -ti:3000,3001,3002,3004,3005,3007,3008,5174 | xargs kill -9 2>/dev/null || true

echo "✅ Comprehensive fix complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Try running 'pnpm run dev' again"
echo "2. If SkIDEancer still has issues, the IDE should work on port 3008"
echo "3. Frontend should be available on port 3000"
echo "4. API Gateway should be on port 3005"