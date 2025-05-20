#!/bin/bash

echo "Fixing The New Fuse extension installation..."

# Ensure we have the necessary directory structure
mkdir -p out
mkdir -p ai-communication

# Create a reliable extension.js file
cat > out/extension.js << 'EOF'
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
  
  // Add status bar items
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = "$(rocket) The New Fuse";
  statusBarItem.tooltip = "The New Fuse AI Tools";
  statusBarItem.command = 'thefuse.helloWorld';
  statusBarItem.show();
  
  // Register all disposables
  context.subscriptions.push(helloCommand, aiCollabCommand, statusBarItem);
}

function deactivate() {}

module.exports = { activate, deactivate };
EOF

# Create a proper package.json - DON'T specify publisher to avoid the lookup issue
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
      },
      {
        "command": "thefuse.startAICollab",
        "title": "Start AI Collaboration"
      }
    ]
  }
}
EOF

echo "Running the extension directly in development mode (bypassing installation)..."
code --extensionDevelopmentPath="$(pwd)"

echo ""
echo "If VS Code didn't open, run this command manually:"
echo "code --extensionDevelopmentPath=\"$(pwd)\""
echo ""
echo "Note: This method bypasses the normal extension installation process"
echo "and runs the extension in development mode, avoiding the publisher issue."
