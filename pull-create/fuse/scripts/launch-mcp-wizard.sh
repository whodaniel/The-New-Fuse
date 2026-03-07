#!/bin/bash
# Universal MCP Wizard Launcher
# This script serves as a simple launcher for the Universal MCP Configuration Wizard

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
WIZARD_PATH="$SCRIPT_DIR/universal-mcp-wizard-fixed.applescript"

echo "Launching Universal MCP Configuration Wizard..."

# Check if the script exists
if [[ ! -f "$WIZARD_PATH" ]]; then
  echo "❌ Error: Cannot find the wizard script at: $WIZARD_PATH"
  exit 1
fi

# Make it executable just in case
chmod +x "$WIZARD_PATH" 2>/dev/null

# Run the wizard
osascript "$WIZARD_PATH"
