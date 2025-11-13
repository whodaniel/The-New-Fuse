/**
 * Unified Message Types for The New Fuse Framework
 *
 * This module defines the standardized message format used across all
 * agent communication protocols: WebSocket, Redis pub/sub, HTTP, and file-based.
 * Provides backward compatibility adapters for existing message formats.
 */
export type MessageProtocol = 'websocket' | 'redis' | 'http' | 'file' | 'direct';
export type MessageType = 'task_request' | 'task_response' | 'task_progress' | 'task_error' | 'agent_registration' | 'agent_deregistration' | 'agent_status' | 'agent_heartbeat' | 'workflow_start' | 'workflow_step' | 'workflow_complete' | 'workflow_error' | 'handoff_request' | 'handoff_response' | 'sync_request' | 'sync_response' | 'broadcast' | 'system_message';
export type MessagePriority = 'low' | 'medium' | 'high' | 'critical' | 'realtime';
export type MessageStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
/**
 * Core unified message structure used across all protocols
 */
export interface UnifiedMessage {
    id: string;
    correlationId?: string;
    parentId?: string;
    conversationId?: string;
    type: MessageType;
    protocol: MessageProtocol;
    priority: MessagePriority;
    timestamp: Date;
    ttl?: number;
    retryCount?: number;
    maxRetries?: number;
    from: {
        agentId: string;
        agentType: string;
        instanceId?: string;
        tenantId?: string;
        workspaceId?: string;
    };
    to: {
        agentId?: string;
        agentType?: string;
        capabilities?: string[];
        tenantId?: string;
        workspaceId?: string;
    };
    payload: any;
    context?: Record<string, any>;
    metadata?: Record<string, any>;
    status: MessageStatus;
    processingStartTime?: Date;
    processingEndTime?: Date;
    error?: {
        code: string;
        message: string;
        details?: any;
        stackTrace?: string;
    };
    checksum?: string;
    signature?: string;
    encryption?: {
        algorithm: string;
        keyId: string;
    };
}
/**
 * Specialized message types for different scenarios
 */
export interface TaskRequestMessage extends Omit<UnifiedMessage, 'type' | 'payload'> {
    type: 'task_request';
    payload: {
        taskId: string;
        taskType: string;
        task: any;
        parameters?: Record<string, any>;
        requirements?: {
            capabilities?: string[];
            resources?: any;
            timeout?: number;
        };
        callbacks?: {
            onProgress?: string;
            onComplete?: string;
            onError?: string;
        };
    };
}
export interface TaskResponseMessage extends Omit<UnifiedMessage, 'type' | 'payload'> {
    type: 'task_response';
    payload: {
        taskId: string;
        success: boolean;
        result?: any;
        error?: {
            code: string;
            message: string;
            details?: any;
        };
        metrics?: {
            executionTime: number;
            resourcesUsed?: any;
        };
    };
}
export interface TaskProgressMessage extends Omit<UnifiedMessage, 'type' | 'payload'> {
    type: 'task_progress';
    payload: {
        taskId: string;
        progress: number;
        message?: string;
        currentStep?: string;
        totalSteps?: number;
        estimatedCompletion?: Date;
    };
}
export interface AgentRegistrationMessage extends Omit<UnifiedMessage, 'type' | 'payload'> {
    type: 'agent_registration';
    payload: {
        agent: {
            id: string;
            type: string;
            capabilities: string[];
            metadata: Record<string, any>;
            configuration: Record<string, any>;
        };
        healthCheckEndpoint?: string;
        communicationPreferences: {
            protocols: MessageProtocol[];
            preferredProtocol: MessageProtocol;
            compression?: boolean;
            encryption?: boolean;
        };
    };
}
export interface WorkflowMessage extends Omit<UnifiedMessage, 'type' | 'payload'> {
    type: 'workflow_start' | 'workflow_step' | 'workflow_complete' | 'workflow_error';
    payload: {
        workflowId: string;
        workflowType?: string;
        stepId?: string;
        stepType?: string;
        stepData?: any;
        workflowContext?: Record<string, any>;
        variables?: Record<string, any>;
        nextSteps?: string[];
        error?: {
            stepId?: string;
            error: {
                code: string;
                message: string;
                details?: any;
            };
        };
    };
}
export interface HandoffMessage extends Omit<UnifiedMessage, 'type' | 'payload'> {
    type: 'handoff_request' | 'handoff_response';
    payload: {
        handoffId: string;
        fromAgent: string;
        toAgent?: string;
        targetCapabilities?: string[];
        task: any;
        context: Record<string, any>;
        preservedState?: any;
        reason?: string;
        urgency?: 'low' | 'medium' | 'high' | 'critical';
        response?: {
            accepted: boolean;
            reason?: string;
            estimatedCompletion?: Date;
        };
    };
}
export interface SyncMessage extends Omit<UnifiedMessage, 'type' | 'payload'> {
    type: 'sync_request' | 'sync_response';
    payload: {
        syncId: string;
        syncType: 'state' | 'data' | 'configuration' | 'full';
        source: {
            agentId: string;
            instanceId?: string;
            version?: string;
        };
        target?: {
            agentId?: string;
            instanceId?: string;
            scope?: 'tenant' | 'workspace' | 'global';
        };
        data?: any;
        delta?: any;
        conflicts?: Array<{
            path: string;
            localValue: any;
            remoteValue: any;
            resolution?: 'local' | 'remote' | 'merge';
        }>;
        syncResult?: {
            success: boolean;
            itemsUpdated: number;
            conflictsResolved: number;
            errors?: any[];
        };
    };
}
/**
 * Message envelope for protocol-specific transport
 */
