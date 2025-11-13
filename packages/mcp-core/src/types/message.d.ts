/**
 * MCP Message type definitions
 */
export type { JSONRPCMessage, JSONRPCRequest, JSONRPCResponse, JSONRPCNotification, JSONRPCError, MCPRequest, MCPResponse, MCPNotification, MCPError, MCPMessage, JSONRPCMessage_Union } from '../interfaces/IMCPMessage';
/**
 * Message priority enumeration
 */
export declare enum MessagePriority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Message type enumeration
 */
export declare enum MessageType {
    REQUEST = "request",
    RESPONSE = "response",
    NOTIFICATION = "notification",
    ERROR = "error"
}
/**
 * Notification type enumeration
 */
export declare enum NotificationType {
    EVENT = "event",
    STATUS = "status",
    ALERT = "alert",
    HEARTBEAT = "heartbeat"
}
/**
 * Message envelope interface for internal routing
 */
export interface MessageEnvelope {
    /** Message ID */
    id: string;
    /** Message type */
    type: MessageType;
    /** Source identifier */
    source: string;
    /** Target identifier */
    target?: string;
    /** Message priority */
    priority: MessagePriority;
    /** Message timestamp */
    timestamp: Date;
    /** Message payload */
    payload: import('../interfaces/IMCPMessage').MCPMessage;
    /** Message metadata */
    metadata?: Record<string, any>;
    /** Routing information */
    routing?: MessageRouting;
}
/**
 * Message routing information interface
 */
export interface MessageRouting {
    /** Routing path */
    path: string[];
    /** Hop count */
    hopCount: number;
    /** Maximum hops allowed */
    maxHops: number;
    /** Routing strategy */
    strategy?: 'direct' | 'broadcast' | 'multicast';
    /** Routing metadata */
    metadata?: Record<string, any>;
}
/**
 * Message statistics interface
 */
export interface MessageStatistics {
    /** Total messages processed */
    totalMessages: number;
    /** Messages by type */
    messagesByType: Record<MessageType, number>;
    /** Messages by priority */
    messagesByPriority: Record<MessagePriority, number>;
    /** Average processing time in milliseconds */
    averageProcessingTime: number;
    /** Message throughput per second */
    throughput: number;
    /** Error count */
    errorCount: number;
    /** Last message timestamp */
    lastMessageTime?: Date;
}
/**
 * Message validation result interface
 */
export interface MessageValidationResult {
    /** Whether message is valid */
    valid: boolean;
    /** Validation errors */
    errors: string[];
    /** Normalized message */
    normalizedMessage?: import('../interfaces/IMCPMessage').MCPMessage;
}
/**
 * Message handler function type
 */
export type MessageHandler = (message: MessageEnvelope) => Promise<void>;
/**
 * Message filter function type
 */
export type MessageFilter = (message: MessageEnvelope) => boolean;
/**
 * Message transformer function type
 */
export type MessageTransformer = (message: MessageEnvelope) => MessageEnvelope;
//# sourceMappingURL=message.d.ts.map