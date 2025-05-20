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
exports.InterAIHub = void 0;
exports.createInterAIHub = createInterAIHub;
const vscode = __importStar(require("vscode"));
/**
 * Central hub for coordinating AI agent communication
 */
class InterAIHub {
    constructor(context, agentClient, lmBridge) {
        this.communicationLog = [];
        this.agentStatusListeners = [];
        this.context = context;
        this.agentClient = agentClient;
        this.lmBridge = lmBridge;
        this.outputChannel = vscode.window.createOutputChannel('Inter-AI Hub');
        // Status bar item to show connected agents
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 10);
        this.statusBarItem.text = "$(plug) AI Agents: Initializing...";
        this.statusBarItem.tooltip = "Click to view connected AI agents";
        this.statusBarItem.command = 'thefuse.showConnectedAgents';
        this.statusBarItem.show();
        // Register commands
        this.registerCommands();
        // Start monitoring for agent updates
        this.startAgentMonitoring();
        // Subscribe to message events
        this.subscribeToMessages();
    }
    /**
     * Register commands related to the Inter-AI Hub
     */
    registerCommands() {
        // Command to show connected agents
        this.context.subscriptions.push(vscode.commands.registerCommand('thefuse.showConnectedAgents', () => {
            this.showConnectedAgents();
        }));
        // Command to view communication log
        this.context.subscriptions.push(vscode.commands.registerCommand('thefuse.viewCommunicationLog', () => {
            this.showCommunicationLog();
        }));
        // Command to test connection with an agent
        this.context.subscriptions.push(vscode.commands.registerCommand('thefuse.testAgentConnection', async (agentId) => {
            return this.testAgentConnection(agentId);
        }));
        // Command to send a custom message
        this.context.subscriptions.push(vscode.commands.registerCommand('thefuse.sendCustomMessage', async (recipient, action, payload) => {
            return this.sendCustomMessage(recipient, action, payload);
        }));
    }
    /**
     * Start monitoring for agent updates
     */
    startAgentMonitoring() {
        // Check agents every 30 seconds
        setInterval(() => this.updateAgentStatus(), 30000);
        // Do an initial update
        this.updateAgentStatus();
    }
    /**
     * Subscribe to message events
     */
    subscribeToMessages() {
        this.agentClient.subscribe(async (message) => {
            // Log the message
            this.logCommunication({
                timestamp: Date.now(),
                sender: message.sender,
                recipient: message.recipient,
                action: message.action,
                direction: 'incoming',
                successful: true
            });
            // Process the message
            await this.processIncomingMessage(message);
        });
    }
    /**
     * Process an incoming message
     */
    async processIncomingMessage(message) {
        // Handle ping/pong messages
        if (message.action === 'ping') {
            await this.agentClient.sendMessage(message.sender, 'pong', {
                requestId: message.id,
                timestamp: Date.now()
            });
        }
        // Handle capability requests
        if (message.action === 'getCapabilities') {
            await this.agentClient.sendMessage(message.sender, 'capabilities', {
                requestId: message.id,
                capabilities: ['inter-ai-communication', 'orchestration', 'messaging']
            });
        }
    }
    /**
     * Update agent status
     */
    async updateAgentStatus() {
        try {
            // Get registered agents
            const agents = await this.agentClient.getRegisteredAgents();
            // Update status bar with count
            const activeAgents = agents.filter((agent) => agent.active !== false);
            this.statusBarItem.text = `$(plug) AI Agents: ${activeAgents.length}`;
            // Notify listeners
            this.notifyAgentStatusListeners(agents);
            this.log(`Updated agent status. ${activeAgents.length} active agents.`);
        }
        catch (error) {
            this.log(`Error updating agent status: ${error.message}`);
        }
    }
    /**
     * Show connected agents in a quick pick
     */
    async showConnectedAgents() {
        try {
            const agents = await this.agentClient.getRegisteredAgents();
            // Check if we have any agents
            if (!agents || agents.length === 0) {
                vscode.window.showInformationMessage('No AI agents connected. Try discovering agents first.');
                return;
            }
            // Create quick pick items
            const items = agents.map((agent) => ({
                label: agent.name || agent.id,
                description: agent.capabilities ? agent.capabilities.join(', ') : 'No capabilities',
                detail: `ID: ${agent.id} | Version: ${agent.version || 'unknown'} | Active: ${agent.active !== false ? 'Yes' : 'No'}`,
                agent
            }));
            // Show quick pick
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select an AI agent to interact with',
                matchOnDescription: true,
                matchOnDetail: true
            });
            if (selected) {
                await this.showAgentActions(selected.agent);
            }
        }
        catch (error) {
            this.log(`Error showing connected agents: ${error.message}`);
            vscode.window.showErrorMessage(`Error retrieving connected agents: ${error.message}`);
        }
    }
    /**
     * Show actions for a specific agent
     */
    async showAgentActions(agent) {
        const actions = [
            {
                label: '$(zap) Test Connection',
                description: 'Ping the agent to test connection',
                action: 'test'
            },
            {
                label: '$(comment-discussion) Send Custom Message',
                description: 'Send a custom message to this agent',
                action: 'message'
            },
            {
                label: '$(info) View Capabilities',
                description: 'View detailed capabilities',
                action: 'capabilities'
            }
        ];
        const selected = await vscode.window.showQuickPick(actions, {
            placeHolder: `Select an action for ${agent.name || agent.id}`
        });
        if (!selected)
            return;
        switch (selected.action) {
            case 'test':
                await this.testAgentConnection(agent.id);
                break;
            case 'message':
                await this.sendCustomMessage(agent.id);
                break;
            case 'capabilities':
                await this.showAgentCapabilities(agent);
                break;
        }
    }
    /**
     * Test connection with an agent
     */
    async testAgentConnection(agentId) {
        try {
            // If no agent ID provided, ask for one
            if (!agentId) {
                const agents = await this.agentClient.getRegisteredAgents();
                const items = agents.map((agent) => ({
                    label: agent.name || agent.id,
                    description: agent.id,
                    id: agent.id
                }));
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select an agent to test connection with'
                });
                if (!selected)
                    return false;
                agentId = selected.id;
            }
            // Send a ping message
            this.log(`Testing connection with agent ${agentId}...`);
            const startTime = Date.now();
            // Log the outgoing message
            this.logCommunication({
                timestamp: startTime,
                sender: 'thefuse.main',
                recipient: agentId || '',
                action: 'ping',
                direction: 'outgoing',
                successful: true
            });
            // Send the ping message
            const success = await this.agentClient.sendMessage(agentId || '', 'ping', {
                timestamp: startTime
            });
            if (success) {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                vscode.window.showInformationMessage(`Successfully connected to ${agentId} (${responseTime}ms)`);
                return true;
            }
            else {
                vscode.window.showErrorMessage(`Failed to connect to ${agentId}`);
                return false;
            }
        }
        catch (error) {
            this.log(`Error testing connection: ${error.message}`);
            vscode.window.showErrorMessage(`Error testing connection: ${error.message}`);
            return false;
        }
    }
    /**
     * Send a custom message to an agent
     */
    async sendCustomMessage(recipient, action, payload) {
        try {
            // If no recipient provided, ask for one
            if (!recipient) {
                const agents = await this.agentClient.getRegisteredAgents();
                const items = agents.map((agent) => ({
                    label: agent.name || agent.id,
                    description: agent.id,
                    id: agent.id
                }));
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select a recipient agent'
                });
                if (!selected)
                    return false;
                recipient = selected.id;
            }
            // If no action provided, ask for one
            if (!action) {
                action = await vscode.window.showInputBox({
                    prompt: 'Enter action name',
                    placeHolder: 'e.g., generateText, analyzeCode'
                });
                if (!action)
                    return false;
            }
            // If no payload provided, ask for one
            if (!payload) {
                const payloadInput = await vscode.window.showInputBox({
                    prompt: 'Enter payload (JSON)',
                    placeHolder: '{"prompt": "Hello world"}'
                });
                if (!payloadInput)
                    return false;
                try {
                    payload = JSON.parse(payloadInput);
                }
                catch (error) {
                    vscode.window.showErrorMessage('Invalid JSON payload');
                    return false;
                }
            }
            // Log the outgoing message
            this.logCommunication({
                timestamp: Date.now(),
                sender: 'thefuse.main',
                recipient: recipient,
                action,
                direction: 'outgoing',
                successful: true
            });
            // Send the message
            const success = await this.agentClient.sendMessage(recipient || '', action || '', payload);
            if (success) {
                vscode.window.showInformationMessage(`Message sent to ${recipient}`);
                return true;
            }
            else {
                vscode.window.showErrorMessage(`Failed to send message to ${recipient}`);
                return false;
            }
        }
        catch (error) {
            this.log(`Error sending custom message: ${error.message}`);
            vscode.window.showErrorMessage(`Error sending message: ${error.message}`);
            return false;
        }
    }
    /**
     * Show agent capabilities
     */
    async showAgentCapabilities(agent) {
        const capabilitiesContent = `# ${agent.name || agent.id} Capabilities

ID: ${agent.id}
Version: ${agent.version || 'unknown'}
Provider: ${agent.provider || 'unknown'}
API Type: ${agent.apiType || 'unknown'}
Last Seen: ${new Date(agent.lastSeen).toLocaleString()}
Active: ${agent.active !== false ? 'Yes' : 'No'}

## Capabilities
${agent.capabilities ? agent.capabilities.map(cap => `- ${cap}`).join('\n') : 'No capabilities reported'}
`;
        // Show in editor
        const doc = await vscode.workspace.openTextDocument({
            content: capabilitiesContent,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc);
    }
    /**
     * Show communication log
     */
    async showCommunicationLog() {
        if (this.communicationLog.length === 0) {
            vscode.window.showInformationMessage('No communication logged yet');
            return;
        }
        // Format log entries
        const logContent = this.communicationLog.map(entry => {
            const timestamp = new Date(entry.timestamp).toLocaleString();
            const direction = entry.direction === 'outgoing' ? '→' : '←';
            const status = entry.successful ? '✓' : '✗';
            return `[${timestamp}] ${status} ${entry.sender} ${direction} ${entry.recipient}: ${entry.action}`;
        }).join('\n');
        // Show in editor
        const doc = await vscode.workspace.openTextDocument({
            content: logContent,
            language: 'plaintext'
        });
        await vscode.window.showTextDocument(doc);
    }
    /**
     * Log a communication entry
     */
    logCommunication(entry) {
        // Add to log
        this.communicationLog.push(entry);
        // Truncate log if it gets too long
        if (this.communicationLog.length > 1000) {
            this.communicationLog = this.communicationLog.slice(-500);
        }
        // Log to output channel
        const timestamp = new Date(entry.timestamp).toLocaleString();
        const direction = entry.direction === 'outgoing' ? '→' : '←';
        this.log(`${timestamp} ${entry.sender} ${direction} ${entry.recipient}: ${entry.action}`);
    }
    /**
     * Add a listener for agent status changes
     */
    onAgentStatusChanged(listener) {
        this.agentStatusListeners.push(listener);
        return {
            dispose: () => {
                const index = this.agentStatusListeners.indexOf(listener);
                if (index !== -1) {
                    this.agentStatusListeners.splice(index, 1);
                }
            }
        };
    }
    /**
     * Notify listeners of agent status change
     */
    notifyAgentStatusListeners(agents) {
        for (const listener of this.agentStatusListeners) {
            listener(agents);
        }
    }
    /**
     * Log a message to the output channel
     */
    log(message) {
        this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
    }
    /**
     * Dispose of resources
     */
    dispose() {
        this.statusBarItem.dispose();
        this.outputChannel.dispose();
    }
}
exports.InterAIHub = InterAIHub;
// Export factory function
function createInterAIHub(context, agentClient, lmBridge // Changed type to 'any' to be compatible with both implementations
) {
    return new InterAIHub(context, agentClient, lmBridge);
}
//# sourceMappingURL=inter-ai-hub.js.map