#!/bin/bash
# test-streamable-http.sh - Test the enhanced MCP server with Streamable HTTP support
# Compatible with the April 2025 VS Code features

echo "Testing The New Fuse MCP Server with Streamable HTTP Transport"
echo "=============================================================="

# Check if the MCP server is running
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "🔴 MCP server is not running. Starting it now..."
    
    # Source environment variables if they exist
    if [ -f ".env" ]; then
        source .env
    fi
    
    # Start the MCP server with Streamable HTTP support
    cd src/mcp && \
    ENABLE_STREAMABLE_HTTP=true \
    ENABLE_PROGRESS_NOTIFICATIONS=true \
    ENHANCED_UI=true \
    node server.js &
    
    MCP_PID=$!
    echo "🟢 Started MCP server (PID: $MCP_PID)"
    
    # Give the server time to start
    echo "⏳ Waiting for server to initialize..."
    sleep 5
else
    echo "🟢 MCP server is already running"
fi

# Test basic connectivity
echo -e "\nTesting basic connectivity..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
echo "Health check response: $HEALTH_RESPONSE"

# Test Streamable HTTP capability
echo -e "\nTesting Streamable HTTP transport capability..."
STREAM_TEST=$(curl -s -N http://localhost:3000/capabilities/streamable-http)
if [[ "$STREAM_TEST" == *"supported"* ]]; then
    echo "🟢 Streamable HTTP transport is supported!"
else
    echo "🔴 Streamable HTTP transport is not detected. Please check server configuration."
fi

# Run a simple streaming request to test real-time updates
echo -e "\nTesting streaming request with progress updates..."
echo "Starting a long-running task with progress reporting..."

# Use curl with -N flag to keep connection open for streaming response
curl -s -N -X POST \
  -H "Content-Type: application/json" \
  -d '{"action":"longRunningTask","parameters":{"duration":5,"reportProgress":true}}' \
  http://localhost:3000/tools/execute

echo -e "\n\n✅ Testing complete!"
echo "You can now use VS Code's enhanced AI features with The New Fuse's MCP server."
echo "The enhanced UI will show tool inputs, outputs, and progress messages."
echo -e "\nTo use these features in your workflows:"
echo "1. Create AITasks with progress reporting (see the updated AITask interface)"
echo "2. Use the prompt templates in .vscode/prompts/ to generate compatible code"
echo "3. Press Shift+Cmd+I to quickly access agent mode with AI assistance"
