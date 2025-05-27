#!/bin/bash

echo "======================================================"
echo "  The New Fuse - Quick Extension Setup"
echo "======================================================"
echo ""

# Create necessary directory structure
mkdir -p out
mkdir -p test
mkdir -p web-ui
mkdir -p .vscode
mkdir -p ai-communication # For file-based inter-extension communication

# Create a minimal basic extension.js if it doesn't exist
if [ ! -f "out/extension.js" ]; then
  echo "Creating minimal extension..."
  cat > out/extension.js << 'EOF'
const vscode = require('vscode');

function activate(context) {
  console.log('The New Fuse extension is active!');
  
  // Register a simple command to test
  const helloCommand = vscode.commands.registerCommand('thefuse.helloWorld', () => {
    vscode.window.showInformationMessage('Hello from The New Fuse!');
  });
  
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = "$(rocket) The New Fuse";
  statusBarItem.tooltip = "The New Fuse AI Tools";
  statusBarItem.command = 'thefuse.helloWorld';
  statusBarItem.show();
  
  context.subscriptions.push(helloCommand, statusBarItem);
}

function deactivate() {}

module.exports = { activate, deactivate };
EOF
fi

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
  echo "Creating package.json..."
  cat > package.json << 'EOF'
{
  "name": "the-new-fuse-vscode",
  "displayName": "The New Fuse",
  "description": "AI agent coordination and workflow automation for VS Code",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "main": "./out/extension.js",
  "activationEvents": ["onStartupFinished"],
  "contributes": {
    "commands": [
      {
        "command": "thefuse.helloWorld",
        "title": "Hello from The New Fuse"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "lint": "eslint src --ext ts"
  },
  "dependencies": {
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.2.5",
    "@types/uuid": "^9.0.1",
    "@types/vscode": "^1.80.0",
    "typescript": "^5.1.3"
  }
}
EOF
fi

# Launch VS Code with the extension
echo "Ready to run the extension in VS Code!"
echo "Choose an option:"
echo "1) Launch VS Code with the extension"
echo "2) Just install dependencies (no launch)"
read -p "Enter choice (1/2): " choice

case $choice in
  1)
    # Launch VS Code with the extension
    echo "Launching VS Code with the extension..."
    code --extensionDevelopmentPath="$(pwd)"
    ;;
  2)
    echo "Installing dependencies only..."
    npm install
    ;;
  *)
    echo "Invalid choice! Run one of these commands manually:"
    echo "- code --extensionDevelopmentPath=\"$(pwd)\""
    echo "- npm install"
    ;;
esac
