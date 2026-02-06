// Export generated proto files
export * from './generated/vector_store_grpc_pb';
export * from './generated/vector_store_pb';

// Re-export common gRPC types for convenience
export { Metadata, credentials } from '@grpc/grpc-js';
export type { ClientReadableStream } from '@grpc/grpc-js';

// Type helpers for better developer experience
export type { VectorStoreServiceClient } from './generated/vector_store_grpc_pb';

// Proto message type exports for type safety
export type {
  CreateCollectionRequest,
  CreateCollectionResponse,
  GetStatsResponse,
  HealthCheckResponse,
  SearchResult,
  SimilaritySearchRequest,
  SimilaritySearchResponse,
  UpsertDocumentsRequest,
  UpsertDocumentsResponse,
  VectorDocument,
} from './generated/vector_store_pb';
