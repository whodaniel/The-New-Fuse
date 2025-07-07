// Using native array types for vector operations
type Vector = number[];

export interface MemoryItem {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
  embedding?: number[];
  relevance?: number;
}

export interface MemorySearchResult {
  item: MemoryItem;
  score: number;
}

export interface MemoryCluster {
  id: string;
  centroid: number[];
  items: MemoryItem[];
  metadata: Record<string, unknown>;
}

export interface MemoryStats {
  totalItems: number;
  itemsByType: Record<string, number>;
  averageEmbeddingSize: number;
  clusterCount: number;
}
