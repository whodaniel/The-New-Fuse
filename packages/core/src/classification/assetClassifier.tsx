export enum AssetQuality {
    INNOVATIVE = "innovative",
    EFFICIENT = "efficient",
    SCALABLE = "scalable",
    MAINTAINABLE = "maintainable",
    SECURE = "secure",
    PERFORMANT = "performant",
    REUSABLE = "reusable",
    DOCUMENTED = "documented"
}

export enum AssetCategory {
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

interface ComplexityThresholds {
    low: number;
    high: number;
}

export class AssetClassifier {
    private qualityWeights: Record<AssetQuality, number>;

    constructor() {
        this.qualityWeights = {
            [AssetQuality.INNOVATIVE]: 0.9,
            [AssetQuality.EFFICIENT]: 0.8,
            [AssetQuality.SCALABLE]: 0.85,
            [AssetQuality.MAINTAINABLE]: 0.75,
            [AssetQuality.SECURE]: 0.95,
            [AssetQuality.PERFORMANT]: 0.8,
            [AssetQuality.REUSABLE]: 0.7,
            [AssetQuality.DOCUMENTED]: 0.75
        };
    }

    async classifyAsset(assetData: Record<string, any>): Promise<{
        assetId: string;
        metrics: AssetMetrics;
        qualities: AssetQuality[];
        category: AssetCategory;
        overallScore: number;
    }> {
        const metrics = await this.calculateMetrics(assetData);
        const qualities = await this.identifyQualities(metrics);
        const category = await this.determineCategory(assetData);
        const overallScore = await this.calculateOverallScore(metrics, qualities);
        
        return {
            assetId: assetData.id,
            metrics,
            qualities,
            category,
            overallScore
        };
    }

    private async calculateMetrics(assetData: Record<string, any>): Promise<AssetMetrics> {
        return {
            complexityScore: this.analyzeComplexity(assetData),
            maintenanceScore: this.analyzeMaintainability(assetData),
            performanceScore: this.analyzePerformance(assetData),
            securityScore: this.analyzeSecurity(assetData),
            communityScore: this.analyzeCommunity(assetData),
            documentationScore: this.analyzeDocumentation(assetData),
            testCoverage: this.analyzeTestCoverage(assetData),
            lastUpdated: this.getLastUpdate(assetData)
        };
    }

    private async identifyQualities(metrics: AssetMetrics): Promise<AssetQuality[]> {
        const qualities: AssetQuality[] = [];
        
        if (metrics.performanceScore > 0.85) {
            qualities.push(AssetQuality.PERFORMANT);
        }
        if (metrics.maintenanceScore > 0.8) {
            qualities.push(AssetQuality.MAINTAINABLE);
        }
        if (metrics.securityScore > 0.9) {
            qualities.push(AssetQuality.SECURE);
        }
        if (metrics.testCoverage > 0.8) {
            qualities.push(AssetQuality.REUSABLE);
        }
        if (metrics.complexityScore < 0.3) {
            qualities.push(AssetQuality.SCALABLE);
        }
        
        return qualities;
    }

    private async determineCategory(assetData: Record<string, any>): Promise<AssetCategory> {
        const signaturePatterns: Record<AssetCategory, string[]> = {
            [AssetCategory.ALGORITHM]: ['complexity', optimization', computation'],
            [AssetCategory.PROTOCOL]: ['communication', handshake', exchange'],
            [AssetCategory.FRAMEWORK]: ['extensible', configurable', plugin'],
            [AssetCategory.TOOL]: ['utility', cli', standalone'],
            [AssetCategory.MODEL]: ['training', inference', prediction'],
            [AssetCategory.LIBRARY]: ['reusable', import', package'],
            [AssetCategory.API]: ['endpoint', request', response'],
            [AssetCategory.ARCHITECTURE]: ['system', structure', pattern']
        };
        
        const content = String(assetData.content || ).toLowerCase();
        const scores: Record<AssetCategory, number> = {} as Record<AssetCategory, number>;
        
        for (const [category, patterns] of Object.entries(signaturePatterns)) {
            const score = patterns.reduce((sum, pattern) => {
                return sum + (content.includes(pattern) ? 1 : 0);
            }, 0);
            scores[category as AssetCategory] = score;
        }
        
        return Object.entries(scores).reduce((max, [category, score]) => 
            score > scores[max] ? category as AssetCategory : max, 
            AssetCategory.LIBRARY);
    }

    private async calculateOverallScore(metrics: AssetMetrics, qualities: AssetQuality[]): Promise<number> {
        const metricWeights = {
            complexity: 0.15,
            maintenance: 0.2,
            performance: 0.2,
            security: 0.15,
            community: 0.1,
            documentation: 0.1,
            testCoverage: 0.1
        };
        
        const metricScore = Object.entries(metricWeights).reduce((sum, [metric, weight]) => {
            const score = metrics[`${metric}Score` as keyof AssetMetrics] as number || 0;
            return sum + score * weight;
        }, 0);
        
        const qualityScore = qualities.reduce((sum, quality) => 
            sum + (this.qualityWeights[quality] || 0), 0) / Object.keys(AssetQuality).length;
        
        return 0.7 * metricScore + 0.3 * qualityScore;
    }

    private analyzeComplexity(assetData: Record<string, any>): number {
        const factors: Record<string, number> = {
            cyclomaticComplexity: 0.3,
            cognitiveComplexity: 0.3,
            dependencyCount: 0.2,
            loc: 0.2
        };
        
        return Object.entries(factors).reduce((total, [factor, weight]) => {
            const value = assetData[factor] || 0;
            return total + this.normalizeComplexityScore(value, factor) * weight;
        }, 0);
    }

    private normalizeComplexityScore(value: number, metricType: string): number {
        const thresholds: Record<string, ComplexityThresholds> = {
            cyclomaticComplexity: { low: 10, high: 30 },
            cognitiveComplexity: { low: 5, high: 20 },
            dependencyCount: { low: 5, high: 15 },
            loc: { low: 100, high: 1000 }
        };
        
        const { low, high } = thresholds[metricType] || { low: 0, high: 100 };
        
        if (value <= low) return 1.0;
        if (value >= high) return 0.0;
        return 1.0 - (value - low) / (high - low);
    }

    private analyzeMaintainability(assetData: Record<string, any>): number {
        return this.normalizeScore(assetData.maintainabilityIndex || 0, 0, 100);
    }

    private analyzePerformance(assetData: Record<string, any>): number {
        return this.normalizeScore(assetData.performanceIndex || 0, 0, 100);
    }

    private analyzeSecurity(assetData: Record<string, any>): number {
        return this.normalizeScore(assetData.securityScore || 0, 0, 100);
    }

    private analyzeCommunity(assetData: Record<string, any>): number {
        return this.normalizeScore(assetData.communityScore || 0, 0, 100);
    }

    private analyzeDocumentation(assetData: Record<string, any>): number {
        return this.normalizeScore(assetData.documentationCoverage || 0, 0, 100);
    }

    private analyzeTestCoverage(assetData: Record<string, any>): number {
        return this.normalizeScore(assetData.testCoverage || 0, 0, 100);
    }

    private getLastUpdate(assetData: Record<string, any>): Date {
        return new Date(assetData.lastUpdated || Date.now());
    }

    private normalizeScore(value: number, min: number, max: number): number {
        return Math.max(0, Math.min(1, (value - min) / (max - min)));
    }
}
