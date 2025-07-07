#!/bin/bash
set -e

echo "🔍 Verifying frontend setup..."

# Check if frontend is running
if ! lsof -i :3000 > /dev/null; then
    echo "❌ Frontend is not running. Starting frontend..."
    cd apps/frontend
    bun install
    bun run build
    bun run dev &
    sleep 5
fi

# Verify backend connectivity
if ! curl -s http://localhost:3002/health > /dev/null; then
    echo "❌ Backend is not responding. Starting backend..."
    cd apps/backend
    bun install
    bun run dev &
    sleep 5
fi

# Clear frontend cache
echo "🧹 Clearing frontend cache..."
rm -rf apps/frontend/.next/cache
rm -rf apps/frontend/node_modules/.cache

# Rebuild frontend
echo "🔨 Rebuilding frontend..."
cd apps/frontend
bun run build
bun run dev &

echo "✅ Frontend verification complete!"