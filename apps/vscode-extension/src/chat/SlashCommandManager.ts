import * as vscode from 'vscode';

export interface SlashCommand {
  command: string; // e.g., "/explain"
  description: string;
  detail?: string;
  callback: (args: string) => Promise<void>;
}

export class SlashCommandManager {
  private commands: Map<string, SlashCommand> = new Map();

  constructor() {
    this.registerDefaultCommands();
  }

  public registerCommand(command: SlashCommand) {
    this.commands.set(command.command, command);
  }

  private registerDefaultCommands() {
    this.registerCommand({
      command: '/explain',
      description: 'Explain selected code',
      detail: 'Analyzes the selected code and provides a detailed explanation',
      callback: async () => {
        await vscode.commands.executeCommand('theNewFuse.explainCode');
      },
    });

    this.registerCommand({
      command: '/fix',
      description: 'Fix code issues',
      detail: 'Proposes fixes for bugs or linting errors in selection',
      callback: async () => {
        await vscode.commands.executeCommand('theNewFuse.fixCode');
      },
    });

    this.registerCommand({
      command: '/refactor',
      description: 'Refactor code',
      detail: 'Improves code structure and readability',
      callback: async () => {
        await vscode.commands.executeCommand('theNewFuse.improveCode');
      },
    });

    this.registerCommand({
      command: '/test',
      description: 'Generate tests',
      detail: 'Creates unit tests for the selected code',
      callback: async (args) => {
        /* TODO: Implement generate test logic */
      },
    });

    this.registerCommand({
      command: '/clear',
      description: 'Clear chat history',
      callback: async () => {
        await vscode.commands.executeCommand('theNewFuse.clearChat');
      },
    });

    this.registerCommand({
      command: '/help',
      description: 'Show help',
      callback: async () => {
        await vscode.commands.executeCommand('theNewFuse.helpButtonClicked');
      },
    });

    this.registerCommand({
      command: '/mcp',
      description: 'Manage MCP Servers',
      detail: 'Connect, status, or list tools',
      callback: async () => {
        await vscode.commands.executeCommand('theNewFuse.marketplaceButtonClicked');
      },
    });

    this.registerCommand({
      command: '/agent',
      description: 'Agent Federation',
      detail: 'Orchestrate multi-agent workflows',
      callback: async () => {
        await vscode.commands.executeCommand('theNewFuse.agentFederation');
      },
    });
  }

  public async executeCommand(input: string): Promise<boolean> {
    const parts = input.trim().split(' ');
    const commandName = parts[0];
    const args = parts.slice(1).join(' ');

    const cmd = this.commands.get(commandName);
    if (cmd) {
      await cmd.callback(args);
      return true;
    }
    return false;
  }

  public getCommands(): SlashCommand[] {
    return Array.from(this.commands.values());
  }

  public getCompletionItems(text: string): vscode.CompletionItem[] {
    if (!text.startsWith('/')) {
      return [];
    }

    return Array.from(this.commands.values())
      .filter((c) => c.command.startsWith(text))
      .map((c) => {
        const item = new vscode.CompletionItem(c.command, vscode.CompletionItemKind.Function);
        item.detail = c.description;
        item.documentation = c.detail;
        return item;
      });
  }
}
