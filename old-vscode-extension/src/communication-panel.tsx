import * as vscode from 'vscode';
import { RelayService } from '../services/relay-service.js';
import { getLogger, ExtensionLogger, LogLevel } from './core/logging.js'; // Corrected path from ../core to ./core

export class CommunicationPanel {
  public static currentPanel: CommunicationPanel | undefined;
  private static readonly viewType = 'aiCommunicationPanel';
  
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private relayService: RelayService;
  private logger: ExtensionLogger; // Changed Logger to ExtensionLogger
  
  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (CommunicationPanel.currentPanel) {
      CommunicationPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      CommunicationPanel.viewType,
      'AI Communication Hub',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'web-ui')
        ]
      }
    );

    CommunicationPanel.currentPanel = new CommunicationPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this.relayService = RelayService.getInstance(); // Assuming RelayService has getInstance()
    this.logger = getLogger(); // Changed Logger.getInstance() to getLogger()

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        try {
          switch (message.command) {
            case 'relayToChromeExtension':
              await this.relayToChromeExtension(message.data);
              break;
            case 'relayToVSCode':
              await this.handleChromeMessage(message.data);
              break;
          }
        } catch (error) {
          this.logger.error('Error handling message:', error); // Changed log to error
        }
      },
      null,
      this._disposables
    );

    // Register with relay service
    this.relayService.registerConnection('communication-panel', this._panel.webview);
  }

  private async relayToChromeExtension(data: any): Promise<void> {
    this.relayService.sendMessage('chrome-extension', {
      command: 'fromVSCode',
      data
    });
  }

  private async handleChromeMessage(data: any): Promise<void> {
    // Process messages from Chrome extension
    switch (data.type) {
      case 'CODE_INPUT':
        await vscode.commands.executeCommand('thefuse.insertCode', data.code);
        break;
      case 'AI_REQUEST':
        await vscode.commands.executeCommand('thefuse.processAIRequest', data);
        break;
    }
  }

  private _update() {
    this._panel.webview.html = this._getHtmlForWebview();
  }

  private _getHtmlForWebview(): string {
    return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Communication Hub</title>
      <style>
        body { padding: 10px; }
        .message { margin: 10px 0; padding: 10px; border: 1px solid #ccc; }
        .from-vscode { background: #e3f2fd; }
        .from-chrome { background: #f3e5f5; }
      </style>
    </head>
    <body>
      <h2>AI Communication Hub</h2>
      <div id="messages"></div>
      <script>
        const vscode = acquireVsCodeApi();
        
        window.addEventListener('message', (event) => {
          const message = event.data;
          displayMessage(message);
        });

        function displayMessage(message) {
          const messagesDiv = document.getElementById('messages');
          const messageDiv = document.createElement('div');
          messageDiv.className = 'message ' + (message.source === 'vscode' ? 'from-vscode' : 'from-chrome');
          messageDiv.textContent = JSON.stringify(message.data, null, 2);
          messagesDiv.appendChild(messageDiv);
        }
      </script>
    </body>
    </html>`;
  }

  public dispose() {
    CommunicationPanel.currentPanel = undefined;
    this.relayService.unregisterConnection('communication-panel');

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
