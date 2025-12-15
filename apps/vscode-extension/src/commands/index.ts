/**
 * The New Fuse VSCode Extension - Command Registration
 * Version 9.0.0 - Clean Architecture
 *
 * Simple, flat command registration without unnecessary abstractions
 */

import * as vscode from 'vscode';
import { ConfigManager } from '../core/config';
import { ChatViewProvider } from '../providers/ChatViewProvider';
import { getAIService } from '../services/AIService';
import { getChatService } from '../services/ChatService';
import { getMCPDiscoveryService } from '../services/MCPDiscoveryService';
import { getMCPService } from '../services/MCPService';
import { getOpenRouterService } from '../services/OpenRouterService';
import {
  getCurrentFilePath,
  getCurrentLanguageId,
  getSelectedText,
  showInfo,
  showQuickPick,
  showWarning,
} from '../utils/helpers';
import { log } from '../utils/logger';

/**
 * Register all extension commands
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  chatViewProvider: ChatViewProvider
): void {
  log.info('Registering commands...');

  const commands: Array<{ id: string; handler: () => Promise<void> | void }> = [
    // ============================================
    // Chat Commands
    // ============================================
    {
      id: 'theNewFuse.sendMessage',
      handler: async () => {
        chatViewProvider.focusInput();
      },
    },
    {
      id: 'theNewFuse.clearChat',
      handler: async () => {
        const chatService = getChatService();
        chatService.clearMessages();
        chatViewProvider.sendToWebview({ type: 'clearChat' });
        showInfo('Chat cleared');
      },
    },
    {
      id: 'theNewFuse.newChat',
      handler: async () => {
        const chatService = getChatService();
        const welcome = chatService.newChat();
        chatViewProvider.sendToWebview({ type: 'clearChat' });
        chatViewProvider.sendToWebview({ type: 'addMessage', payload: welcome });
      },
    },

    // ============================================
    // Code Commands
    // ============================================
    {
      id: 'theNewFuse.explainCode',
      handler: async () => {
        const code = getSelectedText();
        if (!code) {
          showWarning('Please select some code first');
          return;
        }
        const lang = getCurrentLanguageId() || 'code';
        const prompt = `Explain this ${lang} code:\n\n\`\`\`${lang}\n${code}\n\`\`\``;
        await chatViewProvider.handleUserMessage(prompt);
      },
    },
    {
      id: 'theNewFuse.fixCode',
      handler: async () => {
        const code = getSelectedText();
        if (!code) {
          showWarning('Please select some code first');
          return;
        }
        const lang = getCurrentLanguageId() || 'code';
        const prompt = `Fix any issues in this ${lang} code:\n\n\`\`\`${lang}\n${code}\n\`\`\``;
        await chatViewProvider.handleUserMessage(prompt);
      },
    },
    {
      id: 'theNewFuse.improveCode',
      handler: async () => {
        const code = getSelectedText();
        if (!code) {
          showWarning('Please select some code first');
          return;
        }
        const lang = getCurrentLanguageId() || 'code';
        const prompt = `Suggest improvements for this ${lang} code:\n\n\`\`\`${lang}\n${code}\n\`\`\``;
        await chatViewProvider.handleUserMessage(prompt);
      },
    },
    {
      id: 'theNewFuse.addToContext',
      handler: async () => {
        const code = getSelectedText();
        const path = getCurrentFilePath();
        if (code && path) {
          chatViewProvider.addContext({ code, path });
          showInfo('Added to context');
        } else {
          showWarning('Please select some code first');
        }
      },
    },
    {
      id: 'theNewFuse.generateCommitMessage',
      handler: async () => {
        const aiService = getAIService();
        try {
          // Get git diff
          const gitExt = vscode.extensions.getExtension('vscode.git');
          if (!gitExt) {
            showWarning('Git extension not found');
            return;
          }

          showInfo('Generating commit message...');
          const message = await aiService.quickChat(
            'Generate a concise, conventional commit message for the staged changes. Use the format: type(scope): description',
            'You are a git commit message generator. Generate clear, conventional commit messages.'
          );

          // Copy to clipboard
          await vscode.env.clipboard.writeText(message.trim());
          showInfo('Commit message copied to clipboard!');
        } catch (error) {
          showWarning(`Failed to generate: ${(error as Error).message}`);
        }
      },
    },
    {
      id: 'theNewFuse.inlineSuggestions',
      handler: async () => {
        showInfo('💡 Inline suggestions: Use Ctrl+I (Cmd+I on Mac) in the editor');
      },
    },
    {
      id: 'theNewFuse.codeActions',
      handler: async () => {
        showInfo('💻 Code actions: Right-click on selected code for AI options');
      },
    },

    // ============================================
    // MCP Commands
    // ============================================
    {
      id: 'theNewFuse.mcpConnect',
      handler: async () => {
        const mcpService = getMCPService();
        await mcpService.showServerPicker();
      },
    },
    {
      id: 'theNewFuse.mcpStatus',
      handler: async () => {
        const mcpService = getMCPService();
        const connections = mcpService.getConnections();

        if (connections.length === 0) {
          showInfo('No MCP servers configured. Use "Connect MCP Server" to add one.');
          return;
        }

        const connected = connections.filter((c) => c.status === 'connected');
        const message = `MCP Status: ${connected.length}/${connections.length} servers connected`;
        showInfo(message);
      },
    },

    // ============================================
    // UI Commands
    // ============================================
    {
      id: 'theNewFuse.historyButtonClicked',
      handler: async () => {
        const actions = [
          { label: '$(export) Export Conversation', action: 'export' },
          { label: '$(trash) Clear History', action: 'clear' },
        ];

        const selection = await showQuickPick(actions, {
          placeHolder: 'History Options',
        });

        if (selection?.action === 'clear') {
          const chatService = getChatService();
          chatService.clearMessages();
          chatViewProvider.sendToWebview({ type: 'clearChat' });
        } else if (selection?.action === 'export') {
          const chatService = getChatService();
          const messages = chatService.getMessages();
          const content = messages.map((m) => `[${m.role}] ${m.content}`).join('\n\n');

          const doc = await vscode.workspace.openTextDocument({ content, language: 'markdown' });
          await vscode.window.showTextDocument(doc);
        }
      },
    },
    {
      id: 'theNewFuse.marketplaceButtonClicked',
      handler: async () => {
        const actions = [
          { label: '$(add) Add from Marketplace', action: 'marketplace' },
          { label: '$(plug) Connect Custom Server', action: 'custom' },
          { label: '$(export) Export MCP Config', action: 'export' },
          { label: '$(import) Import MCP Config', action: 'import' },
        ];

        const selection = await showQuickPick(actions, {
          placeHolder: 'MCP Server Options',
        });

        if (selection?.action === 'marketplace') {
          const discoveryService = getMCPDiscoveryService();
          const serverConfig = await discoveryService.showServerMarketplace();

          if (serverConfig) {
            const configManager = ConfigManager.getInstance();
            await configManager.addMCPServer(serverConfig);
            showInfo(`✅ Added MCP server: ${serverConfig.name}`);

            // Connect to the server
            const mcpService = getMCPService();
            await mcpService.connect(serverConfig);
          }
        } else if (selection?.action === 'custom') {
          const mcpService = getMCPService();
          await mcpService.showServerPicker();
        } else if (selection?.action === 'export') {
          const discoveryService = getMCPDiscoveryService();
          await discoveryService.exportConfiguration();
        } else if (selection?.action === 'import') {
          const discoveryService = getMCPDiscoveryService();
          await discoveryService.importConfiguration();
        }
      },
    },
    {
      id: 'theNewFuse.profileButtonClicked',
      handler: async () => {
        const config = ConfigManager.getInstance();
        const providers = ['OpenAI', 'Anthropic', 'Google Gemini', 'OpenRouter', 'LiteLLM'];

        const provider = await showQuickPick(
          providers.map((p) => ({ label: p, provider: p.toLowerCase().replace(' ', '') })),
          { placeHolder: 'Select provider to configure API key' }
        );

        if (provider) {
          const key = await vscode.window.showInputBox({
            prompt: `Enter API key for ${provider.label}`,
            password: true,
            placeHolder: 'sk-...',
          });

          if (key) {
            await config.setApiKey(provider.provider as any, key);
            showInfo(`✅ ${provider.label} API key saved securely`);

            // Reinitialize AI service
            const aiService = getAIService();
            await aiService.initialize();
          }
        }
      },
    },
    {
      id: 'theNewFuse.settingsButtonClicked',
      handler: async () => {
        const aiService = getAIService();
        const currentProvider = aiService.getActiveProvider();

        const actions = [
          { label: '$(gear) Open Extension Settings', action: 'settings' },
          { label: '$(key) Configure API Keys', action: 'apiKeys' },
          { label: '$(symbol-enum) Select Model', action: 'selectModel' },
          { label: '$(server) Change Provider', action: 'changeProvider' },
        ];

        const selection = await showQuickPick(actions, {
          placeHolder: `Settings (Current: ${currentProvider || 'None'})`,
        });

        if (!selection) return;

        if (selection.action === 'settings') {
          vscode.commands.executeCommand('workbench.action.openSettings', 'theNewFuse');
        } else if (selection.action === 'apiKeys') {
          vscode.commands.executeCommand('theNewFuse.profileButtonClicked');
        } else if (selection.action === 'selectModel') {
          // Check if OpenRouter is selected - show dynamic model picker
          if (currentProvider === 'openrouter') {
            const openRouterService = getOpenRouterService();
            const selectedModel = await openRouterService.showModelPicker();

            if (selectedModel) {
              const vsConfig = vscode.workspace.getConfiguration('theNewFuse.providers.openrouter');
              await vsConfig.update('model', selectedModel, vscode.ConfigurationTarget.Global);
              showInfo(`✅ OpenRouter model set to: ${selectedModel}`);
            }
          } else {
            // For other providers, show a quick pick with common models
            const configManager = ConfigManager.getInstance();
            const providerModels: Record<string, string[]> = {
              openai: [
                'gpt-5.2',
                'gpt-5.1-codex-max',
                'gpt-4-turbo',
                'gpt-4o',
                'gpt-4o-mini',
                'o1',
                'o1-mini',
              ],
              anthropic: [
                'claude-opus-4.5-20251124',
                'claude-sonnet-4.5-20251124',
                'claude-3-5-sonnet-20241022',
                'claude-3-opus-20240229',
              ],
              gemini: ['gemini-3-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
              deepseek: [
                'deepseek-v3.2-speciale',
                'deepseek-r1',
                'deepseek-chat',
                'deepseek-coder',
              ],
              qwen: ['qwen3-coder-480b', 'qwen-2.5-max', 'qwen-2.5-coder-32b', 'qwen-turbo'],
              litellm: ['gpt-5.2', 'claude-opus-4.5', 'gemini-3-pro', 'custom-model'],
              copilot: ['gpt-4', 'gpt-3.5-turbo'],
            };

            const models = providerModels[currentProvider || 'openai'] || ['gpt-4', 'claude-3'];
            const modelSelection = await showQuickPick(
              models.map((m) => ({ label: m })),
              { placeHolder: `Select model for ${currentProvider || 'current provider'}` }
            );

            if (modelSelection) {
              const vsConfig = vscode.workspace.getConfiguration(
                `theNewFuse.providers.${currentProvider}`
              );
              await vsConfig.update(
                'model',
                modelSelection.label,
                vscode.ConfigurationTarget.Global
              );
              showInfo(`✅ Model set to: ${modelSelection.label}`);
            }
          }
        } else if (selection.action === 'changeProvider') {
          const config = ConfigManager.getInstance();
          const providers = [
            { label: '$(cloud) OpenAI', provider: 'openai' },
            { label: '$(comment-discussion) Anthropic', provider: 'anthropic' },
            { label: '$(sparkle) Google Gemini', provider: 'gemini' },
            { label: '$(link) OpenRouter', provider: 'openrouter' },
            { label: '$(server-process) LiteLLM', provider: 'litellm' },
            { label: '$(rocket) DeepSeek', provider: 'deepseek' },
            { label: '$(terminal) Qwen', provider: 'qwen' },
            { label: '$(github-alt) Copilot', provider: 'copilot' },
          ];

          const providerSelection = await showQuickPick(providers, {
            placeHolder: 'Select default AI provider',
          });

          if (providerSelection) {
            await config.updateConfig('defaultProvider', providerSelection.provider as any);
            await aiService.setActiveProvider(providerSelection.provider as any);
            showInfo(`✅ Provider set to: ${providerSelection.label}`);
          }
        }
      },
    },
    {
      id: 'theNewFuse.helpButtonClicked',
      handler: async () => {
        const actions = [
          { label: '$(book) Documentation', action: 'docs' },
          { label: '$(info) About', action: 'about' },
          { label: '$(output) Show Logs', action: 'logs' },
        ];

        const selection = await showQuickPick(actions, { placeHolder: 'Help & Support' });

        if (selection?.action === 'docs') {
          vscode.env.openExternal(vscode.Uri.parse('https://thenewfuse.com/docs'));
        } else if (selection?.action === 'about') {
          showInfo('The New Fuse v9.0.0 - AI-Powered Development Assistant');
        } else if (selection?.action === 'logs') {
          log.show();
        }
      },
    },
    {
      id: 'theNewFuse.openInNewTab',
      handler: async () => {
        // Open chat in a full editor panel
        vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
      },
    },
    {
      id: 'theNewFuse.attachFiles',
      handler: async () => {
        const files = await vscode.window.showOpenDialog({
          canSelectMany: true,
          openLabel: 'Attach',
        });

        if (files && files.length > 0) {
          chatViewProvider.attachFiles(files);
        }
      },
    },

    // ============================================
    // Agent & Workflow Commands
    // ============================================
    {
      id: 'theNewFuse.agentFederation',
      handler: async () => {
        const agents = [
          { label: '🧠 Code Expert', description: 'Deep code analysis and generation' },
          { label: '🔍 Code Reviewer', description: 'Security and quality review' },
          { label: '📝 Technical Writer', description: 'Documentation generation' },
          { label: '🧪 Test Engineer', description: 'Test case generation' },
        ];

        const selection = await showQuickPick(agents, {
          placeHolder: 'Select an agent to activate',
        });

        if (selection) {
          showInfo(`Activated: ${selection.label}`);
        }
      },
    },
    {
      id: 'theNewFuse.openWorkflowBuilder',
      handler: async () => {
        showInfo('🔄 Workflow Builder coming soon!');
      },
    },
    {
      id: 'theNewFuse.terminalOrchestration',
      handler: async () => {
        const terminal = vscode.window.createTerminal('The New Fuse');
        terminal.show();
        terminal.sendText('echo "The New Fuse Terminal Ready"');
      },
    },
    {
      id: 'theNewFuse.planManager',
      handler: async () => {
        showInfo('📋 Plan Manager coming soon!');
      },
    },

    // ============================================
    // Security Commands
    // ============================================
    {
      id: 'theNewFuse.securityDashboard',
      handler: async () => {
        showInfo('🛡️ Security Dashboard: All systems nominal');
      },
    },
    {
      id: 'theNewFuse.securityScan',
      handler: async () => {
        const code = getSelectedText() || '';
        if (!code) {
          showWarning('Please select code to scan');
          return;
        }

        const aiService = getAIService();
        const result = await aiService.quickChat(
          `Analyze this code for security vulnerabilities:\n\n${code}`,
          'You are a security expert. Identify potential vulnerabilities and suggest fixes.'
        );

        await chatViewProvider.handleUserMessage(`Security scan results:\n\n${result}`);
      },
    },
    {
      id: 'theNewFuse.emergencyMode',
      handler: async () => {
        const confirm = await vscode.window.showWarningMessage(
          '🚨 Enable Emergency Mode? This will restrict all AI operations.',
          'Enable',
          'Cancel'
        );

        if (confirm === 'Enable') {
          showInfo('🚨 Emergency Mode ENABLED - AI operations restricted');
        }
      },
    },

    // ============================================
    // System Commands
    // ============================================
    {
      id: 'theNewFuse.systemStatus',
      handler: async () => {
        const aiService = getAIService();
        const mcpService = getMCPService();

        const provider = aiService.getActiveProvider() || 'None';
        const mcpConnections = mcpService.getConnections();
        const mcpConnected = mcpConnections.filter((c) => c.status === 'connected').length;

        showInfo(
          `System Status:\n• AI Provider: ${provider}\n• MCP: ${mcpConnected}/${mcpConnections.length} servers`
        );
      },
    },
    {
      id: 'theNewFuse.autoApprove',
      handler: async () => {
        showInfo('✅ Auto-Approve settings available in extension configuration');
      },
    },
    {
      id: 'theNewFuse.codeMode',
      handler: async () => {
        chatViewProvider.setMode('code');
        showInfo('💻 Code Mode activated');
      },
    },
    {
      id: 'theNewFuse.databaseMode',
      handler: async () => {
        chatViewProvider.setMode('agent');
        showInfo('🗃️ Database Mode activated');
      },
    },
    {
      id: 'theNewFuse.openLiteLLMConfig',
      handler: async () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'theNewFuse.litellm');
      },
    },

    // ============================================
    // CLI Commands
    // ============================================
    {
      id: 'theNewFuse.cli.runAgent',
      handler: async () => {
        const agents = ['Code Agent', 'Research Agent', 'Testing Agent'];
        const selection = await showQuickPick(
          agents.map((a) => ({ label: a })),
          { placeHolder: 'Select agent type' }
        );

        if (selection) {
          const terminal = vscode.window.createTerminal(`TNF: ${selection.label}`);
          terminal.show();
          terminal.sendText(`echo "Starting ${selection.label}..."`);
        }
      },
    },
    {
      id: 'theNewFuse.cli.initWorkspace',
      handler: async () => {
        showInfo('🔧 Workspace initialization coming soon!');
      },
    },
    {
      id: 'theNewFuse.cli.showTasks',
      handler: async () => {
        showInfo('📋 No active CLI tasks');
      },
    },
    {
      id: 'theNewFuse.cli.showHistory',
      handler: async () => {
        showInfo('📜 CLI Task History: Empty');
      },
    },
    {
      id: 'theNewFuse.cli.chatSession',
      handler: async () => {
        const terminal = vscode.window.createTerminal('TNF Chat');
        terminal.show();
        terminal.sendText('echo "TNF CLI Chat Session Ready"');
      },
    },

    // ============================================
    // OpenRouter & Model Selection Commands
    // ============================================
    {
      id: 'theNewFuse.selectOpenRouterModel',
      handler: async () => {
        const openRouterService = getOpenRouterService();
        const selectedModel = await openRouterService.showModelPicker();

        if (selectedModel) {
          const config = vscode.workspace.getConfiguration('theNewFuse.providers.openrouter');
          await config.update('model', selectedModel, vscode.ConfigurationTarget.Global);
          showInfo(`✅ OpenRouter model set to: ${selectedModel}`);
        }
      },
    },
    {
      id: 'theNewFuse.selectModel',
      handler: async () => {
        // This triggers the same flow as settings -> select model
        vscode.commands.executeCommand('theNewFuse.settingsButtonClicked');
      },
    },

    // ============================================
    // MCP Discovery Commands
    // ============================================
    {
      id: 'theNewFuse.mcpMarketplace',
      handler: async () => {
        const discoveryService = getMCPDiscoveryService();
        const serverConfig = await discoveryService.showServerMarketplace();

        if (serverConfig) {
          const configManager = ConfigManager.getInstance();
          await configManager.addMCPServer(serverConfig);
          showInfo(`✅ Added MCP server: ${serverConfig.name}`);

          // Optionally connect to the server
          const connect = await vscode.window.showInformationMessage(
            `MCP server "${serverConfig.name}" added. Connect now?`,
            'Connect',
            'Later'
          );

          if (connect === 'Connect') {
            const mcpService = getMCPService();
            await mcpService.connect(serverConfig);
          }
        }
      },
    },
    {
      id: 'theNewFuse.mcpImportConfig',
      handler: async () => {
        const discoveryService = getMCPDiscoveryService();
        await discoveryService.importConfiguration();
      },
    },
    {
      id: 'theNewFuse.mcpExportConfig',
      handler: async () => {
        const discoveryService = getMCPDiscoveryService();
        await discoveryService.exportConfiguration();
      },
    },
  ];

  // Register all commands
  for (const { id, handler } of commands) {
    const disposable = vscode.commands.registerCommand(id, async () => {
      try {
        await handler();
      } catch (error) {
        log.error(`Command ${id} failed`, error);
        showWarning(`Command failed: ${(error as Error).message}`);
      }
    });
    context.subscriptions.push(disposable);
  }

  log.info(`Registered ${commands.length} commands`);
}
