// Command registration diagnostic tool
// Run this in the Debug Console to inspect registered commands

import vscode from 'vscode';

async function checkCommands() {

  // Get all commands
  const allCommands = await vscode.commands.getCommands();
  
  // Filter for our commands
  const fuseCommands = allCommands.filter(cmd => cmd.includes('thefuse.'));

  if (fuseCommands.length === 0) {

  }
  
  return fuseCommands;
}

// Execute and return the result
checkCommands().then(commands => {
  
});
