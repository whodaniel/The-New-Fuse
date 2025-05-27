import * as vscode from 'vscode';

/**
 * Handler for Ask mode
 * 
 * Ask mode provides a simplified interface for direct queries to specific agents
 */
export async function handle(command: string): Promise<void> {
  console.log(`Ask handler processing command: ${command}`);
  
  // Handle specific commands differently in ask mode
  switch (command) {
    case 'thefuse.openChat':
      // In ask mode, the chat might be more focused on Q&A
      vscode.window.showInformationMessage('Opening direct query chat interface');
      break;
      
    case 'thefuse.mcp.askAgent':
      // In ask mode, this might be more straightforward
      vscode.window.showInformationMessage('Sending direct query to selected agent');
      break;
      
    // Add more command handlers specific to ask mode
  }
}

/**
 * Initialize the ask mode
 */
export function initialize(): void {
  console.log('Initializing ask mode');
  // Set up any ask-specific state or UI
}

/**
 * Clean up when leaving ask mode
 */
export function cleanup(): void {
  console.log('Cleaning up ask mode');
  // Clean up any ask-specific state or UI
}
