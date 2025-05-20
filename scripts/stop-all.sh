#!/bin/bash
set -e

echo "🛑 Stopping all services..."

# Kill processes on specific ports
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        echo "Stopping process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
}

# Stop all relevant ports
kill_port 3000  # Frontend
kill_port 3001  # API
kill_port 3002  # Backend
kill_port 3003  # Health Dashboard

# Stop Redis if running
if command -v redis-cli &> /dev/null; then
    echo "Stopping Redis..."
    redis-cli shutdown || true
fi

# Stop Docker containers if running
if command -v docker &> /dev/null; then
    echo "Stopping Docker containers..."
    docker-compose down --remove-orphans || true
fi

echo "✅ All services stopped!"