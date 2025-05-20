import * as vscode from 'vscode';
import { Orchestrator } from './orchestrator/orchestrator.js';
import { setupFileWatchers } from './orchestrator/file-watchers.js';
import { AgentDiscovery } from './discovery/agentDiscovery.js';
import { AgentEvent } from './discovery/types.js';

// Global instance of agent discovery
let agentDiscovery: AgentDiscovery | undefined;

export async function activate(context: vscode.ExtensionContext): any {
  console.log('Activating The New Fuse extension');

  // Create the orchestrator instance
  const orchestrator = new Orchestrator(context);
  
  // Setup file system watchers for file-based communication
  setupFileWatchers(context);
  
  // Set the Memento startup message
  context.workspaceState.update('thefuse.orchestratorStatus', {
    status: 'active',
    version: '1.0.0',
    startTime: Date.now()
  });
  
  // Store the orchestrator instance in global state for debugging
  context.globalState.update('thefuse.orchestratorActive', true);
  
  // Initialize agent discovery
  agentDiscovery = new AgentDiscovery();
  await agentDiscovery.initialize();
  context.subscriptions.push(agentDiscovery);
  
  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('thefuse.showAgents', showAgents),
    vscode.commands.registerCommand('thefuse.refreshAgents', refreshAgents)
  );
  
  // Listen for agent events for logging
  agentDiscovery.onAgentEvent(event => {
    let message = '';
    switch (event.type) {
      case AgentEvent.REGISTERED:
        message = `Agent registered: ${event.agent.name}`;
        break;
      case AgentEvent.UNREGISTERED:
        message = `Agent unregistered: ${event.agent.name}`;
        break;
      case AgentEvent.CAPABILITY_CHANGED:
        message = `Agent capabilities changed: ${event.agent.name}`;
        break;
      case AgentEvent.STATUS_CHANGED:
        message = `Agent status changed: ${event.agent.name} (${event.agent.isActive ? 'active' : 'inactive'})`;
        break;
    }
    console.log(`[The New Fuse] ${message}`);
  });
  
  // Show welcome message
  vscode.window.showInformationMessage('The New Fuse is now active');
}

export function deactivate(): any {
  console.log('Deactivating The New Fuse extension');
  agentDiscovery = undefined;
}

/**
 * Command to show discovered agents
 */
async function showAgents(): any {
  if (!agentDiscovery) {
    vscode.window.showErrorMessage('The New Fuse is not properly initialized');
    return;
  }
  
  const agents = agentDiscovery.getRegistry().getAllAgents();
  if (agents.length === 0) {
    vscode.window.showInformationMessage('No AI agents discovered yet');
    return;
  }
  
  // Create a markdown string with agent information
  const markdown = new vscode.MarkdownString();
  markdown.appendMarkdown('# Discovered AI Agents\n\n');
  
  for (const agent of agents) {
    markdown.appendMarkdown(`## ${agent.name} (${agent.isActive ? '✅ Active' : '❌ Inactive'})\n`);
    markdown.appendMarkdown(`- **ID**: ${agent.id}\n`);
    markdown.appendMarkdown(`- **Version**: ${agent.version}\n`);
    markdown.appendMarkdown(`- **Extension**: ${agent.extensionId}\n`);
    markdown.appendMarkdown(`- **Capabilities**:\n`);
    
    for (const capability of agent.capabilities) {
      markdown.appendMarkdown(`  - ${capability}\n`);
    }
    markdown.appendMarkdown('\n');
  }
  
  // Show the markdown in a webview panel
  const panel = vscode.window.createWebviewPanel(
    'thefuse.agents',
    'The New Fuse: AI Agents',
    vscode.ViewColumn.One,
    {}
  );
  
  panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>The New Fuse: AI Agents</title>
      <style>
        body { font-family: var(--vscode-font-family); padding: 20px; }
        .agent { margin-bottom: 20px; border-bottom: 1px solid var(--vscode-editor-lineHighlightBorder); }
        .active { color: var(--vscode-terminal-ansiGreen); }
        .inactive { color: var(--vscode-terminal-ansiRed); }
      </style>
    </head>
    <body>
      ${markdown.value}
    </body>
    </html>
  `;
}

/**
 * Command to refresh agent discovery
 */
async function refreshAgents(): any {
  if (!agentDiscovery) {
    vscode.window.showErrorMessage('The New Fuse is not properly initialized');
    return;
  }
  
  await agentDiscovery.initialize();
  vscode.window.showInformationMessage('Agent discovery refreshed');
  
  // Show the updated agents
  await showAgents();
}