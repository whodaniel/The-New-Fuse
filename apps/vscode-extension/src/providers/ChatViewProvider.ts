/**
 * The New Fuse VSCode Extension - Chat View Provider
 * Version 9.0.0 - Clean Architecture
 *
 * Webview provider for the main chat interface
 */

import * as vscode from 'vscode';
import { ChatMessage, FileAttachment, WebviewOutboundMessage } from '../core/types';
import { getAIService } from '../services/AIService';
import { getChatService } from '../services/ChatService';
import { getMCPService } from '../services/MCPService';
import { generateId } from '../utils/helpers';
import { log } from '../utils/logger';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'theNewFuse.chatView';

  private view?: vscode.WebviewView;
  private extensionUri: vscode.Uri;
  private currentMode: 'chat' | 'code' | 'agent' = 'chat';
  private contextItems: Array<{ code: string; path: string }> = [];
  private pendingAttachments: FileAttachment[] = [];

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      await this.handleWebviewMessage(message);
    });

    // Subscribe to chat service events
    const chatService = getChatService();
    chatService.onMessage((msg) => {
      this.sendToWebview({ type: 'addMessage', payload: msg });
    });
    chatService.onClear(() => {
      this.sendToWebview({ type: 'clearChat' });
    });

    log.info('ChatViewProvider initialized');
  }

  /**
   * Handle messages from the webview
   */
  private async handleWebviewMessage(message: { type: string; payload?: unknown }): Promise<void> {
    try {
      switch (message.type) {
        case 'ready':
          await this.onWebviewReady();
          break;

        case 'sendMessage':
          await this.handleUserMessage(message.payload as string);
          break;

        case 'clearChat':
          const chatService = getChatService();
          chatService.clearMessages();
          break;

        case 'attachFiles':
          await this.promptAttachFiles();
          break;

        case 'filesDropped':
          await this.handleDroppedFiles(message.payload as Array<{ name: string; path: string }>);
          break;

        case 'setMode':
          this.setMode(message.payload as 'chat' | 'code' | 'agent');
          break;

        case 'getStatus':
          await this.sendStatus();
          break;

        default:
          log.warn(`Unknown webview message type: ${message.type}`);
      }
    } catch (error) {
      log.error('Error handling webview message', error);
      this.sendToWebview({
        type: 'error',
        payload: { message: (error as Error).message },
      });
    }
  }

  /**
   * Called when webview signals ready
   */
  private async onWebviewReady(): Promise<void> {
    log.debug('Webview ready');

    // Send existing messages
    const chatService = getChatService();
    const messages = chatService.getMessages();

    if (messages.length === 0) {
      // Send welcome message for new sessions
      const welcome = chatService.newChat();
      this.sendToWebview({ type: 'addMessage', payload: welcome });
    } else {
      // Replay existing messages
      for (const msg of messages) {
        this.sendToWebview({ type: 'addMessage', payload: msg });
      }
    }

    // Send initial status
    await this.sendStatus();
  }

  /**
   * Handle user message from webview
   */
  async handleUserMessage(content: string): Promise<void> {
    if (!content?.trim()) return;

    log.debug('User message received', { content: content.substring(0, 100) });

    // Check for slash commands
    if (content.startsWith('/')) {
      await this.handleSlashCommand(content);
      return;
    }

    // Update status
    this.sendToWebview({ type: 'updateStatus', payload: { status: 'Thinking...' } });

    try {
      const chatService = getChatService();
      await chatService.sendMessage(content);

      this.sendToWebview({ type: 'updateStatus', payload: { status: 'Ready' } });
    } catch (error) {
      log.error('Failed to send message', error);
      this.sendToWebview({ type: 'updateStatus', payload: { status: 'Error' } });
    }
  }

  /**
   * Handle slash commands
   */
  private async handleSlashCommand(command: string): Promise<void> {
    const [cmd, ...args] = command.slice(1).split(' ');
    const chatService = getChatService();

    switch (cmd.toLowerCase()) {
      case 'clear':
        chatService.clearMessages();
        break;

      case 'new':
        chatService.newChat();
        break;

      case 'help':
        const helpMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: `**Available Commands:**
- \`/clear\` - Clear chat history
- \`/new\` - Start new conversation
- \`/status\` - Show system status
- \`/mcp\` - MCP server management
- \`/model\` - Change AI model
- \`/help\` - Show this help`,
          timestamp: new Date().toISOString(),
        };
        chatService.addMessage(helpMessage);
        break;

      case 'status':
        await this.sendStatus();
        const aiService = getAIService();
        const mcpService = getMCPService();
        const statusMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: `**System Status:**
- AI Provider: ${aiService.getActiveProvider() || 'Not configured'}
- MCP Servers: ${mcpService.getConnections().length} configured
- Mode: ${this.currentMode}`,
          timestamp: new Date().toISOString(),
        };
        chatService.addMessage(statusMessage);
        break;

      case 'mcp':
        const mcpSvc = getMCPService();
        await mcpSvc.showServerPicker();
        break;

      case 'model':
        const models = ['gpt-4', 'gpt-3.5-turbo', 'claude-3-5-sonnet', 'gemini-1.5-pro'];
        const selection = await vscode.window.showQuickPick(models, {
          placeHolder: 'Select AI model',
        });
        if (selection) {
          vscode.window.showInformationMessage(`Model set to: ${selection}`);
        }
        break;

      default:
        const unknownMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: `Unknown command: \`/${cmd}\`. Type \`/help\` for available commands.`,
          timestamp: new Date().toISOString(),
        };
        chatService.addMessage(unknownMessage);
    }
  }

  /**
   * Send message to webview
   */
  sendToWebview(message: WebviewOutboundMessage): void {
    if (this.view) {
      this.view.webview.postMessage(message);
    }
  }

  /**
   * Focus the input field
   */
  focusInput(): void {
    if (this.view) {
      this.view.show?.(true);
      this.sendToWebview({ type: 'focusInput' });
    }
  }

  /**
   * Set current mode
   */
  setMode(mode: 'chat' | 'code' | 'agent'): void {
    this.currentMode = mode;
    this.sendToWebview({ type: 'updateStatus', payload: { mode } });
  }

  /**
   * Add context item
   */
  addContext(item: { code: string; path: string }): void {
    this.contextItems.push(item);
    this.sendToWebview({
      type: 'updateStatus',
      payload: { contextCount: this.contextItems.length },
    });
  }

  /**
   * Attach files from picker
   */
  async attachFiles(files: vscode.Uri[]): Promise<void> {
    for (const file of files) {
      try {
        const content = await vscode.workspace.fs.readFile(file);
        const decoder = new TextDecoder();

        this.pendingAttachments.push({
          name: file.path.split('/').pop() || 'file',
          path: file.fsPath,
          size: content.length,
          type: 'text',
          content: decoder.decode(content),
        });
      } catch (error) {
        log.warn(`Failed to read file: ${file.fsPath}`);
      }
    }

    const chatService = getChatService();
    chatService.addAttachments(this.pendingAttachments);

    this.sendToWebview({
      type: 'updateStatus',
      payload: { attachmentCount: this.pendingAttachments.length },
    });

    this.pendingAttachments = [];
  }

  /**
   * Prompt user to attach files
   */
  private async promptAttachFiles(): Promise<void> {
    const files = await vscode.window.showOpenDialog({
      canSelectMany: true,
      openLabel: 'Attach',
    });

    if (files && files.length > 0) {
      await this.attachFiles(files);
    }
  }

  /**
   * Handle files dropped into webview
   */
  private async handleDroppedFiles(files: Array<{ name: string; path: string }>): Promise<void> {
    log.debug(`Handling ${files.length} dropped files`);

    const uris = files.map((f) => vscode.Uri.file(f.path));
    await this.attachFiles(uris);
  }

  /**
   * Send current status to webview
   */
  private async sendStatus(): Promise<void> {
    const aiService = getAIService();
    const mcpService = getMCPService();

    this.sendToWebview({
      type: 'updateStatus',
      payload: {
        status: 'Ready',
        mode: this.currentMode,
        provider: aiService.getActiveProvider(),
        mcpServers: mcpService.getConnections().length,
        contextCount: this.contextItems.length,
      },
    });
  }

  /**
   * Get HTML content for webview
   */
  private getHtmlContent(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'styles.css')
    );
    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        'node_modules',
        '@vscode/codicons',
        'dist',
        'codicon.css'
      )
    );

    const nonce = this.getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data:;">
  <link href="${styleUri}" rel="stylesheet">
  <link href="${codiconsUri}" rel="stylesheet">
  <title>The New Fuse</title>
