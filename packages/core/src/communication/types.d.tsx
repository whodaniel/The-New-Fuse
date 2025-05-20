export declare enum MessageType {
    COMMAND = "command",
    EVENT = "event",
    QUERY = "query",
    RESPONSE = "response",
    ERROR = "error",
    STATE_UPDATE = "state_update",
    HEARTBEAT = "heartbeat"
}
export declare enum MessagePriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}
export declare enum MessageStatus {
    PENDING = "pending",
    SENT = "sent",
    DELIVERED = "delivered",
    READ = "read",
    PROCESSED = "processed",
    FAILED = "failed"
}
export interface MessageMetadata {
    timestamp: Date;
    priority: MessagePriority;
    ttl?: number;
    retries?: number;
    maxRetries?: number;
    tags?: string[];
    correlationId?: string;
    sessionId?: string;
    userId?: string;
    agentId?: string;
    version?: string;
    signature?: string;
}
export interface Message {
    id: string;
    type: MessageType;
    source: string;
    target: string;
    content: unknown;
    metadata: MessageMetadata;
    status: MessageStatus;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}
export interface Channel {
    id: string;
    name: string;
    type: 'direct' | 'broadcast' | 'topic';
    pattern?: string;
    metadata?: {
        description?: string;
        tags?: string[];
        createdAt: Date;
        updatedAt: Date;
        lastActive?: Date;
    };
}
export interface Subscription {
    id: string;
    channelId: string;
    subscriberId: string;
    pattern?: string;
    filters?: {
        types?: MessageType[];
        priorities?: MessagePriority[];
        sources?: string[];
        tags?: string[];
    };
    metadata?: {
        description?: string;
        createdAt: Date;
        updatedAt: Date;
        lastActive?: Date;
    };
}
export interface MessageHandler {
    (message: Message): Promise<void>;
}
export interface ChannelOptions {
    bufferSize?: number;
    persistent?: boolean;
    encrypted?: boolean;
    compression?: boolean;
    qos?: number;
    retryPolicy?: {
        maxRetries: number;
        backoff: {
            type: 'fixed' | 'exponential';
            delay: number;
        };
    };
}
export type MessageValidationErrorCode =
  | 'SIZE_EXCEEDED'
  | 'INVALID_TYPE'
  | 'SCHEMA_VALIDATION_ERROR'
  | 'FUTURE_TIMESTAMP'
  | 'INVALID_TTL'
  | 'INVALID_RETRIES'
  | 'MAX_RETRIES_EXCEEDED'
  | 'CORRELATION_DEPTH_EXCEEDED'
  | 'MISSING_SIGNATURE'
  | 'INVALID_SIGNATURE'
  | 'INVALID_TARGET'
  | 'INVALID_CONTENT'
  | 'MISSING_CORRELATION_ID'
  | 'UNKNOWN_ERROR';
export interface MessageValidationError {
    field: string;
    code: MessageValidationErrorCode;
    message: string;
}
export interface MessageStats {
    totalMessages: number;
    messagesByType: Record<MessageType, number>;
    messagesByStatus: Record<MessageStatus, number>;
    averageLatency: number;
    errorRate: number;
    activeChannels: number;
    activeSubscriptions: number;
}
