/**
 * The New Fuse VSCode Extension
 * Version 9.1.0 - Frontier Capabilities
 *
 * Main extension entry point
 * Now with tool orchestration, workspace awareness, and streaming support
 */

import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { ConfigManager } from './core/config';
import { LLMProviderType, MCPServerConfig, RegisteredAgent, TheNewFuseAPI } from './core/types';
import { ChatViewProvider } from './providers/ChatViewProvider';
import { AIService, getAIService } from './services/AIService';
import { ChatService } from './services/ChatService';
import { MCPService, getMCPService } from './services/MCPService';
import { ToolOrchestrationService } from './services/ToolOrchestrationService';
import { WorkspaceService } from './services/WorkspaceService';
import { log, logger } from './utils/logger';

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext): Promise<TheNewFuseAPI> {
  log.info('🚀 The New Fuse v9.1.0 (Frontier Capabilities) activating...');
  const startTime = Date.now();

  try {
    // Initialize configuration manager
    ConfigManager.initialize(context);
    log.info('✓ Configuration manager initialized');

    // Initialize services
    await initializeServices();
    log.info('✓ Services initialized');

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

    // Register all commands
    registerCommands(context, chatViewProvider);
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
 * Initialize all services
 * Now includes Workspace and Tool Orchestration services
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

  // Initialize Workspace Service (NEW in v9.1.0)
  const workspaceService = WorkspaceService.getInstance();
  // Workspace service is ready immediately (singleton pattern)
  log.debug('✓ Workspace Service ready');

  // Initialize Tool Orchestration Service (NEW in v9.1.0)
  const orchestrationService = ToolOrchestrationService.getInstance();
  // Orchestration service is ready immediately (singleton pattern)
  log.debug('✓ Tool Orchestration Service ready');

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
