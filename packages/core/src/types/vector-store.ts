export interface VectorMetadata {
  // Implementation needed
}
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorStore {
  // Implementation needed
}
  addVectors(vectors: VectorMetadata[]): Promise<void>;
  searchVectors(query: number[], k: number): Promise<VectorMetadata[]>;
  deleteVectors(ids: string[]): Promise<void>;
}

export interface VectorStoreConfig {
  // Implementation needed
}
  dimension: number;
  similarity: 'cosine' | 'euclidean' | 'dotProduct';
  indexType: 'hnsw' | 'flat';
  maxElements?: number;
  efConstruction?: number;
  mLinks?: number;
}