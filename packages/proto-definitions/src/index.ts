// Export generated proto files
export * from './generated/vector_store_pb';
export * from './generated/vector_store_grpc_pb';

// Re-export common gRPC types for convenience
export { credentials, Metadata, ClientReadableStream } from '@grpc/grpc-js';

// Type helpers for better developer experience
export type VectorStoreServiceClient = import('./generated/vector_store_grpc_pb').VectorStoreServiceClient;

// Proto message type exports for type safety
export type {
  CreateCollectionRequest,
  CreateCollectionResponse,
  VectorDocument,
  UpsertDocumentsRequest,
  UpsertDocumentsResponse,
  SimilaritySearchRequest,
  SimilaritySearchResponse,
  SearchResult,
  HealthCheckResponse,
  GetStatsResponse
} from './generated/vector_store_pb';