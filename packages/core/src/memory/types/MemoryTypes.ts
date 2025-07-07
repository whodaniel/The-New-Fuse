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
  confidence: number;
  tags: string[];
}

export enum VectorMemoryEventType {
  ITEM_ADDED = 'ITEM_ADDED',
  ITEM_UPDATED = 'ITEM_UPDATED',
  ITEM_REMOVED = 'ITEM_REMOVED',
  CACHE_HIT = 'CACHE_HIT',
  CACHE_MISS = 'CACHE_MISS',
  CACHE_CLEARED = 'CACHE_CLEARED'
}

export interface VectorSimilarityOptions {
  threshold?: number;
  maxResults?: number;
  sortBy?: 'similarity' | 'timestamp' | 'importance';
}

export interface VectorMemoryEvent {
  type: VectorMemoryEventType;
  item?: VectorMemoryItem;
  metadata?: Record<string, unknown>;
  timestamp: number;
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

export interface VectorSearchResult<T = any> {
  item: VectorMemoryItem<T>;
  similarity: number;
  confidence: number;
}

export interface VectorMemoryCache {
  set(id: string, item: VectorMemoryItem, ttl?: number): Promise<void>;
  get(id: string): Promise<VectorMemoryItem | null>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
  has(id: string): Promise<boolean>;
  size(): Promise<number>;
}

export interface VectorMemoryOptions {
  config?: Partial<VectorMemoryConfig>;
  clusterConfig?: Partial<VectorClusterConfig>;
  cache?: VectorMemoryCache;
  eventHandlers?: ((event: VectorMemoryEvent) => void)[];
}

export interface VectorClusterConfig {
  minClusterSize: number;
  maxClusters: number;
  minSimilarity: number;
  updateInterval: number;
}