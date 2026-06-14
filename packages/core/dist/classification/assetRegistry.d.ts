interface Classification {
    qualities?: string[];
    category?: string;
    metrics?: Record<string, number>;
    overallScore?: number;
}
interface SourceInfo {
    [key: string]: unknown;
}
interface UsageMetrics {
    integrationCount: number;
    referenceCount: number;
    successRate: number;
}
interface AssetEntry {
    id: string;
    classification: Classification;
    source: SourceInfo;
    registrationDate: Date;
    lastEvaluated: Date;
    integrationStatus: string;
    versionHistory: unknown[];
    relatedAssets: unknown[];
    usageMetrics: UsageMetrics;
}
export declare class AssetRegistry {
    private assets;
    private relationships;
    registerAsset(assetId: string, classification: Classification, sourceInfo: SourceInfo): Promise<void>;
    getAsset(assetId: string): Promise<AssetEntry | undefined>;
    updateAsset(assetId: string, updates: Partial<AssetEntry>): Promise<void>;
    listAssets(): Promise<AssetEntry[]>;
    addRelationship(sourceId: string, targetId: string, relationshipType: string): Promise<void>;
    getRelatedAssets(assetId: string): Promise<string[]>;
    searchAssets(criteria: {
        category?: string;
        quality?: string;
    }): Promise<AssetEntry[]>;
    getUsageMetrics(assetId: string): Promise<UsageMetrics | undefined>;
    incrementUsage(assetId: string, wasSuccessful?: boolean): Promise<void>;
}
export {};
//# sourceMappingURL=assetRegistry.d.ts.map