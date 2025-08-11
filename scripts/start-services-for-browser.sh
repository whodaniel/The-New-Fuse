#!/bin/bash

# Start Services for Browser Hub
# This script starts the essential services needed for the browser hub

echo "🚀 Starting essential services for TNF Browser Hub..."

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✅ Port $port is already in use"
        return 0
    else
        echo "❌ Port $port is not in use"
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo "✅ $name is ready!"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts - $name not ready yet..."
        sleep 2
        ((attempt++))
    done
    
    echo "❌ $name failed to start after $max_attempts attempts"
    return 1
}

# Clear ports first
echo "🧹 Clearing any existing processes on required ports..."
node scripts/clear-ports.js

# Start services in background
echo "🚀 Starting backend services..."
bun run dev:direct > /tmp/tnf-services.log 2>&1 &
SERVICES_PID=$!

echo "📝 Services starting with PID: $SERVICES_PID"
echo "📋 Log file: /tmp/tnf-services.log"

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to initialize..."

# Check API Gateway (port 3005)
if wait_for_service "http://localhost:3005/health" "API Gateway"; then
    echo "🎯 API Gateway ready at http://localhost:3005"
else
    echo "⚠️  API Gateway may not be fully ready"
fi

# Check Theia IDE (port 3007)
if wait_for_service "http://localhost:3007" "Theia IDE"; then
    echo "🎯 Theia IDE ready at http://localhost:3007"
else
    echo "⚠️  Theia IDE may not be fully ready"
fi

# Check Backend API (port 3004)
if wait_for_service "http://localhost:3004/api/agents" "Backend API"; then
    echo "🎯 Backend API ready at http://localhost:3004"
else
    echo "⚠️  Backend API may not be fully ready"
fi

echo ""
echo "🎉 Services startup complete!"
echo ""
echo "📊 Service Status:"
echo "   • API Gateway: http://localhost:3005"
echo "   • Theia IDE: http://localhost:3007"  
echo "   • Backend API: http://localhost:3004"
echo ""
echo "💡 To stop services: kill $SERVICES_PID"
echo "📋 To view logs: tail -f /tmp/tnf-services.log"
echo ""
echo "🌟 You can now launch the browser hub!"

# Save PID for later cleanup
echo $SERVICES_PID > /tmp/tnf-services.pid

# Keep script running to maintain services
echo "⏳ Services running... Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    if [ -f /tmp/tnf-services.pid ]; then
        local pid=$(cat /tmp/tnf-services.pid)
        kill $pid 2>/dev/null || true
        rm -f /tmp/tnf-services.pid
    fi
    echo "👋 Services stopped."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for user to stop services
wait $SERVICES_PID