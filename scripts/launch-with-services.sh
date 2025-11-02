#!/bin/bash

# Launch TNF Functional Browser Hub with Backend Services
# This script ensures everything is built and starts all services

echo "🚀 Launching TNF Browser Hub with Full Backend Services..."

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    if [ ! -z "$DEV_PID" ]; then
        kill $DEV_PID 2>/dev/null || true
        wait $DEV_PID 2>/dev/null || true
    fi
    echo "👋 Services stopped."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check and ensure build is complete
echo "🔍 Checking build status..."
node scripts/check-build-status.cjs

if [ $? -ne 0 ]; then
    echo "⚠️  Build required. Running smart build..."
    if ! node scripts/smart-dev.cjs --build-only; then
        echo "❌ Build failed. Cannot proceed."
        exit 1
    fi
fi

# Start backend services in background
echo "🚀 Starting backend services..."
pnpm run dev:direct &
DEV_PID=$!

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."
SERVICE_COUNT=0

# Check API Gateway (port 3005)
if curl -s -f http://localhost:3005/health > /dev/null 2>&1; then
    echo "  ✅ API Gateway (port 3005) - Online"
    ((SERVICE_COUNT++))
else
    echo "  ⚠️  API Gateway (port 3005) - Starting..."
fi

# Check Theia IDE (port 3007)
if curl -s -f http://localhost:3007 > /dev/null 2>&1; then
    echo "  ✅ Theia IDE (port 3007) - Online"
    ((SERVICE_COUNT++))
else
    echo "  ⚠️  Theia IDE (port 3007) - Starting..."
fi

# Check Frontend (port 3000)
if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ Frontend (port 3000) - Online"
    ((SERVICE_COUNT++))
else
    echo "  ⚠️  Frontend (port 3000) - Starting..."
fi

echo "📊 Services status: $SERVICE_COUNT/3 online"

# Build and launch Electron app
echo "🔨 Building Electron app..."
cd apps/electron-desktop
if ! pnpm run build; then
    echo "❌ Electron build failed"
    cleanup
    exit 1
fi

echo "🌟 Launching TNF Functional Browser Hub..."
echo ""
echo "🎉 Browser Hub is starting with the following services:"
echo "   • TNF Dashboard: http://localhost:3000"
echo "   • API Gateway: http://localhost:3005"
echo "   • Theia IDE: http://localhost:3007"
echo ""
echo "Press Ctrl+C to stop all services and close the browser."
echo ""

# Start Electron app (this will block)
pnpm run start

# Cleanup when Electron closes
cleanup