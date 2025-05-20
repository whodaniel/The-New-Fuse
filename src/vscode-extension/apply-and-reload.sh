#!/bin/bash

# Check if VS Code is running
if pgrep -f "VS Code" > /dev/null; then
  echo "VS Code is running, will reload the window after applying changes."
  RELOAD_WINDOW=true
else
  echo "VS Code is not running, will need to launch it."
  RELOAD_WINDOW=false
fi

# Create any necessary directories
mkdir -p out
mkdir -p ai-communication

# Ensure files are correctly placed
cp package.json package.json.tmp && mv package.json.tmp package.json
cp out/extension.js out/extension.js.tmp && mv out/extension.js.tmp out/extension.js

if [ "$RELOAD_WINDOW" = true ]; then
  echo "Running VS Code 'Reload Window' command..."
  osascript -e 'tell application "Visual Studio Code" to activate' \
    -e 'tell application "System Events" to keystroke "p" using {command down, shift down}' \
    -e 'delay 0.5' \
    -e 'tell application "System Events" to keystroke "reload window"' \
    -e 'delay 0.2' \
    -e 'tell application "System Events" to keystroke return'
else
  echo "Launching VS Code with extension..."
  code --extensionDevelopmentPath="$(pwd)"
fi

echo "Done! The extension should now be properly loaded."
