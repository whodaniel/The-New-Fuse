#!/bin/bash
# Universal MCP Status Checker
# This script checks the status of MCP configurations and server

echo "MCP Status Check"
echo "================"
echo

# Look for common MCP configuration locations
HOME_DIR="$HOME"
CHECK_PATHS=(
  "$HOME/Library/Application Support/GitHub Copilot/mcp_config.json"
  "$HOME/Library/Application Support/Code/User/mcp_config.json"
  "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
)

# Check server status
if curl -s http://localhost:3772 -m 1 &>/dev/null; then
  echo "✅ MCP server: Running"
  
  # Get more details about the server
  SERVER_INFO=$(curl -s http://localhost:3772/status 2>/dev/null || echo "Status endpoint not available")
  if [[ "$SERVER_INFO" != "Status endpoint not available" ]]; then
    echo "Server info: $SERVER_INFO"
  fi
else
  echo "❌ MCP server: Not running"
fi

# Check configuration files
echo
echo "MCP Configuration Files:"
echo "----------------------"

CONFIG_COUNT=0
for path in "${CHECK_PATHS[@]}"; do
  if [[ -f "$path" ]]; then
    echo "✅ Found: $path"
    
    # Show basic info about the config
    ENDPOINT=$(grep -o '"endpoint"[^,}]*' "$path" 2>/dev/null | head -1 | cut -d'"' -f4 || echo "Unknown")
    ID=$(grep -o '"id"[^,}]*' "$path" 2>/dev/null | head -1 | cut -d'"' -f4 || echo "Unknown")
    echo "   ID: $ID"
    echo "   Endpoint: $ENDPOINT"
    ((CONFIG_COUNT++))
  else
    echo "❌ Missing: $path"
  fi
  echo
done

# Look for agent registrations
WORKSPACE_DIR="$HOME/Desktop/A1-Inter-LLM-Com/The New Fuse"
if [[ -d "$WORKSPACE_DIR" ]]; then
  AGENTS=$(find "$WORKSPACE_DIR" -name "agent_registration_*.json" -o -name "agent_*.json" 2>/dev/null)
  
  if [[ -n "$AGENTS" ]]; then
    echo "Agent Registrations:"
    echo "-------------------"
    
    while IFS= read -r agent_path; do
      echo "✅ Found: $(basename "$agent_path")"
      
      # Show basic agent info
      AGENT_ID=$(grep -o '"agentId"[^,}]*' "$agent_path" 2>/dev/null | head -1 | cut -d'"' -f4 || echo "Unknown")
      AGENT_NAME=$(grep -o '"name"[^,}]*' "$agent_path" 2>/dev/null | head -1 | cut -d'"' -f4 || echo "Unknown")
      echo "   ID: $AGENT_ID"
      echo "   Name: $AGENT_NAME"
      echo
    done <<< "$AGENTS"
  fi
fi

# Summary
echo
echo "Summary:"
echo "--------"
echo "MCP Server: $(if curl -s http://localhost:3772 -m 1 &>/dev/null; then echo "Running"; else echo "Not running"; fi)"
echo "Configured Tools: $CONFIG_COUNT"

if [[ $CONFIG_COUNT -eq 0 && ! $(curl -s http://localhost:3772 -m 1 &>/dev/null) ]]; then
  echo
  echo "❌ Your MCP environment is not configured."
  echo "   Run the setup wizard to configure MCP:"
  echo "   ./setup-universal-mcp.sh"
elif [[ $CONFIG_COUNT -eq 0 ]]; then
  echo
  echo "⚠️  MCP server is running but no tool configurations found."
  echo "   Run the configuration wizard to set up your tools:"
  echo "   osascript universal-mcp-wizard-fixed.applescript"
elif [[ ! $(curl -s http://localhost:3772 -m 1 &>/dev/null) ]]; then
  echo
  echo "⚠️  Tools are configured but MCP server is not running."
  echo "   Start the MCP server:"
  echo "   node mcp-config-manager-server.js"
else
  echo
  echo "✅ MCP environment is properly configured and running."
fi
