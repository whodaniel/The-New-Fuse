import * as vscode from 'vscode';
import { 
    AgentCommunicationManager, 
    AgentMessage, 
    AgentMessageType,
    AgentConnection,
    AgentRegistration 
} from '../types/agent-communication';
import { MCPClient, MCPCommand, MCPCommandType } from '../types/mcp';
import { LLMProviderManager } from '../llm/LLMProviderManager';
import { AgentRegistry } from './AgentRegistry';

const AGENT_ID_GLOBAL = 'global';
const CONNECTION_ID_LLM_PROVIDER = 'llm-provider';
const CONNECTION_ID_MCP_CLIENT = 'mcp-client';
const CONNECTION_TYPE_AGENT = 'agent';
const CONNECTION_TYPE_LLM = 'llm';
const CONNECTION_TYPE_MCP = 'mcp';
const SOURCE_MCP = 'mcp';
const SOURCE_BROADCAST = 'broadcast';
const SOURCE_COLLABORATION_SERVICE = 'collaboration-service';

/**
 * Enhanced communication service between different AI agents in the system
 * Migrated and enhanced from old-vscode-extension with full feature parity
 */
export class AgentCommunicationService implements AgentCommunicationManager, vscode.Disposable {
    private messageHandlers: Map<string, ((message: AgentMessage) => Promise<void>)[]> = new Map();
    private connections: AgentConnection[] = [];
    private cleanupInterval: NodeJS.Timeout | undefined;
    private agentRegistry: AgentRegistry;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly llmManager: LLMProviderManager,
        private readonly mcpClient?: MCPClient,
        agentRegistry?: AgentRegistry
    ) {
        this.agentRegistry = agentRegistry || new AgentRegistry(context);
        this.initializeConnections();
        
        // If MCP client is provided, set up response handler
        if (this.mcpClient) {
            this.mcpClient.onResponse(response => {
                if (response.success && response.data?.message) { // TODO: Define a clear type for response.data
                    this.handleIncomingMessage(response.data.message);
                }
            });
        }

        // Start cleanup timer
        this.startCleanupTimer();
    }

    private initializeConnections() {
        // Add the LLM provider as a connection
        // this.connections.push({
        //     id: CONNECTION_ID_LLM_PROVIDER,
        //     type: CONNECTION_TYPE_LLM,
        //     status: 'connected'
        // });
        
        // Add MCP connection if available
        if (this.mcpClient) {
            this.connections.push({
                id: CONNECTION_ID_MCP_CLIENT,
                type: CONNECTION_TYPE_MCP,
                status: this.mcpClient.isConnected() ? 'connected' : 'disconnected'
            });
        } // LLM provider connection could be added if it's actively managed as a "connection"
    }

    async connect(): Promise<void> {
        // Connect the MCP client if available
        if (this.mcpClient) {
            try {
                await this.mcpClient.connect();
                this.updateConnectionStatus(CONNECTION_ID_MCP_CLIENT, 'connected');
            } catch (error) {
                this.updateConnectionStatus(CONNECTION_ID_MCP_CLIENT, 'error', error instanceof Error ? error.message : String(error));
                throw error;
            }
        }
    }

    async disconnect(): Promise<void> {
        // Disconnect the MCP client if available
        if (this.mcpClient) {
            await this.mcpClient.disconnect();
            this.updateConnectionStatus(CONNECTION_ID_MCP_CLIENT, 'disconnected');
        }
    }

    isConnected(): boolean {
        // Check if any connections are active
        return this.connections.some(conn => conn.status === 'connected');
    }

    /**
     * Register a new agent in the system
     */
    async registerAgent(registration: AgentRegistration): Promise<string> {
        const agentId = await this.agentRegistry.registerAgent(registration);
        
        // Add agent as a connection
        this.connections.push({
            id: agentId,
            type: CONNECTION_TYPE_AGENT,
            status: 'connected',
            agent: registration
        });

        console.log(`Agent registered: ${registration.name} (${agentId})`);
        return agentId;
    }

    /**
     * Unregister an agent from the system
     */
    async unregisterAgent(agentId: string): Promise<void> {
        await this.agentRegistry.unregisterAgent(agentId);
        
        // Remove connection
        const connectionIndex = this.connections.findIndex(c => c.id === agentId);
        if (connectionIndex !== -1) {
            this.connections.splice(connectionIndex, 1);
        }

        // Remove message handlers
        this.messageHandlers.delete(agentId);
        
        console.log(`Agent unregistered: ${agentId}`);
    }

    /**
     * Get all registered agents
     */
    getRegisteredAgents(): AgentRegistration[] {
        return this.agentRegistry.getAllAgents();
    }

    /**
     * Send a message to a specific recipient or broadcast
     */
    async sendMessage(message: AgentMessage): Promise<void> {
        // Ensure the message has required fields
        if (!message.id) {
            message.id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        }
        
        if (!message.timestamp) {
            message.timestamp = Date.now();
        }

        // Notify global handlers about the message intent
        await this.notifyGlobalHandlers(message);

        try {
            if (message.recipient) {
                // Send to specific recipient
                await this.dispatchToSpecificRecipient(message);
            } else {
                // Broadcast message
                await this.dispatchBroadcast(message);
            }
            await this.handleSpecialRouting(message); // Handle MCP and other special routing
            this.updateLastMessage(message); // Update last message after all processing
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Helper to easily broadcast a message.
     * This constructs an AgentMessage and sends it via the main sendMessage flow.
     */
    async broadcastMessage(type: string, payload: any, action?: string): Promise<void> {
        const message: AgentMessage = {
            id: `broadcast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: type as AgentMessageType,
            source: SOURCE_BROADCAST,
            payload,
            action,
            timestamp: Date.now()
            // No recipient, signifying a broadcast
        };
        await this.sendMessage(message);
    }

    private async dispatchBroadcast(originalMessage: AgentMessage): Promise<void> {
        const activeAgents = this.agentRegistry.getActiveAgents();
        const broadcastPromises: Promise<void>[] = [];

        for (const agent of activeAgents) {
            const targetedMessage: AgentMessage = {
                ...originalMessage,
                recipient: agent.id,
                // Ensure source reflects it's part of a broadcast if not already set
                source: originalMessage.source || SOURCE_BROADCAST 
            };
            broadcastPromises.push(this.dispatchToSpecificRecipient(targetedMessage));
        }
        await Promise.all(broadcastPromises);
    }

    /**
     * Subscribe to messages for a specific agent or globally
     */
    subscribe(handler: (message: AgentMessage) => Promise<void>, agentId: string = AGENT_ID_GLOBAL): () => void {
        if (!this.messageHandlers.has(agentId)) {
            this.messageHandlers.set(agentId, []);
        }

        const handlers = this.messageHandlers.get(agentId)!;
        handlers.push(handler);

        console.log(`Handler subscribed for ${agentId}, total handlers: ${handlers.length}`);

        // Return unsubscribe function
        return () => {
            const currentHandlers = this.messageHandlers.get(agentId);
            if (currentHandlers) {
                const index = currentHandlers.indexOf(handler);
                if (index !== -1) {
                    currentHandlers.splice(index, 1);
                    console.log(`Handler unsubscribed for ${agentId}`);
                }
            }
        };
    }

    /**
     * Subscribe to all messages (legacy method, prefer `subscribe(handler)` or `subscribe(handler, AGENT_ID_GLOBAL)`)
     * @deprecated Prefer subscribe(handler, AGENT_ID_GLOBAL)
     */
    onMessage(callback: (message: AgentMessage) => void): void {
        console.warn("`onMessage` is deprecated. Use `subscribe(handler)` for global messages or `subscribe(handler, AGENT_ID_GLOBAL)`.");
        this.subscribe(async (msg) => callback(msg), AGENT_ID_GLOBAL);
    }

    private async dispatchToSpecificRecipient(message: AgentMessage): Promise<void> {
        if (!message.recipient) {
            console.error('dispatchToSpecificRecipient called without a recipient:', message);
            return;
        }

        // Check if recipient is a registered agent
        const recipientAgent = this.agentRegistry.getAgent(message.recipient);
        if (!recipientAgent || !recipientAgent.active) {
            console.warn(`Recipient agent ${message.recipient} is not active or not found`);
            return;
        }        

        const handlers = this.messageHandlers.get(message.recipient) || [];
        for (const handler of handlers) {
            try {
                await handler(message);
            } catch (error) {
                console.error(`Error in message handler for ${message.recipient}:`, error);
            }
        }
    }

    private async handleSpecialRouting(message: AgentMessage): Promise<void> {
        // Route to MCP if applicable
        if (this.mcpClient && this.mcpClient.isConnected()) {
            // Avoid sending messages that originated from MCP back to MCP
            if (message.metadata?.source !== SOURCE_MCP) {
                try {
                    await this.mcpClient.sendCommand({
                        id: message.id || `cmd_${Date.now()}`, // Ensure message has an ID
                        type: this.getMessageTypeForMCP(message.type),
                        payload: { agentMessage: message } // Encapsulate AgentMessage
                    });
                } catch (error) {
                    console.error('Failed to send message to MCP:', error);
                }
            }
        }

        // Route to LLM provider if it's a user message
        if (message.type === AgentMessageType.USER) {
            // LLM processing is handled elsewhere (typically in ChatViewProvider)
            // No direct action here, global handlers or specific LLM agent handlers would manage this.
        }
    }

    private getMessageTypeForMCP(messageType: AgentMessageType): MCPCommandType {
        switch (messageType) {
            case AgentMessageType.SYSTEM:
                return MCPCommandType.SYSTEM;
            default:
                return MCPCommandType.QUERY;
        }
    }

    private async handleIncomingMessage(message: AgentMessage): Promise<void> {
        // Add metadata to track the source
        if (!message.metadata) {
            message.metadata = {};
        }
        message.metadata.source = SOURCE_MCP;
        
        console.log(`Handling incoming message from MCP: ${message.id}, type: ${message.type}`);
        
        // Notify global handlers and wait for them to complete
        await this.notifyGlobalHandlers(message);
        
        // If the incoming message is targeted, notify specific handlers
        if (message.recipient) {
            console.log(`Incoming message ${message.id} is targeted to ${message.recipient}`);
            const specificHandlers = this.messageHandlers.get(message.recipient) || [];
            if (specificHandlers.length > 0) {
                await Promise.all(specificHandlers.map(async handler => {
                    try {
                        await handler(message);
                    } catch (error) {
                        console.error(`Error in incoming message handler for ${message.recipient} (message ID: ${message.id}):`, error);
                    }
                }));
            } else {
                console.log(`No specific handlers found for recipient ${message.recipient} (message ID: ${message.id})`);
            }
        } else {
            console.log(`Incoming message ${message.id} is not targeted to a specific recipient.`);
        }
    }

    private async notifyGlobalHandlers(message: AgentMessage): Promise<void> {
        const globalHandlers = this.messageHandlers.get(AGENT_ID_GLOBAL) || [];
        if (globalHandlers.length > 0) {
            await Promise.all(globalHandlers.map(async (handler) => {
                try {
                    await handler(message);
                } catch (error) {
                    console.error(`Error in global message handler (message ID: ${message.id}):`, error);
                }
            }));
        }
    }

    private updateConnectionStatus(
        id: string, 
        status: 'connected' | 'disconnected' | 'error', 
        error?: string
    ) {
        const connection = this.connections.find(c => c.id === id);
        if (connection) {
            connection.status = status;
            connection.error = error;
        }
    }

    private updateLastMessage(message: AgentMessage) {
        // Find the right connection to update based on message metadata or type
        let connectionToUpdateId: string | undefined;
        
        if (message.metadata?.source === SOURCE_MCP) {
            connectionToUpdateId = CONNECTION_ID_MCP_CLIENT;
        } else if (message.recipient) {
            // If there's a recipient, it could be an agent ID or a special ID like LLM_PROVIDER
            connectionToUpdateId = message.recipient;
        } // Else: for broadcasts or messages without a clear recipient connection, we might not update.
          // Or, if user messages without recipient are implicitly for LLM:
          // else if (message.type === AgentMessageType.USER) connectionToUpdateId = CONNECTION_ID_LLM_PROVIDER;
        const connection = this.connections.find(c => c.id === connectionToUpdateId);
        if (connection) {
            connection.lastMessage = message;
        }
    }

    private startCleanupTimer() {
        // Clean up inactive agents every 5 minutes
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cleanupInterval = setInterval(async () => {
            await this.agentRegistry.cleanupInactiveAgents();
        }, 5 * 60 * 1000); // 5 minutes
    }

    /**
     * Get the current connection status
     */
    getConnections(): AgentConnection[] {
        return [...this.connections];
    }

    /**
     * Get registry statistics
     */
    getRegistryStats() {
        return this.agentRegistry.getStats();
    }

    /**
     * Register a webview with the communication service
     */
    registerWebview(webview: any): void {
        // TODO: Define the purpose of this webview registration.
        // If this is for the main Chat UI, it's likely managed by a dedicated ChatViewProvider.
        // If this service needs to communicate with other specific webviews (e.g., agent configuration panels),
        // then implement the specific logic for storing and interacting with `webview.postMessage` and `webview.onDidReceiveMessage`.
        // Store webview reference if needed for direct communication
        console.log('Webview registered with communication service');
    }

    /**
     * Start AI collaboration mode
     */
    async startCollaboration(): Promise<void> {
        console.log('Starting AI collaboration...');
        
        // Send collaboration start message
        const message: AgentMessage = {
            id: `collab-start-${Date.now()}`,
            type: AgentMessageType.SYSTEM,
            source: SOURCE_COLLABORATION_SERVICE,
            content: 'AI Collaboration started',
            timestamp: Date.now(),
            action: 'start-collaboration'
            // No recipient, implies broadcast
        };
        await this.sendMessage(message);
    }

    /**
     * Stop AI collaboration mode
     */
    async stopCollaboration(): Promise<void> {
        console.log('Stopping AI collaboration...');
        
        // Send collaboration stop message
        const message: AgentMessage = {
            id: `collab-stop-${Date.now()}`,
            type: AgentMessageType.SYSTEM,
            source: SOURCE_COLLABORATION_SERVICE,
            content: 'AI Collaboration stopped',
            timestamp: Date.now(),
            action: 'stop-collaboration'
            // No recipient, implies broadcast
        };
        await this.sendMessage(message);
    }

    dispose() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
        this.messageHandlers.clear();
        this.connections.length = 0; // Clear connections array
        // If mcpClient is managed by this service, consider disconnecting:
        // this.mcpClient?.disconnect(); 
        console.log('AgentCommunicationService disposed.');
    }
}
