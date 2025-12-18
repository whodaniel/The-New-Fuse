#!/bin/bash

echo "Reloading The New Fuse extension with correct metadata..."

# Navigate to the extension directory
cd ./src/vscode-extension || (echo "Extension directory not found" && exit 1)

# Ensure the extension directory is properly set up
mkdir -p out
mkdir -p ai-communication

# Make sure package.json has the correct publisher and name
cat > package.json << 'EOF'
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

# Create minimal extension.js if it doesn't exist
mkdir -p out
if [ ! -f "out/extension.js" ]; then
  echo "Creating minimal extension.js..."
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
    
    // Show options for collaboration
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

function deactivate() {}

module.exports = { activate, deactivate };
EOF
fi

# Launch VS Code with the extension
echo "Launching VS Code with the extension..."
code --extensionDevelopmentPath="$(pwd)"

echo "Extension should now be loaded in VS Code"
echo "If VS Code is already open, look for the rocket icon ($(rocket)) in the status bar"
