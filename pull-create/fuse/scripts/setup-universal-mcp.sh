#!/bin/bash
# Universal MCP Setup Script

echo "Universal MCP Setup - Combined Server & Configuration Tool"
echo "========================================================="
echo

# Locate the wizard and server scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
WIZARD_PATH="$SCRIPT_DIR/universal-mcp-wizard-fixed.applescript"
SERVER_PATH="$SCRIPT_DIR/mcp-config-manager-server.js"

# Check script existence
if [[ ! -f "$WIZARD_PATH" ]]; then
  echo "❌ Error: Wizard script not found at $WIZARD_PATH"
  exit 1
fi

if [[ ! -f "$SERVER_PATH" ]]; then
  echo "⚠️  Warning: MCP server script not found at $SERVER_PATH"
else
  echo "✅ Found MCP server script"
fi

# Make scripts executable
chmod +x "$WIZARD_PATH" 2>/dev/null
chmod +x "$SERVER_PATH" 2>/dev/null

# Check if server is already running
if curl -s http://localhost:3772 -m 1 &>/dev/null; then
  echo "✅ MCP server is already running"
  SERVER_RUNNING=true
else
  echo "ℹ️  MCP server is not running"
  SERVER_RUNNING=false
  
  # Ask if user wants to start the server
  read -p "Do you want to start the MCP server? [Y/n] " START_SERVER
  START_SERVER=${START_SERVER:-Y}
  
  if [[ $START_SERVER =~ ^[Yy] ]]; then
    echo "Starting MCP server in the background..."
    node "$SERVER_PATH" &>"/tmp/mcp-server-$(date +%s).log" &
    SERVER_PID=$!
    echo "✅ Started MCP server (PID: $SERVER_PID)"
    
    # Wait for server to be ready
    echo "Waiting for server to start..."
    for i in {1..10}; do
      if curl -s http://localhost:3772 -m 1 &>/dev/null; then
        echo "✅ MCP server is now running"
        break
      fi
      echo -n "."
      sleep 1
    done
    echo
  fi
fi

# Launch the wizard
echo "Launching MCP configuration wizard..."
osascript "$WIZARD_PATH" 2>"/tmp/mcp-wizard-error.log"

# Show command to check logs if needed
echo
echo "MCP configuration completed."
echo "To check server logs: cat /tmp/mcp-server-*.log"
echo "To check wizard error logs: cat /tmp/mcp-wizard-error.log"
