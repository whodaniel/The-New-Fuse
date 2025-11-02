export type EmbeddingFunction = (text: string) => Promise<number[]>;

export interface VectorDocument {
  id?: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface VectorQuery {
  namespace?: string;
  filter?: Record<string, any>;
  limit?: number;
  includeVectors?: boolean;
  includeMetadata?: boolean;
}

export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface VectorStoreProvider {
  name: string;
  storeVectors: (documents: VectorDocument[], namespace: string) => Promise<string[]>;
  search: (queryEmbedding: number[], options: VectorQuery) => Promise<SearchResult[]>;
  deleteVectors: (ids: string[], namespace: string) => Promise<boolean>;
  clearNamespace: (namespace: string) => Promise<boolean>;
}

export interface VectorStoreConfig {
  provider: string;
  endpoint?: string;
  apiKey?: string;
  namespace: string;
  embeddingModel?: string;
  dimensions?: number;
}
