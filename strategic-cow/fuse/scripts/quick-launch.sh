#!/bin/bash

# Create the necessary directory structure
mkdir -p src/vscode-extension/out

# Create a minimal extension.js file
echo 'const vscode = require("vscode");

function activate(context) {
  console.log("The New Fuse extension is active!");
  
  // Register a hello world command
  const helloCommand = vscode.commands.registerCommand("thefuse.helloWorld", () => {
    vscode.window.showInformationMessage("Hello from The New Fuse!");
  });
  
  // Register the AI collaboration command
  const aiCollabCommand = vscode.commands.registerCommand("thefuse.startAICollab", () => {
    vscode.window.showInformationMessage("AI Collaboration initiated!");
  });
  
  // Add a status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = "$(rocket) The New Fuse";
  statusBarItem.tooltip = "The New Fuse AI Tools";
  statusBarItem.command = "thefuse.helloWorld";
  statusBarItem.show();
  
  // Register all disposables
  context.subscriptions.push(helloCommand, aiCollabCommand, statusBarItem);
}

function deactivate() {}

module.exports = { activate, deactivate };' > src/vscode-extension/out/extension.js

# Create a minimal package.json
echo '{
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
      },
      {
        "command": "thefuse.startAICollab",
        "title": "Start AI Collaboration"
      }
    ]
  }
}' > src/vscode-extension/package.json

# Launch VS Code with the extension
echo "Launching VS Code with the extension..."
code --extensionDevelopmentPath="$(pwd)/src/vscode-extension"

# If the above command fails, try the absolute path
if [ $? -ne 0 ]; then
  echo "Trying absolute path to VS Code..."
  /Applications/Visual\ Studio\ Code.app/Contents/Resources/app/bin/code --extensionDevelopmentPath="$(pwd)/src/vscode-extension"
fi
