import * as vscode from 'vscode';
import { ChatViewProvider } from '../../ChatViewProvider';
import { CommandHandler } from '../VSCodeCommandAdapter';

export class HistoryButtonClickedHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    if (chatProvider) {
      await chatProvider.historyButtonClicked();
    }
  }
}

export class MarketplaceButtonClickedHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    if (chatProvider) {
      await chatProvider.marketplaceButtonClicked();
    }
  }
}

export class ProfileButtonClickedHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    if (chatProvider) {
      await chatProvider.profileButtonClicked();
    }
  }
}

export class SettingsButtonClickedHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    if (chatProvider) {
      await chatProvider.settingsButtonClicked();
    }
  }
}

export class HelpButtonClickedHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    const helpContent = `
**The New Fuse Help Center**

**Quick Start Guide:**
1. **Basic Chat**: Type messages to interact with AI
2. **Code Actions**: Right-click code for AI assistance
3. **Slash Commands**: Type / for commands
4. **Agent Federation**: Coordinate multiple AI agents

**Keyboard Shortcuts:**
• Ctrl+Shift+A: Focus chat input
• Ctrl+I: Inline code suggestions

**Command Reference:**
• /explain - Explain code
• /fix - Fix code
• /agent - Switch agents
    `.trim();
    // We can't access context directly here easily unless passed, but we can use vscode.window
    await vscode.window.showInformationMessage(helpContent, { modal: true });
  }
}

export class AttachFilesHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    if (chatProvider) {
      chatProvider.handleAttachFiles();
    }
  }
}

export class ConfigureLLMProvidersHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    await vscode.commands.executeCommand('theNewFuse.configureLLMProviders');
  }
}
