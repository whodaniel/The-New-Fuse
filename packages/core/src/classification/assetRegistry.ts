// Copyright (c) The New Fuse Project

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

// Simple graph implementation since graphlib import was corrupted
class Graph {
  private edges: Map<string, Map<string, string>> = new Map();

  setEdge(sourceId: string, targetId: string, label: string): void {
    if (!this.edges.has(sourceId)) {
      this.edges.set(sourceId, new Map());
    }
    this.edges.get(sourceId)!.set(targetId, label);
  }

  getEdge(sourceId: string, targetId: string): string | undefined {
    return this.edges.get(sourceId)?.get(targetId);
  }

  removeEdge(sourceId: string, targetId: string): void {
    this.edges.get(sourceId)?.delete(targetId);
  }

  getSuccessors(nodeId: string): string[] {
    return Array.from(this.edges.get(nodeId)?.keys() || []);
  }
}

export class AssetRegistry {
  private assets: Map<string, AssetEntry> = new Map();
  private relationships: Graph = new Graph();

  async registerAsset(
    assetId: string,
    classification: Classification,
    sourceInfo: SourceInfo,
  ): Promise<void> {
    const timestamp = new Date();
    const assetEntry: AssetEntry = {
      id: assetId,
      classification,
      source: sourceInfo,
      registrationDate: timestamp,
      lastEvaluated: timestamp,
      integrationStatus: 'pending',
      versionHistory: [],
      relatedAssets: [],
      usageMetrics: {
        integrationCount: 0,
        referenceCount: 0,
        successRate: 0,
      },
    };
    this.assets.set(assetId, assetEntry);
  }

  async getAsset(assetId: string): Promise<AssetEntry | undefined> {
    return this.assets.get(assetId);
  }

  async updateAsset(assetId: string, updates: Partial<AssetEntry>): Promise<void> {
    const asset = this.assets.get(assetId);
    if (asset) {
      Object.assign(asset, updates);
      asset.lastEvaluated = new Date();
    }
  }

  async listAssets(): Promise<AssetEntry[]> {
    return Array.from(this.assets.values());
  }

  async addRelationship(
    sourceId: string,
    targetId: string,
    relationshipType: string,
  ): Promise<void> {
    this.relationships.setEdge(sourceId, targetId, relationshipType);
  }

  async getRelatedAssets(assetId: string): Promise<string[]> {
    return this.relationships.getSuccessors(assetId);
  }

  async searchAssets(criteria: { category?: string; quality?: string }): Promise<AssetEntry[]> {
    const results: AssetEntry[] = [];
    for (const asset of this.assets.values()) {
      let matches = true;

      if (criteria.category && asset.classification.category !== criteria.category) {
        matches = false;
      }

      if (criteria.quality && !asset.classification.qualities?.includes(criteria.quality)) {
        matches = false;
      }

      if (matches) {
        results.push(asset);
      }
    }

    return results;
  }

  async getUsageMetrics(assetId: string): Promise<UsageMetrics | undefined> {
    return this.assets.get(assetId)?.usageMetrics;
  }

  async incrementUsage(assetId: string, wasSuccessful: boolean = true): Promise<void> {
    const asset = this.assets.get(assetId);
    if (asset) {
      asset.usageMetrics.integrationCount++;
      if (wasSuccessful) {
        asset.usageMetrics.referenceCount++;
      }

      const total = asset.usageMetrics.integrationCount;
      const successful = asset.usageMetrics.referenceCount;
      asset.usageMetrics.successRate = total > 0 ? successful / total : 0;
    }
  }
}
