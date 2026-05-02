#!/bin/bash
# Script to create the TNF Agent Communication Relay application

# Check if Script Editor is available
if [ ! -d "/Applications/Utilities/Script Editor.app" ]; then
  echo "Error: Script Editor not found. Please ensure you're running this on macOS."
  exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if the AppleScript file exists
if [ ! -f "$SCRIPT_DIR/TNF-Agent-Relay-Creator.applescript" ]; then
  echo "Error: TNF-Agent-Relay-Creator.applescript not found in the current directory."
  exit 1
fi

echo "Opening TNF Agent Relay Creator in Script Editor..."

# Open the AppleScript file in Script Editor
open -a "/Applications/Utilities/Script Editor.app" "$SCRIPT_DIR/TNF-Agent-Relay-Creator.applescript"

echo "Script Editor has been launched with the creator script."
echo "Please click the Run button (play icon) in the toolbar to create the application."
echo "Follow the prompts to complete the installation."