export interface MessageEnvelope {
    message: UnifiedMessage;
    transport: {
        protocol: MessageProtocol;
        endpoint?: string;
        channel?: string;
        topic?: string;
        headers?: Record<string, string>;
        compression?: 'gzip' | 'deflate' | 'none';
        encryption?: boolean;
    };
    routing?: {
        exchange?: string;
        routingKey?: string;
        queue?: string;
        broadcast?: boolean;
    };
}
/**
 * Message batch for high-throughput scenarios
 */
export interface MessageBatch {
    batchId: string;
    timestamp: Date;
    messages: UnifiedMessage[];
    metadata?: {
        source: string;
        batchType: 'sequential' | 'parallel' | 'transaction';
        totalSize: number;
        compression?: string;
    };
}
/**
 * Legacy message format mappings for backward compatibility
 */
export interface LegacyMessageMappings {
    cliFormats: Record<string, {
        toUnified: (msg: any) => UnifiedMessage;
        fromUnified: (msg: UnifiedMessage) => any;
    }>;
    workflowFormats: Record<string, {
        toUnified: (msg: any) => UnifiedMessage;
        fromUnified: (msg: UnifiedMessage) => any;
    }>;
    syncFormats: Record<string, {
        toUnified: (msg: any) => UnifiedMessage;
        fromUnified: (msg: UnifiedMessage) => any;
    }>;
    taskFormats: Record<string, {
        toUnified: (msg: any) => UnifiedMessage;
        fromUnified: (msg: UnifiedMessage) => any;
    }>;
}
/**
 * Message validation schema definitions
 */
export interface MessageValidationSchema {
    messageSchema: any;
    payloadSchemas: Record<MessageType, any>;
    protocolSchemas: Record<MessageProtocol, any>;
}
/**
 * Message processing configuration
 */
export interface MessageProcessingConfig {
    routing: {
        enableRoundRobin: boolean;
        enableLoadBalancing: boolean;
        enableFailover: boolean;
        maxHops: number;
    };
    limits: {
        maxMessageSize: number;
        maxBatchSize: number;
        maxProcessingTime: number;
        maxRetries: number;
    };
    performance: {
        enableCompression: boolean;
        enableCaching: boolean;
        cacheTtl: number;
        enablePipelining: boolean;
        maxConcurrentMessages: number;
    };
    security: {
        enableEncryption: boolean;
        enableSigning: boolean;
        enableChecksums: boolean;
        allowedOrigins?: string[];
        requireAuthentication: boolean;
    };
}
//# sourceMappingURL=UnifiedMessageTypes.d.ts.map