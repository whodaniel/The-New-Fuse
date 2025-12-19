#!/bin/bash
# MCP All-in-One Setup Script
# This script provides a unified interface for all MCP-related configuration tasks

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
WIZARD_PATH="$SCRIPT_DIR/universal-mcp-wizard-fixed.applescript"
SERVER_PATH="$SCRIPT_DIR/mcp-config-manager-server.js"
STATUS_PATH="$SCRIPT_DIR/check-mcp-status.sh"

# Display header
echo "╔════════════════════════════════════════════════╗"
echo "║       Universal MCP Configuration Suite        ║"
echo "╚════════════════════════════════════════════════╝"
echo

# Check if scripts exist
if [[ ! -f "$WIZARD_PATH" ]]; then
  echo "❌ Error: Cannot find wizard script at: $WIZARD_PATH"
  exit 1
fi

# Make scripts executable
chmod +x "$WIZARD_PATH" 2>/dev/null
[[ -f "$SERVER_PATH" ]] && chmod +x "$SERVER_PATH" 2>/dev/null
[[ -f "$STATUS_PATH" ]] && chmod +x "$STATUS_PATH" 2>/dev/null

# Function to check if MCP server is running
check_server() {
  if curl -s http://localhost:3772 -m 1 &>/dev/null; then
    echo "✅ MCP Server is running"
    return 0
  else
    echo "❌ MCP Server is not running"
    return 1
  fi
}

# Function to start MCP server
start_server() {
  if [[ ! -f "$SERVER_PATH" ]]; then
    echo "❌ Error: Cannot find server script at: $SERVER_PATH"
    return 1
  fi
  
  echo "Starting MCP server..."
  node "$SERVER_PATH" &>"/tmp/mcp-server-$(date +%s).log" &
  SERVER_PID=$!
  echo "✅ Started MCP server (PID: $SERVER_PID)"
  
  # Wait for server to be ready
  echo "Waiting for server to start..."
  for i in {1..10}; do
    if curl -s http://localhost:3772 -m 1 &>/dev/null; then
      echo "✅ MCP server is now running"
      return 0
    fi
    echo -n "."
    sleep 1
  done
  echo
  echo "⚠️  Server may not have started correctly"
  return 0
}

# Function to run the wizard
run_wizard() {
  echo "Launching MCP Configuration Wizard..."
  osascript "$WIZARD_PATH"
}

# Function to check MCP status
check_status() {
  if [[ -f "$STATUS_PATH" ]]; then
    bash "$STATUS_PATH"
  else
    echo "Running basic status check..."
    check_server
    
    echo
    echo "Looking for configuration files:"
    for path in "$HOME/Library/Application Support/GitHub Copilot/mcp_config.json" \
                "$HOME/Library/Application Support/Code/User/mcp_config.json" \
                "$HOME/Library/Application Support/Claude/claude_desktop_config.json"; do
      if [[ -f "$path" ]]; then
        echo "✅ Found: $path"
      else
        echo "❌ Missing: $path"
      fi
    done
  fi
}

# Main menu
show_menu() {
  echo
  echo "MCP Configuration Options:"
  echo "------------------------"
  echo "1. Check MCP Status"
  echo "2. Start MCP Server"
  echo "3. Launch Configuration Wizard"
  echo "4. Complete Setup (Start Server + Wizard)"
  echo "5. Exit"
  echo
  read -p "Select an option (1-5): " OPTION
  
  case $OPTION in
    1)
      check_status
      show_menu
      ;;
    2)
      start_server
      show_menu
      ;;
    3)
      run_wizard
      show_menu
      ;;
    4)
      check_server || start_server
      run_wizard
      show_menu
      ;;
    5)
      echo "Exiting MCP Configuration Suite."
      exit 0
      ;;
    *)
      echo "Invalid option. Please select 1-5."
      show_menu
      ;;
  esac
}

# Start with the menu
show_menu
