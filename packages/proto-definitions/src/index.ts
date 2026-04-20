// Export generated proto files
export * from './generated/vector_store_grpc_pb.js';
export * from './generated/vector_store_pb.js';

// Re-export common gRPC types for convenience
export { Metadata, credentials } from '@grpc/grpc-js';
export type { ClientReadableStream } from '@grpc/grpc-js';

// Type helpers for better developer experience
export type { VectorStoreServiceClient } from './generated/vector_store_grpc_pb.js';
