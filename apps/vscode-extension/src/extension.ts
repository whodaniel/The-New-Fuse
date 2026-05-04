/**
 * The New Fuse VSCode Extension
 * Version 9.2.0 - Full TNF Ecosystem Integration
 *
 * Main extension entry point
 * With tool orchestration, workspace awareness, streaming, tnf.jsonc integration, and permission system
 */

import * as vscode from 'vscode';
import {
  EmbeddedBrowserProvider,
  registerBrowserCommands,
} from './browser/EmbeddedBrowserProvider';
import { registerCommands } from './commands';
import { ConfigManager } from './core/config';
import { LLMProviderType, MCPServerConfig, RegisteredAgent, TheNewFuseAPI } from './core/types';
import { ChatViewProvider } from './providers/ChatViewProvider';
import { AIService, getAIService } from './services/AIService';
import { ChatService } from './services/ChatService';
import { MCPService, getMCPService } from './services/MCPService';
import { ToolOrchestrationService } from './services/ToolOrchestrationService';
import { WorkspaceService } from './services/WorkspaceService';
import { WorkspaceSyncService } from './services/WorkspaceSyncService';
import {
  A2AProtocolService,
  AGUIProtocolService,
  AgentRegistryService,
  CollectiveOrchestratorService,
  MemoryBankService,
  ProtocolTranslationService,
  RelayServerService,
} from './services/tnf-framework';
import { RelayConnectionService, getRelayService, registerRelayCommands } from './services/RelayConnectionService';
import { log, logger } from './utils/logger';

let workspaceSyncService: WorkspaceSyncService | null = null;

export function getWorkspaceSyncService(): WorkspaceSyncService {
  if (!workspaceSyncService) {
    workspaceSyncService = new WorkspaceSyncService();
  }
  return workspaceSyncService;
}

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext): Promise<TheNewFuseAPI> {
  log.info('🚀 The New Fuse v9.2.0 (Full TNF Ecosystem Integration) activating...');
  const startTime = Date.now();

  try {
    // Initialize configuration manager
    ConfigManager.initialize(context);
    log.info('✓ Configuration manager initialized');

    // Initialize services
    await initializeServices(context);
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

    // Create and register embedded browser provider
    const browserProvider = new EmbeddedBrowserProvider(context.extensionUri);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(EmbeddedBrowserProvider.viewType, browserProvider, {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      })
    );
    registerBrowserCommands(context, browserProvider);
    log.info('✓ Embedded browser provider registered');

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

    // Show status bar item with TNF branding
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(fuse) TNF';
    statusBarItem.tooltip = 'The New Fuse - AI-Powered Development Platform';
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
 * Now includes Workspace, Tool Orchestration, and TNF Framework services
 */
async function initializeServices(context: vscode.ExtensionContext): Promise<void> {
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

  // Initialize MCP Service (non-blocking)
  const mcpService = MCPService.getInstance();
  mcpService.initialize().catch((error) => {
    log.warn('MCP service initialization failed (non-critical)', error);
  });
  log.debug('✓ MCP Service initializing');

  // ============================================
  // TNF Framework Services (v9.1.0)
  // ============================================

  // Initialize A2A Protocol Service
  A2AProtocolService.getInstance(context);
  await A2AProtocolService.getInstance()!.initialize();
  log.debug('✓ A2A Protocol Service ready');

  // Initialize Agent Registry Service
  AgentRegistryService.getInstance(context);
  await AgentRegistryService.getInstance()!.initialize();
  log.debug('✓ Agent Registry Service ready');

  // Initialize AG-UI Protocol Service
  AGUIProtocolService.getInstance(context);
  await AGUIProtocolService.getInstance()!.initialize();
  log.debug('✓ AG-UI Protocol Service ready');

  // Initialize Relay Server Service
  RelayServerService.getInstance(context);
  await RelayServerService.getInstance()!.initialize();
  log.debug('✓ Relay Server Service ready');

  // Initialize Protocol Translation Service
  ProtocolTranslationService.getInstance(context);
  await ProtocolTranslationService.getInstance()!.initialize();
  log.debug('✓ Protocol Translation Service ready');

  // Initialize Memory Bank Service
  MemoryBankService.getInstance(context);
  await MemoryBankService.getInstance()!.initialize();
  log.debug('✓ Memory Bank Service ready');

  // Initialize Collective Orchestrator Service
  CollectiveOrchestratorService.getInstance(context);
  await CollectiveOrchestratorService.getInstance()!.initialize();
  log.debug('✓ Collective Orchestrator Service ready');

  // Initialize Relay Connection Service
  registerRelayCommands(context);
  log.debug('✓ Relay Connection Service ready');
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

  // Disconnect from relay
  try {
    const relayService = getRelayService();
    relayService.disconnect();
  } catch {
    // Ignore errors during deactivation
  }

  // Dispose logger
  logger.dispose();

  log.info('The New Fuse deactivated');
}
