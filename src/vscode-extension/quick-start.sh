#!/bin/bash

# Ensure the setup script has been run
if [ ! -f "./package.json" ]; then
  echo "Running setup script first..."
  ./setup.sh
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Compile TypeScript files
echo "Compiling TypeScript..."
npm run compile

# Launch VS Code with the extension
echo "Launching VS Code with the extension..."
node launch-extension.js

echo "If VS Code doesn't open, try running manually:"
echo "code --extensionDevelopmentPath=$(pwd)"
