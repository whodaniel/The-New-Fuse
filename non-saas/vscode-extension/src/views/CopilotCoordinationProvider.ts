import * as vscode from 'vscode';

export class CopilotCoordinationProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly context: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        webviewView.webview.html = this.getHtmlForWebview();

        webviewView.webview.onDidReceiveMessage(
            message => this.handleMessage(message),
            undefined,
            this.context.subscriptions
        );
    }

    private async handleMessage(message: any) {
        switch (message.type) {
            case 'startCoordination':
                await this.startCoordination();
                break;
            case 'stopCoordination':
                await this.stopCoordination();
                break;
        }
    }

    private async startCoordination() {
        vscode.window.showInformationMessage('Copilot coordination started');
        this._view?.webview.postMessage({
            type: 'coordinationStatus',
            active: true
        });
    }

    private async stopCoordination() {
        vscode.window.showInformationMessage('Copilot coordination stopped');
        this._view?.webview.postMessage({
            type: 'coordinationStatus',
            active: false
        });
    }

    private getHtmlForWebview(): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Copilot Coordination</title>
            <style>
                body { font-family: var(--vscode-font-family); padding: 16px; }
                button { padding: 8px 16px; margin: 4px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; cursor: pointer; }
                button:hover { background: var(--vscode-button-hoverBackground); }
                .status { margin: 16px 0; padding: 8px; border-radius: 4px; background: var(--vscode-input-background); }
            </style>
        </head>
        <body>
            <h2>🤖 Copilot Coordination</h2>
            <div class="status" id="status">Status: Inactive</div>
            <button id="startBtn">Start Coordination</button>
            <button id="stopBtn">Stop Coordination</button>
            
            <script>
                const vscode = acquireVsCodeApi();
                const status = document.getElementById('status');
                const startBtn = document.getElementById('startBtn');
                const stopBtn = document.getElementById('stopBtn');

                startBtn.addEventListener('click', () => {
                    vscode.postMessage({ type: 'startCoordination' });
                });

                stopBtn.addEventListener('click', () => {
                    vscode.postMessage({ type: 'stopCoordination' });
                });

                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.type === 'coordinationStatus') {
                        status.textContent = \`Status: \${message.active ? 'Active' : 'Inactive'}\`;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}