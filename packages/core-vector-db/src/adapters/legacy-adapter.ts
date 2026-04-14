import type {
  VectorDocument,
  VectorQuery,
  VectorSearchResult,
} from '../interface/vector-database.interface.js';
import type { VectorDatabaseService } from '../vector-database.service.js';

// Legacy types from packages/core
interface LegacyVectorDocument {
  id?: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

interface LegacyVectorQuery {
  namespace?: string;
  filter?: Record<string, any>;
  limit?: number;
  includeVectors?: boolean;
  includeMetadata?: boolean;
}

interface LegacySearchResult {
  id: string;
  score: number;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

// Legacy provider interface from packages/core
interface LegacyVectorStoreProvider {
  name: string;
  storeVectors: (documents: LegacyVectorDocument[], namespace: string) => Promise<string[]>;
  search: (queryEmbedding: number[], options: LegacyVectorQuery) => Promise<LegacySearchResult[]>;
  deleteVectors: (ids: string[], namespace: string) => Promise<boolean>;
  clearNamespace: (namespace: string) => Promise<boolean>;
}

/**
 * Legacy Adapter for Core Vector Database Service
 *
 * This adapter provides backward compatibility with the existing vector database
 * implementations in packages/core while using the new core-vector-db service.
 */
export class LegacyVectorAdapter implements LegacyVectorStoreProvider {
  public readonly name = 'CoreVectorDBAdapter';

  constructor(
    private readonly vectorService: VectorDatabaseService,
    private readonly defaultCollection: string = 'default'
  ) {}

  /**
   * Store vectors using legacy interface
   */
  async storeVectors(documents: LegacyVectorDocument[], namespace: string): Promise<string[]> {
    const collectionName = namespace || this.defaultCollection;

    // Ensure collection exists
    const exists = await this.vectorService.collectionExists(collectionName);
    if (!exists) {
      await this.vectorService.createCollection({
        name: collectionName,
        dimension: 1536, // Default OpenAI embedding dimension
        metric: 'cosine',
        description: `Legacy collection for namespace: ${namespace}`,
      });
    }

    // Convert legacy documents to new format
    const convertedDocuments: VectorDocument[] = documents.map((doc) => ({
      id: doc.id || this.generateId(),
      content: doc.content,
      metadata: doc.metadata,
      embedding: doc.embedding,
    }));

    await this.vectorService.addDocuments(collectionName, convertedDocuments);

    return convertedDocuments.map((doc) => doc.id);
  }

  /**
   * Search vectors using legacy interface
   */
  async search(
    queryEmbedding: number[],
    options: LegacyVectorQuery
  ): Promise<LegacySearchResult[]> {
    const collectionName = options.namespace || this.defaultCollection;

    const query: VectorQuery = {
      embedding: queryEmbedding,
      limit: options.limit || 10,
      threshold: 0.7,
      metadata_filter: options.filter,
    };

    const results = await this.vectorService.searchByEmbedding(
      collectionName,
      queryEmbedding,
      query
    );

    // Convert to legacy format
    return results.map((result) => ({
      id: result.id,
      score: result.score,
      content: result.content,
      metadata: result.metadata || {},
      embedding:
        options.includeVectors && 'embedding' in result ? (result as any).embedding : undefined,
    }));
  }

  /**
   * Delete vectors using legacy interface
   */
  async deleteVectors(ids: string[], namespace: string): Promise<boolean> {
    try {
      const collectionName = namespace || this.defaultCollection;
      await this.vectorService.batchDeleteDocuments(collectionName, ids);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear namespace (delete entire collection)
   */
  async clearNamespace(namespace: string): Promise<boolean> {
    try {
      const collectionName = namespace || this.defaultCollection;
      await this.vectorService.deleteCollection(collectionName);
      return true;
    } catch {
      return false;
    }
  }

  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function to create legacy adapter
 */
export function createLegacyAdapter(
  vectorService: VectorDatabaseService,
  defaultCollection: string = 'default'
): LegacyVectorStoreProvider {
  return new LegacyVectorAdapter(vectorService, defaultCollection);
}

/**
 * Utility functions for type conversion between legacy and new formats
 */
export class TypeConverter {
  /**
   * Convert legacy VectorDocument to new format
   */
  static legacyToNew(legacy: LegacyVectorDocument): VectorDocument {
    return {
      id: legacy.id || TypeConverter.generateId(),
      content: legacy.content,
      metadata: legacy.metadata,
      embedding: legacy.embedding,
    };
  }

  /**
   * Convert new VectorDocument to legacy format
   */
  static newToLegacy(doc: VectorDocument): LegacyVectorDocument {
    return {
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata,
      embedding: doc.embedding,
    };
  }

  /**
   * Convert legacy search result to new format
   */
  static legacySearchToNew(legacy: LegacySearchResult): VectorSearchResult {
    return {
      id: legacy.id,
      content: legacy.content,
      metadata: legacy.metadata,
      score: legacy.score,
      distance: 1 - legacy.score, // Convert score to distance
    };
  }

  /**
   * Convert new search result to legacy format
   */
  static newSearchToLegacy(result: VectorSearchResult): LegacySearchResult {
    return {
      id: result.id,
      content: result.content,
      metadata: result.metadata || {},
      score: result.score,
      embedding: undefined, // Legacy format doesn't include embeddings by default
    };
  }

  private static generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
