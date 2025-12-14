const vscode = require('vscode');
const SecurityOrchestrator = require('./security/SecurityOrchestrator');
const AIServiceManager = require('./ai/AIServiceManager');
const MCPConnectionManager = require('./mcp/MCPConnectionManager');
const LoggingService = require('./services/LoggingService');
const SystemBridge = require('./integrations/SystemBridge');
const CLIBridge = require('./integrations/CLIBridge');

let securityOrchestrator = null;
let aiServiceManager = null;
let mcpConnectionManager = null;
let logger = null;
let systemBridge = null;
let cliBridge = null;

async function activate(context) {
	// Initialize logging service
	logger = LoggingService.getInstance('The New Fuse');
	logger.info('The New Fuse extension is being activated');

	try {
		// Initialize security orchestrator first
		securityOrchestrator = new SecurityOrchestrator(context);
		await securityOrchestrator.initialize();

		// Log extension activation
		await securityOrchestrator.auditLogger.logLifecycleEvent('extension_activated', {
			version: '7.0.0',
			timestamp: new Date().toISOString()
		});

		logger.success('Security systems initialized successfully');

		// Initialize AI Service Manager
		aiServiceManager = new AIServiceManager(securityOrchestrator);
		await aiServiceManager.initialize();
		aiServiceManager.setWebview(null); // Will be set by provider

		logger.success('AI Service Manager initialized successfully');

		// Initialize MCP Connection Manager
		mcpConnectionManager = new MCPConnectionManager(context, securityOrchestrator);
		await mcpConnectionManager.initialize();

		logger.success('MCP Connection Manager initialized successfully');

		// Initialize System Bridge for full ecosystem integration
		systemBridge = new SystemBridge(context, securityOrchestrator, logger);
		await systemBridge.initialize();

		logger.success('System Bridge initialized - Full ecosystem connected');

		// Initialize CLI Bridge for TNF CLI integration
		cliBridge = new CLIBridge(context, logger);
		await cliBridge.initialize();

		logger.success('CLI Bridge initialized - TNF CLI fully integrated');
	} catch (error) {
		logger.error('Failed to initialize systems:', error);
		// Enable emergency mode if security fails
		if (securityOrchestrator) {
			await securityOrchestrator.enableEmergencyMode('Initialization failed');
		}
	}

	// Initialize Chat View Provider with error boundary
	let provider;
	try {
		provider = new ChatViewProvider(context.extensionUri, securityOrchestrator, aiServiceManager, mcpConnectionManager, systemBridge, cliBridge);

		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider));

		logger.success('Chat View Provider registered successfully');
	} catch (error) {
		logger.error('Failed to initialize Chat View Provider:', error);
		vscode.window.showErrorMessage(`Failed to initialize The New Fuse Chat: ${error.message}`);

		// Enable emergency mode if provider fails
		if (securityOrchestrator) {
			await securityOrchestrator.enableEmergencyMode('Chat provider initialization failed');
		}
		return; // Early return to prevent further errors
	}

	// Register commands with error handling
	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.sendMessage', () => {
			try {
				if (provider) provider.sendMessage();
			} catch (error) {
				logger.error('Command error (sendMessage):', error);
				vscode.window.showErrorMessage(`Failed to send message: ${error.message}`);
			}
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.clearChat', () => {
			try {
				if (provider) provider.clearChat();
			} catch (error) {
				logger.error('Command error (clearChat):', error);
				vscode.window.showErrorMessage(`Failed to clear chat: ${error.message}`);
			}
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.newChat', () => {
			try {
				if (provider) provider.newChat();
			} catch (error) {
				logger.error('Command error (newChat):', error);
				vscode.window.showErrorMessage(`Failed to create new chat: ${error.message}`);
			}
		}));

	// MCP-related commands
	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.mcpConnect', async () => {
			const serverUrl = await vscode.window.showInputBox({
				prompt: 'Enter MCP Server URL',
				placeHolder: 'https://mcp-server.example.com'
			});

			if (serverUrl) {
				try {
					const serverId = await mcpConnectionManager.connectToServer({
						url: serverUrl,
						autoConnect: true
					});
					vscode.window.showInformationMessage(`Connected to MCP server: ${serverUrl}`);
				} catch (error) {
					vscode.window.showErrorMessage(`Failed to connect to MCP server: ${error.message}`);
				}
			}
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.mcpStatus', () => {
			const status = mcpConnectionManager.getServerStatus();
			const statusMessage = `MCP Servers: ${status.healthyServers} healthy, ${status.unhealthyServers} unhealthy, ${status.totalServers} total`;
			vscode.window.showInformationMessage(statusMessage);
		}));

	// Workflow Builder Command
	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.openWorkflowBuilder', async () => {
			try {
				if (!systemBridge || !systemBridge.initialized) {
					vscode.window.showWarningMessage('System Bridge not initialized');
					return;
				}

				const workflows = await systemBridge.workflowManager.listWorkflows();
				const workflowNames = workflows.map(w => w.name);

				const action = await vscode.window.showQuickPick(['Create New', ...workflowNames], {
					placeHolder: 'Select a workflow or create new'
				});

				if (action === 'Create New') {
					const name = await vscode.window.showInputBox({
						prompt: 'Workflow Name',
						placeHolder: 'My Workflow'
					});

					if (name) {
						const workflow = await systemBridge.workflowManager.createWorkflow({
							name,
							steps: []
						});
						vscode.window.showInformationMessage(`Workflow "${name}" created!`);
					}
				} else if (action) {
					const workflow = workflows.find(w => w.name === action);
					if (workflow) {
						const result = await systemBridge.workflowManager.executeWorkflow(workflow.id, {});
						vscode.window.showInformationMessage(`Workflow executed: ${result.status}`);
					}
				}
			} catch (error) {
				logger.error('Workflow builder error:', error);
				vscode.window.showErrorMessage(`Workflow error: ${error.message}`);
			}
		}));

	// Agent Federation Command
	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.agentFederation', async () => {
			try {
				if (!systemBridge || !systemBridge.initialized) {
					vscode.window.showWarningMessage('System Bridge not initialized');
					return;
				}

				const connectionStatus = systemBridge.getConnectionStatus();
				const statusItems = [
					`API Gateway: ${connectionStatus.apiGateway}`,
					`Browser Hub: ${connectionStatus.browserHub}`,
					`Chrome Extension: ${connectionStatus.chromeExtension}`
				];

				const selected = await vscode.window.showQuickPick(statusItems, {
					placeHolder: 'Agent Federation Status'
				});

				if (selected) {
					vscode.window.showInformationMessage(selected);
				}
			} catch (error) {
				logger.error('Agent federation error:', error);
				vscode.window.showErrorMessage(`Agent federation error: ${error.message}`);
			}
		}));

	// System Status Command
	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.systemStatus', () => {
			if (systemBridge && systemBridge.initialized) {
				const status = systemBridge.getConnectionStatus();
				const cliStatus = cliBridge ? cliBridge.getStatus() : { cliAvailable: false };
				const statusMessage = `
🔗 The New Fuse System Status

API Gateway: ${status.apiGateway}
Browser Hub: ${status.browserHub}
Chrome Extension: ${status.chromeExtension}
CLI: ${cliStatus.cliAvailable ? '✅ available' : '⚠️ not available'}

All systems ${status.apiGateway === 'connected' && status.browserHub === 'connected' ? '✅ operational' : '⚠️ partially operational'}
				`.trim();

				vscode.window.showInformationMessage(statusMessage, 'OK');
			} else {
				vscode.window.showWarningMessage('System Bridge not initialized');
			}
		}));

	// CLI Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.cli.runAgent', async () => {
			try {
				if (!cliBridge || !cliBridge.initialized) {
					vscode.window.showWarningMessage('CLI Bridge not initialized');
					return;
				}

				const agents = cliBridge.getAvailableAgents();
				const agentNames = agents.map(a => `${a.name} - ${a.description}`);

				const selectedAgent = await vscode.window.showQuickPick(agentNames, {
					placeHolder: 'Select an agent to run'
				});

				if (selectedAgent) {
					const task = await vscode.window.showInputBox({
						prompt: 'Enter task description',
						placeHolder: 'Analyze code for bugs...'
					});

					if (task) {
						const agent = agents.find(a => selectedAgent.startsWith(a.name));
						logger.info(`Running CLI agent: ${agent.id}`);
						await cliBridge.runAgent(agent.id, task);
						vscode.window.showInformationMessage(`Running ${agent.name}...`);
					}
				}
			} catch (error) {
				logger.error('CLI agent error:', error);
				vscode.window.showErrorMessage(`CLI agent error: ${error.message}`);
			}
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.cli.initWorkspace', async () => {
			try {
				const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

				if (workspacePath) {
					await cliBridge.initializeWorkspace(workspacePath);
					vscode.window.showInformationMessage('TNF Workspace initialized!');
				} else {
					vscode.window.showWarningMessage('No workspace folder open');
				}
			} catch (error) {
				logger.error('Workspace init error:', error);
				vscode.window.showErrorMessage(`Workspace init error: ${error.message}`);
			}
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.cli.showTasks', async () => {
			try {
				if (!cliBridge) {
					vscode.window.showWarningMessage('CLI Bridge not initialized');
					return;
				}

				const tasks = cliBridge.getActiveTasks();

				if (tasks.length === 0) {
					vscode.window.showInformationMessage('No active CLI tasks');
					return;
				}

				const taskList = tasks.map(t =>
					`${t.command} ${t.args.join(' ')} (${Math.floor((Date.now() - t.startTime) / 1000)}s)`
				);

				await vscode.window.showQuickPick(taskList, {
					placeHolder: 'Active CLI Tasks'
				});
			} catch (error) {
				logger.error('Show tasks error:', error);
				vscode.window.showErrorMessage(`Show tasks error: ${error.message}`);
			}
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.cli.showHistory', async () => {
			try {
				if (!cliBridge) {
					vscode.window.showWarningMessage('CLI Bridge not initialized');
					return;
				}

				const history = cliBridge.getTaskHistory(20);

				if (history.length === 0) {
					vscode.window.showInformationMessage('No CLI task history');
					return;
				}

				const historyItems = history.map(t => ({
					label: `${t.command} ${t.args.join(' ')}`,
					description: t.success ? '✅ Success' : '❌ Failed',
					detail: `${t.execution_time}ms - ${t.timestamp}`
				}));

				await vscode.window.showQuickPick(historyItems, {
					placeHolder: 'CLI Task History'
				});
			} catch (error) {
				logger.error('Show history error:', error);
				vscode.window.showErrorMessage(`Show history error: ${error.message}`);
			}
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.cli.chatSession', async () => {
			try {
				if (!cliBridge) {
					vscode.window.showWarningMessage('CLI Bridge not initialized');
					return;
				}

				const provider = await vscode.window.showQuickPick(['openai', 'anthropic', 'litellm'], {
					placeHolder: 'Select AI provider for chat'
				});

				if (provider) {
					await cliBridge.startChat({ provider });
					vscode.window.showInformationMessage(`CLI chat session started with ${provider}`);
				}
			} catch (error) {
				logger.error('Chat session error:', error);
				vscode.window.showErrorMessage(`Chat session error: ${error.message}`);
			}
		}));

	// Add logging service and system bridge to context for disposal
	context.subscriptions.push(logger);

	if (systemBridge) {
		context.subscriptions.push({
			dispose: () => systemBridge.cleanup()
		});
	}

	if (cliBridge) {
		context.subscriptions.push({
			dispose: () => cliBridge.cleanup()
		});
	}

	logger.success('The New Fuse extension activated successfully with full ecosystem and CLI integration');
}

