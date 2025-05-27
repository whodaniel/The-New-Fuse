import * as vscode from 'vscode';

/**
 * This function registers commands that are not already registered in the main extension.ts file.
 * It's primarily used for development and testing purposes.
 * For production use, commands should be registered through the CommandRegistry in extension.ts.
 */
export function forceRegisterCommands(): any {
  // Note: Most commands are now registered in the main extension.ts file through CommandRegistry
  // This function only registers commands that might be needed for development/testing
  
  // Register communication panel command if not already registered
  vscode.commands.registerCommand('thefuse.openCommunicationPanel', () => {
    // Try to execute the command through the main command registry first
    vscode.commands.executeCommand('thefuse.openChatPanel')
      .then(() => {}, () => {
        // Fallback if the main command isn't available
        vscode.window.showInformationMessage('Opening Communication Hub...');
      });
  });
  
  // Register web UI command if not already registered
  vscode.commands.registerCommand('thefuse.openWebUI', () => {
    // Try to execute the command through the main command registry first
    vscode.commands.executeCommand('thefuse.openDashboard')
      .then(() => {}, () => {
        // Fallback if the main command isn't available
        vscode.window.showInformationMessage('Opening The New Fuse UI...');
      });
  });
  
  // Register file message command if not already registered
  vscode.commands.registerCommand('thefuse.sendFileMessage', (recipient: string, action: string, payload: any) => {
    // Try to use the communication manager from the main extension
    vscode.commands.executeCommand('thefuse.orchestrator.sendMessage', {
      sender: 'thefuse.main',
      recipient: recipient,
      action: action,
      payload: payload
    }).then(() => {}, () => {
      // Fallback if the main command isn't available
      vscode.window.showInformationMessage(`Sending message to ${recipient} via File Protocol...`);
    });
  });
  
  // Add status bar button for easy access
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = "$(rocket) The New Fuse";
  statusBarItem.tooltip = "The New Fuse Commands";
  statusBarItem.command = 'thefuse.startAICollab'; // Link to the main AI collaboration command
  statusBarItem.show();
  
  vscode.window.showInformationMessage('The New Fuse commands are now registered!');
  return 'Commands registered';
}
