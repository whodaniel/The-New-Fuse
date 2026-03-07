# TNF VS Code Agent Integration Guide

This guide provides detailed instructions for integrating VS Code-based AI agents with the TNF Agent Communication Relay.

## Overview

VS Code-based agents can communicate with other agents in The New Fuse ecosystem by:
1. Monitoring the `/tmp/thefuse/vscode/` directory for incoming messages
2. Writing messages to the appropriate environment directories for outgoing messages

## Setup

### Prerequisites

- macOS 10.14 or newer
- VS Code with extension development environment
- TNF Agent Communication Relay installed and running

### Directory Structure

The relay uses these directories for message exchange:
```
/tmp/thefuse/
├── vscode/     # Messages for VS Code agents
├── chrome/     # Messages for Chrome extension agents
└── terminal/   # Messages for terminal-based agents
```

## VS Code Extension Integration

### 1. File Watcher Implementation

Add the following code to your VS Code extension:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// Directory to watch for messages
const VSCODE_MESSAGE_DIR = '/tmp/thefuse/vscode';

// Message interface
interface TNFMessage {
  type: string;
  source: string;
  target: string;
  content: {
    action: string;
    task_type?: string;
    context?: any;
    priority?: string;
    [key: string]: any;
  };
  timestamp: string;
}

// Ensure the directory exists
export function setupMessageDirectory() {
  if (!fs.existsSync(VSCODE_MESSAGE_DIR)) {
    fs.mkdirSync(VSCODE_MESSAGE_DIR, { recursive: true });
  }
}

