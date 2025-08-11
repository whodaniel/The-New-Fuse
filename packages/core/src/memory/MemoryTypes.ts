export type Vector = number[];
export interface MemoryItem {
  // Implementation needed
}
  id: string;
  content: string;
  type: 'conversation' | 'context' | 'knowledge' | 'temp' | 'working';
  embedding: Vector;
  timestamp: number;
  importance: number;
  metadata: Record<string, unknown>;
  clusterId?: string;
  accessCount?: number;
  lastAccessed?: number;
  lastAccessTime?: number;
  tags?: string[];
}

export interface Cluster {
  // Implementation needed
}
  id: string;
  centroid: Vector;
  items: MemoryItem[];
  label: string;
  metadata: Record<string, unknown>;
  parentClusterId?: string;
  childClusterIds: string[];
  quality: number;
  size: number;
  createdAt: number;
  updatedAt: number;
}

export interface VectorMemoryConfig {
  // Implementation needed
}
  dimensions: number;
  maxSize: number;
  minSimilarity: number;
  pruningThreshold: number;
  embeddingModel: string;
  cacheTTL: number;
  clusteringEnabled: boolean;
  persistenceEnabled: boolean;
  compressionEnabled: boolean;
}

export interface MemoryStats {
  // Implementation needed
}
  totalItems: number;
  totalClusters: number;
  averageImportance: number;
  memoryUsage: number;
  clusterDistribution: Record<string, number>;
  recentAccesses: number;
  hitRatio: number;
  averageResponseTime: number;
  topTags: Array<{ tag: string; count: number }>;
}

export interface SearchResult {
  // Implementation needed
}
  item: MemoryItem;
  similarity: number;
  cluster?: Cluster;
  relevanceScore?: number;
}

export interface ClusteringResult {
  // Implementation needed
}
  clusters: Cluster[];
  itemAssignments: Map<string, string>;
  quality: number;
  silhouetteScore: number;
  duration: number;
}

export interface OptimizationResult {
  // Implementation needed
}
  prunedItems: MemoryItem[];
  consolidatedClusters: Cluster[];
  performanceMetrics: {
  // Implementation needed
}
    timeTaken: number;
    memoryReduced: number;
    qualityScore: number;
    itemsProcessed: number;
    clustersOptimized: number;
  };
}

export interface MemoryQuery {
  // Implementation needed
}
  text?: string;
  embedding?: Vector;
  filters?: Record<string, unknown>;
  filterByType?: string;
  limit?: number;
  minSimilarity?: number;
  clusterId?: string;
  tags?: string[];
  dateRange?: {
  // Implementation needed
}
    start: number;
    end: number;
  };
}

export interface MemoryStorageOptions {
  // Implementation needed
}
  compress?: boolean;
  encrypt?: boolean;
  ttl?: number;
  priority?: 'low' | 'normal' | 'high';
}

export interface MemoryLeakInfo {
  // Implementation needed
}
  id: string;
  type: 'memory' | 'file' | 'connection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  timestamp: number;
  size?: number;
  stack?: string;
}

export interface PerformanceMetrics {
  // Implementation needed
}
  operationType: string;
  duration: number;
  memoryUsed: number;
  timestamp: number;
  success: boolean;
  error?: string;
}