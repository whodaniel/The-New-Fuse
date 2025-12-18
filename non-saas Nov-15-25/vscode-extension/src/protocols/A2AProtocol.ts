import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { AgentMessage, AgentRegistration } from '../types/agent-communication';

/**
 * Google Agent2Agent Protocol Implementation
 * Based on the latest A2A specification for inter-agent communication
 */

export interface A2ACapability {
    name: string;
    version: string;
    description: string;
    parameters: Record<string, any>;
    required: boolean;
}

export interface A2AAgent {
    id: string;
    name: string;
    version: string;
    capabilities: A2ACapability[];
    endpoints: {
        discovery: string;
        communication: string;
        health: string;
    };
    metadata: Record<string, any>;
    status: 'online' | 'offline' | 'busy' | 'error';
    lastSeen: number;
}

export interface A2ATask {
    id: string;
    type: 'request' | 'response' | 'broadcast' | 'delegation';
    source: string;
    target?: string;
    capability: string;
    payload: any;
    context: Record<string, any>;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    timeout: number;
    lifecycle: {
        created: number;
        started?: number;
        completed?: number;
        failed?: number;
    };
    dependencies?: string[];
    results?: any;
    error?: string;
}

export interface A2AMessage {
    id: string;
    version: '1.0';
    type: 'discovery' | 'capability_query' | 'task_request' | 'task_response' | 'status_update' | 'heartbeat';
    source: string;
    target?: string;
    timestamp: number;
    payload: any;
    context?: Record<string, any>;
    signature?: string;
}

/**
 * Agent-to-Agent Protocol Client
 * Implements Google's A2A specification for standardized agent communication
 */
