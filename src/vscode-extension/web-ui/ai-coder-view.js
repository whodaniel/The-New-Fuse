"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICoderView = void 0;
const vscode = __importStar(require("vscode"));
/**
 * WebView provider for the AI Coder integration panel
 * Shows status of AI Coder connections and Roo monitoring
 */
class AICoderView {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'startRooMonitoring':
                    vscode.commands.executeCommand('roo.startMonitoring');
                    break;
                case 'stopRooMonitoring':
                    vscode.commands.executeCommand('roo.stopMonitoring');
                    break;
                case 'refreshStatus':
                    this._updateStatus();
                    break;
            }
        });
        // Initial status update
        this._updateStatus();
    }
    _updateStatus() {
        if (this._view) {
            vscode.commands.executeCommand('thefuse.aiCoder.getStatus').then(status => {
                this._view?.webview.postMessage({
                    command: 'updateStatus',
                    status: status
                });
            });
        }
    }
    _getHtmlForWebview(webview) {
        // Get the local path to main script
        const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'js', 'ai-coder-view.js');
        // Convert the local URI to a scheme that VS Code's webview can use
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
        // Determine stylesheet and theme
        const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'css', 'reset.css');
        const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'css', 'vscode.css');
        const stylesFusePath = vscode.Uri.joinPath(this._extensionUri, 'media', 'css', 'fuse.css');
        const styleResetUri = webview.asWebviewUri(styleResetPath);
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
        const stylesFuseUri = webview.asWebviewUri(stylesFusePath);
        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; 
                style-src ${webview.cspSource} 'unsafe-inline'; 
                script-src 'nonce-${nonce}';">
            <link href="${styleResetUri}" rel="stylesheet">
            <link href="${stylesMainUri}" rel="stylesheet">
            <link href="${stylesFuseUri}" rel="stylesheet">
            <title>AI Coder</title>
        </head>
        <body>
            <div class="panel-container">
                <h2 class="panel-title">
                    <span class="codicon codicon-code"></span>
                    AI Coder Integration
                </h2>
                <div class="ai-coder-controls">
                    <div class="control-row">
                        <h3>Roo Monitoring</h3>
                        <div class="status-badge" id="roo-status">
                            <span class="status-dot inactive"></span>
                            <span class="status-text">Inactive</span>
                        </div>
                    </div>
                    <div class="button-container">
                        <button id="btn-start-roo" class="primary-button">
                            <span class="codicon codicon-play"></span>
                            Start Monitoring
                        </button>
                        <button id="btn-stop-roo" class="secondary-button" disabled>
                            <span class="codicon codicon-stop"></span>
                            Stop Monitoring
                        </button>
                    </div>
                    
                    <div class="control-row">
                        <h3>AI Coder WebSocket</h3>
                        <div class="status-badge" id="ws-status">
                            <span class="status-dot inactive"></span>
                            <span class="status-text">Starting...</span>
                        </div>
                    </div>
                    <div id="client-list-container">
                        <h4>Connected Clients: <span id="client-count">0</span></h4>
                        <div id="client-list" class="client-list">
                            <div class="empty-state">No clients connected</div>
                        </div>
                    </div>
                </div>

                <div class="panel-section">
                    <h3>Debug Information</h3>
                    <div class="debug-info" id="debug-info">
                        Initializing...
                    </div>
                </div>
            </div>

            <script nonce="${nonce}">
                (function() {
                    const vscode = acquireVsCodeApi();
                    let rooActive = false;
                    let wsActive = false;
                    let clientCount = 0;
                    
                    // UI Elements
                    const rooStatus = document.getElementById('roo-status');
                    const wsStatus = document.getElementById('ws-status');
                    const clientCountElement = document.getElementById('client-count');
                    const clientList = document.getElementById('client-list');
                    const startRooBtn = document.getElementById('btn-start-roo');
                    const stopRooBtn = document.getElementById('btn-stop-roo');
                    const debugInfo = document.getElementById('debug-info');
                    
                    // Button click handlers
                    startRooBtn.addEventListener('click', () => {
                        vscode.postMessage({ command: 'startRooMonitoring' });
                    });
                    
                    stopRooBtn.addEventListener('click', () => {
                        vscode.postMessage({ command: 'stopRooMonitoring' });
                    });
                    
                    // Receive messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        if (message.command === 'updateStatus') {
                            updateUIWithStatus(message.status);
                        }
                    });
                    
                    function updateUIWithStatus(status) {
                        rooActive = status.rooMonitoring;
                        wsActive = status.wsActive;
                        clientCount = status.clients.length;
                        
                        // Update Roo status
                        if (rooActive) {
                            rooStatus.querySelector('.status-dot').className = 'status-dot active';
                            rooStatus.querySelector('.status-text').textContent = 'Active';
                            startRooBtn.disabled = true;
                            stopRooBtn.disabled = false;
                        } else {
                            rooStatus.querySelector('.status-dot').className = 'status-dot inactive';
                            rooStatus.querySelector('.status-text').textContent = 'Inactive';
                            startRooBtn.disabled = false;
                            stopRooBtn.disabled = true;
                        }
                        
                        // Update WebSocket status
                        if (wsActive) {
                            wsStatus.querySelector('.status-dot').className = 'status-dot active';
                            wsStatus.querySelector('.status-text').textContent = 'Active';
                        } else {
                            wsStatus.querySelector('.status-dot').className = 'status-dot inactive';
                            wsStatus.querySelector('.status-text').textContent = 'Inactive';
                        }
                        
                        // Update client count
                        clientCountElement.textContent = clientCount;
                        
                        // Update client list
                        if (clientCount === 0) {
                            clientList.innerHTML = '<div class="empty-state">No clients connected</div>';
                        } else {
                            clientList.innerHTML = '';
                            status.clients.forEach(client => {
                                const clientEl = document.createElement('div');
                                clientEl.className = 'client-item';
                                const time = new Date(client.connectionTime).toLocaleTimeString();
                                clientEl.innerHTML = \`
                                    <div class="client-id">\${client.id}</div>
                                    <div class="client-details">
                                        <span class="client-ip">\${client.ip || 'Unknown'}</span>
                                        <span class="client-time">\${time}</span>
                                    </div>
                                \`;
                                clientList.appendChild(clientEl);
                            });
                        }
                        
                        // Update debug info
                        debugInfo.innerHTML = \`
                            <div>Roo Port: \${status.rooPorts ? status.rooPorts.main : 'N/A'}</div>
                            <div>WebSocket Port: \${status.wsPorts ? status.wsPorts.main : 'N/A'}</div>
                            <div>Last Status Update: \${new Date().toLocaleTimeString()}</div>
                        \`;
                    }

                    // Request initial status update
                    vscode.postMessage({ command: 'refreshStatus' });

                    // Set up status refresh interval
                    setInterval(() => {
                        vscode.postMessage({ command: 'refreshStatus' });
                    }, 3000);
                }())
            </script>
        </body>
        </html>`;
    }
    dispose() {
        // Clean up resources
    }
}
exports.AICoderView = AICoderView;
AICoderView.viewType = 'thefuse.aiCoderView';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=ai-coder-view.js.map