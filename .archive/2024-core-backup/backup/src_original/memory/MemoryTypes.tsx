export type Vector = Float32Array;

export interface MemoryItem {
  id: string;
  content: string;
  embedding: Vector;
  timestamp: number;
  importance: number;
  metadata: Record<string, unknown>;
  clusterId?: string;
}

export interface Cluster {
  id: string;
  centroid: Vector;
  items: MemoryItem[];
  label: string;
  metadata: Record<string, unknown>;
  parentClusterId?: string;
  childClusterIds: string[];
}

export interface VectorMemoryConfig {
  dimensions: number;
  maxSize: number;
  minSimilarity: number;
  pruningThreshold: number;
  embeddingModel: string;
  cacheTTL: number;
}

export interface MemoryStats {
  totalItems: number;
  totalClusters: number;
  averageImportance: number;
  memoryUsage: number;
  clusterDistribution: Record<string, number>;
  recentAccesses: number;
}

export interface SearchResult {
  item: MemoryItem;
  similarity: number;
  cluster?: Cluster;
}

export interface ClusteringResult {
  clusters: Cluster[];
  itemAssignments: Map<string, string>;
  quality: number;
}

export interface OptimizationResult {
  prunedItems: MemoryItem[];
  consolidatedClusters: Cluster[];
  performanceMetrics: {
    timeTaken: number;
    memoryReduced: number;
    qualityScore: number;
  };
}
