export declare enum AssetQuality {
    INNOVATIVE = "innovative",
    EFFICIENT = "efficient",
    SCALABLE = "scalable",
    MAINTAINABLE = "maintainable",
    SECURE = "secure",
    PERFORMANT = "performant",
    REUSABLE = "reusable",
    DOCUMENTED = "documented"
}
export declare enum AssetCategory {
    ALGORITHM = "algorithm",
    PROTOCOL = "protocol",
    FRAMEWORK = "framework",
    TOOL = "tool",
    MODEL = "model",
    LIBRARY = "library",
    API = "api",
    ARCHITECTURE = "architecture"
}
export interface AssetMetrics {
    complexityScore: number;
    maintenanceScore: number;
    performanceScore: number;
    securityScore: number;
    communityScore: number;
    documentationScore: number;
    testCoverage: number;
    lastUpdated: Date;
}
export declare class AssetClassifier {
    private qualityWeights;
    constructor();
    classifyAsset(): Promise<void>;
}
