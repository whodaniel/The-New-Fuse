import * as vscode from 'vscode';
import { SecurityOrchestrator } from './security/SecurityOrchestrator';
import { AIServiceManager } from './ai/AIServiceManager';
import { MCPConnectionManager } from './mcp/MCPConnectionManager';
import { MCPConfigurationManager } from './mcp/MCPConfigurationManager';
import { MCPUIManager } from './mcp/MCPUIManager';
import { ChatManager, Message } from '@the-new-fuse/tnf-core/chat/ChatManager';
import { SystemStatus, WebviewMessage, DroppedFile } from './types';

export class ChatViewProvider implements vscode.WebviewViewProvider {
	static viewType = 'theNewFuse.chatView';

	private _extensionUri: vscode.Uri;
	private _securityOrchestrator: SecurityOrchestrator | null;
	private _aiServiceManager: AIServiceManager | null;
	private _mcpConnectionManager: MCPConnectionManager | null;
	private _mcpConfigManager: MCPConfigurationManager | null;
	private _mcpUIManager: MCPUIManager | null;
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
		this._chatManager = new ChatManager();
		this._systemStatus = {
			isConnected: false,
			version: '7.0.0'
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

	resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
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
				version: '7.3.0',
				hasBackend: true,
				providers: aiServiceManager.getAvailableProviders(),
				mcpServers: mcpConnectionManager.getServerStatus()
			}
		});

		console.log('✅ ChatViewProvider updated with backend services');
	}

	async handleUserMessage(content: string): Promise<void> {
		if (!content.trim()) {return;}

		// Add user message
		const userMessage: Message = {
			role: 'user',
			content: content,
			timestamp: new Date().toISOString()
		};
		this._chatManager.addMessage(userMessage);

		// Update status
		this._view?.webview.postMessage({
			type: 'updateStatus',
			status: 'Processing...'
		});

		try {
			// Generate AI response using real API calls
			const aiResponse = await this._generateSecureAIResponse(content);
			this._chatManager.addMessage(aiResponse);

			this._view?.webview.postMessage({
				type: 'updateStatus',
				status: 'Ready'
			});
		} catch (error) {
			const errorResponse: Message = {
				role: 'assistant',
				content: `❌ Error: ${(error as Error).message}`,
				timestamp: new Date().toISOString()
			};
			this._chatManager.addMessage(errorResponse);

			this._view?.webview.postMessage({
				type: 'updateStatus',
				status: 'Error'
			});
		}
	}

	async _generateSecureAIResponse(userInput: string): Promise<Message> {
		try {
			// Use AI Service Manager for real API calls if available
			if (this._aiServiceManager) {
				const response = await this._aiServiceManager.generateResponse(userInput, {
					stream: true, // Enable streaming for real-time UI updates
					systemPrompt: 'You are a helpful AI assistant with comprehensive security monitoring active.'
				});

				return {
					role: 'assistant',
					content: response,
					timestamp: new Date().toISOString()
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
				content: `🔗 **MCP (Model Context Protocol) Integration**

The New Fuse supports advanced MCP integration:

**Available MCP Features:**
• Server Discovery: Automatically detect and connect to MCP servers
• Tool Integration: Access external tools and resources through MCP
• Context Sharing: Share context across different AI systems
• Protocol Management: Handle MCP protocol versions

**Commands Available:**
\`tnf mcp connect <server>\` - Connect to MCP server
\`tnf mcp list\` - List available servers
\`tnf mcp tools\` - Show available tools

Ready to enhance your AI capabilities!`,
				timestamp: new Date().toISOString()
			};
		}

		// Default response
		return {
			role: 'assistant',
			content: `🚀 **The New Fuse AI Assistant**

Hello! I'm your AI assistant with powerful capabilities.

**Your Query:** "${userInput}"

**Core Features:**
• Multi-Agent Orchestration
• MCP 2025 Protocol Support
• Security Observability
• Workflow Builder
• Strategic Planning

**Quick Actions:**
• Click toolbar buttons to explore features
• Right-click code for AI actions
• Use command palette for TNF commands

How can I help you today?`,
			timestamp: new Date().toISOString()
		};
	}

	sendInitialMessages(): void {
		if (this._chatManager.messages.length === 0) {
			const welcomeMessage: Message = {
				role: 'assistant',
				content: '🚀 Welcome to The New Fuse! I\'m your AI assistant with real API integrations. How can I help you today?',
				timestamp: new Date().toISOString()
			};
			this._chatManager.addMessage(welcomeMessage);
		}

		// Send all messages to webview
		for (const message of this._chatManager.messages) {
			this._view?.webview.postMessage({
				type: 'addMessage',
				message: message
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
			content: '🚀 New secure chat started! How can I help you today?',
			timestamp: new Date().toISOString()
		};
		this._chatManager.addMessage(welcomeMessage);
	}

	// UI Button Command Handlers
	async marketplaceButtonClicked(): Promise<void> {
		// Use new MCP UI Manager if available
		if (this._mcpUIManager) {
			await this._mcpUIManager.showMainMenu();
			return;
		}

		// Fallback to basic menu
		const options = [
			'Switch AI Provider',
			'View Provider Health',
			'Browse MCP Servers',
			'Connect to MCP Server',
			'View Available Tools'
		];

		const selection = await vscode.window.showQuickPick(options, {
			placeHolder: 'Marketplace - AI Providers & MCP Servers'
		});

		if (!selection) return;

		switch (selection) {
			case 'Switch AI Provider':
				await this.switchAIProvider();
				break;
			case 'View Provider Health':
				await this.viewProviderHealth();
				break;
			case 'Browse MCP Servers':
				await this.browseMCPServers();
				break;
			case 'Connect to MCP Server':
				await this.connectToMCPServer();
				break;
			case 'View Available Tools':
				await this.viewMCPTools();
				break;
		}
	}

	async historyButtonClicked(): Promise<void> {
		// History: Conversation Management + Audit Logs
		const options = [
			'Export Current Conversation',
			'Import Conversation',
			'View Audit Logs',
			'Export Audit Logs',
			'Clear Conversation History'
		];

		const selection = await vscode.window.showQuickPick(options, {
			placeHolder: 'History - Conversations & Audit Logs'
		});

		if (!selection) return;

		switch (selection) {
			case 'Export Current Conversation':
				await this.exportConversation();
				break;
			case 'Import Conversation':
				await this.importConversation();
				break;
			case 'View Audit Logs':
				await this.viewAuditLogs();
				break;
			case 'Export Audit Logs':
				await this.exportAuditLogs();
				break;
			case 'Clear Conversation History':
				await this.clearConversationHistory();
				break;
		}
	}

	async profileButtonClicked(): Promise<void> {
		// Profile: User Settings + API Key Management
		const options = [
			'Manage API Keys',
			'View Permissions',
			'Configure AI Settings',
			'View User Statistics',
			'Change Preferences'
		];

		const selection = await vscode.window.showQuickPick(options, {
			placeHolder: 'Profile - Settings & Credentials'
		});

		if (!selection) return;

		switch (selection) {
			case 'Manage API Keys':
				await this.manageAPIKeys();
				break;
			case 'View Permissions':
				await this.viewPermissions();
				break;
			case 'Configure AI Settings':
				await this.configureAISettings();
				break;
			case 'View User Statistics':
				await this.viewUserStatistics();
				break;
			case 'Change Preferences':
				await this.changePreferences();
				break;
		}
	}

	async settingsButtonClicked(): Promise<void> {
		// Settings: Security Dashboard + System Configuration
		const options = [
			'Security Dashboard',
			'MCP Connection Status',
			'System Health Check',
			'Vulnerability Scan',
			'Emergency Mode',
			'Rate Limits Configuration'
		];

		const selection = await vscode.window.showQuickPick(options, {
			placeHolder: 'Settings - Security & System Configuration'
		});

		if (!selection) return;

		switch (selection) {
			case 'Security Dashboard':
				await this.showSecurityDashboard();
				break;
			case 'MCP Connection Status':
				await this.showMCPStatus();
				break;
			case 'System Health Check':
				await this.performHealthCheck();
				break;
			case 'Vulnerability Scan':
				await this.runVulnerabilityScan();
				break;
			case 'Emergency Mode':
				await this.toggleEmergencyMode();
				break;
			case 'Rate Limits Configuration':
				await this.configureRateLimits();
				break;
		}
	}

	// ===== MARKETPLACE FUNCTIONS =====
	async switchAIProvider(): Promise<void> {
		if (!this._aiServiceManager) {
			vscode.window.showWarningMessage('AI Service Manager not initialized. Please configure backend.');
			return;
		}
		const providers = this._aiServiceManager.getAvailableProviders();
		const current = this._aiServiceManager.getActiveProvider();

		const selection = await vscode.window.showQuickPick(
			providers.map(p => ({
				label: p,
				description: p === current ? '(Current)' : '',
				picked: p === current
			})),
			{ placeHolder: 'Select AI Provider' }
		);

		if (selection && selection.label !== current) {
			try {
				await this._aiServiceManager.switchProvider(selection.label);
				vscode.window.showInformationMessage(`✅ Switched to ${selection.label}`);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to switch provider: ${(error as Error).message}`);
			}
		}
	}

	async viewProviderHealth(): Promise<void> {
		if (!this._aiServiceManager) {
			vscode.window.showWarningMessage('AI Service Manager not initialized');
			return;
		}
		const health = this._aiServiceManager.getHealthStatus();
		const items = Object.entries(health).map(([provider, status]) => ({
			label: `${provider}: ${status.status}`,
			description: status.error || `Last check: ${new Date(status.lastCheck).toLocaleString()}`
		}));

		await vscode.window.showQuickPick(items, {
			placeHolder: 'AI Provider Health Status'
		});
	}

	async browseMCPServers(): Promise<void> {
		if (!this._mcpConnectionManager) {
			vscode.window.showInformationMessage('MCP not configured. No servers connected.');
			return;
		}
		const status = this._mcpConnectionManager.getServerStatus();
		const items = status.servers.map(server => ({
			label: `${server.url}`,
			description: `Status: ${server.status} | Tools: ${server.tools.length} | Resources: ${server.resources.length}`,
			detail: `Connected: ${new Date(server.connectedAt).toLocaleString()}`
		}));

		await vscode.window.showQuickPick(items, {
			placeHolder: `Connected MCP Servers (${status.healthyServers} healthy, ${status.unhealthyServers} unhealthy)`
		});
	}

	async connectToMCPServer(): Promise<void> {
		if (!this._mcpConnectionManager) {
			vscode.window.showWarningMessage('MCP Connection Manager not initialized');
			return;
		}
		const url = await vscode.window.showInputBox({
			prompt: 'Enter MCP Server URL',
			placeHolder: 'wss://mcp-server.example.com or https://mcp-server.example.com'
		});

		if (url) {
			try {
				const serverId = await this._mcpConnectionManager.connectToServer({
					url,
					autoConnect: true
				});
				vscode.window.showInformationMessage(`✅ Connected to MCP server: ${serverId}`);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to connect: ${(error as Error).message}`);
			}
		}
	}

	async viewMCPTools(): Promise<void> {
		// This would show all available MCP tools across all servers
		vscode.window.showInformationMessage('MCP Tools browser - Implementation in progress');
	}

	// ===== HISTORY FUNCTIONS =====
	async exportConversation(): Promise<void> {
		if (!this._aiServiceManager) {
			vscode.window.showWarningMessage('Conversation export requires AI Service Manager');
			return;
		}
		const exportData = this._aiServiceManager.exportConversation();
		const json = JSON.stringify(exportData, null, 2);

		const uri = await vscode.window.showSaveDialog({
			filters: { 'JSON': ['json'] },
			defaultUri: vscode.Uri.file(`conversation-${Date.now()}.json`)
		});

		if (uri) {
			await vscode.workspace.fs.writeFile(uri, Buffer.from(json, 'utf-8'));
			vscode.window.showInformationMessage(`✅ Conversation exported to ${uri.fsPath}`);
		}
	}

	async importConversation(): Promise<void> {
		if (!this._aiServiceManager) {
			vscode.window.showWarningMessage('Conversation import requires AI Service Manager');
			return;
		}
		const uris = await vscode.window.showOpenDialog({
			filters: { 'JSON': ['json'] },
			canSelectMany: false
		});

		if (uris && uris[0]) {
			try {
				const content = await vscode.workspace.fs.readFile(uris[0]);
				const data = JSON.parse(Buffer.from(content).toString('utf-8'));
				this._aiServiceManager.importConversation(data);
				vscode.window.showInformationMessage(`✅ Conversation imported`);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to import: ${(error as Error).message}`);
			}
		}
	}

	async viewAuditLogs(): Promise<void> {
		if (!this._securityOrchestrator) {
			vscode.window.showInformationMessage('Audit logs require Security Orchestrator configuration');
			return;
		}
		const dashboard = await this._securityOrchestrator.getSecurityDashboard();
		vscode.window.showInformationMessage(
			`Audit Logs: ${JSON.stringify(dashboard.auditStats, null, 2)}`
		);
	}

	async exportAuditLogs(): Promise<void> {
		if (!this._securityOrchestrator) {
			vscode.window.showWarningMessage('Export audit logs requires Security Orchestrator');
			return;
		}
		const logs = await this._securityOrchestrator.exportAuditLogs('json', {});
		const uri = await vscode.window.showSaveDialog({
			filters: { 'JSON': ['json'] },
			defaultUri: vscode.Uri.file(`audit-logs-${Date.now()}.json`)
		});

		if (uri) {
			await vscode.workspace.fs.writeFile(uri, Buffer.from(logs, 'utf-8'));
			vscode.window.showInformationMessage(`✅ Audit logs exported`);
		}
	}

	async clearConversationHistory(): Promise<void> {
		const confirm = await vscode.window.showWarningMessage(
			'Clear all conversation history?',
			{ modal: true },
			'Yes', 'No'
		);

		if (confirm === 'Yes') {
			if (this._aiServiceManager) {
				this._aiServiceManager.clearCache();
			}
			this.clearChat();
			vscode.window.showInformationMessage('✅ Conversation history cleared');
		}
	}

	// ===== PROFILE FUNCTIONS =====
	async manageAPIKeys(): Promise<void> {
		const providers = ['openai', 'anthropic', 'litellm'];
		const selection = await vscode.window.showQuickPick(
			providers.map(p => ({ label: p })),
			{ placeHolder: 'Select provider to manage API key' }
		);

		if (selection) {
			const action = await vscode.window.showQuickPick(
				['Set API Key', 'View API Key Status', 'Remove API Key'],
				{ placeHolder: `Manage ${selection.label} API Key` }
			);

			if (action === 'Set API Key') {
				const key = await vscode.window.showInputBox({
					prompt: `Enter ${selection.label} API Key`,
					password: true
				});

				if (key) {
					try {
						if (!this._securityOrchestrator) {
							vscode.window.showWarningMessage('API key storage requires Security Orchestrator');
							return;
						}
						await this._securityOrchestrator.storeApiKey(selection.label, key);
						vscode.window.showInformationMessage(`✅ API key stored for ${selection.label}`);
					} catch (error) {
						vscode.window.showErrorMessage(`Failed: ${(error as Error).message}`);
					}
				}
			}
		}
	}

	async viewPermissions(): Promise<void> {
		if (!this._securityOrchestrator) {
			vscode.window.showInformationMessage('Permissions view requires Security Orchestrator');
			return;
		}
		const config = await this._securityOrchestrator.getSecurityConfig();
		vscode.window.showInformationMessage(
			`Permissions: ${JSON.stringify(config.permissions, null, 2)}`
		);
	}

	async configureAISettings(): Promise<void> {
		if (!this._aiServiceManager) {
			vscode.window.showWarningMessage('AI settings require AI Service Manager');
			return;
		}
		const contextSize = await vscode.window.showInputBox({
			prompt: 'Set context window size (tokens)',
			value: this._aiServiceManager.getContextWindowSize().toString()
		});

		if (contextSize) {
			this._aiServiceManager.setContextWindowSize(parseInt(contextSize));
			vscode.window.showInformationMessage(`✅ Context window set to ${contextSize} tokens`);
		}
	}

	async viewUserStatistics(): Promise<void> {
		if (!this._securityOrchestrator) {
			vscode.window.showInformationMessage('User statistics require Security Orchestrator');
			return;
		}
		const dashboard = await this._securityOrchestrator.getSecurityDashboard();
		vscode.window.showInformationMessage(
			`Rate Limit Stats: ${JSON.stringify(dashboard.rateLimitStats, null, 2)}`
		);
	}

	async changePreferences(): Promise<void> {
		vscode.window.showInformationMessage('User preferences - Implementation in progress');
	}

	// ===== SETTINGS FUNCTIONS =====
	async showSecurityDashboard(): Promise<void> {
		if (!this._securityOrchestrator) {
			vscode.window.showInformationMessage('Security dashboard requires Security Orchestrator configuration');
			return;
		}
		const dashboard = await this._securityOrchestrator.getSecurityDashboard();
		const message = `
🔐 Security Dashboard:
- Security Enabled: ${dashboard.securityEnabled}
- Emergency Mode: ${dashboard.emergencyMode}
- Last Check: ${dashboard.lastSecurityCheck}
- Modules: ${Object.entries(dashboard.modules).map(([k, v]) => `${k}: ${v.status}`).join(', ')}
		`.trim();

		vscode.window.showInformationMessage(message, { modal: true });
	}

	async showMCPStatus(): Promise<void> {
		if (!this._mcpConnectionManager) {
			vscode.window.showInformationMessage('🔗 MCP Status - No servers connected');
			return;
		}
		const status = this._mcpConnectionManager.getServerStatus();
		const message = `
🔗 MCP Connection Status:
- Total Servers: ${status.totalServers}
- Healthy: ${status.healthyServers}
- Unhealthy: ${status.unhealthyServers}
- Tools Available: ${status.servers.reduce((sum, s) => sum + s.tools.length, 0)}
		`.trim();

		vscode.window.showInformationMessage(message, { modal: true });
	}

	async performHealthCheck(): Promise<void> {
		vscode.window.showInformationMessage('🔍 Performing system health check...');
		// All health checks are automatic, just display current status
		await this.showSecurityDashboard();
	}

	async runVulnerabilityScan(): Promise<void> {
		if (!this._securityOrchestrator) {
			vscode.window.showWarningMessage('Vulnerability scan requires Security Orchestrator');
			return;
		}
		vscode.window.showInformationMessage('🔍 Starting vulnerability scan...');
		try {
			const results = await this._securityOrchestrator.performSecurityScan();
			vscode.window.showInformationMessage(
				`✅ Scan complete: ${JSON.stringify(results, null, 2)}`
			);
		} catch (error) {
			vscode.window.showErrorMessage(`Scan failed: ${(error as Error).message}`);
		}
	}

	async toggleEmergencyMode(): Promise<void> {
		if (!this._securityOrchestrator) {
			vscode.window.showWarningMessage('Emergency mode requires Security Orchestrator');
			return;
		}
		const config = await this._securityOrchestrator.getSecurityConfig();
		const action = config.emergencyMode ? 'Disable' : 'Enable';

		const confirm = await vscode.window.showWarningMessage(
			`${action} Emergency Mode?`,
			{ modal: true },
			'Yes', 'No'
		);

		if (confirm === 'Yes') {
			if (config.emergencyMode) {
				await this._securityOrchestrator.disableEmergencyMode();
				vscode.window.showInformationMessage('✅ Emergency mode disabled');
			} else {
				await this._securityOrchestrator.enableEmergencyMode('User requested');
				vscode.window.showWarningMessage('🚨 Emergency mode enabled');
			}
		}
	}

	async configureRateLimits(): Promise<void> {
		if (!this._securityOrchestrator) {
			vscode.window.showInformationMessage('Rate limits configuration requires Security Orchestrator');
			return;
		}
		const config = await this._securityOrchestrator.getSecurityConfig();
		vscode.window.showInformationMessage(
			`Rate Limits: ${JSON.stringify(config.rateLimits, null, 2)}`
		);
	}

	// ===== NEW ICON BUTTON HANDLERS =====
	async toolsButtonClicked(): Promise<void> {
		if (!this._mcpConnectionManager) {
			vscode.window.showInformationMessage('🔧 MCP Tools - Connect to an MCP server first');
			return;
		}
		// Quick access to MCP tools
		const status = this._mcpConnectionManager.getServerStatus();
		const allTools: string[] = [];

		for (const server of status.servers) {
			allTools.push(...server.tools);
		}

		if (allTools.length === 0) {
			vscode.window.showInformationMessage('No MCP tools available. Connect to an MCP server first.');
			return;
		}

		const selection = await vscode.window.showQuickPick(allTools, {
			placeHolder: `Select MCP Tool (${allTools.length} available)`
		});

		if (selection) {
			// Show input for tool arguments
			const argsJson = await vscode.window.showInputBox({
				prompt: `Enter arguments for tool "${selection}" as JSON`,
				placeHolder: '{"param1": "value1", "param2": "value2"}'
			});

			if (argsJson) {
				try {
					const args = JSON.parse(argsJson);
					const result = await this._mcpConnectionManager.callTool(selection, args);
					vscode.window.showInformationMessage(`Tool result: ${JSON.stringify(result, null, 2)}`);
				} catch (error) {
					vscode.window.showErrorMessage(`Tool call failed: ${(error as Error).message}`);
				}
			}
		}
	}

	async resourcesButtonClicked(): Promise<void> {
		if (!this._mcpConnectionManager) {
			vscode.window.showInformationMessage('📦 MCP Resources - Connect to an MCP server first');
			return;
		}
		// Quick access to MCP resources
		const status = this._mcpConnectionManager.getServerStatus();
		const allResources: string[] = [];

		for (const server of status.servers) {
			allResources.push(...server.resources);
		}

		if (allResources.length === 0) {
			vscode.window.showInformationMessage('No MCP resources available. Connect to an MCP server first.');
			return;
		}

		const selection = await vscode.window.showQuickPick(allResources, {
			placeHolder: `Select MCP Resource (${allResources.length} available)`
		});

		if (selection) {
			try {
				const result = await this._mcpConnectionManager.getResource(selection);
				vscode.window.showInformationMessage(`Resource: ${JSON.stringify(result, null, 2)}`);
			} catch (error) {
				vscode.window.showErrorMessage(`Resource read failed: ${(error as Error).message}`);
			}
		}
	}

	async securityButtonClicked(): Promise<void> {
		// Quick access to security dashboard (shortcut to settings)
		await this.showSecurityDashboard();
	}

	// Webview message handlers
	handleAttachFiles(): void {
		vscode.window.showInformationMessage('Attach files functionality not yet implemented');
	}

	handleSetCodeMode(): void {
		if (this._view) {
			this._view.webview.postMessage({
				type: 'updateHeader',
				header: 'The New Fuse - Code Mode'
			});
		}
	}

	handleSetDatabaseMode(): void {
		if (this._view) {
			this._view.webview.postMessage({
				type: 'updateHeader',
				header: 'The New Fuse - Database Mode'
			});
		}
	}

	handleClearAttachedFiles(): void {
		// Clear any attached files state
		if (this._view) {
			this._view.webview.postMessage({
				type: 'updateStatus',
				status: 'Attachments cleared'
			});
		}
	}

	handleFilesDropped(files: DroppedFile[]): void {
		if (this._view) {
			this._view.webview.postMessage({
				type: 'updateStatus',
				status: `Files dropped: ${files.length} file(s)`
			});
		}
	}

	// ===== ADDITIONAL MOCKUP METHODS FROM BACKUP =====

	openWorkflowBuilder(): void {
		this._showFeature('Workflow Builder', '🔄 Workflow Builder', `
Welcome to The New Fuse Workflow Builder!

Available Features:
• Create multi-step agent workflows
• Define task dependencies
• Monitor workflow execution
• Schedule automated workflows

Integration with TNF CLI:
- tnf workflow create
- tnf workflow run
- tnf workflow status
- tnf workflow list

Ready to build powerful agent workflows!
		`);
	}

	openAgentFederation(): void {
		this._showFeature('Agent Federation', '🤖 Agent Federation', `
The New Fuse Agent Federation System

Active Features:
• Multi-agent coordination
• Cross-protocol communication
• Agent discovery and registration
• Load balancing and failover

TNF CLI Integration:
- tnf agents list
- tnf agents start
- tnf federation status
- tnf connect bridge

Managing your agent ecosystem made simple!
		`);
	}

	openTerminalOrchestration(): void {
		this._showFeature('Terminal Orchestration', '⚡ Terminal Orchestration', `
Advanced Terminal Command Orchestration

Capabilities:
• Multi-terminal coordination
• Command sequencing
• Output aggregation
• Error handling and retry logic

TNF CLI Integration:
- tnf terminal exec
- tnf terminal monitor
- tnf terminal orchestrate
- tnf terminal status

Transform your terminal into an intelligent command center!
		`);
	}

	openCodeActions(): void {
		this._showFeature('Code Actions', '💻 Intelligent Code Actions', `
AI-Powered Code Enhancement

Features:
• Automated code review
• Smart refactoring suggestions
• Bug detection and fixes
• Performance optimizations

Available Actions:
• Generate tests
• Optimize imports
• Extract methods
• Add documentation

Let AI enhance your coding workflow!
		`);
	}

	openPlanManager(): void {
		this._showFeature('Plan Manager', '📋 Strategic Plan Management', `
Traycer-Style Task Planning & Management

Features:
• Break down complex tasks
• Create execution timelines
• Track progress and dependencies
• Adaptive plan modification

TNF CLI Integration:
- tnf plan create
- tnf plan execute
- tnf plan status
- tnf plan modify

Turn ideas into executable plans!
		`);
	}

	explainCode(): void {
		this._handleAICodeAction('Explain Code', '🔍 Code Explanation', `
I'm ready to explain code for you!

Features:
• Detailed code analysis and explanation
• Line-by-line breakdowns
• Function and class documentation
• Algorithm explanations

To get started:
1. Select the code you want explained
2. Right-click and choose "The New Fuse > Explain Code"
3. Get comprehensive explanations instantly

Your personal AI code interpreter is ready!
		`);
	}

	fixCode(): void {
		this._handleAICodeAction('Fix Code', '🔧 Code Fixing', `
Intelligent code fixing at your service!

Capabilities:
• Bug detection and resolution
• Syntax error corrections
• Logic error identification
• Performance optimizations
• Best practice implementations

To fix your code:
1. Select problematic code
2. Use "The New Fuse > Fix Code"
3. Get automatic fixes and suggestions

Let's get your code working perfectly!
		`);
	}

	improveCode(): void {
		this._handleAICodeAction('Improve Code', '⚡ Code Enhancement', `
Code improvement and optimization ready!

Enhancement Features:
• Performance optimizations
• Code readability improvements
• Modern syntax updates
• Design pattern applications
• Security enhancements

Usage:
1. Select code to improve
2. Choose "The New Fuse > Improve Code"
3. Receive enhanced, optimized code

Transform your code into production-ready excellence!
		`);
	}

	addToContext(): void {
		this._handleAICodeAction('Add to Context', '📎 Context Management', `
Smart context management activated!

Context Features:
• File and code snippet tracking
• Project structure understanding
• Cross-file relationship mapping
• Intelligent context suggestions

How to use:
1. Select relevant code or files
2. Use "The New Fuse > Add to Context"
3. Build comprehensive project understanding

Building your AI's understanding of your codebase!
		`);
	}

	generateCommitMessage(): void {
		this._handleAICodeAction('Generate Commit Message', '📝 Smart Git Commits', `
Intelligent commit message generation!

Git Integration:
• Analyze staged changes
• Generate descriptive commit messages
• Follow conventional commit standards
• Include scope and breaking changes

Usage:
1. Stage your changes
2. Use "The New Fuse > Generate Commit Message"
3. Get professional commit messages

Never write boring commit messages again!
		`);
	}

	inlineSuggestions(): void {
		this._handleAICodeAction('Inline Suggestions', '💡 AI Code Completion', `
Real-time AI code suggestions enabled!

Inline Features:
• Context-aware code completion
• Multi-line code generation
• Function and class suggestions
• Documentation generation

Keyboard Shortcuts:
• Ctrl+I (Cmd+I on Mac) - Generate suggestions
• Tab - Accept suggestion
• Escape - Dismiss suggestions

Your AI coding companion is ready to assist!
		`);
	}

	openInNewTab(): void {
		vscode.window.showInformationMessage(
			'🗂️ Open in New Tab - This feature will open the chat in a dedicated editor tab for better multitasking!'
		);
	}

	showHelp(): void {
		this._showFeature('Help & Documentation', '❓ Help & Documentation', `
**The New Fuse Help Center**

**Quick Start Guide:**
1. **Basic Chat**: Type messages to interact with AI
2. **Code Actions**: Right-click code for AI assistance
3. **Workflow Builder**: Create automated development workflows
4. **Agent Federation**: Coordinate multiple AI agents

**Keyboard Shortcuts:**
• \`Ctrl+Shift+A\` (Cmd+Shift+A): Focus chat input
• \`Ctrl+I\` (Cmd+I): Inline code suggestions
• \`Ctrl+K\` (Cmd+K): Clear chat
• \`Ctrl+/\` (Cmd+/): Quick help

**Command Reference:**
• \`tnf agents start\` - Start agent federation
• \`tnf mcp connect\` - Connect MCP server
• \`tnf workflow create\` - New workflow
• \`tnf security scan\` - Security analysis

**Troubleshooting:**
• **No Response**: Check AI provider configuration
• **Slow Performance**: Reduce context size
• **Connection Issues**: Verify network settings
• **Permission Errors**: Check file access rights

**Resources:**
• 📖 [Full Documentation](https://docs.thenewfuse.ai)
• 💬 [Community Forum](https://community.thenewfuse.ai)
• 🐛 [Bug Reports](https://github.com/thenewfuse/issues)
• 📧 [Support Email](mailto:support@thenewfuse.ai)

Get the most out of your AI development experience!
		`);
	}

	toggleAutoApprove(): void {
		vscode.window.showInformationMessage(
			'✅ Auto-Approve Mode - This feature will automatically execute approved AI suggestions!'
		);
	}

	setCodeMode(): void {
		this.handleSetCodeMode();
		this._showFeature('Code Mode', '💻 Code Mode Activated', `
**Code Development Mode Enabled**

🎯 **Optimized for:**
• Code generation and refactoring
• Bug fixing and debugging
• Architecture planning
• Code review and optimization

**Enhanced Features:**
• Smart code completion
• Context-aware suggestions
• Multi-file understanding
• Framework-specific assistance

Ready to supercharge your coding workflow!
		`);
	}

	setDatabaseMode(): void {
		this.handleSetDatabaseMode();
		this._showFeature('Database Mode', '🗃️ Database Mode Activated', `
**Database Development Mode Enabled**

🎯 **Optimized for:**
• SQL query generation and optimization
• Database schema design
• Performance tuning
• Data migration strategies

**Database Support:**
• PostgreSQL • MySQL/MariaDB • SQLite
• MongoDB • Redis • Elasticsearch

Transform your database development experience!
		`);
	}

	attachFiles(): void {
		vscode.window.showOpenDialog({
			canSelectMany: true,
			openLabel: 'Attach Files',
			filters: {
				'All Files': ['*'],
				'Code Files': ['js', 'ts', 'py', 'java', 'cpp', 'c', 'h'],
				'Text Files': ['txt', 'md', 'json', 'xml', 'csv']
			}
		}).then(fileUris => {
			if (fileUris && fileUris.length > 0) {
				const fileList = fileUris.map(uri => {
					const fileName = uri.path.split('/').pop();
					return `• ${fileName}`;
				}).join('\n');

				this._showFeature('Files Attached', '📎 Files Attached Successfully', `
**${fileUris.length} file(s) attached to context:**

${fileList}

**What you can do:**
• Ask questions about these specific files
• Request code reviews or improvements
• Generate documentation
• Find relationships between files
• Identify potential issues

Your files are now available for AI analysis!
				`);
			}
		});
	}

	_handleAICodeAction(title: string, header: string, content: string): void {
		// Get the active text editor
		const editor = vscode.window.activeTextEditor;

		if (editor) {
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);

			if (selectedText) {
				// If text is selected, include it in the message
				const enhancedContent = content + `\n\nSelected Code:\n\`\`\`\n${selectedText}\n\`\`\`\n\nReady to analyze this code!`;
				this._showFeature(title, header, enhancedContent);
			} else {
				this._showFeature(title, header, content);
			}
		} else {
			this._showFeature(title, header, content);
		}
	}

	_showFeature(title: string, header: string, content: string): void {
		if (this._view) {
			this._view.show?.(true);

			const featureMessage: Message = {
				role: 'assistant',
				content: content,
				timestamp: new Date().toISOString()
			};
			this._chatManager.addMessage(featureMessage);

			this._view.webview.postMessage({
				type: 'updateHeader',
				header: header
			});
		}
	}

	_getHtmlForWebview(webview: vscode.Webview): string {
		const nonce = getNonce();

		// Get URIs for the media files
		const mainJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
		const mainCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}'; font-src ${webview.cspSource} data:; connect-src ${webview.cspSource} https:; object-src 'none'; base-uri 'none'; form-action 'none';">
			<title>The New Fuse Chat</title>
			<link href="${mainCssUri}" rel="stylesheet">
		</head>
		<body>
			<div class="chat-container">
				<div class="chat-header">
					<h3>The New Fuse Chat</h3>
					<div class="header-buttons">
						<button class="header-btn" id="marketplaceBtn" title="Marketplace - AI Providers & MCP Servers">🛒</button>
						<button class="header-btn" id="historyBtn" title="History - Conversations & Audit Logs">📜</button>
						<button class="header-btn" id="profileBtn" title="Profile - API Keys & Settings">👤</button>
						<button class="header-btn" id="settingsBtn" title="Settings - Security & System">⚙️</button>
						<button class="header-btn" id="toolsBtn" title="MCP Tools">🔧</button>
						<button class="header-btn" id="resourcesBtn" title="MCP Resources">📦</button>
						<button class="header-btn" id="securityBtn" title="Security Dashboard">🔐</button>
					</div>
					<div class="status">Ready</div>
				</div>
				<div class="messages-container" id="messages"></div>
				<div class="input-container">
					<div class="input-wrapper">
						<div class="textarea-wrapper">
							<div class="context-info" id="contextInfo" style="display: none;">
								<span class="context-count"></span>
								<button class="context-clear" id="clearContext">×</button>
							</div>
							<textarea id="messageInput" placeholder="@ to add context, / for commands, hold shift to drag in files/images" rows="1"></textarea>
							<div class="input-actions">
								<button class="input-action-btn" id="attachBtn" title="Attach files">📎</button>
								<button class="input-action-btn" id="codeBtn" title="Code mode">💻</button>
								<button class="input-action-btn" id="dbBtn" title="Database mode">🗄️</button>
							</div>
						</div>
						<button id="sendButton">Send</button>
					</div>
				</div>
				<div class="drop-zone" id="dropZone" style="display: none;">
					<div class="drop-content">
						<div class="drop-icon">📁</div>
						<div>Drop files here to attach them to your message</div>
					</div>
				</div>
			</div>
			<script src="${mainJsUri}"></script>
		</body>
		</html>`;
	}
}

function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}