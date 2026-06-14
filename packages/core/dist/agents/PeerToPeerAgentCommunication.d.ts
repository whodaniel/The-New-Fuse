import { Subscription } from 'rxjs';
export interface P2PMessage {
    id: string;
    sender: string;
    recipient: string;
    type: 'prompt' | 'response' | 'notification' | 'handshake' | 'handshake_ack';
    content: unknown;
    correlationId?: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
}
export interface P2PChannel {
    agentA: string;
    agentB: string;
    established: boolean;
    createdAt: string;
    messageCount: number;
}
export declare class PeerToPeerAgentCommunication {
    private readonly logger;
    private readonly channels;
    private readonly channelMeta;
    private readonly pendingResponses;
    private readonly messageHistory;
    private readonly maxHistoryPerChannel;
    establishChannel(agentA: string, agentB: string): P2PChannel;
    sendPrompt(sender: string, recipient: string, content: unknown, timeoutMs?: number): Promise<P2PMessage>;
    sendResponse(originalMessage: P2PMessage, responseContent: unknown): void;
    subscribeToPrompts(agentId: string, handler: (msg: P2PMessage) => void): Subscription;
    getChannelInfo(agentA: string, agentB: string): P2PChannel | undefined;
    getHistory(agentA: string, agentB: string): P2PMessage[];
    closeChannel(agentA: string, agentB: string): void;
    getActiveChannels(): P2PChannel[];
    shutdown(): Promise<void>;
    private emitMessage;
    private getChannelId;
}
//# sourceMappingURL=PeerToPeerAgentCommunication.d.ts.map