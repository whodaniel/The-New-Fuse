import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MCPAgentServer } from '../MCPAgentServer';
import { MCPChatServer } from '../MCPChatServer';
import { MCPWorkflowServer } from '../MCPWorkflowServer';
import { MCPFuseServer } from '../MCPFuseServer';
import { MCPFileCoordinationServer } from '../MCPFileCoordinationServer';
import { MCPRAGServer } from '../MCPRAGServer';
/**
 * Message interface for MCP communication
 */
export interface MCPMessage {
    id: string;
    timestamp: string;
    sender: string;
    recipient?: string;
    type: 'command' | 'response' | 'event' | 'error';
    payload: {
        server: string;
        action: string;
        params?: Record<string, any>;
        result?: any;
        error?: string;
    };
    metadata?: Record<string, any>;
}
/**
 * MCP Broker Service
 *
 * Central broker for all MCP communication. Provides:
 * 1. Single entry point for all MCP directives
 * 2. Message routing between MCP servers
 * 3. Redis-based communication for distributed setups
 * 4. Logging and monitoring of MCP operations
 */
export declare class MCPBrokerService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly agentServer;
    private readonly chatServer;
    private readonly workflowServer;
    private readonly fuseServer;
    private readonly fileCoordinationServer;
    private readonly ragServer;
    private readonly logger;
    private publisher;
    private subscriber;
    private readonly servers;
    private readonly handlers;
    private readonly BROADCAST_CHANNEL;
    private readonly DIRECT_CHANNEL_PREFIX;
    private readonly SERVER_CHANNEL_PREFIX;
    constructor(configService: ConfigService, agentServer: MCPAgentServer, chatServer: MCPChatServer, workflowServer: MCPWorkflowServer, fuseServer: MCPFuseServer, fileCoordinationServer: MCPFileCoordinationServer, ragServer: MCPRAGServer);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Connect to Redis
     */
    private connect;
    /**
     * Disconnect from Redis
     */
    private disconnect;
    /**
     * Setup Redis subscriptions
     */
    private setupSubscriptions;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle broadcast message
     */
    private handleBroadcastMessage;
    /**
     * Handle direct message
     */
    private handleDirectMessage;
    /**
     * Handle server message
     */
    private handleServerMessage;
    /**
     * Send response message
     */
    private sendResponse;
    /**
     * Send error message
     */
    private sendError;
    /**
     * Execute MCP directive
     *
     * This is the main entry point for all MCP directives
     */
    executeDirective(serverName: string, action: string, params?: Record<string, any>, options?: {
        sender?: string;
        recipient?: string;
        metadata?: Record<string, any>;
    }): Promise<any>;
    /**
     * Register message handler
     */
    registerHandler(type: string, handler: (message: MCPMessage) => Promise<void>): () => void;
    /**
     * Get all available MCP capabilities
     */
    getAllCapabilities(): Record<string, Record<string, any>>;
    /**
     * Get all available MCP tools
     */
    getAllTools(): Record<string, Record<string, any>>;
}
//# sourceMappingURL=mcp-broker.service.d.ts.map