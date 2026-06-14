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
export interface AssetData {
    id: string;
    name: string;
    content: string;
    category: AssetCategory;
    quality: AssetQuality[];
    tags: string[];
    metadata?: Record<string, any>;
}
export interface ClassificationResult {
    category: AssetCategory;
    quality: AssetQuality[];
    confidence: number;
    tags: string[];
    summary: string;
}
export declare class AssetClassifier {
    private categoryKeywords;
    private qualityKeywords;
    classify(assetData: AssetData): ClassificationResult;
    private extractTags;
    private generateSummary;
}
//# sourceMappingURL=assetClassifier.d.ts.map