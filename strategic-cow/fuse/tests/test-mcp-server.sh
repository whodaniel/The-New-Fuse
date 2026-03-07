#!/bin/bash

# Test script for the MCP Configuration Manager server

echo "Testing MCP Configuration Manager server..."
echo

# Create a named pipe for bidirectional communication
PIPE_DIR="/tmp/mcp-test-$$"
mkdir -p "$PIPE_DIR"
INPUT_PIPE="$PIPE_DIR/input"
OUTPUT_PIPE="$PIPE_DIR/output"
mkfifo "$INPUT_PIPE"
mkfifo "$OUTPUT_PIPE"

# Start the MCP server with the pipes
cat "$INPUT_PIPE" | node ../scripts/mcp-config-manager-server.js > "$OUTPUT_PIPE" &
SERVER_PID=$!

# Give the server a moment to start
sleep 1

# Send a discovery request and parse the response
echo "1. Testing discovery..."
DISCOVERY_REQUEST='{"jsonrpc":"2.0","id":1,"method":"rpc.discover"}'

echo "Request: $DISCOVERY_REQUEST"
echo "$DISCOVERY_REQUEST" > "$INPUT_PIPE" &
DISCOVERY_RESPONSE=$(cat "$OUTPUT_PIPE")
echo "Response: $DISCOVERY_RESPONSE"
echo

# Send a list_mcp_servers request and parse the response
echo "2. Testing list_mcp_servers..."
LIST_REQUEST='{"jsonrpc":"2.0","id":2,"method":"call_tool","params":{"tool_name":"list_mcp_servers","tool_args":{}}}'

echo "Request: $LIST_REQUEST"
LIST_RESPONSE=$(echo "$LIST_REQUEST" | node ../scripts/mcp-config-manager-server.js)
echo "Response: $LIST_RESPONSE"
echo

echo "MCP Configuration Manager server test complete!"
