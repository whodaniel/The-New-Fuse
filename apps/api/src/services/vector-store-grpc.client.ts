// @ts-nocheck
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { credentials } from '@grpc/grpc-js';
import { promisify } from 'util';
import { join } from 'path';

// Import generated proto types (these will be generated from the proto files)
// gRPC service client interface with callback-style methods
interface VectorStoreServiceClient {
  createCollection: (request: any, callback: (error: Error | null, response: any) => void) => void;
  upsertDocuments: (request: any, callback: (error: Error | null, response: any) => void) => void;
  getDocument: (request: any, callback: (error: Error | null, response: any) => void) => void;
  similaritySearch: (request: any, callback: (error: Error | null, response: any) => void) => void;
  healthCheck: (request: any, callback: (error: Error | null, response: any) => void) => void;
  getStats: (request: any, callback: (error: Error | null, response: any) => void) => void;
  listCollections: (request: any, callback: (error: Error | null, response: any) => void) => void;
  deleteCollection: (request: any, callback: (error: Error | null, response: any) => void) => void;
}

// Type helper for promisified gRPC methods
type PromisifiedGrpcMethod<TRequest, TResponse> = (request: TRequest) => Promise<TResponse>;

@Injectable()
export class VectorStoreGrpcClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VectorStoreGrpcClient.name);
  private client!: VectorStoreServiceClient;
  private readonly grpcUrl: string;

  constructor() {
    this.grpcUrl = process.env.VECTOR_DB_GRPC_URL || 'localhost:50051';
  }

  async onModuleInit() {
    try {
      // Dynamic import of gRPC client (will be generated from proto)
      const grpc = require('@grpc/grpc-js');
      const protoLoader = require('@grpc/proto-loader');
      
      const protoPath = join(__dirname, '../../../proto-definitions/proto/vector_store.proto');
      
      const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });
      
      const vectorStoreProto = grpc.loadPackageDefinition(packageDefinition).vectorstore.v1;
      
      this.client = new vectorStoreProto.VectorStoreService(
        this.grpcUrl,
        credentials.createInsecure(), // Use SSL in production
        {
          'grpc.keepalive_time_ms': 120000,
          'grpc.keepalive_timeout_ms': 5000,
          'grpc.keepalive_permit_without_calls': true,
          'grpc.http2.max_pings_without_data': 0,
          'grpc.http2.min_time_between_pings_ms': 10000,
          'grpc.http2.min_ping_interval_without_data_ms': 300000,
        }
      );

      this.logger.log(`Connected to Vector Store gRPC service at ${this.grpcUrl}`);
    } catch (error) {
      this.logger.error('Failed to initialize gRPC client:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      // Close gRPC client connection
      this.logger.log('Closing Vector Store gRPC client connection');
    }
  }

  // Collection Management
  async createCollection(request: {
    name: string;
    dimension: number;
    metric?: string;
    config?: { [key: string]: string };
  }): Promise<{ success: boolean; message: string }> {
    const createCollection = promisify(this.client.createCollection.bind(this.client)) as (request: any) => Promise<{ success: boolean; message: string }>;
    
    try {
      const response = await createCollection({
        name: request.name,
        dimension: request.dimension,
        metric: request.metric || 'cosine',
        config: request.config || {},
      });
      
      return response;
    } catch (error) {
      this.logger.error(`Failed to create collection ${request.name}:`, error);
      throw error;
    }
  }

  async deleteCollection(name: string): Promise<{ success: boolean; message: string }> {
    const deleteCollection = promisify(this.client.deleteCollection.bind(this.client)) as (request: any) => Promise<{ success: boolean; message: string }>;
    
    try {
      const response = await deleteCollection({ name });
      return response;
    } catch (error) {
      this.logger.error(`Failed to delete collection ${name}:`, error);
      throw error;
    }
  }

  async listCollections(): Promise<{ collections: string[] }> {
    const listCollections = promisify(this.client.listCollections.bind(this.client)) as (request: any) => Promise<{ collections: string[] }>;
    
    try {
      const response = await listCollections({});
      return response;
    } catch (error) {
      this.logger.error('Failed to list collections:', error);
      throw error;
    }
  }

  // Document Operations
  async upsertDocuments(request: {
    collection: string;
    documents: Array<{
      id: string;
      content: string;
      metadata?: any;
      embedding?: number[];
    }>;
    generateEmbeddings?: boolean;
  }): Promise<{ success: boolean; message: string; documentsProcessed: number }> {
    const upsertDocuments = promisify(this.client.upsertDocuments.bind(this.client)) as (request: any) => Promise<{ success: boolean; message: string; documentsProcessed: number }>;
    
    try {
      const response = await upsertDocuments({
        collection: request.collection,
        documents: request.documents,
        generateEmbeddings: request.generateEmbeddings || false,
      });
      
      return response;
    } catch (error) {
      this.logger.error(`Failed to upsert documents in collection ${request.collection}:`, error);
      throw error;
    }
  }

  async getDocument(collection: string, id: string): Promise<{
    document?: {
      id: string;
      content: string;
      metadata?: any;
      embedding?: number[];
    };
    found: boolean;
  }> {
    const getDocument = promisify(this.client.getDocument.bind(this.client)) as (request: any) => Promise<{ document?: { id: string; content: string; metadata?: any; embedding?: number[] }; found: boolean }>;
    
    try {
      const response = await getDocument({ collection, id });
      return response;
    } catch (error) {
      this.logger.error(`Failed to get document ${id} from collection ${collection}:`, error);
      throw error;
    }
  }

  // Search Operations
  async similaritySearch(request: {
    collection: string;
    embedding?: number[];
    text?: string;
    limit?: number;
    threshold?: number;
    metadataFilter?: any;
  }): Promise<{
    results: Array<{
      id: string;
      content: string;
      metadata?: any;
      score: number;
      distance: number;
    }>;
  }> {
    const similaritySearch = promisify(this.client.similaritySearch.bind(this.client)) as (request: any) => Promise<{ results: Array<{ id: string; content: string; metadata?: any; score: number; distance: number }> }>;
    
    try {
      const response = await similaritySearch({
        collection: request.collection,
        embedding: request.embedding,
        text: request.text,
        limit: request.limit || 10,
        threshold: request.threshold || 0.0,
        metadataFilter: request.metadataFilter,
      });
      
      return response;
    } catch (error) {
      this.logger.error(`Failed to perform similarity search in collection ${request.collection}:`, error);
      throw error;
    }
  }

  // Health and Stats
  async healthCheck(): Promise<{
    healthy: boolean;
    status: string;
    details: { [key: string]: string };
  }> {
    const healthCheck = promisify(this.client.healthCheck.bind(this.client)) as (request: any) => Promise<{ healthy: boolean; status: string; details: { [key: string]: string } }>;
    
    try {
      const response = await healthCheck({});
      return response;
    } catch (error) {
      this.logger.error('Failed to perform health check:', error);
      throw error;
    }
  }

  async getStats(collection?: string): Promise<{ stats: any }> {
    const getStats = promisify(this.client.getStats.bind(this.client)) as (request: any) => Promise<{ stats: any }>;
    
    try {
      const response = await getStats({ collection });
      return response;
    } catch (error) {
      this.logger.error('Failed to get stats:', error);
      throw error;
    }
  }

  // Convenience methods with better error handling
  async searchByText(
    collection: string,
    text: string,
    options: {
      limit?: number;
      threshold?: number;
      metadataFilter?: any;
    } = {}
  ): Promise<Array<{
    id: string;
    content: string;
    metadata?: any;
    score: number;
  }>> {
    const response = await this.similaritySearch({
      collection,
      text,
      limit: options.limit || 10,
      threshold: options.threshold || 0.0,
      metadataFilter: options.metadataFilter,
    });
    
    return response.results;
  }

  async searchByEmbedding(
    collection: string,
    embedding: number[],
    options: {
      limit?: number;
      threshold?: number;
      metadataFilter?: any;
    } = {}
  ): Promise<Array<{
    id: string;
    content: string;
    metadata?: any;
    score: number;
  }>> {
    const response = await this.similaritySearch({
      collection,
      embedding,
      limit: options.limit || 10,
      threshold: options.threshold || 0.0,
      metadataFilter: options.metadataFilter,
    });
    
    return response.results;
  }

  async addDocuments(
    collection: string,
    documents: Array<{
      id: string;
      content: string;
      metadata?: any;
      embedding?: number[];
    }>,
    generateEmbeddings = true
  ): Promise<number> {
    const response = await this.upsertDocuments({
      collection,
      documents,
      generateEmbeddings,
    });
    
    if (!response.success) {
      throw new Error(`Failed to add documents: ${response.message}`);
    }
    
    return response.documentsProcessed;
  }
}