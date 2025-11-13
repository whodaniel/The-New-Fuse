/**
 * AgentCommunicationBridge.ts
 *
 * Bridge service that connects AgentHub with A2A and MCP services.
 * Provides protocol translation, message routing, context preservation, and error handling.
 */
import { EventEmitter } from 'events';
import { A2AService } from '../../../core/src/services/A2AService';
import { MCPClient } from '../../../core/src/mcp/MCPClient';
import { MessageRouter } from '../../../core/src/communication/MessageRouter';
import { AgentConfiguration, TaskExecutionOptions } from './AgentHub';
export interface BridgeConfiguration {
    enableA2A: boolean;
    enableMCP: boolean;
    enableRouting: boolean;
    defaultTimeout: number;
    maxRetries: number;
    contextPreservation: boolean;
    performanceMonitoring: boolean;
}
export interface CommunicationContext {
    conversationId?: string;
    sessionId?: string;
    userId?: string;
    workspaceId?: string;
    metadata?: Record<string, any>;
    history?: MessageHistoryEntry[];
}
export interface MessageHistoryEntry {
    id: string;
    timestamp: Date;
    fromAgent: string;
    toAgent: string;
    content: any;
    protocol: 'a2a' | 'mcp' | 'direct';
    success: boolean;
    error?: string;
}
export interface ProtocolTranslationResult {
    success: boolean;
    translatedMessage?: any;
    targetProtocol: 'a2a' | 'mcp' | 'direct';
    error?: string;
    metadata?: Record<string, any>;
}
export interface CommunicationMetrics {
    totalMessages: number;
    successfulMessages: number;
    failedMessages: number;
    averageResponseTime: number;
    protocolUsage: Record<string, number>;
    agentUsage: Record<string, number>;
    errorsByType: Record<string, number>;
}
export type BridgeSendResult = BridgeSendSuccess | BridgeSendFallback | BridgeSendError;
export interface BridgeSendSuccess {
    status: 'sent' | 'executed';
    protocol: 'a2a' | 'mcp' | 'direct';
    timestamp: Date;
    messageId?: string;
    result?: any;
    message?: string;
}
export interface BridgeSendFallback {
    status: 'sent';
    protocol: 'a2a' | 'mcp' | 'direct';
    timestamp: Date;
    message: string;
    result?: any;
}
export interface BridgeSendError {
    status: 'sent' | 'error';
    protocol: 'a2a' | 'mcp' | 'direct';
    timestamp: Date;
    message: string;
    error: string;
    result?: any;
}
export declare class AgentCommunicationBridge extends EventEmitter {
    private a2aService?;
    private mcpClient?;
    private messageRouter?;
    private config;
    private protobufAdapter;
    private activeContexts;
    private messageHistory;
    private metrics;
    private performanceStartTimes;
    constructor(a2aService?: A2AService | undefined, mcpClient?: MCPClient | undefined, messageRouter?: MessageRouter | undefined, config?: BridgeConfiguration);
    /**
     * Initialize metrics tracking
     */
    private initializeMetrics;
    /**
     * Setup event handlers for underlying services
     */
    private setupEventHandlers;
    /**
     * Send a task to an agent through the appropriate protocol
     */
    sendTaskToAgent(agent: AgentConfiguration, prompt: string, options?: TaskExecutionOptions, context?: CommunicationContext): Promise<BridgeSendResult>;
    /**
     * Select the best communication protocol for an agent
     */
    private selectProtocol;
    /**
     * Translate message for target protocol
     */
    private translateMessage;
    /**
     * Translate message to A2A format
     */
    private translateToA2A;
    /**
     * Translate message to MCP format
     */
    private translateToMCP;
    /**
     * Translate message to direct format
     */
    private translateToDirect;
    /**
     * Determine message priority based on options
     */
    private determinePriority;
    /**
     * Send message via A2A service
     */
    private sendViaA2A;
    /**
     * Send message via MCP client
     */
    private sendViaMCP;
}
export default AgentCommunicationBridge;
//# sourceMappingURL=AgentCommunicationBridge.d.ts.map