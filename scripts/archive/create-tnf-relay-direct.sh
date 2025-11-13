#!/bin/bash
# Script to directly create the TNF Agent Communication Relay application without user interaction

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if the AppleScript file exists
if [ ! -f "$SCRIPT_DIR/TNF-Agent-Relay.applescript" ]; then
  echo "Error: TNF-Agent-Relay.applescript not found in the current directory."
  exit 1
fi

# Create a temporary directory for the app
TEMP_DIR=$(mktemp -d)
APP_NAME="TNF Agent Relay.app"
DESKTOP_PATH="$HOME/Desktop"
APP_PATH="$DESKTOP_PATH/$APP_NAME"

echo "Creating TNF Agent Relay application..."

# Compile the AppleScript into an application
osacompile -o "$APP_PATH" "$SCRIPT_DIR/TNF-Agent-Relay.applescript"

# Check if the application was created successfully
if [ -d "$APP_PATH" ]; then
  echo "Success! TNF Agent Relay application has been created at:"
  echo "$APP_PATH"
  echo ""
  echo "Would you like to open it now? (y/n)"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    open "$APP_PATH"
  fi
else
  echo "Error: Failed to create the application."
  exit 1
fi

# Create required directories
mkdir -p /tmp/thefuse/vscode
mkdir -p /tmp/thefuse/chrome
mkdir -p /tmp/thefuse/terminal

echo "Required directories have been created."
echo ""
echo "Installation complete!"
