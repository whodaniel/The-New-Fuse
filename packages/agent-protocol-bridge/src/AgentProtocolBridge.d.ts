import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { PrismaService } from '../../database/src';
import { ProtocolType, BridgeType, ConnectionState } from './types/prisma-enums';
import { AgentBridgeConnection, Conversation } from './types/local-types';
import { IA2ACommunicator } from '../../a2a-core/src';
import { MCPServer } from '../../mcp-core/src';
export interface ProtocolMessage {
    id: string;
    type: string;
    protocol: ProtocolType;
    payload: any;
    metadata?: Record<string, any>;
    timestamp: Date;
}
export interface BridgeConnection {
    agentId: string;
    bridgeType: BridgeType;
    targetSystem: string;
    state: ConnectionState;
    config?: Record<string, any>;
}
export declare class AgentProtocolBridge extends EventEmitter implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly a2aService?;
    private readonly mcpServer?;
    private readonly logger;
    private activeConnections;
    private protocolAdapters;
    private translationCache;
    constructor(prisma: PrismaService, a2aService?: IA2ACommunicator | undefined, mcpServer?: MCPServer | undefined);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Connect an agent to a target system via specified bridge type
     */
    connectAgent(agentId: string, bridgeType: BridgeType, targetSystem: string, config?: Record<string, any>): Promise<boolean>;
    /**
     * Disconnect an agent from a target system
     */
    disconnectAgent(agentId: string, bridgeType: BridgeType): Promise<boolean>;
    /**
     * Translate a message between protocols
     */
    translateMessage(message: ProtocolMessage, targetProtocol: ProtocolType, agentId?: string): Promise<ProtocolMessage | null>;
    /**
     * Register a conversation between multiple agents
     */
    registerConversation(agentIds: string[], initiatorId: string, topic?: string): Promise<Conversation>;
    /**
     * Send a message through the bridge
     */
    sendMessage(message: ProtocolMessage, targetAgentId?: string, conversationId?: string): Promise<boolean>;
    /**
     * Get bridge status for an agent
     */
    getBridgeStatus(agentId: string): Promise<AgentBridgeConnection[]>;
    /**
     * Get performance metrics for the bridge
     */
    getPerformanceMetrics(agentId?: string): Promise<any>;
    private loadExistingConnections;
    private initializeProtocolAdapters;
    private setupEventListeners;
    private establishConnection;
    private establishA2AConnection;
    private establishMCPConnection;
    private establishWebSocketConnection;
    private establishRedisConnection;
    private getProtocolAdapter;
    private performDirectTranslation;
    private sendA2AMessage;
    private sendMCPMessage;
    private sendClaudeMessage;
    private handleA2AMessage;
    private handleMCPMessage;
}
//# sourceMappingURL=AgentProtocolBridge.d.ts.map