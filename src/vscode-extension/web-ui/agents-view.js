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
exports.AgentsView = void 0;
const vscode = __importStar(require("vscode"));
const agent_discovery_1 = require("../services/agent-discovery");
const shared_1 = require("../types/shared");
/**
 * Enhanced Agents View for the sidebar
 * Lists available AI agents with status and controls
 */
class AgentsView {
    constructor(extensionUri) {
        this._agents = [];
        this._disposables = [];
        this._extensionUri = extensionUri;
        this._agentDiscovery = agent_discovery_1.AgentDiscoveryManager.getInstance();
        // Subscribe to agent events
        this._agentDiscovery.on('agentRegistered', (agent) => {
            this._refreshAgents();
        });
        this._agentDiscovery.on('agentUnregistered', (agent) => {
            this._refreshAgents();
        });
        this._agentDiscovery.on('agentStatusChanged', (data) => {
            this._refreshAgents();
        });
    }
    dispose() {
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    getBaseHtml(webview, title, bodyContent) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'web-ui', 'styles.css'));
        const nonce = this.getNonce();
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <link href="${styleUri}" rel="stylesheet">
                <title>${title}</title>
            </head>
            <body>
                ${bodyContent}
            </body>
            </html>`;
    }
    /**
     * Called when the webview is created
     */
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        // Set up the webview
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        // Set initial HTML
        webviewView.webview.html = this._getHtmlForWebview();
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            try {
                switch (message.command) {
                    case 'refreshAgents':
                        await this._refreshAgents();
                        break;
                    case 'connectAgent':
                        await this._connectAgent(message.agentId);
                        break;
                    case 'disconnectAgent':
                        await this._disconnectAgent(message.agentId);
                        break;
                    case 'startConversation':
                        await this._startConversation(message.agentId);
                        break;
                    case 'configureAgent':
                        await this._configureAgent(message.agentId);
                        break;
                }
            }
            catch (error) {
                this._logger.error('Error handling message:', error);
            }
        }, null, this._disposables);
        // Initial load of agents
        this._refreshAgents();
    }
    /**
     * Get the latest agents from AgentDiscoveryManager
     */
    async _refreshAgents() {
        try {
            // Get all agents
            this._agents = this._agentDiscovery.getAllAgents();
            // Add status information
            const agentsWithStatus = this._agents.map(agent => {
                return {
                    ...agent,
                    status: this._agentDiscovery.getAgentStatus(agent.id),
                    capabilities: this._agentDiscovery.getAgentCapabilities(agent.id)
                };
            });
            // Update the webview
            if (this._view) {
                this._view.webview.postMessage({
                    command: 'updateAgents',
                    agents: agentsWithStatus
                });
            }
        }
        catch (error) {
            this._logger.error('Failed to refresh agents:', error);
        }
    }
    /**
     * Connect to an agent
     */
    async _connectAgent(agentId) {
        try {
            // Set agent status to CONNECTED
            await this._agentDiscovery.updateAgentStatus(agentId, shared_1.ConnectionStatus.CONNECTED);
            vscode.window.showInformationMessage(`Connected to agent ${agentId}`);
            await this._refreshAgents();
        }
        catch (error) {
            this._logger.error(`Failed to connect agent ${agentId}:`, error);
            vscode.window.showErrorMessage(`Failed to connect to agent ${agentId}`);
        }
    }
    /**
     * Disconnect from an agent
     */
    async _disconnectAgent(agentId) {
        try {
            // Set agent status to DISCONNECTED
            await this._agentDiscovery.updateAgentStatus(agentId, shared_1.ConnectionStatus.DISCONNECTED);
            vscode.window.showInformationMessage(`Disconnected from agent ${agentId}`);
            await this._refreshAgents();
        }
        catch (error) {
            this._logger.error(`Failed to disconnect agent ${agentId}:`, error);
            vscode.window.showErrorMessage(`Failed to disconnect from agent ${agentId}`);
        }
    }
    /**
     * Start a conversation with an agent
     */
    async _startConversation(agentId) {
        try {
            // Execute the startConversation command with the agent ID
            await vscode.commands.executeCommand('thefuse.startConversation', agentId);
        }
        catch (error) {
            this._logger.error(`Failed to start conversation with agent ${agentId}:`, error);
            vscode.window.showErrorMessage(`Failed to start conversation with agent ${agentId}`);
        }
    }
    /**
     * Configure an agent
     */
    async _configureAgent(agentId) {
        // Show configuration dialog
        vscode.window.showInformationMessage(`Configuring agent ${agentId} (not implemented yet)`);
    }
    /**
     * Generate HTML content for the webview
     */
    _getHtmlForWebview() {
        const nonce = this.getNonce();
        const bodyContent = `
            <div class="agents-header">
                <h2>AI Agents</h2>
                <div class="agents-actions">
                    <button id="refreshBtn" title="Refresh agents">
                        <span>Refresh</span>
                    </button>
                </div>
            </div>
            
            <div class="content-area" id="agentsList"></div>
            
            <script nonce="${nonce}">
                // Store state
                const state = {
                    agents: []
                };
                
                // Elements
                const agentsList = document.getElementById('agentsList');
                const refreshBtn = document.getElementById('refreshBtn');
                
                // Event handlers
                refreshBtn.addEventListener('click', () => {
                    vscode.postMessage({ command: 'refreshAgents' });
                });
                
                // Handle agent actions
                function handleAgentAction(actionType, agentId) {
                    switch (actionType) {
                        case 'connect':
                            vscode.postMessage({ 
                                command: 'connectAgent', 
                                agentId 
                            });
                            break;
                        case 'disconnect':
                            vscode.postMessage({ 
                                command: 'disconnectAgent', 
                                agentId 
                            });
                            break;
                        case 'start':
                            vscode.postMessage({ 
                                command: 'startConversation', 
                                agentId 
                            });
                            break;
                        case 'configure':
                            vscode.postMessage({ 
                                command: 'configureAgent', 
                                agentId 
                            });
                            break;
                    }
                }
                
                // Handle messages from the extension
                window.addEventListener('message', (event) => {
                    const message = event.data;
                    
                    switch (message.command) {
                        case 'updateAgents':
                            state.agents = message.agents;
                            renderAgents();
                            break;
                    }
                });
                
                // Get status badge class based on connection status
                function getStatusBadgeClass(status) {
                    switch (status) {
                        case 'CONNECTED':
                            return 'badge-success';
                        case 'CONNECTING':
                            return 'badge-info';
                        case 'DISCONNECTING':
                            return 'badge-warning';
                        case 'DISCONNECTED':
                        default:
                            return 'badge-error';
                    }
                }
                
                // Render agents
                function renderAgents() {
                    agentsList.innerHTML = '';
                    
                    if (state.agents.length === 0) {
                        const emptyState = document.createElement('div');
                        emptyState.className = 'empty-state';
                        emptyState.innerHTML = \`
                            <div class="empty-icon">🤖</div>
                            <h3>No agents found</h3>
                            <p>No AI agents are currently registered</p>
                        \`;
                        agentsList.appendChild(emptyState);
                        return;
                    }
                    
                    state.agents.forEach(agent => {
                        const agentCard = document.createElement('div');
                        agentCard.className = 'card agent-card';
                        
                        // Create agent header with name and status badge
                        const header = document.createElement('div');
                        header.className = 'agent-header';
                        
                        const name = document.createElement('div');
                        name.className = 'agent-name';
                        name.innerText = agent.name;
                        
                        const statusBadge = document.createElement('div');
                        statusBadge.className = 'badge ' + getStatusBadgeClass(agent.status);
                        statusBadge.innerText = agent.status;
                        
                        header.appendChild(name);
                        header.appendChild(statusBadge);
                        
                        // Create agent details
                        const details = document.createElement('div');
                        details.className = 'agent-details';
                        details.innerHTML = \`
                            <div class="agent-provider">Provider: <span>${agent.provider || 'Unknown'}</span></div>
                            <div class="agent-version">Version: <span>${agent.version || '1.0.0'}</span></div>
                        \`;
                        
                        // Create agent capabilities
                        let capabilities = '';
                        if (agent.capabilities && agent.capabilities.length > 0) {
                            capabilities = \`
                                <div class="agent-capabilities">
                                    <h4>Capabilities:</h4>
                                    <ul>
                                        \${agent.capabilities.map(cap => 
                                            \`<li>\${cap.name || cap.id}</li>\`
                                        ).join('')}
                                    </ul>
                                </div>
                            \`;
                        }
                        
                        // Create agent actions
                        const actions = document.createElement('div');
                        actions.className = 'agent-actions';
                        
                        if (agent.status === 'CONNECTED') {
                            actions.innerHTML = \`
                                <button class="action-button" onclick="handleAgentAction('start', '\${agent.id}')">
                                    Start Conversation
                                </button>
                                <button class="action-button" onclick="handleAgentAction('disconnect', '\${agent.id}')">
                                    Disconnect
                                </button>
                            \`;
                        } else {
                            actions.innerHTML = \`
                                <button class="action-button" onclick="handleAgentAction('connect', '\${agent.id}')">
                                    Connect
                                </button>
                            \`;
                        }
                        
                        actions.innerHTML += \`
                            <button class="action-button secondary" onclick="handleAgentAction('configure', '\${agent.id}')">
                                Configure
                            </button>
                        \`;
                        
                        // Assemble agent card
                        agentCard.appendChild(header);
                        agentCard.appendChild(details);
                        if (capabilities) {
                            const capabilitiesEl = document.createElement('div');
                            capabilitiesEl.innerHTML = capabilities;
                            agentCard.appendChild(capabilitiesEl);
                        }
                        agentCard.appendChild(actions);
                        
                        agentsList.appendChild(agentCard);
                    });
                }
                
                // Initial render
                renderAgents();
            </script>
            
            <style>
                .agents-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                
                .agents-header h2 {
                    margin: 0;
                }
                
                .agents-actions button {
                    padding: 4px 8px;
                    font-size: 0.9em;
                }
                
                .agent-card {
                    margin-bottom: 15px;
                }
                
                .agent-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .agent-name {
                    font-weight: bold;
                    font-size: 1.1em;
                }
                
                .agent-details {
                    margin-bottom: 8px;
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                }
                
                .agent-capabilities {
                    margin: 10px 0;
                }
                
                .agent-capabilities h4 {
                    margin: 0 0 5px 0;
                    font-size: 0.9em;
                }
                
                .agent-capabilities ul {
                    margin: 0;
                    padding-left: 20px;
                    font-size: 0.9em;
                }
                
                .agent-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 10px;
                }
                
                .action-button {
                    flex: 1;
                    min-width: 120px;
                    font-size: 0.9em;
                    text-align: center;
                }
                
                .action-button.secondary {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                }
                
                .action-button.secondary:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }
                
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--vscode-descriptionForeground);
                    text-align: center;
                    padding: 20px;
                }
                
                .empty-icon {
                    font-size: 2rem;
                    margin-bottom: 10px;
                }
            </style>
        `;
        return this.getBaseHtml(this._view.webview, 'AI Agents', bodyContent);
    }
    /**
     * Send a message to the webview
     */
    postMessage(message) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }
}
exports.AgentsView = AgentsView;
//# sourceMappingURL=agents-view.js.map