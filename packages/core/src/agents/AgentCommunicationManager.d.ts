import { EventEmitter } from 'events';
import { MetricsProcessor } from '../security/metricsProcessor';
import { AgentCommunicationBridge, AgentMessage } from './AgentCommunicationBridge';
interface CommunicationChannel {
    id: string;
    name: string;
    channelType: 'direct' | 'broadcast' | 'group';
    participants: string[];
    createdAt: Date;
    createdBy: string;
    isActive: boolean;
}
interface SendMessageOptions {
    priority?: 'low' | 'medium' | 'high';
    protocol?: 'A2A_V1' | 'A2A_V2' | 'MCP';
    timeout?: number;
}
export declare class AgentCommunicationManager extends EventEmitter {
    private readonly communicationBridge;
    private readonly metricsProcessor;
    private readonly logger;
    private readonly channels;
    private readonly config;
    constructor(communicationBridge: AgentCommunicationBridge, metricsProcessor: MetricsProcessor);
    createChannel(channelId: string, channelType: 'direct' | 'broadcast' | 'group', participants: string[]): Promise<CommunicationChannel>;
    sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>, options?: SendMessageOptions): Promise<void>;
    broadcastMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>, options?: SendMessageOptions): Promise<void>;
    closeChannel(channelId: string): Promise<void>;
    getChannel(channelId: string): CommunicationChannel | undefined;
    getActiveChannels(): CommunicationChannel[];
    private generateMessageId;
}
export {};
//# sourceMappingURL=AgentCommunicationManager.d.ts.map