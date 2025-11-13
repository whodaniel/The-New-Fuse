import { LoggingService } from './LoggingService';
export interface Message {
    id: string;
    sender_id: string;
    recipient_id: string;
    subject?: string;
    content: any;
    type: 'text' | 'binary' | 'json' | 'xml';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'expired';
    created_at: Date;
    sent_at?: Date;
    delivered_at?: Date;
    expires_at?: Date;
    retry_count: number;
    max_retries: number;
    metadata?: Record<string, any>;
}
export interface MessageQueue {
    id: string;
    name: string;
    type: 'fifo' | 'priority' | 'delayed';
    status: 'active' | 'paused' | 'stopped';
    message_count: number;
    created_at: Date;
}
export interface MessagingStats {
    total_messages: number;
    pending_messages: number;
    sent_messages: number;
    delivered_messages: number;
    failed_messages: number;
    messages_per_minute: number;
    average_delivery_time: number;
    success_rate: number;
    active_queues: number;
}
export declare class MessagingService {
    private readonly logger;
    private messages;
    private queues;
    private processing_interval?;
    private delivery_times;
    constructor(logger: LoggingService);
    sendMessage(sender_id: string, recipient_id: string, content: any, options?: {
        subject?: string;
        type?: Message['type'];
        priority?: Message['priority'];
        expires_in?: number;
        max_retries?: number;
        metadata?: Record<string, any>;
    }): Promise<string>;
    retryMessage(id: string): Promise<boolean>;
}
export default MessagingService;
//# sourceMappingURL=MessagingService.d.ts.map