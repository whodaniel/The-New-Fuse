
import * as vscode from 'vscode';
import { ChatViewProvider } from './ChatViewProvider';
import { SecurityOrchestrator } from './security/SecurityOrchestrator';
import { AIServiceManager } from './ai/AIServiceManager';
import { MCPConnectionManager } from './mcp/MCPConnectionManager';
import { LLMProviderManager } from './ai/LLMProviderManager';
import { LLMProviderPanel } from './views/LLMProviderPanel';
import { VSCodeCommandRegistryFactory } from './commands/VSCodeCommandRegistry';

/**
 * Refactored VSCode Extension using Unified Command Architecture
 * 
 * This extension now uses the @the-new-fuse/commands-core package for unified
 * command handling, providing better separation of concerns, error handling,
 * and extensibility.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('🚀 The New Fuse extension is being activated (v8.0.0 - Unified Command Architecture)');

  try {
    // Initialize LLM Provider Manager
    const llmProviderManager = new LLMProviderManager(context);
    await llmProviderManager.initialize();
    console.log('✅ LLM Provider Manager initialized');

    // Create provider with null dependencies initially (will use fallbacks) + context for MCP config
    const provider = new ChatViewProvider(context.extensionUri, null, null, null, context);

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider));

    // Initialize the unified command architecture
    const commandRegistry = VSCodeCommandRegistryFactory.createAndRegister(context, provider);
    console.log('✅ Unified command architecture initialized');

    // Store command registry in context for cleanup
    context.subscriptions.push({
      dispose: () => commandRegistry.dispose()
    });

    // Initialize backend asynchronously (non-blocking)
    initializeBackend(context, provider, commandRegistry).catch(error => {
      console.error('Backend initialization failed:', error);
      vscode.window.showWarningMessage(
        'The New Fuse backend initialization failed. Extension will continue in Simple Mode with limited features.'
      );
    });

    // Register LLM Provider configuration command (kept separate for now)
    context.subscriptions.push(
      vscode.commands.registerCommand('theNewFuse.configureLLMProviders', () => {
        LLMProviderPanel.render(context.extensionUri, llmProviderManager);
      }));

    console.log('✅ The New Fuse extension activated successfully - Unified command architecture ready');

  } catch (error) {
    console.error('Extension activation failed:', error);
    vscode.window.showErrorMessage(
      `Failed to activate The New Fuse extension: ${(error as Error).message}`
    );
    throw error;
  }
}

/**
 * Initialize backend services asynchronously
 */
async function initializeBackend(
  context: vscode.ExtensionContext,
  provider: ChatViewProvider,
  commandRegistry: VSCodeCommandRegistryFactory
): Promise<void> {
  console.log('🔧 Starting backend initialization...');

  try {
    // Initialize Security Orchestrator
    console.log('  - Initializing Security Orchestrator...');
    const securityOrchestrator = new SecurityOrchestrator(context);
    await securityOrchestrator.initialize();
    console.log('  ✅ Security Orchestrator initialized');

    // Initialize AI Service Manager
    console.log('  - Initializing AI Service Manager...');
    const aiServiceManager = new AIServiceManager(securityOrchestrator);
    await aiServiceManager.initialize();
    console.log('  ✅ AI Service Manager initialized');

    // Initialize MCP Connection Manager
    console.log('  - Initializing MCP Connection Manager...');
    const mcpConnectionManager = new MCPConnectionManager(context, securityOrchestrator);
    await mcpConnectionManager.initialize();
    console.log('  ✅ MCP Connection Manager initialized');

    // Update provider with backend services
    provider.updateBackend(securityOrchestrator, aiServiceManager, mcpConnectionManager);

    // Update command handlers with backend services
    await updateCommandHandlersWithBackend(commandRegistry, {
      securityOrchestrator,
      aiServiceManager,
      mcpConnectionManager,
      llmProviderManager: new LLMProviderManager(context)
    });

    console.log('✅ Backend initialization complete!');
    vscode.window.showInformationMessage('The New Fuse backend is now ready with full AI and security features!');

  } catch (error) {
    console.error('Backend initialization error:', error);
    throw error;
  }
}

/**
 * Update command handlers with backend services
 */
async function updateCommandHandlersWithBackend(
  commandRegistry: VSCodeCommandRegistryFactory,
  services: {
    securityOrchestrator: SecurityOrchestrator;
    aiServiceManager: AIServiceManager;
    mcpConnectionManager: MCPConnectionManager;
    llmProviderManager: LLMProviderManager;
  }
): Promise<void> {
  // Store backend services in extension context for command handlers to access
  const context = commandRegistry['extensionContext'] as vscode.ExtensionContext;
  
  await context.globalState.update('backendServices', {
    securityOrchestrator: services.securityOrchestrator,
    aiServiceManager: services.aiServiceManager,
    mcpConnectionManager: services.mcpConnectionManager,
    llmProviderManager: services.llmProviderManager
  });

  console.log('✅ Command handlers updated with backend services');
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
  console.log('The New Fuse extension deactivated');
}

/**
 * Get extension statistics
 */
export function getExtensionStats(context: vscode.ExtensionContext): {
  version: string;
  commandsRegistered: number;
  backendInitialized: boolean;
  uptime: number;
} {
  const startTime = context.globalState.get('extensionStartTime') as number;
  const backendServices = context.globalState.get('backendServices');
  
  return {
    version: '8.0.0',
    commandsRegistered: 12, // Total number of registered commands
    backendInitialized: !!backendServices,
    uptime: startTime ? Date.now() - startTime : 0
  };
}

/**
 * Health check for the extension
 */
export async function performHealthCheck(context: vscode.ExtensionContext): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
  }>;
}> {
  const checks = [];
  
  // Check command registry
  try {
    const commandRegistry = context.globalState.get('commandRegistry');
    checks.push({
      name: 'Command Registry',
      status: commandRegistry ? 'pass' : 'fail',
      message: commandRegistry ? 'Commands registered successfully' : 'Command registry not found'
    });
  } catch (error) {
    checks.push({
      name: 'Command Registry',
      status: 'fail',
      message: `Error: ${(error as Error).message}`
    });
  }

  // Check backend services
  try {
    const backendServices = context.globalState.get('backendServices');
    checks.push({
      name: 'Backend Services',
      status: backendServices ? 'pass' : 'warn',
      message: backendServices ? 'Backend services initialized' : 'Backend services not initialized'
    });
  } catch (error) {
    checks.push({
      name: 'Backend Services',
      status: 'fail',
      message: `Error: ${(error as Error).message}`
    });
  }

  // Check chat provider
  try {
    const chatProvider = context.globalState.get('chatProvider');
    checks.push({
      name: 'Chat Provider',
      status: chatProvider ? 'pass' : 'fail',
      message: chatProvider ? 'Chat provider available' : 'Chat provider not found'
    });
  } catch (error) {
    checks.push({
      name: 'Chat Provider',
      status: 'fail',
      message: `Error: ${(error as Error).message}`
    });
  }

  // Determine overall status
  const failedChecks = checks.filter(check => check.status === 'fail');
  const warnChecks = checks.filter(check => check.status === 'warn');
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (failedChecks.length > 0) {
    status = 'unhealthy';
  } else if (warnChecks.length > 0) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  return { status, checks };
}