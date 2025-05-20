export interface VectorMetadata {
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorStore {
  addVectors(vectors: VectorMetadata[]): Promise<void>;
  searchVectors(query: number[], k: number): Promise<VectorMetadata[]>;
  deleteVectors(ids: string[]): Promise<void>;
}

export interface VectorStoreConfig {
  dimension: number;
  similarity: 'cosine' | 'euclidean' | 'dotProduct';
  indexType: 'hnsw' | 'flat';
}