export class A2AProtocolClient extends EventEmitter {
    private agents: Map<string, A2AAgent> = new Map();
    private tasks: Map<string, A2ATask> = new Map();
    private capabilities: Map<string, A2ACapability> = new Map();
    private heartbeatInterval: NodeJS.Timeout | undefined;
    private discoveryInterval: NodeJS.Timeout | undefined;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly localAgent: A2AAgent
    ) {
        super();
        this.registerLocalAgent();
        this.startHeartbeat();
        this.startDiscovery();
    }

    /**
     * Register local agent capabilities
     */
    private registerLocalAgent(): void {
        this.agents.set(this.localAgent.id, this.localAgent);
        
        // Register capabilities
        for (const capability of this.localAgent.capabilities) {
            this.capabilities.set(capability.name, capability);
        }

        console.log(`A2A: Registered local agent ${this.localAgent.name} with ${this.localAgent.capabilities.length} capabilities`);
    }

    /**
     * Discover other agents in the network
     */
    async discoverAgents(): Promise<A2AAgent[]> {
        const discoveryMessage: A2AMessage = {
            id: this.generateId(),
            version: '1.0',
            type: 'discovery',
            source: this.localAgent.id,
            timestamp: Date.now(),
            payload: {
                agent: this.localAgent,
                request: 'agent_discovery'
            }
        };

        // Broadcast discovery message
        await this.broadcast(discoveryMessage);

        // Return currently known agents
        return Array.from(this.agents.values()).filter(agent => agent.id !== this.localAgent.id);
    }

    /**
     * Query agent capabilities
     */
    async queryCapabilities(agentId: string, capabilityName?: string): Promise<A2ACapability[]> {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        const queryMessage: A2AMessage = {
            id: this.generateId(),
            version: '1.0',
            type: 'capability_query',
            source: this.localAgent.id,
            target: agentId,
            timestamp: Date.now(),
            payload: {
                capability: capabilityName || '*'
            }
        };

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Capability query timeout'));
            }, 10000);

            this.once(`capability_response_${queryMessage.id}`, (capabilities: A2ACapability[]) => {
                clearTimeout(timeout);
                resolve(capabilities);
            });

            this.sendMessage(queryMessage);
        });
    }

    /**
     * Delegate task to another agent
     */
    async delegateTask(
        targetAgentId: string,
        capability: string,
        payload: any,
        options: {
            priority?: 'low' | 'normal' | 'high' | 'urgent';
            timeout?: number;
            context?: Record<string, any>;
        } = {}
    ): Promise<A2ATask> {
        const task: A2ATask = {
            id: this.generateId(),
            type: 'request',
            source: this.localAgent.id,
            target: targetAgentId,
            capability,
            payload,
            context: options.context || {},
            priority: options.priority || 'normal',
            timeout: options.timeout || 30000,
            lifecycle: {
                created: Date.now()
            }
        };

        this.tasks.set(task.id, task);

        const taskMessage: A2AMessage = {
            id: this.generateId(),
            version: '1.0',
            type: 'task_request',
            source: this.localAgent.id,
            target: targetAgentId,
            timestamp: Date.now(),
            payload: { task }
        };

        await this.sendMessage(taskMessage);
        task.lifecycle.started = Date.now();

        return task;
    }

    /**
     * Respond to a task request
     */
    async respondToTask(taskId: string, results: any, error?: string): Promise<void> {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }

        task.results = results;
        task.error = error;
        task.lifecycle.completed = Date.now();

        if (error) {
            task.lifecycle.failed = Date.now();
        }

        const responseMessage: A2AMessage = {
            id: this.generateId(),
            version: '1.0',
            type: 'task_response',
            source: this.localAgent.id,
            target: task.source,
            timestamp: Date.now(),
            payload: {
                taskId,
                results,
                error,
                lifecycle: task.lifecycle
            }
        };

        await this.sendMessage(responseMessage);
    }

    /**
     * Send message to specific agent or broadcast
     */
    private async sendMessage(message: A2AMessage): Promise<void> {
        // Add signature for security
        message.signature = this.signMessage(message);

        // Emit for local handlers
        this.emit('message_sent', message);

        // Integrate with existing AgentCommunicationService
        const agentMessage: AgentMessage = {
            id: message.id,
            type: this.convertA2ATypeToAgentType(message.type),
            source: message.source,
            recipient: message.target,
            content: JSON.stringify(message.payload),
            payload: message,
            metadata: {
                protocol: 'a2a',
                version: message.version,
                originalType: message.type
            },
            timestamp: message.timestamp
        };

        // Emit for integration with existing communication service
        this.emit('agent_message', agentMessage);
    }

    /**
     * Broadcast message to all agents
     */
    private async broadcast(message: A2AMessage): Promise<void> {
        message.target = undefined; // Remove target for broadcast
        await this.sendMessage(message);
    }

    /**
     * Handle incoming A2A message
     */
    async handleMessage(message: A2AMessage): Promise<void> {
        // Verify signature
        if (!this.verifyMessage(message)) {
            console.warn(`A2A: Invalid message signature from ${message.source}`);
            return;
        }

        // Update agent status
        if (message.source !== this.localAgent.id) {
            this.updateAgentStatus(message.source);
        }

        // Handle based on message type
        switch (message.type) {
            case 'discovery':
                await this.handleDiscovery(message);
                break;
            case 'capability_query':
                await this.handleCapabilityQuery(message);
                break;
            case 'task_request':
                await this.handleTaskRequest(message);
                break;
            case 'task_response':
                await this.handleTaskResponse(message);
                break;
            case 'status_update':
                await this.handleStatusUpdate(message);
                break;
            case 'heartbeat':
                await this.handleHeartbeat(message);
                break;
        }

        this.emit('message_received', message);
    }

    /**
     * Handle discovery messages
     */
    private async handleDiscovery(message: A2AMessage): Promise<void> {
        const agentInfo = message.payload.agent as A2AAgent;
        if (agentInfo && agentInfo.id !== this.localAgent.id) {
            this.agents.set(agentInfo.id, agentInfo);
            console.log(`A2A: Discovered agent ${agentInfo.name}`);

            // Respond with our agent info
            const responseMessage: A2AMessage = {
                id: this.generateId(),
                version: '1.0',
                type: 'discovery',
                source: this.localAgent.id,
                target: agentInfo.id,
                timestamp: Date.now(),
                payload: {
                    agent: this.localAgent,
                    response: 'agent_info'
                }
            };

            await this.sendMessage(responseMessage);
            this.emit('agent_discovered', agentInfo);
        }
    }

    /**
     * Handle capability queries
     */
    private async handleCapabilityQuery(message: A2AMessage): Promise<void> {
        const capabilityName = message.payload.capability;
        let capabilities: A2ACapability[];

        if (capabilityName === '*') {
            capabilities = Array.from(this.capabilities.values());
        } else {
            const capability = this.capabilities.get(capabilityName);
            capabilities = capability ? [capability] : [];
        }

        const responseMessage: A2AMessage = {
            id: this.generateId(),
            version: '1.0',
            type: 'capability_query',
            source: this.localAgent.id,
            target: message.source,
            timestamp: Date.now(),
            payload: {
                capabilities,
                queryId: message.id
            }
        };

        await this.sendMessage(responseMessage);
        this.emit(`capability_response_${message.id}`, capabilities);
    }

    /**
     * Handle task requests
     */
    private async handleTaskRequest(message: A2AMessage): Promise<void> {
        const task = message.payload.task as A2ATask;
        
        // Check if we have the required capability
        const capability = this.capabilities.get(task.capability);
        if (!capability) {
            await this.respondToTask(task.id, null, `Capability ${task.capability} not available`);
            return;
        }

        // Store task
        this.tasks.set(task.id, task);

        // Emit for local handlers
        this.emit('task_request', task);
    }

    /**
     * Handle task responses
     */
    private async handleTaskResponse(message: A2AMessage): Promise<void> {
        const { taskId, results, error, lifecycle } = message.payload;
        const task = this.tasks.get(taskId);
        
        if (task) {
            task.results = results;
            task.error = error;
            task.lifecycle = { ...task.lifecycle, ...lifecycle };
            
            this.emit('task_response', task);
        }
    }

    /**
     * Handle status updates
     */
    private async handleStatusUpdate(message: A2AMessage): Promise<void> {
        const { agentId, status } = message.payload;
        const agent = this.agents.get(agentId);
        
        if (agent) {
            agent.status = status;
            agent.lastSeen = message.timestamp;
            this.emit('agent_status_update', agent);
        }
    }

    /**
     * Handle heartbeat messages
     */
    private async handleHeartbeat(message: A2AMessage): Promise<void> {
        this.updateAgentStatus(message.source);
    }

    /**
     * Start periodic heartbeat
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(async () => {
            const heartbeatMessage: A2AMessage = {
                id: this.generateId(),
                version: '1.0',
                type: 'heartbeat',
                source: this.localAgent.id,
                timestamp: Date.now(),
                payload: {
                    status: this.localAgent.status,
                    capabilities: this.localAgent.capabilities.length
                }
            };

            await this.broadcast(heartbeatMessage);
        }, 30000); // Every 30 seconds
    }

    /**
     * Start periodic discovery
     */
    private startDiscovery(): void {
        this.discoveryInterval = setInterval(async () => {
            await this.discoverAgents();
        }, 300000); // Every 5 minutes
    }

    /**
     * Update agent status
     */
    private updateAgentStatus(agentId: string): void {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.lastSeen = Date.now();
            agent.status = 'online';
        }
    }

    /**
     * Convert A2A message type to AgentMessageType
     */
    private convertA2ATypeToAgentType(a2aType: string): any {
        // Map A2A types to existing AgentMessageType enum
        const typeMap: Record<string, string> = {
            'discovery': 'SYSTEM',
            'capability_query': 'COMMAND',
            'task_request': 'COMMAND',
            'task_response': 'RESPONSE',
            'status_update': 'STATUS_UPDATE',
            'heartbeat': 'STATUS_UPDATE'
        };
        
        return typeMap[a2aType] || 'SYSTEM';
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return `a2a_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Sign message for security
     */
    private signMessage(message: A2AMessage): string {
        // Implement HMAC or digital signature
        return `sig_${Date.now()}`;
    }

    /**
     * Verify message signature
     */
    private verifyMessage(message: A2AMessage): boolean {
        // Implement signature verification
        return true; // Simplified for demo
    }

    /**
     * Get all known agents
     */
    getAgents(): A2AAgent[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get the local agent's information.
     */
    public getLocalAgent(): A2AAgent {
        return this.localAgent;
    }

    /**
     * Get all active tasks
     */
    getTasks(): A2ATask[] {
        return Array.from(this.tasks.values());
    }

    /**
     * Get available capabilities
     */
    getCapabilities(): A2ACapability[] {
        return Array.from(this.capabilities.values());
    }

    /**
     * Cleanup resources
     */
    dispose(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
        }
        this.removeAllListeners();
    }
}
