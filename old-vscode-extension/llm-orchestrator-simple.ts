/**
 * Simplified LLM Orchestrator
 */

import * as vscode from 'vscode';

export class LLMOrchestrator {
  private context: vscode.ExtensionContext;
  private statusBarItem: vscode.StatusBarItem;
  private registeredAgents: any[] = [];
  
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.text = "$(hubot) AI Agents";
    this.statusBarItem.tooltip = "Manage AI Agents";
    this.statusBarItem.command = 'llm-orchestrator.showAgents';
    this.statusBarItem.show();
    
    // Register commands
    this.registerCommands();
  }
  
  private registerCommands() {
    // Register command to show registered agents
    this.context.subscriptions.push(
      vscode.commands.registerCommand('llm-orchestrator.showAgents', () => {
        this.showAgentsMenu();
      })
    );
    
    // Register command to discover agents
    this.context.subscriptions.push(
      vscode.commands.registerCommand('llm-orchestrator.discoverAgents', () => {
        this.discoverLLMAgents();
      })
    );
  }
  
  private async discoverLLMAgents() {
    // This is a placeholder for actually discovering agents
    this.registeredAgents = [
      {
        id: 'copilot.agent',
        name: 'GitHub Copilot',
        description: 'AI code assistant powered by OpenAI',
        capabilities: ['code-generation', 'code-completion']
      },
      {
        id: 'claude.agent',
        name: 'Claude',
        description: 'Anthropic\'s Claude assistant',
        capabilities: ['text-generation', 'code-explanation']
      }
    ];
    
    vscode.window.showInformationMessage(`Discovered ${this.registeredAgents.length} AI agents.`);
    this.statusBarItem.text = `$(hubot) AI Agents (${this.registeredAgents.length})`;
  }
  
  private async showAgentsMenu() {
    if (this.registeredAgents.length === 0) {
      vscode.window.showInformationMessage('No AI agents registered. Discover agents first.');
      return;
    }
    
    const items = this.registeredAgents.map(agent => ({
      label: agent.name,
      description: agent.description,
      detail: `ID: ${agent.id} | Capabilities: ${agent.capabilities.join(', ')}`,
      agent
    }));
    
    vscode.window.showQuickPick(items, {
      placeHolder: 'Select an AI agent to use',
      title: 'Available AI Agents'
    });
  }
  
  // Get registered agents
  getRegisteredAgents(): any[] {
    return this.registeredAgents;
  }
  
  // Dispose of resources
  dispose() {
    this.statusBarItem.dispose();
  }
}

// Export factory function
export function createLLMOrchestrator(context: vscode.ExtensionContext): LLMOrchestrator {
  return new LLMOrchestrator(context);
}
