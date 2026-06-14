// Copyright (c) The New Fuse Project
// Simple graph implementation since graphlib import was corrupted
class Graph {
    constructor() {
        this.edges = new Map();
    }
    setEdge(sourceId, targetId, label) {
        if (!this.edges.has(sourceId)) {
            this.edges.set(sourceId, new Map());
        }
        this.edges.get(sourceId).set(targetId, label);
    }
    getEdge(sourceId, targetId) {
        return this.edges.get(sourceId)?.get(targetId);
    }
    removeEdge(sourceId, targetId) {
        this.edges.get(sourceId)?.delete(targetId);
    }
    getSuccessors(nodeId) {
        return Array.from(this.edges.get(nodeId)?.keys() || []);
    }
}
export class AssetRegistry {
    constructor() {
        this.assets = new Map();
        this.relationships = new Graph();
    }
    async registerAsset(assetId, classification, sourceInfo) {
        const timestamp = new Date();
        const assetEntry = {
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
    async getAsset(assetId) {
        return this.assets.get(assetId);
    }
    async updateAsset(assetId, updates) {
        const asset = this.assets.get(assetId);
        if (asset) {
            Object.assign(asset, updates);
            asset.lastEvaluated = new Date();
        }
    }
    async listAssets() {
        return Array.from(this.assets.values());
    }
    async addRelationship(sourceId, targetId, relationshipType) {
        this.relationships.setEdge(sourceId, targetId, relationshipType);
    }
    async getRelatedAssets(assetId) {
        return this.relationships.getSuccessors(assetId);
    }
    async searchAssets(criteria) {
        const results = [];
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
    async getUsageMetrics(assetId) {
        return this.assets.get(assetId)?.usageMetrics;
    }
    async incrementUsage(assetId, wasSuccessful = true) {
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
//# sourceMappingURL=assetRegistry.js.map