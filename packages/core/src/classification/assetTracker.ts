// Copyright (c) The New Fuse Project

interface Context {
  contextType: string;
  dependencies?: Set<string>;
}

interface AssetData {
  firstSeen: Date;
  usageCount: number;
  contexts: Set<string>;
  performanceMetrics: any[];
  dependencies: Set<string>;
}

interface UsagePattern {
  usageType: string;
  contextType: string;
  timestamp: Date;
  success?: boolean;
}

export class AssetTracker {
  private trackedAssets: Map<string, AssetData> = new Map();
  private usagePatterns: Map<string, UsagePattern[]> = new Map();

  async trackAssetUsage(assetId: string, usageType: string, context: Context): Promise<void> {
    if (!this.trackedAssets.has(assetId)) {
      this.trackedAssets.set(assetId, {
        firstSeen: new Date(),
        usageCount: 0,
        contexts: new Set(),
        performanceMetrics: [],
        dependencies: context.dependencies || new Set(),
      });
    }

    const assetData = this.trackedAssets.get(assetId)!;
    assetData.usageCount++;
    assetData.contexts.add(context.contextType);
    this.updateUsagePatterns(assetId, usageType, context);
  }

  private updateUsagePatterns(assetId: string, usageType: string, context: Context): void {
    const pattern: UsagePattern = {
      usageType,
      contextType: context.contextType,
      timestamp: new Date(),
    };

    if (!this.usagePatterns.has(assetId)) {
      this.usagePatterns.set(assetId, []);
    }
    this.usagePatterns.get(assetId)!.push(pattern);
  }

  async getAssetAnalysis(assetId: string): Promise<any> {
    if (!this.trackedAssets.has(assetId)) {
      return { error: 'Asset not found' };
    }

    const assetData = this.trackedAssets.get(assetId)!;
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
    let trend: string;

    if (c > b && b > a) {
      trend = 'improving';
    } else if (c < b && b < a) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    const analysis = {
      usageCount: assetData.usageCount,
      contexts: Array.from(assetData.contexts),
      trend,
      dependencies: Array.from(assetData.dependencies),
      recommendations: [] as string[],
    };

    if (assetData.usageCount > 100) {
      analysis.recommendations.push('High usage asset - consider optimization');
    }

    if (assetData.contexts.size > 5) {
      analysis.recommendations.push('Widely used across contexts - ensure stability');
    }

    if (assetData.dependencies.size > 10) {
      analysis.recommendations.push(
        'Consider simplifying integrations due to high number of dependencies'
      );
    }

    return analysis;
  }

  async getUsageStats(assetId: string): Promise<{
    totalUsage: number;
    contexts: string[];
    lastUsed: Date | null;
  }> {
    const assetData = this.trackedAssets.get(assetId);
    const patterns = this.usagePatterns.get(assetId) || [];

    if (!assetData) {
      return {
        totalUsage: 0,
        contexts: [],
        lastUsed: null,
      };
    }

    const lastUsed =
      patterns.length > 0 ? patterns[patterns.length - 1].timestamp : assetData.firstSeen;

    return {
      totalUsage: assetData.usageCount,
      contexts: Array.from(assetData.contexts),
      lastUsed,
    };
  }

  async addPerformanceMetric(assetId: string, metric: any): Promise<void> {
    const assetData = this.trackedAssets.get(assetId);
    if (assetData) {
      assetData.performanceMetrics.push(metric);
    }
  }

  async listTrackedAssets(): Promise<string[]> {
    return Array.from(this.trackedAssets.keys());
  }

  async clearAsset(assetId: string): Promise<void> {
    this.trackedAssets.delete(assetId);
    this.usagePatterns.delete(assetId);
  }
}
