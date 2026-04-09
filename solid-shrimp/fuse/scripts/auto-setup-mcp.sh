#!/bin/bash
# MCP Auto-Configuration Example
# This script demonstrates how to use the wizard in a scripted fashion

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"

# Ensure the MCP server is running first
echo "Starting MCP Server..."
node "$SCRIPT_DIR/mcp-config-manager-server.js" &>/tmp/mcp-auto-setup.log &
SERVER_PID=$!

# Give the server a moment to start
sleep 2

# Define the configuration paths (already in Mac format with colons)
COPILOT_CONFIG="$HOME:Library:Application Support:GitHub Copilot:mcp_config.json"
VSCODE_CONFIG="$HOME:Library:Application Support:Code:User:mcp_config.json"
CLAUDE_CONFIG="$HOME:Library:Application Support:Claude:claude_desktop_config.json"

# Define the standard JSON templates with a fixed endpoint
STANDARD_CONFIG_TEMPLATE='{
  "initialized": true,
  "version": "1.0",
  "capabilities": [
    {
      "id": "universal-mcp",
      "name": "Universal MCP Provider",
      "endpoint": "http://localhost:3772",
      "authentication": {
        "type": "none"
      }
    }
  ],
  "initialize": {
    "enabled": true
  }
}'

CLAUDE_CONFIG_TEMPLATE='{
  "initialized": true,
  "version": "1.0",
  "mcp": {
    "enabled": true,
    "initialize": {
      "enabled": true
    },
    "capabilities": [
      {
        "id": "universal-mcp",
        "name": "Universal MCP Provider for Claude",
        "endpoint": "http://localhost:3772",
        "authentication": {
          "type": "none"
        }
      }
    ]
  }
}'

# Create parent directories and write configurations
echo "Setting up configurations..."

# Copilot config
COPILOT_DIR=$(dirname "$(echo "$COPILOT_CONFIG" | tr ":" "/")")
mkdir -p "$COPILOT_DIR"
echo "$STANDARD_CONFIG_TEMPLATE" > "$(echo "$COPILOT_CONFIG" | tr ":" "/")"
echo "✓ Created GitHub Copilot configuration"

# VS Code config
VSCODE_DIR=$(dirname "$(echo "$VSCODE_CONFIG" | tr ":" "/")")
mkdir -p "$VSCODE_DIR"
echo "$STANDARD_CONFIG_TEMPLATE" > "$(echo "$VSCODE_CONFIG" | tr ":" "/")"
echo "✓ Created VS Code configuration"

# Claude config
CLAUDE_DIR=$(dirname "$(echo "$CLAUDE_CONFIG" | tr ":" "/")")
mkdir -p "$CLAUDE_DIR"
echo "$CLAUDE_CONFIG_TEMPLATE" > "$(echo "$CLAUDE_CONFIG" | tr ":" "/")"
echo "✓ Created Claude configuration"

# Create a sample agent registration
AGENT_ID="agent-$(openssl rand -hex 4)"
AGENT_CONFIG="{
  \"agentId\": \"$AGENT_ID\",
  \"name\": \"AutoSetupAgent\",
  \"capabilities\": [\"text-generation\", \"code-generation\", \"tool-execution\"],
  \"mcp\": {
    \"version\": \"1.0\",
    \"initialize\": {
      \"enabled\": true
    }
  }
}"

echo "$AGENT_CONFIG" > "$WORKSPACE_DIR/agent_registration_$AGENT_ID.json"
echo "✓ Created agent registration: agent_registration_$AGENT_ID.json"

echo
echo "MCP Auto-Configuration Complete"
echo "------------------------------"
echo "✓ MCP server running (PID: $SERVER_PID)"
echo "✓ 3 tools configured"
echo "✓ 1 agent registered"
echo
echo "To verify the setup, run: ./check-mcp-status.sh"
