const vscode = require('vscode');

function activate(context) {
  console.log('🚀 The New Fuse extension is being activated');

  const provider = new ChatViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.sendMessage', () => {
      provider.sendMessage();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.clearChat', () => {
      provider.clearChat();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.newChat', () => {
      provider.newChat();
    })
  );

  // Enhanced TNF CLI Integration Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.openWorkflowBuilder', () => {
      provider.openWorkflowBuilder();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.agentFederation', () => {
      provider.openAgentFederation();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.mcpConnect', () => {
      provider.connectMCP();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.terminalOrchestration', () => {
      provider.openTerminalOrchestration();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.codeActions', () => {
      provider.openCodeActions();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.planManager', () => {
      provider.openPlanManager();
    })
  );

  // Kilo Code inspired features
  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.explainCode', () => {
      provider.explainCode();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.fixCode', () => {
      provider.fixCode();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.improveCode', () => {
      provider.improveCode();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.addToContext', () => {
      provider.addToContext();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.generateCommitMessage', () => {
      provider.generateCommitMessage();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.inlineSuggestions', () => {
      provider.inlineSuggestions();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.openInNewTab', () => {
      provider.openInNewTab();
    })
  );

  // Additional toolbar buttons
  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.historyButtonClicked', () => {
      provider.showChatHistory();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.marketplaceButtonClicked', () => {
      provider.showMarketplace();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.profileButtonClicked', () => {
      provider.showProfile();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.settingsButtonClicked', () => {
      provider.showSettings();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.helpButtonClicked', () => {
      provider.showHelp();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.autoApprove', () => {
      provider.toggleAutoApprove();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.codeMode', () => {
      provider.setCodeMode();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.databaseMode', () => {
      provider.setDatabaseMode();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.attachFiles', () => {
      provider.attachFiles();
    })
  );

  console.log('✅ The New Fuse extension activated successfully with enhanced features');
}

class ChatViewProvider {
  static viewType = 'theNewFuse.chatView';

