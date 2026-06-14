// Copyright (c) The New Fuse Project
export class AssetTracker {
    constructor() {
        this.trackedAssets = new Map();
        this.usagePatterns = new Map();
    }
    async trackAssetUsage(assetId, usageType, context) {
        if (!this.trackedAssets.has(assetId)) {
            this.trackedAssets.set(assetId, {
                firstSeen: new Date(),
                usageCount: 0,
                contexts: new Set(),
                performanceMetrics: [],
                dependencies: context.dependencies || new Set(),
            });
        }
        const assetData = this.trackedAssets.get(assetId);
        assetData.usageCount++;
        assetData.contexts.add(context.contextType);
        this.updateUsagePatterns(assetId, usageType, context);
    }
    updateUsagePatterns(assetId, usageType, context) {
        const pattern = {
            usageType,
            contextType: context.contextType,
            timestamp: new Date(),
        };
        if (!this.usagePatterns.has(assetId)) {
            this.usagePatterns.set(assetId, []);
        }
        this.usagePatterns.get(assetId).push(pattern);
    }
    async getAssetAnalysis(assetId) {
        if (!this.trackedAssets.has(assetId)) {
            return { error: 'Asset not found' };
        }
        const assetData = this.trackedAssets.get(assetId);
        const metrics = assetData.performanceMetrics;
        if (metrics.length === 0) {
            return { error: 'No metrics available' };
        }
        const recentThreeMetrics = metrics.slice(-3);
        const values = recentThreeMetrics
            .map((m) => (typeof m === 'number' ? m : m.value))
            .filter((v) => typeof v === 'number');
        if (values.length < 3) {
            return { trend: 'insufficient_data' };
        }
        const [a, b, c] = values;
        let trend;
        if (c > b && b > a) {
            trend = 'improving';
        }
        else if (c < b && b < a) {
            trend = 'declining';
        }
        else {
            trend = 'stable';
        }
        const analysis = {
            usageCount: assetData.usageCount,
            contexts: Array.from(assetData.contexts),
            trend,
            dependencies: Array.from(assetData.dependencies),
            recommendations: [],
        };
        if (assetData.usageCount > 100) {
            analysis.recommendations.push('High usage asset - consider optimization');
        }
        if (assetData.contexts.size > 5) {
            analysis.recommendations.push('Widely used across contexts - ensure stability');
        }
        if (assetData.dependencies.size > 10) {
            analysis.recommendations.push('Consider simplifying integrations due to high number of dependencies');
        }
        return analysis;
    }
    async getUsageStats(assetId) {
        const assetData = this.trackedAssets.get(assetId);
        const patterns = this.usagePatterns.get(assetId) || [];
        if (!assetData) {
            return {
                totalUsage: 0,
                contexts: [],
                lastUsed: null,
            };
        }
        const lastUsed = patterns.length > 0 ? patterns[patterns.length - 1].timestamp : assetData.firstSeen;
        return {
            totalUsage: assetData.usageCount,
            contexts: Array.from(assetData.contexts),
            lastUsed,
        };
    }
    async addPerformanceMetric(assetId, metric) {
        const assetData = this.trackedAssets.get(assetId);
        if (assetData) {
            assetData.performanceMetrics.push(metric);
        }
    }
    async listTrackedAssets() {
        return Array.from(this.trackedAssets.keys());
    }
    async clearAsset(assetId) {
        this.trackedAssets.delete(assetId);
        this.usagePatterns.delete(assetId);
    }
}
//# sourceMappingURL=assetTracker.js.map