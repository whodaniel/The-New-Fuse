import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Setup file watchers for file-based communication
 */
export function setupFileWatchers(context: vscode.ExtensionContext): any {
  // Create watcher for the AI communication directory
  const watcher = vscode.workspace.createFileSystemWatcher(
    '**/ai-communication/*.json'
  );
  
  // Handle new files
  watcher.onDidCreate(async (uri) => {
    try {
      await processMessageFile(uri);
    } catch (error) {
      console.error(`Error processing new message file ${uri.fsPath}:`, error);
    }
  });
  
  // Handle file changes
  watcher.onDidChange(async (uri) => {
    try {
      await processMessageFile(uri);
    } catch (error) {
      console.error(`Error processing updated message file ${uri.fsPath}:`, error);
    }
  });
  
  // Register file creation event handler
  vscode.workspace.onDidCreateFiles((event) => {
    for (const file of event.files) {
      // Notify about new file creation via command
      vscode.commands.executeCommand('thefuse.fileCreated', {
        uri: file.fsPath,
        type: getFileType(file.fsPath),
        timestamp: Date.now()
      });
    }
  });
  
  context.subscriptions.push(watcher);
}

/**
 * Process a message file from the file system
 */
async function processMessageFile(uri: vscode.Uri): Promise<void> {
  // Read the file
  const document = await vscode.workspace.openTextDocument(uri);
  const content = document.getText();
  
  try {
    // Parse the message
    const message = JSON.parse(content);
    
    // Only process pending messages
    if (message.status === 'pending') {
      // Route the message using the orchestrator
      await vscode.commands.executeCommand(
        'thefuse.orchestrator.sendMessage',
        message.sender,
        message.recipient,
        message.action,
        message.payload
      );
      
      // Mark the message as processed
      message.status = 'processed';
      
      // Update the file with the new status
      await vscode.workspace.fs.writeFile(
        uri,
        Buffer.from(JSON.stringify(message, null, 2))
      );
    }
  } catch (error) {
    console.error(`Error parsing message from ${uri.fsPath}:`, error);
  }
}

/**
 * Get the file type based on the extension
 */
function getFileType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.js':
    case '.ts':
    case '.jsx':
    case '.tsx':
      return 'javascript';
    case '.py':
      return 'python';
    case '.java':
      return 'java';
    case '.html':
    case '.htm':
      return 'html';
    case '.css':
      return 'css';
    case '.json':
      return 'json';
    case '.md':
      return 'markdown';
    default:
      return ext.substring(1) || 'plaintext';
  }
}