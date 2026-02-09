export interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  metadata: Record<string, unknown>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export enum MemoryType {
  EPISODIC = 'episodic',
  SEMANTIC = 'semantic',
  PROCEDURAL = 'procedural'
}

export interface MemoryCluster {
  id: string;
  centroid: number[];
  memories: Memory[];
  metadata: Record<string, unknown>;
}

export interface MemorySearchResult {
  memory: Memory;
  score: number;
}

export interface MemoryStats {
  totalCount: number;
  typeDistribution: Record<MemoryType, number>;
  averageEmbeddingSize: number;
  clusterCount: number;
}
