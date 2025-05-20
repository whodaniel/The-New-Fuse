#!/bin/bash

echo "=== The New Fuse - One-Click Startup ==="

# Create essential directories
mkdir -p out
mkdir -p ai-communication

# Create the minimal extension.js
cat > out/extension.js << 'EOF'
const vscode = require('vscode');

function activate(context) {
  console.log('The New Fuse extension is active!');
  
  // Register basic commands
  const helloCommand = vscode.commands.registerCommand('thefuse.helloWorld', () => {
    vscode.window.showInformationMessage('Hello from The New Fuse!');
  });
  
  // Add status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = "$(rocket) The New Fuse";
  statusBarItem.tooltip = "The New Fuse AI Tools";
  statusBarItem.command = 'thefuse.helloWorld';
  statusBarItem.show();
  
  context.subscriptions.push(helloCommand, statusBarItem);
  
  // Notify user
  vscode.window.showInformationMessage('The New Fuse extension is now active!', 'Try Hello World').then(
    selection => {
      if (selection === 'Try Hello World') {
        vscode.commands.executeCommand('thefuse.helloWorld');
      }
    }
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
EOF

# Create minimal package.json
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
        "title": "Hello from The New Fuse"
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

echo "Launching VS Code with The New Fuse extension..."
"$VSCODE_PATH" --new-window --extensionDevelopmentPath="$(pwd)"

echo ""
echo "The New Fuse is now running in VS Code."
echo "Look for the rocket icon in the status bar and try using the Command Palette (Cmd+Shift+P or Ctrl+Shift+P)"
