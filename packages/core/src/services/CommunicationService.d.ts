import { LoggingService } from './LoggingService';
export interface CommunicationChannel {
    id: string;
    name: string;
    type: 'websocket' | 'http' | 'tcp' | 'udp';
    status: 'active' | 'inactive' | 'error';
    participants: string[];
    created_at: Date;
}
export interface CommunicationMessage {
    id: string;
    channel_id: string;
    sender_id: string;
    content: any;
    timestamp: Date;
    delivered: boolean;
}
export interface CommunicationStats {
    total_channels: number;
    active_channels: number;
    total_messages: number;
    messages_per_second: number;
    error_rate: number;
}
export declare class CommunicationService {
    private readonly logger;
    private channels;
    private messages;
    private message_counts;
    constructor(logger: LoggingService);
    createChannel(name: string, type: CommunicationChannel['type'], participants: string[]): Promise<CommunicationChannel>;
    sendMessage(channel_id: string, sender_id: string, content: any): Promise<CommunicationMessage>;
}
//# sourceMappingURL=CommunicationService.d.ts.map