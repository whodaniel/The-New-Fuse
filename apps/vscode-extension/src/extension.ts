import * as vscode from 'vscode';
import { ChatViewProvider } from './ChatViewProvider';
import { AIServiceManager } from './ai/AIServiceManager';
import { LLMProviderManager } from './ai/LLMProviderManager';
import { BackendConnector } from './integrations/BackendConnector';
import { MCPConnectionManager } from './mcp/MCPConnectionManager';
import { SecurityOrchestrator } from './security/SecurityOrchestrator';
import { LLMProviderPanel } from './views/LLMProviderPanel';

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

    // Basic commands
    context.subscriptions.push(
      vscode.commands.registerCommand('theNewFuse.sendMessage', () => {
        if (extensionState.chatViewProvider) {
          extensionState.chatViewProvider.sendMessage();
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('theNewFuse.clearChat', () => {
        if (extensionState.chatViewProvider) {
          extensionState.chatViewProvider.clearChat();
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('theNewFuse.newChat', () => {
        if (extensionState.chatViewProvider) {
          extensionState.chatViewProvider.newChat();
        }
      })
    );

    // MCP-related commands
    context.subscriptions.push(
      vscode.commands.registerCommand('theNewFuse.mcpConnect', async () => {
        vscode.window.showInformationMessage(
          '🔗 MCP Connect - Feature requires backend configuration'
        );
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('theNewFuse.mcpStatus', () => {
        vscode.window.showInformationMessage('📊 MCP Status - No servers connected');
      })
    );

    // UI toolbar button commands
    context.subscriptions.push(
      vscode.commands.registerCommand('theNewFuse.historyButtonClicked', async () => {
        if (extensionState.chatViewProvider) {
          await extensionState.chatViewProvider.historyButtonClicked();
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('theNewFuse.marketplaceButtonClicked', async () => {
        if (extensionState.chatViewProvider) {
          await extensionState.chatViewProvider.marketplaceButtonClicked();
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('theNewFuse.profileButtonClicked', async () => {
        if (extensionState.chatViewProvider) {
          await extensionState.chatViewProvider.profileButtonClicked();
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('theNewFuse.settingsButtonClicked', async () => {
        if (extensionState.chatViewProvider) {
          await extensionState.chatViewProvider.settingsButtonClicked();
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('theNewFuse.helpButtonClicked', () => {
        if (extensionState.chatViewProvider) {
          extensionState.chatViewProvider.showHelp();
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('theNewFuse.attachFiles', () => {
        if (extensionState.chatViewProvider) {
          extensionState.chatViewProvider.attachFiles();
        }
      })
    );

    // LLM Provider configuration command
    context.subscriptions.push(
      vscode.commands.registerCommand('theNewFuse.configureLLMProviders', () => {
        if (extensionState.llmProviderManager) {
          LLMProviderPanel.render(context.extensionUri, extensionState.llmProviderManager);
        }
      })
    );

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
    vscode.window.showInformationMessage(
      'The New Fuse backend is now ready with full AI and security features!'
    );
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
}
