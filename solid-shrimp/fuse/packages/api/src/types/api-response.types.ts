/**
 * Standard API response types
 * Used for consistent API responses across the application
 */

/**
 * API error information
 */
export interface ApiError {
  message: string;
  details?: string;
  code?: string;
}

/**
 * Standard API response format
 * All API responses follow this structure for consistency
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
}