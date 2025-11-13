import { EventEmitter2 } from '@nestjs/event-emitter';
/**
 * Protocol Types for Agent Communication
 */
export declare enum AgentProtocol {
    A2A = "agent-to-agent",
    MCP = "model-context-protocol",
    RELAY = "relay-protocol",
    WEBSOCKET = "websocket",
    HTTP = "http",
    FEDERATION = "federation"
}
/**
 * Agent Message Structure for Multi-Protocol Communication
 */
export interface AgentMessage {
    id: string;
    protocol: AgentProtocol;
    source: {
        agentId: string;
        nodeId: string;
        protocol: AgentProtocol;
    };
    target: {
        agentId?: string;
        nodeId?: string;
        protocol: AgentProtocol;
        broadcast?: boolean;
    };
    payload: {
        type: string;
        data: any;
        metadata?: Record<string, any>;
    };
    routing: {
        hops: Array<{
            nodeId: string;
            timestamp: number;
        }>;
        maxHops: number;
        priority: number;
        ttl: number;
    };
    timestamp: number;
    signature?: string;
}
/**
 * Protocol Adapter Interface
 */
export interface ProtocolAdapter {
    protocol: AgentProtocol;
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send(message: AgentMessage): Promise<void>;
    receive(): AsyncIterable<AgentMessage>;
    healthCheck(): Promise<boolean>;
}
/**
 * Multi-Protocol Agent Coordination Service
 *
 * Provides unified interface for agent communication across multiple protocols:
 * - Agent-to-Agent (A2A) direct communication
 * - Model Context Protocol (MCP) for AI model interactions
 * - Relay Protocol for distributed messaging
 * - WebSocket for real-time communication
 * - HTTP for RESTful interactions
 * - Federation protocol for cluster coordination
 */
export declare class MultiProtocolAgentCoordinationService {
    private readonly eventEmitter;
    private readonly logger;
    private protocolAdapters;
    private routingTable;
    private messageHandlers;
    private circuitBreakers;
    private metrics;
    constructor(eventEmitter: EventEmitter2);
    /**
     * Initialize all protocol adapters
     */
    private initializeProtocolAdapters;
    /**
     * Setup circuit breakers for fault tolerance
     */
    private setupCircuitBreakers;
}
//# sourceMappingURL=multi-protocol-agent-coordination.service.d.ts.map