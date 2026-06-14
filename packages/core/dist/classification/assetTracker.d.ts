interface Context {
    contextType: string;
    dependencies?: Set<string>;
}
export declare class AssetTracker {
    private trackedAssets;
    private usagePatterns;
    trackAssetUsage(assetId: string, usageType: string, context: Context): Promise<void>;
    private updateUsagePatterns;
    getAssetAnalysis(assetId: string): Promise<any>;
    getUsageStats(assetId: string): Promise<{
        totalUsage: number;
        contexts: string[];
        lastUsed: Date | null;
    }>;
    addPerformanceMetric(assetId: string, metric: any): Promise<void>;
    listTrackedAssets(): Promise<string[]>;
    clearAsset(assetId: string): Promise<void>;
}
export {};
//# sourceMappingURL=assetTracker.d.ts.map