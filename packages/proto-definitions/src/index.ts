// Export generated proto files
export * from './generated/vector_store_grpc_pb';
export * from './generated/vector_store_pb';

// Re-export common gRPC types for convenience
// @ts-ignore
export { Metadata, credentials } from '@grpc/grpc-js';
// @ts-ignore
export type { ClientReadableStream } from '@grpc/grpc-js';

// Type helpers for better developer experience
export type { VectorStoreServiceClient } from './generated/vector_store_grpc_pb';

// Proto message type exports for type safety
// Exported types will be automatically populated from generated files via export * above
// export type {
//   CreateCollectionRequest,
//   CreateCollectionResponse,
//   VectorDocument,
//   UpsertDocumentsRequest,
//   UpsertDocumentsResponse,
//   SimilaritySearchRequest,
//   SimilaritySearchResponse,
//   SearchResult,
//   HealthCheckResponse,
//   GetStatsResponse
// } from './generated/vector_store_pb';
