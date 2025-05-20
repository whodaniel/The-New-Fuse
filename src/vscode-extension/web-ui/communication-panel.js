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
exports.CommunicationPanel = void 0;
const vscode = __importStar(require("vscode"));
const logging_1 = require("../core/logging");
const types_1 = require("../types");
class CommunicationPanel {
    constructor(panel, extensionUri) {
        this._disposables = [];
        this._panel = panel;
        this.logger = (0, logging_1.getLogger)();
        this._setPanelContent();
        this._setMessageHandlers();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }
    static createOrShow(extensionUri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (CommunicationPanel.currentPanel) {
            CommunicationPanel.currentPanel._panel.reveal(column);
            return CommunicationPanel.currentPanel;
        }
        const panel = vscode.window.createWebviewPanel('aiCommunication', 'AI Communication', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [extensionUri]
        });
        CommunicationPanel.currentPanel = new CommunicationPanel(panel, extensionUri);
        return CommunicationPanel.currentPanel;
    }
    _setPanelContent() {
        this._panel.webview.html = this._getWebviewContent();
    }
    _setMessageHandlers() {
        this._panel.webview.onDidReceiveMessage(async (message) => {
            try {
                switch (message.command) {
                    case 'sendMessage':
                        if (message.text) {
                            await this._handleUserMessage(message.text);
                        }
                        break;
                    case 'clearMessages':
                        this._clearMessages();
                        break;
                }
            }
            catch (error) {
                this.logger.error('Error handling message:', error);
            }
        }, null, this._disposables);
    }
    async _handleUserMessage(text) {
        const message = {
            id: Date.now().toString(),
            type: types_1.MessageType.MESSAGE,
            text,
            timestamp: new Date().toISOString()
        };
        await this._panel.webview.postMessage(message);
    }
    _clearMessages() {
        this._panel.webview.postMessage({ command: 'clearMessages' });
    }
    _getWebviewContent() {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Communication</title>
            </head>
            <body>
                <div id="chat-container">
                    <div id="messages"></div>
                    <div id="input-container">
                        <input type="text" id="message-input" placeholder="Type your message...">
                        <button id="send-button">Send</button>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const messageInput = document.getElementById('message-input');
                    const sendButton = document.getElementById('send-button');
                    const messagesDiv = document.getElementById('messages');

                    sendButton.addEventListener('click', () => {
                        const text = messageInput.value.trim();
                        if (text) {
                            vscode.postMessage({
                                command: 'sendMessage',
                                text
                            });
                            messageInput.value = '';
                        }
                    });

                    messageInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            sendButton.click();
                        }
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.command === 'clearMessages') {
                            messagesDiv.innerHTML = '';
                        } else if (message.type === 'message') {
                            const messageElement = document.createElement('div');
                            messageElement.className = 'message';
                            messageElement.textContent = message.text;
                            messagesDiv.appendChild(messageElement);
                            messagesDiv.scrollTop = messagesDiv.scrollHeight;
                        }
                    });
                </script>
                <style>
                    #chat-container {
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                        padding: 10px;
                    }
                    #messages {
                        flex: 1;
                        overflow-y: auto;
                        margin-bottom: 10px;
                    }
                    #input-container {
                        display: flex;
                        gap: 5px;
                    }
                    #message-input {
                        flex: 1;
                        padding: 5px;
                    }
                    .message {
                        margin: 5px 0;
                        padding: 5px 10px;
                        border-radius: 5px;
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-editor-lineHighlightBorder);
                    }
                </style>
            </body>
            </html>`;
    }
    dispose() {
        CommunicationPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
exports.CommunicationPanel = CommunicationPanel;
//# sourceMappingURL=communication-panel.js.map