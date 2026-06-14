export interface UsageStats {
    totalSessions: number;
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    avgSessionLength: number;
    topModels: Array<{
        model: string;
        count: number;
        tokens: number;
    }>;
    tokenUsage: Array<{
        date: string;
        tokens: number;
        cost: number;
    }>;
}
export declare class InsightsService {
    private statsDir;
    constructor();
    getStats(): Promise<UsageStats>;
    exportStats(format: 'json' | 'csv'): Promise<string>;
}
//# sourceMappingURL=InsightsService.d.ts.map