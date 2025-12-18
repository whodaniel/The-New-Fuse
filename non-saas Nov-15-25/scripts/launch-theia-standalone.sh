#!/bin/bash

# Launch Theia Standalone Script
# Launches just the Theia IDE server for testing

echo "🚀 Launching Theia IDE standalone..."

# Clear ports first
./scripts/clear-all-dev-ports.sh

# Change to project root
cd "$(dirname "$0")/.."

# Set environment
export PORT=3007
export NODE_ENV=development

echo "📍 Working directory: $(pwd)"
echo "🔧 Port: $PORT"

# Verify Theia build exists
if [ ! -f "apps/theia-ide/src-gen/backend/main.js" ]; then
    echo "❌ Theia backend not found. Building first..."
    pnpm run build:theia
    
    if [ $? -ne 0 ]; then
        echo "❌ Theia build failed"
        exit 1
    fi
fi

echo "✅ Theia build verified"

# Launch enhanced server
echo "🚀 Starting Theia enhanced server..."
cd apps/theia-ide
PORT=$PORT node enhanced-server.js