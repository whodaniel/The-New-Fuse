import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, GrpcService } from '@nestjs/microservices';
import { VectorDatabaseService } from '../vector-database.service';
import { OpenAIEmbeddingProvider } from '../drivers/openai-embedding.provider';
import type { Metadata, ServerUnaryCall } from '@grpc/grpc-js';

// Proto message interfaces (will be generated)
interface CreateCollectionRequest {
  name: string;
  dimension: number;
  metric: "cosine" | "euclidean" | "dot_product";
  config: { [key: string]: string };
}

interface CreateCollectionResponse {
  success: boolean;
  message: string;
}

interface VectorDocument {
  id: string;
  content: string;
  metadata: any;
  embedding: number[];
}

interface UpsertDocumentsRequest {
  collection: string;
  documents: VectorDocument[];
  generateEmbeddings: boolean;
}

interface UpsertDocumentsResponse {
  success: boolean;
  message: string;
  documentsProcessed: number;
}

interface GetDocumentRequest {
  collection: string;
  id: string;
}

interface GetDocumentResponse {
  document: VectorDocument;
  found: boolean;
}

interface SimilaritySearchRequest {
  collection: string;
  embedding?: number[];
  text?: string;
  limit: number;
  threshold: number;
  metadataFilter?: any;
}

interface SearchResult {
  id: string;
  content: string;
  metadata: any;
  score: number;
  distance: number;
}

interface SimilaritySearchResponse {
  results: SearchResult[];
}

interface HealthCheckResponse {
  healthy: boolean;
  status: string;
  details: { [key: string]: string };
}

interface GetStatsRequest {
  collection?: string;
}

interface GetStatsResponse {
  stats: any;
}

@Controller()
@GrpcService()
export class VectorStoreGrpcController {
  private readonly logger = new Logger(VectorStoreGrpcController.name);

  constructor(
    private readonly vectorService: VectorDatabaseService,
    private readonly embeddingProvider: OpenAIEmbeddingProvider,
  ) {}

