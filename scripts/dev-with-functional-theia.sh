#!/bin/bash

# Development script that ensures Theia is fully functional before launching Browser Hub

set -e

echo "🚀 Starting development with fully functional Theia..."

# Step 1: Ensure Theia is built and functional
echo "🔍 Checking Theia build status..."

if [ ! -f "apps/theia-ide/lib/build-info.json" ] || [ ! -f "apps/theia-ide/lib/backend/main.js" ]; then
    echo "⚠️  Theia not built or incomplete. Building now..."
    ./scripts/build-with-yarn-theia.sh
else
    echo "✅ Theia build found, verifying functionality..."
fi

# Step 2: Clear any existing processes on our ports
echo "🧹 Clearing ports..."
node scripts/clear-ports.js

# Step 3: Start services in sequence
echo "📋 Starting services in optimized sequence..."

# Start core services first (API Gateway, Backend, Frontend)
echo "🔨 Stage 1: Starting core services..."
bun run dev:api &
API_PID=$!
sleep 2

bun run dev:gateway &
GATEWAY_PID=$!
sleep 2

bun run dev:frontend &
FRONTEND_PID=$!
sleep 3

# Start Theia IDE and wait for it to be ready
echo "🔨 Stage 2: Starting Theia IDE..."
cd apps/theia-ide
PORT=3007 node enhanced-server.js &
THEIA_PID=$!
cd ../..

# Wait for Theia to be fully ready
echo "⏳ Waiting for Theia IDE to be fully functional..."
for i in {1..30}; do
    if curl -s http://localhost:3007 > /dev/null 2>&1; then
        echo "✅ Theia IDE is fully functional and ready!"
        break
    fi
    echo "   Attempt $i/30: Waiting for Theia..."
    sleep 2
done

# Verify Theia is actually responding
if ! curl -s http://localhost:3007 > /dev/null 2>&1; then
    echo "❌ Theia IDE failed to start properly"
    exit 1
fi

# Start Browser Hub after Theia is confirmed ready
echo "🔨 Stage 3: Starting Browser Hub (Theia is ready)..."
bun run dev:hub &
HUB_PID=$!

echo ""
echo "✅ All services started successfully!"
echo "📋 Service URLs:"
echo "   • API Gateway: http://localhost:3005"
echo "   • Backend API: http://localhost:3004"
echo "   • Frontend App: http://localhost:3000"
echo "   • Theia IDE: http://localhost:3007 (FULLY FUNCTIONAL)"
echo "   • Browser Hub: Electron app launched"
echo ""
echo "🎯 Theia is now fully functional when Browser Hub launches!"
echo ""
echo "Press Ctrl+C to stop all services..."

# Handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down all services..."
    kill $API_PID $GATEWAY_PID $FRONTEND_PID $THEIA_PID $HUB_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for any process to exit
wait