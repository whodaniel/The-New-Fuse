export interface VectorMemoryConfig {
    dimensions: number;
    maxSize: number;
    minSimilarity: number;
    pruningThreshold: number;
    embeddingModel: string;
    cacheTTL: number;
}

export interface VectorMemoryItem<T = any> {
    id: string;
    content: T;
    embedding: Float32Array;
    metadata: VectorMemoryMetadata;
    timestamp: number;
}

export interface VectorMemoryMetadata {
    importance: number;
    accessCount: number;
    lastAccess: number;
}

export interface MemoryVector extends Float32Array {
    tags: string[];
    clusters: string[];
    confidence: number;
}

export interface VectorSearchResult<T = any> {
    item: VectorMemoryItem<T>;
    similarity: number;
    confidence: number;
}

export interface VectorMemoryStats {
    totalItems: number;
    avgImportance: number;
    avgConfidence: number;
    clusterCount: number;
    memoryUsage: number;
    cacheHitRate: number;
    retrievalLatency: number;
}

export interface VectorMemoryEvent {
    type: VectorMemoryEventType;
    item?: VectorMemoryItem;
    metadata?: Record<string, unknown>;
    timestamp: number;
}

export enum VectorMemoryEventType {
    ITEM_ADDED = 'ITEM_ADDED',
    ITEM_REMOVED = 'ITEM_REMOVED',
    ITEM_UPDATED = 'ITEM_UPDATED',
    MEMORY_PRUNED = 'MEMORY_PRUNED',
    CLUSTER_UPDATED = 'CLUSTER_UPDATED',
    CACHE_CLEARED = 'CACHE_CLEARED'
}

export interface VectorSimilarityOptions {
    threshold?: number;
    maxResults?: number;
    includeMetadata?: boolean;
    filterTags?: string[];
    sortBy?: similarity' | 'importance' | 'timestamp';
}

export interface VectorClusterConfig {
    minClusterSize: number;
    maxClusters: number;
    minSimilarity: number;
    updateInterval: number;
}

export interface VectorMemoryCache {
    get(key: string): Promise<VectorMemoryItem | null>;
    set(key: string, item: VectorMemoryItem, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    getStats(): Promise< {
        size: number;
        hitRate: number;
        missRate: number;
    }>;
}

export type VectorMemoryEventHandler = (event: VectorMemoryEvent) => void | Promise<void>;

export interface VectorMemoryOptions {
    config: Partial<VectorMemoryConfig>;
    cache?: VectorMemoryCache;
    clusterConfig?: Partial<VectorClusterConfig>;
    eventHandlers?: VectorMemoryEventHandler[];
}

export type Vector = Float32Array;

export interface MemoryHealth {
    name: string;
    status: HEALTHY' | 'DEGRADED' | 'FAILED';
    lastCheck: Date;
    details: {
        shortTermMemorySize: number;
        workingMemorySize: number;
        embeddingModel: string;
    };
}

export interface MemoryConfig {
    embeddingModel: string;
    maxMemoryItems: number;
    cacheTtl: number;
    importanceThreshold: number;
    profilingInterval?: number;
    memoryLimit?: number;
    optimizationThreshold?: number;
}

export interface MemoryMetrics {
    totalItems: number;
    cacheHitRate: number;
    averageImportance: number;
    retrievalLatency: number;
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        arrayBuffers?: number;
    };
    gcMetrics?: {
        collections: number;
        totalPause: number;
        averagePause: number;
    };
}

export interface MemoryHealthReport {
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    memoryGrowthRate: number;
    potentialLeaks: boolean;
    largestObjects: Array<{
        type: string;
        count: number;
    }>;
    currentHeapUsage: number;
    totalHeapSize: number;
    fragmentationIndex: number;
}

export interface MemoryProfile {
    timestamp: Date;
    heapStats: {
        heapSizeLimit: number;
        totalHeapSize: number;
        usedHeapSize: number;
        heapSizeExecutable: number;
        totalPhysicalSize: number;
        totalAvailableSize: number;
        mallocedMemory: number;
        peakMallocedMemory: number;
    };
    gcMetrics?: {
        type: string;
        duration?: number;
    };
    objectCounts: Map<string, number>;
    retainedSize: number;
}

export interface MemoryItem {
    id: string;
    content: Record<string, unknown>;
    embedding: Float32Array;
    timestamp: Date;
    lastAccess: Date | null;
    importanceScore: number;
    metadata?: {
        accessCount: number;
        size: number;
        type: string;
    };
    tags: string[];
}

export interface HeapStatistics {
    heapSizeLimit: number;
    totalHeapSize: number;
    usedHeapSize: number;
    heapSizeExecutable: number;
    totalPhysicalSize: number;
    totalAvailableSize: number;
    mallocedMemory: number;
    peakMallocedMemory: number;
}

export interface MemoryProfile {
    timestamp: Date;
    heapStats: HeapStatistics;
    objectCounts: Map<string, number>;
    retainedSize: number;
}

export interface MemoryThresholdEvent {
    type: 'heap_usage' | 'fragmentation' | 'growth_rate';
    value: number;
    threshold: number;
}

export interface MemoryLeakWarning {
    type: 'memory_leak_warning';
    growthRate: number;
    currentHeapUsed: number;
    currentHeapTotal: number;
    timestamp: Date;
    objectCounts: Record<string, number>;
}

export interface ProfileSummary {
    timeSpan: number;
    memoryGrowth: number;
    averageHeapUsage: number;
    currentHeapUsage: number;
    totalHeapSize: number;
    profileCount: number;
}
