import * as vscode from 'vscode';
import { VSCodeCommandAdapter } from './VSCodeCommandAdapter';
import { ChatViewProvider } from '../ChatViewProvider';

// Import all command handlers
import {
  SendMessageHandler,
  ClearChatHandler,
  NewChatHandler
} from './handlers/ChatCommandHandlers';

import {
  MCPConnectHandler,
  MCPStatusHandler
} from './handlers/MCPCommandHandlers';

import {
  HistoryButtonClickedHandler,
  MarketplaceButtonClickedHandler,
  ProfileButtonClickedHandler,
  SettingsButtonClickedHandler,
  HelpButtonClickedHandler,
  AttachFilesHandler,
  ConfigureLLMProvidersHandler
} from './handlers/UICommandHandlers';

/**
 * VSCode Command Registry
 * 
 * This class manages the registration of all VSCode commands with the unified command architecture.
 * It maps VSCode command IDs to unified command types and registers the appropriate handlers.
 */
export class VSCodeCommandRegistry {
  private adapter: VSCodeCommandAdapter;
  private extensionContext: vscode.ExtensionContext;
  private chatProvider: ChatViewProvider;

  constructor(
    adapter: VSCodeCommandAdapter,
    extensionContext: vscode.ExtensionContext,
    chatProvider: ChatViewProvider
  ) {
    this.adapter = adapter;
    this.extensionContext = extensionContext;
    this.chatProvider = chatProvider;
  }

  /**
   * Register all VSCode commands with the unified command architecture
   */
  public registerAllCommands(): void {
    console.log('🔧 Registering VSCode commands with unified architecture...');

    // Store chat provider in extension context for handlers to access
    this.extensionContext.globalState.update('chatProvider', this.chatProvider);

    // Register chat commands
    this.registerChatCommands();

    // Register MCP commands
    this.registerMCPCommands();

    // Register UI commands
    this.registerUICommands();

    console.log('✅ All VSCode commands registered successfully');
  }

  /**
   * Register chat-related commands
   */
  private registerChatCommands(): void {
    // Send Message Command
    this.adapter.registerVSCodeCommand(
      'theNewFuse.sendMessage',
      'send-message',
      new SendMessageHandler(),
      {
        category: 'The New Fuse',
        title: 'Send Message',
        icon: '$(send)',
        enableProgress: true
      }
    );

    // Clear Chat Command
    this.adapter.registerVSCodeCommand(
      'theNewFuse.clearChat',
      'clear-chat',
      new ClearChatHandler(),
      {
        category: 'The New Fuse',
        title: 'Clear Chat',
        icon: '$(clear-all)'
      }
    );

    // New Chat Command
    this.adapter.registerVSCodeCommand(
      'theNewFuse.newChat',
      'new-chat',
      new NewChatHandler(),
      {
        category: 'The New Fuse',
        title: 'New Chat',
        icon: '$(add)'
      }
    );

    console.log('✅ Chat commands registered');
  }

  /**
   * Register MCP-related commands
   */
  private registerMCPCommands(): void {
    // MCP Connect Command
    this.adapter.registerVSCodeCommand(
      'theNewFuse.mcpConnect',
      'mcp-connect',
      new MCPConnectHandler(),
      {
        category: 'The New Fuse - MCP',
        title: '🔗 Connect MCP Server',
        icon: '$(plug)',
        enableProgress: true
      }
    );

    // MCP Status Command
    this.adapter.registerVSCodeCommand(
      'theNewFuse.mcpStatus',
      'mcp-status',
      new MCPStatusHandler(),
      {
        category: 'The New Fuse - MCP',
        title: '📊 MCP Server Status',
        icon: '$(graph)'
      }
    );

    console.log('✅ MCP commands registered');
  }

