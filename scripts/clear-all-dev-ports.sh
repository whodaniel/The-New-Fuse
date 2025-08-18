#!/bin/bash

# Clear All Development Ports Script
# Clears all ports used by The New Fuse development environment

echo "🧹 Clearing all development ports..."

# Define all ports used in development
PORTS=(3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 5173 5174 5555)

for port in "${PORTS[@]}"; do
    echo "🔍 Checking port $port..."
    
    # Find processes using the port
    PIDS=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$PIDS" ]; then
        echo "⚠️  Port $port is in use by PIDs: $PIDS"
        
        # Kill processes gracefully first
        for pid in $PIDS; do
            echo "🛑 Stopping process $pid on port $port..."
            kill -TERM $pid 2>/dev/null || true
        done
        
        # Wait a moment
        sleep 2
        
        # Force kill if still running
        REMAINING=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$REMAINING" ]; then
            echo "💥 Force killing remaining processes on port $port..."
            kill -9 $REMAINING 2>/dev/null || true
        fi
        
        echo "✅ Port $port cleared"
    else
        echo "✅ Port $port is already clear"
    fi
done

# Also kill any node processes that might be related to our project
echo "🔍 Checking for related Node.js processes..."
pkill -f "enhanced-server.js" 2>/dev/null || true
pkill -f "theia" 2>/dev/null || true
pkill -f "memory-optimized-dev" 2>/dev/null || true

echo "✨ All development ports cleared!"
echo "🎯 Ready to start fresh development environment"