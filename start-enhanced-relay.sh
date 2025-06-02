#!/bin/bash

# Enhanced TNF Relay Startup Script
# Starts the enhanced relay with proper environment setup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RELAY_SCRIPT="$SCRIPT_DIR/enhanced-tnf-relay.js"

echo "🚀 Starting Enhanced TNF Relay v3.0..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if WebSocket package is installed
if ! node -e "require('ws')" 2>/dev/null; then
    echo "📦 Installing required WebSocket package..."
    npm install ws
fi

# Check if the enhanced relay script exists
if [ ! -f "$RELAY_SCRIPT" ]; then
    echo "❌ Enhanced relay script not found at: $RELAY_SCRIPT"
    exit 1
fi

# Make the relay script executable
chmod +x "$RELAY_SCRIPT"

# Create logs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/logs"

# Check if relay is already running
RELAY_PID=$(pgrep -f "enhanced-tnf-relay.js" || true)
if [ ! -z "$RELAY_PID" ]; then
    echo "⚠️  Enhanced TNF Relay is already running (PID: $RELAY_PID)"
    echo "   Use 'pkill -f enhanced-tnf-relay.js' to stop it first"
    exit 1
fi

# Start the enhanced relay
echo "🔧 Starting Enhanced TNF Relay..."
echo "   HTTP API: http://localhost:3000"
echo "   WebSocket: ws://localhost:3001"
echo "   Logs: $SCRIPT_DIR/logs/"
echo ""

# Start in background with log redirection
nohup node "$RELAY_SCRIPT" start > "$SCRIPT_DIR/logs/relay.log" 2>&1 &
RELAY_PID=$!

# Save PID for later management
echo $RELAY_PID > "$SCRIPT_DIR/relay.pid"

echo "✅ Enhanced TNF Relay started successfully!"
echo "   PID: $RELAY_PID"
echo "   Log file: $SCRIPT_DIR/logs/relay.log"
echo ""
echo "🔗 Quick Commands:"
echo "   Status:  curl http://localhost:3000/status"
echo "   Stop:    pkill -f enhanced-tnf-relay.js"
echo "   Logs:    tail -f $SCRIPT_DIR/logs/relay.log"
echo ""
echo "📋 Chrome Extension Setup:"
echo "   1. Open Chrome Extension settings"
echo "   2. Set Relay URL to: ws://localhost:3001"
echo "   3. Enable AI automation features"
echo ""
echo "Press Ctrl+C to view logs, or run in foreground with:"
echo "   node $RELAY_SCRIPT start"

# Wait a moment to ensure it started
sleep 2

# Check if it's running
if ps -p $RELAY_PID > /dev/null; then
    echo ""
    echo "🎉 Enhanced TNF Relay is now running!"
    
    # Test the HTTP endpoint
    if curl -s http://localhost:3000/status > /dev/null; then
        echo "✅ HTTP API is responding"
    else
        echo "⚠️  HTTP API may not be ready yet (this is normal)"
    fi
else
    echo ""
    echo "❌ Failed to start Enhanced TNF Relay"
    echo "   Check the log file: $SCRIPT_DIR/logs/relay.log"
    exit 1
fi
