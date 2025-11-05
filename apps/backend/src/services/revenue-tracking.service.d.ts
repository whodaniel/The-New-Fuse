import { PrismaService } from '../prisma/prisma.service';
import { SmartContractService } from './smart-contract.service';
export interface RevenueEvent {
    agentId: string;
    amount: string;
    tokenAddress: string;
    source: string;
    metadata?: Record<string, any>;
}
export interface DistributionResult {
    streamId: string;
    totalAmount: string;
    recipients: Array<{
        address: string;
        amount: string;
        sharePercentage: number;
    }>;
    txHash: string;
    blockNumber: number;
}
export declare class RevenueTrackingService {
    private readonly prisma;
    private readonly smartContractService;
    private readonly logger;
    constructor(prisma: PrismaService, smartContractService: SmartContractService);
    trackRevenue(data: RevenueEvent): Promise<void>;
    checkAndTriggerDistribution(revenueStreamId: string): Promise<void>;
    distributeRevenue(revenueStreamId: string): Promise<DistributionResult>;
    scanForRevenueEvents(): Promise<void>;
    private processRevenueEvents;
    private getMockRevenueEvents;
    private getLastProcessedBlock;
    private updateLastProcessedBlock;
    checkPendingDistributions(): Promise<void>;
    getRevenueAnalytics(agentNftId: string, timeframe?: 'day' | 'week' | 'month' | 'year'): Promise<{
        timeframe: "year" | "week" | "day" | "month";
        startDate: Date;
        totalRevenue: any;
        totalDistributed: any;
        pendingRevenue: number;
        distributionCount: any;
        averageDistribution: number;
        streams: any;
    }>;
    private getStartDate;
}
//# sourceMappingURL=revenue-tracking.service.d.ts.map