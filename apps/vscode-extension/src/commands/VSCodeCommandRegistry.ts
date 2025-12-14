import * as vscode from 'vscode';
import { ChatViewProvider } from '../ChatViewProvider';
import { VSCodeCommandAdapter } from './VSCodeCommandAdapter';

// Import Handlers
import {
  ClearChatHandler,
  NewChatHandler,
  SendMessageHandler,
} from './handlers/ChatCommandHandlers';

import { MCPConnectHandler, MCPStatusHandler } from './handlers/MCPCommandHandlers';

import {
  AttachFilesHandler,
  ConfigureLLMProvidersHandler,
  HelpButtonClickedHandler,
  HistoryButtonClickedHandler,
  MarketplaceButtonClickedHandler,
  ProfileButtonClickedHandler,
  SettingsButtonClickedHandler,
} from './handlers/UICommandHandlers';

import {
  AddToContextHandler,
  ExplainCodeHandler,
  FixCodeHandler,
  GenerateCommitMessageHandler,
  ImproveCodeHandler,
} from './handlers/CodeCommandHandlers';

import {
  AgentFederationHandler,
  PlanManagerHandler,
  SecurityScanHandler,
  TerminalOrchestrationHandler,
} from './handlers/AgentCommandHandlers';

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

  public registerAllCommands(): void {
    console.log('🔧 Registering VSCode commands with unified architecture...');

    // Also store in global state for fallback access
    this.extensionContext.globalState.update('chatProvider', this.chatProvider);

    this.registerChatCommands();
    this.registerMCPCommands();
    this.registerUICommands();
    this.registerCodeCommands();
    this.registerAgentCommands();

    console.log('✅ All VSCode commands registered successfully');
  }

  private registerChatCommands(): void {
    const send = new SendMessageHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.sendMessage', 'send-message', {
      execute: () => send.execute(this.chatProvider),
    });

    const clear = new ClearChatHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.clearChat', 'clear-chat', {
      execute: () => clear.execute(this.chatProvider),
    });

    const newChat = new NewChatHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.newChat', 'new-chat', {
      execute: () => newChat.execute(this.chatProvider),
    });
  }

  private registerMCPCommands(): void {
    const connect = new MCPConnectHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.mcpConnect', 'mcp-connect', {
      execute: () => connect.execute(this.chatProvider),
    });

    const status = new MCPStatusHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.mcpStatus', 'mcp-status', {
      execute: () => status.execute(this.chatProvider),
    });
  }

  private registerUICommands(): void {
    const history = new HistoryButtonClickedHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.historyButtonClicked', 'history-button', {
      execute: () => history.execute(this.chatProvider),
    });

    const market = new MarketplaceButtonClickedHandler();
    this.adapter.registerVSCodeCommand(
      'theNewFuse.marketplaceButtonClicked',
      'marketplace-button',
      { execute: () => market.execute(this.chatProvider) }
    );

    const profile = new ProfileButtonClickedHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.profileButtonClicked', 'profile-button', {
      execute: () => profile.execute(this.chatProvider),
    });

    const settings = new SettingsButtonClickedHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.settingsButtonClicked', 'settings-button', {
      execute: () => settings.execute(this.chatProvider),
    });

    const help = new HelpButtonClickedHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.helpButtonClicked', 'help-button', {
      execute: () => help.execute(this.chatProvider),
    });

    const attach = new AttachFilesHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.attachFiles', 'attach-files', {
      execute: () => attach.execute(this.chatProvider),
    });

    const configLLM = new ConfigureLLMProvidersHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.configureLLMProviders', 'config-llm', {
      execute: () => configLLM.execute(this.chatProvider),
    });

    this.adapter.registerVSCodeCommand('theNewFuse.openInNewTab', 'open-new-tab', {
      execute: async () => vscode.commands.executeCommand('workbench.action.webview.openWebView'),
    });
  }

  private registerCodeCommands(): void {
    const explain = new ExplainCodeHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.explainCode', 'explain-code', {
      execute: () => explain.execute(this.chatProvider),
    });

    const fix = new FixCodeHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.fixCode', 'fix-code', {
      execute: () => fix.execute(this.chatProvider),
    });

    const improve = new ImproveCodeHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.improveCode', 'improve-code', {
      execute: () => improve.execute(this.chatProvider),
    });

    const addContext = new AddToContextHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.addToContext', 'add-to-context', {
      execute: () => addContext.execute(this.chatProvider),
    });

    const genCommit = new GenerateCommitMessageHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.generateCommitMessage', 'gen-commit', {
      execute: () => genCommit.execute(this.chatProvider),
    });

    this.adapter.registerVSCodeCommand('theNewFuse.inlineSuggestions', 'inline-suggestions', {
      execute: async () =>
        vscode.window.showInformationMessage('Inline suggestions available within editor (Ctrl+I)'),
    });

    this.adapter.registerVSCodeCommand('theNewFuse.codeActions', 'code-actions', {
      execute: async () =>
        vscode.window.showInformationMessage('Code actions available via Right Click'),
    });
  }

  private registerAgentCommands(): void {
    const fed = new AgentFederationHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.agentFederation', 'agent-federation', {
      execute: () => fed.execute(this.chatProvider),
    });

    const term = new TerminalOrchestrationHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.terminalOrchestration', 'terminal-orch', {
      execute: () => term.execute(this.chatProvider),
    });

    const plan = new PlanManagerHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.planManager', 'plan-manager', {
      execute: () => plan.execute(this.chatProvider),
    });

    const scan = new SecurityScanHandler();
    this.adapter.registerVSCodeCommand('theNewFuse.securityScan', 'security-scan', {
      execute: () => scan.execute(this.chatProvider),
    });

    this.adapter.registerVSCodeCommand('theNewFuse.securityDashboard', 'security-dashboard', {
      execute: async () => this.chatProvider?.showSecurityDashboard(),
    });

    this.adapter.registerVSCodeCommand('theNewFuse.cli.runAgent', 'cli-run-agent', {
      execute: async () =>
        vscode.window.showInformationMessage('CLI Agent Run: Feature coming in v8.1'),
    });
    this.adapter.registerVSCodeCommand('theNewFuse.cli.initWorkspace', 'cli-init', {
      execute: async () => vscode.window.showInformationMessage('CLI Init: Feature coming in v8.1'),
    });
  }

  public dispose(): void {
    this.adapter.dispose();
  }
}

export class VSCodeCommandRegistryFactory {
  static createAndRegister(
    extensionContext: vscode.ExtensionContext,
    chatProvider: ChatViewProvider
  ): VSCodeCommandRegistry {
    const adapter = new VSCodeCommandAdapter(extensionContext);
    const registry = new VSCodeCommandRegistry(adapter, extensionContext, chatProvider);
    registry.registerAllCommands();
    return registry;
  }
}
