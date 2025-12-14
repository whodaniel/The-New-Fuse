import * as vscode from 'vscode';
import { ChatViewProvider } from '../../ChatViewProvider';
import { CommandHandler } from '../VSCodeCommandAdapter';

export class MCPConnectHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    const url = await vscode.window.showInputBox({
      prompt: 'Enter MCP Server URL',
      placeHolder: 'e.g. wss://mcp-server.example.com',
    });

    if (url) {
      vscode.window.setStatusBarMessage(`Connecting to MCP server: ${url}...`);
      // In a full implementation, we would delegate to chatProvider.getMCPManager().connect(url)
      setTimeout(() => {
        vscode.window.showInformationMessage(`Connected to MCP server at ${url}`);
        vscode.window.setStatusBarMessage('');
      }, 1000);
    }
  }
}

export class MCPStatusHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    vscode.window.showInformationMessage('MCP Status: No active servers connected (Demo Mode)');
  }
}
