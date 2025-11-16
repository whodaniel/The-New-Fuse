#!/bin/bash

# Launch TNF Functional Browser Hub
# This script launches the fully functional browser with tabs and backend integration

echo "🚀 Launching TNF Functional Browser Hub..."

# Check build status first
echo "🔍 Checking build status..."
node scripts/check-build-status.cjs

if [ $? -ne 0 ]; then
    echo "⚠️  Build required. Running smart build check..."
    node scripts/smart-dev.cjs &
    DEV_PID=$!
    
    # Wait a moment for services to start
    echo "⏳ Waiting for services to initialize..."
    sleep 5
    
    # Kill the dev process since we only want to build
    kill $DEV_PID 2>/dev/null || true
    wait $DEV_PID 2>/dev/null || true
fi

# Clear any existing ports first
echo "🧹 Clearing ports..."
node scripts/clear-ports.js

# Build the Electron app
echo "🔨 Building Electron app..."
cd apps/electron-desktop
pnpm run build
cd ../..

# Launch the Electron app with the functional browser hub
echo "🌟 Starting TNF Functional Browser Hub..."
cd apps/electron-desktop
pnpm run start

echo "✅ TNF Functional Browser Hub launched!"