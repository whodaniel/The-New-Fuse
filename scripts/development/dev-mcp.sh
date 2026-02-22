#!/bin/bash

set -e

echo "🔧 Starting MCP development mode..."

# Navigate to project root
cd "$(dirname "$0")"

# Set environment variables
export NODE_ENV=development
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fuse
export REDIS_URL=redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570
export LOG_LEVEL=debug

# Install nodemon if not present
if ! command -v nodemon &> /dev/null; then
    echo "Installing nodemon for development..."
    pnpm install -g nodemon
fi

# Start TypeScript compiler in watch mode
echo "Starting TypeScript compiler in watch mode..."
npx tsc --project src/mcp/tsconfig.json --watch &
TSC_PID=$!

# Wait for initial compilation
sleep 3

# Start the server with auto-restart
echo "Starting MCP server with auto-restart..."
npx nodemon --watch dist/mcp --ext js dist/mcp/server.js &
NODEMON_PID=$!

# Cleanup function
cleanup() {
    echo "Stopping development servers..."
    kill $TSC_PID 2>/dev/null || true
    kill $NODEMON_PID 2>/dev/null || true
    exit 0
}

# Trap cleanup on exit
trap cleanup INT TERM

echo "✅ Development mode started!"
echo "📍 TypeScript compiler: PID $TSC_PID"
echo "📍 MCP server: PID $NODEMON_PID"
echo "Press Ctrl+C to stop"

# Wait for processes
wait
