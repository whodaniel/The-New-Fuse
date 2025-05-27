import * as vscode from 'vscode';
import { getLogger, Logger } from './src/core/logging.js';

/**
 * Master Command Center
 * 
 * This class provides a centralized interface for accessing all commands in The New Fuse.
 * It creates a webview panel that displays available commands and allows users to execute them.
 */
export class MasterCommandCenter {
  private context: vscode.ExtensionContext;
  private panel: vscode.WebviewPanel | undefined;
  private logger: Logger;
  
  /**
   * Constructor
   * @param context VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.logger = Logger.getInstance();
  }
  
  /**
   * Show the Master Command Center
   */
  public async show(): Promise<void> {
    // Create and show panel
    this.panel = vscode.window.createWebviewPanel(
      'masterCommandCenter',
      'The New Fuse Command Center',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );
    
    // Set HTML content
    this.panel.webview.html = this.getWebviewContent();
    
    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(this.handleWebviewMessage.bind(this));
    
    // Clean up resources when the panel is closed
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }
  
  /**
   * Handle messages from the webview
   */
  public handleWebviewMessage(message: any) {
    this.logger.info(`Received webview message: ${message.command}`);
    switch (message.command) {
      case 'executeCommand':
        this.executeVSCodeCommand(message.commandId, message.args || []);
        break;
      // Add other message handlers
      default:
        this.logger.warn(`Unknown webview message command: ${message.command}`);
        break;
    }
  }
  
  /**
   * Execute a VS Code command with error handling
   */
  private async executeVSCodeCommand(commandId: string, args?: any[]) {
    try {
      this.logger.info(`Executing command: ${commandId}`, args);
      await vscode.commands.executeCommand(commandId, ...(args || []));
    } catch (error) {
      if (error instanceof Error) {
        vscode.window.showErrorMessage(`Error executing command ${commandId}: ${error.message}`);
        this.logger.error(`Command execution failed for ${commandId}:`, error);
      } else {
        vscode.window.showErrorMessage(`Error executing command ${commandId}: An unknown error occurred`);
        this.logger.error(`Command execution failed for ${commandId}: Unknown error`);
      }
    }
  }
  
  /**
   * Get the HTML content for the webview
   */
  private getWebviewContent(): string {
    // Get all registered commands
    const commands = [
      { id: 'thefuse.startAICollab', title: 'Start AI Collaboration', description: 'Start a new AI collaboration session' },
      { id: 'thefuse.openChatPanel', title: 'Open Chat Panel', description: 'Open the chat interface' },
      { id: 'thefuse.mcp.showTools', title: 'Show MCP Tools', description: 'Show available MCP tools' },
      { id: 'thefuse.mcp.initialize', title: 'Initialize MCP', description: 'Initialize the MCP integration' },
      { id: 'thefuse.showAgents', title: 'Show Agents', description: 'Show discovered AI agents' },
      { id: 'thefuse.discoverAgents', title: 'Discover Agents', description: 'Discover available AI agents' },
      { id: 'thefuse.openWorkflowBuilder', title: 'Open Workflow Builder', description: 'Open the workflow builder interface' },
      { id: 'thefuse.showLog', title: 'Show Log', description: 'Show The New Fuse log' }
    ];
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>The New Fuse Command Center</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
          }
          h1 {
            color: var(--vscode-editor-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
          }
          .command-list {
            list-style: none;
            padding: 0;
            margin: 20px 0;
          }
          .command-item {
            padding: 10px;
            margin-bottom: 8px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .command-item:hover {
            background-color: var(--vscode-editor-selectionBackground);
          }
          .command-title {
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
          }
          .command-description {
            font-size: 0.9em;
            opacity: 0.8;
          }
          .command-id {
            font-family: monospace;
            font-size: 0.8em;
            color: var(--vscode-textPreformat-foreground);
            display: block;
            margin-top: 5px;
          }
          .search-box {
            width: 100%;
            padding: 8px;
            margin-bottom: 15px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <h1>The New Fuse Command Center</h1>
        <input type="text" class="search-box" placeholder="Search commands..." id="searchBox">
        
        <ul class="command-list" id="commandList">
          ${commands.map(cmd => `
            <li class="command-item" data-command-id="${cmd.id}">
              <span class="command-title">${cmd.title}</span>
              <span class="command-description">${cmd.description}</span>
              <span class="command-id">${cmd.id}</span>
            </li>
          `).join('')}
        </ul>
        
        <script>
          (function() {
            const vscode = acquireVsCodeApi();
            const commandItems = document.querySelectorAll('.command-item');
            const searchBox = document.getElementById('searchBox');
            
            // Handle command click
            commandItems.forEach(item => {
              item.addEventListener('click', () => {
                const commandId = item.getAttribute('data-command-id');
                vscode.postMessage({
                  command: 'executeCommand',
                  commandId: commandId,
                  args: []
                });
              });
            });
            
            // Handle search
            searchBox.addEventListener('input', () => {
              const searchTerm = searchBox.value.toLowerCase();
              commandItems.forEach(item => {
                const title = item.querySelector('.command-title').textContent.toLowerCase();
                const description = item.querySelector('.command-description').textContent.toLowerCase();
                const id = item.querySelector('.command-id').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || description.includes(searchTerm) || id.includes(searchTerm)) {
                  item.style.display = 'block';
                } else {
                  item.style.display = 'none';
                }
              });
            });
          })();
        </script>
      </body>
      </html>
    `;
  }
}

/**
 * Register the Master Command Center command
 * @param context VS Code extension context
 */
export function registerMasterCommandCenter(context: vscode.ExtensionContext): vscode.Disposable {
  const masterCommandCenter = new MasterCommandCenter(context);
  
  // Register the command
  const disposable = vscode.commands.registerCommand('thefuse.openMasterCommandCenter', async () => {
    await masterCommandCenter.show();
  });
  
  // Add to subscriptions
  context.subscriptions.push(disposable);
  
  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.text = "$(list-selection) Commands";
  statusBarItem.tooltip = "Open The New Fuse Command Center";
  statusBarItem.command = 'thefuse.openMasterCommandCenter';
  statusBarItem.show();
  
  // Add status bar item to subscriptions
  context.subscriptions.push(statusBarItem);
  
  return disposable;
}