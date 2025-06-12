// Copyright (c) The New Fuse Project

import { Graph } from ''graphlib';
import { AssetQuality, AssetCategory } from './assetClassifier.tsx';

interface Classification {
  qualities?: string[];
  category?: string;
  metrics?: Record<string, number>;
  overallScore?: number;
}

interface SourceInfo {
  [key: string]: unknown;
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
  usageMetrics: {
    integrationCount: number;
    referenceCount: number;
    successRate: number;
  };
}

export class AssetRegistry {
  private assets: Map<string, AssetEntry> = new Map();
  private relationships: Graph = new Graph();

  async registerAsset(
    assetId: string,
    classification: Classification,
    sourceInfo: SourceInfo
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
        successRate: 0.0,
      },
    };
    this.assets.set(assetId, assetEntry);
  }

  async addRelationship(sourceId: string, targetId: string, relationType: string): Promise<void> {
    this.relationships.setEdge(sourceId, targetId, relationType);
    const sourceAsset = this.assets.get(sourceId);
    if (sourceAsset) {
      sourceAsset.relatedAssets.push({
        assetId: targetId,
        relationType,
        timestamp: new Date(),
      });
    }
    const targetAsset = this.assets.get(targetId);
    if (targetAsset) {
      targetAsset.relatedAssets.push({
        assetId: sourceId,
        relationType,
        timestamp: new Date(),
      });
    }
  }
}
