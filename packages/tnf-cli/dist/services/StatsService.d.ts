export interface StatsRecord {
    timestamp: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    tool?: string;
    project?: string;
    sessionId?: string;
}
export interface StatsSummary {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCost: number;
    byProvider: Record<string, {
        tokens: number;
        cost: number;
        count: number;
    }>;
    byModel: Record<string, {
        tokens: number;
        cost: number;
        count: number;
    }>;
    byTool: Record<string, {
        tokens: number;
        cost: number;
        count: number;
    }>;
    byProject: Record<string, {
        tokens: number;
        cost: number;
        count: number;
    }>;
}
export interface StatsOptions {
    days?: number;
    provider?: string;
    model?: string;
    project?: string;
    limit?: number;
}
export declare class StatsService {
    private statsPath;
    private records;
    constructor(statsPath?: string);
    private loadStats;
    private saveStats;
    record(record: Omit<StatsRecord, 'timestamp'>): Promise<void>;
    getSummary(options?: StatsOptions): Promise<StatsSummary>;
    close(): Promise<void>;
}
//# sourceMappingURL=StatsService.d.ts.map