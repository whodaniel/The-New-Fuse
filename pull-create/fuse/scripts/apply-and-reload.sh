#!/bin/bash

# Simple script to launch the VS Code extension for The New Fuse

echo "======================================================"
echo "  The New Fuse - Quick Launch Script"
echo "======================================================"

# Create necessary directories for the VS Code extension
mkdir -p src/vscode-extension/out
mkdir -p src/vscode-extension/ai-communication

# Create a minimal working extension.js file
cat > src/vscode-extension/out/extension.js << 'EOF'
const vscode = require('vscode');

function activate(context) {
  console.log('The New Fuse extension is active!');
  
  // Register the hello world command
  const helloCommand = vscode.commands.registerCommand('thefuse.helloWorld', () => {
    vscode.window.showInformationMessage('Hello from The New Fuse!');
  });
  
  // Register the AI collaboration command
  const aiCollabCommand = vscode.commands.registerCommand('thefuse.startAICollab', () => {
    vscode.window.showInformationMessage('AI Collaboration initiated!');
    
    // Show the available options
    vscode.window.showQuickPick([
      'Code Optimization',
      'Bug Finding',
      'Documentation Generation',
      'Code Review'
    ], {
      placeHolder: 'Select an AI collaboration task'
    }).then(selection => {
      if (selection) {
        vscode.window.showInformationMessage(`Starting ${selection} task...`);
      }
    });
  });
  
  // Add a status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = "$(rocket) The New Fuse";
  statusBarItem.tooltip = "The New Fuse AI Tools";
  statusBarItem.command = 'thefuse.helloWorld';
  statusBarItem.show();
  
  // Register all disposables
  context.subscriptions.push(helloCommand, aiCollabCommand, statusBarItem);
}

function deactivate() {
  console.log('The New Fuse extension deactivated');
}

module.exports = { activate, deactivate };
EOF

# Create a minimal package.json if it doesn't exist
cat > src/vscode-extension/package.json << 'EOF'
{
  "name": "the-new-fuse-vscode",
  "displayName": "The New Fuse",
  "description": "AI agent coordination for VS Code",
  "version": "0.1.0",
  "publisher": "thefuse",
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
      },
      {
        "command": "thefuse.startAICollab",
        "title": "Start AI Collaboration"
      }
    ]
  }
}
EOF

# Launch VS Code with the extension
echo "Launching VS Code with The New Fuse extension..."
code --extensionDevelopmentPath="$(pwd)/src/vscode-extension"

echo ""
echo "If VS Code didn't open automatically, run this command:"
echo "code --extensionDevelopmentPath=\"$(pwd)/src/vscode-extension\""
EOF
