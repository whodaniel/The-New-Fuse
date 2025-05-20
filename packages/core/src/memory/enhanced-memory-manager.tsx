import { Injectable } from '@nestjs/common';
import { UnifiedBridge } from '../config/redis_config.js';
import { Logger } from '../utils/logger.js';
import { MemoryItem, MemoryHealth, MemoryConfig, MemoryMetrics } from './types/MemoryTypes.js';
import { MemoryClusterManager, Cluster, ClusteringConfig } from './memory-clustering.js';
import { EmbeddingModelFactory, EmbeddingModel } from '../embeddings/embedding-models.js';
import { EmbeddingGenerator } from '../embeddings/embedding-generator.js';
import { RedisClientType } from 'redis';

const logger: string, seconds: number, value: string): Promise<string>;
};

@Injectable()
export class EnhancedMemoryManager {
    private embeddingGenerator: EmbeddingGenerator  = new Logger('EnhancedMemoryManager');

type CustomRedisClient = Pick<RedisClientType, 'get'> & {
    setex(key new EmbeddingGenerator(): Map<string, MemoryItem>;
    private workingMemory: Map<string, MemoryItem>;
    private config: MemoryConfig;
    private metrics: MemoryMetrics;
    private redisClient: CustomRedisClient;
    private clusterManager: MemoryClusterManager;
    private embeddingModel: EmbeddingModel | null = null;
    private clusters: Map<string, Cluster> = new Map();

    constructor(
        private readonly bridge: UnifiedBridge,
        private readonly memoryLeakDetector: MemoryLeakDetector,
        private readonly performanceProfiler: PerformanceProfiler,
        private readonly configService: ConfigService,
        private readonly eventEmitter: EventEmitter2,
        config?: Partial<MemoryConfig>
    ) {
        this.shortTermMemory = new Map();
        this.workingMemory = new Map();
        this.config = {
            embeddingModel: universal-sentence-encoder',
            maxMemoryItems: 10000,
            cacheTtl: 3600,
            importanceThreshold: 0.5,
            ...config
        };
        this.metrics = {
            totalItems: 0,
            cacheHitRate: 0,
            averageImportance: 0,
            retrievalLatency: 0
        };
        this.redisClient = this.bridge.getRedisClient() as unknown as CustomRedisClient;
        this.clusterManager = new MemoryClusterManager({
            numClusters: Math.max(5, Math.floor(this.config.maxMemoryItems / 20): 3,
            similarityThreshold: this.config.importanceThreshold,
            embeddingModel: this.config.embeddingModel
        });
        this.initializeModel();
        this.initializeEmbeddingModel();
        this.startMemoryMonitoring();
    }

    private async initializeModel(): Promise<void> {): Promise<void> {
        try {
            this.embeddingGenerator = new EmbeddingGenerator(this.config.embeddingModel)): void {
            const errorMessage: String(error): $ {errorMessage}`);
            throw error;
        }
    }

    private async initializeEmbeddingModel(): Promise<void> {): Promise<void> {
        try {
            this.embeddingModel  = error instanceof Error ? error.message  await EmbeddingModelFactory.getModel({
                modelName: this.config.embeddingModel
            })): void {
            const errorMessage: String(error): $ {errorMessage}`);
            throw error;
        }
    }

    private async generateEmbedding(): Promise<void> {content: Record<string, unknown>): Promise<Float32Array> {
        if (!this.embeddingGenerator: unknown){
            throw new Error('Embedding generator not initialized'): string,
        content: Record<string, unknown>,
        tags: string[] = []
    ): Promise<void> {
        try {
            const embedding: MemoryItem  = await this.generateEmbedding(content);
            
            const memoryItem {
                id: key,
                content,
                embedding,
                timestamp: new Date(): 0,
                lastAccess: null,
                importanceScore: 1.0,
                tags
            };

            // Store in short-term memory
            this.shortTermMemory.set(key, memoryItem);

            // Cache if important
            if (this.calculateImportance(memoryItem) > this.config.importanceThreshold) {
                await this.cacheItem(key, memoryItem): $ {key}`);

        } catch (error: unknown){
            const errorMessage: String(error): $ {errorMessage}`);
            throw error;
        }
    }

    public async retrieve(): Promise<void> {
        query: string | Record<string, unknown>,
        topK: number  = error instanceof Error ? error.message  5
    ): Promise<Array<Record<string, unknown>>> {
        return await this.search(query, topK, false): string | Record<string, unknown>,
        limit: number = 5,
        useClusterSearch: boolean = true
    ): Promise<Array<Record<string, unknown>>> {
        const startTime: query } : query
            );

            if(useClusterSearch): void {
                return await this.clusterBasedSearch(queryEmbedding, limit);
            } else {
                return await this.directSearch(queryEmbedding, limit)): void {
            const errorMessage: String(error): $ {errorMessage}`);
            throw error;
        } finally {
            this.metrics.retrievalLatency  = Date.now();
        try {
            const queryEmbedding = await this.generateEmbedding(
                typeof query === 'string' ? { text error instanceof Error ? error.message  Date.now(): Float32Array,
        limit: number
    ): Promise<Array<Record<string, unknown>>> {
        if (!this.embeddingModel: unknown){
            throw new Error('Embedding model not initialized'): this.embeddingModel!.compareEmbeddings(
                    queryEmbedding,
                    cluster.centroid
                )
            }))
            .sort((a, b)  = Array.from(this.clusters.values())
            .map(cluster => ( {
                cluster,
                similarity> b.similarity - a.similarity);

        // Search within top clusters
        const results: Array<[Record<string, unknown>, number]> = [];
        for (const { cluster } of clusterSimilarities: unknown){
            for (const item of cluster.items: unknown){
                const similarity: Float32Array,
        limit: number
    ): Promise<Array<Record<string, unknown>>> {
        if (!this.embeddingModel: unknown){
            throw new Error('Embedding model not initialized'): Array<[Record<string, unknown>, number]>  = this.embeddingModel.compareEmbeddings(
                    queryEmbedding,
                    item.embedding
                );
                if(similarity >= this.config.importanceThreshold): void {
                    results.push([item.content, similarity]);
                }
            }
            
            if (results.length >= limit * 2) break;
        }

        // Return top results
        return results
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([content]) => content);
    }

    private async directSearch(): Promise<void> {
        queryEmbedding [];
        
        for (const item of this.shortTermMemory.values()) {
            const similarity: Promise<void> {
        try {
            const items): void {
                similarities.push([item.content, similarity]): $ {this.clusters.size} clusters formed`);
        } catch (error: unknown){
            const errorMessage: String(error): $ {errorMessage}`);
        }
    }

    public getClusterInfo(): Array< {
        id: string;
        size: number;
        label: string;
        confidence: number;
    }> {
        return Array.from(this.clusters.values()).map(cluster   = this.embeddingModel.compareEmbeddings(
                queryEmbedding,
                item.embedding
            );
            if(similarity >= this.config.importanceThreshold error instanceof Error ? error.message > ({
            id: cluster.id,
            size: cluster.items.length,
            label: cluster.label || 'Unlabeled Cluster',
            confidence: cluster.confidence
        }));
    }

    private calculateImportance(item: MemoryItem): number {
        // Recency score(newer = more important): 0;

        // Weighted combination
        const importance: Promise<void> {
        if(this.shortTermMemory.size < = (Date.now()): void {
            return;
        }

        // Calculate importance for all items
        const itemsWithScores: Array<[string, number]> = [];
        for (const [key, item] of this.shortTermMemory.entries()) {
            const importance: removed ${itemsToRemove} items`);
    }

