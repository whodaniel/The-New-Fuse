import * as vscode from 'vscode';
import { AgentCommunicationService } from '../services/AgentCommunicationService';
import { WebviewMessage } from '../types/webview';

/**
 * Communication Hub Provider for The New Fuse
 * Provides a webview interface for agent communication and monitoring
 */
export class CommunicationHubProvider {
    public static readonly viewType = 'theNewFuse.communicationHub';
    private _hostWebview?: vscode.Webview;
    private _messageListener?: vscode.Disposable;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly communicationService: AgentCommunicationService
    ) {}

    public setHostWebview(webview: vscode.Webview) {
        this._hostWebview = webview;
        this.communicationService.registerWebview(this._hostWebview);
        
        // Dispose of any existing listener before creating a new one
        if (this._messageListener) {
            this._messageListener.dispose();
        }
        // Use subscribe method with global agent ID instead of onMessage
        this._messageListener = {
            dispose: () => {
                // The subscribe method doesn't return a disposable, so we'll handle cleanup differently
            }
        };
        this.communicationService.onMessage((message) => {
            this.updateWebviewWithMessage(message);
        });
        // Note: Setting webview.options, webview.html, and webview.onDidReceiveMessage
        // is now handled by TabbedContainerProvider.ts
    }

    public async handleHubMessage(message: any): Promise<void> {
        await this.handleWebviewMessage(message);
    }

    // The show() method is removed as TabbedContainerProvider handles visibility.

    /**
     * Handle messages from the webview
     */
    private async handleWebviewMessage(message: any): Promise<void> {
        try {
            switch (message.command) {
                case 'sendMessage':
                    if (message.text) {
                        await this.sendMessage({
                            id: Date.now().toString(),
                            content: message.text,
                            metadata: {
                                sender: 'user',
                                timestamp: new Date().toISOString()
                            }
                        });
                    }
                    break;
                    
                case 'getAgents':
                    this.sendAgentList();
                    break;
                    
                case 'clearMessages':
                    this.clearMessages();
                    break;
                    
                default:
                    console.log(`Unknown command received: ${message.command}`);
            }
        } catch (error) {
            console.error('Error handling webview message:', error);
            this.showError(`Error handling message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Send a message to all agents via the communication service
     */
    private async sendMessage(message: any): Promise<void> {
        try {
            await this.communicationService.broadcastMessage('user-message', message);
            this.updateWebviewWithMessage({
                ...message,
                metadata: {
                    ...message.metadata,
                    direction: 'outgoing'
                }
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showError(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Update the webview with a new message
     */
    private updateWebviewWithMessage(message: any): void {
        if (this._hostWebview) {
            this._hostWebview.postMessage({
                command: 'newMessage',
                message
            });
        }
    }

    /**
     * Send the list of available agents to the webview
     */
    private async sendAgentList(): Promise<void> {
        try {
            const agents = this.communicationService.getRegisteredAgents();
            if (this._hostWebview) {
                this._hostWebview.postMessage({
                    command: 'agentList',
                    agents
                });
            }
        } catch (error) {
            console.error('Failed to get agent list:', error);
            this.showError(`Failed to retrieve agent list: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Clear all messages in the UI
     */
    private clearMessages(): void {
        if (this._hostWebview) {
            this._hostWebview.postMessage({
                command: 'clearMessages'
            });
        }
    }

    /**
     * Show an error message in the webview
     */
    private showError(errorMessage: string): void {
        if (this._hostWebview) {
            this._hostWebview.postMessage({
                command: 'showError',
                error: errorMessage
            });
        }
    }

    /**
     * Generate HTML for the webview
     */
    public getHtmlBodySnippet(webview: vscode.Webview, nonce: string): string {
        // Create URI for scripts and styles
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'communication-hub.js')
        );
        
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'styles.css')
        );
        
        const codiconsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css')
        );
        
        return `
            <link href="${styleUri}" rel="stylesheet">
            <link href="${codiconsUri}" rel="stylesheet">
            <style nonce="${nonce}">
                /* Add any tab-specific inline styles here if necessary */
            </style>
            <div class="header">
                <h2><i class="codicon codicon-radio-tower"></i> Communication Hub</h2>
                <div class="actions">
                    <button class="action-button refresh-button" title="Refresh Agent List">
                        <i class="codicon codicon-refresh"></i>
                    </button>
                    <button class="action-button clear-button" title="Clear Messages">
                        <i class="codicon codicon-clear-all"></i>
                    </button>
                </div>
            </div>
            
            <div class="agent-list-container">
                <h3>Connected Agents</h3>
                <div class="agent-list"></div>
            </div>
            
            <div class="messages-container">
                <h3>Messages</h3>
                <div class="message-list"></div>
            </div>
            
            <div class="input-container">
                <textarea id="message-input" placeholder="Type a message to broadcast to all agents..."></textarea>
                <button id="send-button" title="Send Message">
                    <i class="codicon codicon-send"></i>
                </button>
            </div>
            
            <script nonce="${nonce}" src="${scriptUri}"></script>
        `;
    }

    public dispose() {
        if (this._messageListener) {
            this._messageListener.dispose();
            this._messageListener = undefined;
        }
        // If communicationService had an unregisterWebview method, it would be called here.
        // e.g., this.communicationService.unregisterWebview(this._hostWebview);
        this._hostWebview = undefined;
        console.log('CommunicationHubProvider disposed');
    }
}
