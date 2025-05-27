import * as vscode from 'vscode';
import * as crypto from 'crypto';

/**
 * BaseWebView provides common functionality for all webview panels in the extension.
 * This class handles disposables, nonce generation, and other shared utilities.
 */
export abstract class BaseWebView {
    protected panel: vscode.WebviewPanel;
    protected extensionUri: vscode.Uri;
    protected disposables: vscode.Disposable[] = [];

    constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;

        // Reset when the current panel is closed
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    /**
     * Cleans up resources used by this webview
     */
    public dispose() {
        // Clean up our resources
        this.panel.dispose();

        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * Generate a nonce string for content security policy
     */
    protected getNonce(): string {
        return crypto.randomBytes(16).toString('base64');
    }

    /**
     * Get a URI for a resource within the extension
     */
    protected getWebviewUri(relativePath: string): vscode.Uri {
        return this.panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, relativePath)
        );
    }

    /**
     * Returns HTML for the webview to display
     * This must be implemented by each specific webview
     */
    protected abstract getHtmlForWebview(...args: any[]): string;
}