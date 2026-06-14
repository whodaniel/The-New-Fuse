import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
export interface CommunicationRecord {
    id: string;
    fromAgent: string;
    toAgent: string;
    message: string;
    timestamp: Date;
    status: 'sent' | 'received' | 'failed';
}
export declare class CommunicationTracker {
    private redisService;
    private recordsKey;
    private blockchainKey;
    private modelKey;
    private tokenKey;
    private walletKey;
    private resourceKey;
    constructor(redisService: UnifiedRedisService);
    trackCommunication(record: CommunicationRecord): Promise<void>;
    getCommunicationHistory(agentId: string, limit?: number): Promise<CommunicationRecord[]>;
    getRecentCommunications(limit?: number): Promise<CommunicationRecord[]>;
    clearHistory(): Promise<void>;
    getMetrics(agentId: string): Promise<{
        totalSent: number;
        totalReceived: number;
        successRate: number;
    }>;
}
//# sourceMappingURL=CommunicationTracker.d.ts.map