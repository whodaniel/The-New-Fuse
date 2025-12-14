import * as vscode from 'vscode';

export interface CommandHandler {
  execute(...args: any[]): Promise<any>;
}

export class VSCodeCommandAdapter {
  private extensionContext: vscode.ExtensionContext;
  private registeredCommands: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.extensionContext = context;
  }

  public registerVSCodeCommand(
    commandId: string,
    _internalId: string, // Unused in simple adapter
    handler: CommandHandler | { execute: (...args: any[]) => Promise<any> },
    options?: any
  ): void {
    const disposable = vscode.commands.registerCommand(commandId, async (...args: any[]) => {
      try {
        // If the handler needs the ChatProvider, it should have been injected or bound
        // VSCodeCommandRegistry should handle binding the provider if needed
        await handler.execute(...args);
      } catch (error) {
        console.error(`Command ${commandId} failed:`, error);
        vscode.window.showErrorMessage(`Command failed: ${(error as Error).message}`);
      }
    });

    this.extensionContext.subscriptions.push(disposable);
    this.registeredCommands.push(disposable);
    console.log(`✅ Registered command: ${commandId}`);
  }

  public dispose(): void {
    this.registeredCommands.forEach((d) => d.dispose());
    this.registeredCommands = [];
  }
}
