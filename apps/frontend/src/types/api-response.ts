export interface ApiResponseMetadata {
  timestamp?: string;
  requestId?: string;
  version?: string;
}

export interface ApiError {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}

/**
 * Frontend-safe response wrapper aligned with TNF's standardized API envelope.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string | ApiError;
  metadata?: ApiResponseMetadata;
}