</head>
<body>
  <div id="app">
    <div id="messages" class="messages"></div>

    <div id="context-bar" class="context-bar hidden">
      <span class="context-count"></span>
      <button class="context-clear" title="Clear context">×</button>
    </div>

    <div class="input-area">
      <textarea id="input" placeholder="Type a message... (/ for commands)" rows="2"></textarea>
      <div class="input-row">
        <div class="input-actions">
          <button id="btn-attach" class="action-btn" title="Attach files">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.5 1.5a2.5 2.5 0 0 1 2.5 2.5v7a4.5 4.5 0 0 1-9 0V4a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 0 7 0V4a1.5 1.5 0 0 0-3 0v7a.5.5 0 0 0 1 0V4a.5.5 0 0 1 1 0v7a1.5 1.5 0 0 1-3 0V4a2.5 2.5 0 0 1 2.5-2.5z"/>
            </svg>
          </button>
          <button id="btn-code" class="action-btn" title="Code mode">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"/>
            </svg>
          </button>
          <button id="btn-agent" class="action-btn" title="Agent mode">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zM3 8.062C3 6.371 4.287 5 5.98 5a.25.25 0 0 0 .177-.073l.674-.674a.75.75 0 0 1 .75-.146l1.012.337a.25.25 0 0 0 .219-.044L9.55 3.808a.75.75 0 0 1 .9 0l.738.592a.25.25 0 0 0 .22.044l1.01-.337a.75.75 0 0 1 .75.146l.674.674a.25.25 0 0 0 .177.073c1.693 0 2.98 1.371 2.98 3.062 0 1.586-1.048 2.889-2.5 3.248v.19a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 1-.75-.75v-.19C2.91 10.95 3 9.648 3 8.062zM5.98 6c-.988 0-1.98.804-1.98 2.062C4 9.56 4.864 10.5 6 10.5h4c1.136 0 2-.94 2-2.438C12 6.804 11.008 6 10.02 6a1.25 1.25 0 0 1-.884-.366l-.404-.405-.664.222a1.25 1.25 0 0 1-1.094-.22L6.86 5.12l-.405.405C6.204 5.776 5.914 6 5.98 6z"/>
            </svg>
          </button>
        </div>
        <button id="btn-send" class="send-btn" title="Send message">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11zM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <div id="drop-zone" class="drop-zone hidden">
    <div class="drop-zone-content">
      <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
      </svg>
      <span>Drop files here</span>
    </div>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
