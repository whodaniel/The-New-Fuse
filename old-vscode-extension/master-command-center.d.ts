import * as vscode from 'vscode';
/**
 * Master Command Center
 *
 * This class provides a centralized interface for accessing all commands in The New Fuse.
 * It creates a webview panel that displays available commands and allows users to execute them.
 */
export declare class MasterCommandCenter {
    private context;
    private panel;
    private logger;
    /**
     * Constructor
     * @param context VS Code extension context
     */
    constructor(context: vscode.ExtensionContext);
    /**
     * Show the Master Command Center
     */
    show(): Promise<void>;
    /**
     * Handle messages from the webview
     */
    handleWebviewMessage(message: any): void;
    /**
     * Execute a VS Code command with error handling
     */
    private executeVSCodeCommand;
    /**
     * Get the HTML content for the webview
     */
    private getWebviewContent;
}
/**
 * Register the Master Command Center command
 * @param context VS Code extension context
 */
export declare function registerMasterCommandCenter(context: vscode.ExtensionContext): vscode.Disposable;
//# sourceMappingURL=master-command-center.d.ts.map