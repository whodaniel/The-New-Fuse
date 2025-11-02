#!/bin/bash

# Memory-Optimized Development Start
# Starts services sequentially with memory monitoring

set -e

echo "🚀 Starting memory-optimized development environment..."

# Function to check memory usage
check_memory() {
    local memory_usage=$(ps -A -o %mem | awk '{s+=$1} END {print s}')
    echo "Current memory usage: ${memory_usage}%"
    if (( $(echo "$memory_usage > 80" | bc -l) )); then
        echo "⚠️  High memory usage detected: ${memory_usage}%"
        return 1
    fi
    return 0
}

# Function to start service with memory check
start_service_safe() {
    local service_name=$1
    local port=$2
    local command=$3
    
    echo "🔄 Starting $service_name on port $port..."
    
    # Check if port is already in use
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port already in use, killing existing process..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Check memory before starting
    if ! check_memory; then
        echo "❌ Insufficient memory to start $service_name safely"
        return 1
    fi
    
    # Start the service in background
    eval "$command" &
    local pid=$!
    
    # Wait a moment and check if it's still running
    sleep 3
    if kill -0 $pid 2>/dev/null; then
        echo "✅ $service_name started successfully (PID: $pid)"
        return 0
    else
        echo "❌ $service_name failed to start"
        return 1
    fi
}

# Clear any existing processes
echo "🧹 Clearing existing processes..."
lsof -ti:3000,3001,3002,3004,3005,3007,3008,5174 | xargs kill -9 2>/dev/null || true
sleep 2

# Start services in order of priority and memory efficiency

echo "📊 Starting with memory monitoring..."

# 1. Start API Gateway first (lightweight)
if start_service_safe "API Gateway" 3005 "cd apps/api-gateway && pnpm run dev"; then
    echo "✅ API Gateway running"
else
    echo "❌ Failed to start API Gateway"
    exit 1
fi

sleep 5

# 2. Start Frontend (moderate memory)
if start_service_safe "Frontend" 3000 "cd apps/frontend && pnpm run dev"; then
    echo "✅ Frontend running"
else
    echo "⚠️  Frontend failed, continuing with other services..."
fi

sleep 5

# 3. Start Theia IDE (high memory - only if we have enough)
if check_memory; then
    if start_service_safe "Theia IDE" 3008 "cd apps/theia-ide && pnpm run dev"; then
        echo "✅ Theia IDE running"
    else
        echo "⚠️  Theia IDE failed, but other services are running"
    fi
else
    echo "⚠️  Skipping Theia IDE due to memory constraints"
    echo "💡 You can start it manually later with: cd apps/theia-ide && pnpm run dev"
fi

sleep 3

# 4. Start Electron (if memory allows)
if check_memory; then
    echo "🔄 Starting Electron Desktop..."
    cd apps/electron-desktop && pnpm run dev &
    echo "✅ Electron Desktop starting..."
else
    echo "⚠️  Skipping Electron due to memory constraints"
fi

echo ""
echo "🎉 Memory-optimized development environment started!"
echo ""
echo "📋 Service Status:"
echo "• API Gateway: http://localhost:3005"
echo "• Frontend: http://localhost:3000"
echo "• Theia IDE: http://localhost:3008 (if started)"
echo ""
echo "💡 Tips:"
echo "• Monitor memory usage with: top -o mem"
echo "• If services crash, try starting them individually"
echo "• Use Theia IDE at http://localhost:3008 for the best experience"
echo ""
echo "🔍 To check running services:"
echo "lsof -i :3000,3005,3008"