/**
 * API utilities
 */

/**
 * Format error response consistent with API standards
 */
export function formatError(error: Error | string): {
  success: boolean;
  error: string;
  stack?: string;
} {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;
  
  return {
    success: false,
    error: message,
    ...(stack ? { stack } : {})
  };
}

/**
 * Format success response consistent with API standards
 */
export function formatSuccess<T>(data: T, meta?: Record<string, unknown>): {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
} {
  return {
    success: true,
    data,
    ...(meta ? { meta } : {})
  };
}