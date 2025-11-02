#!/bin/bash

echo "🚀 Starting The New Fuse Development Environment"
echo "================================================"

# Kill existing processes on our ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2

# Clean problematic files
echo "🗂️  Cleaning up problematic files..."
find apps/frontend/src -name "*.js.map" -delete 2>/dev/null || true
find apps/frontend/src -name "websocket.js*" -delete 2>/dev/null || true

# Start frontend
echo "🎨 Starting Frontend on port 3000..."
cd apps/frontend && pnpm run dev