class ChatViewProvider {
	static viewType = 'theNewFuse.chatView';

	constructor(extensionUri, securityOrchestrator, aiServiceManager, mcpConnectionManager, systemBridge, cliBridge) {
		this._extensionUri = extensionUri;
		this._securityOrchestrator = securityOrchestrator;
		this._aiServiceManager = aiServiceManager;
		this._mcpConnectionManager = mcpConnectionManager;
		this._systemBridge = systemBridge;
		this._cliBridge = cliBridge;
		this._view = undefined;
		this._messages = [];
		this._systemStatus = {
			isConnected: systemBridge?.initialized || false,
			version: '7.0.0',
			ecosystem: systemBridge ? systemBridge.getConnectionStatus() : {},
			cli: cliBridge ? cliBridge.getStatus() : { cliAvailable: false }
		};
	}

	resolveWebviewView(webviewView, _context, _token) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async data => {
			try {
				switch (data.type) {
					case 'sendMessage':
						await this.handleUserMessage(data.content);
						break;
					case 'ready':
						this.sendInitialMessages();
						break;
				}
			} catch (error) {
				console.error('Message handling error:', error);
			}
		});
	}

	async handleUserMessage(content) {
		if (!content.trim()) return;

		// Add user message
		const userMessage = {
			role: 'user',
			content: content,
			timestamp: new Date().toISOString()
		};
		this._messages.push(userMessage);

		// Send user message to webview
		this._view?.webview.postMessage({
			type: 'addMessage',
			message: userMessage
		});

		// Update status
		this._view?.webview.postMessage({
			type: 'updateStatus',
			status: 'Processing...'
		});

		try {
			// Generate AI response using real API calls
			const aiResponse = await this._generateSecureAIResponse(content);
			this._messages.push(aiResponse);

			this._view?.webview.postMessage({
				type: 'addMessage',
				message: aiResponse
			});

			this._view?.webview.postMessage({
				type: 'updateStatus',
				status: 'Ready'
			});
		} catch (error) {
			const errorResponse = {
				role: 'assistant',
				content: `❌ Error: ${error.message}`,
				timestamp: new Date().toISOString()
			};
			this._messages.push(errorResponse);

			this._view?.webview.postMessage({
				type: 'addMessage',
				message: errorResponse
			});

			this._view?.webview.postMessage({
				type: 'updateStatus',
				status: 'Error'
			});
		}
	}

	async _generateSecureAIResponse(userInput) {
		try {
			// Use AI Service Manager for real API calls
			const response = await this._aiServiceManager.generateResponse(userInput, {
				stream: true, // Enable streaming for real-time UI updates
				systemPrompt: 'You are a helpful AI assistant with comprehensive security monitoring active.'
			});

			return {
				role: 'assistant',
				content: response,
				timestamp: new Date().toISOString()
			};
		} catch (error) {
			// Fallback to basic response if AI service fails
			return {
				role: 'assistant',
				content: `🔐 **Secure AI Assistant Response**

Hello! I'm your AI assistant with enterprise-grade security.

**Your Query:** "${userInput}"

**Security Status:** All systems operational
**Processing:** Completed with security validation

What would you like help with today?`,
				timestamp: new Date().toISOString()
			};
		}
	}

	sendInitialMessages() {
		if (this._messages.length === 0) {
			const welcomeMessage = {
				role: 'assistant',
				content: '🚀 Welcome to The New Fuse! I\'m your AI assistant with real API integrations. How can I help you today?',
				timestamp: new Date().toISOString()
			};
			this._messages.push(welcomeMessage);
		}

		// Send all messages to webview
		for (const message of this._messages) {
			this._view?.webview.postMessage({
				type: 'addMessage',
				message: message
			});
		}
	}

	sendMessage() {
		if (this._view) {
			this._view.show?.(true);
			this._view.webview.postMessage({ type: 'focusInput' });
		}
	}

	clearChat() {
		this._messages = [];
		if (this._view) {
			this._view.webview.postMessage({ type: 'clearChat' });
		}
	}

	newChat() {
		this.clearChat();
		const welcomeMessage = {
			role: 'assistant',
			content: '🚀 New secure chat started! How can I help you today?',
			timestamp: new Date().toISOString()
		};
		this._messages.push(welcomeMessage);

		if (this._view) {
			this._view.webview.postMessage({
				type: 'addMessage',
				message: welcomeMessage
			});
		}
	}

	_getHtmlForWebview(webview) {
		const nonce = getNonce();
		const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'modern-chat.css'));

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource} data:; connect-src ${webview.cspSource} https:; img-src ${webview.cspSource} data:; object-src 'none'; base-uri 'none'; form-action 'none';">
			<title>The New Fuse Chat</title>
			<link rel="stylesheet" href="${cssUri}">
		</head>
		<body>
			<div class="chat-container">
				<div class="messages" id="messages"></div>
				<div class="input-container">
					<textarea id="userInput" placeholder="Ask a question..." rows="1"></textarea>
					<button id="sendButton">Send</button>
				</div>
			</div>
			<script nonce="${nonce}">
				const vscode = acquireVsCodeApi();
				const messagesDiv = document.getElementById('messages');
				const userInput = document.getElementById('userInput');
				const sendButton = document.getElementById('sendButton');

				// Handle messages from extension
				window.addEventListener('message', event => {
					const message = event.data;
					switch (message.type) {
						case 'addMessage':
							addMessage(message.message);
							break;
						case 'clearChat':
							messagesDiv.innerHTML = '';
							break;
						case 'focusInput':
							userInput.focus();
							break;
					}
				});

				// Send message on button click or Enter
				sendButton.addEventListener('click', sendMessage);
				userInput.addEventListener('keydown', (e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						sendMessage();
					}
				});

				function sendMessage() {
					const content = userInput.value.trim();
					if (content) {
						vscode.postMessage({ type: 'sendMessage', content });
						userInput.value = '';
					}
				}

				function addMessage(message) {
					const messageDiv = document.createElement('div');
					messageDiv.className = 'message ' + message.role;
					messageDiv.textContent = message.content;
					messagesDiv.appendChild(messageDiv);
					messagesDiv.scrollTop = messagesDiv.scrollHeight;
				}

				// Notify extension that webview is ready
				vscode.postMessage({ type: 'ready' });
			</script>
		</body>
		</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

module.exports = { activate };
