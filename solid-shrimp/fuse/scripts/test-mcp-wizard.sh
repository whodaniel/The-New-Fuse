#!/bin/bash

# Test script for MCP Wizard
echo "Starting AppleScript test..."

# Run the applescript and capture output
RESULT=$(osascript -e 'display dialog "Test Dialog" buttons {"OK"} default button "OK"' 2>&1)
EXIT_CODE=$?

echo "AppleScript exit code: $EXIT_CODE"
echo "AppleScript result: $RESULT"

# Test if we can access the Claude config directory
if [ -d ~/Library/Application\ Support/Claude ]; then
  echo "Claude configuration directory exists."
  
  if [ -f ~/Library/Application\ Support/Claude/claude_desktop_config.json ]; then
    echo "Claude desktop config file exists."
  else
    echo "Claude desktop config file not found."
  fi
else
  echo "Claude configuration directory not found."
fi

# Try running our MCP wizard script
echo "Attempting to run MCP wizard..."
osascript ../scripts/mcp-wizard.applescript > mcp_wizard_output.log 2>&1 &
sleep 2
echo "Check if any dialog boxes appeared on your screen."
echo "Log output being written to mcp_wizard_output.log"
