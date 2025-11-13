import { LoggingService } from '../../services/LoggingService';
export interface MessageHeader {
    id: string;
    version: string;
    timestamp: Date;
    sender_id: string;
    recipient_id: string;
    message_type: MessageType;
    priority: MessagePriority;
    ttl?: number;
    correlation_id?: string;
    reply_to?: string;
}
export interface MessagePayload {
    content_type: 'text' | 'json' | 'binary' | 'encrypted';
    content: any;
    encoding?: 'utf8' | 'base64' | 'gzip';
    schema_version?: string;
    checksum?: string;
}
export interface MessageMetadata {
    route_history: string[];
    retry_count: number;
    max_retries: number;
    delivery_attempts: MessageDeliveryAttempt[];
    tags: string[];
    security_context?: SecurityContext;
}
export interface MessageDeliveryAttempt {
    attempt_number: number;
    timestamp: Date;
    status: 'pending' | 'delivered' | 'failed' | 'timeout';
    error_message?: string;
    latency?: number;
}
export interface SecurityContext {
    encryption_enabled: boolean;
    signature?: string;
    certificate_thumbprint?: string;
    access_control: string[];
}
export type MessageType = 'command' | 'query' | 'event' | 'response' | 'notification' | 'heartbeat' | 'error' | 'debug';
export type MessagePriority = 'low' | 'normal' | 'high' | 'critical' | 'emergency';
export type MessageStatus = 'created' | 'queued' | 'routing' | 'delivered' | 'failed' | 'expired' | 'cancelled';
export interface FullAgentMessage {
    header: MessageHeader;
    payload: MessagePayload;
    metadata: MessageMetadata;
    status: MessageStatus;
}
export interface MessageValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface MessageStatistics {
    total_messages: number;
    messages_by_type: Record<MessageType, number>;
    messages_by_priority: Record<MessagePriority, number>;
    messages_by_status: Record<MessageStatus, number>;
    average_latency: number;
    success_rate: number;
    error_rate: number;
}
export declare class AgentMessageService {
    private readonly logger;
    private messages;
    private message_history;
    private statistics;
    private max_history_size;
    constructor(logger: LoggingService);
    /**
     * Initialize message statistics
     */
    private initializeStatistics;
    /**
     * Create a new agent message
     */
    createMessage(sender_id: string, recipient_id: string, message_type: MessageType, content: any, priority?: MessagePriority, options?: {
        ttl?: number;
        correlation_id?: string;
        reply_to?: string;
        content_type?: MessagePayload['content_type'];
        tags?: string[];
        max_retries?: number;
    }): FullAgentMessage;
    /**
     * Get message by ID
     */
    getMessage(message_id: string): FullAgentMessage | null;
    /**
     * Update message status
     */
    updateMessageStatus(message_id: string, status: MessageStatus, error_message?: string): boolean;
}
export default AgentMessageService;
//# sourceMappingURL=agent-message.d.ts.map