#!/bin/bash

echo "===================================================="
echo "  The New Fuse - Minimal Launch Script"
echo "===================================================="
echo ""

# Create necessary directories
mkdir -p out
mkdir -p ai-communication

# Compile TypeScript to JavaScript if needed
if [ -f "extension.ts" ]; then
  echo "TypeScript source found, compiling..."
  if command -v tsc &> /dev/null; then
    tsc -p . || echo "TypeScript compilation failed, using existing out/extension.js"
  else
    echo "TypeScript compiler not found, using existing out/extension.js"
  fi
else
  echo "No TypeScript source found, using existing out/extension.js"
fi

# Launch VS Code with the extension
echo "Launching VS Code with the extension..."
code --extensionDevelopmentPath="$(pwd)"

echo ""
echo "The New Fuse should now be running in VS Code."
echo "Look for the rocket icon ($(rocket)) in the status bar."
echo ""
