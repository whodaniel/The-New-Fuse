// Simple script to force-register The New Fuse commands
// To use:
// 1. Open VS Code with the extension loaded
// 2. Open the built-in terminal (Terminal > New Terminal)
// 3. Paste and run this code

import vscode from 'vscode';

// Register commands
async function registerCommands() {
  // All core commands are now registered in the main extension.ts file
  // This script only creates a status bar item that links to the main functionality

  // Status bar items
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = "$(rocket) The New Fuse";
  statusBarItem.tooltip = "The New Fuse - Click to start AI collaboration";
  statusBarItem.command = 'thefuse.startAICollab'; // Link to the main AI collaboration command
  statusBarItem.show();
  
  // Create a secondary status bar item for opening the command palette
  const commandPaletteItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
  commandPaletteItem.text = "$(list-unordered) Commands";
  commandPaletteItem.tooltip = "Open The New Fuse Command Palette";
  commandPaletteItem.command = 'thefuse.openMcpCommandPalette'; // Link to the MCP command palette
  commandPaletteItem.show();
  
  vscode.window.showInformationMessage('The New Fuse commands are now registered!');
  return 'Commands registered';
}

// Execute the function
registerCommands().then(result => {
  console.log(result);
});
