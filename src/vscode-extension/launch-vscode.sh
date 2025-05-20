#!/bin/bash

echo "Launching VS Code with The New Fuse extension..."

# Find VS Code on different platforms
if [ -x "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]; then
  VSCODE_PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
elif command -v code &> /dev/null; then
  VSCODE_PATH="code"
elif command -v code-insiders &> /dev/null; then
  VSCODE_PATH="code-insiders"
else
  echo "Error: Cannot find VS Code. Please make sure VS Code is installed."
  exit 1
fi

# Launch VS Code with the extension
"$VSCODE_PATH" --new-window --extensionDevelopmentPath="$(pwd)"

echo "VS Code launched with The New Fuse extension."
echo "Use Command Palette (Cmd+Shift+P or Ctrl+Shift+P) and type 'thefuse' to see available commands."
