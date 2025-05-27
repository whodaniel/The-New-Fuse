#!/bin/bash

echo "======================================================"
echo "  The New Fuse - Full Extension Setup"
echo "======================================================"
echo ""

# Create necessary directory structure
mkdir -p out
mkdir -p test
mkdir -p web-ui
mkdir -p .vscode
mkdir -p ai-communication  # For file-based inter-extension communication

# Configure package.json and typescript configuration
echo "Setting up configurations..."

# Create the example code file for testing if it doesn't exist
if [ ! -f "test/example-code.ts" ]; then
  mkdir -p test
  cp test/example-code.ts test/example-code.ts 2>/dev/null || echo "Creating example code file..."
fi

# Install dependencies
echo "Installing dependencies..."
npm install uuid
npm install --save-dev @types/vscode @types/node @types/uuid typescript

# Compile TypeScript files
echo "Compiling TypeScript files..."
npm run compile

# Check if compilation succeeded
if [ $? -ne 0 ]; then
  echo "⚠️ Compilation failed. Please check for errors in your TypeScript files."
else
  echo "✅ Compilation successful!"
fi

echo ""
echo "============================================================"
echo "  Setup complete! 🎉"
echo "============================================================"
echo ""
echo "To activate the extension in your current VS Code window:"
echo "1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)"
echo "2. Run \"Developer: Reload Window\""
echo ""
echo "After reloading, the extension will be active in your current window."
echo "Check the status bar for the New Fuse icons."
echo ""
