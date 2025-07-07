var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MemoryOptimizer_1;
import { Injectable, Logger } from '@nestjs/common';
let MemoryOptimizer = MemoryOptimizer_1 = class MemoryOptimizer {
    constructor() {
        this.logger = new Logger(MemoryOptimizer_1.name);
        this.maxMemoryUsage = parseInt(process.env.MAX_MEMORY_USAGE || '1000000000'); // 1GB
        this.cleanupThreshold = parseFloat(process.env.CLEANUP_THRESHOLD || '0.8');
        this.config = {
            dimensions: 1536,
            maxSize: 10000,
            minSimilarity: 0.7,
            pruningThreshold: 0.5,
            embeddingModel: 'text-embedding-ada-002',
            cacheTTL: 3600,
            clusteringEnabled: true,
            persistenceEnabled: true,
            compressionEnabled: true,
        };
    }
    async optimizeMemory(items, clusters) {
        const startTime = Date.now();
        this.logger.log(`Starting memory optimization for ${items.length} items and ${clusters.length} clusters`);
        try {
            const memoryStats = await this.getMemoryStats(items, clusters);
            if (memoryStats.memoryUsage < this.maxMemoryUsage * this.cleanupThreshold) {
                this.logger.debug('Memory usage below threshold, no optimization needed');
                return {
                    prunedItems: [],
                    consolidatedClusters: [],
                    performanceMetrics: {
                        timeTaken: Date.now() - startTime,
                        memoryReduced: 0,
                        qualityScore: 1.0,
                        itemsProcessed: 0,
                        clustersOptimized: 0,
                    },
                };
            }
            const prunedItems = await this.pruneItems(items);
            const consolidatedClusters = await this.consolidateClusters(clusters);
            const optimizationResult = {
                prunedItems,
                consolidatedClusters,
                performanceMetrics: {
                    timeTaken: Date.now() - startTime,
                    memoryReduced: this.calculateMemoryReduction(prunedItems, consolidatedClusters),
                    qualityScore: this.calculateQualityScore(consolidatedClusters),
                    itemsProcessed: prunedItems.length,
                    clustersOptimized: consolidatedClusters.length,
                },
            };
            this.logger.log(`Memory optimization completed in ${optimizationResult.performanceMetrics.timeTaken}ms`);
            return optimizationResult;
        }
        catch (error) {
            this.logger.error('Memory optimization failed:', error);
            throw error;
        }
    }
    async getMemoryStats(items, clusters) {
        const totalItems = items.length;
        const totalClusters = clusters.length;
        const averageImportance = items.reduce((sum, item) => sum + item.importance, 0) / totalItems;
        const memoryUsage = this.estimateMemoryUsage(items, clusters);
        const recentAccesses = items.filter(item => item.lastAccessTime && item.lastAccessTime > Date.now() - 86400000 // 24 hours
        ).length;
        const clusterDistribution = {};
        clusters.forEach(cluster => {
            clusterDistribution[cluster.id] = cluster.items.length;
        });
        const allTags = items.flatMap(item => item.tags || []);
        const tagCounts = allTags.reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {});
        const topTags = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));
        return {
            totalItems,
            totalClusters,
            averageImportance,
            memoryUsage,
            clusterDistribution,
            recentAccesses,
            hitRatio: 0.85, // Placeholder
            averageResponseTime: 50, // Placeholder
            topTags,
        };
    }
    async pruneItems(items) {
        const prunedItems = [];
        const currentTime = Date.now();
        for (const item of items) {
            let shouldPrune = false;
            // Prune based on low importance
            if (item.importance < this.config.pruningThreshold) {
                shouldPrune = true;
            }
            // Prune based on age and access patterns
            const age = currentTime - item.timestamp;
            const daysSinceLastAccess = item.lastAccessTime
                ? (currentTime - item.lastAccessTime) / (1000 * 60 * 60 * 24)
                : age / (1000 * 60 * 60 * 24);
            if (daysSinceLastAccess > 30 && item.importance < 0.7) {
                shouldPrune = true;
            }
            // Prune items with very low access count
            if ((item.accessCount || 0) < 2 && item.importance < 0.6) {
                shouldPrune = true;
            }
            if (shouldPrune) {
                prunedItems.push(item);
            }
        }
        this.logger.debug(`Pruned ${prunedItems.length} items out of ${items.length}`);
        return prunedItems;
    }
    async consolidateClusters(clusters) {
        const consolidatedClusters = [];
        const currentTime = Date.now();
        for (let i = 0; i < clusters.length; i++) {
            const cluster = clusters[i];
            // Skip if cluster is too small
            if (cluster.items.length < 2) {
                consolidatedClusters.push(cluster);
                continue;
            }
            // Find similar clusters to merge
            const similarClusters = clusters.slice(i + 1).filter(otherCluster => this.calculateClusterSimilarity(cluster, otherCluster) > 0.85);
            if (similarClusters.length > 0) {
                // Merge clusters
                const mergedCluster = {
                    id: cluster.id,
                    centroid: this.calculateMergedCentroid(cluster, similarClusters),
                    items: [
                        ...cluster.items,
                        ...similarClusters.flatMap(c => c.items)
                    ],
                    label: cluster.label,
                    metadata: { ...cluster.metadata, merged: true },
                    parentClusterId: cluster.parentClusterId,
                    childClusterIds: [
                        ...cluster.childClusterIds,
                        ...similarClusters.flatMap(c => c.childClusterIds)
                    ],
                    quality: this.calculateClusterQuality(cluster.items),
                    size: cluster.items.length + similarClusters.reduce((sum, c) => sum + c.items.length, 0),
                    createdAt: cluster.createdAt,
                    updatedAt: currentTime,
                };
                consolidatedClusters.push(mergedCluster);
                // Remove merged clusters from consideration
                similarClusters.forEach(sc => {
                    const index = clusters.findIndex(c => c.id === sc.id);
                    if (index > -1) {
                        clusters.splice(index, 1);
                    }
                });
            }
            else {
                consolidatedClusters.push(cluster);
            }
        }
        this.logger.debug(`Consolidated ${clusters.length} clusters into ${consolidatedClusters.length}`);
        return consolidatedClusters;
    }
    calculateClusterSimilarity(cluster1, cluster2) {
        // Calculate cosine similarity between cluster centroids
        const dotProduct = cluster1.centroid.reduce((sum, val, i) => sum + val * cluster2.centroid[i], 0);
        const magnitude1 = Math.sqrt(cluster1.centroid.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(cluster2.centroid.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (magnitude1 * magnitude2);
    }
    calculateMergedCentroid(cluster, similarClusters) {
        const allCentroids = [cluster.centroid, ...similarClusters.map(c => c.centroid)];
        const dimensions = cluster.centroid.length;
        const merged = new Float32Array(dimensions);
        for (let i = 0; i < dimensions; i++) {
            merged[i] = allCentroids.reduce((sum, centroid) => sum + centroid[i], 0) / allCentroids.length;
        }
        return merged;
    }
    calculateClusterQuality(items) {
        if (items.length < 2)
            return 1.0;
        // Calculate average intra-cluster similarity
        let totalSimilarity = 0;
        let comparisons = 0;
        for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
                const similarity = this.calculateCosineSimilarity(items[i].embedding, items[j].embedding);
                totalSimilarity += similarity;
                comparisons++;
            }
        }
        return comparisons > 0 ? totalSimilarity / comparisons : 1.0;
    }
    calculateCosineSimilarity(vec1, vec2) {
        const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
        const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (magnitude1 * magnitude2);
    }
    estimateMemoryUsage(items, clusters) {
        // Rough estimation: each item takes about 2KB, each cluster about 1KB
        const itemsMemory = items.length * 2048;
        const clustersMemory = clusters.length * 1024;
        return itemsMemory + clustersMemory;
    }
    calculateMemoryReduction(prunedItems, consolidatedClusters) {
        // Estimate memory reduction from pruning and consolidation
        const itemsReduction = prunedItems.length * 2048;
        const clustersReduction = consolidatedClusters.length * 1024;
        return itemsReduction + clustersReduction;
    }
    calculateQualityScore(clusters) {
        if (clusters.length === 0)
            return 1.0;
        const totalQuality = clusters.reduce((sum, cluster) => sum + cluster.quality, 0);
        return totalQuality / clusters.length;
    }
    async getMemoryUsage() {
        return {
            estimatedUsage: 0, // Would implement actual memory monitoring
            maxUsage: this.maxMemoryUsage,
            threshold: this.maxMemoryUsage * this.cleanupThreshold,
        };
    }
    async shouldOptimize(items, clusters) {
        const memoryStats = await this.getMemoryStats(items, clusters);
        return memoryStats.memoryUsage >= this.maxMemoryUsage * this.cleanupThreshold;
    }
};
MemoryOptimizer = MemoryOptimizer_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], MemoryOptimizer);
export { MemoryOptimizer };
