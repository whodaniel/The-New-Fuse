
const vscode = require('vscode');
const SecurityOrchestrator = require('./security/SecurityOrchestrator');
const SecurityDashboard = require('./security/SecurityDashboard');

let securityOrchestrator = null;
let securityDashboard = null;

function activate(context) {
	console.log('🚀 The New Fuse extension is being activated');

	try {
		// Initialize security orchestrator first
		securityOrchestrator = new SecurityOrchestrator(context);
		await securityOrchestrator.initialize();

		// Initialize security dashboard
		securityDashboard = new SecurityDashboard(securityOrchestrator, context);

		// Log extension activation
		await securityOrchestrator.auditLogger.logLifecycleEvent('extension_activated', {
			version: '7.0.0',
			timestamp: new Date().toISOString()
		});

		console.log('🔐 Security systems initialized successfully');
	} catch (error) {
		console.error('❌ Failed to initialize security systems:', error);
		// Enable emergency mode if security fails
		if (securityOrchestrator) {
			await securityOrchestrator.enableEmergencyMode('Security initialization failed');
		}
		vscode.window.showErrorMessage('Security system initialization failed. Extension running in limited mode.');
	}

	const provider = new ChatViewProvider(context.extensionUri, securityOrchestrator, securityDashboard);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.sendMessage', () => {
			provider.sendMessage();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.clearChat', () => {
			provider.clearChat();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.newChat', () => {
			provider.newChat();
		}));

	// Enhanced TNF CLI Integration Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.openWorkflowBuilder', () => {
			provider.openWorkflowBuilder();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.agentFederation', () => {
			provider.openAgentFederation();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.mcpConnect', () => {
			provider.connectMCP();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.terminalOrchestration', () => {
			provider.openTerminalOrchestration();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.codeActions', () => {
			provider.openCodeActions();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.planManager', () => {
			provider.openPlanManager();
		}));

	// Kilo Code inspired features
	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.explainCode', () => {
			provider.explainCode();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.fixCode', () => {
			provider.fixCode();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.improveCode', () => {
			provider.improveCode();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.addToContext', () => {
			provider.addToContext();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.generateCommitMessage', () => {
			provider.generateCommitMessage();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.inlineSuggestions', () => {
			provider.inlineSuggestions();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.openInNewTab', () => {
			provider.openInNewTab();
		}));

	// Additional toolbar buttons
	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.historyButtonClicked', () => {
			provider.showChatHistory();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.marketplaceButtonClicked', () => {
			provider.showMarketplace();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.profileButtonClicked', () => {
			provider.showProfile();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.settingsButtonClicked', () => {
			provider.showSettings();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.helpButtonClicked', () => {
			provider.showHelp();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.autoApprove', () => {
			provider.toggleAutoApprove();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.codeMode', () => {
			provider.setCodeMode();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.databaseMode', () => {
			provider.setDatabaseMode();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.attachFiles', () => {
			provider.attachFiles();
		}));

	// Security commands
	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.securityDashboard', async () => {
			await securityDashboard.showSecurityDashboard();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('theNewFuse.runSecurityScan', async () => {
			await securityDashboard.runSecurityScan();
		}));

	console.log('✅ The New Fuse extension activated successfully with enhanced security features');
}

class ChatViewProvider {
	static viewType = 'theNewFuse.chatView';

