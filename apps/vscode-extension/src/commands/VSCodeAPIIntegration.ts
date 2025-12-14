import * as vscode from 'vscode';

/**
 * VSCode API Integration Utilities
 * 
 * This class provides helper methods for integrating with VSCode APIs
 * including workspace, editor, terminal, and notifications.
 */
export class VSCodeAPIIntegration {
  /**
   * Show a progress notification with cancellation support
   */
  static async withProgress<T>(
    title: string,
    task: (progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken) => Promise<T>,
    options?: {
      location?: vscode.ProgressLocation;
      cancellable?: boolean;
    }
  ): Promise<T> {
    return await vscode.window.withProgress(
      {
        location: options?.location || vscode.ProgressLocation.Notification,
        title,
        cancellable: options?.cancellable || false
      },
      task
    );
  }

  /**
   * Show an information message with optional actions
   */
  static async showInformationMessage(
    message: string,
    ...items: string[]
  ): Promise<string | undefined> {
    return await vscode.window.showInformationMessage(message, ...items);
  }

  /**
   * Show a warning message with optional actions
   */
  static async showWarningMessage(
    message: string,
    ...items: string[]
  ): Promise<string | undefined> {
    return await vscode.window.showWarningMessage(message, ...items);
  }

  /**
   * Show an error message with optional actions
   */
  static async showErrorMessage(
    message: string,
    ...items: string[]
  ): Promise<string | undefined> {
    return await vscode.window.showErrorMessage(message, ...items);
  }

  /**
   * Show a quick pick menu
   */
  static async showQuickPick(
    items: string[] | vscode.QuickPickItem[],
    options?: vscode.QuickPickOptions
  ): Promise<string | vscode.QuickPickItem | undefined> {
    return await vscode.window.showQuickPick(items, options);
  }

  /**
   * Show an input box
   */
  static async showInputBox(
    options?: vscode.InputBoxOptions
  ): Promise<string | undefined> {
    return await vscode.window.showInputBox(options);
  }

  /**
   * Show an open dialog for file selection
   */
  static async showOpenDialog(
    options?: vscode.OpenDialogOptions
  ): Promise<vscode.Uri[] | undefined> {
    return await vscode.window.showOpenDialog(options);
  }

  /**
   * Show a save dialog
   */
  static async showSaveDialog(
    options?: vscode.SaveDialogOptions
  ): Promise<vscode.Uri | undefined> {
    return await vscode.window.showSaveDialog(options);
  }

  /**
   * Get the active text editor
   */
  static getActiveTextEditor(): vscode.TextEditor | undefined {
    return vscode.window.activeTextEditor;
  }

  /**
   * Get the selected text in the active editor
   */
  static getSelectedText(): string {
    const editor = this.getActiveTextEditor();
    if (!editor) {
      return '';
    }

    const selection = editor.selection;
    return editor.document.getText(selection);
  }

  /**
   * Get the full text of the active editor
   */
  static getActiveEditorText(): string {
    const editor = this.getActiveTextEditor();
    if (!editor) {
      return '';
    }

    return editor.document.getText();
  }

  /**
   * Insert text at the current cursor position
   */
  static async insertText(text: string): Promise<boolean> {
    const editor = this.getActiveTextEditor();
    if (!editor) {
      return false;
    }

    await editor.edit(editBuilder => {
      editBuilder.insert(editor.selection.active, text);
    });

    return true;
  }

  /**
   * Replace the selected text with new text
   */
  static async replaceSelectedText(text: string): Promise<boolean> {
    const editor = this.getActiveTextEditor();
    if (!editor) {
      return false;
    }

    await editor.edit(editBuilder => {
      editBuilder.replace(editor.selection, text);
    });

    return true;
  }

  /**
   * Get workspace folders
   */
  static getWorkspaceFolders(): readonly vscode.WorkspaceFolder[] {
    return vscode.workspace.workspaceFolders || [];
  }

  /**
   * Get the workspace root path
   */
  static getWorkspaceRoot(): string | undefined {
    const workspaceFolders = this.getWorkspaceFolders();
    return workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : undefined;
  }

  /**
   * Find files in the workspace
   */
  static async findFiles(
    include: string,
    exclude?: string,
    maxResults?: number
  ): Promise<vscode.Uri[]> {
    return await vscode.workspace.findFiles(include, exclude, maxResults);
  }

