export declare class MemoryOptimizer {
    private logger;
    private redis;
    private db;
    private readonly maxMemoryUsage;
    private readonly cleanupThreshold;
    private readonly retentionPeriod;
    constructor();
}