  @GrpcMethod('VectorStoreService', 'CreateCollection')
  async createCollection(
    request: CreateCollectionRequest,
    _metadata: Metadata,
    _call: ServerUnaryCall<CreateCollectionRequest, CreateCollectionResponse>,
  ): Promise<CreateCollectionResponse> {
    try {
      this.logger.log(`Creating collection: ${request.name}`);
      
      await this.vectorService.createCollection({
        name: request.name,
        dimension: request.dimension,
        metric: (request.metric as "cosine" | "euclidean" | "dot_product") || 'cosine',
        // config: request.config || {}, // Removed, not in CollectionConfig type
      });

      return {
        success: true,
        message: `Collection "${request.name}" created successfully`,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to create collection: ${error.message}`, error.stack);
        return {
          success: false,
          message: error.message,
        };
      } else {
        this.logger.error(`Failed to create collection: ${String(error)}`);
        return {
          success: false,
          message: String(error),
        };
      }
    }
  }

  @GrpcMethod('VectorStoreService', 'UpsertDocuments')
  async upsertDocuments(
    request: UpsertDocumentsRequest,
    _metadata: Metadata,
    _call: ServerUnaryCall<UpsertDocumentsRequest, UpsertDocumentsResponse>,
  ): Promise<UpsertDocumentsResponse> {
    try {
      this.logger.log(`Upserting ${request.documents.length} documents to collection: ${request.collection}`);
      
      let documents = request.documents;

      // Generate embeddings if requested and not provided
      if (request.generateEmbeddings) {
        documents = await Promise.all(
          request.documents.map(async (doc) => {
            if (!doc.embedding || doc.embedding.length === 0) {
              const embedding = await this.embeddingProvider.generateEmbedding(doc.content);
              return { ...doc, embedding };
            }
            return doc;
          }),
        );
      }

      await this.vectorService.addDocuments(request.collection, documents);

      return {
        success: true,
        message: `Successfully upserted ${documents.length} documents`,
        documentsProcessed: documents.length,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to upsert documents: ${error.message}`, error.stack);
        return {
          success: false,
          message: error.message,
          documentsProcessed: 0,
        };
      } else {
        this.logger.error(`Failed to upsert documents: ${String(error)}`);
        return {
          success: false,
          message: String(error),
          documentsProcessed: 0,
        };
      }
    }
  }

  @GrpcMethod('VectorStoreService', 'GetDocument')
  async getDocument(
    request: GetDocumentRequest,
    _metadata: Metadata,
    _call: ServerUnaryCall<GetDocumentRequest, GetDocumentResponse>,
  ): Promise<GetDocumentResponse> {
    try {
      const document = await this.vectorService.getDocument(request.collection, request.id);
      
      if (document) {
        return {
          document: {
            ...document,
            metadata: document.metadata || {},
            embedding: document.embedding ?? [],
          },
          found: true,
        };
      } else {
        return {
          document: {} as VectorDocument,
          found: false,
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get document: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Failed to get document: ${String(error)}`);
      }
      return {
        document: {} as VectorDocument,
        found: false,
      };
    }
  }

  @GrpcMethod('VectorStoreService', 'SimilaritySearch')
  async similaritySearch(
    request: SimilaritySearchRequest,
    _metadata: Metadata,
    _call: ServerUnaryCall<SimilaritySearchRequest, SimilaritySearchResponse>,
  ): Promise<SimilaritySearchResponse> {
    try {
      let embedding = request.embedding;

      // Generate embedding from text if provided
      if (request.text && (!embedding || embedding.length === 0)) {
        embedding = await this.embeddingProvider.generateEmbedding(request.text);
      }

      if (!embedding || embedding.length === 0) {
        throw new Error('Either embedding or text must be provided for similarity search');
      }

      const results = await this.vectorService.searchByEmbedding(
        request.collection,
        embedding,
        {
          limit: request.limit || 10,
          threshold: request.threshold || 0.0,
          metadata_filter: request.metadataFilter,
        }
      );

      return {
        results: results.map((result: any) => ({
          id: result.id,
          content: result.content,
          metadata: result.metadata || {},
          score: result.score,
          distance: result.distance,
        })),
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to perform similarity search: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Failed to perform similarity search: ${String(error)}`);
      }
      return {
        results: [],
      };
    }
  }

  @GrpcMethod('VectorStoreService', 'HealthCheck')
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const isHealthy = await this.vectorService.isHealthy();
      
      return {
        healthy: isHealthy,
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          service: 'vector-store',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Health check failed: ${error.message}`, error.stack);
        return {
          healthy: false,
          status: 'error',
          details: {
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        };
      } else {
        this.logger.error(`Health check failed: ${String(error)}`);
        return {
          healthy: false,
          status: 'error',
          details: {
            error: String(error),
            timestamp: new Date().toISOString(),
          },
        };
      }
    }
  }

  @GrpcMethod('VectorStoreService', 'GetStats')
  async getStats(
    request: GetStatsRequest,
    _metadata: Metadata,
    _call: ServerUnaryCall<GetStatsRequest, GetStatsResponse>,
  ): Promise<GetStatsResponse> {
    try {
      const stats = await this.vectorService.getStats(request.collection);
      
      return {
        stats,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to get stats: ${error.message}`, error.stack);
        return {
          stats: {
            error: error.message,
          },
        };
      } else {
        this.logger.error(`Failed to get stats: ${String(error)}`);
        return {
          stats: {
            error: String(error),
          },
        };
      }
    }
  }

  @GrpcMethod('VectorStoreService', 'ListCollections')
  async listCollections(): Promise<{ collections: string[] }> {
    try {
      const collections = await this.vectorService.listCollections();
      return { collections };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to list collections: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Failed to list collections: ${String(error)}`);
      }
      return { collections: [] };
    }
  }

  @GrpcMethod('VectorStoreService', 'DeleteCollection')
  async deleteCollection(
    request: { name: string },
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.vectorService.deleteCollection(request.name);
      return {
        success: true,
        message: `Collection "${request.name}" deleted successfully`,
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to delete collection: ${error.message}`, error.stack);
        return {
          success: false,
          message: error.message,
        };
      } else {
        this.logger.error(`Failed to delete collection: ${String(error)}`);
        return {
          success: false,
          message: String(error),
        };
      }
    }
  }
}