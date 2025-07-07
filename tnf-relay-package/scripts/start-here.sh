#!/bin/bash

# Create necessary directory structure if it doesn't exist
mkdir -p src/vscode-extension/out
mkdir -p src/vscode-extension/test
mkdir -p src/vscode-extension/web-ui
mkdir -p src/vscode-extension/ai-communication
mkdir -p src/vscode-extension/.vscode

# Copy relevant files if they exist, otherwise create minimal versions
echo "Setting up the extension environment..."

# Create the communication directory needed for inter-extension messaging
echo "Creating inter-extension communication directory..."
mkdir -p src/vscode-extension/ai-communication

# Install dependencies and build
echo "Would you like to build and run the extension now? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
  cd src/vscode-extension
  npm install
  npm run compile
  code --extensionDevelopmentPath="$(pwd)"
  echo "Extension should now be running in VS Code!"
else
  echo "To build and run the extension later, run these commands:"
  echo "cd src/vscode-extension"
  echo "npm install"
  echo "npm run compile"
  echo "code --extensionDevelopmentPath=\"\$(pwd)\""
fi
