import * as vscode from 'vscode';
import { AIAgent, AIMessage, ConversationState, ConnectionStatus } from '../types/shared.js';

export function getCommunicationPanelContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
    agents: AIAgent[],
    conversations: ConversationState[],
    connectionStatus: Record<string, ConnectionStatus>
): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'web-ui', 'main.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'web-ui', 'styles.css'));
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'web-ui', 'codicons.css'));

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The New Fuse - Communication Hub</title>
    <link href="${codiconsUri}" rel="stylesheet" />
    <link href="${styleUri}" rel="stylesheet" />
    <script>
        const vscode = acquireVsCodeApi();
        const agents = ${JSON.stringify(agents)};
        const conversations = ${JSON.stringify(conversations)};
        const connectionStatus = ${JSON.stringify(connectionStatus)};
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><i class="codicon codicon-link"></i> The New Fuse Communication Hub</h1>
            <div class="connection-status">
                ${Object.entries(connectionStatus).map(([id, status]) => `
                    <div class="status-indicator ${status.toLowerCase()}">
                        <i class="codicon codicon-${status === ConnectionStatus.CONNECTED ? 'check' : 'error'}"></i>
                        ${id}
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="main-content">
            <div class="sidebar">
                <div class="agents-section">
                    <h2><i class="codicon codicon-account"></i> Connected Agents</h2>
                    <div class="agents-list">
                        ${agents.map(agent => `
                            <div class="agent-item" data-agent-id="${agent.id}">
                                <div class="agent-name">${agent.name}</div>
                                <div class="agent-meta">
                                    <span class="agent-version">v${agent.version}</span>
                                    <span class="agent-provider">${agent.provider || 'Unknown'}</span>
                                </div>
                                <div class="agent-capabilities">
                                    ${agent.capabilities.map(cap => `
                                        <span class="capability-badge">${cap}</span>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="conversations-section">
                    <h2><i class="codicon codicon-comment-discussion"></i> Active Conversations</h2>
                    <div class="conversations-list">
                        ${conversations.map(conv => `
                            <div class="conversation-item" data-conversation-id="${conv.id}">
                                <div class="conversation-header">
                                    <span class="conversation-agents">
                                        ${conv.sourceAgent} → ${conv.targetAgent}
                                    </span>
                                    <span class="conversation-time">
                                        ${new Date(conv.startTime).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div class="conversation-status ${conv.status}">
                                    ${conv.status.toUpperCase()}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="chat-container">
                <div id="messages" class="messages">
                    <!-- Messages will be inserted here dynamically -->
                </div>

                <div class="input-container">
                    <div class="input-wrapper">
                        <textarea 
                            id="messageInput" 
                            placeholder="Type your message here..."
                            rows="3"
                        ></textarea>
                        <button id="sendButton" class="send-button">
                            <i class="codicon codicon-send"></i>
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="actions">
                <button id="newConversation">
                    <i class="codicon codicon-add"></i>
                    New Conversation
                </button>
                <button id="clearMessages">
                    <i class="codicon codicon-clear-all"></i>
                    Clear Messages
                </button>
                <button id="showSettings">
                    <i class="codicon codicon-settings-gear"></i>
                    Settings
                </button>
            </div>
        </div>
    </div>

    <script src="${scriptUri}"></script>
</body>
</html>`;
}

export function getMessageHtml(message: AIMessage): string {
    const timestamp = new Date(message.timestamp).toLocaleTimeString();
    const direction = message.sourceAgent === 'vscode.core' ? 'outgoing' : 'incoming';
    
    return `
        <div class="message ${direction}" data-message-id="${message.id}">
            <div class="message-header">
                <span class="message-source">${message.sourceAgent}</span>
                <span class="message-time">${timestamp}</span>
            </div>
            <div class="message-content">
                ${formatMessageContent(message.content)}
            </div>
            <div class="message-footer">
                <span class="message-type">${message.type}</span>
                ${message.metadata ? `
                    <span class="message-meta">
                        <i class="codicon codicon-info"></i>
                    </span>
                ` : ''}
            </div>
        </div>
    `;
}

function formatMessageContent(content: any): string {
    if (typeof content === 'string') {
        return content.replace(/\n/g, '<br>');
    }
    
    if (content.code) {
        return `<pre><code>${content.code}</code></pre>`;
    }
    
    return JSON.stringify(content, null, 2);
}