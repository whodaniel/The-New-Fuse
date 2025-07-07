import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VectorMemoryCache } from './cache/VectorMemoryCache';
import { MemoryCache } from './cache/MemoryCache';
import { AdvancedClustering, ClusteringResult } from './clustering/AdvancedClustering';
import { MemoryItem, Vector, SearchResult, MemoryQuery } from './MemoryTypes';
export interface MemoryContent {
    text: string;
    type: 'conversation' | 'context' | 'knowledge' | 'temp' | 'working';
    metadata?: Record<string, any>;
    embedding?: Vector;
    importance?: number;
    tags?: string[];
}
export interface MemoryManagerConfig {
    shortTermCapacity: number;
    workingMemoryCapacity: number;
    longTermRetentionDays: number;
    compressionThreshold: number;
    embeddingDimension: number;
    clusteringEnabled: boolean;
    autoOptimize: boolean;
}
export interface MemoryStats {
    totalItems: number;
    shortTermItems: number;
    longTermItems: number;
    workingMemoryItems: number;
    memoryUsage: string;
    compressionRatio: number;
    clusteringMetrics?: ClusteringResult;
}
export declare class EnhancedMemoryManager implements OnModuleDestroy {
    private readonly configService;
    private readonly eventEmitter;
    private readonly vectorCache;
    private readonly memoryCache;
    private readonly clustering;
    private readonly logger;
    private readonly config;
    private optimizationInterval;
    private memoryLeakDetector;
    constructor(configService: ConfigService, eventEmitter: EventEmitter2, vectorCache: VectorMemoryCache, memoryCache: MemoryCache, clustering: AdvancedClustering);
    storeMemory(item: Omit<MemoryItem, 'id' | 'timestamp' | 'lastAccessed' | 'lastAccessTime' | 'accessCount' | 'clusterId'>): Promise<string>;
    retrieveMemory(id: string): Promise<MemoryItem | null>;
    searchMemory(query: MemoryQuery): Promise<SearchResult[]>;
    compressMemory(): Promise<void>;
    optimizeMemory(): Promise<void>;
    getMemoryStats(): Promise<MemoryStats>;
    deleteMemory(id: string): Promise<boolean>;
    clearMemory(type?: string): Promise<void>;
    onModuleDestroy(): void;
    private storeInWorkingMemory;
    private storeInShortTermMemory;
    private storeInLongTermMemory;
    private calculateRelevanceScore;
    private identifyCompressionCandidates;
    private compressClusteredMemories;
    private compressOldMemories;
    private cleanupExpiredMemories;
    private optimizeCacheStructures;
    private rebalanceMemoryDistribution;
    private getWorkingMemoryCount;
    private calculateCompressionRatio;
    private getClusteringMetrics;
    private clearMemoryByType;
    private initializeOptimization;
    private initializeMemoryLeakDetection;
    private generateId;
}
//# sourceMappingURL=enhanced-memory-manager.d.ts.map