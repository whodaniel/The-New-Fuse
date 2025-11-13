import { BaseService } from '../core/BaseService';
import { UUID, Message } from '@the-new-fuse/types';
export interface ChatMessage extends Message {
    senderAgentId: UUID;
    recipientAgentId: UUID;
    conversationId?: UUID;
    sender: string;
}
export interface BroadcastMessage extends Message {
    senderAgentId: UUID;
    topic?: string;
    sender: string;
}
export interface ChatTransport {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendMessage(message: ChatMessage): Promise<void>;
    broadcastMessage(message: BroadcastMessage): Promise<void>;
    onMessage(handler: (message: ChatMessage | BroadcastMessage) => void): void;
    subscribeToAgent(agentId: UUID): Promise<void>;
    unsubscribeFromAgent(agentId: UUID): Promise<void>;
    subscribeToTopic?(topic: string): Promise<void>;
    unsubscribeFromTopic?(topic: string): Promise<void>;
}
/**
 * Service responsible for facilitating communication between different agents.
 */
export declare class InterAgentChatService extends BaseService {
    private logger;
    private transport;
    private currentAgentId;
    constructor(transport: ChatTransport, agentId: UUID);
    catch(error: any): void;
}
//# sourceMappingURL=InterAgentChatService.d.ts.map