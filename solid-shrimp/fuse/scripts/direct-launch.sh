#!/bin/bash

# Create minimum required directory structure
mkdir -p out

# Create a simple extension.js file
cat > out/extension.js << 'EOF'
const vscode = require('vscode');

function activate(context) {
  console.log('The New Fuse extension is active!');
  
  // Register a simple command
  const helloCommand = vscode.commands.registerCommand('thefuse.helloWorld', () => {
    vscode.window.showInformationMessage('Hello from The New Fuse!');
  });
  
  // Add a status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = "$(rocket) The New Fuse";
  statusBarItem.tooltip = "The New Fuse AI Tools";
  statusBarItem.command = 'thefuse.helloWorld';
  statusBarItem.show();
  
  context.subscriptions.push(helloCommand, statusBarItem);
  
  // Show welcome message
  vscode.window.showInformationMessage(
    'The New Fuse extension is now active!',
    'Learn More'
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
EOF

# Create a minimal package.json
cat > package.json << 'EOF'
{
  "name": "the-new-fuse-vscode",
  "displayName": "The New Fuse",
  "description": "AI agent coordination for VS Code",
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
        "title": "Hello World"
      }
    ]
  }
}
EOF

# Find VS Code on macOS
if [ -x "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ]; then
  VSCODE_PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
else
  VSCODE_PATH="code" # Fallback to PATH
fi

echo "Launching VS Code with minimal extension..."
"$VSCODE_PATH" --new-window --extensionDevelopmentPath="$(pwd)"
