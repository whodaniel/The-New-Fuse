#!/bin/bash

# Lightweight Development Mode
# Starts only essential services to minimize memory usage

set -e

echo "🪶 Starting lightweight development mode..."

# Clear any existing processes
echo "🧹 Clearing ports..."
lsof -ti:3000,3005,3008 | xargs kill -9 2>/dev/null || true
sleep 2

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $service_name on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port >/dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi
        
        if [ $((attempt % 5)) -eq 0 ]; then
            echo "   Still waiting... (attempt $attempt/$max_attempts)"
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "⚠️  $service_name didn't start within expected time"
    return 1
}

echo "🚀 Starting essential services..."

# Start API Gateway
echo "📡 Starting API Gateway..."
cd apps/api-gateway
bun run dev &
API_PID=$!
cd - > /dev/null

# Start Frontend
echo "🌐 Starting Frontend..."
cd apps/frontend
bun run dev &
FRONTEND_PID=$!
cd - > /dev/null

# Start Theia IDE (most important for development)
echo "💻 Starting Theia IDE..."
cd apps/theia-ide
bun run dev &
THEIA_PID=$!
cd - > /dev/null

# Wait for services to be ready
sleep 10

echo ""
echo "🎯 Checking service health..."

# Check if processes are still running
if kill -0 $API_PID 2>/dev/null; then
    echo "✅ API Gateway (PID: $API_PID)"
else
    echo "❌ API Gateway failed"
fi

if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ Frontend (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend failed"
fi

if kill -0 $THEIA_PID 2>/dev/null; then
    echo "✅ Theia IDE (PID: $THEIA_PID)"
else
    echo "❌ Theia IDE failed"
fi

echo ""
echo "🎉 Lightweight development environment ready!"
echo ""
echo "📋 Access your services:"
echo "• 🌐 Frontend: http://localhost:3000"
echo "• 📡 API Gateway: http://localhost:3005"
echo "• 💻 Theia IDE: http://localhost:3008"
echo ""
echo "💡 This mode uses minimal memory by running only essential services."
echo "🔍 Monitor with: ps aux | grep -E '(bun|node)' | grep -v grep"
echo ""
echo "⏹️  To stop all services:"
echo "kill $API_PID $FRONTEND_PID $THEIA_PID"

# Keep script running to monitor services
echo "🔄 Monitoring services... (Press Ctrl+C to stop all)"

trap "echo '🛑 Stopping all services...'; kill $API_PID $FRONTEND_PID $THEIA_PID 2>/dev/null; exit 0" INT

# Monitor loop
while true; do
    sleep 30
    
    # Check if any service died
    if ! kill -0 $API_PID 2>/dev/null; then
        echo "⚠️  API Gateway stopped unexpectedly"
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "⚠️  Frontend stopped unexpectedly"
    fi
    
    if ! kill -0 $THEIA_PID 2>/dev/null; then
        echo "⚠️  Theia IDE stopped unexpectedly"
    fi
done