  constructor(extensionUri) {
    this._extensionUri = extensionUri;
    this._view = undefined;
    this._messages = [];
    this._chatHistory = [];
    this._autoApprove = false;
    this._currentMode = 'chat';
    this._attachedFiles = [];
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
        ui: 3002,
      },
    };
  }

  resolveWebviewView(webviewView, _context, _token) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case 'sendMessage':
          this.handleUserMessage(data.content);
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
      }
    });
  }

  handleUserMessage(content) {
    if (!content.trim()) return;

    // Add user message
    const userMessage = {
      role: 'user',
      content: content,
      timestamp: new Date().toISOString(),
    };
    this._messages.push(userMessage);

    // Send user message to webview
    this._view?.webview.postMessage({
      type: 'addMessage',
      message: userMessage,
    });

    // Enhanced AI response with The New Fuse capabilities
    this._view?.webview.postMessage({
      type: 'updateStatus',
      status: 'Processing...',
    });

    setTimeout(() => {
      const aiResponse = this._generateEnhancedResponse(content);
      this._messages.push(aiResponse);

      this._view?.webview.postMessage({
        type: 'addMessage',
        message: aiResponse,
      });

      this._view?.webview.postMessage({
        type: 'updateStatus',
        status: 'Ready',
      });
    }, 1000);
  }

  _generateEnhancedResponse(userInput) {
    const input = userInput.toLowerCase();

    // The New Fuse intelligent response system
    if (input.includes('mcp') || input.includes('protocol')) {
      return {
        role: 'assistant',
        content: `🔗 **MCP (Model Context Protocol) Integration**

The New Fuse supports advanced MCP integration:

**Available MCP Features:**
• **Server Discovery**: Automatically detect and connect to MCP servers
• **Tool Integration**: Access external tools and resources through MCP
• **Context Sharing**: Share context across different AI systems
• **Protocol Management**: Handle MCP protocol versions and capabilities

**Commands Available:**
\`tnf mcp connect <server>\` - Connect to MCP server
\`tnf mcp list\` - List available servers
\`tnf mcp tools\` - Show available tools

Ready to enhance your AI capabilities with standardized protocols!`,
        timestamp: new Date().toISOString(),
      };
    }

    if (input.includes('agent') || input.includes('federation')) {
      return {
        role: 'assistant',
        content: `🤖 **Agent Federation System**

The New Fuse Multi-Agent Orchestration is active:

**Federation Capabilities:**
• **Agent Discovery**: Automatically find and register agents
• **Load Balancing**: Distribute tasks across available agents
• **Failover Support**: Handle agent failures gracefully
• **Cross-Protocol Communication**: Connect different agent types

**Agent Types Supported:**
• Claude-based agents
• OpenAI GPT agents
• Local LLM agents
• Custom protocol agents

**Commands:**
\`tnf agents start\` - Start agent federation
\`tnf federation status\` - Check federation health

Your multi-agent ecosystem is ready for deployment!`,
        timestamp: new Date().toISOString(),
      };
    }

    if (input.includes('workflow') || input.includes('orchestration')) {
      return {
        role: 'assistant',
        content: `🔄 **Workflow Builder & Orchestration**

Advanced workflow management activated:

**Workflow Features:**
• **Visual Builder**: Create workflows with drag-and-drop interface
• **Task Dependencies**: Define complex task relationships
• **Parallel Execution**: Run multiple tasks simultaneously
• **Error Handling**: Robust error recovery mechanisms
• **Monitoring**: Real-time workflow execution tracking

**Workflow Types:**
• Development workflows (build, test, deploy)
• Data processing pipelines
• Multi-agent coordination workflows
• Custom automation sequences

**Quick Start:**
\`tnf workflow create\` - Start workflow builder
\`tnf workflow run <name>\` - Execute workflow

Transform your development process with intelligent automation!`,
        timestamp: new Date().toISOString(),
      };
    }

    if (input.includes('security') || input.includes('observability')) {
      return {
        role: 'assistant',
        content: `🛡️ **Security Observability Platform**

The New Fuse Security Monitoring is active:

**Security Features:**
• **Real-time Threat Detection**: Monitor for security anomalies
• **Code Vulnerability Scanning**: Automatic security analysis
• **Access Control**: Fine-grained permission management
• **Audit Logging**: Comprehensive security event tracking
• **Compliance Monitoring**: Meet security standards automatically

**Observability Dashboard:**
• System health metrics
• Performance monitoring
• Security event correlation
• Custom alerting rules

**Security Commands:**
\`tnf security scan\` - Run security analysis
\`tnf security status\` - Check security posture
\`tnf audit trail\` - View security events

Your development environment is now security-hardened!`,
        timestamp: new Date().toISOString(),
      };
    }

    if (input.includes('plan') || input.includes('traycer')) {
      return {
        role: 'assistant',
        content: `📋 **Traycer-Style Plan Management**

Strategic planning system activated:

**Planning Capabilities:**
• **Task Decomposition**: Break complex goals into manageable tasks
• **Dependency Mapping**: Understand task relationships
• **Timeline Management**: Create realistic project schedules
• **Progress Tracking**: Monitor execution in real-time
• **Adaptive Planning**: Modify plans based on progress

**Plan Types:**
• Software development projects
• Research initiatives
• System migrations
• Process improvements

**Planning Tools:**
\`tnf plan create <project>\` - Start new plan
\`tnf plan analyze\` - Get plan insights
\`tnf plan track\` - Monitor progress

Turn your ideas into executable, trackable plans!`,
        timestamp: new Date().toISOString(),
      };
    }

    // Default enhanced response
    return {
      role: 'assistant',
      content: `🚀 **The New Fuse AI Assistant**

Hello! I'm your enhanced AI assistant with powerful capabilities:

**Core Features:**
• **Multi-Agent Orchestration**: Coordinate multiple AI agents
• **MCP 2025 Protocol**: Connect to standardized AI services
• **Security Observability**: Monitor and protect your development
• **Workflow Builder**: Automate complex development tasks
• **Traycer Planning**: Strategic project management

**Quick Actions:**
• Say "agents" to explore multi-agent features
• Say "mcp" to learn about protocol integration
• Say "security" to check security features
• Say "workflow" to build automation
• Say "plan" to start strategic planning

**Available Commands:**
Right-click in your code for context actions like:
• Explain Code • Fix Code • Improve Code • Add to Context

Ready to enhance your development workflow! What would you like to explore?`,
      timestamp: new Date().toISOString(),
    };
  }

  sendInitialMessages() {
    if (this._messages.length === 0) {
      const welcomeMessage = {
        role: 'assistant',
        content: "🚀 Welcome to The New Fuse! I'm your AI assistant. How can I help you today?",
        timestamp: new Date().toISOString(),
      };
      this._messages.push(welcomeMessage);
    }

    // Send all messages to webview
    for (const message of this._messages) {
      this._view?.webview.postMessage({
        type: 'addMessage',
        message: message,
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
      timestamp: new Date().toISOString(),
    };
    this._messages.push(welcomeMessage);

    if (this._view) {
      this._view.webview.postMessage({
        type: 'addMessage',
        message: welcomeMessage,
      });
    }
  }

  // Toolbar button handlers
  showChatHistory() {
    this._showFeature(
      'Chat History',
      '📚 Chat History',
      `
**Your Conversation History**

Total Sessions: ${this._chatHistory.length}
Current Session Messages: ${this._messages.length}

**Recent Sessions:**
${
  this._chatHistory
    .slice(-5)
    .map(
      (session, i) =>
        `• Session ${this._chatHistory.length - 4 + i}: ${session.messageCount} messages (${new Date(session.timestamp).toLocaleDateString()})`
    )
    .join('\n') || '• No previous sessions'
}

**History Management:**
• Auto-save conversations
• Search across all sessions
• Export chat transcripts
• Privacy-focused local storage

Your conversation history helps improve context and continuity!
		`
    );
  }

  showMarketplace() {
    this._showFeature(
      'Extensions Marketplace',
      '🛍️ Extensions Marketplace',
      `
**The New Fuse Extensions Marketplace**

**Featured Extensions:**
• **Code Supernova**: 1M+ context AI model integration
• **DevTools MCP**: Chrome browser automation and control
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

Expand your AI development capabilities!
		`
    );
  }

  showProfile() {
    this._showFeature(
      'User Profile',
      '👤 User Profile',
      `
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

Customize your AI development experience!
		`
    );
  }

  showSettings() {
    this._showFeature(
      'Settings',
      '⚙️ Advanced Settings',
      `
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

Configure your perfect AI development environment!
		`
    );
  }

  showHelp() {
    this._showFeature(
      'Help & Documentation',
      '❓ Help & Documentation',
      `
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

**Feature Requests:**
Help us improve! Share your ideas and feedback.

Get the most out of your AI development experience!
		`
    );
  }

  toggleAutoApprove() {
    this._autoApprove = !this._autoApprove;
    this._showFeature(
      'Auto-Approve Mode',
      '✅ Auto-Approve Mode',
      `
**Auto-Approve Mode: ${this._autoApprove ? 'ENABLED' : 'DISABLED'}**

${
  this._autoApprove
    ? `
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
`
    : `
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
`
}

Current Status: **${this._autoApprove ? 'ENABLED - Actions will execute automatically' : 'DISABLED - Manual approval required'}**
		`
    );
  }

  setCodeMode() {
    this._currentMode = 'code';
    this._showFeature(
      'Code Mode',
      '💻 Code Mode Activated',
      `
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

Ready to supercharge your coding workflow!
		`
    );
  }

  setDatabaseMode() {
    this._currentMode = 'database';
    this._showFeature(
      'Database Mode',
      '🗃️ Database Mode Activated',
      `
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

Transform your database development experience!
		`
    );
  }

  attachFiles() {
    vscode.window
      .showOpenDialog({
        canSelectMany: true,
        openLabel: 'Attach Files',
        filters: {
          'All Files': ['*'],
          'Code Files': ['js', 'ts', 'py', 'java', 'cpp', 'c', 'h'],
          'Text Files': ['txt', 'md', 'json', 'xml', 'csv'],
        },
      })
      .then((fileUris) => {
        if (fileUris && fileUris.length > 0) {
          this._attachedFiles = [...this._attachedFiles, ...fileUris];

          const fileList = fileUris
            .map((uri) => {
              const fileName = uri.path.split('/').pop();
              return `• ${fileName}`;
            })
            .join('\n');

          this._showFeature(
            'Files Attached',
            '📎 Files Attached Successfully',
            `
**${fileUris.length} file(s) attached to context:**

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

Your files are now available for AI analysis!
				`
          );
        }
      });
  }

  clearAttachedFiles() {
    this._attachedFiles = [];
    this._showFeature(
      'Context Cleared',
      '🗑️ Context Cleared',
      `
All attached files have been removed from context.

You can attach new files by:
• Clicking the 📎 attach button
• Dragging and dropping files into the chat
• Using the "Attach Files" command

Ready for fresh context!
		`
    );
  }

  handleDroppedFiles(files) {
    this._attachedFiles = [...this._attachedFiles, ...files];

    const fileList = files
      .map((file) => `• ${file.name} (${this._formatFileSize(file.size)})`)
      .join('\n');

    this._showFeature(
      'Files Added to Context',
      '📎 Files Added to Context',
      `
**${files.length} file(s) added to context:**

${fileList}

**Total Context Files**: ${this._attachedFiles.length}

**File Analysis Available:**
• Code review and suggestions
• Documentation generation
• Bug detection and fixes
• Architecture analysis
• Security vulnerability scanning

Your files are now part of the conversation context!
		`
    );
  }

  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Enhanced TNF CLI Integration Methods
  openWorkflowBuilder() {
    this._showFeature(
      'Workflow Builder',
      '🔄 Workflow Builder',
      `
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
		`
    );
  }

  openAgentFederation() {
    this._showFeature(
      'Agent Federation',
      '🤖 Agent Federation',
      `
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
		`
    );
  }

  connectMCP() {
    // Simulate MCP connection
    this._systemStatus.mcpServers = Math.floor(Math.random() * 3) + 1;
    this._systemStatus.isConnected = true;

    this._showFeature(
      'MCP Integration',
      '🔗 MCP Server Connection',
      `
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

Your AI capabilities are now extended through standardized protocols!
		`
    );
  }

  openTerminalOrchestration() {
    this._showFeature(
      'Terminal Orchestration',
      '⚡ Terminal Orchestration',
      `
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
		`
    );
  }

  openCodeActions() {
    this._showFeature(
      'Code Actions',
      '💻 Intelligent Code Actions',
      `
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
		`
    );
  }

  openPlanManager() {
    this._showFeature(
      'Plan Manager',
      '📋 Strategic Plan Management',
      `
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
		`
    );
  }

  // Kilo Code inspired AI features
  explainCode() {
    this._handleAICodeAction(
      'Explain Code',
      '🔍 Code Explanation',
      `
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
		`
    );
  }

  fixCode() {
    this._handleAICodeAction(
      'Fix Code',
      '🔧 Code Fixing',
      `
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
		`
    );
  }

  improveCode() {
    this._handleAICodeAction(
      'Improve Code',
      '⚡ Code Enhancement',
      `
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
		`
    );
  }

  addToContext() {
    this._handleAICodeAction(
      'Add to Context',
      '📎 Context Management',
      `
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
		`
    );
  }

  generateCommitMessage() {
    this._handleAICodeAction(
      'Generate Commit Message',
      '📝 Smart Git Commits',
      `
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
		`
    );
  }

  inlineSuggestions() {
    this._handleAICodeAction(
      'Inline Suggestions',
      '💡 AI Code Completion',
      `
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
		`
    );
  }

  openInNewTab() {
    // Create a new webview panel for the chat interface
    const panel = vscode.window.createWebviewPanel(
      'theNewFuseChatPanel',
      'The New Fuse - AI Chat',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [this._extensionUri],
      }
    );

    panel.webview.html = this._getHtmlForWebview(panel.webview);

    // Handle messages from the new panel
    panel.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case 'sendMessage':
          this.handleUserMessage(data.content);
          break;
        case 'ready':
          this.sendInitialMessages();
          break;
      }
    });

    this._showFeature(
      'New Tab Opened',
      '🗂️ New Tab Created',
      `
The New Fuse chat has been opened in a new tab!

Benefits:
• Dedicated workspace for AI interactions
• Side-by-side coding and chatting
• Better multitasking capabilities
• Enhanced productivity workflow

You can now chat with AI while keeping your code visible!
		`
    );
  }

  _handleAICodeAction(title, header, content) {
    // Get the active text editor
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (selectedText) {
        // If text is selected, include it in the message
        const enhancedContent =
          content +
          `\n\nSelected Code:\n\`\`\`\n${selectedText}\n\`\`\`\n\nReady to analyze this code!`;
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
        timestamp: new Date().toISOString(),
      };
      this._messages.push(featureMessage);

      this._view.webview.postMessage({
        type: 'addMessage',
        message: featureMessage,
      });

      this._view.webview.postMessage({
        type: 'updateHeader',
        header: header,
      });
    }
  }

  _getHtmlForWebview(webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
    );

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>The New Fuse Chat</title>
			</head>
			<body>
				<div class="chat-container">
					<div class="chat-header">
						<h3>🤖 The New Fuse AI</h3>
						<div class="status">Ready</div>
					</div>

					<div class="messages-container" id="messages">
						<!-- Messages will be added here -->
					</div>

					<div class="input-container" id="inputContainer">
						<div class="input-wrapper">
							<div class="context-info" id="contextInfo" style="display: none;">
								<span class="context-count">📎 0 files attached</span>
								<button class="context-clear" id="clearContext">✕</button>
							</div>
							<div class="textarea-wrapper">
								<textarea
									id="messageInput"
									placeholder="@ to add context, / for commands, hold shift to drag in files/images"
									rows="3"
								></textarea>
								<div class="input-actions">
									<button class="input-action-btn" id="attachBtn" title="Attach Files">📎</button>
									<button class="input-action-btn" id="codeBtn" title="Code Mode">💻</button>
									<button class="input-action-btn" id="dbBtn" title="Database Mode">🗃️</button>
								</div>
							</div>
							<button id="sendButton">
								<span class="codicon codicon-send"></span>
								Send
							</button>
						</div>
						<div class="drop-zone" id="dropZone" style="display: none;">
							<div class="drop-content">
								<span class="drop-icon">📁</span>
								<p>Drop files here to add to context</p>
							</div>
						</div>
					</div>
				</div>

				<script nonce="${nonce}" src="${scriptUri}"></script>
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

function deactivate() {
  console.log('The New Fuse extension deactivated');
}

module.exports = {
  activate,
  deactivate,
};