  /**
   * Read a file from the workspace
   */
  static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    return await vscode.workspace.fs.readFile(uri);
  }

  /**
   * Write a file to the workspace
   */
  static async writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void> {
    await vscode.workspace.fs.writeFile(uri, content);
  }

  /**
   * Create a terminal
   */
  static createTerminal(
    name?: string,
    shellPath?: string,
    shellArgs?: string[]
  ): vscode.Terminal {
    return vscode.window.createTerminal(name, shellPath, shellArgs);
  }

  /**
   * Execute a command in the terminal
   */
  static async executeTerminalCommand(
    command: string,
    name?: string
  ): Promise<vscode.Terminal> {
    const terminal = this.createTerminal(name);
    terminal.sendText(command);
    terminal.show();
    return terminal;
  }

  /**
   * Set status bar message
   */
  static setStatusBarMessage(
    text: string,
    hideAfterTimeout?: number
  ): vscode.Disposable {
    if (hideAfterTimeout) {
      return vscode.window.setStatusBarMessage(text, hideAfterTimeout);
    } else {
      return vscode.window.setStatusBarMessage(text);
    }
  }

  /**
   * Show a document in the editor
   */
  static async showTextDocument(
    uri: vscode.Uri,
    options?: vscode.TextDocumentShowOptions
  ): Promise<vscode.TextEditor> {
    return await vscode.window.showTextDocument(uri, options);
  }

  /**
   * Open a file in the editor
   */
  static async openFile(
    filePath: string,
    options?: vscode.TextDocumentShowOptions
  ): Promise<vscode.TextEditor> {
    const uri = vscode.Uri.file(filePath);
    return await this.showTextDocument(uri, options);
  }

  /**
   * Get configuration from VSCode settings
   */
  static getConfiguration(
    section?: string,
    scope?: vscode.ConfigurationScope
  ): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(section, scope);
  }

  /**
   * Get a specific configuration value
   */
  static getConfigurationValue<T>(
    section: string,
    key: string,
    defaultValue?: T
  ): T {
    const config = this.getConfiguration(section);
    return config.get<T>(key, defaultValue as T);
  }

  /**
   * Set a configuration value
   */
  static async setConfigurationValue(
    section: string,
    key: string,
    value: unknown,
    target?: vscode.ConfigurationTarget
  ): Promise<void> {
    const config = this.getConfiguration(section);
    await config.update(key, value, target);
  }

  /**
   * Register a workspace watcher
   */
  static createFileSystemWatcher(
    globPattern: string,
    ignoreCreateEvents?: boolean,
    ignoreChangeEvents?: boolean,
    ignoreDeleteEvents?: boolean
  ): vscode.FileSystemWatcher {
    return vscode.workspace.createFileSystemWatcher(
      globPattern,
      ignoreCreateEvents,
      ignoreChangeEvents,
      ignoreDeleteEvents
    );
  }

  /**
   * Execute a VSCode command
   */
  static async executeCommand<T>(
    command: string,
    ...rest: unknown[]
  ): Promise<T> {
    return await vscode.commands.executeCommand<T>(command, ...rest);
  }

  /**
   * Register a command
   */
  static registerCommand(
    command: string,
    callback: (...args: unknown[]) => unknown,
    thisArg?: unknown
  ): vscode.Disposable {
    return vscode.commands.registerCommand(command, callback, thisArg);
  }

  /**
   * Get environment information
   */
  static getEnvironmentInfo(): {
    appName: string;
    appRoot: string;
    language: string;
    machineId: string;
    sessionId: string;
    remoteName?: string;
  } {
    return {
      appName: vscode.env.appName,
      appRoot: vscode.env.appRoot,
      language: vscode.env.language,
      machineId: vscode.env.machineId,
      sessionId: vscode.env.sessionId,
      remoteName: vscode.env.remoteName
    };
  }

  /**
   * Open external URL
   */
  static async openExternal(url: string): Promise<boolean> {
    return await vscode.env.openExternal(vscode.Uri.parse(url));
  }

  /**
   * Copy text to clipboard
   */
  static async copyToClipboard(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
  }

  /**
   * Read text from clipboard
   */
  static async readFromClipboard(): Promise<string> {
    return await vscode.env.clipboard.readText();
  }
}

/**
 * VSCode Progress Helper
 * 
 * Provides utilities for progress reporting in VSCode commands
 */
export class VSCodeProgressHelper {
  /**
   * Create a progress reporter that updates the UI
   */
  static createProgressReporter(
    progress: vscode.Progress<{ message?: string; increment?: number }>
  ): {
    report: (message: string, increment?: number) => void;
    complete: (message?: string) => void;
  } {
    return {
      report: (message: string, increment?: number) => {
        progress.report({ message, increment });
      },
      complete: (message?: string) => {
        progress.report({ message, increment: 100 });
      }
    };
  }

  /**
   * Execute a task with automatic progress reporting
   */
  static async executeWithProgress<T>(
    title: string,
    task: (reporter: { report: (message: string, increment?: number) => void }) => Promise<T>
  ): Promise<T> {
    return await VSCodeAPIIntegration.withProgress(
      title,
      async (progress, _token) => {
        const reporter = VSCodeProgressHelper.createProgressReporter(progress);
        return await task(reporter);
      },
      { cancellable: false }
    );
  }
}