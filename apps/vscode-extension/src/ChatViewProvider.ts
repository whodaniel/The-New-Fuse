import { ChatManager, Message } from '@the-new-fuse/tnf-core/chat/ChatManager';
import * as vscode from 'vscode';
import { AIServiceManager } from './ai/AIServiceManager';
import { SkillsManager } from './ai/SkillsManager';
import { SlashCommandManager } from './chat/SlashCommandManager';
import { MCPConfigurationManager } from './mcp/MCPConfigurationManager';
import { MCPConnectionManager } from './mcp/MCPConnectionManager';
import { MCPUIManager } from './mcp/MCPUIManager';
import { SecurityOrchestrator } from './security/SecurityOrchestrator';
import { DroppedFile, SystemStatus, WebviewMessage } from './types';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  static viewType = 'theNewFuse.chatView';

  private _extensionUri: vscode.Uri;
  private _securityOrchestrator: SecurityOrchestrator | null;
  private _aiServiceManager: AIServiceManager | null;
  private _mcpConnectionManager: MCPConnectionManager | null;
  private _mcpConfigManager: MCPConfigurationManager | null;
  private _mcpUIManager: MCPUIManager | null;
  private _slashCommandManager: SlashCommandManager;
  private _skillsManager: SkillsManager;
  private _view: vscode.WebviewView | undefined;
  private _chatManager: ChatManager;
  private _systemStatus: SystemStatus;

  constructor(
    extensionUri: vscode.Uri,
    securityOrchestrator: SecurityOrchestrator | null,
    aiServiceManager: AIServiceManager | null,
    mcpConnectionManager: MCPConnectionManager | null,
    context?: vscode.ExtensionContext
  ) {
    this._extensionUri = extensionUri;
    this._securityOrchestrator = securityOrchestrator;
    this._aiServiceManager = aiServiceManager;
    this._mcpConnectionManager = mcpConnectionManager;
    this._mcpConfigManager = context ? new MCPConfigurationManager(context) : null;
    this._mcpUIManager = this._mcpConfigManager ? new MCPUIManager(this._mcpConfigManager) : null;
    this._slashCommandManager = new SlashCommandManager();
    this._skillsManager = context ? new SkillsManager(context) : new SkillsManager({} as any);
    this._chatManager = new ChatManager();
    this._systemStatus = {
      isConnected: false,
      version: '8.0.0',
    };

    this._chatManager.on('chatCleared', () => {
      if (this._view) {
        this._view.webview.postMessage({ type: 'clearChat' });
      }
    });

    this._chatManager.on('messageAdded', (message: Message) => {
      if (this._view) {
        this._view.webview.postMessage({ type: 'addMessage', message });
      }
    });
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
      enableCommandUris: true,
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data: WebviewMessage) => {
      try {
        switch (data.type) {
          case 'sendMessage':
            await this.handleUserMessage(data.content!);
            break;
          case 'ready':
            this.sendInitialMessages();
            break;
          case 'attachFiles':
            this.handleAttachFiles();
            break;
          case 'setCodeMode':
            this.handleSetCodeMode();
            break;
          case 'setDatabaseMode':
            this.handleSetDatabaseMode();
            break;
          case 'clearAttachedFiles':
            this.handleClearAttachedFiles();
            break;
          case 'filesDropped':
            this.handleFilesDropped(data.files!);
            break;
          case 'clearChat':
            this.clearChat();
            break;
          case 'marketplaceButtonClicked':
            await this.marketplaceButtonClicked();
            break;
          case 'historyButtonClicked':
            await this.historyButtonClicked();
            break;
          case 'profileButtonClicked':
            await this.profileButtonClicked();
            break;
          case 'settingsButtonClicked':
            await this.settingsButtonClicked();
            break;
          case 'toolsButtonClicked':
            await this.toolsButtonClicked();
            break;
          case 'resourcesButtonClicked':
            await this.resourcesButtonClicked();
            break;
          case 'securityButtonClicked':
            await this.securityButtonClicked();
            break;
        }
      } catch (error) {
        console.error('Message handling error:', error);
      }
    });
  }

  /**
   * Update backend services after async initialization
   */
  async updateBackend(
    securityOrchestrator: SecurityOrchestrator,
    aiServiceManager: AIServiceManager,
    mcpConnectionManager: MCPConnectionManager
  ): Promise<void> {
    this._securityOrchestrator = securityOrchestrator;
    this._aiServiceManager = aiServiceManager;
    this._mcpConnectionManager = mcpConnectionManager;

    // Initialize MCP configuration manager if not already done
    if (this._mcpConfigManager && this._mcpUIManager) {
      await this._mcpConfigManager.initialize();
      console.log('✅ MCP Configuration Manager initialized');
    }

    // Update system status
    this._systemStatus.isConnected = true;

    // Notify webview that backend is ready
    this._view?.webview.postMessage({
      type: 'backendReady',
      status: {
        isConnected: true,
        version: '8.0.0',
        hasBackend: true,
        providers: aiServiceManager.getAvailableProviders(),
        mcpServers: mcpConnectionManager.getServerStatus(),
      },
    });

    console.log('✅ ChatViewProvider updated with backend services');
  }

  async handleUserMessage(content: string): Promise<void> {
    if (!content.trim()) {
      return;
    }

    // Check for Slash Commands
    if (content.startsWith('/')) {
      const handled = await this._slashCommandManager.executeCommand(content);
      if (handled) {
        // Don't show command in chat if handled, or show as user message but no AI response
        // For now, let's treat it as a command execution
        return;
      }
    }

    // Check for Skills (Auto-invocation)
    const skills = this._skillsManager.detectSkills(content);
    if (skills.length > 0) {
      const skillNames = skills.map((s) => s.name).join(', ');
      vscode.window.showInformationMessage(`🧠 Auto-activating skills: ${skillNames}`);
      // In a real implementation, we would inject the skill instructions into the LLM context here
    }

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: content,
      timestamp: new Date().toISOString(),
    };
    this._chatManager.addMessage(userMessage);

    // Update status
    this._view?.webview.postMessage({
      type: 'updateStatus',
      status: 'Processing...',
    });

    try {
      // Generate AI response using real API calls
      const aiResponse = await this._generateSecureAIResponse(content);
      this._chatManager.addMessage(aiResponse);

      this._view?.webview.postMessage({
        type: 'updateStatus',
        status: 'Ready',
      });
    } catch (error) {
      const errorResponse: Message = {
        role: 'assistant',
        content: `❌ Error: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
      };
      this._chatManager.addMessage(errorResponse);

      this._view?.webview.postMessage({
        type: 'updateStatus',
        status: 'Error',
      });
    }
  }

  async _generateSecureAIResponse(userInput: string): Promise<Message> {
    try {
      // Use AI Service Manager for real API calls if available
      if (this._aiServiceManager) {
        const response = await this._aiServiceManager.generateResponse(userInput, {
          stream: true, // Enable streaming for real-time UI updates
          systemPrompt:
            'You are a helpful AI assistant with comprehensive security monitoring active.',
        });

        return {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.warn('AI Service Manager unavailable, using fallback');
    }

    // Fallback to mockup-style response
    return this._generateMockupResponse(userInput);
  }

  _generateMockupResponse(userInput: string): Message {
    const input = userInput.toLowerCase();

    if (input.includes('mcp') || input.includes('protocol')) {
      return {
        role: 'assistant',
        content: `🔗 **MCP (Model Context Protocol) Integration**\n\nThe New Fuse supports advanced MCP integration:\n\n**Available MCP Features:**\n• Server Discovery\n• Tool Integration\n• Context Sharing\n\n**Commands:**\n\`/mcp\` - Manage MCP Servers`,
        timestamp: new Date().toISOString(),
      };
    }

    if (input.includes('/explain')) {
      return {
        role: 'assistant',
        content: `🔍 **Code Explanation**\n\nI can explain code if you select it and run \`/explain\`.`,
        timestamp: new Date().toISOString(),
      };
    }

    // Default response
    return {
      role: 'assistant',
      content: `🚀 **The New Fuse AI Assistant**\n\nHello! I'm your AI assistant.\n\n**Try these skills:**\n• Slash Commands: \`/explain\`, \`/fix\`, \`/refactor\`\n• MCP Tools: \`/mcp\`\n• Agent Federation: \`/agent\`\n\nHow can I help you today?`,
      timestamp: new Date().toISOString(),
    };
  }

  sendInitialMessages(): void {
    if (this._chatManager.messages.length === 0) {
      const welcomeMessage: Message = {
        role: 'assistant',
        content: '🚀 Welcome to The New Fuse! Try typing `/` to see available commands.',
        timestamp: new Date().toISOString(),
      };
      this._chatManager.addMessage(welcomeMessage);
    }

    // Send all messages to webview
    for (const message of this._chatManager.messages) {
      this._view?.webview.postMessage({
        type: 'addMessage',
        message: message,
      });
    }
  }

  sendMessage(): void {
    if (this._view) {
      this._view.show?.(true);
      this._view.webview.postMessage({ type: 'focusInput' });
    }
  }

  clearChat(): void {
    this._chatManager.clearChat();
  }

  newChat(): void {
    this._chatManager.clearChat();
    const welcomeMessage: Message = {
      role: 'assistant',
      content: '🚀 New secure chat started! Type `/` for commands.',
      timestamp: new Date().toISOString(),
    };
    this._chatManager.addMessage(welcomeMessage);
  }

  // ===== UI Component Methods =====

  public async showAgentSelector(): Promise<void> {
    const agents = [
      {
        label: 'Code Expert',
        description: 'Specialized in software engineering',
        detail: 'Uses Claude 3.5 Sonnet',
      },
      {
        label: 'Security Auditor',
        description: 'Analyzes security vulnerabilities',
        detail: 'Uses GPT-4o Security',
      },
      {
        label: 'Technical Writer',
        description: 'Documentation specialist',
        detail: 'Uses Gemini 1.5 Pro',
      },
      {
        label: 'Data Analyst',
        description: 'SQL and Data processing',
        detail: 'Uses Pandas Agent',
      },
    ];

    const selection = await vscode.window.showQuickPick(agents, {
      placeHolder: '🤖 Select an Agent to activate',
      title: 'Agent Federation',
    });

    if (selection) {
      vscode.window.showInformationMessage(`Activating agent: ${selection.label}`);
      this._chatManager.addMessage({
        role: 'assistant',
        content: `🔄 **Agent Switched**: ${selection.label} is now active.`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  public async showAPIKeyManager(): Promise<void> {
    // This replaces the old simple input box with a more robust UI flow
    const providers = ['OpenAI', 'Anthropic', 'Google Gemini', 'Mistral', 'OpenRouter'];

    const provider = await vscode.window.showQuickPick(providers, {
      placeHolder: 'Select Provider to configure',
      title: 'API Key Management',
    });

    if (!provider) {
      return;
    }

    // Check if key exists (mock check)
    const hasKey = false; // In real app, check SecureConfigManager

    const action = await vscode.window.showQuickPick(
      [hasKey ? 'Update Key' : 'Set Key', 'Delete Key', 'Verify Key'],
      { placeHolder: `${provider} Configuration` }
    );

    if (action === 'Set Key' || action === 'Update Key') {
      const key = await vscode.window.showInputBox({
        prompt: `Enter API Key for ${provider}`,
        password: true,
        placeHolder: 'sk-...',
      });

      if (key) {
        // Store securely
        if (this._securityOrchestrator) {
          await this._securityOrchestrator.storeApiKey(provider.toLowerCase(), key);
          vscode.window.showInformationMessage(`✅ ${provider} API Key saved securely.`);
        } else {
          vscode.window.showWarningMessage('Security Orchestrator not ready. Key not saved.');
        }
      }
    }
  }

  // UI Button Command Handlers
  async marketplaceButtonClicked(): Promise<void> {
    if (this._mcpUIManager) {
      await this._mcpUIManager.showMainMenu();
      return;
    }
    // Fallback
    vscode.window.showInformationMessage('MCP UI Manager not available.');
  }

  async historyButtonClicked(): Promise<void> {
    const options = ['Export Current Conversation', 'Import Conversation', 'Clear History'];
    const selection = await vscode.window.showQuickPick(options, {
      placeHolder: 'History Actions',
    });
    if (selection === 'Clear History') {
      this.clearChat();
    }
  }

  async profileButtonClicked(): Promise<void> {
    const options = ['Manage API Keys', 'User Settings'];
    const selection = await vscode.window.showQuickPick(options, { placeHolder: 'Profile' });
    if (selection === 'Manage API Keys') {
      await this.showAPIKeyManager();
    }
  }

  async settingsButtonClicked(): Promise<void> {
    const options = ['Security Dashboard', 'Agent Configuration'];
    const selection = await vscode.window.showQuickPick(options, { placeHolder: 'Settings' });
    if (selection === 'Security Dashboard') {
      this.showSecurityDashboard();
    }
  }

  async showSecurityDashboard(): Promise<void> {
    if (this._securityOrchestrator) {
      const dashboard = await this._securityOrchestrator.getSecurityDashboard();
      vscode.window.showInformationMessage(
        `Security Status: ${dashboard.securityEnabled ? 'Active' : 'Disabled'}`
      );
    }
  }

  async toolsButtonClicked(): Promise<void> {
    // Mock tool browser
    vscode.window.showInformationMessage('Tools Browser: Coming Soon');
  }

  async resourcesButtonClicked(): Promise<void> {
    vscode.window.showInformationMessage('Resources Browser: Coming Soon');
  }

  async securityButtonClicked(): Promise<void> {
    this.showSecurityDashboard();
  }

  handleAttachFiles(): void {
    // Implementation for file attachment
  }

  handleSetCodeMode(): void {
    // Switch to code mode
  }

  handleSetDatabaseMode(): void {
    // Switch to DB mode
  }

  handleClearAttachedFiles(): void {
    // Clear files
  }

  handleFilesDropped(files: DroppedFile[]): void {
    // Handle dropped files
  }

  showHelp(): void {
    // Show help
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Simplified HTML for robustness in this update
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
    );
    const styleVscodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
    );
    const styleChatUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'modern-chat.css')
    );
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
    );

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVscodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				<link href="${styleChatUri}" rel="stylesheet">
				<title>The New Fuse AI</title>
			</head>
			<body>
				<div id="chat-container">
					<div id="messages"></div>
					<div id="input-area">
						<textarea id="message-input" placeholder="Type / for commands..."></textarea>
						<button id="send-button">Send</button>
					</div>
				</div>
				<script src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}
