import * as vscode from 'vscode';
import { ChatViewProvider } from './ChatViewProvider';
import { AIServiceManager } from './ai/AIServiceManager';
import { LLMProviderManager } from './ai/LLMProviderManager';
import {
  VSCodeCommandRegistry,
  VSCodeCommandRegistryFactory,
} from './commands/VSCodeCommandRegistry';
import { BackendConnector } from './integrations/BackendConnector';
import { MCPConnectionManager } from './mcp/MCPConnectionManager';
import { SecurityOrchestrator } from './security/SecurityOrchestrator';

/**
 * Extension initialization state
 */
interface ExtensionState {
  isInitialized: boolean;
  isInitializing: boolean;
  securityOrchestrator?: SecurityOrchestrator;
  aiServiceManager?: AIServiceManager;
  mcpConnectionManager?: MCPConnectionManager;
  llmProviderManager?: LLMProviderManager;
  chatViewProvider?: ChatViewProvider;
  backendConnector?: BackendConnector;
  commandRegistry?: VSCodeCommandRegistry;
}

// Global extension state
const extensionState: ExtensionState = {
  isInitialized: false,
  isInitializing: false,
};

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log(
    '🚀 The New Fuse extension is being activated (v8.0.0 - Enhanced LiteLLM Integration)'
  );

  // Prevent multiple initializations
  if (extensionState.isInitializing) {
    console.log('⏳ Extension is already initializing, waiting...');
    while (extensionState.isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return;
  }

  if (extensionState.isInitialized) {
    console.log('✅ Extension already initialized');
    return;
  }

  extensionState.isInitializing = true;

  try {
    // Initialize LLM Provider Manager
    extensionState.llmProviderManager = new LLMProviderManager(context);
    await extensionState.llmProviderManager.initialize();
    console.log('✅ LLM Provider Manager initialized');

    // Create provider with null dependencies initially (will use fallbacks) + context for MCP config
    extensionState.chatViewProvider = new ChatViewProvider(
      context.extensionUri,
      null,
      null,
      null,
      context
    );

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        ChatViewProvider.viewType,
        extensionState.chatViewProvider
      )
    );

    // Initialize backend asynchronously (non-blocking)
    initializeBackend(context, extensionState.chatViewProvider).catch((error) => {
      console.error('Backend initialization failed:', error);
      vscode.window.showWarningMessage(
        'The New Fuse backend initialization failed. Extension will continue in Simple Mode with limited features.'
      );
    });

    // Register ALL commands using the Registry
    extensionState.commandRegistry = VSCodeCommandRegistryFactory.createAndRegister(
      context,
      extensionState.chatViewProvider
    );
    console.log('✅ All commands registered via Registry');

    // LLM Provider configuration command (if not covered by registry, but it IS covered now)
    // Kept for explicit fallback or specific panel logic if needed, but registry handles 'theNewFuse.configureLLMProviders'
    // Just ensuring panel logic is accessible if registry uses a handler.
    // The handler ConfigureLLMProvidersHandler in UICommandHandlers should normally call LLMProviderPanel.render
    // Let's assume the handler does the right thing.

    extensionState.isInitialized = true;
    console.log(
      '✅ The New Fuse extension activated successfully - Backend initializing in background'
    );
  } catch (error) {
    console.error('Extension activation failed:', error);
    extensionState.isInitializing = false;
    throw error;
  } finally {
    extensionState.isInitializing = false;
  }
}

/**
 * Initialize backend services asynchronously
 */
async function initializeBackend(
  context: vscode.ExtensionContext,
  provider: ChatViewProvider
): Promise<void> {
  console.log('🔧 Starting backend initialization...');

  // Prevent multiple backend initializations
  if (extensionState.securityOrchestrator) {
    console.log('🔧 Backend already initialized');
    return;
  }

  try {
    // Initialize Backend Connector (Orchestrator API)
    console.log('  - Initializing Backend Connector...');
    extensionState.backendConnector = new BackendConnector(context);
    await extensionState.backendConnector.initialize();
    console.log('  ✅ Backend Connector registered with Orchestrator');

    // Initialize Security Orchestrator
    console.log('  - Initializing Security Orchestrator...');
    extensionState.securityOrchestrator = new SecurityOrchestrator(context);
    await extensionState.securityOrchestrator.initialize();
    console.log('  ✅ Security Orchestrator initialized');

    // Initialize AI Service Manager
    console.log('  - Initializing AI Service Manager...');
    extensionState.aiServiceManager = new AIServiceManager(extensionState.securityOrchestrator);
    await extensionState.aiServiceManager.initialize();
    console.log('  ✅ AI Service Manager initialized');

    // Initialize MCP Connection Manager
    console.log('  - Initializing MCP Connection Manager...');
    extensionState.mcpConnectionManager = new MCPConnectionManager(
      context,
      extensionState.securityOrchestrator
    );
    await extensionState.mcpConnectionManager.initialize();
    console.log('  ✅ MCP Connection Manager initialized');

    // Update provider with backend services
    provider.updateBackend(
      extensionState.securityOrchestrator,
      extensionState.aiServiceManager,
      extensionState.mcpConnectionManager
    );

    console.log('✅ Backend initialization complete!');
    vscode.window.setStatusBarMessage('$(check) TNF Backend Ready', 5000);
  } catch (error) {
    console.error('Backend initialization error:', error);
    // Clean up partial state on failure
    extensionState.securityOrchestrator = undefined;
    extensionState.aiServiceManager = undefined;
    extensionState.mcpConnectionManager = undefined;
    extensionState.backendConnector = undefined;
    throw error;
  }
}

export function deactivate(): void {
  console.log('The New Fuse extension deactivated');

  // Dispose registry
  if (extensionState.commandRegistry) {
    extensionState.commandRegistry.dispose();
  }

  // Dispose backend connector
  if (extensionState.backendConnector) {
    extensionState.backendConnector.dispose();
  }

  // Clean up extension state
  extensionState.isInitialized = false;
  extensionState.isInitializing = false;
  extensionState.securityOrchestrator = undefined;
  extensionState.aiServiceManager = undefined;
  extensionState.mcpConnectionManager = undefined;
  extensionState.llmProviderManager = undefined;
  extensionState.chatViewProvider = undefined;
  extensionState.backendConnector = undefined;
  extensionState.commandRegistry = undefined;
}