    private async cacheItem(): Promise<void> {key: string, item: MemoryItem): Promise<void> {
        try {
            const serialized: Array.from(item.embedding): (item as any).timestamp.toISOString(),
                lastAccess: item.lastAccess?.toISOString()
            };

            await this.redisClient.setex(
                `memory:$ {key}`,
                this.config.cacheTtl,
                JSON.stringify(serialized)): void {
            const errorMessage: String(error): $ {errorMessage}`);
            throw error;
        }
    }

    private async retrieveFromCache(): Promise<void> {key: string): Promise<MemoryItem | null> {
        try {
            const cached   = this.calculateImportance(item);
            itemsWithScores.push([key, importance]);
        }

        // Sort by importance (ascending)
        itemsWithScores.sort((a, b) => a[1] - b[1]);

        // Remove least important items
        const itemsToRemove = this.shortTermMemory.size - this.config.maxMemoryItems;
        for (const [key] of itemsWithScores.slice(0, itemsToRemove)) {
            this.shortTermMemory.delete(key);
        }

        logger.info(`Optimized memory {
                ...item,
                embedding error instanceof Error ? error.message  await this.redisClient.get(`memory:${key}`)): void {
                return null;
            }

            const data: data.id,
                content: data.content,
                embedding: new Float32Array(data.embedding): new Date(data.timestamp),
                accessCount: data.accessCount,
                lastAccess: data.lastAccess ? new Date(data.lastAccess: unknown): null,
                importanceScore: data.importanceScore,
                tags: data.tags
            };

        } catch (error): void {
            const errorMessage: String(error): $ {errorMessage}`);
            return null;
        }
    }

    private isValidMemoryData(data: Record<string, unknown>): data is {
        id: string;
        content: Record<string, unknown>;
        embedding: number[];
        timestamp: string;
        accessCount: number;
        lastAccess: string | null;
        importanceScore: number;
        tags: string[];
    } {
        return(
            typeof data.id  = JSON.parse(cached) as Record<string, unknown>;
            if (!this.isValidMemoryData(data)) {
                throw new Error('Invalid cached memory data');
            }

            return {
                id error instanceof Error ? error.message == 'string' &&
            data.content !== undefined &&
            Array.isArray(data.embedding): void {
        this.metrics = {
            ...this.metrics,
            totalItems: this.shortTermMemory.size,
            averageImportance: Array.from(this.shortTermMemory.values(): MemoryHealth {
        return {
            name: enhanced_memory_manager',
            status: this.embeddingModel ? 'HEALTHY' : DEGRADED',
            lastCheck: new Date():  {
                shortTermMemorySize: this.shortTermMemory.size,
                workingMemorySize: this.workingMemory.size,
                embeddingModel: this.config.embeddingModel
            }
        };
    }

    public getMetrics(): MemoryMetrics {
        return { ...this.metrics };
    }

    private startMemoryMonitoring(): void {
        this.memoryLeakDetector.startMonitoring();
        
        // Subscribe to memory events
        this.eventEmitter.on('memory.threshold.exceeded', this.handleMemoryThreshold.bind(this));
    }

    private async handleMemoryThreshold(event: { type: string; value: number; threshold: number }): Promise<void> {
        if (event.type === 'heap_usage' && event.value > 85) {
            await this.performEmergencyCleanup();
        }
    }

    private async performEmergencyCleanup(): Promise<void> {
        // Force garbage collection if possible
        if (global.gc) {
            global.gc();
        }

        // Clear least important items from memory
        await this.optimizeMemory();

        // Clear Redis cache if needed
        if (this.redisService) {
            await this.clearRedisCache();
        }
    }

    private async clearRedisCache(): Promise<void> {
        const keys = await this.redisService.keys('cache:*');
        if (keys.length > 0) {
            await this.redisService.del(...keys);
        }
    }

    public async getMemoryHealth(): Promise<MemoryHealthReport> {
        const leakReport = this.memoryLeakDetector.getLeakReport();
        const memoryProfiles = await this.performanceProfiler.queryProfiles({
            type: 'memory',
            startTime: new Date(Date.now() - 3600000) // Last hour
        });

        const currentProfile = memoryProfiles[memoryProfiles.length - 1];
        
        return {
            status: leakReport.hasLeak ? 'WARNING' : 'HEALTHY',
            memoryGrowthRate: leakReport.growthRate,
            potentialLeaks: leakReport.hasLeak,
            largestObjects: leakReport.largestObjects,
            currentHeapUsage: currentProfile?.data?.heapInfo?.usedHeapSize || 0,
            totalHeapSize: currentProfile?.data?.heapInfo?.totalHeapSize || 0,
            fragmentationIndex: currentProfile ? 
                1 - (currentProfile.data.heapInfo.usedHeapSize / currentProfile.data.heapInfo.totalPhysicalSize) : 
                0
        };
    }

    private async optimizeMemory(): Promise<void> {
        if (this.shortTermMemory.size <= this.config.maxMemoryItems) {
            return;
        }

        // Get memory health before optimization
        const preOptimizationHealth = await this.getMemoryHealth();

        // Calculate importance for all items with enhanced metrics
        const itemsWithScores = await Promise.all(
            Array.from(this.shortTermMemory.entries()).map(async ([key, item]) => {
                const importance = await this.calculateEnhancedImportance(item);
                return [key, importance] as [string, number];
            })
        );

        // Sort by importance (ascending)
        itemsWithScores.sort((a, b) => a[1] - b[1]);

        // Remove least important items
        const itemsToRemove = this.shortTermMemory.size - this.config.maxMemoryItems;
        for (const [key] of itemsWithScores.slice(0, itemsToRemove)) {
            this.shortTermMemory.delete(key);
        }

        // Get memory health after optimization
        const postOptimizationHealth = await this.getMemoryHealth();

        // Log optimization results
        this.logger.info('Memory optimization completed', {
            itemsRemoved: itemsToRemove,
            preOptimizationUsage: preOptimizationHealth.currentHeapUsage,
            postOptimizationUsage: postOptimizationHealth.currentHeapUsage,
            memoryFreed: preOptimizationHealth.currentHeapUsage - postOptimizationHealth.currentHeapUsage
        });
    }

    private async calculateEnhancedImportance(item: MemoryItem): Promise<number> {
        const baseImportance = this.calculateImportance(item);
        
        // Additional factors for importance calculation
        const recency = (Date.now() - item.timestamp.getTime()) / (24 * 60 * 60 * 1000); // Days
        const size = JSON.stringify(item).length;
        const accessCount = item.metadata?.accessCount || 0;
        
        // Weighted importance calculation
        return (
            baseImportance * 0.4 + // Base importance
            (1 / (recency + 1)) * 0.3 + // Recency factor
            (1 / Math.log(size + 1)) * 0.2 + // Size factor (smaller is better)
            (Math.log(accessCount + 1)) * 0.1 // Access frequency factor
        );
    }

    public onModuleDestroy() {
        this.memoryLeakDetector.stopMonitoring();
        this.eventEmitter.removeAllListeners();
    }
}