  /**
   * Register UI-related commands
   */
  private registerUICommands(): void {
    // History Button Command
    this.adapter.registerVSCodeCommand(
      'theNewFuse.historyButtonClicked',
      'history-button-clicked',
      new HistoryButtonClickedHandler(),
      {
        category: 'The New Fuse - History',
        title: '📚 Chat History',
        icon: '$(history)'
      }
    );

    // Marketplace Button Command
    this.adapter.registerVSCodeCommand(
      'theNewFuse.marketplaceButtonClicked',
      'marketplace-button-clicked',
      new MarketplaceButtonClickedHandler(),
      {
        category: 'The New Fuse - Marketplace',
        title: '🛍️ Extensions Marketplace',
        icon: '$(extensions)'
      }
    );

    // Profile Button Command
    this.adapter.registerVSCodeCommand(
      'theNewFuse.profileButtonClicked',
      'profile-button-clicked',
      new ProfileButtonClickedHandler(),
      {
        category: 'The New Fuse - Profile',
        title: '👤 User Profile',
        icon: '$(account)'
      }
    );

    // Settings Button Command
    this.adapter.registerVSCodeCommand(
      'theNewFuse.settingsButtonClicked',
      'settings-button-clicked',
      new SettingsButtonClickedHandler(),
      {
        category: 'The New Fuse - Settings',
        title: '⚙️ Settings',
        icon: '$(settings-gear)'
      }
    );

    // Help Button Command
    this.adapter.registerVSCodeCommand(
      'theNewFuse.helpButtonClicked',
      'help-button-clicked',
      new HelpButtonClickedHandler(),
      {
        category: 'The New Fuse - Help',
        title: '❓ Help & Documentation',
        icon: '$(question)'
      }
    );

    // Attach Files Command
    this.adapter.registerVSCodeCommand(
      'theNewFuse.attachFiles',
      'attach-files',
      new AttachFilesHandler(),
      {
        category: 'The New Fuse - Files',
        title: '📎 Attach Files',
        icon: '$(attach)'
      }
    );

    // Configure LLM Providers Command
    this.adapter.registerVSCodeCommand(
      'theNewFuse.configureLLMProviders',
      'configure-llm-providers',
      new ConfigureLLMProvidersHandler(),
      {
        category: 'The New Fuse - Configuration',
        title: '🤖 Configure LLM Providers',
        icon: '$(settings)'
      }
    );

    console.log('✅ UI commands registered');
  }

  /**
   * Get command registration statistics
   */
  public getRegistrationStats(): {
    totalCommands: number;
    chatCommands: number;
    mcpCommands: number;
    uiCommands: number;
  } {
    const stats = this.adapter.getCommandBus().getStats();
    
    return {
      totalCommands: stats.registeredHandlers,
      chatCommands: 3, // sendMessage, clearChat, newChat
      mcpCommands: 2,  // mcpConnect, mcpStatus
      uiCommands: 7    // history, marketplace, profile, settings, help, attachFiles, configureLLM
    };
  }

  /**
   * Dispose of all registered commands
   */
  public dispose(): void {
    this.adapter.dispose();
    console.log('🗑️ VSCode command registry disposed');
  }
}

/**
 * Command Registry Factory
 * 
 * Provides a convenient way to create and configure the command registry
 */
export class VSCodeCommandRegistryFactory {
  /**
   * Create a fully configured command registry
   */
  static create(
    extensionContext: vscode.ExtensionContext,
    chatProvider: ChatViewProvider
  ): VSCodeCommandRegistry {
    // Create the adapter
    const adapter = new VSCodeCommandAdapter(extensionContext);

    // Create the registry
    const registry = new VSCodeCommandRegistry(adapter, extensionContext, chatProvider);

    return registry;
  }

  /**
   * Create and register all commands in one step
   */
  static createAndRegister(
    extensionContext: vscode.ExtensionContext,
    chatProvider: ChatViewProvider
  ): VSCodeCommandRegistry {
    const registry = VSCodeCommandRegistryFactory.create(extensionContext, chatProvider);
    registry.registerAllCommands();
    return registry;
  }
}