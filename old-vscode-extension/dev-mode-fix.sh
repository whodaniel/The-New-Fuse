#!/bin/bash

echo "===================================================="
echo "  Setting up The New Fuse in pure development mode"
echo "===================================================="
echo ""

# Create essential directories
mkdir -p out
mkdir -p ai-communication

# Create a minimal working extension.js file
cat > out/extension.js << 'EOF'
const vscode = require('vscode');

function activate(context) {
  console.log('The New Fuse extension is active!');
  
  // Register essential commands
  const helloCommand = vscode.commands.registerCommand('thefuse.helloWorld', () => {
    vscode.window.showInformationMessage('Hello from The New Fuse!');
  });
  
  const aiCollabCommand = vscode.commands.registerCommand('thefuse.startAICollab', () => {
    vscode.window.showInformationMessage('AI Collaboration initiated!');
    
    // Show options
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
  
  // Create a command to open the master command center
  const openMasterCommand = vscode.commands.registerCommand('thefuse.openMasterCommandCenter', () => {
    const panel = vscode.window.createWebviewPanel(
      'masterCommandCenter',
      'Master Command Center',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
    
    // Use a simple HTML interface
    panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: system-ui; padding: 20px; }
          h1 { color: var(--vscode-editor-foreground); }
          .card { 
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border); 
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
          }
          button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 12px;
            border-radius: 3px;
            cursor: pointer;
            margin: 5px;
          }
        </style>
      </head>
      <body>
        <h1>The New Fuse - Command Center</h1>
        
        <div class="card">
          <h2>Core Features</h2>
          <button onclick="sendCommand('thefuse.startAICollab')">Start AI Collaboration</button>
          <button onclick="sendCommand('thefuse.helloWorld')">Hello World</button>
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          function sendCommand(cmd) {
            vscode.postMessage({ command: cmd });
          }
        </script>
      </body>
      </html>
    `;
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      message => {
        vscode.commands.executeCommand(message.command);
      }
    );
  });
  
  // Register another status bar item for the command center
  const centerStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
  centerStatusBarItem.text = "$(list-tree) Command Center";
  centerStatusBarItem.tooltip = "Open The New Fuse Command Center";
  centerStatusBarItem.command = 'thefuse.openMasterCommandCenter';
  centerStatusBarItem.show();

  // Register all disposables
  context.subscriptions.push(helloCommand, aiCollabCommand, openMasterCommand, statusBarItem, centerStatusBarItem);
  
  // Show welcome message
  vscode.window.showInformationMessage('The New Fuse is active!', 'Open Command Center').then(selection => {
    if (selection === 'Open Command Center') {
      vscode.commands.executeCommand('thefuse.openMasterCommandCenter');
    }
  });
}

function deactivate() {}

module.exports = { activate, deactivate };
EOF

# Create minimal package.json with minimum needed fields - NO PUBLISHER field
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
      },
      {
        "command": "thefuse.openMasterCommandCenter",
        "title": "Open Master Command Center"
      }
    ]
  }
}
EOF

echo "Launching VS Code with the extension in development mode..."
code --extensionDevelopmentPath="$(pwd)"

echo ""
echo "IMPORTANT: This setup bypasses the formal extension installation"
echo "and runs the extension in development mode only. This is WHY"
echo "you can't 'manage' it like a normally installed extension."
echo ""
echo "To access the extension's features:"
echo "1. Look for the rocket icon ($(rocket)) in the status bar"
echo "2. Or click the Command Center icon next to it"
echo "3. Or use Command Palette and type 'The New Fuse'"
echo ""
