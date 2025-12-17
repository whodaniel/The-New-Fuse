/**
 * Proto Definitions Package
 *
 * This package contains protocol buffer definitions for The New Fuse services.
 * Generated files will be available after running the proto generation step.
 *
 * For now, we export the base gRPC types and a placeholder structure.
 */

// Re-export common gRPC types for convenience
export { credentials, Metadata } from '@grpc/grpc-js';
export type { ClientReadableStream } from '@grpc/grpc-js';

// TODO: Generate these from proto/vector_store.proto
// Run: npm run generate-proto (to be implemented)

/**
 * Placeholder type definitions until proto generation is set up
 * These match the structure defined in proto/vector_store.proto
 */
export interface VectorDocument {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface CreateCollectionRequest {
  name: string;
  dimension: number;
  metric: string;
  config?: Record<string, string>;
}

export interface CreateCollectionResponse {
  success: boolean;
  message: string;
}

export interface UpsertDocumentsRequest {
  collection: string;
  documents: VectorDocument[];
  generate_embeddings?: boolean;
}

export interface UpsertDocumentsResponse {
  success: boolean;
  message: string;
  documents_processed: number;
}

export interface SimilaritySearchRequest {
  collection: string;
  embedding?: number[];
  text?: string;
  limit: number;
  threshold?: number;
  metadata_filter?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  score: number;
  distance: number;
}

export interface SimilaritySearchResponse {
  results: SearchResult[];
}

export interface HealthCheckResponse {
  healthy: boolean;
  status: string;
  details?: Record<string, string>;
}

export interface GetStatsResponse {
  stats: Record<string, any>;
}
