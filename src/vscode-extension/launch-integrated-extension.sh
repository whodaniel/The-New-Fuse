#!/bin/bash

# Launch script for the integrated VS Code extension
# This script ensures proper environment setup before launching VS Code

EXTENSION_DIR=$(pwd)
WORKSPACE_DIR="${EXTENSION_DIR}/test-workspace"

# Ensure we're in the extension directory
if [[ ! -f "${EXTENSION_DIR}/package.json" ]]; then
  echo "Error: Not in extension directory. Please run this script from the extension directory."
  exit 1
fi

# Create a test workspace if it doesn't exist
mkdir -p "${WORKSPACE_DIR}"

# Create a test file if the workspace is empty
if [ ! "$(ls -A ${WORKSPACE_DIR})" ]; then
  echo "Creating test files in workspace..."
  cat > "${WORKSPACE_DIR}/test-file.js" << EOF
// This is a test file for The New Fuse Extension integrated features

function testFunction() {
  console.log('Testing The New Fuse Extension');
  console.log('With AI Coder and Roo Integration');
  return true;
}

testFunction();
EOF
fi

# Build the extension first
echo "Building extension..."
./build.sh

if [ $? -ne 0 ]; then
  echo "Build failed. Check the errors above."
  exit 1
fi

echo "Launching VS Code with extension..."
code --extensionDevelopmentPath="${EXTENSION_DIR}" "${WORKSPACE_DIR}"

# Print test instructions
echo "--------------------------------------------------------------------------------------"
echo "VS Code is launching with the integrated extension. Test the following functionality:"
echo ""
echo "1. Look for the AI Coder view in the sidebar (icon in the activity bar)"
echo "2. Open the Command Palette (Cmd+Shift+P) and run 'Start Roo AI Code Monitoring'"
echo "3. Check the status bar for the AI Coder status indicator"
echo "4. Run 'Show AI Coder Status' from the Command Palette"
echo "--------------------------------------------------------------------------------------"