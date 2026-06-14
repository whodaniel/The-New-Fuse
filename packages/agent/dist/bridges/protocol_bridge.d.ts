/**
 * Protocol Bridge - Multi-Protocol Communication Layer
 *
 * Enables agents to communicate using multiple protocols:
 * - A2A (Agent-to-Agent) Protocol v0.3.0
 * - MCP (Model Context Protocol)
 * - Custom TNF protocols
 *
 * CONNECTS TO:
 * - UniversalBridge: For transport abstraction
 * - A2A types: From @the-new-fuse/a2a-core
 * - MCP Server: For tool registration
 */
import { BaseBridge, MessageType, Priority } from './index.js';
export interface A2AAgentCard {
    id: string;
    name: string;
    description: string;
    version: string;
    capabilities: string[];
    protocols: string[];
    endpoints: {
        primary: string;
        fallback?: string;
    };
    authentication?: {
        type: 'bearer' | 'api-key' | 'oauth2' | 'none';
        credentials?: string;
    };
    metadata?: Record<string, unknown>;
}
export interface A2AMessage {
    id: string;
    type: 'request' | 'response' | 'notification' | 'error';
    protocol: 'a2a' | 'mcp' | 'tnf';
    version: string;
    from: string;
    to: string;
    timestamp: Date;
    payload: {
        action: string;
        data: unknown;
        context?: Record<string, unknown>;
    };
    correlation?: {
        requestId?: string;
        conversationId?: string;
        parentId?: string;
    };
    security?: {
        signature?: string;
        encrypted?: boolean;
        publicKey?: string;
    };
}
export interface A2ATask {
    id: string;
    name: string;
    description: string;
    requiredCapabilities: string[];
    input: unknown;
    timeout?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    dependencies?: string[];
}
export interface A2ATaskResult {
    taskId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    output?: unknown;
    error?: string;
    metrics?: {
        startTime: Date;
        endTime?: Date;
        tokensUsed?: number;
        toolCalls?: number;
    };
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}
export interface MCPResource {
    uri: string;
    name: string;
    mimeType?: string;
    description?: string;
}
export interface MCPPrompt {
    name: string;
    description?: string;
    arguments?: Array<{
        name: string;
        description?: string;
        required?: boolean;
    }>;
}
export interface ProtocolBridgeConfig {
    agentId: string;
    agentName?: string;
    supportedProtocols: ('a2a' | 'mcp' | 'tnf')[];
    defaultProtocol: 'a2a' | 'mcp' | 'tnf';
    mcpServerUrl?: string;
    a2aEndpoint?: string;
    enableDiscovery?: boolean;
    discoveryInterval?: number;
}
export declare class ProtocolBridge extends BaseBridge {
    private config;
    private knownAgents;
    private myAgentCard;
    private mcpTools;
    private mcpResources;
    private mcpPrompts;
    private messageHandlers;
    private pendingRequests;
    private discoveryInterval;
    constructor(config: ProtocolBridgeConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendMessage(message: Record<string, unknown>, messageType?: MessageType, priority?: Priority): Promise<void>;
    /**
     * Send an A2A message
     */
    send(message: A2AMessage): Promise<void>;
    /**
     * Send and wait for response
     */
    sendAndWait(to: string, action: string, data: unknown, timeout?: number): Promise<A2AMessage>;
    /**
     * Handle incoming message
     */
    handleMessage(message: A2AMessage): Promise<void>;
    /**
     * Register a message handler
     */
    onAction(action: string, handler: (message: A2AMessage) => Promise<void>): void;
    /**
     * Create an A2A message
     */
    createA2AMessage(to: string, action: string, data: unknown, type?: A2AMessage['type'], correlationId?: string): A2AMessage;
    /**
     * Create a response to a message
     */
    createResponse(originalMessage: A2AMessage, data: unknown, isError?: boolean): A2AMessage;
    private sendA2AMessage;
    /**
     * Register a tool with MCP
     */
    registerMCPTool(tool: MCPTool): void;
    /**
     * Register a resource with MCP
     */
    registerMCPResource(resource: MCPResource): void;
    /**
     * Register a prompt with MCP
     */
    registerMCPPrompt(prompt: MCPPrompt): void;
    /**
     * Get all MCP tools
     */
    getMCPTools(): MCPTool[];
    /**
     * Get all MCP resources
     */
    getMCPResources(): MCPResource[];
    private sendMCPMessage;
    private registerWithMCPServer;
    private sendTNFMessage;
    /**
     * Register a known agent
     */
    registerAgent(agentCard: A2AAgentCard): void;
    /**
     * Update agent capabilities
     */
    updateCapabilities(capabilities: string[]): void;
    /**
     * Get my agent card
     */
    getAgentCard(): A2AAgentCard;
    /**
     * Get known agents
     */
    getKnownAgents(): A2AAgentCard[];
    /**
     * Find agents by capability
     */
    findAgentsByCapability(capability: string): A2AAgentCard[];
    private startDiscovery;
    private discoverAgents;
    /**
     * Request task execution from another agent
     */
    requestTaskExecution(agentId: string, task: A2ATask): Promise<A2ATaskResult>;
    /**
     * Broadcast task to find capable agent
     */
    broadcastTask(task: A2ATask): Promise<{
        agentId: string;
        result: A2ATaskResult;
    } | null>;
    private registerDefaultHandlers;
    getStatistics(): {
        connected: boolean;
        protocol: string;
        knownAgents: number;
        mcpTools: number;
        mcpResources: number;
        pendingRequests: number;
        capabilities: string[];
    };
}
export default ProtocolBridge;
//# sourceMappingURL=protocol_bridge.d.ts.map