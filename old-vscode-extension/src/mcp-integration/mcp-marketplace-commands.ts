import * as vscode from 'vscode';
import { MCPServer } from '../types/mcp.js';

export function registerMCPMarketplaceCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('thefuse.openMCPMarketplace', () => {
            MCPMarketplacePanel.createOrShow({ extensionUri: context.extensionUri });
        })
    );
}

class MCPMarketplacePanel {
    public static currentPanel: MCPMarketplacePanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(context: { extensionUri: vscode.Uri }): void {
        const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

        if (MCPMarketplacePanel.currentPanel) {
            MCPMarketplacePanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'mcpMarketplace',
            'MCP Server Marketplace',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'media')
                ]
            }
        );

        MCPMarketplacePanel.currentPanel = new MCPMarketplacePanel(panel, context.extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message: any) => {
                switch (message.command) {
                    case 'searchServers':
                        await this._searchServers(message.query);
                        break;
                    case 'installServer':
                        await this._installServer(message.serverId);
                        break;
                    case 'showDetails':
                        await this._showServerDetails(message.serverId);
                        break;
                    case 'refresh':
                        await this._refreshServers();
                        break;
                    case 'openDocs':
                        await this._openServerDocs();
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async _searchServers(query: string): Promise<void> {
        // Implementation will be added later
    }

    private async _installServer(serverId: string): Promise<void> {
        // Implementation will be added later
    }

    private async _showServerDetails(serverId: string): Promise<void> {
        // Implementation will be added later
    }

    private async _refreshServers(): Promise<void> {
        // Implementation will be added later
    }

    private async _openServerDocs(): Promise<void> {
        // Implementation will be added later
    }

    private _update(): void {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Implementation will be added later
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>MCP Marketplace</title>
            </head>
            <body>
                <div id="root">Loading...</div>
            </body>
            </html>`;
    }

    private dispose(): void {
        MCPMarketplacePanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
