import * as vscode from 'vscode';
import { ChatViewProvider } from '../../ChatViewProvider';
import { CommandHandler } from '../VSCodeCommandAdapter';

export class ExplainCodeHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    if (chatProvider) {
      await chatProvider.handleUserMessage('/explain');
    } else {
      vscode.window.showErrorMessage('Chat provider not available');
    }
  }
}

export class FixCodeHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    if (chatProvider) {
      await chatProvider.handleUserMessage('/fix');
    }
  }
}

export class ImproveCodeHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    if (chatProvider) {
      await chatProvider.handleUserMessage('/improve');
    }
  }
}

export class AddToContextHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor to add to context');
      return;
    }

    const selection = editor.selection;
    const text = editor.document.getText(selection);

    if (chatProvider) {
      // TODO: Implement a proper addContext method in ChatViewProvider
      // For now, we simulate by sending a system message or hidden context
      vscode.window.showInformationMessage('Added selection to context (Mock)');
    }
  }
}

export class GenerateCommitMessageHandler implements CommandHandler {
  async execute(chatProvider?: ChatViewProvider): Promise<void> {
    if (chatProvider) {
      await chatProvider.handleUserMessage('Generate a commit message for the current changes');
    }
  }
}
