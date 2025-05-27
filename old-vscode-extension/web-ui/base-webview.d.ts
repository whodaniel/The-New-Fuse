import * as vscode from 'vscode';
/**
 * BaseWebView provides common functionality for all webview panels in the extension.
 * This class handles disposables, nonce generation, and other shared utilities.
 */
export declare abstract class BaseWebView {
    protected panel: vscode.WebviewPanel;
    protected extensionUri: vscode.Uri;
    protected disposables: vscode.Disposable[];
    constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri);
    /**
     * Cleans up resources used by this webview
     */
    dispose(): void;
    /**
     * Generate a nonce string for content security policy
     */
    protected getNonce(): string;
    /**
     * Get a URI for a resource within the extension
     */
    protected getWebviewUri(relativePath: string): vscode.Uri;
    /**
     * Returns HTML for the webview to display
     * This must be implemented by each specific webview
     */
    protected abstract getHtmlForWebview(...args: any[]): string;
}
//# sourceMappingURL=base-webview.d.ts.map