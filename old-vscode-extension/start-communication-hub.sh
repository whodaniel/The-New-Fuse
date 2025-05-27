#!/bin/bash

# Create necessary directories
mkdir -p out
mkdir -p web-ui
mkdir -p ai-communication

echo "Copying core modules to make them available..."
cp web-ui/communication-panel.ts web-ui/ 2>/dev/null || echo "WARNING: No communication panel found - creating skeleton"
cp mcp-protocol.ts . 2>/dev/null || echo "WARNING: No MCP protocol found - creating skeleton"

# Creating necessary stub files if they don't exist
if [ ! -f "web-ui/communication-panel.ts" ]; then
  echo "Creating basic communication panel module"
  cat > web-ui/communication-panel.ts << EOF
import * as vscode from 'vscode';

export class CommunicationPanel {
  public static createOrShow(extensionUri: vscode.Uri) {
    const panel = vscode.window.createWebviewPanel(
      'aiCommunicationHub',
      'AI Communication Hub',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
    panel.webview.html = '<h1>AI Communication Hub</h1><p>This is a placeholder for the AI Communication Hub</p>';
  }
}
EOF
fi

# Ensure the out directory exists and contains a compiled version
echo "Compiling TypeScript files..."
npm run compile

echo "Starting the AI Communication Hub..."
code --extensionDevelopmentPath="$(pwd)" --args --debugPluginHost
