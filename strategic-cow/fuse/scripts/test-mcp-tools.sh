#!/bin/bash
# Test MCP Tools
# This script tests various MCP tools to ensure they're working properly

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." &>/dev/null && pwd)"
TOOLS_VIEWER="$PROJECT_ROOT/scripts/show-mcp-tools.js"
MCP_CONFIG="$PROJECT_ROOT/src/vscode-extension/mcp_config.json"

# Display header
echo "╔════════════════════════════════════════════════╗"
echo "║             MCP Tools Test Suite               ║"
echo "╚════════════════════════════════════════════════╝"
echo

# Check if configuration exists
if [[ ! -f "$MCP_CONFIG" ]]; then
  echo "❌ Error: Cannot find MCP configuration at: $MCP_CONFIG"
  exit 1
fi

# Make tools viewer executable
chmod +x "$TOOLS_VIEWER" 2>/dev/null

# Function to display available tools
show_tools() {
  echo "📋 Displaying MCP Tools Configuration"
  echo "----------------------------------------"
  node "$TOOLS_VIEWER"
  echo "----------------------------------------"
}

# Function to test a simple filesystem tool
test_filesystem() {
  echo "🧪 Testing Filesystem Tool"
  echo "----------------------------------------"
  # Implementation depends on your specific MCP tool interface
  echo "This is a placeholder for the filesystem tool test"
  # For example, list files in current directory using MCP
  echo "----------------------------------------"
}

# Function to test shell tool
test_shell() {
  echo "🧪 Testing Shell Tool"
  echo "----------------------------------------"
  # Implementation depends on your specific MCP tool interface
  echo "This is a placeholder for the shell tool test"
  echo "Would execute: ls -la"
  echo "----------------------------------------"
}

# Menu
while true; do
  echo
  echo "MCP Tools Testing Menu:"
  echo "------------------------"
  echo "1. Show Available MCP Tools"
  echo "2. Test Filesystem Tool"
  echo "3. Test Shell Tool"
  echo "4. Exit"
  echo
  read -p "Select an option (1-4): " choice
  
  case $choice in
    1)
      show_tools
      ;;
    2)
      test_filesystem
      ;;
    3)
      test_shell
      ;;
    4)
      echo "Exiting MCP Tools Test Suite"
      exit 0
      ;;
    *)
      echo "❌ Invalid option. Please select 1-4."
      ;;
  esac
done
