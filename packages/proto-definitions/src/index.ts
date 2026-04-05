// Export generated proto files
export * from './generated/vector_store_pb';
export * from './generated/vector_store_grpc_pb';

// Re-export common gRPC types for convenience
// @ts-ignore
export { credentials, Metadata } from '@grpc/grpc-js';
// @ts-ignore
export type { ClientReadableStream } from '@grpc/grpc-js';

// Type helpers for better developer experience
export type { VectorStoreServiceClient } from './generated/vector_store_grpc_pb';

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
