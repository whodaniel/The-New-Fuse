/**
 * The New Fuse VSCode Extension
 * Version 9.2.0 - Enhanced VSCode API Integration
 *
 * Main extension entry point
 * Now with tool orchestration, workspace awareness, streaming support,
 * and advanced VSCode API features (CodeLens, Hover, Completion, Diff View)
 */

import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { ConfigManager } from './core/config';
import { LLMProviderType, MCPServerConfig, RegisteredAgent, TheNewFuseAPI } from './core/types';
import { AICodeLensProvider, registerCodeLensCommands } from './providers/AICodeLensProvider';
import { AICompletionProvider, registerCompletionCommands } from './providers/AICompletionProvider';
import { AIHoverProvider, registerHoverCommands } from './providers/AIHoverProvider';
import { ChatViewProvider } from './providers/ChatViewProvider';
import { getDiffViewProvider } from './providers/DiffViewProvider';
import { AIService, getAIService } from './services/AIService';
import { ChatService } from './services/ChatService';
import { getGitIntegrationService } from './services/GitIntegrationService';
import { MCPService, getMCPService } from './services/MCPService';
import { ToolOrchestrationService } from './services/ToolOrchestrationService';
import { getWorkspaceIndexingService } from './services/WorkspaceIndexingService';
import { WorkspaceService } from './services/WorkspaceService';
import { log, logger } from './utils/logger';

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext): Promise<TheNewFuseAPI> {
  log.info('🚀 The New Fuse v9.2.0 (Enhanced VSCode API Integration) activating...');
  const startTime = Date.now();

  try {
    // Initialize configuration manager
    ConfigManager.initialize(context);
    log.info('✓ Configuration manager initialized');

    // Initialize services
    await initializeServices();
    log.info('✓ Services initialized');

    // Sync with global Fuse configuration (~/.tnf/providers.json)
    const globalSync = (
      await import('./services/GlobalSyncService.js')
    ).GlobalSyncService.getInstance();
    await globalSync.sync();
    log.info('✓ Global configuration synchronized');

    // Create and register chat view provider
    const chatViewProvider = new ChatViewProvider(context.extensionUri);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatViewProvider, {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      })
    );
    log.info('✓ Chat view provider registered');

    // Register Language Feature Providers
    registerLanguageProviders(context);
    log.info('✓ Language providers registered');

    // Register all commands (including new provider commands)
    registerCommands(context, chatViewProvider);
    registerCodeLensCommands(context);
    registerHoverCommands(context);
    registerCompletionCommands(context);
    log.info('✓ Commands registered');

    // Register configuration change listener
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('theNewFuse')) {
          handleConfigurationChange();
        }
      })
    );

    // Show status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(robot) TNF';
    statusBarItem.tooltip = 'The New Fuse AI Assistant';
    statusBarItem.command = 'theNewFuse.sendMessage';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    const elapsed = Date.now() - startTime;
    log.info(`✅ The New Fuse activated successfully in ${elapsed}ms`);

    vscode.window.setStatusBarMessage('$(check) The New Fuse Ready', 3000);

    // Return the Extension API
    return new ExtensionAPI(chatViewProvider);
  } catch (error) {
    log.error('Extension activation failed', error);
    vscode.window.showErrorMessage(`The New Fuse failed to activate: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * API Implementation for other extensions to consume
 */
class ExtensionAPI implements TheNewFuseAPI {
  constructor(private chatViewProvider: ChatViewProvider) {}

  registerAgent(agent: RegisteredAgent): void {
    log.info(`API: Registering agent ${agent.name} (${agent.id})`);
    // TODO: Register agent with orchestration service
    // For now, we can add it to the CLI Agents configuration if it doesn't exist
    const config = ConfigManager.getInstance();
    const existing = config.getCLIAgentConfig(agent.id as LLMProviderType);

    if (!existing) {
      config.addCLIAgent({
        name: agent.name,
        command: `agent-bridge --id ${agent.id}`, // Placeholder command
        args: [],
        inputFormat: 'stdin',
        outputFormat: 'json',
        enabled: true,
        timeout: 60000,
      });
    }
  }

  async sendMessage(message: string, context?: unknown): Promise<void> {
    log.info('API: Sending message');
    // We can expose a method on ChatViewProvider to inject messages
    // This requires a minor update to ChatViewProvider to publicize 'addMessageToChat' functionality
    // For now, we'll assume the provider has a way to handle this or we can add it.
    // Ideally, we'd use the ChatService directly but the View controls the UI.

    // As a temporary workaround if the method doesn't exist on public interface:
    vscode.commands.executeCommand('theNewFuse.sendMessage', message);
  }

  getActiveProvider(): LLMProviderType | null {
    const aiService = AIService.getInstance();
    return aiService.getActiveProvider();
  }

  getMCPServers(): MCPServerConfig[] {
    const mcpService = MCPService.getInstance();
    // Assuming MCPService has a method to get servers, or we use ConfigManager
    const config = ConfigManager.getInstance();
    return config.getMCPServers();
  }
}

/**
 * Register all language feature providers
 * NEW in v9.2.0: CodeLens, Hover, Completion providers
 */
function registerLanguageProviders(context: vscode.ExtensionContext): void {
  const supportedLanguages = [
    'typescript',
    'javascript',
    'typescriptreact',
    'javascriptreact',
    'python',
    'java',
    'csharp',
    'go',
    'rust',
    'cpp',
    'c',
    'php',
    'ruby',
  ];

  // Register CodeLens Provider
  const codeLensProvider = AICodeLensProvider.getInstance();
  for (const language of supportedLanguages) {
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider({ language }, codeLensProvider)
    );
  }
  log.debug('✓ CodeLens provider registered for supported languages');

  // Register Hover Provider
  const hoverProvider = AIHoverProvider.getInstance();
  for (const language of supportedLanguages) {
    context.subscriptions.push(vscode.languages.registerHoverProvider({ language }, hoverProvider));
  }
  log.debug('✓ Hover provider registered for supported languages');

  // Register Completion Provider
  const completionProvider = AICompletionProvider.getInstance();
  for (const language of supportedLanguages) {
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        { language },
        completionProvider,
        '.', // Trigger on dot
        '(', // Trigger on open paren
        '{', // Trigger on open brace
        ' ' // Trigger on space
      )
    );
  }
  log.debug('✓ Completion provider registered for supported languages');
}

/**
 * Initialize all services
 * Now includes Workspace Indexing and Git Integration services
 */
async function initializeServices(): Promise<void> {
  // Initialize AI Service
  const aiService = AIService.getInstance();
  await aiService.initialize();
  log.debug('✓ AI Service ready');

  // Initialize Chat Service
  const chatService = ChatService.getInstance();
  await chatService.initialize();
  log.debug('✓ Chat Service ready');

  // Initialize Workspace Service
  const workspaceService = WorkspaceService.getInstance();
  log.debug('✓ Workspace Service ready');

  // Initialize Tool Orchestration Service
  const orchestrationService = ToolOrchestrationService.getInstance();
  log.debug('✓ Tool Orchestration Service ready');

  // Initialize Workspace Indexing Service (NEW in v9.2.0)
  const indexingService = getWorkspaceIndexingService();
  indexingService.initialize().catch((error) => {
    log.warn('Workspace indexing failed (non-critical)', error);
  });
  log.debug('✓ Workspace Indexing Service initializing');

  // Initialize Git Integration Service (NEW in v9.2.0)
  const gitService = getGitIntegrationService();
  await gitService.initialize();
  log.debug('✓ Git Integration Service ready');

  // Initialize MCP Service (non-blocking)
  const mcpService = MCPService.getInstance();
  mcpService.initialize().catch((error) => {
    log.warn('MCP service initialization failed (non-critical)', error);
  });
  log.debug('✓ MCP Service initializing');
}

/**
 * Handle configuration changes
 */
async function handleConfigurationChange(): Promise<void> {
  log.debug('Configuration changed, reinitializing services...');

  try {
    const aiService = getAIService();
    await aiService.initialize();
  } catch (error) {
    log.error('Failed to reinitialize after config change', error);
  }
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
  log.info('The New Fuse deactivating...');

  // Dispose all providers
  try {
    const codeLensProvider = AICodeLensProvider.getInstance();
    codeLensProvider.dispose();

    const hoverProvider = AIHoverProvider.getInstance();
    hoverProvider.dispose();

    const completionProvider = AICompletionProvider.getInstance();
    completionProvider.dispose();

    const diffViewProvider = getDiffViewProvider();
    diffViewProvider.dispose();

    log.debug('✓ Providers disposed');
  } catch {
    // Ignore errors during deactivation
  }

  // Dispose services
  try {
    const indexingService = getWorkspaceIndexingService();
    indexingService.dispose();

    const gitService = getGitIntegrationService();
    gitService.dispose();

    log.debug('✓ Services disposed');
  } catch {
    // Ignore errors during deactivation
  }

  // Disconnect MCP servers
  try {
    const mcpService = getMCPService();
    mcpService.disconnectAll().catch(() => {});
  } catch {
    // Ignore errors during deactivation
  }

  // Cancel any pending AI requests
  try {
    const aiService = getAIService();
    aiService.cancelAllRequests();
  } catch {
    // Ignore errors during deactivation
  }

  // Dispose logger
  logger.dispose();

  log.info('The New Fuse deactivated');
}
