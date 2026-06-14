import { HandoffAckInput, HandoffPacketInput, type HandoffAck as HandoffAckType, type HandoffPacket as HandoffPacketType, type HandoffStatus } from '../protocol/handoff-protocol.js';
interface HandoffStoreOptions {
    redisUrl?: string;
    keyPrefix?: string;
    defaultTtlSeconds?: number;
    maxInboxItemsPerAgent?: number;
    maxRetries?: number;
    retryBaseDelayMs?: number;
    now?: () => Date;
}
interface ListForAgentOptions {
    limit?: number;
    includeAcknowledged?: boolean;
}
interface AgentHandoffView {
    packet: HandoffPacketType;
    ack: {
        status: HandoffStatus;
        note?: string;
        ackedAt: string;
    } | null;
}
export declare class HandoffStoreService {
    private client;
    private upstash;
    private readonly keyPrefix;
    private readonly defaultTtlSeconds;
    private readonly maxInboxItemsPerAgent;
    private readonly maxRetries;
    private readonly retryBaseDelayMs;
    private readonly now;
    private connected;
    constructor(options?: HandoffStoreOptions);
    connect(): Promise<void>;
    close(): Promise<void>;
    publish(input: HandoffPacketInput): Promise<HandoffPacketType>;
    getPacket(packetId: string): Promise<HandoffPacketType | null>;
    listForAgent(agentId: string, options?: ListForAgentOptions): Promise<AgentHandoffView[]>;
    acknowledge(input: HandoffAckInput): Promise<HandoffAckType>;
    listBySession(sessionKey: string, limit?: number): Promise<HandoffPacketType[]>;
    private getAck;
    private packetKey;
    private ackKey;
    private agentInboxKey;
    private sessionIndexKey;
    private parsePacket;
    private parseAck;
    private isExpired;
    private computeTtlSeconds;
    private withRetry;
    private sleep;
}
export {};
//# sourceMappingURL=HandoffStoreService.d.ts.map