// Set up file watcher
export function setupMessageWatcher(context: vscode.ExtensionContext) {
  // Ensure directory exists
  setupMessageDirectory();
  
  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(sync) TNF Relay";
  statusBarItem.tooltip = "TNF Agent Communication Relay is active";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
  
  // Set up file system watcher
  const watcher = fs.watch(VSCODE_MESSAGE_DIR, (eventType, filename) => {
    if (eventType === 'rename' && filename.startsWith('message_') && filename.endsWith('.json')) {
      const filePath = path.join(VSCODE_MESSAGE_DIR, filename);
      
      // Read the message file
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Error reading message file: ${err}`);
          return;
        }
        
        try {
          // Parse the message
          const message: TNFMessage = JSON.parse(data);
          
          // Process the message
          processMessage(message);
          
          // Show notification
          vscode.window.showInformationMessage(
            `Received ${message.content.action} request from ${message.source}`
          );
          
          // Optionally remove the file after processing
          fs.unlink(filePath, (err) => {
            if (err) console.error(`Error removing message file: ${err}`);
          });
        } catch (error) {
          console.error(`Error processing message: ${error}`);
        }
      });
    }
  });
  
  // Clean up watcher when extension is deactivated
  context.subscriptions.push({
    dispose: () => {
      watcher.close();
      statusBarItem.dispose();
    }
  });
}

// Process incoming messages
function processMessage(message: TNFMessage) {
  // Handle different message types
  if (message.type === 'COLLABORATION_REQUEST') {
    const content = message.content;
    
    // Handle different action types
    switch (content.action) {
      case 'code_review':
        performCodeReview(content.context);
        break;
      case 'refactoring':
        performRefactoring(content.context);
        break;
      // Add more action handlers as needed
      default:
        console.log(`Unknown action type: ${content.action}`);
    }
  }
}

// Example implementation of code review
function performCodeReview(context: any) {
  if (context && context.file) {
    // Open the file
    vscode.workspace.openTextDocument(context.file)
      .then(document => {
        vscode.window.showTextDocument(document);
        
        // Show focus areas if provided
        if (context.focus_areas && Array.isArray(context.focus_areas)) {
          vscode.window.showInformationMessage(
            `Performing code review with focus on: ${context.focus_areas.join(', ')}`
          );
        }
      })
      .catch(err => {
        console.error(`Error opening file for review: ${err}`);
      });
  }
}

// Example implementation of refactoring
function performRefactoring(context: any) {
  if (context && context.file) {
    // Open the file
    vscode.workspace.openTextDocument(context.file)
      .then(document => {
        vscode.window.showTextDocument(document);
        
        // Show objective if provided
        if (context.objective) {
          vscode.window.showInformationMessage(
            `Performing refactoring with objective: ${context.objective}`
          );
        }
      })
      .catch(err => {
        console.error(`Error opening file for refactoring: ${err}`);
      });
  }
}
```

### 2. Sending Messages from VS Code

Add a function to send messages to other agents:

```typescript
// Function to send messages to other agents
export function sendMessageToRelay(
  targetId: string,
  actionType: string,
  messageContent: any
): string {
  // Determine target environment
  let targetEnv = 'vscode';
  if (targetId.startsWith('chrome_')) targetEnv = 'chrome';
  else if (targetId.startsWith('terminal_')) targetEnv = 'terminal';
  
  // Create message
  const message: TNFMessage = {
    type: 'COLLABORATION_REQUEST',
    source: 'vscode_agent_1',
    target: targetId,
    content: {
      action: actionType,
      ...messageContent
    },
    timestamp: new Date().toISOString()
  };
  
  // Ensure target directory exists
  const targetDir = path.join('/tmp/thefuse', targetEnv);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Write message to file
  const messageFilename = `message_${Date.now()}.json`;
  const filePath = path.join(targetDir, messageFilename);
  
  fs.writeFileSync(filePath, JSON.stringify(message, null, 2));
  return `Message sent to ${targetId} via ${targetEnv}`;
}
```

### 3. VS Code Commands

Register commands to interact with the relay:

```typescript
// Register commands
export function registerCommands(context: vscode.ExtensionContext) {
  // Command to send a message
  context.subscriptions.push(
    vscode.commands.registerCommand('tnf.sendMessage', async () => {
      // Get target agent
      const targetId = await vscode.window.showQuickPick(
        ['chrome_agent_1', 'terminal_agent_1'], 
        { placeHolder: 'Select target agent' }
      );
      if (!targetId) return;
      
      // Get message type
      const actionType = await vscode.window.showQuickPick(
        ['code_review', 'refactoring', 'documentation', 'custom'], 
        { placeHolder: 'Select message type' }
      );
      if (!actionType) return;
      
      // Get message content
      let defaultContent = '';
      switch (actionType) {
        case 'code_review':
          defaultContent = JSON.stringify({
            task_type: 'code_review',
            context: {
              file: vscode.window.activeTextEditor?.document.uri.fsPath || '',
              focus_areas: ['performance', 'security']
            },
            priority: 'medium'
          }, null, 2);
          break;
        case 'refactoring':
          defaultContent = JSON.stringify({
            task_type: 'refactor',
            context: {
              file: vscode.window.activeTextEditor?.document.uri.fsPath || '',
              objective: 'Improve performance and readability'
            },
            priority: 'high'
          }, null, 2);
          break;
        default:
          defaultContent = JSON.stringify({
            task_type: actionType,
            priority: 'medium'
          }, null, 2);
      }
      
      const messageContent = await vscode.window.showInputBox({
        prompt: 'Enter message content (JSON format)',
        value: defaultContent
      });
      if (!messageContent) return;
      
      try {
        const content = JSON.parse(messageContent);
        const result = sendMessageToRelay(targetId, actionType, content);
        vscode.window.showInformationMessage(result);
      } catch (error) {
        vscode.window.showErrorMessage(`Error sending message: ${error instanceof Error ? error.message : String(error)}`);
      }
    })
  );
  
  // Command to view message log
  context.subscriptions.push(
    vscode.commands.registerCommand('tnf.viewMessageLog', () => {
      // Create and show a new webview
      const panel = vscode.window.createWebviewPanel(
        'tnfMessageLog',
        'TNF Message Log',
        vscode.ViewColumn.One,
        {}
      );
      
      // Get message files
      const messageFiles = [
        ...getMessageFiles('/tmp/thefuse/vscode'),
        ...getMessageFiles('/tmp/thefuse/chrome'),
        ...getMessageFiles('/tmp/thefuse/terminal')
      ];
      
      // Generate HTML content
      panel.webview.html = generateMessageLogHtml(messageFiles);
    })
  );
}

// Helper function to get message files
function getMessageFiles(directory: string): {path: string, content: any}[] {
  if (!fs.existsSync(directory)) return [];
  
  return fs.readdirSync(directory)
    .filter(file => file.startsWith('message_') && file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(directory, file);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return { path: filePath, content };
      } catch (error) {
        return { path: filePath, content: { error: 'Failed to parse' } };
      }
    });
}

// Generate HTML for message log
function generateMessageLogHtml(messageFiles: {path: string, content: any}[]): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TNF Message Log</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .message { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
        .message-header { font-weight: bold; margin-bottom: 5px; }
        .message-content { white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <h1>TNF Message Log</h1>
      ${messageFiles.length === 0 ? '<p>No messages found</p>' : ''}
      ${messageFiles.map(file => `
        <div class="message">
          <div class="message-header">File: ${path.basename(file.path)}</div>
          <div class="message-content">${JSON.stringify(file.content, null, 2)}</div>
        </div>
      `).join('')}
    </body>
    </html>
  `;
}
```

### 4. Extension Activation

Update your extension's activation function:

```typescript
// Extension activation
export function activate(context: vscode.ExtensionContext) {
  console.log('TNF Agent Communication Relay extension is now active');
  
  // Setup message watcher
  setupMessageWatcher(context);
  
  // Register commands
  registerCommands(context);
  
  // Show activation message
  vscode.window.showInformationMessage('TNF Agent Communication Relay is now active');
}

// Extension deactivation
export function deactivate() {
  console.log('TNF Agent Communication Relay extension is now deactivated');
}
```

### 5. Package.json Configuration

Add the commands to your package.json:

```json
{
  "contributes": {
    "commands": [
      {
        "command": "tnf.sendMessage",
        "title": "TNF: Send Message to Agent"
      },
      {
        "command": "tnf.viewMessageLog",
        "title": "TNF: View Message Log"
      }
    ],
    "menus": {
      "commandPalette": [
        {
          "command": "tnf.sendMessage"
        },
        {
          "command": "tnf.viewMessageLog"
        }
      ]
    }
  }
}
```

## Testing the Integration

1. Start the TNF Agent Communication Relay application
2. Launch VS Code with your extension
3. Use the command palette (Cmd+Shift+P) and select "TNF: Send Message to Agent"
4. Follow the prompts to send a message
5. Check the terminal or Chrome extension to see if the message was received

## Troubleshooting

### Common Issues

1. **Permission Denied**:
   ```bash
   chmod -R 777 /tmp/thefuse
   ```

2. **Messages Not Being Detected**:
   - Ensure the relay application is running
   - Check that the directories exist
   - Verify file naming conventions (should start with "message_" and end with ".json")

3. **JSON Parsing Errors**:
   - Validate your JSON format before sending
   - Use proper error handling for JSON parsing

## Best Practices

1. **Message Validation**: Always validate incoming messages before processing
2. **Error Handling**: Implement robust error handling for file operations
3. **Cleanup**: Remove processed message files to prevent disk space issues
4. **Logging**: Maintain logs of sent and received messages for debugging
5. **Security**: Validate and sanitize any commands or code before execution

## Advanced Integration

For more advanced integration, consider:

1. **WebSocket Connection**: Replace file-based communication with WebSockets
2. **Redis Integration**: Use Redis for more reliable message delivery
3. **MCP Server Integration**: Integrate with the Model Context Protocol server
