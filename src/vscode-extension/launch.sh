#!/bin/bash

# Launch script for The New Fuse VS Code Extension
echo "========================================="
echo "  Launching The New Fuse VS Extension    "
echo "========================================="

# Check if build script exists and is executable
if [ ! -x "./build.sh" ]; then
  chmod +x ./build.sh
fi

# First build the extension
./build.sh

# If build failed, exit
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Fix the errors before launching."
  exit 1
fi

# Find VS Code path based on platform
VSCODE_PATH=""
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  if [ -x "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]; then
    VSCODE_PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
  fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  if command -v code &> /dev/null; then
    VSCODE_PATH="code"
  fi
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
  # Windows with Git Bash or similar
  if command -v code.cmd &> /dev/null; then
    VSCODE_PATH="code.cmd"
  fi
fi

# Fallback to the PATH if not found
if [ -z "$VSCODE_PATH" ]; then
  if command -v code &> /dev/null; then
    VSCODE_PATH="code"
  else
    echo "❌ Error: VS Code not found. Please make sure VS Code is installed."
    exit 1
  fi
fi

# Detect if extension is already running and needs a reload
IS_RUNNING=false
ps aux | grep -i "visual studio code" | grep -v grep > /dev/null && IS_RUNNING=true

if [ "$IS_RUNNING" = true ]; then
  echo "📋 VS Code is already running. Would you like to:"
  echo "  1) Launch in a new window"
  echo "  2) Reload existing VS Code window"
  read -p "Choose option (1/2): " choice
  
  case $choice in
    1)
      echo "🚀 Launching VS Code with the extension in a new window..."
      "$VSCODE_PATH" --new-window --extensionDevelopmentPath="$(pwd)"
      ;;
    2)
      echo "🔄 Requesting reload in existing VS Code window..."
      if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS approach
        osascript -e 'tell application "Visual Studio Code" to activate' \
          -e 'tell application "System Events" to keystroke "p" using {command down, shift down}' \
          -e 'delay 0.5' \
          -e 'tell application "System Events" to keystroke "reload window"' \
          -e 'delay 0.2' \
          -e 'tell application "System Events" to keystroke return'
      else
        echo "⚠️ Automated reload not supported on this platform."
        echo "Please manually run 'Developer: Reload Window' in VS Code command palette."
      fi
      ;;
    *)
      echo "❌ Invalid choice. Launching in a new window..."
      "$VSCODE_PATH" --new-window --extensionDevelopmentPath="$(pwd)"
      ;;
  esac
else
  # Launch VS Code with the extension
  echo "🚀 Launching VS Code with the extension..."
  "$VSCODE_PATH" --new-window --extensionDevelopmentPath="$(pwd)"
fi

echo "✅ VS Code launched with The New Fuse extension!"
echo ""
echo "ℹ️ If you encounter any issues, run the following commands:"
echo "  1. npm run compile       # to manually compile the TypeScript"
echo "  2. npm run package       # to create a VSIX package"
