// Script to verify VS Code command registration
// To use this:
// 1. Open VS Code with the extension loaded
// 2. Open the Debug Console (View > Debug Console)
// 3. Copy and paste this entire file into the Debug Console
// 4. Press Enter to execute

import vscode from 'vscode';

async function checkCommands() {

  // Get all commands registered in VS Code
  const allCommands = await vscode.commands.getCommands();
  
  // Filter for our extension's commands
  const fuseCommands = allCommands.filter(cmd => cmd.startsWith('thefuse.'));

  fuseCommands.forEach(cmd => {
    
  });
  
  // Check specifically for MCP commands
  const mcpCommands = fuseCommands.filter(cmd => cmd.includes('mcp'));
  
  mcpCommands.forEach(cmd => {
    
  });
  
  // Check for critical commands
  const criticalCommands = [
    'thefuse.mcp.initialize',
    'thefuse.mcp.showTools',
    'thefuse.mcp.testTool',
    'thefuse.mcp.askAgent'
  ];

  let missingCommands = false;
  
  for (const cmd of criticalCommands) {
    if (allCommands.includes(cmd)) {
      
    } else {
      
      missingCommands = true;
    }
  }
  
  if (missingCommands) {
    
    ');

  } else {
    
  }
  
  return { fuseCommands, mcpCommands, criticalCommands };
}

// Execute the check
checkCommands().then(results => {
  
}).catch(error => {
  console.error('Error checking commands:', error);
});
