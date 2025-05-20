#!/bin/bash

echo "Compiling and running The New Fuse extension..."

# Create the communication directory (important for inter-extension communication)
mkdir -p ai-communication

# Create minimal TypeScript source files if they don't exist
if [ ! -f "extension.ts" ]; then
  # Create a simple extension.ts file
  echo "Creating minimal extension.ts..."
  cat > extension.ts << 'EOF'
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('The New Fuse extension is active!');
  
  // Register commands for AI collaboration
  const aiCollabCommand = vscode.commands.registerCommand('thefuse.startAICollab', () => {
    vscode.window.showInformationMessage('AI Collaboration initiated!');
  });
  
  // Status bar items
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = "$(rocket) The New Fuse";
  statusBarItem.tooltip = "The New Fuse AI Tools";
  statusBarItem.command = 'thefuse.startAICollab';
  statusBarItem.show();
  
  // Register all disposables
  context.subscriptions.push(aiCollabCommand, statusBarItem);
  
  vscode.window.showInformationMessage('The New Fuse is now active! Click the rocket icon to start AI collaboration.');
}

export function deactivate() {}
EOF
fi

# Compile the TypeScript code
echo "Compiling TypeScript..."
npm run compile

# If compilation succeeded, run the extension
if [ $? -eq 0 ]; then
  echo "Launching VS Code with the extension..."
  code --extensionDevelopmentPath="$(pwd)"
else
  echo "Compilation failed. Check for errors above."
fi
