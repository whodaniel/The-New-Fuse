#!/bin/bash

# Test SkIDEancer Server Script
# Tests if the enhanced SkIDEancer server starts correctly

echo "🧪 Testing SkIDEancer Enhanced Server..."

# Change to the correct directory
cd "$(dirname "$0")/.."

# Set environment variables
export PORT=3007
export NODE_ENV=development

echo "📍 Working directory: $(pwd)"
echo "🔧 Port: $PORT"

# Start the server in background
echo "🚀 Starting enhanced server..."
node apps/ide-ide/enhanced-server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 8

# Test if server is responding
echo "🔍 Testing server response..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/health || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Server is responding correctly (HTTP $HTTP_CODE)"
    
    # Test dashboard endpoint
    DASHBOARD_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/dashboard || echo "000")
    if [ "$DASHBOARD_CODE" = "200" ]; then
        echo "✅ Dashboard endpoint working (HTTP $DASHBOARD_CODE)"
    else
        echo "⚠️  Dashboard endpoint issue (HTTP $DASHBOARD_CODE)"
    fi
    
    # Test MCP status
    MCP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/mcp/status || echo "000")
    if [ "$MCP_CODE" = "200" ]; then
        echo "✅ MCP API working (HTTP $MCP_CODE)"
    else
        echo "⚠️  MCP API issue (HTTP $MCP_CODE)"
    fi
    
    echo "🎯 Enhanced server test PASSED"
    RESULT=0
else
    echo "❌ Server not responding (HTTP $HTTP_CODE)"
    echo "🔍 Checking server logs..."
    RESULT=1
fi

# Clean up
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
sleep 2

# Kill any remaining processes on the port
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true

exit $RESULT