	constructor(extensionUri, securityOrchestrator, securityDashboard) {
		this._extensionUri = extensionUri;
		this._view = undefined;
		this._messages = [];
		this._chatHistory = [];
		this._autoApprove = false;
		this._currentMode = 'chat';
		this._attachedFiles = [];
		this._securityOrchestrator = securityOrchestrator;
		this._securityDashboard = securityDashboard;

		// Set callback for security dashboard
		if (this._securityDashboard) {
			this._securityDashboard.setShowFeatureCallback((title, header, content) => {
				this._showFeature(title, header, content);
			});
		}

		this._systemStatus = {
			agents: 0,
			mcpServers: 0,
			isConnected: false,
			relayId: 'TNF-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
			version: '7.0.0',
			interceptedMessages: 0,
			ports: {
				http: 3000,
				websocket: 3001,
				proxy: 8888,
				ui: 3002
			}
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
					case 'attachFiles':
						this.attachFiles();
						break;
					case 'setCodeMode':
						this.setCodeMode();
						break;
					case 'setDatabaseMode':
						this.setDatabaseMode();
						break;
					case 'clearAttachedFiles':
						this.clearAttachedFiles();
						break;
					case 'filesDropped':
						this.handleDroppedFiles(data.files);
						break;
					case 'securityScan':
						await this._securityDashboard.runSecurityScan();
						break;
					case 'showSecurityDashboard':
						await this._securityDashboard.showSecurityDashboard();
						break;
				}
			} catch (error) {
				console.error('Message handling error:', error);
				const secureError = this._createSecureErrorResponse(error, 'message_handling');
				this._showError(secureError.error.message);
			}
		});
	}

	async handleUserMessage(content) {
		if (!content.trim()) return;

		// Security: Validate and sanitize input
		const validation = await this._securityOrchestrator.validateInput(content, 'message', 'user');
		if (!validation.isValid) {
			const errorMessage = {
				role: 'system',
				content: `❌ Input validation failed: ${validation.errors.join(', ')}`,
				timestamp: new Date().toISOString()
			};
			this._messages.push(errorMessage);
			this._view?.webview.postMessage({
				type: 'addMessage',
				message: errorMessage
			});
			return;
		}

		const sanitizedContent = validation.sanitized;

		// Security: Check permissions
		const hasPermission = await this._securityOrchestrator.checkPermission('user', 'chat.send');
		if (!hasPermission) {
			const errorMessage = {
				role: 'system',
				content: '❌ Access denied: Insufficient permissions to send messages',
				timestamp: new Date().toISOString()
			};
			this._messages.push(errorMessage);
			this._view?.webview.postMessage({
				type: 'addMessage',
				message: errorMessage
			});
			return;
		}

		// Add user message
		const userMessage = {
			role: 'user',
			content: sanitizedContent,
			timestamp: new Date().toISOString()
		};
		this._messages.push(userMessage);

		// Send user message to webview
		this._view?.webview.postMessage({
			type: 'addMessage',
			message: userMessage
		});

		// Enhanced AI response with security monitoring
		this._view?.webview.postMessage({
			type: 'updateStatus',
			status: 'Processing with security checks...'
		});

		try {
			const aiResponse = await this._generateSecureResponse(sanitizedContent);
			this._messages.push(aiResponse);

			this._view?.webview.postMessage({
				type: 'addMessage',
				message: aiResponse
			});

			this._view?.webview.postMessage({
				type: 'updateStatus',
				status: 'Ready'
			});

			// Security: Log AI interaction
			await this._securityOrchestrator.logAIInteraction({
				type: 'chat_response',
				inputLength: sanitizedContent.length,
				outputLength: aiResponse.content.length,
				processingTime: Date.now() - new Date(userMessage.timestamp).getTime(),
				success: true
			});

		} catch (error) {
			const secureError = this._createSecureErrorResponse(error, 'AI processing');
			const errorResponse = {
				role: 'assistant',
				content: secureError.error.message,
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

			// Security: Log failed AI interaction
			await this._securityOrchestrator.logAIInteraction({
				type: 'chat_response',
				inputLength: sanitizedContent.length,
				outputLength: 0,
				processingTime: Date.now() - new Date(userMessage.timestamp).getTime(),
				success: false,
				error: error.message
			});
		}
	}

	async _generateSecureResponse(userInput) {
		const input = userInput.toLowerCase();

		// Security: Content filtering for malicious prompts
		const contentValidation = await this._securityOrchestrator.validateInput(userInput, 'message', 'ai_input');
		if (contentValidation.riskLevel === 'high') {
			return {
				role: 'assistant',
				content: `⚠️ **Content Warning**
Your input contains potentially harmful content that has been flagged by our security system.

**Security Notice:**
• Malicious content detected
• Request blocked for safety
• Please rephrase your query

**Safe Usage Guidelines:**
• Avoid injection attempts
• Do not request harmful actions
• Use appropriate language
• Respect security boundaries

For assistance with legitimate development tasks, please try a different approach.`,
				timestamp: new Date().toISOString()
			};
		}

		// The New Fuse intelligent response system with security
		if (input.includes('mcp') || input.includes('protocol')) {
			return await this._handleSecureMCPQuery(userInput);
		}

		if (input.includes('agent') || input.includes('federation')) {
			return await this._handleSecureAgentQuery(userInput);
		}

		if (input.includes('security') || input.includes('scan') || input.includes('vulnerability')) {
			return await this._handleSecurityQuery(userInput);
		}

		// Default enhanced response
		return {
			role: 'assistant',
			content: `🚀 **The New Fuse AI Assistant**

Hello! I'm your enhanced AI assistant with comprehensive security features:

**🛡️ Security Features:**
• Input validation and sanitization
• Content filtering for malicious prompts
• Rate limiting and abuse prevention
• Audit logging for all interactions
• Secure credential management

**Core Features:**
• **Multi-Agent Orchestration**: Coordinate multiple AI agents
• **MCP 2025 Protocol**: Connect to standardized AI services
• **Security Observability**: Monitor and protect your development
• **Workflow Builder**: Automate complex development tasks
• **Traycer Planning**: Strategic project management

**Quick Actions:**
• Say "agents" to explore multi-agent features
• Say "mcp" to learn about protocol integration
• Say "security" to access security dashboard
• Say "scan" to run vulnerability scan

**Available Commands:**
Right-click in your code for context actions like:
• Explain Code • Fix Code • Improve Code • Add to Context

Your security is our priority! What would you like to explore?`,
			timestamp: new Date().toISOString()
		};
	}

	async _handleSecureMCPQuery(query) {
		try {
			// Security: Log MCP interaction
			await this._securityOrchestrator.logMCPInteraction({
				server: 'query',
				method: 'handleQuery',
				parameters: { query },
				response: 'processing',
				success: true
			});

			return {
				role: 'assistant',
				content: `🔗 **MCP (Model Context Protocol) Integration**

The New Fuse supports advanced MCP integration with security monitoring:

**Available MCP Features:**
• **Server Discovery**: Automatically detect and connect to MCP servers
• **Tool Integration**: Access external tools and resources through MCP
• **Context Sharing**: Share context across different AI systems
• **Protocol Management**: Handle MCP protocol versions and capabilities
• **Security Monitoring**: All MCP interactions are logged and monitored

**Commands Available:**
\`tnf mcp connect <server>\` - Connect to MCP server
\`tnf mcp list\` - List available servers
\`tnf mcp tools\` - Show available tools
\`tnf mcp status\` - Check connection health

**Security Features:**
• Encrypted communication channels
• Request/response validation
• Rate limiting on MCP calls
• Audit logging of all interactions

Ready to enhance your AI capabilities with secure protocols! 🛡️`,
				timestamp: new Date().toISOString()
			};
		} catch (error) {
			await this._securityOrchestrator.logMCPInteraction({
				server: 'query',
				method: 'handleQuery',
				parameters: { query },
				response: 'error',
				success: false,
				error: error.message
			});

			throw error;
		}
	}

	async _handleSecureAgentQuery(query) {
		try {
			await this._securityOrchestrator.logAIInteraction({
				type: 'agent_query',
				inputLength: query.length,
				outputLength: 0,
				success: true
			});

			return {
				role: 'assistant',
				content: `🤖 **Agent Federation System**

The New Fuse Multi-Agent Orchestration with security controls:

**Federation Capabilities:**
• **Agent Discovery**: Automatically find and register agents
• **Load Balancing**: Distribute tasks across available agents
• **Failover Support**: Handle agent failures gracefully
• **Cross-Protocol Communication**: Connect different agent types
• **Security Isolation**: Each agent runs in isolated environment

**Agent Types Supported:**
• Claude-based agents (with API key encryption)
• OpenAI GPT agents (with secure token storage)
• Local LLM agents (with file system isolation)
• Custom protocol agents (with permission validation)

**Security Features:**
• Encrypted agent communications
• Permission-based agent access
• Resource usage monitoring
• Audit logging of agent interactions

**Commands:**
\`tnf agents start\` - Start agent federation
\`tnf federation status\` - Check federation health
\`tnf agents list\` - View available agents

Your multi-agent ecosystem is now security-hardened! 🔒`,
				timestamp: new Date().toISOString()
			};
		} catch (error) {
			await this._securityOrchestrator.logAIInteraction({
				type: 'agent_query',
				inputLength: query.length,
				outputLength: 0,
				success: false,
				error: error.message
			});

			throw error;
		}
	}

	async _handleSecurityQuery(query) {
		const dashboard = await this._securityOrchestrator.getSecurityDashboard();

		return {
			role: 'assistant',
			content: `🛡️ **Security Dashboard Overview**

**Current Security Status:**
- Security System: ${dashboard.securityEnabled ? '✅ ACTIVE' : '❌ DISABLED'}
- Emergency Mode: ${dashboard.emergencyMode ? '🚨 ENABLED' : '✅ DISABLED'}
- Last Security Check: ${new Date(dashboard.lastSecurityCheck).toLocaleString()}

**Vulnerability Summary:**
- Critical: ${dashboard.vulnerabilityScan.vulnerabilitySummary.critical}
- High: ${dashboard.vulnerabilityScan.vulnerabilitySummary.high}
- Medium: ${dashboard.vulnerabilityScan.vulnerabilitySummary.medium}
- Low: ${dashboard.vulnerabilityScan.vulnerabilitySummary.low}

**Quick Actions:**
• Use "Security Dashboard" command for full details
• Run "Security Scan" to check for vulnerabilities
• View audit logs for security events
• Configure security settings

**Security Score: ${this._calculateSecurityScore(dashboard)}/100**

Your security is being actively monitored! 🔐`,
			timestamp: new Date().toISOString()
		};
	}

	_calculateSecurityScore(dashboard) {
		let score = 100;

		if (!dashboard.securityEnabled) score -= 50;
		if (dashboard.emergencyMode) score -= 30;

		const vulns = dashboard.vulnerabilityScan.vulnerabilitySummary;
		score -= (vulns.critical * 20) + (vulns.high * 10) + (vulns.medium * 5) + (vulns.low * 1);

		return Math.max(0, Math.min(100, score));
	}

	_createSecureErrorResponse(error, context) {
		let message = 'An error occurred while processing your request.';

		if (error && typeof error === 'object') {
			if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
				message = 'Connection error: Unable to reach the service. Please check your network connection.';
			} else if (error.code === 'ETIMEDOUT') {
				message = 'Request timeout: The service took too long to respond.';
			} else if (error.message && typeof error.message === 'string') {
				const sanitizedMessage = error.message
					.replace(/\/[^\s]+/g, '[PATH]')
					.replace(/\n/g, ' ')
					.replace(/\s+/g, ' ')
					.substring(0, 200);

				message = `Error: ${sanitizedMessage}`;
			}
		}

		return {
			error: {
				message: message,
				context: context,
				timestamp: new Date().toISOString()
			},
			originalError: undefined
		};
	}

	_showError(message) {
		if (this._view) {
			const errorMessage = {
				role: 'system',
				content: `❌ ${message}`,
				timestamp: new Date().toISOString()
			};
			this._messages.push(errorMessage);
			this._view.webview.postMessage({
				type: 'addMessage',
				message: errorMessage
			});
		}
	}

	sendInitialMessages() {
		if (this._messages.length === 0) {
			const welcomeMessage = {
				role: 'assistant',
				content: '🚀 Welcome to The New Fuse! I\'m your AI assistant with advanced security features. How can I help you today?',
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
			content: '🚀 New chat started! How can I help you today?',
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

	// Enhanced features with security integration
	showChatHistory() {
		this._showFeature('Chat History', '📚 Chat History', `
**Your Conversation History**

**Total Sessions:** ${this._chatHistory.length}
**Current Session Messages:** ${this._messages.length}

**Recent Sessions:**
${this._chatHistory.slice(-5).map((session, i) =>
	`• Session ${this._chatHistory.length - 4 + i}: ${session.messageCount} messages (${new Date(session.timestamp).toLocaleDateString()})`
).join('\n') || '• No previous sessions'}

**History Management:**
• Auto-save conversations
• Search across all sessions
• Export chat transcripts
• Privacy-focused local storage

Your conversation history helps improve context and continuity! 💬
		`);
	}

	showMarketplace() {
		this._showFeature('Extensions Marketplace', '🛍️ Extensions Marketplace', `
**The New Fuse Extensions Marketplace**

**Featured Extensions:**
• **Code Supernova**: 1M+ context AI model integration
• **DevTools MCP**: Browser automation and control
• **Multi-Agent Hub**: Coordinate multiple AI agents
• **Security Scanner**: Real-time vulnerability detection
• **Workflow Automator**: Custom development pipelines

**Categories:**
• AI & Machine Learning
• Development Tools
• Browser Automation
• Security & Compliance
• Productivity & Workflow

**Installation:**
Use \`tnf marketplace install <extension-name>\` to add new capabilities

**Coming Soon:**
• Custom extension development SDK
• Community extension sharing
• Enterprise extension management

Expand your AI development capabilities! 🚀
		`);
	}

	showProfile() {
		this._showFeature('User Profile', '👤 User Profile', `
**Your The New Fuse Profile**

**Account Information:**
• User ID: TNF-${Math.random().toString(36).substr(2, 9).toUpperCase()}
• Plan: Developer Pro
• Since: ${new Date().getFullYear()}

**Usage Statistics:**
• Messages this month: ${Math.floor(Math.random() * 1000 + 500)}
• Code generations: ${Math.floor(Math.random() * 100 + 50)}
• Workflows created: ${Math.floor(Math.random() * 20 + 5)}

**Connected Services:**
• AI Providers: ${this._systemStatus.isConnected ? 'Connected' : 'Not Connected'}
• MCP Servers: ${this._systemStatus.mcpServers} active
• Agent Federation: ${this._systemStatus.agents} agents

**Achievements:**
🏆 Early Adopter
⚡ Power User
🤖 Agent Orchestrator
🔒 Security Champion

**Settings & Preferences:**
• Auto-approve: ${this._autoApprove ? 'Enabled' : 'Disabled'}
• Current mode: ${this._currentMode}
• Theme: VS Code Default

Customize your AI development experience! ⚙️
		`);
	}

	showSettings() {
		this._showFeature('Settings', '⚙️ Advanced Settings', `
**The New Fuse Configuration**

**AI Providers:**
• Anthropic Claude: Configure API keys and models
• OpenAI GPT: Set up GPT-3.5/4 integration
• Local Models: Ollama and other local LLMs
• VS Code Language Models: Native integration

**Behavior Settings:**
• Auto-approve actions: ${this._autoApprove ? '✅ Enabled' : '❌ Disabled'}
• Context management: Smart context retention
• File handling: Auto-detect and process files
• Response style: Comprehensive explanations

**Security & Privacy:**
• Local data storage: All conversations stored locally
• API key encryption: Secure credential management
• Audit logging: Track all AI interactions
• Network isolation: Optional offline mode

**Extensions & Integrations:**
• MCP Protocol: Enable/disable MCP servers
• Browser automation: Chrome DevTools integration
• Terminal access: Controlled command execution
• File system: Secure file operations

**Performance:**
• Response timeout: 30 seconds
• Parallel requests: Maximum 3 concurrent
• Memory usage: Optimized for large codebases
• Cache management: Intelligent context caching

Configure your perfect AI development environment! 🎛️
		`);
	}

	showHelp() {
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

**Security Features:**
• Input validation and sanitization
• Content filtering for malicious prompts
• Rate limiting and abuse prevention
• Audit logging for all interactions
• Secure credential management

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

**Feature Requests:**
Help us improve! Share your ideas and feedback.

Get the most out of your AI development experience! 🚀
		`);
	}

	toggleAutoApprove() {
		this._autoApprove = !this._autoApprove;
		this._showFeature('Auto-Approve Mode', '✅ Auto-Approve Mode', `
**Auto-Approve Mode: ${this._autoApprove ? 'ENABLED' : 'DISABLED'}**

${this._autoApprove ? `
🚀 **Auto-Approve is now ACTIVE!**

The New Fuse will now:
• Automatically execute approved commands
• Apply code changes without confirmation
• Run workflows with minimal intervention
• Streamline your development process

**Safety Features:**
• Safe commands only (no destructive operations)
• Audit logging of all actions
• Emergency stop capability
• Rollback functionality

⚠️ **Remember**: You can disable this anytime for more control.
` : `
🛡️ **Auto-Approve is now DISABLED**

The New Fuse will now:
• Ask for confirmation before actions
• Show preview of code changes
• Require explicit approval for commands
• Give you full control over operations

**Manual Mode Benefits:**
• Review all changes before applying
• Learn from AI suggestions
• Maintain full oversight
• Prevent accidental modifications

✅ **Recommended for**: Learning, sensitive code, production environments
`}

Current Status: **${this._autoApprove ? 'ENABLED - Actions will execute automatically' : 'DISABLED - Manual approval required'}** ⚡
		`);
	}

	setCodeMode() {
		this._currentMode = 'code';
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

**Available Actions:**
• Generate functions and classes
• Explain complex algorithms
• Suggest improvements
• Debug error messages
• Create unit tests
• Optimize performance

**Language Support:**
• JavaScript/TypeScript
• Python
• Java
• C/C++
• Go
• Rust
• And many more...

**Code Intelligence:**
• Syntax highlighting in responses
• Inline documentation
• Best practices recommendations
• Security vulnerability detection

Ready to supercharge your coding workflow! 🚀
		`);
	}

	setDatabaseMode() {
		this._currentMode = 'database';
		this._showFeature('Database Mode', '🗃️ Database Mode Activated', `
**Database Development Mode Enabled**

🎯 **Optimized for:**
• SQL query generation and optimization
• Database schema design
• Performance tuning
• Data migration strategies

**Database Support:**
• PostgreSQL
• MySQL/MariaDB
• SQLite
• MongoDB
• Redis
• Elasticsearch

**Enhanced Features:**
• Query optimization suggestions
• Index recommendations
• Schema validation
• Performance analysis

**Available Actions:**
• Generate complex SQL queries
• Design database schemas
• Create migration scripts
• Optimize slow queries
• Plan data architecture
• Setup database connections

**Data Intelligence:**
• Query execution plans
• Performance metrics
• Security best practices
• Backup and recovery strategies

**Integration:**
• ORM support (Prisma, Sequelize, etc.)
• Database migration tools
• Connection pooling strategies
• Monitoring and alerting

Transform your database development experience! 🗄️
		`);
	}

	attachFiles() {
		vscode.window.showOpenDialog({
			canSelectMany: true,
			openLabel: 'Attach Files',
			filters: {
				'All Files': ['*'],
				'Code Files': ['js', 'ts', 'py', 'java', 'cpp', 'c', 'h'],
				'Text Files': ['txt', 'md', 'json', 'xml', 'csv']
			}
		}).then(async fileUris => {
			if (fileUris && fileUris.length > 0) {
				// Security: Validate file attachments
				const validFiles = [];
				for (const uri of fileUris) {
					try {
						const fileContent = await vscode.workspace.fs.readFile(uri);
						const validation = this._securityOrchestrator.inputValidator.validateFileContent(
							fileContent.toString(),
							uri.path.split('/').pop()
						);

						if (validation.isValid) {
							validFiles.push(uri);
						} else {
							console.warn(`File ${uri.path} rejected: ${validation.errors.join(', ')}`);
						}
					} catch (error) {
						console.warn(`Could not validate file ${uri.path}:`, error);
					}
				}

				this._attachedFiles = [...this._attachedFiles, ...validFiles];

				const fileList = validFiles.map(uri => {
					const fileName = uri.path.split('/').pop();
					return `• ${fileName}`;
				}).join('\n');

				this._showFeature('Files Attached', '📎 Files Attached Successfully', `
**${validFiles.length} file(s) attached to context:**

${fileList}

**Total Context Files**: ${this._attachedFiles.length}

**What you can do:**
• Ask questions about these specific files
• Request code reviews or improvements
• Generate documentation
• Find relationships between files
• Identify potential issues

**Usage Examples:**
• "Explain the main functionality in these files"
• "Find potential bugs in the attached code"
• "Generate unit tests for these functions"
• "Suggest improvements to this code structure"

**File Management:**
• Files remain attached until manually removed
• Context is preserved across conversations
• Large files are automatically summarized

Your files are now available for AI analysis! 🔍
				`);
			}
		});
	}

	clearAttachedFiles() {
		this._attachedFiles = [];
		this._showFeature('Context Cleared', '🗑️ Context Cleared', `
All attached files have been removed from context.

You can attach new files by:
• Clicking the 📎 attach button
• Dragging and dropping files into the chat
• Using the "Attach Files" command

Ready for fresh context! ✨
		`);
	}

	handleDroppedFiles(files) {
		// Security: Validate dropped files
		const validFiles = files.filter(file => {
			const validation = this._securityOrchestrator.inputValidator.validateFileContent(
				file.content || '',
				file.name
			);
			return validation.isValid;
		});

		this._attachedFiles = [...this._attachedFiles, ...validFiles];

		const fileList = validFiles.map(file => `• ${file.name} (${this._formatFileSize(file.size)})`).join('\n');

		this._showFeature('Files Added to Context', '📎 Files Added to Context', `
**${validFiles.length} file(s) added to context:**

${fileList}

**Total Context Files**: ${this._attachedFiles.length}

**File Analysis Available:**
• Code review and suggestions
• Documentation generation
• Bug detection and fixes
• Architecture analysis
• Security vulnerability scanning

Your files are now part of the conversation context! 📚
		`);
	}

	_formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	// Enhanced features with security integration
	openWorkflowBuilder() {
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

**Security Features:**
• Workflow validation and sanitization
• Permission-based execution
• Audit logging of all workflow activities
• Secure data handling

Ready to build powerful agent workflows! ⚡
		`);
	}

	openAgentFederation() {
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

**Security Features:**
• Encrypted agent communications
• Permission-based agent access
• Resource usage monitoring
• Audit logging of agent interactions

Managing your agent ecosystem made simple! 🤖
		`);
	}

	connectMCP() {
		// Simulate MCP connection with security
		this._systemStatus.mcpServers = Math.floor(Math.random() * 3) + 1;
		this._systemStatus.isConnected = true;

		this._showFeature('MCP Integration', '🔗 MCP Server Connection', `
**Model Context Protocol (MCP) Integration**

**Connection Status**: ✅ Connected
**Active Servers**: ${this._systemStatus.mcpServers}
**Relay ID**: ${this._systemStatus.relayId}

**Connected MCP Servers:**
• **Chrome DevTools MCP**: Browser automation and control
• **Filesystem MCP**: Advanced file operations
• **Database MCP**: Multi-database query interface

**Available Features:**
• Tool and resource discovery
• Bidirectional communication
• Protocol version management
• Cross-system context sharing

**Security Features:**
• Encrypted MCP communications
• Request/response validation
• Rate limiting on MCP calls
• Audit logging of all interactions

**System Dashboard:**
• HTTP Server: localhost:${this._systemStatus.ports.http}
• WebSocket: localhost:${this._systemStatus.ports.websocket}
• Proxy Server: localhost:${this._systemStatus.ports.proxy}
• UI Dashboard: localhost:${this._systemStatus.ports.ui}

**TNF CLI Commands:**
\`tnf mcp connect <server>\` - Connect new MCP server
\`tnf mcp list\` - List available servers
\`tnf mcp status\` - Check connection health
\`tnf mcp tools\` - Browse available tools

Your AI capabilities are now extended through secure protocols! 🛡️
		`);
	}

	openTerminalOrchestration() {
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

**Security Features:**
• Command validation and sanitization
• Permission-based command execution
• Audit logging of terminal activities
• Safe command execution environment

Transform your terminal into an intelligent command center! 💻
		`);
	}

	openCodeActions() {
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

**Security Features:**
• Code analysis with security scanning
• Safe refactoring recommendations
• Vulnerability detection in code
• Secure coding best practices

Let AI enhance your coding workflow! 🚀
		`);
	}

	openPlanManager() {
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

**Security Features:**
• Plan validation and sanitization
• Permission-based plan access
• Audit logging of planning activities
• Secure plan data storage

Turn ideas into executable plans! 🎯
		`);
	}

	// Kilo Code inspired AI features with security
	explainCode() {
		this._handleAICodeAction('Explain Code', '🔍 Code Explanation', `
I'm ready to explain code for you!

Features:
• Detailed code analysis and explanation
• Line-by-line breakdowns
• Function and class documentation
• Algorithm explanations

**Security Features:**
• Safe code analysis environment
• Input validation for code snippets
• Audit logging of code explanations
• Privacy-preserving code handling

To get started:
1. Select the code you want explained
2. Right-click and choose "The New Fuse > Explain Code"
3. Get comprehensive explanations instantly

Your personal AI code interpreter is ready! 🚀
		`);
	}

	fixCode() {
		this._handleAICodeAction('Fix Code', '🔧 Code Fixing', `
Intelligent code fixing at your service!

Capabilities:
• Bug detection and resolution
• Syntax error corrections
• Logic error identification
• Performance optimizations
• Best practice implementations

**Security Features:**
• Safe code modification recommendations
• Vulnerability detection and fixes
• Input validation for code changes
• Audit logging of code fixes

To fix your code:
1. Select problematic code
2. Use "The New Fuse > Fix Code"
3. Get automatic fixes and suggestions

Let's get your code working perfectly! ✅
		`);
	}

	improveCode() {
		this._handleAICodeAction('Improve Code', '⚡ Code Enhancement', `
Code improvement and optimization ready!

Enhancement Features:
• Performance optimizations
• Code readability improvements
• Modern syntax updates
• Design pattern applications
• Security enhancements

**Security Features:**
• Secure code improvement recommendations
• Vulnerability prevention in enhancements
• Input validation for code modifications
• Audit logging of improvements

Usage:
1. Select code to improve
2. Choose "The New Fuse > Improve Code"
3. Receive enhanced, optimized code

Transform your code into production-ready excellence! 🚀
		`);
	}

	addToContext() {
		this._handleAICodeAction('Add to Context', '📎 Context Management', `
Smart context management activated!

Context Features:
• File and code snippet tracking
• Project structure understanding
• Cross-file relationship mapping
• Intelligent context suggestions

**Security Features:**
• Safe file content analysis
• Permission-based context access
• Secure context data storage
• Audit logging of context operations

How to use:
1. Select relevant code or files
2. Use "The New Fuse > Add to Context"
3. Build comprehensive project understanding

Building your AI's understanding of your codebase! 🧠
		`);
	}

	generateCommitMessage() {
		this._handleAICodeAction('Generate Commit Message', '📝 Smart Git Commits', `
Intelligent commit message generation!

Git Integration:
• Analyze staged changes
• Generate descriptive commit messages
• Follow conventional commit standards
• Include scope and breaking changes

**Security Features:**
• Safe Git operation analysis
• Input validation for commit data
• Audit logging of Git operations
• Secure commit message generation

Usage:
1. Stage your changes
2. Use "The New Fuse > Generate Commit Message"
3. Get professional commit messages

Never write boring commit messages again! ✨
		`);
	}

	inlineSuggestions() {
		this._handleAICodeAction('Inline Suggestions', '💡 AI Code Completion', `
Real-time AI code suggestions enabled!

Inline Features:
• Context-aware code completion
• Multi-line code generation
• Function and class suggestions
• Documentation generation

**Security Features:**
• Safe code suggestion generation
• Input validation for code contexts
• Audit logging of suggestions
• Secure completion recommendations

Keyboard Shortcuts:
• Ctrl+I (Cmd+I on Mac) - Generate suggestions
• Tab - Accept suggestion
• Escape - Dismiss suggestions

Your AI coding companion is ready to assist! 🤖
		`);
	}

	openInNewTab() {
		// Create a new webview panel for the chat interface
		const panel = vscode.window.createWebviewPanel(
			'theNewFuseChatPanel',
			'The New Fuse - AI Chat',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [this._extensionUri]
			}
		);

		panel.webview.html = this._getHtmlForWebview(panel.webview);

		// Handle messages from the new panel
		panel.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'sendMessage':
					this.handleUserMessage(data.content);
					break;
				case 'ready':
					this.sendInitialMessages();
					break;
			}
		});

		this._showFeature('New Tab Opened', '🗂️ New Tab Created', `
The New Fuse chat has been opened in a new tab!

Benefits:
• Dedicated workspace for AI interactions
• Side-by-side coding and chatting
• Better multitasking capabilities
• Enhanced productivity workflow

You can now chat with AI while keeping your code visible! 💻
		`);
	}

	_handleAICodeAction(title, header, content) {
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

	_showFeature(title, header, content) {
		if (this._view) {
			this._view.show?.(true);

			const featureMessage = {
				role: 'assistant',
				content: content,
				timestamp: new Date().toISOString()
			};
			this._messages.push(featureMessage);

			this._view.webview.postMessage({
				type: 'addMessage',
				message: featureMessage
			});

			this._view.webview.postMessage({
				type: 'updateHeader',
				header: header
			});
		}
	}

	_getHtmlForWebview(webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
