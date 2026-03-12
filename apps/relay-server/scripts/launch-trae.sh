#!/bin/zsh
set -e

echo "🚀 Starting Redis verification..."

# Source zshrc directly to ensure functions are loaded
source ~/.zshrc

# First, ensure Redis is stopped
echo "🔄 Stopping any existing Redis instances..."
brew services stop redis 2>/dev/null || true
redis-cli shutdown 2>/dev/null || true
pkill redis-server 2>/dev/null || true
sleep 2

# Start Redis fresh
echo "🔄 Starting Redis service..."
brew services start redis
sleep 3  # Give Redis time to initialize

# Wait for Redis to be ready with more attempts
echo "⏳ Waiting for Redis to start..."
max_attempts=15
for i in $(seq 1 $max_attempts); do
    echo "Attempt $i of $max_attempts..."
    if redis-cli ping 2>/dev/null | grep -q "PONG"; then
        echo "✅ Redis is running and responding"
        break
    fi
    if [ $i -eq $max_attempts ]; then
        echo "❌ Redis failed to start after $max_attempts attempts"
        exit 1
    fi
    sleep 2
done

# Verify Redis URL
export REDIS_URL="redis://localhost:6379"
echo "📝 Using Redis URL: $REDIS_URL"

# Test Redis connection explicitly
echo "🔍 Testing Redis connection..."
if ! redis-cli -u $REDIS_URL ping > /dev/null; then
    echo "❌ Failed to connect to Redis at $REDIS_URL"
    exit 1
fi

# Subscribe to required channels in background
echo "📡 Setting up channel monitoring..."
redis-cli psubscribe "agent:*" "monitoring:*" &
MONITOR_PID=$!

# Send initialization message
echo "🤖 Sending initialization message..."
redis-cli publish agent:augment '{
    "type": "initialization",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "metadata": {
        "version": "1.0.0",
        "priority": "high",
        "source": "trae"
    },
    "details": {
        "action": "connect",
        "status": "ready",
        "capabilities": ["code_analysis", "task_coordination"]
    }
}'

echo "✨ Setup complete! Monitoring channels..."
echo "Press Ctrl+C to stop monitoring"

# Handle cleanup on script termination
trap 'kill $MONITOR_PID 2>/dev/null' EXIT

# Keep script running
wait $MONITOR_PID
